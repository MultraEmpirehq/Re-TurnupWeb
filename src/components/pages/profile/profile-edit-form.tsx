"use client";

import { patchData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import DateSelect from "@/components/ui/date-select";
import GenderSelect from "@/components/ui/gender-select";
import InputField from "@/components/ui/input-field";
import { Switch } from "@/components/ui/switch";
import TextareaField from "@/components/ui/textarea-field";
import useAuth from "@/hooks/use-auth";
import {
  adultAgeMessage,
  earliestBirthDate,
  latestAdultBirthDate,
} from "@/lib/age";
import { ROUTES } from "@/lib/variables";
import useUserStore, { EUserGenders, TUserDetails } from "@/stores/user-store";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import {
  ArrowLeft,
  BadgeCheck,
  CircleAlert,
  CircleHelp,
  KeyRound,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { memo, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "@/lib/toast";

interface IEditValues {
  firstName: string;
  lastName: string;
  username: string;
  bio: string;
  website: string;
  phone: string;
  dateOfBirth?: Date;
  gender: EUserGenders;
  showCountry: boolean;
}

const BIO_MAX = 160;

const schema = Joi.object({
  firstName: Joi.string()
    .trim()
    .required()
    .messages({ "string.empty": "First name is required" }),
  lastName: Joi.string()
    .trim()
    .required()
    .messages({ "string.empty": "Last name is required" }),
  username: Joi.string().trim().min(3).max(30).required().messages({
    "string.empty": "Username is required",
    "string.min": "At least 3 characters",
    "string.max": "30 characters at most",
  }),
  bio: Joi.string()
    .allow("")
    .max(BIO_MAX)
    .messages({
      "string.max": `Keep your bio under ${BIO_MAX} characters`,
    }),
  website: Joi.string()
    .allow("")
    .max(200)
    .pattern(/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i)
    .messages({
      "string.pattern.base": "Enter a web address, like yoursite.com",
    }),
  // The same rule as the API, so a bad number is caught here, not on save.
  phone: Joi.string()
    .allow("")
    .pattern(/^\+?[0-9 ()-]{7,20}$/)
    .messages({ "string.pattern.base": "Please enter a valid phone number" }),
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
  gender: Joi.string().required(),
  showCountry: Joi.boolean(),
});

const card =
  "rounded-[1.75rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8";

const Group: React.FC<{
  title: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ title, hint, children }) => (
  <section className={card}>
    <h2 className="text-lg font-bold text-secondary-950">{title}</h2>
    {hint && <p className="mt-1 text-sm text-secondary-500">{hint}</p>}
    <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>
  </section>
);

/**
 * Editing your profile, grouped as on the app: about you (what others see),
 * how to reach you, and the rest. Save shows once something changed, and
 * leaving with unsaved changes asks first.
 */
const ProfileEditForm = () => {
  const router = useRouter();
  const user = useUserStore((state) => state.userDetails);
  const { performAuthOperation } = useAuth();

  const saved: IEditValues = useMemo(
    () => ({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      username: user?.username ?? "",
      bio: user?.bio ?? "",
      website: user?.website ?? "",
      phone: user?.phone ?? "",
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
      gender: user?.gender ?? EUserGenders.MALE,
      showCountry: !!user?.showCountry,
    }),
    [user],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<IEditValues>({
    resolver: joiResolver(schema),
    defaultValues: saved,
    mode: "onChange",
  });
  // Picks up the saved details once they load, unless mid-edit.
  useEffect(() => {
    if (!isDirty) reset(saved);
  }, [isDirty, reset, saved]);

  // Leaving the page (closing the tab, reloading) with unsaved changes asks first.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const leave = () => {
    if (isDirty && !window.confirm("Leave without saving your changes?"))
      return;
    router.push(ROUTES.USER_PROFILE.href);
  };

  const onSubmit = async (values: IEditValues) => {
    // Only what changed goes up, so a field left as it was can't fail the save.
    const body = Object.fromEntries(
      Object.entries(values)
        .filter(([key]) => dirtyFields[key as keyof IEditValues])
        .map(([key, value]) => [
          key,
          typeof value === "string" ? value.trim() : value,
        ]),
    ) as Partial<IEditValues>;
    try {
      const { data } = await patchData<Partial<IEditValues>, TUserDetails>(
        "/user",
        body,
      );
      await performAuthOperation(data?.data);
      reset(values);
      toast.success("Profile saved");
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't save your profile.",
        ),
      );
    }
  };

  const bioLength = watch("bio")?.length ?? 0;

  return (
    <div className="@container space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={leave}
          aria-label="Back to your profile"
          className="flex size-10 items-center justify-center rounded-full border border-secondary-100 bg-white text-secondary-700 hover:bg-secondary-50"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-secondary-950">
            Edit profile
          </h1>
          <p className="text-sm text-secondary-500">
            Change your photo from your profile page.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid items-start gap-6 @5xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div className="space-y-6">
          <Group title="About you" hint="What people see on your profile.">
            <InputField
              label="First name"
              {...register("firstName")}
              error={errors.firstName?.message}
            />
            <InputField
              label="Last name"
              {...register("lastName")}
              error={errors.lastName?.message}
            />
            <InputField
              label="Username"
              {...register("username")}
              error={errors.username?.message}
              helperText="Also your invite code."
            />
            <InputField
              label="Website"
              placeholder="yoursite.com"
              {...register("website")}
              error={errors.website?.message}
            />
            <div className="md:col-span-2">
              <TextareaField
                label="Bio"
                placeholder="A line about you"
                maxLength={BIO_MAX}
                inputClassName="min-h-24"
                {...register("bio")}
                error={errors.bio?.message}
                helperText={`${bioLength}/${BIO_MAX}`}
              />
            </div>
          </Group>

          <Group
            title="Contact"
            hint="Organisers use these to reach you about events you're going to."
          >
            <InputField
              label="Phone"
              placeholder="+234 801 234 5678"
              {...register("phone")}
              error={errors.phone?.message}
            />
            <InputField
              label="Email"
              value={user?.email ?? ""}
              disabled
              readOnly
              helperText="Your sign-in email can't be changed here."
            />
          </Group>

          <Group
            title="Personal"
            hint="Kept private, except your country if you choose to show it."
          >
            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field, fieldState }) => (
                <DateSelect
                  date={field.value}
                  setDate={field.onChange}
                  label="Date of birth"
                  placeholder="Select your date of birth"
                  error={fieldState?.error?.message}
                  className="w-full"
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
                />
              )}
            />
            <Controller
              control={control}
              name="showCountry"
              render={({ field }) => (
                <label className="flex items-center justify-between gap-4 rounded-2xl border border-secondary-100 p-4 md:col-span-2">
                  <span>
                    <span className="block text-sm font-semibold text-secondary-950">
                      Show my country
                    </span>
                    <span className="block text-sm text-secondary-500">
                      {user?.country
                        ? `Shows "${user.country}" next to your @username.`
                        : "Shows your country next to your @username."}
                    </span>
                  </span>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </label>
              )}
            />
          </Group>
        </div>

        <aside className="space-y-6 @5xl:sticky @5xl:top-24">
          <section className={card}>
            <h2 className="text-base font-bold text-secondary-950">
              Sign-in &amp; security
            </h2>
            <div className="mt-5 flex items-start gap-3 text-sm">
              <Mail className="mt-0.5 size-4 shrink-0 text-secondary-400" />
              <div className="min-w-0">
                <p className="truncate font-medium text-secondary-950">
                  {user?.email ?? "Not set"}
                </p>
                {user?.isEmailVerified === false ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-secondary-700">
                    <CircleAlert className="size-3.5" /> Not verified yet
                  </p>
                ) : (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700">
                    <BadgeCheck className="size-3.5" /> Verified · used to sign
                    in
                  </p>
                )}
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              className="mt-6 h-11 w-full rounded-2xl border-secondary-200 font-semibold"
            >
              <Link href={ROUTES.PROFILE_SETTINGS.href}>
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

        {/* Shows once something changed, and stays in reach while scrolling. */}
        {isDirty && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-secondary-100 bg-white/95 px-4 py-3 shadow-[0_-12px_32px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <p className="text-sm font-medium text-secondary-700">
                You have unsaved changes
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => reset(saved)}
                  disabled={isSubmitting}
                  className="h-11 rounded-2xl px-5 font-semibold"
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="h-11 rounded-2xl bg-secondary-700 px-6 font-semibold text-white hover:bg-secondary-800"
                >
                  Save changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default memo(ProfileEditForm);
