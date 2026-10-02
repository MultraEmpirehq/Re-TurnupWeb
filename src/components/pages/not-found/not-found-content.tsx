"use client";

import { HomepageBanner } from "@/assets/images";
import { BrokenLinkAnimation } from "@/assets/lotties";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import CustomImageComponent from "@/components/ui/custom-image.component";
import { ROUTES } from "@/lib/variables";
import { ArrowLeft, Compass, Home } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { memo } from "react";

const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  {
    ssr: false,
  },
);

const NotFoundContent = () => {
  const router = useRouter();

  const handleGoBack = () => {
    // Someone landing here from an outside link has no history to go back to.
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(ROUTES.HOME.href);
    }
  };

  return (
    <div className="py-10 md:py-16">
      <SectionContainer>
        <div className="relative w-full min-h-[520px] md:min-h-[600px] rounded-lg overflow-hidden">
          <CustomImageComponent
            src={HomepageBanner}
            alt="Crowd at an event"
            fill
            className="rounded-none"
            imageClassName="object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-r from-[#05B5FF]/70 via-transparent to-[#A855F7]/70 mix-blend-multiply" />
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative z-10 flex min-h-[520px] md:min-h-[600px] flex-col items-center justify-center gap-6 px-6 py-12 text-center text-white">
            <Player
              autoplay
              loop
              src={BrokenLinkAnimation}
              className="w-[90px] md:w-[110px] overflow-hidden"
            />

            <p className="text-[clamp(4.5rem,16vw,9rem)] font-bold leading-none bg-linear-to-r from-[#05B5FF] via-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
              404
            </p>

            <div className="space-y-3">
              <h1 className="text-xl sm:text-2xl md:text-4xl font-bold">
                This party has moved on
              </h1>
              <p className="mx-auto max-w-md md:max-w-xl text-sm md:text-base opacity-70">
                The page you&apos;re looking for doesn&apos;t exist or may have
                been moved. Let&apos;s get you back to where the action is.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button asChild size="lg" className="min-w-[180px]">
                <Link href={ROUTES.EXPLORE.href}>
                  <Compass />
                  Explore Events
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-w-[180px] border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Link href={ROUTES.HOME.href}>
                  <Home />
                  Back to Home
                </Link>
              </Button>
            </div>

            <Button
              type="button"
              variant="link"
              onClick={handleGoBack}
              className="text-white/80 hover:text-white"
            >
              <ArrowLeft />
              Go back to the previous page
            </Button>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
};

export default memo(NotFoundContent);
