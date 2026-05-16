import { AuthImage } from "@/assets/images";
import { LogoWhiteSVG } from "@/assets/svg";
import RedirectIfAuthenticated from "@/components/auth/redirect-if-authenticated";
import CustomImageComponent from "@/components/ui/custom-image.component";
import { ROUTES } from "@/lib/variables";
import Image from "next/image";
import Link from "next/link";
import React, { memo } from "react";

const LayoutPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RedirectIfAuthenticated>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-screen items-stretch w-full">
        <div className="p-6 relative">
          <div className="size-full relative rounded-2xl overflow-hidden">
            <CustomImageComponent
              src={AuthImage}
              alt="banner"
              fill
              className="size-full"
              imageClassName="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#05B5FF]/60 via-[#05B5FF]/30 to-[#A855F7]/80 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#A855F7]/60" />
            <Link
              href={ROUTES.HOME.href}
              className="absolute inset-0 flex items-center justify-center"
              aria-label="Go to homepage"
            >
              <Image src={LogoWhiteSVG} alt="logo" className="w-24 h-auto" />
            </Link>
          </div>
        </div>
        <div className="">{children}</div>
      </div>
    </RedirectIfAuthenticated>
  );
};

export default memo(LayoutPage);
