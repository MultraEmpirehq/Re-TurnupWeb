"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  resumeWaitlistEmail,
  sendWaitlistEmail,
  sendWaitlistTestEmail,
  TWaitlistAudience,
  TWaitlistEmailFilters,
  useWaitlistAudience,
  useWaitlistCampaigns,
} from "@/hooks/use-admin-waitlist";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import React, { memo, useState } from "react";
import { toast } from "@/lib/toast";
import { useDebounce } from "use-debounce";

const AUDIENCES: { value: TWaitlistAudience; title: string; note: string }[] = [
  { value: "LAUNCH", title: "Launch announcement", note: "Confirmed and said yes to launch news" },
  { value: "PROMOTION", title: "Promotion", note: "Confirmed and said yes to marketing" },
];

const ROLES: { value?: "attendee" | "organiser"; label: string }[] = [
  { label: "Everyone" },
  { value: "attendee", label: "Attendees" },
  { value: "organiser", label: "Organisers" },
];

const COUNTRIES: { value?: string; label: string }[] = [
  { label: "All countries" },
  { value: "NG", label: "🇳🇬 Nigeria" },
  { value: "CA", label: "🇨🇦 Canada" },
];

const Stat: React.FC<{ label: string; value?: number; note: string; tone?: "good" | "warn" }> = ({
  label,
  value,
  note,
  tone,
}) => (
  <div
    className={cn(
      "rounded-2xl border p-4",
      tone === "good" ? "border-emerald-200 bg-emerald-50/50" : tone === "warn" ? "border-amber-200 bg-amber-50/60" : "border-border bg-card",
    )}
  >
    <p
      className={cn(
        "text-[11px] font-semibold tracking-wider uppercase",
        tone === "good" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : "text-muted-foreground",
      )}
    >
      {label}
    </p>
    {value === undefined ? (
      <Skeleton className="mt-2 h-7 w-16" />
    ) : (
      <p className="mt-1.5 text-2xl font-bold text-secondary-950 tabular-nums">{value.toLocaleString()}</p>
    )}
    <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
  </div>
);

const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
      active ? "border-secondary-950 bg-secondary-950 text-white" : "border-border bg-card text-secondary-700 hover:bg-muted",
    )}
  >
    {children}
  </button>
);

/**
 * Email the waitlist (Marketing): confirmed sign-ups who agreed to launch news
 * or promotions, narrowed by role or country. Send a test first; the real send
 * goes out in the background and the history below follows it.
 */
const WaitlistEmail = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TWaitlistEmailFilters>({ audience: "LAUNCH" });
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [buttonText, setButtonText] = useState("Explore events");
  const [buttonUrl, setButtonUrl] = useState("https://turnupz.app/explore");
  const [testing, setTesting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  const [debouncedFilters] = useDebounce(filters, 150);
  const { data: audience } = useWaitlistAudience(debouncedFilters);
  const { data: campaigns, isLoading: loadingHistory } = useWaitlistCampaigns();

  const content = {
    subject: subject.trim(),
    message: message.trim(),
    ...(buttonUrl.trim() ? { buttonText: buttonText.trim() || undefined, buttonUrl: buttonUrl.trim() } : {}),
  };
  const ready = content.subject.length >= 3 && content.message.length >= 10;
  const recipients = audience?.recipients ?? 0;

  const sendTest = async () => {
    setTesting(true);
    try {
      const { data } = await sendWaitlistTestEmail(content);
      toast.success(typeof data?.data === "string" ? data.data : "Test sent to you.");
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "The test couldn't be sent."));
    } finally {
      setTesting(false);
    }
  };

  const send = async () => {
    setSending(true);
    try {
      const { data } = await sendWaitlistEmail({ ...content, ...filters });
      toast.success(`Sending to ${(data?.data?.recipients ?? recipients).toLocaleString()} people.`);
      setConfirming(false);
      setSubject("");
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["admin-waitlist-campaigns"] });
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "The email couldn't be sent."));
    } finally {
      setSending(false);
    }
  };

  const resume = async (id: string) => {
    try {
      await resumeWaitlistEmail(id);
      toast.success("Carrying on with the send.");
      await queryClient.invalidateQueries({ queryKey: ["admin-waitlist-campaigns"] });
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't carry on with it."));
    }
  };

  const paragraphs = (message.trim() || "Your message shows here.").split(/\n\s*\n/);

  return (
    <div className="space-y-5 pb-16">
      <div>
        <Link href="/app/admin/marketing/waitlist" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-3.5" aria-hidden /> Waitlist
        </Link>
        <h1 className="text-xl font-bold text-secondary-800">Email the waitlist</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Only confirmed sign-ups who agreed get it, and every email has an unsubscribe link.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="On the waitlist" value={audience?.total} note="all sign-ups" />
        <Stat
          label="Confirmed email"
          value={audience?.confirmed}
          note={audience?.total ? `${Math.round((audience.confirmed / audience.total) * 100)}% confirmed` : "—"}
          tone="good"
        />
        <Stat label="Will get this" value={audience?.recipients} note="with the choices below" />
        <Stat label="Not confirmed" value={audience?.notConfirmed} note="won't get it" tone="warn" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Who gets it</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {AUDIENCES.map((option) => {
                const active = filters.audience === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilters((current) => ({ ...current, audience: option.value }))}
                    className={cn(
                      "rounded-xl p-3 text-left transition-colors",
                      active ? "border-2 border-primary bg-primary-50" : "border border-border hover:bg-muted",
                    )}
                  >
                    <span className="block text-sm font-bold">{option.title}</span>
                    <span className="text-xs text-muted-foreground">{option.note}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map((role) => (
                <Chip
                  key={role.label}
                  active={filters.role === role.value}
                  onClick={() => setFilters((current) => ({ ...current, role: role.value }))}
                >
                  {role.label}
                </Chip>
              ))}
              <span className="mx-1 w-px bg-border" aria-hidden />
              {COUNTRIES.map((country) => (
                <Chip
                  key={country.label}
                  active={filters.countryCode === country.value}
                  onClick={() => setFilters((current) => ({ ...current, countryCode: country.value }))}
                >
                  {country.label}
                </Chip>
              ))}
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Subject</span>
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={120} placeholder="Turnupz is open. Your first look is here" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Message</span>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={4000}
              rows={6}
              placeholder="A blank line starts a new paragraph."
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Button text</span>
              <Input value={buttonText} onChange={(event) => setButtonText(event.target.value)} maxLength={40} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Button link</span>
              <Input value={buttonUrl} onChange={(event) => setButtonUrl(event.target.value)} placeholder="https://… (leave empty for no button)" />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <Button variant="ghost" className="px-0 text-primary hover:bg-transparent hover:underline" disabled={!ready} loading={testing} onClick={() => void sendTest()}>
              Send a test to me
            </Button>
            <Button className="rounded-full px-5" disabled={!ready || !recipients} onClick={() => setConfirming(true)}>
              Send to {recipients.toLocaleString()} {recipients === 1 ? "person" : "people"}…
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-[#eef2f7] p-4">
          <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Preview</p>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="bg-linear-to-br from-secondary to-primary px-6 py-4 text-lg font-extrabold text-white italic">turnupz</div>
            <div className="space-y-3 p-6 text-sm leading-6 text-secondary-600">
              <p className="text-xl font-extrabold text-secondary-950">{subject.trim() || "Your subject"}</p>
              <p>Hi Ada,</p>
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="whitespace-pre-line">{paragraph.trim()}</p>
              ))}
              {buttonUrl.trim() && (
                <span className="inline-block rounded-full bg-secondary px-6 py-2.5 font-bold text-white">
                  {buttonText.trim() || "Open Turnupz"}
                </span>
              )}
            </div>
            <div className="border-t border-border bg-[#f7f9fc] px-6 py-3 text-xs text-muted-foreground">Questions? Email us any time.</div>
          </div>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            You&apos;re getting this because you joined the Turnupz waitlist. <u>Unsubscribe</u>
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold">Sent before</h2>
        {loadingHistory ? (
          <Skeleton className="mt-3 h-16 w-full" />
        ) : !campaigns?.length ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing sent yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-[11px] tracking-wider text-muted-foreground uppercase">
                  <th className="pb-2 font-semibold">Email</th>
                  <th className="pb-2 font-semibold">Sent</th>
                  <th className="pb-2 text-right font-semibold">Delivered</th>
                  <th className="pb-2 text-right font-semibold">Failed</th>
                  <th className="pb-2 text-right font-semibold">By</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="py-2.5">
                      {campaign.subject}
                      <span className="block text-xs text-muted-foreground">
                        {campaign.audience === "LAUNCH" ? "Launch" : "Promotion"}
                        {campaign.role ? ` · ${campaign.role}s` : ""}
                        {campaign.countryCode ? ` · ${campaign.countryCode}` : ""}
                      </span>
                    </td>
                    <td className="py-2.5 text-muted-foreground">{format(new Date(campaign.createdAt), "d MMM, HH:mm")}</td>
                    <td className="py-2.5 text-right tabular-nums">
                      {campaign.sent.toLocaleString()}
                      {campaign.status === "SENDING" && ` of ${campaign.recipients.toLocaleString()}`}
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground tabular-nums">{campaign.failed.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{campaign.createdBy}</td>
                    <td className="py-2.5 pl-3 text-right">
                      {campaign.status === "SENDING" ? (
                        <Button size="sm" variant="outline" className="h-7 rounded-full text-xs" onClick={() => void resume(campaign.id)}>
                          Sending… carry on
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirming}
        title={`Send to ${recipients.toLocaleString()} ${recipients === 1 ? "person" : "people"}?`}
        description={`"${subject.trim()}" goes out now and can't be taken back. Each person gets it once, with an unsubscribe link.`}
        confirmLabel="Send email"
        busy={sending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void send()}
      />
    </div>
  );
};

export default memo(WaitlistEmail);
