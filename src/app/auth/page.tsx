"use client";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import joi from "joi";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import { getData, postData } from "@/api";
import { Separator } from "@/components/ui/separator";
import MagicLinkModal from "@/components/pages/auth/magic-link-modal";
import { toast } from "sonner";
import { constructErrorMessage } from "@/api/functions";
import useAuth from "@/hooks/use-auth";
import { TUserDetails } from "@/stores/user-store";
import { IUserCheckedCredentials } from "@/lib/types";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/variables";

export const dynamic = "force-dynamic";

interface IFormValues {
  email: string;
  password: string;
}

interface IAuthResponse {
  user: TUserDetails;
}

const checkAccountSchema = joi
  .object({
    email: joi.string().email().required().messages({
      "string.email": "Invalid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
  })
  .required();

const loginSchema = joi.object({
  email: joi.string().email().required().messages({
    "string.email": "Invalid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  password: joi.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});

const checkAccountDefaultValues: Omit<IFormValues, "password"> = {
  email: "",
};

const loginDefaultValues: IFormValues = {
  email: "",
  password: "",
};

const AuthPage = () => {
  const router = useRouter();
  const { performAuthOperation } = useAuth();
  const [magicLinkEmail, setMagicLinkEmail] = useState<string | null>(null);
  const [checkedCredentials, setCheckedCredentials] =
    useState<IUserCheckedCredentials | null>(null);
  const params = useParams();
  const email = useMemo(() => {
    const emailParam = params?.email;
    return Array.isArray(emailParam) ? emailParam[0] : emailParam;
  }, [params.email]);
  const shouldShowLoginForm = useMemo(() => {
    return (
      checkedCredentials?.exists &&
      checkedCredentials?.isAccountCreationCompleted
    );
  }, [checkedCredentials]);

  console.log(checkedCredentials);

  const schema = useMemo(() => {
    return shouldShowLoginForm ? loginSchema : checkAccountSchema;
  }, [shouldShowLoginForm]);
  const defaultValues = useMemo(() => {
    return shouldShowLoginForm ? loginDefaultValues : checkAccountDefaultValues;
  }, [shouldShowLoginForm]);
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isValid, isSubmitting },
  } = useForm<IFormValues>({
    resolver: joiResolver(schema),
    defaultValues,
    mode: "onChange",
  });
  useEffect(() => {
    if (email) {
      resetField("email", { defaultValue: email });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);
  const onSubmit = useCallback(
    async (body: IFormValues) => {
      try {
        if (!checkedCredentials) {
          const { data } = await getData<IUserCheckedCredentials>(
            `/auth?email=${body.email}`,
          );
          const credentials = data?.data;
          if (
            !credentials?.exists ||
            !credentials?.isAccountCreationCompleted ||
            !credentials?.isEmailVerified
          ) {
            await postData("/auth/register", {
              email: body.email,
              url: "http://localhost:3000/auth/register/{{token}}",
            });
            setMagicLinkEmail(body?.email);
            return;
          }
          // toast.success("Please proceed to login");
          setCheckedCredentials(credentials);
          return;
        }
        const { data } = await postData<IFormValues, IAuthResponse>(
          "/auth/login",
          body,
        );
        console.log(data?.data?.user);
        await performAuthOperation(data?.data?.user);
        router.push(ROUTES.HOME.href);
      } catch (error) {
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Something went wrong while accessing your account!",
          ),
        );
      }
    },
    [checkedCredentials, performAuthOperation, router],
  );

  return (
    <>
      <SectionContainer className="flex flex-col items-center justify-center min-h-full py-10 md:py-16">
        <div className="flex flex-col items-center justify-center w-full max-w-sm gap-10">
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-[clamp(1.1rem,2vw,2rem)] font-bold text-secondary-900">
              Welcome 🎉
            </h1>
            <p className="opacity-60 max-w-xs">
              Enter your email to sign up or login to your account.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5 w-full max-w-sm"
          >
            <InputField
              inputClassName="bg-black/10"
              placeholder="name@example.com"
              type="email"
              {...register("email")}
              error={errors.email?.message}
            />
            {shouldShowLoginForm && (
              <InputField
                inputClassName="bg-black/10"
                placeholder="Enter your password"
                type="password"
                {...register("password")}
                error={errors.password?.message}
              />
            )}
            <Button
              disabled={!isValid}
              loading={isSubmitting}
              type="submit"
              className="w-full"
            >
              Continue
            </Button>
          </form>
          <div className="flex flex-row items-center gap-2 w-full max-w-sm">
            <Separator className="flex-1" />
            <p className="text-sm opacity-60">OR</p>
            <Separator className="flex-1" />
          </div>
          <div className="flex flex-col items-center justify-center gap-4 w-full">
            <Button
              disabled={isSubmitting}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Continue with Google
            </Button>
            <Button
              disabled={isSubmitting}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Continue with Apple
            </Button>
          </div>
        </div>
      </SectionContainer>
      <MagicLinkModal
        open={!!magicLinkEmail}
        setOpen={() => setMagicLinkEmail(null)}
        email={magicLinkEmail || ""}
      />
    </>
  );
};

export default memo(AuthPage);
