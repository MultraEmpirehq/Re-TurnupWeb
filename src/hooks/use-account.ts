import { deleteData, getData, patchData } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** What someone is notified about. In-app notifications always stay on; these decide push and email. */
export type TNotificationPreferences = {
  push: boolean;
  email: boolean;
  eventUpdates: boolean;
  orderUpdates: boolean;
  ticketTransfers: boolean;
};

export type TSession = {
  id: string;
  device: string;
  platform: "app" | "web" | string;
  ip: string;
  signedInAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
};

export const useNotificationPreferences = () =>
  useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const { data } = await getData<TNotificationPreferences>(
        "/user/notification-preferences",
      );
      return data?.data ?? null;
    },
    retry: false,
  });

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<TNotificationPreferences>) => {
      const { data } = await patchData<
        Partial<TNotificationPreferences>,
        TNotificationPreferences
      >("/user/notification-preferences", body);
      return data?.data;
    },
    // Flip it straight away, and put it back if the save fails.
    onMutate: async (body) => {
      await queryClient.cancelQueries({
        queryKey: ["notification-preferences"],
      });
      const previous = queryClient.getQueryData<TNotificationPreferences>([
        "notification-preferences",
      ]);
      if (previous) {
        queryClient.setQueryData(["notification-preferences"], {
          ...previous,
          ...body,
        });
      }
      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["notification-preferences"],
          context.previous,
        );
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] }),
  });
};

export const useSessions = () =>
  useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data } = await getData<TSession[]>("/user/sessions");
      return data?.data ?? [];
    },
    retry: false,
  });

export const useSignOutDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId?: string) =>
      sessionId
        ? deleteData(`/user/sessions/${sessionId}`)
        : deleteData("/user/sessions"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });
};
