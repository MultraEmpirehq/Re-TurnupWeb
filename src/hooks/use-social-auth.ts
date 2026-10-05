"use client";

import { postData } from "@/api";
import { TUserDetails } from "@/stores/user-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { env } from "@/lib/env";

export const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

export enum ESocialProvider {
  GOOGLE = "GOOGLE",
}

export interface ISocialAuthResponse {
  user: TUserDetails;
  accessToken?: string;
}

interface ISocialLoginBody {
  provider: ESocialProvider;
  idToken: string;
}

const GOOGLE_CLIENT_ID = env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID;

interface IUseSocialAuthOptions {
  onSuccess: (payload?: ISocialAuthResponse) => Promise<void> | void;
  onError: (error: unknown) => void;
}

const useSocialAuth = ({ onSuccess, onError }: IUseSocialAuthOptions) => {
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [isGoogleScriptReady, setIsGoogleScriptReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlersRef = useRef({ onSuccess, onError });
  useEffect(() => {
    handlersRef.current = { onSuccess, onError };
  }, [onSuccess, onError]);

  const exchangeToken = useCallback(async (body: ISocialLoginBody) => {
    setIsSubmitting(true);
    try {
      const { data } = await postData<ISocialLoginBody, ISocialAuthResponse>(
        "/auth/social",
        body,
      );
      await handlersRef.current.onSuccess(data?.data);
    } catch (error) {
      handlersRef.current.onError(error);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  useEffect(() => {
    if (
      !isGoogleScriptReady ||
      !GOOGLE_CLIENT_ID ||
      !googleButtonRef.current ||
      !window.google
    ) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: ({ credential }) => {
        if (!credential) {
          handlersRef.current.onError(
            new Error("Google did not return a credential"),
          );
          return;
        }
        void exchangeToken({
          provider: ESocialProvider.GOOGLE,
          idToken: credential,
        });
      },
    });

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "center",
      width: googleButtonRef.current.offsetWidth || undefined,
    });
  }, [isGoogleScriptReady, exchangeToken]);

  return {
    googleButtonRef,
    isGoogleConfigured: !!GOOGLE_CLIENT_ID,
    isSubmitting,
    onGoogleScriptReady: () => setIsGoogleScriptReady(true),
  };
};

export default useSocialAuth;
