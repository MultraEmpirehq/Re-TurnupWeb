"use client";
import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import RequireAdmin from "@/components/auth/require-admin";
import DashboardBanner from "@/components/pages/app/dashboard-banner";
import VenueForm, {
  IVenueFormValues,
  venueFormSchema,
} from "@/components/pages/app/create-venue/venue-form";
import { joiResolver } from "@hookform/resolvers/joi";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { memo, useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

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
  const form = useForm<IVenueFormValues>({
    defaultValues,
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
      formData.append("postalCode", body.postalCode);
      formData.append("latitude", String(body.latitude));
      formData.append("longitude", String(body.longitude));
      formData.append("totalAvailableSeat", String(body.totalAvailableSeat));
      formData.append("description", body.description);
      body.images.forEach((file) => {
        formData.append("images", file);
      });
      await postData("/venue", formData);
      await queryClient.invalidateQueries({ queryKey: ["venues"] });
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
  }, [form, router, queryClient]);

  return (
    <RequireAdmin>
      <div className="space-y-6 md:space-y-10">
        <DashboardBanner />
        <FormProvider {...form}>
          <VenueForm onSubmit={handleSubmit} />
        </FormProvider>
      </div>
    </RequireAdmin>
  );
};

export default memo(CreateVenue);
