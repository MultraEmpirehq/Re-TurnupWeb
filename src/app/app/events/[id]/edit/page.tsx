import VendorEventEdit from "@/components/pages/app/vendor-event-edit";
import React from "react";

const VendorEventEditPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  return <VendorEventEdit id={id} />;
};

export default VendorEventEditPage;
