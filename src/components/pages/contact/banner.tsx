import { ContactUsBanner } from "@/assets/images";
import SectionContainer from "@/components/layouts/section-container/section-container";
import CustomImageComponent from "@/components/ui/custom-image.component";
import React, { memo } from "react";

/**
 * The top of Contact Us: a crowd with phones up (photo: Unsplash, free
 * licence); the ways in overlap its bottom edge.
 */
const Banner = () => {
  return (
    <div className="relative w-full overflow-hidden bg-slate-950">
      <CustomImageComponent
        src={ContactUsBanner}
        alt=""
        fill
        loading="eager"
        sizes="100vw"
        className="rounded-none"
        imageClassName="object-cover object-[center_35%]"
      />
      <div className="relative z-10 bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/75">
        <SectionContainer className="flex flex-col items-center gap-4 pt-20 pb-32 text-center md:pt-28 md:pb-44">
          <p className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase ring-1 ring-white/20 backdrop-blur">
            Contact us
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            How can we help?
          </h1>
          <p className="max-w-xl text-base text-white/85 sm:text-lg">
            Heading to an event or running one, real people are here to help.
            Pick what fits and we&apos;ll take it from there.
          </p>
        </SectionContainer>
      </div>
    </div>
  );
};

export default memo(Banner);
