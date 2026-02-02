"use client";
import BasicForm, {
  IBasicFormValues,
  basicInformationSchema,
} from "@/components/pages/app/create/basic-form";
import CoverForm, {
  ICoverFormValues,
  coverFormSchema,
} from "@/components/pages/app/create/cover-form";
import MediaUploadForm, {
  IMediaUploadFormValues,
  mediaUploadFormSchema,
} from "@/components/pages/app/create/media-upload-form";
import Steps from "@/components/pages/app/create/steps";
import TicketForm from "@/components/pages/app/create/ticket-form";
import DashboardBanner from "@/components/pages/app/dashboard-banner";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import React, { memo, useCallback, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

export const dynamic = "force-dynamic";

export type TFormValues = IBasicFormValues &
  ICoverFormValues &
  IMediaUploadFormValues;

const schemas = {
  1: basicInformationSchema,
  2: coverFormSchema,
  4: mediaUploadFormSchema,
} as const;

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
  coverImage: null,
  mediaFiles: [],
};

const CreateEvent = () => {
  const [step, setStep] = useState(4);
  const schema = useMemo(() => {
    return schemas[step as keyof typeof schemas] as Joi.Schema;
  }, [step]);
  const form = useForm<TFormValues>({
    defaultValues,
    resolver: schema ? joiResolver(schema) : undefined,
    mode: "onChange",
  });
  const handleNextStep = useCallback(() => {
    if (step < 4) {
      return setStep(step + 1);
    }
    console.log("form values", form.getValues());
  }, [step, form]);
  return (
    <div className="space-y-10">
      <DashboardBanner />
      <Steps currentStep={step} />
      <FormProvider {...form}>
        {step === 1 && <BasicForm handleNextStep={handleNextStep} />}
        {step === 2 && <CoverForm handleNextStep={handleNextStep} />}
        {step === 3 && <TicketForm />}
        {step === 4 && <MediaUploadForm handleNextStep={handleNextStep} />}
      </FormProvider>
    </div>
  );
};

export default memo(CreateEvent);
