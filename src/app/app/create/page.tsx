"use client";
import BasicForm, {
  IBasicFormValues,
  basicInformationSchema,
} from "@/components/pages/app/create/basic-form";
import CoverForm from "@/components/pages/app/create/cover-form";
import MediaUploadForm from "@/components/pages/app/create/media-upload-form";
import Steps from "@/components/pages/app/create/steps";
import TicketForm from "@/components/pages/app/create/ticket-form";
import DashboardBanner from "@/components/pages/app/dashboard-banner";
import { joiResolver } from "@hookform/resolvers/joi";
import React, { memo, useCallback, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

export const dynamic = "force-dynamic";

export type TFormValues = IBasicFormValues;

export const defaultValues: TFormValues = {
  eventName: "",
  eventDate: new Date(),
  venueId: "",
  categoryId: "",
  guestIds: [],
  unRegisteredGuestNames: [],
  description: "",
  eventActivities: [],
  additionalInformation: [],
};

const CreateEvent = () => {
  const [step, setStep] = useState(1);
  const schema = useMemo(() => {
    if (step === 1) {
      return basicInformationSchema;
    }
    return basicInformationSchema;
  }, [step]);
  const form = useForm<TFormValues>({
    defaultValues,
    resolver: joiResolver(schema),
    mode: "onChange",
  });
  const handleNextStep = useCallback(() => {
    if (step < 4) {
      setStep(step + 1);
    }
  }, [step]);
  return (
    <div className="space-y-10">
      <DashboardBanner />
      <Steps currentStep={step} />
      <FormProvider {...form}>
        {step === 1 && <BasicForm handleNextStep={handleNextStep} />}
        {step === 2 && <CoverForm />}
        {step === 3 && <TicketForm />}
        {step === 4 && <MediaUploadForm />}
      </FormProvider>
    </div>
  );
};

export default memo(CreateEvent);
