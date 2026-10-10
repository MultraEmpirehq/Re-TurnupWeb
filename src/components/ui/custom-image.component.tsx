"use client";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import React, { memo, useState } from "react";

const imageVariantClassName = cva("relative rounded-lg overflow-hidden", {
  variants: {
    size: {
      sm: "w-24",
      md: "w-28",
      lg: "w-32",
      xl: "w-36",
    },
    hasFill: {
      true: "size-full absolute top-0 left-0",
      false: "",
    },
  },
  defaultVariants: {
    size: "md",
    hasFill: false,
  },
});

const CustomImageComponent = React.forwardRef<
  HTMLImageElement,
  {
    size?: "sm" | "md" | "lg" | "xl";
    alt: string;
    imageClassName?: string;
    className?: string;
  } & React.ComponentPropsWithoutRef<typeof Image>
>(
  (
    {
      size,
      src,
      alt,
      imageClassName,
      loading = "lazy",
      className,
      fill,
      ...props
    },
    ref,
  ) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    return (
      <div
        className={cn(
          imageVariantClassName({ size, hasFill: !!fill }),
          className,
        )}
      >
        {src && (
          <Image
            className={cn(
              "size-full",
              (!isLoaded || hasError) && "invisible",
              imageClassName,
            )}
            ref={ref}
            src={src}
            fill={fill}
            alt={alt}
            onLoad={() => {
              setIsLoaded(true);
            }}
            onError={() => {
              setHasError(true);
            }}
            loading={loading}
            {...props}
          />
        )}
        {/* Plain CSS rather than an animation player per image: a page of cards
            would otherwise run dozens of them on the phone's main thread. */}
        {!isLoaded && !hasError && src && (
          <div
            aria-hidden
            className="absolute inset-0 animate-pulse bg-gray-100 dark:bg-white/5"
          />
        )}
        {(hasError || !src) && (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-300 dark:bg-white/5 dark:text-white/20"
          >
            <ImageOff className="size-[20%] min-h-5 min-w-5 max-h-10 max-w-10" />
          </div>
        )}
      </div>
    );
  },
);

CustomImageComponent.displayName = "CustomImageComponent";

export default memo(CustomImageComponent);
