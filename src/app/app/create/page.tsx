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

const defaultValues: TFormValues = {
  eventName: "",
  organizerName: "",
  eventYear: `${new Date().getFullYear()}`,
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

const buildEventFormData = (body: TFormValues, status: "draft" | "published") => {
  const formData = new FormData();
  const eventCurrency = getCurrencyForCountry(
    body.eventCountryCode || body.eventCountry,
  );
  formData.append("status", status);
  formData.append("eventName", body.eventName);
  formData.append("organizerName", body.organizerName);
  formData.append("eventYear", body.eventYear);
  formData.append(
    "eventDate",
    body.eventDate ? new Date(body.eventDate).toISOString() : "",
  );
  formData.append("eventCountry", body.eventCountry);
  formData.append("eventCountryCode", body.eventCountryCode);
  formData.append("eventState", body.eventState);
  formData.append("eventStateCode", body.eventStateCode);
  formData.append("eventCity", body.eventCity);
  formData.append("country", body.eventCountry);
  formData.append("countryCode", body.eventCountryCode);
  formData.append("state", body.eventState);
  formData.append("stateCode", body.eventStateCode);
  formData.append("city", body.eventCity);
  formData.append("currency", eventCurrency.code);
  formData.append("ticketCurrency", eventCurrency.code);
  formData.append("eventCurrency", eventCurrency.code);
  formData.append("venueId", body.venueId);
  formData.append("categoryId", body.categoryId);
  formData.append("description", body.description);
  formData.append("saleMethod", body.saleMethod);

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
    formData.append("eventTickets", JSON.stringify(body.eventTickets));
    formData.append("ticketCategories", JSON.stringify(body.eventTickets));
  }
  if (body.ticketUrl) {
    formData.append("ticketUrl", body.ticketUrl);
  }
  if (body.passAssignments?.length) {
    formData.append("passAssignments", JSON.stringify(body.passAssignments));
    formData.append("accessPasses", JSON.stringify(body.passAssignments));
  }
  if (body.coverImage instanceof File) {
    formData.append("image", body.coverImage);
  }
  if (body.mediaFiles.length > 0) {
    body.mediaFiles.forEach((file) => {
      if (file instanceof File) {
        formData.append("medias", file);
      }
    });
  }
  if (body.sponsorNames?.length) {
    formData.append("sponsors", JSON.stringify(body.sponsorNames.filter(Boolean)));
  }
  if (body.sponsorImages?.length) {
    body.sponsorImages.forEach((file) => {
      if (file instanceof File) {
        formData.append("sponsorImages", file);
      }
    });
  }
  if (body.blogPosts?.length) {
    const blogPosts = body.blogPosts.map((post) => ({
      ...post,
      image: post.image instanceof File ? post.image.name : post.image,
      images: (post.images ?? []).map((image) =>
        image instanceof File ? image.name : image,
      ),
    }));
    formData.append("blogPosts", JSON.stringify(blogPosts));
    body.blogPosts.forEach((post) => {
      (post.images ?? []).forEach((image) => {
        if (image instanceof File) {
          formData.append("blogImages", image);
        }
      });
    });
  }

  return formData;
};

const CreateEvent = () => {
  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const activeStepRef = useRef(1);
  const searchParams = useSearchParams();
  const userDetails = useUserStore((state) => state.userDetails);
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

    if (process.env.NODE_ENV !== "development") {
      const loadBackendDraft = async () => {
        try {
          const response = await getData<IEventDetailsType>(`/event/${nextDraftId}`);
          const draftEvent = response.data.data;
          if (!draftEvent) return;

          form.reset({
            ...defaultValues,
            eventName: draftEvent.name ?? "",
            organizerName: draftEvent.organizerName ?? "",
            eventYear: `${draftEvent.eventYear ?? new Date().getFullYear()}`,
            eventDate: draftEvent.date ? new Date(draftEvent.date) : defaultValues.eventDate,
            eventCountry: draftEvent.eventCountry ?? draftEvent.country ?? "",
            eventCountryCode:
              draftEvent.eventCountryCode ?? draftEvent.countryCode ?? "",
            eventState: draftEvent.eventState ?? draftEvent.state ?? "",
            eventStateCode: draftEvent.eventStateCode ?? draftEvent.stateCode ?? "",
            eventCity: draftEvent.eventCity ?? draftEvent.city ?? "",
            venueId: draftEvent.venue?.id ?? "",
            venueName: draftEvent.venue?.name ?? "",
            categoryId: "",
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
  }, [draftId, form, searchParams]);

  const saveDraft = useCallback(
    async (currentStep: number) => {
      const body = form.getValues();

      if (process.env.NODE_ENV !== "development") {
        try {
          const formData = buildEventFormData(body, "draft");
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
        eventYear: body.eventYear || `${new Date().getFullYear()}`,
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
    [draftId, form],
  );

  const handleNextStep = useCallback(async () => {
    if (step < 4) {
      const nextStep = step + 1;
      activeStepRef.current = nextStep;
      await saveDraft(nextStep);
      return setStep(nextStep);
    }
    try {
      const body = form.getValues();
      console.log("body", body);
      const formData = buildEventFormData(body, "published");

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
      const previousStep = step - 1;
      activeStepRef.current = previousStep;
      return setStep(previousStep);
    }
  }, [step]);
  return (
    <div className="space-y-10">
      <Steps currentStep={step} />
      <FormProvider {...form}>
        {step === 1 && <BasicForm handleNextStep={handleNextStep} />}
        {step === 2 && (
          <TicketForm
            handleNextStep={handleNextStep}
            handlePreviousStep={handlePreviousStep}
          />
        )}
        {step === 3 && (
          <MediaUploadForm
            handleNextStep={handleNextStep}
            handlePreviousStep={handlePreviousStep}
          />
        )}
        {step === 4 && (
          <PreviewPublishForm
            handleNextStep={handleNextStep}
            handlePreviousStep={handlePreviousStep}
          />
        )}
      </FormProvider>
    </div>
  );
};

export default memo(CreateEvent);
