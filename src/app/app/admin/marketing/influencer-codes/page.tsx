import { redirect } from "next/navigation";

/** Influencer codes now live on the Referrals page, in their own tab. */
export default function InfluencerCodesPage() {
  redirect("/app/admin/marketing/referrals?tab=codes");
}
