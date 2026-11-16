"use client";

import { getData, patchData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import InputField from "@/components/ui/input-field";
import ResultPagination from "@/components/ui/result-pagination";
import SegmentedControl from "@/components/ui/segmented-control";
import StatusBadge from "@/components/ui/status-badge";
import {
  IInquiry,
  MODERATION_PAGE_SIZE,
  TInquiryTopic,
  useInquiries,
  useInquiryCounts,
  usePickUpInquiry,
  useResolveInquiry,
} from "@/hooks/use-admin-moderation";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { toast } from "@/lib/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Hand, Inbox, Mail } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { memo, useEffect, useState } from "react";
import { FilterTabs, ListSkeleton, PageHeading } from "./moderation-ui";

type TStatus = "new" | "resolved" | undefined;
const STATUS_TABS: { value: TStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "resolved", label: "Resolved" },
  { value: undefined, label: "All" },
];

const TOPIC_LABELS: Record<TInquiryTopic, string> = {
  support: "Support",
  organiser: "Organisers",
  sales: "Sales leads",
  press: "Press",
  general: "General",
};
const TOPIC_ORDER: TInquiryTopic[] = ["sales", "support", "organiser", "press", "general"];

const replyLink = (inquiry: IInquiry) =>
  `mailto:${inquiry.email}?subject=${encodeURIComponent(
    `Re: ${inquiry.subject || "Your message to Turnupz"}`,
  )}&body=${encodeURIComponent(
    `Hi ${inquiry.name.split(" ")[0] || "there"},\n\n\n\n> ${inquiry.message.replace(/\n/g, "\n> ")}`,
  )}`;

const CALENDLY_LINK = /^https:\/\/([a-z0-9-]+\.)?calendly\.com\//i;

/** The sales booking link on the Contact page (sales team only). */
const BookingLinkSetting = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["contact-settings"],
    queryFn: async () => (await getData<{ bookingUrl: string | null }>("/contact/settings")).data?.data ?? null,
  });
  const [value, setValue] = useState("");
  useEffect(() => setValue(data?.bookingUrl ?? ""), [data?.bookingUrl]);
  const save = useMutation({
    mutationFn: () => patchData("/admin/contact-settings", { bookingUrl: value.trim() || null }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contact-settings"] });
      toast.success(value.trim() ? "Booking link saved" : "Booking link removed");
    },
    onError: (error) => toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't save the link.")),
  });
  return (
    <form
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim() && !CALENDLY_LINK.test(value.trim())) {
          toast.error("Use your Calendly link (https://calendly.com/...)");
          return;
        }
        save.mutate();
      }}
    >
      <InputField
        label="'Book a call' link on the Contact page"
        placeholder="https://calendly.com/turnupz/sales"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        helperText="Your Calendly booking page. Leave empty to hide the button."
        containerClassName="min-w-0 flex-1"
      />
      <Button type="submit" className="rounded-xl" loading={save.isPending}>
        Save
      </Button>
    </form>
  );
};

/**
 * Messages from Contact Us, by topic: support topics for the support team
 * (Contact Messages), sales leads for sales (Sales Leads). "I'm on it" stops a
 * message moving up to the department head; reply by email, then mark it
 * resolved.
 */
const Inquiries = ({ scope = "support" }: { scope?: "support" | "sales" }) => {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { has } = useAdminPermissions();
  const { data: counts } = useInquiryCounts();
  const visible = TOPIC_ORDER.filter(
    (topic) => counts && topic in counts && (scope === "sales") === (topic === "sales"),
  );
  const fromUrl = params.get("topic") as TInquiryTopic | null;
  const topic: TInquiryTopic | undefined =
    fromUrl && visible.includes(fromUrl) ? fromUrl : visible.length ? visible[0] : undefined;
  const chooseTopic = (next: TInquiryTopic) => router.replace(`${pathname}?topic=${next}`, { scroll: false });

  const [status, setStatus] = useState<TStatus>("new");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [status, topic]);
  const { data, error, isLoading, refetch } = useInquiries(status, page, topic);
  const resolve = useResolveInquiry();
  const pickUp = usePickUpInquiry();
  const [busyId, setBusyId] = useState<string | null>(null);

  const inquiries = data?.items ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / MODERATION_PAGE_SIZE);

  const act = async (id: string, action: "resolve" | "pickUp") => {
    setBusyId(id);
    try {
      if (action === "resolve") {
        await resolve.mutateAsync(id);
        toast.success("Marked as resolved.");
      } else {
        await pickUp.mutateAsync(id);
        toast.success("It's yours: nobody else will be chased about it.");
      }
    } catch (actionError) {
      toast.error(constructErrorMessage(actionError as TApiErrorResponseType, "Couldn't update it."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {scope === "sales" ? (
        <PageHeading title="Sales Leads">
          Organisers and partners who asked to talk to sales on the Contact
          page. Press &quot;I&apos;m on it&quot; so it doesn&apos;t go up to the
          head of Sales, reply by email, then mark it resolved.
        </PageHeading>
      ) : (
        <PageHeading title="Contact Messages">
          Messages from the Contact Us form, by topic. Press &quot;I&apos;m on
          it&quot; so it doesn&apos;t go up to the head of Support, reply by
          email, then mark it resolved.
        </PageHeading>
      )}

      {visible.length > 1 && topic && (
        <SegmentedControl
          label="Topic"
          value={topic}
          onChange={chooseTopic}
          options={visible.map((value) => ({
            value,
            label: `${TOPIC_LABELS[value]}${counts?.[value] ? ` (${counts[value]})` : ""}`,
          }))}
        />
      )}

      {scope === "sales" && has("SALES_MANAGE") && <BookingLinkSetting />}

      <FilterTabs tabs={STATUS_TABS} value={status} onChange={setStatus} />

      {isLoading && <ListSkeleton />}

      {!!error && !isLoading && (
        <ErrorContainer
          error={constructErrorMessage(error as TApiErrorResponseType, "Could not load messages")}
          retryFunction={() => void refetch()}
        />
      )}

      {!isLoading && !error && inquiries.length === 0 && (
        <EmptyContainer
          icon={<Inbox className="size-6" />}
          title={status === "new" ? "Inbox zero" : "No messages here"}
          description={`${topic ? TOPIC_LABELS[topic] : "Messages"} from the Contact Us page will show up here.`}
        />
      )}

      <ul className="space-y-3">
        {inquiries.map((inquiry) => (
          <li key={inquiry.id} className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-foreground">
                  {inquiry.topic === "sales" ? inquiry.company || inquiry.name : inquiry.subject || "No subject"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {inquiry.name} · {inquiry.email}
                  {inquiry.isSignedInUser && " · signed in"}
                  {" · "}
                  {formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}
                </p>
                {inquiry.topic === "sales" && (
                  <p className="text-sm text-muted-foreground">
                    {[inquiry.jobTitle, inquiry.country, inquiry.eventsPerYear].filter(Boolean).join(" · ") || "No company details"}
                  </p>
                )}
              </div>
              <span className="flex flex-wrap gap-1">
                {inquiry.pickedUpAt && inquiry.status === "new" && <StatusBadge tone="info">Picked up</StatusBadge>}
                <StatusBadge tone={inquiry.status === "new" ? "warning" : "neutral"}>
                  {inquiry.status === "new" ? "New" : "Resolved"}
                </StatusBadge>
              </span>
            </div>
            <p className="text-sm whitespace-pre-line text-foreground">{inquiry.message}</p>
            <div className="flex flex-wrap justify-end gap-2">
              {inquiry.status === "new" && !inquiry.pickedUpAt && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  loading={busyId === inquiry.id && pickUp.isPending}
                  disabled={!!busyId}
                  onClick={() => act(inquiry.id, "pickUp")}
                >
                  <Hand className="size-4" aria-hidden /> I&apos;m on it
                </Button>
              )}
              <Button asChild variant="outline" size="sm" className="rounded-lg">
                <a href={replyLink(inquiry)}>
                  <Mail className="size-4" aria-hidden />
                  Reply by email
                </a>
              </Button>
              {inquiry.status === "new" && (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-lg"
                  loading={busyId === inquiry.id && resolve.isPending}
                  disabled={!!busyId}
                  onClick={() => act(inquiry.id, "resolve")}
                >
                  Mark resolved
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 && <ResultPagination totalPages={totalPages} currentPage={page} onPageChange={setPage} />}
    </div>
  );
};

export default memo(Inquiries);
