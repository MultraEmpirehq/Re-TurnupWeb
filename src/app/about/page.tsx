import AboutBanner from "@/components/pages/about/banner";
import AboutContent from "@/components/pages/about/about-content";
import GetTheApp from "@/components/pages/about/get-the-app";
import React, { memo } from "react";

const AboutUsPage = () => {
  return (
    <div>
      <AboutBanner />
      <AboutContent />
      <GetTheApp />
    </div>
  );
};

export default memo(AboutUsPage);
