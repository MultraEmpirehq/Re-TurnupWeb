import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/variables";
import { ArrowRight, CalendarDays, Ticket } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

type AuthPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const hrefWithQuery = (
  href: string,
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }
  // Which button they pressed is in the path now.
  query.delete("type");
  const serialized = query.toString();
  return serialized ? `${href}?${serialized}` : href;
};

const firstOf = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const query = await searchParams;
  const attendeeHref = hrefWithQuery(ROUTES.ATTENDEE_LOGIN.href, query);
  const vendorHref = hrefWithQuery(ROUTES.VENDOR_LOGIN.href, query);

  // Sent here to sign in on the way somewhere (a ticket, a follow, the
  // dashboard): no need to ask which door, the destination says.
  const goingTo = firstOf(query.redirect);
  if (goingTo || firstOf(query.email)) {
    redirect(goingTo?.startsWith("/app") ? vendorHref : attendeeHref);
  }

  return (
    <div className="space-y-7">
      <div className="space-y-2 text-center">
        <p className="text-sm font-semibold tracking-wider text-primary uppercase">
          Welcome to Turnupz
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-secondary-950">
          Choose your account
        </h1>
        <p className="text-secondary-950/60">
          Sign in or create an account to find events or host your own.
        </p>
      </div>

      <div className="grid gap-3">
        <Button
          asChild
          className="h-auto min-h-20 justify-between rounded-2xl bg-secondary px-5 py-4 text-left text-white hover:bg-secondary-600"
        >
          <Link href={attendeeHref}>
            <span className="flex items-center gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Ticket className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold">Attendee</span>
                <span className="mt-1 block text-sm font-normal text-white/70">
                  Discover events and get tickets
                </span>
              </span>
            </span>
            <ArrowRight className="size-5 shrink-0" aria-hidden />
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-auto min-h-20 justify-between rounded-2xl border-secondary-200 px-5 py-4 text-left text-secondary-950 hover:bg-secondary-50"
        >
          <Link href={vendorHref}>
            <span className="flex items-center gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold">Event organiser</span>
                <span className="mt-1 block text-sm font-normal text-secondary-950/60">
                  Host events and manage tickets
                </span>
              </span>
            </span>
            <ArrowRight className="size-5 shrink-0" aria-hidden />
          </Link>
        </Button>
      </div>

      <p className="text-center text-xs leading-5 text-secondary-950/50">
        One Turnupz account works for both: organisers buy tickets too, and
        attendees can start hosting any time.
      </p>
    </div>
  );
}
