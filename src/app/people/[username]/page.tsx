import PersonProfile from "@/components/pages/profile/person-profile";
import React from "react";

export const dynamic = "force-dynamic";

const Page = async ({ params }: { params: Promise<{ username: string }> }) => {
  const { username } = await params;
  return <PersonProfile username={decodeURIComponent(username)} />;
};

export default Page;
