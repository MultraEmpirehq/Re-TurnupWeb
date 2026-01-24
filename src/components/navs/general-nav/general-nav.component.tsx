"use client";
import { LogoWhiteSVG } from "@/assets/svg";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { getRoutesByType } from "@/lib/functions";
import { ROUTE_TYPE } from "@/lib/types";
import { ROUTES } from "@/lib/variables";
import Image from "next/image";
import Link from "next/link";
import React, { memo } from "react";

const navLinks = getRoutesByType(ROUTE_TYPE.NAV_ROUTE);

const GeneralNavComponent = () => {
  return (
    <div className="py-3 bg-linear-to-r from-secondary to-primary sticky top-0 z-9999">
      <SectionContainer className="flex flex-row items-center justify-between">
        <Link href={ROUTES.HOME.href}>
          <Image src={LogoWhiteSVG} alt="logo" className="h-8" />
        </Link>

        <NavigationMenu>
          <NavigationMenuList className="text-white">
            {navLinks.map((link) => (
              <NavigationMenuItem key={link.href} className="">
                <NavigationMenuLink asChild>
                  <Link href={link.href}>{link.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="">
          <Button variant={"secondary"} className="text-white">
            Create Event
          </Button>
          <Button variant={"secondary"} className="text-white">
            Logout
          </Button>
        </div>
      </SectionContainer>
    </div>
  );
};

export default memo(GeneralNavComponent);
