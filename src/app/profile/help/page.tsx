"use client";

import FaqList from "@/components/pages/faq/faq-list";
import React, { memo } from "react";

// Same questions as the public FAQ page.
const HelpPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Help & FAQs</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Find answers to commonly asked questions.
        </p>
      </div>
      <FaqList />
    </div>
  );
};

export default memo(HelpPage);
