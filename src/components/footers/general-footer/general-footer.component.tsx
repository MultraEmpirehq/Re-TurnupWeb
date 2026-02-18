"use client";
import React, { memo } from "react";
import NewsletterComponent from "../newsletter/newsletter.component";
import SectionContainer from "@/components/layouts/section-container/section-container";
import Link from "next/link";
import { getRoutesByType } from "@/lib/functions";
import { ROUTE_TYPE, RouteProps } from "@/lib/types";

interface FooterLinkContentProps {
  title: string;
  links: RouteProps[];
}

const companyInfoLinks = getRoutesByType(ROUTE_TYPE.FOOTER_COMPANY_INFO_ROUTE);
const helpLinks = getRoutesByType(ROUTE_TYPE.FOOTER_HELP_ROUTE);
const categoriesLinks = getRoutesByType(ROUTE_TYPE.FOOTER_CATEGORIES_ROUTE);
const followUsLinks = getRoutesByType(ROUTE_TYPE.FOOTER_FOLLOW_US_ROUTE);

const FooterLinkContent: React.FC<FooterLinkContentProps> = memo(
  ({ title, links }) => {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-medium">{title}</h3>
        <ul className="flex flex-col gap-2 list-none">
          {links.map((link) => (
            <li key={link.href} className="text-sm opacity-60">
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    );
  },
);

FooterLinkContent.displayName = "FooterLinkContent";

const GeneralFooterComponent = () => {
  return (
    <>
      <NewsletterComponent />
      <div className="bg-secondary-950 text-white">
        <SectionContainer className="py-10 flex flex-col md:flex-row md:flex-wrap gap-6 md:justify-between">
          <FooterLinkContent title="Company Info" links={companyInfoLinks} />
          <FooterLinkContent title="Help" links={helpLinks} />
          <FooterLinkContent title="Categories" links={categoriesLinks} />
          <FooterLinkContent title="Follow Us" links={followUsLinks} />
        </SectionContainer>
        <SectionContainer className="border-t border-t-white/30 py-6 text-center text-sm opacity-60">
          <p>&copy; {new Date().getFullYear()} Turn up. All rights reserved.</p>
        </SectionContainer>
      </div>
    </>
  );
};

export default memo(GeneralFooterComponent);
