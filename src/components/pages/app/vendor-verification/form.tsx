"use client";

import { getData, patchData, postData, putData } from "@/api";
import { uploadAttachment } from "@/api/attachments";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useUser from "@/hooks/use-user.hook";
import { cn } from "@/lib/utils";
import { joiResolver } from "@hookform/resolvers/joi";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Save,
  Ticket,
} from "lucide-react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormProvider, Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { StepHeader } from "./fields";
import { schemaFor } from "./schemas";
import { VendorVerificationStatusBadge, writeSnapshot } from "./status";
import CrossBorderStep from "./steps/cross-border-step";
import {
  BusinessStep,
  IdentityStep,
  VendorTypeStep,
} from "./steps/identity-steps";
import PayoutStep from "./steps/payout-step";
import ReviewSummary from "./steps/review-step";
import {
  ApiPayload,
  DEFAULT_VALUES,
  formFromApi,
  SavedPayoutDigits,
  STEP_FIELDS,
  STEP_LABELS,
  toApiPayload,
  VendorVerificationApiResponse,
  VerificationFormValues,
  VerificationStatus,
  VerificationStepKey,
  VendorPlan,
} from "./types";

/** The steps for a plan; free hosting skips the ID, business and bank ones. */
const stepsFor = (
  plan: VendorPlan | "" | null | undefined,
  vendorType?: string | null,
): VerificationStepKey[] =>
  plan === "free"
    ? ["vendorType", "identity", "review"]
    : [
        "vendorType",
        "identity",
        ...(vendorType === "business" ? (["business"] as const) : []),
        "payout",
        "crossBorder",
        "review",
      ];

const FREE_STEP_COPY: Partial<Record<VerificationStepKey, string>> = {
  identity: "Who you are and how we can reach you about your events.",
  review: "Check your details. You can start hosting as soon as you send them.",
};

const STEP_COPY: Record<VerificationStepKey, string> = {
  vendorType:
    "Free events only, or selling tickets? We'll only ask for what that needs.",
  identity:
    "Your legal details, as they appear on your government ID. We check them against the document.",
  business: "The registered company that runs your events.",
  payout:
    "The bank account you'll be paid into. It must be in your name or your business's.",
  crossBorder:
    "Only if you'll sell tickets to events outside the country you're paid in.",
  review: "Check everything before you send it. You can edit any step.",
};

const isFile = (value: unknown): value is File =>
  typeof File !== "undefined" && value instanceof File;

const pick = (payload: ApiPayload, step: VerificationStepKey) =>
  Object.fromEntries(
    STEP_FIELDS[step]
      .filter((key) => payload[key] !== undefined)
      .map((key) => [key, payload[key]]),
  ) as ApiPayload;

const savedDigitsOf = (data?: VendorVerificationApiResponse | null) => ({
  accountNumberLast4: data?.accountNumberLast4 ?? null,
  routingNumberLast4: data?.routingNumberLast4 ?? null,
  sortCodeLast4: data?.sortCodeLast4 ?? null,
  ibanLast4: data?.ibanLast4 ?? null,
});

/** The stepper across the top; steps already reached can be revisited. */
const Stepper: React.FC<{
  steps: VerificationStepKey[];
  current: number;
  furthest: number;
  stepStatuses: Partial<Record<VerificationStepKey, VerificationStatus>>;
  onSelect: (index: number) => void;
}> = ({ steps, current, furthest, stepStatuses, onSelect }) => (
  <nav aria-label="Verification steps" className="overflow-x-auto">
    <ol className="flex min-w-max gap-2 sm:min-w-0">
      {steps.map((step, index) => {
        const status = stepStatuses[step];
        const flagged = status === "needs_more_info" || status === "rejected";
        const done =
          status === "submitted" || status === "approved" || index < current;
        const reachable = index <= furthest;
        return (
          <li key={step} className="flex-1">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onSelect(index)}
              aria-current={index === current ? "step" : undefined}
              className={cn(
                "flex w-full flex-col gap-1.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                index === current
                  ? "border-secondary-400 bg-secondary-50"
                  : "border-secondary-100",
                reachable ? "hover:bg-secondary-50/70" : "opacity-50",
              )}
            >
              <span
                className={cn(
                  "h-1 rounded-full",
                  flagged
                    ? "bg-secondary-400"
                    : done || index === current
                      ? "bg-secondary-400"
                      : "bg-secondary-100",
                )}
              />
              <span className="flex items-center gap-1.5 text-xs font-semibold text-secondary-900">
                {flagged ? (
                  <AlertTriangle className="size-3.5 text-secondary-600" />
                ) : done && index !== current ? (
                  <CheckCircle2 className="size-3.5 text-secondary-500" />
                ) : (
                  <span className="text-secondary-400">{index + 1}</span>
                )}
                {STEP_LABELS[step]}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);

/**
 * Vendor verification, one step at a time. Each step is checked against its own
 * rules and saved as it's left (so an admin can review it); the last step shows
 * everything for a final check before it's sent. Once sent, it's read-only
 * until the admin asks for changes.
 */
export const VendorVerificationForm = memo(function VendorVerificationForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<VerificationStatus>("not_started");
  const [stepStatuses, setStepStatuses] = useState<
    Partial<Record<VerificationStepKey, VerificationStatus>>
  >({});
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedPayoutDigits>({});
  const [current, setCurrent] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [busy, setBusy] = useState<"" | "next" | "draft" | "submit">("");
  // Approved to host free events only, and whether they've chosen to finish
  // verifying to sell tickets.
  const [isFreeHost, setIsFreeHost] = useState(false);
  const [canSell, setCanSell] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const { getUserDetails } = useUser();

  // The resolver reads these at validation time, so it always checks the step
  // on screen with what's already on file.
  const stepRef = useRef<VerificationStepKey>("vendorType");
  const savedRef = useRef<SavedPayoutDigits>({});
  const resolver = useCallback<Resolver<VerificationFormValues>>(
    (values, context, options) =>
      joiResolver(schemaFor(stepRef.current, values, savedRef.current), {
        abortEarly: false,
      })(values, context, options),
    [],
  );
  const form = useForm<VerificationFormValues>({
    defaultValues: DEFAULT_VALUES,
    resolver,
    mode: "onTouched",
  });

  const vendorType = form.watch("vendorType");
  const plan = form.watch("plan");
  const isFree = plan === "free";
  const steps = useMemo<VerificationStepKey[]>(
    () => stepsFor(plan, vendorType),
    [plan, vendorType],
  );
  const step = steps[Math.min(current, steps.length - 1)];
  stepRef.current = step;
  savedRef.current = saved;

  const readOnly =
    status === "submitted" || (status === "approved" && !upgrading);

  const apply = useCallback(
    (data?: VendorVerificationApiResponse | null, resetForm = false) => {
      if (!data) return;
      setStatus(data.status ?? "in_progress");
      setCanSell(!!data.canSellTickets);
      setIsFreeHost(
        !data.canSellTickets && data.approvalLevel === "basic_verified",
      );
      setStepStatuses(data.stepStatuses ?? {});
      setSaved(savedDigitsOf(data));
      setAdminMessage(
        data.status === "needs_more_info"
          ? (data.needsMoreInfoMessage ?? null)
          : data.status === "rejected"
            ? (data.rejectionReason ?? null)
            : null,
      );
      writeSnapshot(data);
      if (resetForm) form.reset(formFromApi(data));
    },
    [form],
  );

  useEffect(() => {
    getData<VendorVerificationApiResponse>("/vendor/verification")
      .then(({ data }) => {
        const verification = data?.data;
        if (!verification) return;
        apply(verification, true);
        // Start where there's something to do: a step the admin flagged, or
        // the first one not yet sent.
        const order = stepsFor(verification.plan, verification.vendorType);
        const statuses = verification.stepStatuses ?? {};
        const flagged = order.findIndex((key) =>
          ["needs_more_info", "rejected"].includes(statuses[key] ?? ""),
        );
        const unsent = order.findIndex(
          (key) =>
            key !== "crossBorder" &&
            !["submitted", "approved"].includes(statuses[key] ?? ""),
        );
        const start =
          flagged >= 0 ? flagged : unsent >= 0 ? unsent : order.length - 1;
        setCurrent(start);
        setFurthest(Math.max(start, unsent >= 0 ? unsent : order.length - 1));
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, [apply]);

  /** New files become attachments; ones already on the application stay as they are. */
  const uploadDocuments = async (values: VerificationFormValues) => {
    const ids: { idDocument?: string; supportingDocument?: string } = {};
    if (isFile(values.idDocument)) {
      ids.idDocument = (
        await uploadAttachment(values.idDocument, "ID_DOCUMENT")
      ).id;
    }
    if (values.hostsAbroad && isFile(values.supportingDocument)) {
      ids.supportingDocument = (
        await uploadAttachment(values.supportingDocument, "SUPPORTING_DOCUMENT")
      ).id;
    }
    return ids;
  };

  /** After a save: files are now on the application and bank numbers on file. */
  const afterSave = (data?: VendorVerificationApiResponse | null) => {
    apply(data);
    const values = form.getValues();
    form.reset(
      {
        ...values,
        idDocument: data?.idDocumentDetails ?? values.idDocument,
        supportingDocument:
          data?.supportingDocumentDetails ??
          (isFile(values.supportingDocument)
            ? null
            : values.supportingDocument),
        accountNumber: "",
        routingNumber: "",
        sortCode: "",
        iban: "",
      },
      { keepDefaultValues: true },
    );
  };

  const goTo = (index: number) => {
    form.clearErrors();
    setCurrent(index);
    setFurthest((value) => Math.max(value, index));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveStep = async (values: VerificationFormValues) => {
    const payload = toApiPayload(values, await uploadDocuments(values));
    // Free hosting's details are checked together when it's sent, not as a
    // full identity step, so they're saved as a draft.
    if (values.plan === "free" && step === "identity") {
      const { data } = await putData<ApiPayload, VendorVerificationApiResponse>(
        "/vendor/verification",
        pick(payload, step),
      );
      afterSave(data?.data);
      return;
    }
    // Not hosting abroad: just clear anything saved for it before; there's
    // nothing for an admin to review.
    if (step === "crossBorder" && !values.hostsAbroad) {
      const { data } = await putData<ApiPayload, VendorVerificationApiResponse>(
        "/vendor/verification",
        { crossBorderCountries: [] },
      );
      afterSave(data?.data);
      return;
    }
    const { data } = await patchData<
      { fields: ApiPayload; status: "submitted" },
      VendorVerificationApiResponse
    >(`/vendor/verification/steps/${step}/submit`, {
      fields: pick(payload, step),
      status: "submitted",
    });
    afterSave(data?.data);
  };

  const onContinue = form.handleSubmit(
    async (values) => {
      setBusy("next");
      try {
        await saveStep(values);
        goTo(current + 1);
      } catch (error) {
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            `Couldn't save ${STEP_LABELS[step].toLowerCase()}`,
          ),
        );
      } finally {
        setBusy("");
      }
    },
    () => toast.error("Check the highlighted fields"),
  );

  const onSubmitAll = form.handleSubmit(
    async (values) => {
      setBusy("submit");
      try {
        // Submitting checks what's saved, so the whole form is saved first.
        const { data: draft } = await putData<
          ApiPayload,
          VendorVerificationApiResponse
        >(
          "/vendor/verification",
          toApiPayload(values, await uploadDocuments(values)),
        );
        afterSave(draft?.data);
        const { data } = await postData<
          undefined,
          VendorVerificationApiResponse
        >("/vendor/verification/submit");
        apply(data?.data);
        setUpgrading(false);
        // Approved free hosts are vendors now: bring in the host tools.
        if (data?.data?.status === "approved") void getUserDetails();
        toast.success(
          data?.data?.status === "approved"
            ? "You're all set to host free events."
            : "Sent for review. We'll let you know the outcome.",
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Couldn't send your verification",
          ),
        );
      } finally {
        setBusy("");
      }
    },
    () => toast.error("Confirm your details are accurate to submit"),
  );

  /** Takes a sent application back to edit, before it's been decided. */
  const onWithdraw = async () => {
    setWithdrawing(true);
    try {
      const { data } = await postData<undefined, VendorVerificationApiResponse>(
        "/vendor/verification/withdraw",
      );
      apply(data?.data);
      setConfirmWithdraw(false);
      goTo(0);
      toast.success("Taken back. Make your changes and send it again.");
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't take your application back",
        ),
      );
    } finally {
      setWithdrawing(false);
    }
  };

  const onSaveDraft = async () => {
    setBusy("draft");
    try {
      const values = form.getValues();
      const { data } = await putData<ApiPayload, VendorVerificationApiResponse>(
        "/vendor/verification",
        toApiPayload(values, await uploadDocuments(values)),
      );
      afterSave(data?.data);
      toast.success("Draft saved. You can come back to it any time.");
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't save your draft",
        ),
      );
    } finally {
      setBusy("");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 rounded-[1.75rem] border border-secondary-100 bg-white p-6 sm:p-8">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-10 w-2/3 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const isLast = step === "review";

  return (
    <FormProvider {...form}>
      <section
        id="vendor-verification"
        className="space-y-6 rounded-[1.75rem] border border-secondary-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <VendorVerificationStatusBadge status={status} />
          {!readOnly && (
            <p className="text-xs text-secondary-500">
              Step {Math.min(current, steps.length - 1) + 1} of {steps.length}
            </p>
          )}
        </div>

        {status === "submitted" && (
          <div className="flex items-start gap-3 rounded-2xl bg-[#004766] p-5 text-white">
            <Clock3 className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">With our team for review</p>
              <p className="mt-1 text-sm leading-6 text-white/80">
                {isFreeHost
                  ? "Your free events carry on as normal. Paid tickets and payouts unlock once you're approved, and we'll tell you if we need anything else."
                  : "You can keep building event drafts. Paid tickets and payouts unlock once you're approved, and we'll tell you if we need anything else."}
              </p>
              {confirmWithdraw ? (
                <div className="mt-3 space-y-2 rounded-xl bg-white/10 p-3">
                  <p className="text-sm text-white/90">
                    This takes your application out of the review queue.
                    You&apos;ll need to send it again when you&apos;re done.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={onWithdraw}
                      loading={withdrawing}
                      disabled={withdrawing}
                      className="rounded-xl bg-white text-[#004766] hover:bg-white/90"
                    >
                      Yes, take it back
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmWithdraw(false)}
                      disabled={withdrawing}
                      className="rounded-xl text-white hover:bg-white/10 hover:text-white"
                    >
                      Keep it with the team
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmWithdraw(true)}
                  className="mt-3 text-sm font-semibold text-white underline underline-offset-4 hover:text-white/80"
                >
                  Need to change something? Take it back to edit
                </button>
              )}
            </div>
          </div>
        )}
        {status === "approved" && canSell && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-900">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <p className="text-sm leading-6">
              You&apos;re verified. Contact support if any of these details
              change.
            </p>
          </div>
        )}
        {isFreeHost && !canSell && status !== "submitted" && (
          <div className="flex flex-col gap-4 rounded-2xl border border-primary-100 bg-primary-50/70 p-5 text-secondary-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Ticket className="mt-0.5 size-5 shrink-0 text-primary-700" />
              <div className="text-sm leading-6">
                <p className="font-semibold">
                  You&apos;re verified to host free events
                </p>
                <p className="text-secondary-700">
                  As many as you like. To sell tickets and get paid, finish your
                  verification with your ID and bank details.
                </p>
              </div>
            </div>
            {readOnly && (
              <Button
                type="button"
                onClick={() => {
                  form.setValue("plan", "paid");
                  setUpgrading(true);
                  goTo(0);
                }}
                className="h-11 shrink-0 rounded-2xl bg-secondary-400 px-5 text-white hover:bg-secondary-500"
              >
                Finish verification
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        )}
        {(status === "needs_more_info" || status === "rejected") && (
          <div className="flex items-start gap-3 rounded-2xl border border-secondary-100 bg-secondary-50 p-5 text-secondary-900">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div className="text-sm leading-6">
              <p className="font-semibold">
                {status === "rejected"
                  ? "Your application wasn't approved"
                  : "We need a little more from you"}
              </p>
              {adminMessage && (
                <p className="mt-1 whitespace-pre-line">{adminMessage}</p>
              )}
              <p className="mt-1 text-secondary-800">
                Update the highlighted steps and send it again.
              </p>
            </div>
          </div>
        )}

        {readOnly ? (
          <ReviewSummary saved={saved} stepStatuses={stepStatuses} />
        ) : (
          <form
            noValidate
            onSubmit={isLast ? onSubmitAll : onContinue}
            className="space-y-6"
          >
            <Stepper
              steps={steps}
              current={current}
              furthest={furthest}
              stepStatuses={stepStatuses}
              onSelect={goTo}
            />

            <StepHeader
              title={STEP_LABELS[step]}
              description={
                (isFree ? FREE_STEP_COPY[step] : undefined) ?? STEP_COPY[step]
              }
              status={stepStatuses[step]}
            />

            {step === "vendorType" && <VendorTypeStep />}
            {step === "identity" && <IdentityStep free={isFree} />}
            {step === "business" && <BusinessStep />}
            {step === "payout" && <PayoutStep saved={saved} />}
            {step === "crossBorder" && <CrossBorderStep />}
            {step === "review" && (
              <ReviewSummary
                saved={saved}
                stepStatuses={stepStatuses}
                onEdit={(key) => goTo(steps.indexOf(key))}
                withConfirmation
              />
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-secondary-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                {current > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => goTo(current - 1)}
                    disabled={!!busy}
                    className="h-11 rounded-2xl"
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSaveDraft}
                  loading={busy === "draft"}
                  disabled={!!busy}
                  className="h-11 rounded-2xl"
                >
                  <Save className="size-4" />
                  Save draft
                </Button>
              </div>
              <Button
                type="submit"
                loading={busy === "next" || busy === "submit"}
                disabled={!!busy}
                className="h-11 rounded-2xl bg-secondary-400 px-6 text-white hover:bg-secondary-500"
              >
                {isLast ? (
                  <>
                    <CheckCircle2 className="size-4" />
                    {isFree ? "Start hosting" : "Submit for review"}
                  </>
                ) : (
                  <>
                    Save and continue
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </section>
    </FormProvider>
  );
});
