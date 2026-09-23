"use client";

import { LogoWhiteSVG } from "@/assets/svg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAdminVerifications } from "@/hooks/use-admin-verifications";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { Fragment, memo, useMemo } from "react";
import { ADMIN_NAV_GROUPS, isAdminNavItemActive } from "./admin-nav";

const AdminSidebar: React.FC<{ className?: string }> = ({ className }) => {
  const pathname = usePathname();
  const router = useRouter();
  const userDetails = useUserStore((state) => state.userDetails);
  const clearStore = useUserStore((state) => state.clearStore);

  // Same query the verifications page opens on, so the badge and the list share a
  // cache entry and agree with each other.
  const { data: pending } = useAdminVerifications({
    status: "submitted",
    search: "",
    page: 1,
  });
  const pendingCount = pending?.pagination?.total ?? 0;

  const displayName = useMemo(() => {
    const fromParts = [userDetails?.firstName, userDetails?.lastName]
      .filter(Boolean)
      .join(" ");
    return userDetails?.name?.trim() || fromParts || "Admin";
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

  const handleLogout = () => {
    clearStore();
    router.push(ROUTES.HOME.href);
  };

  return (
    <aside
      className={cn(
        "flex w-[248px] shrink-0 flex-col gap-1 border-r border-border bg-white px-4 py-4",
        className,
      )}
    >
      <div className="flex items-center gap-3 px-1 pt-0.5 pb-4">
        <Link
          href={ROUTES.ADMIN_OVERVIEW.href}
          className="flex h-10 items-center rounded-xl bg-linear-to-r from-secondary to-primary px-3"
        >
          <Image src={LogoWhiteSVG} alt="Turnupz" className="h-6 w-auto" priority />
        </Link>
        <span className="rounded-full bg-secondary-50 px-2 py-1 text-[11px] font-bold tracking-wide text-secondary-700">
          ADMIN
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {ADMIN_NAV_GROUPS.map((group) => (
          <Fragment key={group.label}>
            <p className="px-[11px] pt-2.5 pb-0.5 text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive = isAdminNavItemActive(pathname, item);
              const Icon = item.icon;
              const badge = item.showsPendingVerifications ? pendingCount : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[10px] px-[11px] py-2.5 text-sm transition-colors duration-100 ease-out",
                    isActive
                      ? "bg-secondary-50 font-semibold text-secondary-800"
                      : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-[18px] shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {badge > 0 && (
                    <span
                      className="shrink-0 rounded-full bg-primary px-[7px] py-[3px] text-xs font-semibold text-white"
                      aria-label={`${badge} awaiting review`}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </Fragment>
        ))}
      </nav>

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
            {userDetails?.email ?? "Administrator"}
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

export default memo(AdminSidebar);
