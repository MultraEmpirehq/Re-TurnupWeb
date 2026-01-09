import BannerComponent from "@/components/pages/explore/banner.component";
import ExploreContentComponent from "@/components/pages/explore/explore-content.component";
import React, { memo } from "react";

const ExplorePage = () => {
  return (
    <div className="">
      <BannerComponent />
      <ExploreContentComponent />
    </div>
  );
};

export default memo(ExplorePage);
