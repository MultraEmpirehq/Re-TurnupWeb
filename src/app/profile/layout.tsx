"use client";

import RequireAuth from "@/components/auth/require-auth";
import SectionContainer from "@/components/layouts/section-container/section-container";
import React, { memo } from "react";

/**
 * The attendee account area. Its pages are reached from the account menu in the
 * header, so there's no second menu here; each page gives the room to its content.
 */
const ProfileLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <RequireAuth>
    <SectionContainer className="py-8 sm:py-10">
      <main className="mx-auto w-full max-w-6xl min-w-0">{children}</main>
    </SectionContainer>
  </RequireAuth>
);

export default memo(ProfileLayout);
