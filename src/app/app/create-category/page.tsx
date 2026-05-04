"use client";
import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import RequireAdmin from "@/components/auth/require-admin";
import CategoryForm, {
  ICategoryFormValues,
  categoryFormSchema,
} from "@/components/pages/app/create-category/category-form";
import DashboardBanner from "@/components/pages/app/dashboard-banner";
import { ICategoryDetailsType } from "@/lib/types";
import { joiResolver } from "@hookform/resolvers/joi";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { memo, useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

const defaultValues: ICategoryFormValues = {
  name: "",
};

const CreateCategory = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<ICategoryFormValues>({
    defaultValues,
    resolver: joiResolver(categoryFormSchema),
    mode: "onChange",
  });

  const handleSubmit = useCallback(async () => {
    try {
      const body = form.getValues();
      await postData<{ name: string }, ICategoryDetailsType>("/category", {
        name: body.name.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      form.reset(defaultValues);
      toast.success("Category created successfully");
      router.push("/app/categories");
    } catch (error) {
      const err = error as TApiErrorResponseType;
      console.error("Create category failed", {
        message: err?.message,
        code: err?.code,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      toast.error(
        constructErrorMessage(
          err,
          "Something went wrong while creating category",
        ),
      );
    }
  }, [form, router, queryClient]);

  return (
    <RequireAdmin>
      <div className="space-y-6 md:space-y-10">
        <DashboardBanner />
        <FormProvider {...form}>
          <CategoryForm onSubmit={handleSubmit} />
        </FormProvider>
      </div>
    </RequireAdmin>
  );
};

export default memo(CreateCategory);
