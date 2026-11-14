"use client";

import PageHeader from "@/components/ui/page-header";
import SegmentedControl from "@/components/ui/segmented-control";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { memo } from "react";
import InfluencerCodes from "./influencer-codes";
import Referrals from "./referrals";

type TTab = "overview" | "codes" | "joined";
const TABS: { value: TTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "codes", label: "Influencer codes" },
  { value: "joined", label: "Who joined" },
];
const isTab = (value: string | null): value is TTab =>
  TABS.some((tab) => tab.value === value);

/**
 * Friend invites and influencer codes, managed in one place: the switches and
 * totals, the codes you give influencers, and everyone who joined with a code.
 * The tab and filter are in the address (?tab=joined&source=influencer), so a
 * link opens the right view.
 */
const ReferralsHub = () => {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // The address is the one source of truth, so a copied link opens the same view.
  const fromUrl = params.get("tab");
  const tab: TTab = isTab(fromUrl) ? fromUrl : "overview";
  const joinedSource =
    params.get("source") === "influencer" ? "INFLUENCER" : undefined;

  const choose = (next: TTab, source?: "influencer") => {
    const query = new URLSearchParams();
    if (next !== "overview") query.set("tab", next);
    if (source) query.set("source", source);
    router.replace(`${pathname}${query.size ? `?${query}` : ""}`, {
      scroll: false,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referrals"
        description="Friends invite with their username; influencers with a code you give them. All rewards on an order together are at most 20% of Turnupz's commission on it, and each has its own maximum."
      />
      <SegmentedControl
        label="Referrals view"
        value={tab}
        onChange={(next) => choose(next)}
        options={TABS}
      />
      {tab === "overview" && <Referrals part="overview" />}
      {tab === "codes" && (
        <InfluencerCodes
          onSeeReferrals={() => choose("joined", "influencer")}
        />
      )}
      {tab === "joined" && (
        <Referrals
          key={joinedSource ?? "all"}
          part="list"
          initialSource={joinedSource}
        />
      )}
    </div>
  );
};

export default memo(ReferralsHub);
