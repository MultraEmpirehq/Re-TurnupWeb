import { ROUTE_TYPE, RouteProps } from "./types";
import { ROUTES } from "./variables";

export const getRoutesByType = (type: ROUTE_TYPE) => {
    return Object.values(ROUTES).filter((route: RouteProps) =>
      route.shouldShowIn.includes(type),
    );
  },
  maskSensitiveInfo = (text: string, type: "email" | "phone" | "card") => {
    if (!text || typeof text !== "string") return "";

    const functionCalls = {
      email: () => {
        const [username = "", domain = ""] = text.split("@");
        if (!domain || username?.length < 2) return text; // Invalid email, return as is
        const visibleChars = Math.min(username?.length, 2);
        return `${username?.[0]}${"*".repeat(username?.length - visibleChars)}${
          username?.[username?.length - 1]
        }@${domain}`;
      },
      phone: () => {
        if (text.length < 7) return text; // Not enough digits to mask
        return `${text.slice(0, 4)}${"*".repeat(text.length - 5)}${text.slice(
          -2,
        )}`;
      },
      card: () => {
        if (text.length < 12) return text; // Unusually short, might not be a real card
        return `${text.slice(0, 4)} ${"*".repeat(text.length - 8)} ${text.slice(
          -4,
        )}`;
      },
    };
    const functionToRun = functionCalls[type];

    if (!functionToRun) {
      return text;
    }

    return functionToRun();
  };

export const formatCurrency = (
  amount: number = 0,
  currency: string = "NGN",
  locale: string = "en-NG",
) => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
};
