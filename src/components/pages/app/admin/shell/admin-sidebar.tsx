"use client";

import { LogoWhiteSVG } from "@/assets/svg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { useAdminPendingCounts } from "@/hooks/use-admin-dashboard";
import { cn } from "@/lib/utils";
import useScrollFade from "@/hooks/use-scroll-fade";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import { ChevronDown, LogOut } from "lucide-react";
import Image from "next/image";
import useSignOut from "@/hooks/use-sign-out";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, {
  Fragment,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ADMIN_NAV_GROUPS,
  isAdminNavItemActive,
  TAdminNavItem,
  visibleAdminNavGroups,
} from "./admin-nav";

const activeGroupLabel = (pathname: string) =>
  ADMIN_NAV_GROUPS.find((group) =>
    group.items.some((item) => isAdminNavItemActive(pathname, item)),
  )?.label;

const AdminSidebar: React.FC<{ className?: string }> = ({ className }) => {
  const pathname = usePathname();
  const userDetails = useUserStore((state) => state.userDetails);
  const handleLogout = useSignOut();
  const navRef = useRef<HTMLElement>(null);
  const fade = useScrollFade(navRef);
  const { has, isLoading: isLoadingPermissions } = useAdminPermissions();
  // Until permissions arrive only the links every admin can use are shown, so a
  // link never appears and then vanishes.
  const navGroups = useMemo(
    () =>
      visibleAdminNavGroups((permission) =>
        isLoadingPermissions ? !permission : has(permission),
      ),
    [has, isLoadingPermissions],
  );
  const firstDepartment = navGroups.find((group) => group.department);

  // What's waiting in each queue; the api leaves out the ones they can't work on.
  const { data: pending, refetch: refetchPending } = useAdminPendingCounts(
    !isLoadingPermissions,
  );
  // Coming back from a queue usually means something in it was dealt with.
  useEffect(() => {
    void refetchPending();
  }, [pathname, refetchPending]);
  const pendingFor = (item: TAdminNavItem) =>
    item.pendingKey ? (pending?.[item.pendingKey] ?? 0) : 0;

  // Departments start collapsed except the one holding the current page, and
  // opening a page elsewhere expands its department so the active link is visible.
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const label = activeGroupLabel(pathname);
    return new Set(label ? [label] : []);
  });
  const [expandedFor, setExpandedFor] = useState(pathname);
  if (expandedFor !== pathname) {
    setExpandedFor(pathname);
    const label = activeGroupLabel(pathname);
    if (label && !expandedGroups.has(label)) {
      setExpandedGroups(new Set(expandedGroups).add(label));
    }
  }

  const toggleGroup = (label: string) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const renderItem = (item: TAdminNavItem) => {
    const isActive = isAdminNavItemActive(pathname, item);
    const Icon = item.icon;
    const badge = pendingFor(item);

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
            aria-label={`${badge} waiting`}
          >
            {badge}
          </span>
        )}
      </Link>
    );
  };

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

  return (
    <aside
      className={cn(
        "flex w-[248px] shrink-0 flex-col gap-1 border-r border-border bg-white px-4 pb-4",
        className,
      )}
    >
      <div className="-mx-4 mb-3 flex h-[70px] shrink-0 items-center gap-3 border-b border-border/60 px-5">
        <Link
          href={ROUTES.ADMIN_OVERVIEW.href}
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
          ADMIN
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <nav
          ref={navRef}
          className="scrollbar-none flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
        >
          {navGroups.map((group) => {
            if (!group.department) {
              return (
                <Fragment key={group.label}>
                  <p className="px-[11px] pt-2.5 pb-0.5 text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                    {group.label}
                  </p>
                  {group.items.map(renderItem)}
                </Fragment>
              );
            }

            const { icon: DepartmentIcon, accentClassName } = group.department;
            const isExpanded = expandedGroups.has(group.label);
            const isGroupActive = group.items.some((item) =>
              isAdminNavItemActive(pathname, item),
            );
            // A collapsed department still shows what's waiting inside it.
            const groupBadge = group.items.reduce(
              (sum, item) => sum + pendingFor(item),
              0,
            );
            const listId = `admin-nav-${group.label.toLowerCase().replace(/\s+/g, "-")}`;

            return (
              <div key={group.label} className="flex flex-col gap-1 pt-1">
                {group.label === firstDepartment?.label && (
                  <p className="px-[11px] pt-2.5 pb-0.5 text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                    Departments
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={isExpanded}
                  aria-controls={listId}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[10px] px-[7px] py-1.5 text-left text-sm font-semibold transition-colors duration-100 ease-out",
                    isGroupActive
                      ? "text-secondary-800"
                      : "text-foreground hover:bg-muted",
                    isGroupActive && !isExpanded && "bg-secondary-50",
                    isGroupActive && isExpanded && "hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg",
                      accentClassName,
                    )}
                  >
                    <DepartmentIcon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {group.label}
                    {isGroupActive && (
                      <span className="sr-only"> (current section)</span>
                    )}
                  </span>
                  {!isExpanded && groupBadge > 0 && (
                    <span
                      className="shrink-0 rounded-full bg-primary px-[7px] py-[3px] text-xs font-semibold text-white"
                      aria-label={`${groupBadge} awaiting review`}
                    >
                      {groupBadge}
                    </span>
                  )}
                  {!isExpanded && isGroupActive && groupBadge === 0 && (
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-secondary-800"
                      aria-hidden
                    />
                  )}
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-150",
                      isExpanded && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                {isExpanded && (
                  <div
                    id={listId}
                    className="ml-[21px] flex flex-col gap-1 border-l border-border pl-2"
                  >
                    {group.items.map(renderItem)}
                  </div>
                )}
              </div>
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
