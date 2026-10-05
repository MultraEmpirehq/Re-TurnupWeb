import SectionContainer from "@/components/layouts/section-container/section-container";
import StoreBadges from "@/components/ui/store-badges";
import { ROUTES } from "@/lib/variables";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";
import FlipTicket from "./flip-ticket";
import Reveal from "./reveal";

const ClosingCta = () => (
  <section className="bg-white py-24 md:py-32">
    <SectionContainer>
      <Reveal className="flex flex-col items-center gap-7 text-center">
        <div className="mb-4">
          <FlipTicket />
        </div>
        <h2 className="max-w-3xl text-4xl font-bold tracking-tight text-secondary-950 md:text-6xl">
          The city&apos;s already{" "}
          <span className="bg-linear-to-r from-secondary to-primary bg-clip-text text-transparent">
            turning up.
          </span>{" "}
          You coming?
        </h2>
        <p className="max-w-md text-secondary-950/60">
          Get the app and never hear about the good one the morning after again.
        </p>
        <StoreBadges className="justify-center" />
        <p className="text-sm text-secondary-950/60">
          Prefer the web?{" "}
          <Link
            href={ROUTES.SIGNUP.href}
            className="font-semibold text-secondary-950 underline-offset-4 hover:underline"
          >
            Create an account
          </Link>{" "}
          or{" "}
          <Link
            href={ROUTES.EXPLORE.href}
            className="group inline-flex items-center gap-1 font-semibold text-secondary-950 underline-offset-4 hover:underline"
          >
            browse events
            <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </p>
      </Reveal>
    </SectionContainer>
  </section>
);

export default memo(ClosingCta);
