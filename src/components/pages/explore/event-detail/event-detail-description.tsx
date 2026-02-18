"use client";

import React, { memo } from "react";

interface EventDetailDescriptionProps {
  description?: string;
  additionalInformation?: string[];
}

const EventDetailDescription = ({
  description,
  additionalInformation,
}: EventDetailDescriptionProps) => (
  <>
    {description && (
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Event Description</h3>
        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
          <p className="whitespace-pre-wrap">{description}</p>
        </div>
      </section>
    )}
    {additionalInformation && additionalInformation.length > 0 && (
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Additional Information</h3>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          {additionalInformation.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </section>
    )}
  </>
);

export default memo(EventDetailDescription);
