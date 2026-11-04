import { cn } from "@/lib/utils";
import { Facebook, Instagram, Linkedin, LucideProps, Youtube } from "lucide-react";
import React, { memo } from "react";

// Drawn in the same line style as the lucide icons beside them.
const XIcon = (props: LucideProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 4l16 16M20 4L4 20" />
  </svg>
);
const TikTokIcon = (props: LucideProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 12a4 4 0 1 0 4 4V3c.6 2.7 2.6 4.6 5.5 5" />
  </svg>
);

/** Turnupz's own accounts. The same list goes in the emails (server env). */
export const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/turnupzhq", icon: Instagram },
  { label: "TikTok", href: "https://www.tiktok.com/@turnupzhq", icon: TikTokIcon },
  { label: "X", href: "https://x.com/turnupzhq", icon: XIcon },
  { label: "Facebook", href: "https://www.facebook.com/share/1Co2UHjUTU/", icon: Facebook },
  { label: "YouTube", href: "https://www.youtube.com/@turnupzhq", icon: Youtube },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/turnupz/", icon: Linkedin },
] as const;

/** A row of round icon links to Turnupz on social media. */
const SocialLinks = ({ className }: { className?: string }) => (
  <ul className={cn("flex flex-wrap items-center gap-2", className)} aria-label="Turnupz on social media">
    {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
      <li key={label}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Turnupz on ${label}`}
          className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <Icon className="size-4" aria-hidden />
        </a>
      </li>
    ))}
  </ul>
);

export default memo(SocialLinks);
