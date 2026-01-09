import SectionContainer from "@/components/layouts/section-container/section-container";
import CustomImageComponent from "@/components/ui/custom-image.component";
import Image from "next/image";
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
            imageClassName="object-cover object-center"
          />
          <div className="size-full bg-black/50 z-10 flex-col flex text-center gap-6 items-center justify-center">
            <h1 className="text-4xl font-bold text-white">
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
