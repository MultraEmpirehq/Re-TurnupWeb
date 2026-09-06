import VendorEventView from "@/components/pages/app/vendor-event-view";
import React from "react";

const VendorEventPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  return <VendorEventView id={id} />;
};

export default VendorEventPage;
