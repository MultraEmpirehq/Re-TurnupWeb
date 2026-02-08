"use client";
import nextDynamic from "next/dynamic";
import { getData, patchData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import DateSelect from "@/components/ui/date-select";
import GenderSelect from "@/components/ui/gender-select";
import InputField from "@/components/ui/input-field";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

import useAuth from "@/hooks/use-auth";
import { ROUTES } from "@/lib/variables";
import { EUserGenders, TUserDetails } from "@/stores/user-store";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

export const dynamic = "force-dynamic";

const CountrySelect = nextDynamic(
  () => import("@/components/ui/country-select"),
  { ssr: false, loading: () => <Skeleton className="h-10 w-full rounded-md" /> }
);

interface IFormValues {
  firstName: string;
  lastName: string;
  username: string;
  dateOfBirth: Date;
  gender: EUserGenders;
  country: string;
  postalCode: string;
  // address: string;
  isUserNameValid: boolean;
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
  dateOfBirth: Joi.date().required().messages({
    "date.empty": "Date of birth is required",
    "any.required": "Date of birth is required",
  }),
  gender: Joi.string().required().messages({
    "string.empty": "Gender is required",
    "any.required": "Gender is required",
  }),
  country: Joi.string().required().messages({
    "string.empty": "Country is required",
    "any.required": "Country is required",
  }),
  postalCode: Joi.string().required().messages({
    "string.empty": "Postal code is required",
    "any.required": "Postal code is required",
  }),
  // address: Joi.string().required().messages({
  //   "string.empty": "Address is required",
  //   "any.required": "Address is required",
  // }),
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
  dateOfBirth: new Date(),
  gender: EUserGenders.MALE,
  country: "",
  postalCode: "",
  // address: "",
  isUserNameValid: false,
};
const CompleteUser = () => {
  const [isValidatingUserName, setIsValidatingUserName] = useState(false);
  const { performAuthOperation } = useAuth();
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<IFormValues>({
    resolver: joiResolver(schema),
    defaultValues,
    mode: "onChange",
  });
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
            "Username is not available"
          ),
        });
      } finally {
        setIsValidatingUserName(false);
      }
    },
    500
  );
  const username = watch("username");
  const isUserNameValid = watch("isUserNameValid");

  const onSubmit = useCallback(
    async (body: IFormValues) => {
      const { username, isUserNameValid, ...payload } = body;
      try {
        const { data } = await patchData<
          Omit<IFormValues, "isUserNameValid">,
          TUserDetails
        >("/user", { ...payload, username: username?.trim()?.toLowerCase() });
        await performAuthOperation(data?.data);
        toast.success("Account completed successfully");
        router.push(ROUTES.HOME.href);
      } catch (error) {
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Something went wrong while completing your account"
          )
        );
      }
    },
    [router, performAuthOperation]
  );
  useEffect(() => {
    const trimmedUsername = username?.trim();
    setValue("isUserNameValid", false);
    if (trimmedUsername && trimmedUsername.length > 2) {
      checkUserNameAvailability(username);
      return;
    }
  }, [username, checkUserNameAvailability, setValue]);

  return (
    <SectionContainer className="flex flex-col items-center justify-center min-h-full py-10 md:py-16">
      <div className="flex flex-col items-center justify-center w-full max-w-sm gap-10">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-[clamp(1.1rem,1.5vw,1.5rem)] font-bold text-secondary-900">
            Complete Your Account
          </h1>
          <p className="opacity-60 max-w-xs">
            Complete your account creation by creating a password to secure your
            account.
          </p>
        </div>
        <form
          className="space-y-5 w-full max-w-sm"
          onSubmit={handleSubmit(onSubmit)}
        >
          <InputField
            inputClassName="bg-black/10"
            placeholder="Enter your first name"
            label="First Name"
            type="text"
            {...register("firstName")}
            error={errors?.firstName?.message}
          />
          <InputField
            inputClassName="bg-black/10"
            placeholder="Enter your first name"
            label="Last Name"
            type="text"
            {...register("lastName")}
            error={errors?.lastName?.message}
          />
          <InputField
            inputClassName="bg-black/10"
            placeholder="Enter your username"
            label="Username"
            rightIcon={
              <>
                {isValidatingUserName && <Spinner className="size-4" />}
                {!isValidatingUserName && isUserNameValid && (
                  <CheckIcon className="size-4" />
                )}
              </>
            }
            type="text"
            {...register("username")}
            error={errors?.username?.message}
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
                inputClassName="w-full bg-black/10"
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
                inputClassName="w-full bg-black/10"
              />
            )}
          />
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
                inputClassName="w-full bg-black/10"
              />
            )}
          />
          {/* 
          <InputField
            inputClassName="bg-black/10"
            placeholder="Enter your first name"
            label="Country"
            type="text"
            {...register("country")}
            error={errors?.country?.message}
          /> */}
          <InputField
            inputClassName="bg-black/10"
            placeholder="Enter your postal code"
            label="Postal Code"
            type="text"
            {...register("postalCode")}
            error={errors?.postalCode?.message}
          />
          {/* <InputField
            inputClassName="bg-black/10"
            placeholder="Enter your address"
            label="Address"
            type="text"
            {...register("address")}
            error={errors?.address?.message}
          /> */}
          <Button
            className="w-full mt-4"
            type="submit"
            disabled={!isValid}
            loading={isSubmitting}
          >
            Complete Account
          </Button>
        </form>
      </div>
    </SectionContainer>
  );
};

export default memo(CompleteUser);
