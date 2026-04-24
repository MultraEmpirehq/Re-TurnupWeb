import SectionContainer from "@/components/layouts/section-container/section-container";
import React, { memo } from "react";

const AppleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="size-6 shrink-0"
    aria-hidden="true"
  >
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const GooglePlayIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="size-6 shrink-0"
    aria-hidden="true"
  >
    <path d="M3.609 1.814 13.792 12 3.609 22.186a.996.996 0 0 1-.609-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893 2.302 2.302-10.937 6.29 8.635-8.592zM15.864 8.81l-2.3 2.3-8.632-8.588L15.864 8.81zm3.888 2.247c.54.315.54 1.125 0 1.44l-2.687 1.548-2.608-2.608 2.608-2.608 2.687 1.228z" />
  </svg>
);

const StoreBadge: React.FC<{
  icon: React.ReactNode;
  caption: string;
  label: string;
}> = ({ icon, caption, label }) => (
  <button
    type="button"
    className="flex items-center gap-3 rounded-lg bg-black text-white px-4 py-2.5 min-w-[160px] hover:opacity-90 transition-opacity"
  >
    {icon}
    <div className="text-left leading-tight">
      <div className="text-[10px] uppercase opacity-80">{caption}</div>
      <div className="text-sm font-semibold">{label}</div>
    </div>
  </button>
);

const GetTheApp = () => {
  return (
    <div className="bg-gradient-to-r from-[#05B5FF] via-[#8B5CF6] to-[#EC4899] relative overflow-hidden py-12 md:py-16">
      <SectionContainer className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4 text-white">
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight">
            Get The Turnupz App Today!
          </h2>
          <p className="opacity-90">
            Discover. Create. Experience. Anytime, Anywhere.
          </p>
          <div className="flex flex-wrap gap-3 pt-4">
            <StoreBadge
              icon={<GooglePlayIcon />}
              caption="Get it on"
              label="Google Play"
            />
            <StoreBadge
              icon={<AppleIcon />}
              caption="Download on the"
              label="App Store"
            />
          </div>
        </div>
      </SectionContainer>
    </div>
  );
};

export default memo(GetTheApp);
