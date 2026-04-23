import { AuthImage } from "@/assets/images";
import CustomImageComponent from "@/components/ui/custom-image.component";
import React, { memo } from "react";

const AboutBanner = () => {
  return (
    <div className="relative h-[45vh] min-h-[320px] max-h-[520px] w-full overflow-hidden">
      <CustomImageComponent
        src={AuthImage}
        alt="About Us"
        fill
        className="rounded-none"
        imageClassName="object-cover object-center"
      />
      <div className="absolute inset-0 bg-linear-to-r from-[#05B5FF]/70 via-transparent to-[#A855F7]/70 mix-blend-multiply" />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-[clamp(2rem,6vw,4rem)] font-bold text-white">
          About Us
        </h1>
      </div>
    </div>
  );
};

export default memo(AboutBanner);
