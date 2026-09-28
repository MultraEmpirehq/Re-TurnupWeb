"use client";
import { getData, postData, putData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import BasicForm, {
  IBasicFormValues,
  basicInformationSchema,
} from "@/components/pages/app/create/basic-form";
import MediaUploadForm, {
  IMediaUploadFormValues,
  mediaUploadFormSchema,
} from "@/components/pages/app/create/media-upload-form";
import PreviewPublishForm, {
  previewPublishSchema,
} from "@/components/pages/app/create/preview-publish-form";
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
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, type Resolver, useForm } from "react-hook-form";
import useUserStore from "@/stores/user-store";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { IEventBlogPostDetails, IEventDetailsType } from "@/lib/types";
import { getCurrencyForCountry } from "@/lib/currency";
import { uploadAttachment } from "@/api/attachments";
import { TAttachment, TAttachmentPurpose } from "@/lib/types";

export const dynamic = "force-dynamic";

export type TFormValues = IBasicFormValues &
  IMediaUploadFormValues &
  ITicketFormValues & {
    acceptedTerms: boolean;
    blogPosts: IEventBlogPostDetails[];
  };

const schemas = {
  1: basicInformationSchema,
  2: ticketFormSchema,
  3: mediaUploadFormSchema,
  4: previewPublishSchema,
} as const;

const getEventYear = (date?: Date | string | null) =>
  `${(date ? new Date(date) : new Date()).getFullYear()}`;

const defaultValues: TFormValues = {
  eventName: "",
  organizerName: "",
  eventDate: new Date(new Date().setDate(new Date().getDate() + 1)),
  eventCountry: "",
  eventCountryCode: "",
  eventState: "",
  eventStateCode: "",
  eventCity: "",
  venueId: "",
  venueName: "",
  categoryId: "",
  categoryName: "",
  guestIds: [],
  unRegisteredGuestNames: [],
  description: "",
  eventActivities: [],
  coverImage: null,
  mediaFiles: [],
  sponsorNames: [],
  sponsorImages: [],
  saleMethod: "",
  eventTickets: [],
  ticketUrl: "",
  passAssignments: [],
  acceptedTerms: false,
  blogPosts: [],
};

const getImagePreviewUrl = (image: File | string | null | undefined) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (image instanceof Blob) return URL.createObjectURL(image);
  return "";
};

const getTicketPriceValue = (price: unknown) => {
  if (typeof price === "number") return price;
  if (price && typeof price === "object" && "amount" in price) {
    return Number((price as { amount?: number }).amount ?? 0);
  }
  return Number(price || 0);
};

const isLocallyCreatedOption = (id?: string) =>
  !!id && (id.startsWith("custom-venue-") || id.startsWith("custom-category-"));

/**
 * Files already sent to the attachment endpoint, so saving a draft a second time
 * re-uses the attachment instead of storing the same file again.
 */
const uploadedAttachments = new WeakMap<File, TAttachment>();

const uploadOnce = async (file: File, purpose: TAttachmentPurpose) => {
  const existing = uploadedAttachments.get(file);
  if (existing) {
    return existing;
  }
  const attachment = await uploadAttachment(file, purpose);
  uploadedAttachments.set(file, attachment);
  return attachment;
};

const uploadEachOnce = async (files: File[], purpose: TAttachmentPurpose) => {
  const attachments: TAttachment[] = [];
  for (const file of files) {
    attachments.push(await uploadOnce(file, purpose));
  }
  return attachments;
};

const buildEventFormData = async (
  body: TFormValues,
  status: "draft" | "published",
) => {
  const formData = new FormData();
  const eventCurrency = getCurrencyForCountry(
    body.eventCountryCode || body.eventCountry,
  );
  formData.append("status", status);
  formData.append("eventName", body.eventName);
  formData.append("organizerName", body.organizerName);
  formData.append(
    "eventDate",
    body.eventDate ? new Date(body.eventDate).toISOString() : "",
  );
  formData.append("eventCountry", body.eventCountry);
  formData.append("eventCountryCode", body.eventCountryCode);
  formData.append("eventState", body.eventState);
  formData.append("eventStateCode", body.eventStateCode);
  formData.append("eventCity", body.eventCity);
  formData.append("currency", eventCurrency.code);
  formData.append("ticketCurrency", eventCurrency.code);
  formData.append("eventCurrency", eventCurrency.code);
  if (isLocallyCreatedOption(body.venueId) && body.venueName) {
    formData.append("customVenueName", body.venueName);
  } else if (body.venueId) {
    formData.append("venueId", body.venueId);
  }
  if (isLocallyCreatedOption(body.categoryId) && body.categoryName) {
    formData.append("customCategoryName", body.categoryName);
  } else if (body.categoryId) {
    formData.append("categoryId", body.categoryId);
  }
  formData.append("description", body.description);
  // Sale method is only chosen on the ticket step; the API rejects an empty value.
  if (body.saleMethod) {
    formData.append("saleMethod", body.saleMethod);
  }
  formData.append("acceptedTerms", String(!!body.acceptedTerms));

  if (body.guestIds?.length) {
    formData.append("guestIds", JSON.stringify(body.guestIds));
  }
  if (body.unRegisteredGuestNames?.length) {
    formData.append(
      "unRegisteredGuestNames",
      JSON.stringify(body.unRegisteredGuestNames),
    );
  }
  if (body.eventActivities?.length) {
    formData.append("eventActivities", JSON.stringify(body.eventActivities));
    formData.append("activities", JSON.stringify(body.eventActivities));
  }
  if (body.eventTickets?.length) {
    // The API rejects unknown fields, and form tickets also carry display-only
    // ones (soldCount, and id/eventId/createdAt on a draft loaded back).
    const tickets = body.eventTickets.map((ticket) => ({
      ticketName: ticket.ticketName,
      ticketPrice: getTicketPriceValue(ticket.ticketPrice),
      ticketQuantity: Number(ticket.ticketQuantity),
      visibility: ticket.visibility,
      actionType: ticket.actionType,
      transferable: !!ticket.transferable,
      ...(ticket.visibility === "private" && ticket.privateAccessCode
        ? { privateAccessCode: ticket.privateAccessCode }
        : {}),
    }));
    formData.append("eventTickets", JSON.stringify(tickets));
    formData.append("ticketCategories", JSON.stringify(tickets));
  }
  if (body.ticketUrl) {
    formData.append("ticketUrl", body.ticketUrl);
  }
  if (body.passAssignments?.length) {
    formData.append(
      "accessPasses",
      JSON.stringify(
        body.passAssignments.map((pass) => ({
          passName: pass.passName,
          quantity: Number(pass.quantity),
          assigneeEmails: pass.assigneeEmails ?? [],
          transferable: !!pass.transferable,
        })),
      ),
    );
  }
  if (body.coverImage instanceof File) {
    const cover = await uploadOnce(body.coverImage, "EVENT_COVER");
    formData.append("coverImageId", cover.id);
  }
  const mediaFiles = body.mediaFiles.filter(
    (file): file is File => file instanceof File,
  );
  if (mediaFiles.length > 0) {
    const medias = await uploadEachOnce(mediaFiles, "EVENT_MEDIA");
    formData.append(
      "mediaIds",
      JSON.stringify(medias.map((media) => media.id)),
    );
  }
  const sponsorNames = body.sponsorNames?.filter(Boolean) ?? [];
  if (sponsorNames.length) {
    formData.append(
      "sponsors",
      JSON.stringify(sponsorNames.map((name) => ({ name }))),
    );
  }
  const sponsorImageFiles = (body.sponsorImages ?? []).filter(
    (file): file is File => file instanceof File,
  );
  if (sponsorImageFiles.length) {
    const sponsorImages = await uploadEachOnce(
      sponsorImageFiles,
      "EVENT_SPONSOR",
    );
    formData.append(
      "sponsorImageIds",
      JSON.stringify(sponsorImages.map((image) => image.id)),
    );
  }
  if (body.blogPosts?.length) {
    // The API only accepts these fields; images travel separately as blogImageIds.
    const blogPosts = body.blogPosts.map(({ title, excerpt, body: postBody }) => ({
      title,
      ...(excerpt ? { excerpt } : {}),
      body: postBody,
    }));
    formData.append("blogPosts", JSON.stringify(blogPosts));
    const blogImageFiles = body.blogPosts.flatMap((post) =>
      (post.images ?? []).filter((image): image is File => image instanceof File),
    );
    if (blogImageFiles.length) {
      const blogImages = await uploadEachOnce(blogImageFiles, "EVENT_BLOG");
      formData.append(
        "blogImageIds",
        JSON.stringify(blogImages.map((image) => image.id)),
      );
    }
  }

  return formData;
};

const CreateEvent = () => {
  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const activeStepRef = useRef(1);
  const searchParams = useSearchParams();
  const userDetails = useUserStore((state) => state.userDetails);
  // Local mock events stand in for the API only when developing signed out; a
  // signed-in user always talks to the backend so draft ids stay real UUIDs.
  const useMockEvents =
    process.env.NODE_ENV === "development" && !userDetails?.id;
  const resolver = useCallback<Resolver<TFormValues>>((values, context, options) => {
    return joiResolver(schemas[activeStepRef.current as keyof typeof schemas])(
      values,
      context,
      options,
    );
  }, []);
  const form = useForm<TFormValues>({
    defaultValues,
    resolver,
    mode: "onChange",
  });

  useEffect(() => {
    activeStepRef.current = step;
    form.clearErrors();
  }, [form, step]);

  useEffect(() => {
    const nextDraftId = searchParams.get("draftId");
    if (!nextDraftId || draftId === nextDraftId) {
      return;
    }

    if (!useMockEvents) {
      const loadBackendDraft = async () => {
        try {
          const response = await getData<IEventDetailsType>(`/event/${nextDraftId}`);
          const draftEvent = response.data.data;
          if (!draftEvent) return;

          form.reset({
            ...defaultValues,
            eventName: draftEvent.name ?? "",
            organizerName: draftEvent.organizerName ?? "",
            eventDate: draftEvent.date ? new Date(draftEvent.date) : defaultValues.eventDate,
            eventCountry: draftEvent.eventCountry ?? draftEvent.country ?? "",
            eventCountryCode:
              draftEvent.eventCountryCode ?? draftEvent.countryCode ?? "",
            eventState: draftEvent.eventState ?? draftEvent.state ?? "",
            eventStateCode: draftEvent.eventStateCode ?? draftEvent.stateCode ?? "",
            eventCity: draftEvent.eventCity ?? draftEvent.city ?? "",
            venueId: draftEvent.venue?.id ?? "",
            venueName: draftEvent.venue?.name ?? "",
            categoryId: draftEvent.category?.id ?? "",
            categoryName:
              draftEvent.category?.name ?? draftEvent.customCategoryName ?? "",
            description: draftEvent.description ?? "",
            eventActivities: (draftEvent.activities ?? []).map((activity) => ({
              activityName: activity.name,
              activityDescription: activity.description ?? "",
              activityDate: activity.date,
            })),
            coverImage: draftEvent.image || null,
            mediaFiles: draftEvent.medias ?? [],
            sponsorNames: ((draftEvent.sponsors ?? []) as Array<string | { name?: string }>).map((sponsor) =>
              typeof sponsor === "string" ? sponsor : sponsor.name,
            ).filter(Boolean) as string[],
            sponsorImages: draftEvent.sponsorImages ?? [],
            saleMethod: draftEvent.saleMethod ?? "",
            eventTickets: (draftEvent.eventTickets ?? []).map((ticket) => ({
              ...ticket,
              ticketPrice: getTicketPriceValue(ticket.ticketPrice),
            })),
            ticketUrl: draftEvent.ticketUrl ?? "",
            passAssignments: draftEvent.passAssignments ?? [],
            blogPosts: draftEvent.blogPosts ?? [],
          });
          setDraftId(nextDraftId);
          setStep(draftEvent.draftStep ?? 1);
        } catch {
          toast.error("Unable to load this draft event.");
        }
      };

      loadBackendDraft();
      return;
    }

    const draftEvent = getDevMockEventById(nextDraftId);
    if (!draftEvent?.draftSnapshot) {
      return;
    }

    const draftStep = draftEvent.draftStep ?? 1;
    activeStepRef.current = draftStep;
    const draftSnapshot = draftEvent.draftSnapshot as Partial<TFormValues>;
    const restoredCoverImage =
      typeof draftSnapshot.coverImage === "string" && draftSnapshot.coverImage.trim()
        ? draftSnapshot.coverImage
        : draftEvent.image || null;

    form.reset({
      ...defaultValues,
      ...draftSnapshot,
      coverImage: restoredCoverImage,
    });
    setDraftId(nextDraftId);
    setStep(draftStep);
  }, [draftId, form, searchParams, useMockEvents]);

  const saveDraft = useCallback(
    async (currentStep: number) => {
      const body = form.getValues();

      if (!useMockEvents) {
        try {
          const formData = await buildEventFormData(body, "draft");
          const response = draftId
            ? await putData<FormData, IEventDetailsType>(`/event/${draftId}`, formData)
            : await postData<FormData, IEventDetailsType>("/event", formData);
          const nextDraftId = response.data.data?.id ?? draftId;
          if (nextDraftId) {
            setDraftId(nextDraftId);
          }
          return nextDraftId;
        } catch (error) {
          toast.error(
            constructErrorMessage(
              error as TApiErrorResponseType,
              "Unable to save draft right now.",
            ),
          );
          return draftId;
        }
      }

      const nextDraftId = draftId || `draft-event-${Date.now()}`;
      const draftPayload = {
        id: nextDraftId,
        status: "draft" as const,
        draftStep: currentStep,
        draftSnapshot: body as unknown as Record<string, unknown>,
        name: body.eventName || "Untitled Draft",
        organizerName: body.organizerName || "Turnupz Nigeria Ltd",
        eventYear: getEventYear(body.eventDate),
        date: body.eventDate || new Date(),
        eventCountry: body.eventCountry,
        eventCountryCode: body.eventCountryCode,
        eventState: body.eventState,
        eventStateCode: body.eventStateCode,
        eventCity: body.eventCity,
        country: body.eventCountry,
        countryCode: body.eventCountryCode,
        state: body.eventState,
        stateCode: body.eventStateCode,
        city: body.eventCity,
        image: getImagePreviewUrl(body.coverImage),
        description: body.description || "Continue this draft to complete your event.",
        totalTickets: (body.eventTickets ?? []).reduce(
          (sum, ticket) => sum + Number(ticket.ticketQuantity || 0),
          0,
        ) + (body.passAssignments ?? []).reduce(
          (sum, pass) => sum + Number(pass.quantity || 0),
          0,
        ),
        additionalInformation: [],
        activities: (body.eventActivities ?? []).map((activity) => ({
          name: activity.activityName,
          description: activity.activityDescription,
          date: activity.activityDate,
        })),
        medias: (body.mediaFiles ?? []).map(getImagePreviewUrl).filter(Boolean),
        sponsors: (body.sponsorNames ?? []).filter(Boolean),
        sponsorImages: (body.sponsorImages ?? [])
          .map(getImagePreviewUrl)
          .filter(Boolean),
        blogPosts: body.blogPosts ?? [],
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
          address: [body.eventCity, body.eventState, body.eventCountry]
            .filter(Boolean)
            .join(", ") || "Draft venue",
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
    [draftId, form, useMockEvents],
  );

  const advanceStep = useCallback(async () => {
    if (step < 4) {
      const nextStep = step + 1;
      activeStepRef.current = nextStep;
      await saveDraft(nextStep);
      return setStep(nextStep);
    }
    try {
      const body = form.getValues();
      console.log("body", body);
      const formData = await buildEventFormData(body, "published");

      if (useMockEvents) {
        const nextEventId = draftId || `mock-event-${Date.now()}`;
        const nextEvent = {
          id: nextEventId,
          status: "published" as const,
          draftStep: undefined,
          draftSnapshot: undefined,
          name: body.eventName,
          organizerName: body.organizerName,
          eventYear: getEventYear(body.eventDate),
          date: body.eventDate,
          eventCountry: body.eventCountry,
          eventCountryCode: body.eventCountryCode,
          eventState: body.eventState,
          eventStateCode: body.eventStateCode,
          eventCity: body.eventCity,
          country: body.eventCountry,
          countryCode: body.eventCountryCode,
          state: body.eventState,
          stateCode: body.eventStateCode,
          city: body.eventCity,
          image: getImagePreviewUrl(body.coverImage),
          description: body.description,
          totalTickets: (body.eventTickets ?? []).reduce(
            (sum, ticket) => sum + Number(ticket.ticketQuantity || 0),
            0,
          ) + (body.passAssignments ?? []).reduce(
            (sum, pass) => sum + Number(pass.quantity || 0),
            0,
          ),
          additionalInformation: [],
          activities: body.eventActivities.map((activity) => ({
            name: activity.activityName,
            description: activity.activityDescription,
            date: activity.activityDate,
          })),
          medias: body.mediaFiles.map(getImagePreviewUrl).filter(Boolean),
          sponsors: (body.sponsorNames ?? []).filter(Boolean),
          sponsorImages: (body.sponsorImages ?? [])
            .map(getImagePreviewUrl)
            .filter(Boolean),
          blogPosts: body.blogPosts ?? [],
          blogPost: body.blogPosts?.[0]?.body ?? "",
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
            address: [body.eventCity, body.eventState, body.eventCountry]
              .filter(Boolean)
              .join(", ") || "Development venue",
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
        activeStepRef.current = 1;
        setStep(1);
        setDraftId(null);
        form.reset();
        toast.success("Event saved locally for development");
        return;
      }

      if (draftId) {
        await putData<FormData, IEventDetailsType>(`/event/${draftId}`, formData);
      } else {
        await postData<FormData, IEventDetailsType>("/event", formData);
      }
      activeStepRef.current = 1;
      setStep(1);
      setDraftId(null);
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
  }, [draftId, form, saveDraft, step, useMockEvents, userDetails]);

  // Every step saves before it moves on, so the steps share one saving flag for
  // their button loaders and a second click can't send the same save twice.
  const handleNextStep = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      await advanceStep();
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }, [advanceStep]);

  const handlePreviousStep = useCallback(() => {
    if (step > 1) {
      const previousStep = step - 1;
      activeStepRef.current = previousStep;
      return setStep(previousStep);
    }
  }, [step]);
  return (
    <div className="space-y-10">
      <Steps currentStep={step} />
      <FormProvider {...form}>
        {step === 1 && (
          <BasicForm handleNextStep={handleNextStep} isSaving={isSaving} />
        )}
        {step === 2 && (
          <TicketForm
            handleNextStep={handleNextStep}
            handlePreviousStep={handlePreviousStep}
            isSaving={isSaving}
          />
        )}
        {step === 3 && (
          <MediaUploadForm
            handleNextStep={handleNextStep}
            handlePreviousStep={handlePreviousStep}
            isSaving={isSaving}
          />
        )}
        {step === 4 && (
          <PreviewPublishForm
            handleNextStep={handleNextStep}
            handlePreviousStep={handlePreviousStep}
            isSaving={isSaving}
          />
        )}
      </FormProvider>
    </div>
  );
};

export default memo(CreateEvent);
