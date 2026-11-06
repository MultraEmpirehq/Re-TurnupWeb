"use client";

import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import TextareaField from "@/components/ui/textarea-field";
import useUserStore from "@/stores/user-store";
import { CheckCircle2 } from "lucide-react";
import React, { memo, useEffect, useState } from "react";
import { toast } from "@/lib/toast";

type TContactForm = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const EMPTY_FORM: TContactForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const ContactUs = () => {
  const userDetails = useUserStore((state) => state.userDetails);
  const [form, setForm] = useState<TContactForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<TContactForm>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Signed-in people shouldn't have to type who they are.
  useEffect(() => {
    if (!userDetails) return;
    const fullName =
      userDetails.name ||
      [userDetails.firstName, userDetails.lastName].filter(Boolean).join(" ");
    setForm((current) => ({
      ...current,
      name: current.name || fullName,
      email: current.email || userDetails.email || "",
    }));
  }, [userDetails]);

  const update =
    (field: keyof TContactForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
    };

  const validate = () => {
    const next: Partial<TContactForm> = {};
    if (!form.name.trim()) next.name = "Tell us your name";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      next.email = "Enter a valid email";
    if (!form.message.trim()) next.message = "Write a message";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSending(true);
    try {
      await postData("/contact", {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
      });
      setSent(true);
      setForm((current) => ({ ...current, subject: "", message: "" }));
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "We couldn't send your message. Please try again.",
        ),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <SectionContainer className="py-10 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Talk with us</h1>
          <p className="text-sm opacity-70 max-w-sm">
            Questions, comments, or suggestions? Simply fill in the form and
            we&apos;ll be in touch shortly.
          </p>
        </div>
      </div>
      {sent ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
          <CheckCircle2 className="size-8 text-emerald-600" aria-hidden />
          <p className="text-lg font-semibold text-emerald-900">Message sent</p>
          <p className="text-sm text-emerald-800">
            Thanks for reaching out. We&apos;ll reply to {form.email} as soon as
            we can.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            onClick={() => setSent(false)}
          >
            Send another message
          </Button>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <InputField
            label="Name"
            placeholder="Enter your name"
            value={form.name}
            maxLength={120}
            error={errors.name}
            onChange={update("name")}
          />
          <InputField
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            error={errors.email}
            onChange={update("email")}
          />
          <InputField
            label="Subject (optional)"
            placeholder="What's it about?"
            value={form.subject}
            maxLength={160}
            onChange={update("subject")}
          />
          <TextareaField
            label="Message"
            placeholder="Enter your message"
            value={form.message}
            maxLength={5000}
            error={errors.message}
            onChange={update("message")}
          />
          <Button type="submit" className="w-full" loading={sending}>
            Submit
          </Button>
        </form>
      )}
    </SectionContainer>
  );
};

export default memo(ContactUs);
