"use client";

import { getData, patchData, postData, putData } from "@/api";
import { uploadAttachment } from "@/api/attachments";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { joiResolver } from "@hookform/resolvers/joi";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Save,
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
} from "./types";

const STEP_COPY: Record<VerificationStepKey, string> = {
  vendorType: "Tell us who runs your events, so we ask for the right details.",
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
                    ? "bg-amber-400"
                    : done || index === current
                      ? "bg-secondary-400"
                      : "bg-secondary-100",
                )}
              />
              <span className="flex items-center gap-1.5 text-xs font-semibold text-secondary-900">
                {flagged ? (
                  <AlertTriangle className="size-3.5 text-amber-600" />
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
  const steps = useMemo<VerificationStepKey[]>(
    () => [
      "vendorType",
      "identity",
      ...(vendorType === "business" ? (["business"] as const) : []),
      "payout",
      "crossBorder",
      "review",
    ],
    [vendorType],
  );
  const step = steps[Math.min(current, steps.length - 1)];
  stepRef.current = step;
  savedRef.current = saved;

  const readOnly = status === "submitted" || status === "approved";

  const apply = useCallback(
    (data?: VendorVerificationApiResponse | null, resetForm = false) => {
      if (!data) return;
      setStatus(data.status ?? "in_progress");
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
        const order: VerificationStepKey[] = [
          "vendorType",
          "identity",
          ...(verification.vendorType === "business"
            ? (["business"] as const)
            : []),
          "payout",
          "crossBorder",
          "review",
        ];
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
        toast.success("Sent for review. We'll let you know the outcome.");
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
                You can keep building event drafts. Paid tickets and payouts
                unlock once you&apos;re approved, and we&apos;ll tell you if we
                need anything else.
              </p>
            </div>
          </div>
        )}
        {status === "approved" && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-900">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <p className="text-sm leading-6">
              You&apos;re verified. Contact support if any of these details
              change.
            </p>
          </div>
        )}
        {(status === "needs_more_info" || status === "rejected") && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-5 text-amber-900">
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
              <p className="mt-1 text-amber-800">
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
              description={STEP_COPY[step]}
              status={stepStatuses[step]}
            />

            {step === "vendorType" && <VendorTypeStep />}
            {step === "identity" && <IdentityStep />}
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
                    Submit for review
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
