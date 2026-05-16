import { ContactUsBanner } from "@/assets/images";
import SectionContainer from "@/components/layouts/section-container/section-container";
import CustomImageComponent from "@/components/ui/custom-image.component";
import React, { memo } from "react";

const Banner = () => {
  return (
    <div className="aspect-video bg-cover relative overflow-hidden max-h-[400px] w-full">
      <CustomImageComponent
        src={ContactUsBanner}
        alt="banner"
        fill
        className="rounded-none"
        imageClassName="object-cover object-center"
      />
      <div className="size-full bg-black/50 z-10 relative">
        <SectionContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          <div className=""></div>
          <div className="h-full flex flex-col items-center justify-center">
            <h1 className="text-[clamp(1.1rem,5vw,2.5rem)] font-bold text-white">
              Contact Us
            </h1>
          </div>
        </SectionContainer>
      </div>
    </div>
  );
};

export default memo(Banner);
