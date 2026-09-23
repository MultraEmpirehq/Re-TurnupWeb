import VerificationDetails from "@/components/pages/app/admin/verifications/verification-details";
import React from "react";

export const dynamic = "force-dynamic";

const AdminVerificationPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  return <VerificationDetails id={id} />;
};

export default AdminVerificationPage;
