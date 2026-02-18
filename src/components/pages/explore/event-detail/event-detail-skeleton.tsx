"use client";

import React, { memo } from "react";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Skeleton } from "@/components/ui/skeleton";

const EventDetailSkeleton = () => (
  <SectionContainer className="space-y-14 py-14">
    <div className="space-y-4 w-full">
      <Skeleton className="w-full aspect-video max-h-[500px] rounded-lg" />
      <div className="flex flex-col gap-4">
        <Skeleton className="w-2/3 h-8 rounded-lg" />
        <Skeleton className="w-1/2 h-4 rounded-lg" />
      </div>
    </div>
    <div className="space-y-4">
      <Skeleton className="w-1/4 h-5 rounded-lg" />
      <Skeleton className="w-full h-4 rounded-lg" />
      <Skeleton className="w-full h-4 rounded-lg" />
    </div>
    <div className="space-y-4">
      <Skeleton className="w-1/4 h-5 rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video rounded-lg" />
        ))}
      </div>
    </div>
  </SectionContainer>
);

export default memo(EventDetailSkeleton);
