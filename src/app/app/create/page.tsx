"use client";
import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
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
import TicketForm, {
  ITicketFormValues,
  ticketFormSchema,
} from "@/components/pages/app/create/ticket-form";
import DashboardBanner from "@/components/pages/app/dashboard-banner";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import React, { memo, useCallback, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

export type TFormValues = IBasicFormValues &
  ICoverFormValues &
  IMediaUploadFormValues &
  ITicketFormValues;

const schemas = {
  1: basicInformationSchema,
  2: coverFormSchema,
  3: ticketFormSchema,
  4: mediaUploadFormSchema,
} as const;

export const defaultValues: TFormValues = {
  eventName: "",
  eventDate: new Date(new Date().setDate(new Date().getDate() + 1)),
  venueId: "",
  categoryId: "",
  guestIds: [],
  unRegisteredGuestNames: [],
  description: "",
  eventActivities: [],
  additionalInformation: [],
  coverImage: null,
  mediaFiles: [],
  saleMethod: "",
  eventTickets: [],
  ticketUrl: "",
};

const CreateEvent = () => {
  const [step, setStep] = useState(1);
  const schema = useMemo(() => {
    return schemas[step as keyof typeof schemas] as Joi.Schema;
  }, [step]);
  const form = useForm<TFormValues>({
    defaultValues,
    resolver: schema ? joiResolver(schema) : undefined,
    mode: "onChange",
  });
  const handleNextStep = useCallback(async () => {
    if (step < 4) {
      return setStep(step + 1);
    }
    try {
      const body = form.getValues();
      console.log("body", body);
      const formData = new FormData();
      formData.append("eventName", body.eventName);
      formData.append("eventDate", body.eventDate?.toString() ?? "");
      formData.append("venueId", body.venueId);
      formData.append("categoryId", body.categoryId);
      if (body?.guestIds && body?.guestIds?.length > 0) {
        formData.append("guestIds", JSON.stringify(body.guestIds));
      }

      if (
        body?.unRegisteredGuestNames &&
        body?.unRegisteredGuestNames?.length > 0
      ) {
        formData.append(
          "unRegisteredGuestNames",
          JSON.stringify(body.unRegisteredGuestNames),
        );
      }
      formData.append("description", body.description);

      if (body?.eventActivities && body?.eventActivities?.length > 0) {
        formData.append(
          "eventActivities",
          JSON.stringify(body.eventActivities),
        );
      }
      if (
        body?.additionalInformation &&
        body?.additionalInformation?.length > 0
      ) {
        formData.append(
          "additionalInformation",
          JSON.stringify(body.additionalInformation),
        );
      }
      if (body?.eventTickets && body?.eventTickets?.length > 0) {
        formData.append("eventTickets", JSON.stringify(body.eventTickets));
      }
      if (body.ticketUrl) {
        formData.append("ticketUrl", body.ticketUrl);
      }
      if (body.coverImage) {
        formData.append("image", body.coverImage);
      }
      if (body.mediaFiles.length > 0) {
        body.mediaFiles.forEach((file) => {
          formData.append("medias", file);
        });
      }
      await postData("/event", formData);
      setStep(1);
      form.reset();
      toast.success("Event created successfully");
    } catch (error) {
      const err = error as TApiErrorResponseType;
      if (err?.response?.status >= 200 && err?.response?.status < 300) {
        setStep(1);
        form.reset();
        toast.success("Event created successfully");
        return;
      }
      toast.error(
        constructErrorMessage(
          err,
          "Something went wrong while creating event",
        ),
      );
    }
  }, [step, form]);

  const handlePreviousStep = useCallback(() => {
    if (step > 1) {
      return setStep(step - 1);
    }
  }, [step]);
  return (
    <div className="space-y-10">
      <DashboardBanner />
      <Steps currentStep={step} />
      <FormProvider {...form}>
        {step === 1 && <BasicForm handleNextStep={handleNextStep} />}
        {step === 2 && (
          <CoverForm
            handleNextStep={handleNextStep}
            handlePreviousStep={handlePreviousStep}
          />
        )}
        {step === 3 && (
          <TicketForm
            handleNextStep={handleNextStep}
            handlePreviousStep={handlePreviousStep}
          />
        )}
        {step === 4 && (
          <MediaUploadForm
            handleNextStep={handleNextStep}
            handlePreviousStep={handlePreviousStep}
          />
        )}
      </FormProvider>
    </div>
  );
};

export default memo(CreateEvent);
