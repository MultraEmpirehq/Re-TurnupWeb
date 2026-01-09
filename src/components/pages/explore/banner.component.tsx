import SectionContainer from "@/components/layouts/section-container/section-container";
import CustomImageComponent from "@/components/ui/custom-image.component";
import InputField from "@/components/ui/input-field";
import { SearchIcon } from "lucide-react";
import React, { memo } from "react";

const ExploreBannerComponent = () => {
  return (
    <div className="aspect-video bg-cover relative rounded-lg overflow-hidden max-h-[700px] w-full">
      <CustomImageComponent
        src={""}
        alt="banner"
        fill
        imageClassName="object-cover object-center"
      />
      <div className="size-full bg-black/50 z-10 relative">
        <SectionContainer className="flex-col flex text-center gap-6 items-center justify-center h-full">
          <h1 className="text-[clamp(1.1rem,5vw,2.5rem)] font-bold text-white">
            Explore a world of events. Find what excites you!
          </h1>
          <InputField
            placeholder="Search for events, venues, categories, or organizers"
            inputClassName="bg-white text-white placeholder:text-white py-6"
            className="w-full max-w-[600px]"
            leftIcon={<SearchIcon className="size-4" />}
          />
        </SectionContainer>
      </div>
    </div>
  );
};

export default memo(ExploreBannerComponent);
