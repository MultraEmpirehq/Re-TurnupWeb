"use client";

import { postData } from "@/api";
import { TUserDetails } from "@/stores/user-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { env } from "@/lib/env";

export const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
export const APPLE_SCRIPT_SRC =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

export enum ESocialProvider {
  GOOGLE = "GOOGLE",
  APPLE = "APPLE",
}

export interface ISocialAuthResponse {
  user: TUserDetails;
  accessToken?: string;
}

interface ISocialLoginBody {
  provider: ESocialProvider;
  idToken: string;
  firstName?: string;
  lastName?: string;
}

const GOOGLE_CLIENT_ID = env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const APPLE_CLIENT_ID = env.NEXT_PUBLIC_APPLE_WEB_CLIENT_ID;
const APPLE_REDIRECT_URI = env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

const APPLE_USER_CANCELLED = "popup_closed_by_user";

interface IUseSocialAuthOptions {
  onSuccess: (payload?: ISocialAuthResponse) => Promise<void> | void;
  onError: (error: unknown) => void;
}

const useSocialAuth = ({ onSuccess, onError }: IUseSocialAuthOptions) => {
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [isGoogleScriptReady, setIsGoogleScriptReady] = useState(false);
  const [isAppleScriptReady, setIsAppleScriptReady] = useState(false);
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

  const signInWithApple = useCallback(async () => {
    if (!isAppleScriptReady || !window.AppleID) {
      handlersRef.current.onError(
        new Error("Apple sign-in is still loading. Please try again."),
      );
      return;
    }
    if (!APPLE_CLIENT_ID || !APPLE_REDIRECT_URI) {
      handlersRef.current.onError(
        new Error("Apple sign-in is not configured."),
      );
      return;
    }

    try {
      window.AppleID.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: "name email",
        redirectURI: APPLE_REDIRECT_URI,
        usePopup: true,
      });

      const response = await window.AppleID.auth.signIn();
      const idToken = response?.authorization?.id_token;
      if (!idToken) {
        handlersRef.current.onError(
          new Error("Apple did not return an identity token"),
        );
        return;
      }

      await exchangeToken({
        provider: ESocialProvider.APPLE,
        idToken,
        firstName: response?.user?.name?.firstName,
        lastName: response?.user?.name?.lastName,
      });
    } catch (error) {
      if ((error as { error?: string })?.error === APPLE_USER_CANCELLED) {
        return;
      }
      handlersRef.current.onError(error);
    }
  }, [isAppleScriptReady, exchangeToken]);

  return {
    googleButtonRef,
    isGoogleConfigured: !!GOOGLE_CLIENT_ID,
    isAppleConfigured: !!APPLE_CLIENT_ID && !!APPLE_REDIRECT_URI,
    isAppleScriptReady,
    isSubmitting,
    onGoogleScriptReady: () => setIsGoogleScriptReady(true),
    onAppleScriptReady: () => setIsAppleScriptReady(true),
    signInWithApple,
  };
};

export default useSocialAuth;
