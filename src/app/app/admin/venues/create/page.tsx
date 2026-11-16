"use client";
import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import RequireAdmin from "@/components/auth/require-admin";
import VenueForm, {
  IVenueFormValues,
  venueFormSchema,
} from "@/components/pages/app/create-venue/venue-form";
import { joiResolver } from "@hookform/resolvers/joi";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import React, { memo, useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "@/lib/toast";
import { uploadAttachments } from "@/api/attachments";
import { useApproveVenueSuggestion } from "@/hooks/use-catalogue-reviews";

export const dynamic = "force-dynamic";

const defaultValues: IVenueFormValues = {
  name: "",
  locationSearch: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  latitude: "",
  longitude: "",
  totalAvailableSeat: "",
  description: "",
  images: [],
};

const CreateVenue = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  // From a venue an organiser typed (Catalogue → Submissions): start from what
  // they wrote, and link their event to the new venue once it's saved.
  const params = useSearchParams();
  const suggestionId = params.get("suggestion");
  const linkSuggestion = useApproveVenueSuggestion();
  const prefill = React.useMemo<IVenueFormValues>(() => {
    if (!suggestionId) return defaultValues;
    const field = (key: string) => params.get(key)?.trim() ?? "";
    const place = [field("address"), field("city"), field("state"), field("country")].filter(Boolean).join(", ");
    return {
      ...defaultValues,
      name: field("name"),
      address: field("address"),
      city: field("city"),
      state: field("state"),
      country: field("country"),
      // Ready to search the map with, so the pin can be set in one step.
      locationSearch: place || field("name"),
    };
  }, [params, suggestionId]);
  const form = useForm<IVenueFormValues>({
    defaultValues: prefill,
    resolver: joiResolver(venueFormSchema),
    mode: "onChange",
  });

  const handleSubmit = useCallback(async () => {
    try {
      const body = form.getValues();
      const formData = new FormData();
      formData.append("name", body.name);
      formData.append("address", body.address);
      formData.append("city", body.city);
      formData.append("state", body.state);
      formData.append("country", body.country);
      if (body.postalCode?.trim()) formData.append("postalCode", body.postalCode.trim());
      formData.append("latitude", String(body.latitude));
      formData.append("longitude", String(body.longitude));
      formData.append("totalAvailableSeat", String(body.totalAvailableSeat));
      formData.append("description", body.description);
      const images = await uploadAttachments(body.images, "VENUE_IMAGE");
      formData.append(
        "imageIds",
        JSON.stringify(images.map((image) => image.id)),
      );
      const created = await postData<FormData, { id: string }>("/venue", formData);
      await queryClient.invalidateQueries({ queryKey: ["venues"] });
      const venueId = created.data?.data?.id;
      if (suggestionId && venueId) {
        try {
          await linkSuggestion.mutateAsync({ id: suggestionId, venueId });
          toast.success("Venue created, and the organiser's event now links to it");
        } catch (linkError) {
          toast.error(
            constructErrorMessage(
              linkError as TApiErrorResponseType,
              "Venue created, but linking the event failed. Link it from Submissions.",
            ),
          );
        }
        form.reset(defaultValues);
        router.push("/app/admin/events/catalogue");
        return;
      }
      form.reset(defaultValues);
      toast.success("Venue created successfully");
      router.push("/app/venues");
    } catch (error) {
      const err = error as TApiErrorResponseType;
      console.error("Create venue failed", {
        message: err?.message,
        code: err?.code,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      toast.error(
        constructErrorMessage(err, "Something went wrong while creating venue"),
      );
    }
  }, [form, router, queryClient, suggestionId, linkSuggestion]);

  return (
    <RequireAdmin>
      <div className="space-y-6 md:space-y-10">
        <FormProvider {...form}>
          <VenueForm onSubmit={handleSubmit} />
        </FormProvider>
      </div>
    </RequireAdmin>
  );
};

export default memo(CreateVenue);
