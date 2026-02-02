"use client";
import BasicForm from "@/components/pages/app/create/basic-form";
import CoverForm from "@/components/pages/app/create/cover-form";
import MediaUploadForm from "@/components/pages/app/create/media-upload-form";
import Steps from "@/components/pages/app/create/steps";
import TicketForm from "@/components/pages/app/create/ticket-form";
import DashboardBanner from "@/components/pages/app/dashboard-banner";
import React, { memo, useState } from "react";

export const dynamic = "force-dynamic";

const CreateEvent = () => {
  const [step, setStep] = useState(1);
  return (
    <div className="space-y-10">
      <DashboardBanner />
      <Steps currentStep={step} />
      {step === 1 && <BasicForm />}
      {step === 2 && <CoverForm />}
      {step === 3 && <TicketForm />}
      {step === 4 && <MediaUploadForm />}
    </div>
  );
};

export default memo(CreateEvent);
