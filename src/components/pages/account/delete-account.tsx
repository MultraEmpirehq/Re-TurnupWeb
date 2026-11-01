"use client";

import { deleteData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useUserStore from "@/stores/user-store";
import Link from "next/link";
import React, { memo, useState } from "react";
import { toast } from "sonner";

const WHAT_HAPPENS = [
  "Your profile, photo, followers and saved cards are removed, and you're signed out everywhere.",
  "You lose access to your tickets, and any Turnupz Credit you have is lost.",
  "Your orders are kept without your name, because we have to keep payment records.",
  "If you've sold tickets to an upcoming event, cancel it or wait until it's over first.",
  "You can sign up again with the same email later.",
];

/**
 * How to delete a Turnupz account, from the app or here. Signed in, it deletes
 * the account directly (typing DELETE to confirm), the same as in the app.
 */
const DeleteAccount = () => {
  const userDetails = useUserStore((state) => state.userDetails);
  const clearStore = useUserStore((state) => state.clearStore);
  const [confirm, setConfirm] = useState("");
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const ready = confirm.trim().toUpperCase() === "DELETE";

  const remove = async () => {
    if (!ready) return;
    setDeleting(true);
    try {
      await deleteData("/user/me", {
        data: { confirm: confirm.trim(), ...(reason.trim() ? { reason: reason.trim() } : {}) },
      });
      clearStore();
      setDeleted(true);
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't delete your account. Please try again.",
        ),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6">
      <section className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.28em] text-secondary-400 uppercase">
          Your account
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-secondary-950 sm:text-4xl">
          Delete your Turnupz account
        </h1>
        <p className="text-sm leading-7 text-secondary-500 sm:text-base">
          You can delete your account in the Turnupz app or on this page. It
          can&apos;t be undone.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-secondary-100 bg-white p-6">
        <h2 className="text-lg font-bold text-secondary-950">What happens</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-secondary-600">
          {WHAT_HAPPENS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border border-secondary-100 bg-white p-6">
        <h2 className="text-lg font-bold text-secondary-950">In the app</h2>
        <p className="text-sm leading-7 text-secondary-600">
          Open Turnupz, go to <b>Profile</b>, then <b>Settings</b>, then{" "}
          <b>Delete account</b>, and follow the steps.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-secondary-100 bg-white p-6">
        <h2 className="text-lg font-bold text-secondary-950">On the web</h2>
        {deleted ? (
          <p className="text-sm leading-7 text-secondary-600" role="status">
            Your account has been deleted and you&apos;ve been signed out.
          </p>
        ) : userDetails ? (
          <div className="space-y-4">
            <p className="text-sm leading-7 text-secondary-600">
              Signed in as <b>{userDetails.email}</b>.
            </p>
            <label className="block space-y-2 text-sm">
              <span className="text-secondary-700">Why are you leaving? (optional)</span>
              <Input
                id="delete-reason"
                value={reason}
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                placeholder="It helps us make Turnupz better"
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="text-secondary-700">Type DELETE to confirm</span>
              <Input
                id="delete-confirm"
                value={confirm}
                autoComplete="off"
                onChange={(event) => setConfirm(event.target.value)}
              />
            </label>
            <Button
              type="button"
              variant="destructive"
              disabled={!ready || deleting}
              loading={deleting}
              onClick={() => void remove()}
            >
              Delete my account
            </Button>
          </div>
        ) : (
          <p className="text-sm leading-7 text-secondary-600">
            <Link
              href={`/auth?redirect=${encodeURIComponent("/delete-account")}`}
              className="font-semibold text-secondary-500 underline"
            >
              Sign in
            </Link>{" "}
            to delete your account here. Can&apos;t sign in?{" "}
            <Link href="/contact" className="font-semibold text-secondary-500 underline">
              Contact us
            </Link>{" "}
            from the email on your account and we&apos;ll delete it for you.
          </p>
        )}
      </section>
    </main>
  );
};

export default memo(DeleteAccount);
