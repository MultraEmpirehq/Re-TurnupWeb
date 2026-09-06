import { deleteData, getData, postData } from "@/api";
import { PriceDetailsType } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface VendorWalletBalance {
  availableBalance: PriceDetailsType;
  pendingBalance: PriceDetailsType;
  reservedBalance: PriceDetailsType;
  currency?: string;
}

export interface VendorWalletCard {
  id: string;
  brand: string;
  last4: string;
  expiry?: string;
  holder?: string;
  type?: "virtual" | "debit" | "credit" | string;
}

export interface VendorWalletPayout {
  id: string;
  date: string;
  method: string;
  amount: PriceDetailsType;
  fee: PriceDetailsType;
  net: PriceDetailsType;
  status: string;
  currency?: string;
}

export interface VendorWalletResponse {
  availableBalance?: PriceDetailsType | number;
  pendingBalance?: PriceDetailsType | number;
  reservedBalance?: PriceDetailsType | number;
  currency?: string | PriceDetailsType["currency"];
  savedCards?: VendorWalletCard[];
  cards?: VendorWalletCard[];
}

const buildMoney = (
  value: PriceDetailsType | number | undefined,
  currency = "USD",
): PriceDetailsType => {
  if (value && typeof value !== "number" && "amount" in value) {
    return value;
  }

  const amount = Number(value ?? 0);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

  return {
    amount,
    currency: {
      code: currency,
      symbol: currency,
      name: currency,
      locale: "en-US",
    },
    formatted: {
      withCurrency: formatted,
      withoutCurrency: amount.toLocaleString(),
    },
    parts: {
      whole: amount,
      subUnit: 0,
      smallestUnit: amount,
    },
  };
};

const getMoneyCurrencyCode = (
  value?: PriceDetailsType | PriceDetailsType["currency"] | number | string,
) => {
  if (typeof value === "string") return value;
  if (!value || typeof value === "number") return undefined;
  if ("currency" in value && value.currency?.code) {
    return value.currency.code;
  }
  if ("code" in value) {
    return value.code;
  }
  return undefined;
};

const normalizeListResponse = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: T[] }).data;
  }
  return [];
};

export const useVendorWallet = () =>
  useQuery({
    queryKey: ["vendor-wallet"],
    queryFn: async () => {
      const response = await getData<VendorWalletResponse>("/vendor/wallet");
      const payload = response.data.data ?? {};
      const currency =
        getMoneyCurrencyCode(payload.currency) ||
        getMoneyCurrencyCode(payload.availableBalance) ||
        "USD";
      return {
        balances: {
          availableBalance: buildMoney(payload.availableBalance, currency),
          pendingBalance: buildMoney(payload.pendingBalance, currency),
          reservedBalance: buildMoney(payload.reservedBalance, currency),
          currency,
        } satisfies VendorWalletBalance,
        savedCards: payload.savedCards ?? payload.cards ?? [],
      };
    },
    retry: 0,
  });

export const useVendorPayoutHistory = () =>
  useQuery({
    queryKey: ["vendor-wallet-payouts"],
    queryFn: async () => {
      const response = await getData<VendorWalletPayout[]>("/vendor/wallet/payouts");
      return normalizeListResponse<VendorWalletPayout>(response.data.data);
    },
    retry: 0,
  });

export const useRequestVendorWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { amount: number; method: string }) => {
      await postData<typeof body, unknown>("/vendor/wallet/withdrawals", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-wallet-payouts"] });
    },
  });
};

export const useCreateVendorTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      amount: number;
      country: string;
      recipientName: string;
      recipientAccount: string;
    }) => {
      await postData<typeof body, unknown>("/vendor/wallet/transfers", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-wallet-payouts"] });
    },
  });
};

export const useSaveVendorWalletCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      brand: string;
      last4: string;
      holder: string;
    }) => {
      await postData<typeof body, unknown>("/vendor/wallet/cards", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-wallet"] });
    },
  });
};

export const useDeleteVendorWalletCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: string) => {
      await deleteData(`/vendor/wallet/cards/${cardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-wallet"] });
    },
  });
};
