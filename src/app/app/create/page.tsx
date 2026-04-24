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
import { joiResolver } from "@hookform/resolvers/joi";
import {
  getDevMockEventById,
  saveDevMockEvent,
  updateDevMockEvent,
} from "@/lib/dev-mock-events";
import { ensureEventChatGroup } from "@/lib/event-chat";
import Joi from "joi";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import useUserStore from "@/stores/user-store";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

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

const defaultValues: TFormValues = {
  eventName: "",
  organizerName: "",
  eventYear: `${new Date().getFullYear()}`,
  eventDate: new Date(new Date().setDate(new Date().getDate() + 1)),
  venueId: "",
  venueName: "",
  categoryId: "",
  categoryName: "",
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
  passAssignments: [],
};

const CreateEvent = () => {
  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const userDetails = useUserStore((state) => state.userDetails);
  const schema = useMemo(() => {
    return schemas[step as keyof typeof schemas] as Joi.Schema;
  }, [step]);
  const form = useForm<TFormValues>({
    defaultValues,
    resolver: schema ? joiResolver(schema) : undefined,
    mode: "onChange",
  });

  useEffect(() => {
    const nextDraftId = searchParams.get("draftId");
    if (
      !nextDraftId ||
      process.env.NODE_ENV !== "development" ||
      draftId === nextDraftId
    ) {
      return;
    }

    const draftEvent = getDevMockEventById(nextDraftId);
    if (!draftEvent?.draftSnapshot) {
      return;
    }

    form.reset({
      ...defaultValues,
      ...(draftEvent.draftSnapshot as Partial<TFormValues>),
    });
    setDraftId(nextDraftId);
    setStep(draftEvent.draftStep ?? 1);
  }, [draftId, form, searchParams]);

  const saveDraft = useCallback(
    (currentStep: number) => {
      if (process.env.NODE_ENV !== "development") {
        return draftId;
      }

      const body = form.getValues();
      const nextDraftId = draftId || `draft-event-${Date.now()}`;
      const draftPayload = {
        id: nextDraftId,
        status: "draft" as const,
        draftStep: currentStep,
        draftSnapshot: body as unknown as Record<string, unknown>,
        name: body.eventName || "Untitled Draft",
        organizerName: body.organizerName || "Turnupz Nigeria Ltd",
        eventYear: body.eventYear || `${new Date().getFullYear()}`,
        date: body.eventDate || new Date(),
        image: body.coverImage instanceof File ? URL.createObjectURL(body.coverImage) : "",
        description: body.description || "Continue this draft to complete your event.",
        totalTickets: (body.eventTickets ?? []).reduce(
          (sum, ticket) => sum + Number(ticket.ticketQuantity || 0),
          0,
        ),
        additionalInformation: body.additionalInformation ?? [],
        activities: (body.eventActivities ?? []).map((activity) => ({
          name: activity.activityName,
          description: activity.activityDescription,
          date: activity.activityDate,
        })),
        medias: (body.mediaFiles ?? []).map((file) => URL.createObjectURL(file)),
        saleMethod: body.saleMethod,
        ticketUrl: body.ticketUrl,
        eventTickets: body.eventTickets ?? [],
        passAssignments: body.passAssignments ?? [],
        eventGuestsOfHonour: (body.unRegisteredGuestNames ?? []).map((name) => ({
          name,
        })),
        venue: {
          id: body.venueId,
          name: body.venueName || "Selected Venue",
          address: "Draft venue",
          rating: 0,
          totalAvailableSeat: 0,
          images: [],
        },
      };

      if (draftId) {
        updateDevMockEvent(draftId, draftPayload);
      } else {
        saveDevMockEvent(draftPayload);
      }
      setDraftId(nextDraftId);
      return nextDraftId;
    },
    [draftId, form],
  );

  const handleNextStep = useCallback(async () => {
    if (step < 4) {
      saveDraft(step + 1);
      return setStep(step + 1);
    }
    try {
      const body = form.getValues();
      console.log("body", body);
      const formData = new FormData();
      formData.append("eventName", body.eventName);
      formData.append("organizerName", body.organizerName);
      formData.append("eventYear", body.eventYear);
      formData.append(
        "eventDate",
        body.eventDate ? new Date(body.eventDate).toISOString() : "",
      );
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
      if (body?.passAssignments && body?.passAssignments?.length > 0) {
        formData.append("passAssignments", JSON.stringify(body.passAssignments));
      }
      if (body.coverImage) {
        formData.append("image", body.coverImage);
      }
      if (body.mediaFiles.length > 0) {
        body.mediaFiles.forEach((file) => {
          formData.append("medias", file);
        });
      }

      if (process.env.NODE_ENV === "development" && !userDetails?.id) {
        const nextEventId = draftId || `mock-event-${Date.now()}`;
        const nextEvent = {
          id: nextEventId,
          status: "published" as const,
          draftStep: undefined,
          draftSnapshot: undefined,
          name: body.eventName,
          organizerName: body.organizerName,
          eventYear: body.eventYear,
          date: body.eventDate,
          image: body.coverImage ? URL.createObjectURL(body.coverImage) : "",
          description: body.description,
          totalTickets: (body.eventTickets ?? []).reduce(
            (sum, ticket) => sum + Number(ticket.ticketQuantity || 0),
            0,
          ),
          additionalInformation: body.additionalInformation,
          activities: body.eventActivities.map((activity) => ({
            name: activity.activityName,
            description: activity.activityDescription,
            date: activity.activityDate,
          })),
          medias: body.mediaFiles.map((file) => URL.createObjectURL(file)),
          saleMethod: body.saleMethod,
          ticketUrl: body.ticketUrl,
          eventTickets: body.eventTickets ?? [],
          passAssignments: body.passAssignments ?? [],
          eventGuestsOfHonour: body.unRegisteredGuestNames.map((name) => ({
            name,
          })),
          venue: {
            id: body.venueId,
            name: body.venueName || "Selected Venue",
            address: "Development venue",
            rating: 5,
            totalAvailableSeat: 0,
            images: [],
          },
        };
        if (draftId) {
          updateDevMockEvent(draftId, nextEvent);
        } else {
          saveDevMockEvent(nextEvent);
        }
        ensureEventChatGroup(nextEvent, userDetails);
        setStep(1);
        setDraftId(null);
        form.reset();
        toast.success("Event saved locally for development");
        return;
      }

      await postData("/event", formData);
      setStep(1);
      form.reset();
      toast.success("Event created successfully");
    } catch (error) {
      const err = error as TApiErrorResponseType;
      console.error("Create event failed", {
        message: err?.message,
        code: err?.code,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      toast.error(
        constructErrorMessage(err, "Something went wrong while creating event"),
      );
    }
  }, [draftId, form, saveDraft, step, userDetails]);

  const handlePreviousStep = useCallback(() => {
    if (step > 1) {
      return setStep(step - 1);
    }
  }, [step]);
  return (
    <div className="space-y-10">
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
