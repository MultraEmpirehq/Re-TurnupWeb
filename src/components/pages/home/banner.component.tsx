import SectionContainer from "@/components/layouts/section-container/section-container";
import CustomImageComponent from "@/components/ui/custom-image.component";
import React, { memo } from "react";

const HomeBannerComponent = () => {
  return (
    <div className="py-10 md:py-16">
      <SectionContainer>
        <div className="w-full aspect-video bg-cover relative rounded-lg overflow-hidden">
          <CustomImageComponent
            src={""}
            alt="banner"
            fill
            className="rounded-none"
            imageClassName="object-cover object-center"
          />
          <div className="size-full bg-black/60 z-10 flex-col flex text-center gap-6 items-center justify-center relative">
            <h1 className="text-[clamp(1.1rem,5vw,2.5rem)] font-bold text-white">
              Discover Amazing Events
            </h1>
            <p className="text-white opacity-70">
              Download the Turnupz App to find and book the perfect events that
              match your interests
            </p>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
};

export default memo(HomeBannerComponent);
