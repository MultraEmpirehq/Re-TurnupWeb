"use client";

import { patchData, postData } from "@/api";
import { uploadAttachment } from "@/api/attachments";
import { constructErrorMessage } from "@/api/functions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import DateSelect from "@/components/ui/date-select";
import GenderSelect from "@/components/ui/gender-select";
import InputField from "@/components/ui/input-field";
import useAuth from "@/hooks/use-auth";
import { resolveAttachmentUrl } from "@/lib/functions";
import useUserStore, {
  EUserGenders,
  EUserRoles,
  TUserDetails,
} from "@/stores/user-store";
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

const roleLabels: Record<EUserRoles, string> = {
  [EUserRoles.ADMIN]: "Admin account",
  [EUserRoles.VENDOR]: "Vendor account",
  [EUserRoles.USER]: "Attendee account",
};

const cardClassName =
  "rounded-[1.75rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8";

/**
 * The signed-in user's photo and personal details, saved to the api. Shared by the
 * dashboard profile and the attendee account area so both edit the same way.
 */
const ProfileDetailsForm = () => {
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
    // Picks up the saved details once they load, unless mid-edit.
    values: isEditing ? undefined : defaultValues,
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
    return userDetails?.name || userDetails?.username || "Your account";
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
        const attachment = await uploadAttachment(file, "AVATAR");
        const { data } = await postData<{ attachmentId: string }, TUserDetails>(
          "/user/avatar",
          { attachmentId: attachment.id },
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
    <div className="space-y-6">
      <section className={cardClassName}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar className="size-20 rounded-3xl shadow-sm shadow-secondary-800/25">
                <AvatarImage
                  src={
                    resolveAttachmentUrl(
                      userDetails?.profileImageDetails,
                      userDetails?.profileImage,
                    ) ?? userDetails?.avatar
                  }
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-3xl bg-secondary-800 text-xl font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -right-1 -bottom-1 flex size-8 cursor-pointer items-center justify-center rounded-full bg-secondary-400 text-white ring-4 ring-white transition-colors hover:bg-secondary-500 disabled:opacity-50"
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
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-bold text-secondary-950">
                {displayName}
              </h2>
              {userDetails?.username && (
                <p className="mt-1 text-sm text-secondary-500">
                  @{userDetails.username}
                </p>
              )}
              {userDetails?.email && (
                <p className="mt-1 truncate text-sm text-secondary-500">
                  {userDetails.email}
                </p>
              )}
            </div>
          </div>
          {userDetails?.role && (
            <div className="w-fit rounded-3xl bg-secondary-50 px-4 py-3 text-sm text-secondary-600">
              {roleLabels[userDetails.role]}
            </div>
          )}
        </div>
      </section>

      <section className={cardClassName}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-secondary-400 uppercase">
              Profile details
            </p>
            <h2 className="mt-2 text-2xl font-bold text-secondary-950">
              Personal information
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-secondary-500">
              The name, username and contact details used across bookings and
              communication.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="h-11 rounded-2xl border-secondary-200 px-5 font-semibold text-secondary-950 hover:bg-secondary-50"
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="h-11 rounded-2xl px-5 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit(onSubmit)}
                  loading={isSubmitting}
                  className="h-11 rounded-2xl bg-secondary-400 px-5 font-semibold text-white hover:bg-secondary-500"
                >
                  Save changes
                </Button>
              </>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2"
        >
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
            helperText="Your email is used to sign in and can't be changed here."
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
          {/* Lets Enter submit while editing. */}
          <button type="submit" hidden disabled={!isEditing} />
        </form>
      </section>
    </div>
  );
};

export default memo(ProfileDetailsForm);
