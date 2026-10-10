import CustomImageComponent from "@/components/ui/custom-image.component";
import { cn } from "@/lib/utils";
import React, { memo } from "react";

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

/** A round picture, or the name's initials on the brand gradient when there's none. */
const PerformerAvatar: React.FC<{
  name: string;
  image?: string | null;
  className?: string;
}> = ({ name, image, className }) => (
  <div
    className={cn(
      "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-secondary to-primary text-white",
      className,
    )}
  >
    {image ? (
      <CustomImageComponent
        src={image}
        alt={name}
        fill
        className="size-full rounded-none"
        imageClassName="object-cover"
      />
    ) : (
      <span className="font-bold">{initialsOf(name)}</span>
    )}
  </div>
);

export default memo(PerformerAvatar);
