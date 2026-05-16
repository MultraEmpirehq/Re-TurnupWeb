import { HomepageBanner } from "@/assets/images";
import SectionContainer from "@/components/layouts/section-container/section-container";
import CustomImageComponent from "@/components/ui/custom-image.component";
import React, { memo } from "react";

const HomeBannerComponent = () => {
  return (
    <div className="py-10 md:py-16">
      <SectionContainer>
        <div className="w-full aspect-4/5 sm:aspect-16/10 md:aspect-video bg-cover relative rounded-lg overflow-hidden">
          <CustomImageComponent
            src={HomepageBanner}
            alt="banner"
            fill
            className="rounded-none"
            imageClassName="object-cover object-center"
          />
          <div className="size-full bg-black/60 z-10 flex-col flex text-center gap-3 md:gap-6 items-center justify-center relative px-6">
            <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white">
              Discover Amazing Events
            </h1>
            <p className="text-white opacity-70 text-sm md:text-base max-w-md md:max-w-xl">
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
