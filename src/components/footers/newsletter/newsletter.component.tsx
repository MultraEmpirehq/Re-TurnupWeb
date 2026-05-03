import SectionContainer from "@/components/layouts/section-container/section-container";
import InputField from "@/components/ui/input-field";
import React, { memo } from "react";

const NewsLetterComponent = () => {
  return (
    <div className="py-10 bg-linear-to-r from-secondary to-primary">
      <SectionContainer className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-6">
        <div className="flex flex-col gap-2 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-medium">
            Subscribe to our newsletter
          </h1>
          <p className="text-xs sm:text-sm opacity-70">
            Receive our weekly newsletter & updates with new events from your
            favourite organizers & venues.
          </p>
        </div>

        <div className="flex flex-col gap-2 max-w-sm w-full">
          <InputField
            type="email"
            placeholder="Enter your email"
            inputClassName="bg-white text-sm md:text-base py-3 md:py-5"
            className=""
          />
        </div>
      </SectionContainer>
    </div>
  );
};

export default memo(NewsLetterComponent);
