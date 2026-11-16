"use client";

import { getData, postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import Notice from "@/components/ui/notice";
import SegmentedControl from "@/components/ui/segmented-control";
import TextareaField from "@/components/ui/textarea-field";
import { siteHref } from "@/lib/domains";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  Handshake,
  LifeBuoy,
  LucideIcon,
  Mail,
  MessagesSquare,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { memo, useEffect, useRef, useState } from "react";

type TTopic = "SUPPORT" | "ORGANISER" | "SALES" | "PRESS" | "GENERAL";
type TRoute = "help" | "sales" | "other";

/** The three ways in: help (live chat), sales, and everything else. */
const ROUTES_IN: {
  value: TRoute;
  icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
}[] = [
  {
    value: "help",
    icon: LifeBuoy,
    title: "Get help",
    description: "Tickets, orders, your account or running your events. Chat with our support team.",
    cta: "Start a chat",
  },
  {
    value: "sales",
    icon: Handshake,
    title: "Talk to sales",
    description: "Venues, brands, big organisers and partnerships. Let's see how we can work together.",
    cta: "Contact sales",
  },
  {
    value: "other",
    icon: Mail,
    title: "Something else",
    description: "Press and media, feedback, or anything we haven't covered. Send us a message.",
    cta: "Send a message",
  },
];

/** Topics answered in live chat; the rest by email. */
const CHAT_TOPICS: TTopic[] = ["SUPPORT", "ORGANISER"];

type TSettings = { chatHours: string; chatStaffedNow: boolean; bookingUrl: string | null };

const useContactSettings = () =>
  useQuery({
    queryKey: ["contact-settings"],
    queryFn: async () => (await getData<TSettings>("/contact/settings")).data?.data ?? null,
    staleTime: 60_000,
  });

const EVENT_SIZES = ["Under 10 a year", "10–50 a year", "50–200 a year", "200+ a year", "One big event"];

/** One way in, as a large card. */
const RouteCard = ({
  route,
  selected,
  onSelect,
}: {
  route: (typeof ROUTES_IN)[number];
  selected: boolean;
  onSelect: () => void;
}) => {
  const Icon = route.icon;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group flex h-full flex-col items-start gap-4 rounded-2xl border bg-card p-6 text-left shadow-sm transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        selected ? "border-primary ring-1 ring-primary" : "border-border hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="space-y-1.5">
        <span className="block text-lg font-semibold text-foreground">{route.title}</span>
        <span className="block text-sm text-muted-foreground">{route.description}</span>
      </span>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
        {route.cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </button>
  );
};

/**
 * Contact Us: three ways in (help, sales, something else), then the right
 * way to reach us. Help goes to live chat (support); sales leads to the
 * sales team, with a booking link when one is set; press and anything else
 * by message. Each message lands with the department whose work it is.
 */
const ContactUs = () => {
  const userDetails = useUserStore((state) => state.userDetails);
  const { data: settings } = useContactSettings();
  const [route, setRoute] = useState<TRoute | null>(null);
  const [helpFor, setHelpFor] = useState<"SUPPORT" | "ORGANISER">("SUPPORT");
  const [otherTopic, setOtherTopic] = useState<"GENERAL" | "PRESS">("GENERAL");
  // Help can still send a message instead (no sign-in needed).
  const [preferMessage, setPreferMessage] = useState(false);
  useEffect(() => setPreferMessage(false), [route]);
  const panelRef = useRef<HTMLDivElement>(null);

  const topic: TTopic | null =
    route === "help" ? helpFor : route === "sales" ? "SALES" : route === "other" ? otherTopic : null;
  const chatting = !!topic && CHAT_TOPICS.includes(topic) && !preferMessage;

  const choose = (next: TRoute) => {
    setRoute(next);
    // Bring the form into view once it has rendered.
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <SectionContainer className="relative z-20 -mt-16 space-y-12 pb-16 md:-mt-24 md:pb-24">
      <div role="radiogroup" aria-label="How can we help?" className="grid gap-4 md:grid-cols-3">
        {ROUTES_IN.map((option) => (
          <RouteCard
            key={option.value}
            route={option}
            selected={route === option.value}
            onSelect={() => choose(option.value)}
          />
        ))}
      </div>

      {route && topic && (
        <div ref={panelRef} className="mx-auto max-w-2xl scroll-mt-24 space-y-5">
          {route === "help" && (
            <SegmentedControl
              label="Who needs help?"
              value={helpFor}
              onChange={setHelpFor}
              options={[
                { value: "SUPPORT", label: "I'm going to an event" },
                { value: "ORGANISER", label: "I run events" },
              ]}
            />
          )}
          {route === "other" && (
            <SegmentedControl
              label="What's it about?"
              value={otherTopic}
              onChange={setOtherTopic}
              options={[
                { value: "GENERAL", label: "General" },
                { value: "PRESS", label: "Press and media" },
              ]}
            />
          )}
          {chatting && (
            <LiveChat
              topic={topic}
              signedIn={!!userDetails}
              staffed={settings?.chatStaffedNow ?? true}
              hours={settings?.chatHours}
              onPreferMessage={() => setPreferMessage(true)}
            />
          )}
          {topic === "SALES" && <SalesForm bookingUrl={settings?.bookingUrl ?? null} />}
          {!chatting && topic !== "SALES" && <MessageForm topic={topic} />}
        </div>
      )}

      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-2xl border border-border bg-muted/50 p-6 text-center sm:flex-row sm:text-left">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-primary">
          <CircleHelp className="size-5" aria-hidden />
        </span>
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-foreground">Looking for a quick answer?</p>
          <p className="text-sm text-muted-foreground">
            Refunds, transfers, payouts and more are covered in our FAQs.
            {settings && <> Live chat is open {settings.chatHours}.</>}
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={ROUTES.FAQS.href}>Read the FAQs</Link>
        </Button>
      </div>
    </SectionContainer>
  );
};

/* ------------------------------------------------------------- live chat */

const LiveChat = ({
  topic,
  signedIn,
  staffed,
  hours,
  onPreferMessage,
}: {
  topic: TTopic;
  signedIn: boolean;
  staffed: boolean;
  hours?: string;
  onPreferMessage: () => void;
}) => {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [starting, setStarting] = useState(false);

  const start = async () => {
    if (!message.trim()) return;
    setStarting(true);
    try {
      const { data } = await postData<{ message: string }, { id: string }>("/chats/support", {
        message: `${topic === "ORGANISER" ? "[Organiser help] " : ""}${message.trim()}`,
      });
      router.push(`${ROUTES.MESSAGES.href}?chat=${data?.data?.id ?? ""}`);
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't start the chat. Try again."));
      setStarting(false);
    }
  };

  return (
    <section aria-label="Live chat" className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-foreground">Chat with the Turnupz team</h2>
        <p className="text-sm text-muted-foreground">
          {staffed
            ? "We usually reply within 30 minutes."
            : `We're offline now (${hours ?? "9am–9pm WAT"}). Start the chat anyway and we'll reply when we're back, in the app and by email.`}
        </p>
      </div>
      {signedIn ? (
        <>
          <TextareaField
            label="What do you need help with?"
            placeholder="Include your order number if it's about a ticket."
            value={message}
            maxLength={2000}
            onChange={(event) => setMessage(event.target.value)}
          />
          <Button className="rounded-xl" loading={starting} disabled={!message.trim() || starting} onClick={() => start()}>
            <MessagesSquare className="size-4" aria-hidden /> Start chat
          </Button>
        </>
      ) : (
        <Notice
          tone="info"
          title="Sign in to chat"
          action={
            <Button asChild className="rounded-xl">
              <a href={siteHref(`${ROUTES.LOGIN.href}?redirect=${encodeURIComponent(`${ROUTES.MESSAGES.href}?support=1`)}`)}>
                Sign in
              </a>
            </Button>
          }
        >
          <p>So we can see your orders and reply where you&apos;ll see it.</p>
        </Notice>
      )}
      <button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={onPreferMessage}>
        Send us a message instead
      </button>
    </section>
  );
};

/* ---------------------------------------------------------- the forms */

type TFields = Record<string, string>;

const useContactForm = (initial: TFields) => {
  const userDetails = useUserStore((state) => state.userDetails);
  const [form, setForm] = useState<TFields>(initial);
  const [errors, setErrors] = useState<TFields>({});
  // Signed-in people shouldn't have to type who they are.
  useEffect(() => {
    if (!userDetails) return;
    const fullName = userDetails.name || [userDetails.firstName, userDetails.lastName].filter(Boolean).join(" ");
    setForm((current) => ({ ...current, name: current.name || fullName, email: current.email || userDetails.email || "" }));
  }, [userDetails]);
  const update = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };
  const validate = (required: string[]) => {
    const next: TFields = {};
    if (!form.name?.trim()) next.name = "Tell us your name";
    if (!/^\S+@\S+\.\S+$/.test(form.email?.trim() ?? "")) next.email = "Enter a valid email";
    for (const field of required) if (!form[field]?.trim()) next[field] = "Fill this in";
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  return { form, setForm, errors, update, validate };
};

const Sent = ({ email, onAgain, sales }: { email: string; onAgain: () => void; sales?: boolean }) => (
  <div className="flex flex-col items-start gap-3 rounded-2xl border border-success-line bg-success-soft p-5">
    <CheckCircle2 className="size-7 text-success" aria-hidden />
    <p className="text-lg font-semibold text-success">{sales ? "Thanks, our sales team has it" : "Message sent"}</p>
    <p className="text-sm text-foreground/75">
      We&apos;ll reply to {email} {sales ? "within a working day" : "as soon as we can"}.
    </p>
    <Button type="button" variant="outline" className="rounded-xl" onClick={onAgain}>
      Send another message
    </Button>
  </div>
);

const send = async (payload: Record<string, unknown>) => {
  await postData("/contact", payload);
};

const MessageForm = ({ topic }: { topic: TTopic }) => {
  const { form, setForm, errors, update, validate } = useContactForm({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate(["message"])) return;
    setSending(true);
    try {
      await send({
        topic,
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
      });
      setSent(true);
      setForm((current) => ({ ...current, subject: "", message: "" }));
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "We couldn't send your message. Please try again."));
    } finally {
      setSending(false);
    }
  };

  if (sent) return <Sent email={form.email} onAgain={() => setSent(false)} />;
  return (
    <form className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-5" onSubmit={submit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField label="Name" placeholder="Your name" value={form.name} maxLength={120} error={errors.name} onChange={update("name")} />
        <InputField label="Email" type="email" placeholder="you@example.com" value={form.email} error={errors.email} onChange={update("email")} />
      </div>
      <InputField label="Subject (optional)" placeholder="What's it about?" value={form.subject} maxLength={160} onChange={update("subject")} />
      <TextareaField label="Message" placeholder="Your message" value={form.message} maxLength={5000} error={errors.message} onChange={update("message")} />
      <Button type="submit" className="w-full rounded-xl" loading={sending}>
        Send message
      </Button>
    </form>
  );
};

const SalesForm = ({ bookingUrl }: { bookingUrl: string | null }) => {
  const { form, setForm, errors, update, validate } = useContactForm({
    name: "",
    email: "",
    company: "",
    jobTitle: "",
    country: "",
    eventsPerYear: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate(["company", "message"])) return;
    setSending(true);
    try {
      await send({
        topic: "SALES",
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        jobTitle: form.jobTitle.trim() || undefined,
        country: form.country.trim() || undefined,
        eventsPerYear: form.eventsPerYear || undefined,
        subject: `Sales: ${form.company.trim()}`,
        message: form.message.trim(),
      });
      setSent(true);
      setForm((current) => ({ ...current, message: "" }));
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "We couldn't send that. Please try again."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {bookingUrl && (
        <Notice
          tone="info"
          icon={CalendarClock}
          title="Rather talk it through?"
          action={
            <Button asChild className="rounded-xl">
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                Book a call
              </a>
            </Button>
          }
        >
          <p>Pick a time that suits you with our sales team.</p>
        </Notice>
      )}
      {sent ? (
        <Sent email={form.email} sales onAgain={() => setSent(false)} />
      ) : (
        <form className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-5" onSubmit={submit} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <InputField label="Name" placeholder="Your name" value={form.name} maxLength={120} error={errors.name} onChange={update("name")} />
            <InputField label="Work email" type="email" placeholder="you@company.com" value={form.email} error={errors.email} onChange={update("email")} />
            <InputField label="Company or venue" placeholder="e.g. Eko Hotels" value={form.company} maxLength={160} error={errors.company} onChange={update("company")} />
            <InputField label="Your role (optional)" placeholder="e.g. Head of events" value={form.jobTitle} maxLength={120} onChange={update("jobTitle")} />
            <InputField label="Country (optional)" placeholder="e.g. Nigeria" value={form.country} maxLength={80} onChange={update("country")} />
            <div className="space-y-2">
              <label htmlFor="events-per-year" className="text-sm font-medium text-foreground">
                How many events? (optional)
              </label>
              <select
                id="events-per-year"
                value={form.eventsPerYear}
                onChange={update("eventsPerYear")}
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
              >
                <option value="">Choose one</option>
                {EVENT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <TextareaField
            label="What are you looking for?"
            placeholder="Tell us about your events and what you'd like from Turnupz."
            value={form.message}
            maxLength={5000}
            error={errors.message}
            onChange={update("message")}
          />
          <Button type="submit" className="w-full rounded-xl" loading={sending}>
            Send to sales
          </Button>
        </form>
      )}
    </div>
  );
};

export default memo(ContactUs);
