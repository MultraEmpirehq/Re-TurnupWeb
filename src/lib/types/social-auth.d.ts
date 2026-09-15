interface IGoogleCredentialResponse {
  credential: string;
}

interface IGoogleButtonOptions {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "small" | "medium" | "large";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
}

interface IGoogleAccountsId {
  initialize: (options: {
    client_id: string;
    callback: (response: IGoogleCredentialResponse) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: IGoogleButtonOptions) => void;
  cancel: () => void;
}

interface IAppleSignInResponse {
  authorization: { id_token: string; code: string; state?: string };
  user?: { name?: { firstName?: string; lastName?: string }; email?: string };
}

interface IAppleId {
  auth: {
    init: (options: {
      clientId: string;
      scope: string;
      redirectURI: string;
      usePopup: boolean;
      state?: string;
    }) => void;
    signIn: () => Promise<IAppleSignInResponse>;
  };
}

declare global {
  interface Window {
    google?: { accounts: { id: IGoogleAccountsId } };
    AppleID?: IAppleId;
  }
}

export {};
