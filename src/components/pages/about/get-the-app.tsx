import SectionContainer from "@/components/layouts/section-container/section-container";
import StoreBadges from "@/components/ui/store-badges";
import React, { memo } from "react";

const GetTheApp = () => {
  return (
    <div className="bg-gradient-to-r from-[#05B5FF] to-[#0577FA] relative overflow-hidden py-12 md:py-16">
      <SectionContainer className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4 text-white">
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight">
            Get The Turnupz App Today!
          </h2>
          <p className="opacity-90">
            Discover. Create. Experience. Anytime, Anywhere.
          </p>
          <StoreBadges className="pt-4" />
        </div>
      </SectionContainer>
    </div>
  );
};

export default memo(GetTheApp);
