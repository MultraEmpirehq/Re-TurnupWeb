import { redirect } from "next/navigation";

// Buyer sources is now part of the sales funnel page.
const Page = () => redirect("/app/admin/analytics/funnel");

export default Page;
