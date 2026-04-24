"use client";
import React, { memo } from "react";

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default memo(AppLayout);
