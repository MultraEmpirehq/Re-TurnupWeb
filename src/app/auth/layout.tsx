import CustomImageComponent from "@/components/ui/custom-image.component";
import React, { memo } from "react";

const LayoutPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-screen items-stretch w-full">
      <div className="p-6 relative">
        <div className="size-full relative">
          <CustomImageComponent
            src={""}
            alt="banner"
            fill
            className="size-full"
            imageClassName="object-cover object-center"
          />
        </div>
      </div>
      <div className="">{children}</div>
    </div>
  );
};

export default memo(LayoutPage);
