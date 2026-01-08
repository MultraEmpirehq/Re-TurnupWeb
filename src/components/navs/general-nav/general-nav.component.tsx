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
import Image from "next/image";
import Link from "next/link";
import React, { memo } from "react";

const GeneralNavComponent = () => {
  return (
    <div className="py-3 bg-linear-to-r from-secondary via- to-primary">
      <SectionContainer className="flex flex-row items-center justify-between">
        <Image src={LogoWhiteSVG} alt="logo" className="h-8" />

        <NavigationMenu>
          <NavigationMenuList className="text-white">
            <NavigationMenuItem className="">
              <NavigationMenuLink asChild>
                <Link href="/">Explore</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem className="">
              <NavigationMenuLink asChild>
                <Link href="/contact">Contact</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem className="">
              <NavigationMenuLink asChild>
                <Link href="/auth">Login</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem className="">
              <NavigationMenuLink asChild>
                <Link href="/auth">Signup</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
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
