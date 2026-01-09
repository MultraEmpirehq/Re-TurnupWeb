"use client";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import Image from "next/image";
import React, { memo, useState } from "react";
import dynamic from "next/dynamic";
// import { Player } from "@lottiefiles/react-lottie-player";
import { BrokenLinkAnimation, LoadingImageAnimation } from "@/assets/lotties";

const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  {
    ssr: false,
  }
);

const imageVariantClassName = cva("relative rounded-lg overflow-hidden", {
  variants: {
    size: {
      sm: "w-24",
      md: "w-28",
      lg: "w-32",
      xl: "w-36",
    },
  },
  defaultVariants: {
    size: "md",
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
    { size, src, alt, imageClassName, loading = "lazy", className, ...props },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    return (
      <div className={cn(imageVariantClassName({ size }), className)}>
        {src && (
          <Image
            className={cn(
              "size-full",
              (!isLoaded || hasError) && "invisible",
              imageClassName
            )}
            ref={ref}
            src={src}
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
        {!isLoaded && !hasError && src && (
          <div className="size-full bg-gray-100 dark:bg-white/5 flex flex-col items-center justify-center absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
            <Player
              autoplay
              loop
              src={LoadingImageAnimation}
              className=" w-[20%] min-w-[50px]"
            ></Player>
          </div>
        )}
        {(hasError || !src) && (
          <div className="size-full bg-gray-100 dark:bg-white/5 flex flex-col items-center justify-center absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
            <Player
              autoplay
              loop
              src={BrokenLinkAnimation}
              className=" w-[20%] min-w-[50px]"
            ></Player>
          </div>
        )}
      </div>
    );
  }
);

CustomImageComponent.displayName = "CustomImageComponent";

export default memo(CustomImageComponent);
