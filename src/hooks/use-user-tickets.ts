import { getData, postData } from "@/api";
import { UserTicketDetailsResponseType } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** The tickets you hold. Ones you've sent and are waiting to be claimed aren't here. */
export const useUserTickets = () => {
  return useQuery({
    queryKey: ["user-tickets"],
    queryFn: async () => {
      const { data } =
        await getData<UserTicketDetailsResponseType[]>("/tickets/user");
      return data;
    },
  });
};

export type TTransferStatus = "PENDING" | "CLAIMED" | "CANCELLED";

export interface ISentTransfer {
  id: string;
  /** Only when they have no account; account holders show by name and @username. */
  toEmail: string | null;
  recipientUsername?: string | null;
  status: TTransferStatus;
  createdAt: string;
  claimedAt?: string | null;
  /** The recipient's name once they have an account. */
  recipientName?: string | null;
  userTicket: UserTicketDetailsResponseType;
}

/** Tickets you've sent: waiting to be claimed, claimed, or cancelled. */
export const useSentTransfers = () =>
  useQuery({
    queryKey: ["sent-transfers"],
    queryFn: async () => {
      const { data } = await getData<ISentTransfer[]>(
        "/ticket/transfers?limit=50",
      );
      return data?.data ?? [];
    },
  });

/** Whatever changes a ticket's hands: both lists need to know. */
export const useRefreshTicketLists = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["user-tickets"] });
    queryClient.invalidateQueries({ queryKey: ["sent-transfers"] });
  };
};

/** Takes back a ticket that hasn't been claimed yet. */
export const useCancelTransfer = () => {
  const refresh = useRefreshTicketLists();
  return useMutation({
    mutationFn: (transferId: string) =>
      postData(`/ticket/transfer/${transferId}/cancel`),
    onSuccess: refresh,
  });
};

export interface ITransferRecipientPreview {
  username: string;
  name: string | null;
  avatar: string | null;
  isYou: boolean;
}

/** Who a username belongs to, checked as it's typed so the sender sees who they're sending to. */
export const useTransferRecipient = (username?: string) =>
  useQuery({
    queryKey: ["transfer-recipient", username?.toLowerCase()],
    queryFn: async () => {
      const { data } = await getData<ITransferRecipientPreview>(
        `/ticket/transfer/recipient?username=${encodeURIComponent(username ?? "")}`,
      );
      return data?.data ?? null;
    },
    enabled: !!username,
    retry: false,
    staleTime: 60_000,
  });

/** How a recipient reads: their name, else @username, else the email typed. */
export const recipientLabel = (recipient: {
  recipientName?: string | null;
  recipientUsername?: string | null;
  toEmail?: string | null;
}) =>
  recipient.recipientName ||
  (recipient.recipientUsername ? `@${recipient.recipientUsername}` : null) ||
  recipient.toEmail ||
  "them";

export interface IReceivedTransfer {
  id: string;
  status: TTransferStatus;
  createdAt: string;
  senderName: string;
  senderUsername?: string | null;
  userTicket: UserTicketDetailsResponseType;
}

/** Tickets sent to you, waiting for you to accept. */
export const useReceivedTransfers = () =>
  useQuery({
    queryKey: ["received-transfers"],
    queryFn: async () => {
      const { data } = await getData<IReceivedTransfer[]>(
        "/ticket/transfers/received",
      );
      return data?.data ?? [];
    },
  });

const useRefreshAfterReceiving = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["received-transfers"] });
    queryClient.invalidateQueries({ queryKey: ["user-tickets"] });
  };
};

/** Accepts a ticket sent to you; it moves into My Tickets. */
export const useAcceptTransfer = () => {
  const refresh = useRefreshAfterReceiving();
  return useMutation({
    mutationFn: (transferId: string) =>
      postData(`/ticket/transfer/${transferId}/claim`),
    onSuccess: refresh,
  });
};

/** Turns down a ticket sent to you; it goes back to the sender. */
export const useDeclineTransfer = () => {
  const refresh = useRefreshAfterReceiving();
  return useMutation({
    mutationFn: (transferId: string) =>
      postData(`/ticket/transfer/${transferId}/decline`),
    onSuccess: refresh,
  });
};
