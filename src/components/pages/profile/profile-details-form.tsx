"use client";

import InviteFriendsCard from "./invite-friends-card";
import CreditCard from "./credit-card";
import { patchData, postData } from "@/api";
import { uploadAttachment } from "@/api/attachments";
import { constructErrorMessage } from "@/api/functions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import DateSelect from "@/components/ui/date-select";
import GenderSelect from "@/components/ui/gender-select";
import InputField from "@/components/ui/input-field";
import useAuth from "@/hooks/use-auth";
import {
  adultAgeMessage,
  earliestBirthDate,
  latestAdultBirthDate,
} from "@/lib/age";
import { resolveAttachmentUrl } from "@/lib/functions";
import useUserStore, {
  EUserGenders,
  EUserRoles,
  TUserDetails,
} from "@/stores/user-store";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { format } from "date-fns";
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  CircleAlert,
  CircleHelp,
  KeyRound,
  Mail,
  Pencil,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/variables";
import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface IProfileFormValues {
  firstName: string;
  lastName: string;
  username: string;
  dateOfBirth?: Date;
  gender: EUserGenders;
  // The API's field is `phone`; anything else is rejected and the whole save fails.
  phone: string;
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
  dateOfBirth: Joi.date()
    .required()
    .custom((value: Date, helpers) =>
      value > latestAdultBirthDate() ? helpers.error("date.adult") : value,
    )
    .messages({
      "date.base": "Date of birth is required",
      "any.required": "Date of birth is required",
      "date.adult": adultAgeMessage,
    }),
  gender: Joi.string().required().messages({
    "string.empty": "Gender is required",
    "any.required": "Gender is required",
  }),
  // The same rule as the API, so a bad number is caught here, not on save.
  phone: Joi.string()
    .allow("")
    .pattern(/^\+?[0-9 ()-]{7,20}$/)
    .optional()
    .messages({ "string.pattern.base": "Please enter a valid phone number" }),
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
      // Left empty rather than today, which would never be old enough.
      dateOfBirth: userDetails?.dateOfBirth
        ? new Date(userDetails.dateOfBirth)
        : undefined,
      gender: userDetails?.gender ?? EUserGenders.MALE,
      phone: userDetails?.phone ?? "",
    }),
    [userDetails],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
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
    async (values: IProfileFormValues) => {
      // Only what was changed goes up, so a field the API doesn't know yet
      // (or one left as it was) can't fail the whole save.
      const body = Object.fromEntries(
        Object.entries(values).filter(
          ([key]) => dirtyFields[key as keyof IProfileFormValues],
        ),
      ) as Partial<IProfileFormValues>;
      if (Object.keys(body).length === 0) {
        setIsEditing(false);
        return;
      }
      try {
        const { data } = await patchData<
          Partial<IProfileFormValues>,
          TUserDetails
        >("/user", body);
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
    [performAuthOperation, dirtyFields],
  );

  const handleCancelEdit = useCallback(() => {
    reset(defaultValues);
    setIsEditing(false);
  }, [reset, defaultValues]);

  // Vendors and admins keep their settings in the dashboard.
  const settingsHref =
    userDetails?.role === EUserRoles.USER || !userDetails?.role
      ? ROUTES.PROFILE_SETTINGS.href
      : ROUTES.SETTINGS.href;
  const memberSince = userDetails?.createdAt
    ? format(new Date(userDetails.createdAt), "MMMM yyyy")
    : null;

  return (
    // Laid out by the space it's given (a container query), not the screen: the
    // account page gives it the full width, the dashboard a narrower column.
    <div className="@container space-y-6">
      {/* Who they are: photo, name, how they sign in. */}
      <section className="overflow-hidden rounded-[1.75rem] border border-secondary-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div
          aria-hidden
          className="h-28 bg-linear-to-r from-secondary-400 via-primary-300 to-primary sm:h-36"
        />
        <div className="flex flex-col gap-5 px-6 pb-6 sm:px-8 @3xl:flex-row @3xl:items-end @3xl:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative -mt-12 w-fit shrink-0 sm:-mt-14">
              <Avatar className="size-24 rounded-[1.75rem] ring-4 ring-white shadow-md sm:size-28">
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
                <AvatarFallback className="rounded-[1.75rem] bg-secondary-800 text-2xl font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -right-1 -bottom-1 flex size-9 cursor-pointer items-center justify-center rounded-full bg-secondary-400 text-white ring-4 ring-white transition-colors hover:bg-secondary-500 disabled:opacity-50"
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
            <div className="min-w-0 pb-1">
              <h1 className="truncate text-2xl font-bold text-secondary-950 sm:text-3xl">
                {displayName}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary-500">
                {userDetails?.username && <span>@{userDetails.username}</span>}
                {memberSince && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    Member since {memberSince}
                  </span>
                )}
              </p>
            </div>
          </div>
          {userDetails?.role && (
            <span className="w-fit rounded-full bg-secondary-50 px-4 py-2 text-sm font-medium text-secondary-700">
              {roleLabels[userDetails.role]}
            </span>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 @5xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className={cardClassName}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-secondary-950">
                Personal information
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-secondary-500">
                Used on your tickets and orders, and by organisers to reach you
                about events you&apos;re going to.
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
              label="Phone Number"
              placeholder="+234 801 234 5678"
              disabled={!isEditing}
              {...register("phone")}
              error={errors.phone?.message}
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
                  minDate={earliestBirthDate()}
                  maxDate={latestAdultBirthDate()}
                  helperText="You must be 18 or older."
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
                  inputClassName="w-full"
                  disabled={!isEditing}
                />
              )}
            />
            {/* Lets Enter submit while editing. */}
            <button type="submit" hidden disabled={!isEditing} />
          </form>
        </section>

        {/* How they sign in, and where to change the rest. */}
        <aside className="space-y-6">
          <CreditCard className={cardClassName} />
          <InviteFriendsCard className={cardClassName} />
          <section className={cardClassName}>
            <h2 className="text-base font-bold text-secondary-950">
              Sign-in &amp; security
            </h2>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-secondary-400" />
                <div className="min-w-0">
                  <p className="text-secondary-500">Email</p>
                  <p className="truncate font-medium text-secondary-950">
                    {userDetails?.email ?? "Not set"}
                  </p>
                  {userDetails?.isEmailVerified === false ? (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-secondary-700">
                      <CircleAlert className="size-3.5" />
                      Not verified yet
                    </p>
                  ) : (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700">
                      <BadgeCheck className="size-3.5" />
                      Verified · used to sign in
                    </p>
                  )}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-secondary-400" />
                <div className="min-w-0">
                  <p className="text-secondary-500">Phone</p>
                  <p className="font-medium text-secondary-950">
                    {userDetails?.phone || "Not added"}
                  </p>
                </div>
              </li>
            </ul>
            <Button
              asChild
              variant="outline"
              className="mt-6 h-11 w-full rounded-2xl border-secondary-200 font-semibold"
            >
              <Link href={settingsHref}>
                <KeyRound className="size-4" />
                Password, devices &amp; notifications
              </Link>
            </Button>
          </section>

          <section className="rounded-[1.75rem] bg-secondary-50 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <CircleHelp className="mt-0.5 size-5 shrink-0 text-secondary-500" />
              <div>
                <p className="text-sm font-semibold text-secondary-950">
                  Need to change your email?
                </p>
                <p className="mt-1 text-sm leading-6 text-secondary-500">
                  It&apos;s how you sign in, so our team changes it for you
                  after checking it&apos;s you.
                </p>
                <Link
                  href={ROUTES.PROFILE_HELP.href}
                  className="mt-3 inline-block text-sm font-semibold text-secondary-600 hover:text-secondary-900 hover:underline"
                >
                  Contact support
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default memo(ProfileDetailsForm);
