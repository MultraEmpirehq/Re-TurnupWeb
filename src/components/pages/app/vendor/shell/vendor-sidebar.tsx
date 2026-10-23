"use client";

import { LogoWhiteSVG } from "@/assets/svg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useScrollFade from "@/hooks/use-scroll-fade";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import { Lock, LogOut } from "lucide-react";
import Image from "next/image";
import useSignOut from "@/hooks/use-sign-out";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { memo, useMemo, useRef } from "react";
import { toast } from "sonner";
import useVendorVerificationStatus from "@/hooks/use-vendor-verification-status";
import { useActiveWorkspace } from "@/stores/workspace-store";
import {
  isVendorNavItemActive,
  navItemsFor,
  verificationMessageFor,
} from "./vendor-nav";
import WorkspaceSwitcher from "./workspace-switcher";

const VendorSidebar: React.FC<{ className?: string }> = ({ className }) => {
  const pathname = usePathname();
  const router = useRouter();
  const userDetails = useUserStore((state) => state.userDetails);
  const handleLogout = useSignOut();
  const navRef = useRef<HTMLElement>(null);
  const fade = useScrollFade(navRef);
  const { isApproved, isChecking } = useVendorVerificationStatus();
  // While the check runs the links behave normally; the page guard still catches them.
  const isLocked = !isApproved && !isChecking;
  const workspace = useActiveWorkspace();
  const navItems = useMemo(
    () => navItemsFor(workspace?.permissions ?? null),
    [workspace],
  );

  const displayName = useMemo(() => {
    const fromParts = [userDetails?.firstName, userDetails?.lastName]
      .filter(Boolean)
      .join(" ");
    return userDetails?.name?.trim() || fromParts || "Turnupz Vendor";
  }, [userDetails]);

  const initials = useMemo(
    () =>
      displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "TZ",
    [displayName],
  );

  return (
    <aside
      className={cn(
        "flex w-[248px] shrink-0 flex-col gap-1 border-r border-border bg-white px-4 pb-4",
        className,
      )}
    >
      <div className="-mx-4 mb-3 flex h-[70px] shrink-0 items-center gap-3 border-b border-border/60 px-5">
        <Link
          href={ROUTES.DASHBOARD.href}
          className="flex h-10 items-center rounded-xl bg-linear-to-r from-secondary to-primary px-3"
        >
          <Image
            src={LogoWhiteSVG}
            alt="Turnupz"
            className="h-6 w-auto"
            priority
          />
        </Link>
        <span className="rounded-full bg-secondary-50 px-2 py-1 text-[11px] font-bold tracking-wide text-secondary-700">
          {workspace ? "TEAM" : "VENDOR"}
        </span>
      </div>

      <WorkspaceSwitcher className="mb-2" />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <nav
          ref={navRef}
          className="scrollbar-none flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
        >
          <p className="px-[11px] pt-2.5 pb-0.5 text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
            Workspace
          </p>
          {navItems.map((item) => {
            const isActive = isVendorNavItemActive(pathname, item);
            const Icon = item.icon;
            const itemClassName = cn(
              "flex items-center gap-2.5 rounded-[10px] px-[11px] py-2.5 text-sm transition-colors duration-100 ease-out",
              isActive
                ? "bg-secondary-50 font-semibold text-secondary-800"
                : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            );

            if (isLocked && item.requiresVerification) {
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    toast.error(verificationMessageFor(item));
                    router.push(ROUTES.VENDOR_VERIFICATION.href);
                  }}
                  className={cn(
                    itemClassName,
                    "cursor-pointer text-left opacity-60",
                  )}
                  title="Available once your vendor account is verified"
                >
                  <Icon className="size-[18px] shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <Lock className="size-3.5 shrink-0" aria-hidden />
                  <span className="sr-only">(locked until verified)</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={itemClassName}
              >
                <Icon className="size-[18px] shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        {/* Soft edges stand in for the hidden scrollbar: there is more this way. */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-8 bg-linear-to-b from-white to-transparent transition-opacity duration-150",
            fade.top ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-white to-transparent transition-opacity duration-150",
            fade.bottom ? "opacity-100" : "opacity-0",
          )}
        />
      </div>

      <div className="flex items-center gap-2.5 rounded-xl border border-border p-2.5">
        <Avatar className="size-[34px]">
          <AvatarImage src={userDetails?.avatar} />
          <AvatarFallback className="bg-secondary-800 text-xs font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-semibold text-foreground">
            {displayName}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {userDetails?.email ?? "Vendor account"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Sign out"
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </aside>
  );
};

export default memo(VendorSidebar);
