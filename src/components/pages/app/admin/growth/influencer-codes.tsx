"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import {
  IInfluencerCode,
  useCreateInfluencerCode,
  useInfluencerCode,
  useInfluencerCodes,
  useSetInfluencerCodeActive,
} from "@/hooks/use-admin-referrals";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Copy, Plus, Sparkles } from "lucide-react";
import React, { memo, useState } from "react";
import { toast } from "@/lib/toast";
import { ListSkeleton, PageHeading } from "../moderation/moderation-ui";
import { REFERRAL_STATUS } from "./referrals";

const CODE_PATTERN = /^[A-Z0-9]{4,20}$/;

const spendLine = (code: IInfluencerCode) =>
  code.stats.ticketSpend.length
    ? code.stats.ticketSpend
        .map(
          (row) => `${row.total.formatted.withCurrency} (${row.orders} orders)`,
        )
        .join(" · ")
    : "No purchases yet";

/**
 * Codes given to influencers. Each one's sign-ups, how many went on to buy, and
 * what they've spent, so the team can see which partnerships work. Creating a
 * code or switching one off needs the "suspend users" permission.
 */
const InfluencerCodes = () => {
  const { data, error, isLoading, refetch } = useInfluencerCodes();
  const { has } = useAdminPermissions();
  const canManage = has("USERS_MANAGE");
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const setActive = useSetInfluencerCodeActive();
  const codes = data ?? [];

  const toggle = (code: IInfluencerCode) =>
    setActive.mutate(
      { id: code.id, isActive: !code.isActive },
      {
        onSuccess: () =>
          toast.success(
            code.isActive
              ? `${code.code} switched off for new sign-ups`
              : `${code.code} is live again`,
          ),
        onError: (toggleError) =>
          toast.error(
            constructErrorMessage(
              toggleError as TApiErrorResponseType,
              "Couldn't update the code",
            ),
          ),
      },
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeading title="Influencer Codes">
          Codes you give influencers. New people enter them at sign-up; we track
          who joined through each and what they spent. Rewards follow the fixed
          referral rules.
        </PageHeading>
        {canManage && (
          <Button onClick={() => setCreating(true)} className="rounded-lg">
            <Plus className="size-4" />
            New code
          </Button>
        )}
      </div>

      {isLoading && <ListSkeleton />}
      {!!error && !isLoading && (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Could not load influencer codes",
          )}
          retryFunction={() => void refetch()}
        />
      )}
      {!isLoading && !error && codes.length === 0 && (
        <EmptyContainer
          icon={<Sparkles className="size-6" />}
          title="No influencer codes yet"
          description="Create one for each influencer you work with to track who they bring in."
        />
      )}

      {codes.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-3 font-medium">Code</th>
                <th className="p-3 font-medium">Influencer</th>
                <th className="p-3 font-medium">Sign-ups</th>
                <th className="p-3 font-medium">Bought tickets</th>
                <th className="p-3 font-medium">Ticket spend</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr
                  key={code.id}
                  className="border-b border-border align-top last:border-0"
                >
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => setOpenId(code.id)}
                      className="font-mono font-semibold text-primary-700 hover:underline"
                    >
                      {code.code}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      Since {format(new Date(code.createdAt), "d MMM yyyy")}
                    </p>
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{code.name}</p>
                    {code.contact && (
                      <p className="text-xs text-muted-foreground">
                        {code.contact}
                      </p>
                    )}
                  </td>
                  <td className="p-3 font-semibold">{code.stats.signUps}</td>
                  <td className="p-3">
                    {code.stats.qualified}
                    {code.stats.signUps > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        (
                        {Math.round(
                          (code.stats.qualified / code.stats.signUps) * 100,
                        )}
                        %)
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-xs">{spendLine(code)}</td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        code.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {code.isActive ? "Live" : "Off"}
                    </span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        navigator.clipboard
                          ?.writeText(code.code)
                          .then(() => toast.success("Code copied"))
                      }
                      aria-label={`Copy ${code.code}`}
                    >
                      <Copy className="size-4" />
                    </Button>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        disabled={setActive.isPending}
                        onClick={() => toggle(code)}
                      >
                        {code.isActive ? "Switch off" : "Switch on"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateCodeDialog open={creating} onClose={() => setCreating(false)} />
      <CodeDetailsDialog id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
};

const CreateCodeDialog: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const create = useCreateInfluencerCode();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [username, setUsername] = useState("");
  const [notes, setNotes] = useState("");
  const cleanCode = code.trim().toUpperCase();
  const codeOk = CODE_PATTERN.test(cleanCode);

  const reset = () => {
    setCode("");
    setName("");
    setContact("");
    setUsername("");
    setNotes("");
  };

  const submit = () =>
    create.mutate(
      {
        code: cleanCode,
        name: name.trim(),
        ...(contact.trim() ? { contact: contact.trim() } : {}),
        ...(username.trim()
          ? { username: username.trim().replace(/^@/, "") }
          : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      },
      {
        onSuccess: () => {
          toast.success(`${cleanCode} created`);
          reset();
          onClose();
        },
        onError: (createError) =>
          toast.error(
            constructErrorMessage(
              createError as TApiErrorResponseType,
              "Couldn't create the code",
            ),
          ),
      },
    );

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New influencer code</DialogTitle>
          <DialogDescription>
            Give it to one influencer. People who sign up with it are tracked
            against them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Code</span>
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="AYOVIBES"
              className="font-mono"
            />
            <span
              className={cn(
                "block text-xs",
                code && !codeOk ? "text-red-600" : "text-muted-foreground",
              )}
            >
              4–20 letters or numbers, no spaces. It can&apos;t be anyone&apos;s
              username.
            </span>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Influencer&apos;s name</span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ayo Vibes"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Contact (optional)</span>
            <Input
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="@ayovibes on Instagram"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">
              Their Turnupz username (optional)
            </span>
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="ayovibes"
            />
            <span className="block text-xs text-muted-foreground">
              Links the code to their account, for reporting only.
            </span>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Notes (optional)</span>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Campaign, agreement, fee…"
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!codeOk || !name.trim() || create.isPending}
          >
            {create.isPending ? "Creating…" : "Create code"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CodeDetailsDialog: React.FC<{
  id: string | null;
  onClose: () => void;
}> = ({ id, onClose }) => {
  const { data: code, isLoading } = useInfluencerCode(id);
  return (
    <Dialog open={!!id} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono">
            {code?.code ?? "Influencer code"}
          </DialogTitle>
          <DialogDescription>
            {code
              ? `${code.name}${code.notes ? ` · ${code.notes}` : ""}`
              : "Loading…"}
          </DialogDescription>
        </DialogHeader>
        {isLoading && <ListSkeleton />}
        {code && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Sign-ups", value: code.stats.signUps },
                { label: "Bought tickets", value: code.stats.qualified },
                { label: "Waiting", value: code.stats.waiting },
                { label: "Not eligible", value: code.stats.notEligible },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-border p-3"
                >
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-xl font-bold">{item.value}</p>
                </div>
              ))}
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">Ticket spend: </span>
              {spendLine(code)}
            </p>
            {!!code.stats.welcomeCreditIssued.length && (
              <p className="text-sm">
                <span className="text-muted-foreground">
                  Welcome credit given:{" "}
                </span>
                {code.stats.welcomeCreditIssued
                  .map((money) => money.formatted.withCurrency)
                  .join(" · ")}
              </p>
            )}
            <div className="rounded-lg border border-border">
              <p className="border-b border-border p-3 text-sm font-semibold">
                People who joined with it
              </p>
              {(code.referrals ?? []).length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">Nobody yet.</p>
              ) : (
                <ul>
                  {code.referrals!.map((referral) => {
                    const status = REFERRAL_STATUS[referral.status];
                    return (
                      <li
                        key={referral.id}
                        className="flex items-center justify-between gap-3 border-b border-border p-3 text-sm last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {[
                              referral.referred.firstName,
                              referral.referred.lastName,
                            ]
                              .filter(Boolean)
                              .join(" ") || referral.referred.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {referral.referred.email} · joined{" "}
                            {format(
                              new Date(referral.attachedAt),
                              "d MMM yyyy",
                            )}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                            status.className,
                          )}
                        >
                          {status.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default memo(InfluencerCodes);
