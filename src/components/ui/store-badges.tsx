import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/app-links";
import { cn } from "@/lib/utils";
import React, { memo } from "react";

export const AppleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cn("size-6 shrink-0", className)}
    aria-hidden="true"
  >
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

export const GooglePlayIcon: React.FC<{ className?: string }> = ({
  className,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cn("size-6 shrink-0", className)}
    aria-hidden="true"
  >
    <path d="M3.609 1.814 13.792 12 3.609 22.186a.996.996 0 0 1-.609-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893 2.302 2.302-10.937 6.29 8.635-8.592zM15.864 8.81l-2.3 2.3-8.632-8.588L15.864 8.81zm3.888 2.247c.54.315.54 1.125 0 1.44l-2.687 1.548-2.608-2.608 2.608-2.608 2.687 1.228z" />
  </svg>
);

const Badge: React.FC<{
  href: string;
  icon: React.ReactNode;
  caption: string;
  label: string;
  tone: "dark" | "light";
}> = ({ href, icon, caption, label, tone }) => {
  const className = cn(
    "group flex min-w-[150px] items-center gap-2.5 rounded-2xl px-3.5 py-2.5 transition-all duration-300",
    tone === "dark"
      ? "bg-secondary-950 text-white ring-1 ring-white/10"
      : "bg-white text-secondary-950 ring-1 ring-black/5",
    href
      ? "hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(2,6,23,0.6)]"
      : "cursor-default opacity-90",
  );
  const body = (
    <>
      {icon}
      <span className="text-left leading-tight">
        <span className="block text-[10px] tracking-wide uppercase opacity-70">
          {caption}
        </span>
        <span className="block text-sm font-semibold">{label}</span>
      </span>
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {body}
    </a>
  ) : (
    <span className={className}>
      {body}
    </span>
  );
};

/** App Store and Google Play badges, linked once the store urls are set. */
const StoreBadges: React.FC<{
  tone?: "dark" | "light";
  className?: string;
}> = ({ tone = "dark", className }) => (
  <div className={cn("flex flex-wrap gap-3", className)}>
    <Badge
      href={APP_STORE_URL}
      icon={<AppleIcon />}
      caption="Download on the"
      label="App Store"
      tone={tone}
    />
    <Badge
      href={PLAY_STORE_URL}
      icon={<GooglePlayIcon />}
      caption="Get it on"
      label="Google Play"
      tone={tone}
    />
  </div>
);

export default memo(StoreBadges);
