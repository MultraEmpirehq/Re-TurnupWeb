"use client";
import nextDynamic from "next/dynamic";
import { getData, patchData, postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import DateSelect from "@/components/ui/date-select";
import GenderSelect from "@/components/ui/gender-select";
import InputField from "@/components/ui/input-field";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

import useAuth from "@/hooks/use-auth";
import { INTENT_PARAM, intentFrom } from "@/lib/auth-intent";
import { forgetInvite, readInvite } from "@/lib/invite";
import { ROUTES } from "@/lib/variables";
import useUserStore, { EUserGenders, TUserDetails } from "@/stores/user-store";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { CheckIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import {
  adultAgeMessage,
  earliestBirthDate,
  latestAdultBirthDate,
} from "@/lib/age";

const CountrySelect = nextDynamic(
  () => import("@/components/ui/country-select"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-12 w-full rounded-xl" />,
  },
);

interface IFormValues {
  firstName: string;
  lastName: string;
  username: string;
  dateOfBirth?: Date;
  gender: EUserGenders;
  country: string;
  postalCode: string;
  isUserNameValid: boolean;
  /** Optional: a friend's username or an influencer code. */
  inviteCode: string;
}

const schema = Joi.object({
  firstName: Joi.string().required().messages({
    "string.empty": "Name is required",
    "any.required": "Name is required",
    "string.pattern.base": "Name must be a valid name",
  }),
  lastName: Joi.string().required().messages({
    "string.empty": "Last name is required",
    "any.required": "Last name is required",
    "string.pattern.base": "Last name must be a valid last name",
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
  country: Joi.string().required().messages({
    "string.empty": "Country is required",
    "any.required": "Country is required",
  }),
  // Optional: not every country uses one, and plenty of people don't know theirs.
  postalCode: Joi.string().allow("").optional(),
  inviteCode: Joi.string().allow("").max(40).optional(),
  isUserNameValid: Joi.boolean().valid(true).required().messages({
    "boolean.valid": "Username is not available",
    "boolean.empty": "Username validation is required",
    "any.required": "Username validation is required",
    "any.only": "Username is not available",
  }),
});

const defaultValues: IFormValues = {
  firstName: "",
  lastName: "",
  username: "",
  // Left empty rather than today, which would never be old enough.
  dateOfBirth: undefined,
  gender: EUserGenders.MALE,
  country: "",
  postalCode: "",
  isUserNameValid: false,
  inviteCode: "",
};

const CompleteUserForm = () => {
  const [isValidatingUserName, setIsValidatingUserName] = useState(false);
  const { performAuthOperation } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect");
  const intent = intentFrom(searchParams?.get(INTENT_PARAM));
  const userDetails = useUserStore((state) => state.userDetails);
  const hasPrefilled = useRef(false);
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<IFormValues>({
    resolver: joiResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  // Google sign-ups arrive with a name and a generated username already
  // saved, so start from those instead of making people type them again.
  useEffect(() => {
    if (!userDetails || hasPrefilled.current) return;
    hasPrefilled.current = true;
    reset(
      {
        ...defaultValues,
        firstName: userDetails.firstName ?? "",
        lastName: userDetails.lastName ?? "",
        username: userDetails.username ?? "",
        dateOfBirth: userDetails.dateOfBirth
          ? new Date(userDetails.dateOfBirth)
          : defaultValues.dateOfBirth,
        gender: userDetails.gender ?? defaultValues.gender,
        country: userDetails.country ?? "",
        isUserNameValid: !!userDetails.username,
        // From an invite link they opened before signing up.
        inviteCode: readInvite() ?? "",
      },
      { keepDefaultValues: true },
    );
  }, [userDetails, reset]);

  const checkUserNameAvailability = useDebouncedCallback(
    async (username: string) => {
      setIsValidatingUserName(true);
      setValue("isUserNameValid", false);
      try {
        await getData(`/auth/username?username=${username}`);
        setValue("isUserNameValid", true);
      } catch (error) {
        setError("username", {
          message: constructErrorMessage(
            error as TApiErrorResponseType,
            "Username is not available",
          ),
        });
      } finally {
        setIsValidatingUserName(false);
      }
    },
    500,
  );
  // Who the invite code belongs to, so they can see it's the right one.
  const [invite, setInvite] = useState<
    { state: "idle" | "checking" | "bad" } | { state: "ok"; name: string }
  >({ state: "idle" });
  const inviteCode = watch("inviteCode");
  const checkInvite = useDebouncedCallback(async (code: string) => {
    try {
      const { data } = await getData<{ name: string }>(
        `/referrals/code/${encodeURIComponent(code)}`,
      );
      setInvite({ state: "ok", name: data?.data?.name ?? "a friend" });
    } catch {
      setInvite({ state: "bad" });
    }
  }, 500);
  useEffect(() => {
    const code = inviteCode?.trim();
    if (!code) {
      checkInvite.cancel();
      setInvite({ state: "idle" });
      return;
    }
    setInvite({ state: "checking" });
    checkInvite(code);
  }, [inviteCode, checkInvite]);

  const username = watch("username");
  const isUserNameValid = watch("isUserNameValid");

  const onSubmit = useCallback(
    async (body: IFormValues) => {
      const {
        username,
        postalCode,
        isUserNameValid: _isUserNameValid,
        inviteCode: code,
        ...payload
      } = body;
      try {
        const { data } = await patchData<
          Omit<IFormValues, "isUserNameValid" | "postalCode" | "inviteCode"> & {
            postalCode?: string;
          },
          TUserDetails
        >("/user", {
          ...payload,
          username: username?.trim()?.toLowerCase(),
          // Left out when blank: the api checks any postcode it's given.
          ...(postalCode?.trim() ? { postalCode: postalCode.trim() } : {}),
        });
        await performAuthOperation(data?.data);
        // The invite is a bonus: if it can't be used, sign-up still finishes.
        // An optional extra: a code that didn't check out is left off, not a
        // reason to stop them finishing.
        if (code?.trim() && invite.state === "bad") {
          toast.info("We left the invite code off: it isn't valid.");
        } else if (code?.trim()) {
          try {
            await postData("/referrals/apply", { code: code.trim() });
          } catch (error) {
            toast.error(
              constructErrorMessage(
                error as TApiErrorResponseType,
                "We couldn't add that invite code",
              ),
            );
          }
        }
        forgetInvite();
        toast.success("Account completed successfully");
        // Organisers go on to tell us about their business; everyone else to Explore.
        router.push(
          redirectTo ||
            (intent === "vendor"
              ? ROUTES.VENDOR_VERIFICATION.href
              : ROUTES.EXPLORE.href),
        );
      } catch (error) {
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Something went wrong while completing your account",
          ),
        );
      }
    },
    [router, performAuthOperation, redirectTo, intent, invite.state],
  );
  useEffect(() => {
    const trimmedUsername = username?.trim();
    // Their own saved username would read as taken, so it needs no check.
    if (
      trimmedUsername &&
      trimmedUsername.toLowerCase() === userDetails?.username?.toLowerCase()
    ) {
      checkUserNameAvailability.cancel();
      setValue("isUserNameValid", true, { shouldValidate: true });
      return;
    }
    setValue("isUserNameValid", false);
    if (trimmedUsername && trimmedUsername.length > 2) {
      checkUserNameAvailability(username);
      return;
    }
  }, [username, userDetails?.username, checkUserNameAvailability, setValue]);

  return (
    <div className="flex w-full flex-col gap-7">
      <div className="space-y-2">
        <p className="text-sm font-semibold tracking-wider text-primary uppercase">
          {intent === "vendor" ? "Organiser sign-up · Step 2 of 3" : "Almost there"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-secondary-950">
          Tell us about you
        </h1>
        <p className="text-secondary-950/60">
          {intent === "vendor"
            ? "Your own details first. Your business comes next, so you can start selling tickets."
            : "A few details so we can show you events that fit. Takes a minute."}
        </p>
      </div>
      {/* Always clickable: a disabled button never says what's missing, so
          clicking checks the form and points at what to fix. */}
      <form
        className="w-full space-y-5"
        onSubmit={handleSubmit(onSubmit, (fieldErrors) => {
          const first = Object.keys(fieldErrors)[0];
          toast.error(
            first === "isUserNameValid"
              ? "Pick a username that's available"
              : "Check the highlighted fields",
          );
        })}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <InputField
            label="First name"
            labelClassName="text-secondary-950"
            inputClassName="h-12 rounded-xl bg-[#f7f9fc]"
            placeholder="Ada"
            type="text"
            autoComplete="given-name"
            {...register("firstName")}
            error={errors?.firstName?.message}
          />
          <InputField
            label="Last name"
            labelClassName="text-secondary-950"
            inputClassName="h-12 rounded-xl bg-[#f7f9fc]"
            placeholder="Okafor"
            type="text"
            autoComplete="family-name"
            {...register("lastName")}
            error={errors?.lastName?.message}
          />
        </div>
        <InputField
          label="Username"
          labelClassName="text-secondary-950"
          inputClassName="h-12 rounded-xl bg-[#f7f9fc]"
          placeholder="Pick something people can find you by"
          autoComplete="username"
          rightIcon={
            <>
              {isValidatingUserName && <Spinner className="size-4" />}
              {!isValidatingUserName && isUserNameValid && (
                <CheckIcon className="size-4 text-emerald-600" />
              )}
            </>
          }
          type="text"
          {...register("username")}
          error={errors?.username?.message}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field, fieldState }) => (
              <DateSelect
                date={field.value}
                setDate={field.onChange}
                label="Date of birth"
                placeholder="Select a date"
                error={fieldState?.error?.message}
                className="w-full"
                inputClassName="w-full h-12 rounded-xl bg-[#f7f9fc]"
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
                placeholder="Select"
                error={fieldState?.error?.message}
                className="w-full"
                inputClassName="w-full h-12 rounded-xl bg-[#f7f9fc]"
              />
            )}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-[1.4fr_1fr]">
          <Controller
            control={control}
            name="country"
            render={({ field, fieldState }) => (
              <CountrySelect
                country={field.value}
                setCountry={field.onChange}
                label="Country"
                placeholder="Select your country"
                error={fieldState?.error?.message}
                className="w-full"
                inputClassName="w-full h-12 rounded-xl bg-[#f7f9fc]"
              />
            )}
          />
          <InputField
            label="Postcode (optional)"
            labelClassName="text-secondary-950"
            inputClassName="h-12 rounded-xl bg-[#f7f9fc]"
            placeholder="e.g. 100001"
            type="text"
            autoComplete="postal-code"
            {...register("postalCode")}
            error={errors?.postalCode?.message}
          />
        </div>
        <InputField
          label="Invite code (optional)"
          labelClassName="text-secondary-950"
          inputClassName="h-12 rounded-xl bg-[#f7f9fc]"
          placeholder="A friend's username or a promo code"
          type="text"
          autoCapitalize="none"
          rightIcon={
            invite.state === "checking" ? (
              <Spinner className="size-4" />
            ) : invite.state === "ok" ? (
              <CheckIcon className="size-4 text-emerald-600" />
            ) : null
          }
          {...register("inviteCode")}
          error={invite.state === "bad" ? "That code isn't valid" : undefined}
          helperText={
            invite.state === "ok"
              ? `${invite.name} invited you. You'll both get Turnupz Credit after your first ticket purchase.`
              : "Got one from a friend? Add it and you'll both earn credit."
          }
        />
        <Button
          className="mt-2 h-12 w-full rounded-full bg-secondary text-base text-white hover:bg-secondary-600"
          type="submit"
          disabled={isSubmitting || isValidatingUserName}
          loading={isSubmitting}
        >
          Finish and start exploring
        </Button>
      </form>
    </div>
  );
};

export default memo(CompleteUserForm);
