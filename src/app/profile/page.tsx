"use client";

import { patchData, postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import DateSelect from "@/components/ui/date-select";
import GenderSelect from "@/components/ui/gender-select";
import InputField from "@/components/ui/input-field";
import useAuth from "@/hooks/use-auth";
import useUserStore, { EUserGenders, TUserDetails } from "@/stores/user-store";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { Camera, Pencil } from "lucide-react";
import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface IProfileFormValues {
  firstName: string;
  lastName: string;
  username: string;
  dateOfBirth: Date;
  gender: EUserGenders;
  mobileNumber: string;
}

const schema = Joi.object({
  firstName: Joi.string().required().messages({
    "string.empty": "First name is required",
    "any.required": "First name is required",
  }),
  lastName: Joi.string().required().messages({
    "string.empty": "Last name is required",
    "any.required": "Last name is required",
  }),
  username: Joi.string().required().messages({
    "string.empty": "Username is required",
    "any.required": "Username is required",
  }),
  dateOfBirth: Joi.date().required().messages({
    "date.base": "Date of birth is required",
    "any.required": "Date of birth is required",
  }),
  gender: Joi.string().required().messages({
    "string.empty": "Gender is required",
    "any.required": "Gender is required",
  }),
  mobileNumber: Joi.string().allow("").optional(),
});

const ProfilePage = () => {
  const userDetails = useUserStore((state) => state.userDetails);
  const { performAuthOperation } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultValues: IProfileFormValues = useMemo(
    () => ({
      firstName: userDetails?.firstName ?? "",
      lastName: userDetails?.lastName ?? "",
      username: userDetails?.username ?? "",
      dateOfBirth: userDetails?.dateOfBirth
        ? new Date(userDetails.dateOfBirth)
        : new Date(),
      gender: userDetails?.gender ?? EUserGenders.MALE,
      mobileNumber: userDetails?.mobileNumber ?? "",
    }),
    [userDetails],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IProfileFormValues>({
    resolver: joiResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  const initials = useMemo(() => {
    const first = userDetails?.firstName?.[0] ?? "";
    const last = userDetails?.lastName?.[0] ?? "";
    if (first || last) return `${first}${last}`.toUpperCase();
    return userDetails?.username?.[0]?.toUpperCase() ?? "U";
  }, [userDetails]);

  const displayName = useMemo(() => {
    if (userDetails?.firstName) {
      return userDetails.lastName
        ? `${userDetails.firstName} ${userDetails.lastName}`
        : userDetails.firstName;
    }
    return userDetails?.username ?? "User";
  }, [userDetails]);

  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Image must be less than 5MB");
        return;
      }

      setIsUploadingAvatar(true);
      try {
        const formData = new FormData();
        formData.append("avatar", file);
        const { data } = await postData<FormData, TUserDetails>(
          "/user/avatar",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        await performAuthOperation(data?.data);
        toast.success("Profile photo updated");
      } catch (error) {
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Failed to upload profile photo",
          ),
        );
      } finally {
        setIsUploadingAvatar(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [performAuthOperation],
  );

  const onSubmit = useCallback(
    async (body: IProfileFormValues) => {
      try {
        const { data } = await patchData<IProfileFormValues, TUserDetails>(
          "/user",
          body,
        );
        await performAuthOperation(data?.data);
        toast.success("Profile updated successfully");
        setIsEditing(false);
      } catch (error) {
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Failed to update profile",
          ),
        );
      }
    },
    [performAuthOperation],
  );

  const handleCancelEdit = useCallback(() => {
    reset(defaultValues);
    setIsEditing(false);
  }, [reset, defaultValues]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="size-24 border-4 border-background shadow-lg">
            <AvatarImage src={userDetails?.avatar} alt={displayName} />
            <AvatarFallback className="text-2xl font-bold bg-cyan-100 text-cyan-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute bottom-0 right-0 size-8 rounded-full bg-cyan-500 text-white flex items-center justify-center cursor-pointer hover:bg-cyan-600 transition-colors disabled:opacity-50"
            aria-label="Upload profile photo"
          >
            <Camera className="size-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
            aria-label="Upload profile photo"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          @{userDetails?.username}
        </p>
      </div>

      <div className="border rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-cyan-700 dark:text-cyan-400">
            Personal Information
          </h2>
          <div className="flex gap-2">
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
            )}
            {isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit(onSubmit)}
                  loading={isSubmitting}
                >
                  Save
                </Button>
              </>
            )}
          </div>
        </div>

        <form className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InputField
            label="First Name"
            placeholder="Enter your first name"
            disabled={!isEditing}
            {...register("firstName")}
            error={errors.firstName?.message}
          />
          <InputField
            label="Last Name"
            placeholder="Enter your last name"
            disabled={!isEditing}
            {...register("lastName")}
            error={errors.lastName?.message}
          />
          <InputField
            label="Username"
            placeholder="Enter your username"
            disabled={!isEditing}
            {...register("username")}
            error={errors.username?.message}
          />
          <InputField
            label="Email"
            placeholder="Email address"
            disabled
            value={userDetails?.email ?? ""}
            readOnly
          />
          <InputField
            label="Phone Number"
            placeholder="Enter your phone number"
            disabled={!isEditing}
            {...register("mobileNumber")}
            error={errors.mobileNumber?.message}
          />
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field, fieldState }) => (
              <DateSelect
                date={field.value}
                setDate={field.onChange}
                label="Date of Birth"
                placeholder="Select your date of birth"
                error={fieldState?.error?.message}
                className="w-full"
                disabled={!isEditing}
              />
            )}
          />
          <Controller
            control={control}
            name="gender"
            render={({ field, fieldState }) => (
              <GenderSelect
                gender={field.value}
                setGender={field.onChange}
                label="Gender"
                placeholder="Select your gender"
                error={fieldState?.error?.message}
                className="w-full"
                disabled={!isEditing}
              />
            )}
          />
        </form>
      </div>
    </div>
  );
};

export default memo(ProfilePage);
