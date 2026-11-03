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
import {
  FormProvider,
  type Resolver,
  useForm,
  type UseFormReturn,
} from "react-hook-form";
import useUserStore from "@/stores/user-store";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/variables";
import {
  forgetEventForm,
  keepEventForm,
  readKeptEventForm,
} from "@/lib/event-form-autosave";
import {
  IEventBlogPostDetails,
  IEventDetailsType,
  sponsorLogo,
  sponsorName,
  sponsorShowsName,
} from "@/lib/types";
import { getCurrencyForCountry } from "@/lib/currency";
import { uploadAttachment } from "@/api/attachments";
import { TAttachment, TAttachmentPurpose } from "@/lib/types";
import { saleRulesPayload } from "@/components/pages/app/create/ticket-sale-rules";
import {
  eventDaysFromEvent,
  eventDaysPayload,
  ticketDayIndexes,
} from "@/components/pages/app/create/event-days-payload";
import {
  DEFAULT_EVENT_TIMEZONE,
  defaultEventTimezone,
  instantToWallTimeInZone,
  wallTimeInZoneToInstant,
} from "@/lib/event-time";

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
  eventTimezone: DEFAULT_EVENT_TIMEZONE,
  eventCountry: "",
  eventCountryCode: "",
  eventState: "",
  eventStateCode: "",
  eventCity: "",
  venueId: "",
  venueName: "",
  venueAddress: "",
  venueCapacity: null,
  categoryId: "",
  categoryName: "",
  guestIds: [],
  unRegisteredGuestNames: [],
  lineup: [],
  isMultiDay: false,
  eventDays: [],
  description: "",
  eventActivities: [],
  coverImage: null,
  mediaFiles: [],
  mediaFileIds: [],
  sponsorNames: [],
  sponsorImages: [],
  sponsorLogoIds: [],
  sponsorShowNames: [],
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

/**
 * Once saved, each picked file stands in the form as its upload (link and id),
 * so the copy kept in the browser, which can't hold files, still has it when
 * they come back to the page.
 */
const swapUploadedFiles = (form: UseFormReturn<TFormValues>) => {
  const uploaded = (value: unknown) =>
    value instanceof File ? uploadedAttachments.get(value) : undefined;

  const cover = uploaded(form.getValues("coverImage"));
  if (cover) form.setValue("coverImage", cover.url);

  const media = form.getValues("mediaFiles") ?? [];
  if (media.some(uploaded)) {
    const ids = form.getValues("mediaFileIds") ?? [];
    form.setValue(
      "mediaFileIds",
      media.map((file, index) => uploaded(file)?.id ?? ids[index] ?? null),
    );
    form.setValue(
      "mediaFiles",
      media.map((file) => uploaded(file)?.url ?? file),
    );
  }

  const logos = form.getValues("sponsorImages") ?? [];
  if (logos.some(uploaded)) {
    const ids = form.getValues("sponsorLogoIds") ?? [];
    form.setValue(
      "sponsorLogoIds",
      logos.map((logo, index) => uploaded(logo)?.id ?? ids[index] ?? null),
    );
    form.setValue(
      "sponsorImages",
      logos.map((logo) => uploaded(logo)?.url ?? logo),
    );
  }
};

const buildEventFormData = async (
  body: TFormValues,
  status: "draft" | "published",
  /** Saving over an existing draft: the gallery and sponsors go whole, in order. */
  editing = false,
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
    body.eventDate
      ? wallTimeInZoneToInstant(
          new Date(body.eventDate),
          body.eventTimezone,
        ).toISOString()
      : "",
  );
  if (body.eventTimezone) formData.append("timezone", body.eventTimezone);
  formData.append("eventCountry", body.eventCountry);
  formData.append("eventCountryCode", body.eventCountryCode);
  formData.append("eventState", body.eventState);
  formData.append("eventStateCode", body.eventStateCode);
  formData.append("eventCity", body.eventCity);
  formData.append("currency", eventCurrency.code);
  formData.append("ticketCurrency", eventCurrency.code);
  formData.append("eventCurrency", eventCurrency.code);
  // A directory venue goes by id; one typed in goes by name and address.
  if (body.venueId && !isLocallyCreatedOption(body.venueId)) {
    formData.append("venueId", body.venueId);
  } else if (body.venueName?.trim()) {
    formData.append("customVenueName", body.venueName.trim());
    if (body.venueAddress?.trim()) {
      formData.append("customVenueAddress", body.venueAddress.trim());
    }
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

  const multiDay = body.isMultiDay && (body.eventDays?.length ?? 0) >= 2;
  // Always sent, in billing order, so taking everyone off a draft clears it. A
  // multi-day event's bill is its days' line-ups, which the api puts together.
  formData.append(
    "performerIds",
    JSON.stringify(
      multiDay ? [] : (body.lineup ?? []).map((performer) => performer.id),
    ),
  );
  formData.append(
    "headlinerIds",
    JSON.stringify(
      multiDay
        ? []
        : (body.lineup ?? [])
            .filter((performer) => performer.isHeadliner)
            .map((performer) => performer.id),
    ),
  );
  // Sent either way, so turning multi-day off makes it a one-day event again.
  formData.append(
    "days",
    JSON.stringify(
      multiDay ? eventDaysPayload(body.eventDays, body.eventTimezone) : [],
    ),
  );
  if (body.eventActivities?.length) {
    // Activity times are picked on the same clock as the event date.
    const activities = body.eventActivities.map((activity) => ({
      ...activity,
      // Optional: left out when blank.
      activityDescription: activity.activityDescription?.trim() || undefined,
      activityDate: activity.activityDate
        ? wallTimeInZoneToInstant(
            new Date(activity.activityDate),
            body.eventTimezone,
          )
        : activity.activityDate,
    }));
    formData.append("eventActivities", JSON.stringify(activities));
    formData.append("activities", JSON.stringify(activities));
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
      ...saleRulesPayload(ticket),
      ...(ticket.visibility === "private" && ticket.privateAccessCode
        ? { privateAccessCode: ticket.privateAccessCode }
        : {}),
      ...(multiDay
        ? {
            dayIndexes: (ticket.dayIndexes ?? []).filter(
              (index) => index < body.eventDays.length,
            ),
          }
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
  // The gallery in its order: saved photos by id, new ones uploaded first.
  const mediaFiles = body.mediaFiles.filter(
    (file): file is File => file instanceof File,
  );
  const uploadedMedia = mediaFiles.length
    ? await uploadEachOnce(mediaFiles, "EVENT_MEDIA")
    : [];
  let nextMedia = 0;
  const mediaIds = body.mediaFiles
    .map((file, index) =>
      file instanceof File
        ? uploadedMedia[nextMedia++]?.id
        : body.mediaFileIds?.[index] || undefined,
    )
    .filter((id): id is string => Boolean(id));
  if (mediaIds.length || editing) {
    formData.append("mediaIds", JSON.stringify(mediaIds));
  }
  if (editing) formData.append("arrangeMedia", "true");
  // Sponsors in their order, each with its own logo: a new file (uploaded
  // now) or the one a saved draft already had.
  const sponsorEntries = (body.sponsorNames ?? [])
    .map((name, index) => ({
      name: name?.trim() ?? "",
      image: body.sponsorImages?.[index],
      logoId: body.sponsorLogoIds?.[index] || undefined,
      showName: !!body.sponsorShowNames?.[index],
    }))
    .filter((sponsor) => sponsor.name);
  const logoFiles = sponsorEntries
    .map((sponsor) => sponsor.image)
    .filter((file): file is File => file instanceof File);
  const uploadedLogos = logoFiles.length
    ? await uploadEachOnce(logoFiles, "EVENT_SPONSOR")
    : [];
  let nextLogo = 0;
  if (sponsorEntries.length || editing) {
    formData.append(
      "sponsors",
      JSON.stringify(
        sponsorEntries.map((sponsor) => ({
          name: sponsor.name,
          imageId:
            sponsor.image instanceof File
              ? uploadedLogos[nextLogo++]?.id
              : sponsor.logoId,
          showName: sponsor.showName,
        })),
      ),
    );
  }
  if (editing) formData.append("arrangeSponsors", "true");
  if (body.blogPosts?.length) {
    // The API only accepts these fields; images travel separately as blogImageIds.
    const blogPosts = body.blogPosts.map(
      ({ title, excerpt, body: postBody }) => ({
        title,
        ...(excerpt ? { excerpt } : {}),
        body: postBody,
      }),
    );
    formData.append("blogPosts", JSON.stringify(blogPosts));
    const blogImageFiles = body.blogPosts.flatMap((post) =>
      (post.images ?? []).filter(
        (image): image is File => image instanceof File,
      ),
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
  const router = useRouter();
  const userDetails = useUserStore((state) => state.userDetails);
  // A copy kept in this browser as they type, brought back after a refresh.
  const [restored, setRestored] = useState<{
    savedAt: string;
    droppedFiles: number;
  } | null>(null);
  const keepReadyRef = useRef(false);
  const draftIdRef = useRef<string | null>(null);
  const stepRef = useRef(1);
  draftIdRef.current = draftId;
  stepRef.current = step;
  // Local mock events stand in for the API only when developing signed out; a
  // signed-in user always talks to the backend so draft ids stay real UUIDs.
  const useMockEvents =
    process.env.NODE_ENV === "development" && !userDetails?.id;
  const resolver = useCallback<Resolver<TFormValues>>(
    (values, context, options) => {
      return joiResolver(
        schemas[activeStepRef.current as keyof typeof schemas],
      )(values, context, options);
    },
    [],
  );
  const form = useForm<TFormValues>({
    defaultValues,
    resolver,
    mode: "onChange",
  });

  useEffect(() => {
    activeStepRef.current = step;
    form.clearErrors();
  }, [form, step]);

  // A new event starts in the organiser's own zone; the server can't know it.
  // Once only, so it never overwrites a zone a kept copy brought back.
  const zoneDefaultedRef = useRef(false);
  useEffect(() => {
    if (zoneDefaultedRef.current || searchParams.get("draftId")) return;
    zoneDefaultedRef.current = true;
    if (form.getValues("eventTimezone") === DEFAULT_EVENT_TIMEZONE) {
      form.setValue("eventTimezone", defaultEventTimezone());
    }
  }, [form, searchParams]);

  // A new event they'd started before a refresh: put it back as it was.
  const userId = userDetails?.id;
  useEffect(() => {
    if (!userId || useMockEvents || searchParams.get("draftId")) return;
    if (keepReadyRef.current) return;
    const kept = readKeptEventForm<TFormValues>(userId, null);
    if (kept) {
      form.reset({ ...defaultValues, ...kept.values });
      activeStepRef.current = kept.step;
      setStep(kept.step);
      setRestored({ savedAt: kept.savedAt, droppedFiles: kept.droppedFiles });
    }
    keepReadyRef.current = true;
  }, [form, searchParams, useMockEvents, userId]);

  // Keep a copy as they type (a moment after they stop).
  useEffect(() => {
    if (!userId || useMockEvents) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = form.watch(() => {
      if (!keepReadyRef.current) return;
      clearTimeout(timer);
      timer = setTimeout(
        () =>
          keepEventForm(
            userId,
            draftIdRef.current,
            form.getValues(),
            stepRef.current,
          ),
        600,
      );
    });
    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [form, useMockEvents, userId]);

  const startOver = useCallback(() => {
    if (userId) {
      forgetEventForm(userId, null);
      if (draftIdRef.current) forgetEventForm(userId, draftIdRef.current);
    }
    setRestored(null);
    setDraftId(null);
    activeStepRef.current = 1;
    setStep(1);
    form.reset({ ...defaultValues, eventTimezone: defaultEventTimezone() });
    router.replace(ROUTES.CREATE_EVENT.href);
  }, [form, router, userId]);

  useEffect(() => {
    const nextDraftId = searchParams.get("draftId");
    if (!nextDraftId || draftId === nextDraftId) {
      return;
    }

    if (!useMockEvents) {
      const loadBackendDraft = async () => {
        try {
          const response = await getData<IEventDetailsType>(
            `/event/${nextDraftId}`,
          );
          const draftEvent = response.data.data;
          if (!draftEvent) return;

          form.reset({
            ...defaultValues,
            eventName: draftEvent.name ?? "",
            organizerName: draftEvent.organizerName ?? "",
            eventDate: draftEvent.date
              ? instantToWallTimeInZone(draftEvent.date, draftEvent.timezone)
              : defaultValues.eventDate,
            eventTimezone: draftEvent.timezone || defaultEventTimezone(),
            eventCountry: draftEvent.eventCountry ?? draftEvent.country ?? "",
            eventCountryCode:
              draftEvent.eventCountryCode ?? draftEvent.countryCode ?? "",
            eventState: draftEvent.eventState ?? draftEvent.state ?? "",
            eventStateCode:
              draftEvent.eventStateCode ?? draftEvent.stateCode ?? "",
            eventCity: draftEvent.eventCity ?? draftEvent.city ?? "",
            venueId: draftEvent.venue?.id ?? "",
            venueName: draftEvent.venue?.name ?? draftEvent.venueName ?? "",
            venueAddress:
              draftEvent.venue?.address ?? draftEvent.venueAddress ?? "",
            venueCapacity: draftEvent.venue?.totalAvailableSeat || null,
            categoryId: draftEvent.category?.id ?? "",
            categoryName:
              draftEvent.category?.name ?? draftEvent.customCategoryName ?? "",
            description: draftEvent.description ?? "",
            lineup: draftEvent.performers ?? [],
            isMultiDay: (draftEvent.days?.length ?? 0) > 1,
            eventDays: eventDaysFromEvent(draftEvent),
            eventActivities: (draftEvent.activities ?? []).map((activity) => ({
              activityName: activity.name,
              activityDescription: activity.description ?? "",
              activityDate: instantToWallTimeInZone(
                activity.date,
                draftEvent.timezone,
              ),
            })),
            coverImage: draftEvent.image || null,
            mediaFiles: draftEvent.medias ?? [],
            mediaFileIds: (draftEvent.mediaDetails ?? []).map(
              (media) => media.id ?? null,
            ),
            sponsorNames: (draftEvent.sponsors ?? []).map(sponsorName),
            // Each sponsor's logo, kept with it (shown by url, saved by id).
            sponsorImages: (draftEvent.sponsors ?? []).map(
              (sponsor) => sponsorLogo(sponsor) ?? "",
            ),
            sponsorLogoIds: (draftEvent.sponsors ?? []).map((sponsor) =>
              typeof sponsor === "string" ? null : (sponsor.imageDetails?.id ?? null),
            ),
            sponsorShowNames: (draftEvent.sponsors ?? []).map(sponsorShowsName),
            saleMethod: draftEvent.saleMethod ?? "",
            eventTickets: (draftEvent.eventTickets ?? []).map((ticket) => ({
              ...ticket,
              ticketPrice: getTicketPriceValue(ticket.ticketPrice),
              dayIndexes: ticketDayIndexes(ticket.dayIds, draftEvent),
            })),
            ticketUrl: draftEvent.ticketUrl ?? "",
            passAssignments: draftEvent.passAssignments ?? [],
            blogPosts: draftEvent.blogPosts ?? [],
          });
          setDraftId(nextDraftId);
          setStep(draftEvent.draftStep ?? 1);
          // Edits made here after the draft was last saved come back too.
          const kept = userDetails?.id
            ? readKeptEventForm<TFormValues>(userDetails.id, nextDraftId)
            : null;
          if (
            kept &&
            new Date(kept.savedAt).getTime() >
              new Date(draftEvent.updatedAt ?? 0).getTime()
          ) {
            form.reset({
              ...defaultValues,
              ...kept.values,
              // A banner still being a picked file wasn't kept; the draft has it.
              coverImage:
                kept.values.coverImage === undefined
                  ? draftEvent.image || null
                  : kept.values.coverImage,
            });
            activeStepRef.current = kept.step;
            setStep(kept.step);
            setRestored({
              savedAt: kept.savedAt,
              droppedFiles: kept.droppedFiles,
            });
          }
          keepReadyRef.current = true;
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
      typeof draftSnapshot.coverImage === "string" &&
      draftSnapshot.coverImage.trim()
        ? draftSnapshot.coverImage
        : draftEvent.image || null;

    form.reset({
      ...defaultValues,
      ...draftSnapshot,
      coverImage: restoredCoverImage,
    });
    setDraftId(nextDraftId);
    setStep(draftStep);
  }, [draftId, form, searchParams, useMockEvents, userDetails?.id]);

  const saveDraft = useCallback(
    async (currentStep: number) => {
      const body = form.getValues();

      if (!useMockEvents) {
        try {
          const formData = await buildEventFormData(body, "draft", !!draftId);
          const response = draftId
            ? await putData<FormData, IEventDetailsType>(
                `/event/${draftId}`,
                formData,
              )
            : await postData<FormData, IEventDetailsType>("/event", formData);
          const nextDraftId = response.data.data?.id ?? draftId;
          if (nextDraftId) {
            setDraftId(nextDraftId);
            swapUploadedFiles(form);
            if (!draftId) {
              // From now on it's this draft: a refresh reopens it.
              draftIdRef.current = nextDraftId;
              if (userDetails?.id) {
                forgetEventForm(userDetails.id, null);
                keepEventForm(
                  userDetails.id,
                  nextDraftId,
                  form.getValues(),
                  currentStep,
                );
              }
              router.replace(
                `${ROUTES.CREATE_EVENT.href}?draftId=${nextDraftId}`,
                { scroll: false },
              );
            }
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
        // Blank is fine: the api uses the vendor's organiser name.
        organizerName: body.organizerName || "",
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
        description:
          body.description || "Continue this draft to complete your event.",
        totalTickets:
          (body.eventTickets ?? []).reduce(
            (sum, ticket) => sum + Number(ticket.ticketQuantity || 0),
            0,
          ) +
          (body.passAssignments ?? []).reduce(
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
        eventGuestsOfHonour: (body.unRegisteredGuestNames ?? []).map(
          (name) => ({
            name,
          }),
        ),
        venue: {
          id: body.venueId,
          name: body.venueName || "Selected Venue",
          address:
            [body.eventCity, body.eventState, body.eventCountry]
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
    [draftId, form, router, useMockEvents, userDetails?.id],
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
      const formData = await buildEventFormData(
        body,
        "published",
        !!draftId && !useMockEvents,
      );

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
          totalTickets:
            (body.eventTickets ?? []).reduce(
              (sum, ticket) => sum + Number(ticket.ticketQuantity || 0),
              0,
            ) +
            (body.passAssignments ?? []).reduce(
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
            address:
              [body.eventCity, body.eventState, body.eventCountry]
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

      const response = draftId
        ? await putData<FormData, IEventDetailsType>(
            `/event/${draftId}`,
            formData,
          )
        : await postData<FormData, IEventDetailsType>("/event", formData);
      // It's out: nothing to bring back after a refresh any more.
      if (userDetails?.id) {
        forgetEventForm(userDetails.id, null);
        if (draftId) forgetEventForm(userDetails.id, draftId);
      }
      setRestored(null);
      activeStepRef.current = 1;
      setStep(1);
      setDraftId(null);
      form.reset({ ...defaultValues, eventTimezone: defaultEventTimezone() });
      // Waiting for review only if an admin check is ever turned on; otherwise live.
      if (response.data?.data?.status === "pending_review") {
        toast.success("Event created", {
          description: "It goes live once it's been checked.",
        });
      } else {
        toast.success("Event created", {
          description: "It's live: people can find it and get tickets now.",
        });
      }
      // Done here: back to the dashboard with a clean form for next time.
      router.push(ROUTES.DASHBOARD.href);
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
  }, [draftId, form, router, saveDraft, step, useMockEvents, userDetails]);

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
      {restored && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary-50/50 px-4 py-3 text-sm">
          <p className="mr-auto text-secondary-800">
            We kept what you&apos;d entered (
            {formatDistanceToNow(new Date(restored.savedAt), {
              addSuffix: true,
            })}
            ).
            {restored.droppedFiles > 0 &&
              ` Add the ${restored.droppedFiles === 1 ? "photo" : `${restored.droppedFiles} photos`} you'd picked again: they can't be kept in the browser.`}
          </p>
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            onClick={startOver}
          >
            Start over
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setRestored(null)}
          >
            Got it
          </Button>
        </div>
      )}
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
