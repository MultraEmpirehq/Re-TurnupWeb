import { getData } from "@/api";
import useUserStore from "@/stores/user-store";
import { useQuery } from "@tanstack/react-query";

export interface InboxToken {
  applicationIdentifier: string;
  subscriberId: string;
  /** HMAC of the subscriber id, signed server side so the Novu secret stays there. */
  subscriberHash: string;
  apiUrl: string | null;
  socketUrl: string | null;
}

/**
 * The credentials the Novu inbox signs in with.
 *
 * The api answers null while notifications are still on OneSignal, which is how the
 * inbox knows to stay hidden rather than render an empty shell.
 */
export const useInboxToken = () => {
  const userToken = useUserStore((state) => state.userToken);

  return useQuery({
    queryKey: ["inbox-token"],
    enabled: Boolean(userToken),
    // The hash is derived from the subscriber id and the secret, so it only changes
    // when the signed-in user does.
    staleTime: Infinity,
    retry: 0,
    queryFn: async () => {
      const response = await getData<InboxToken | null>(
        "/notifications/inbox-token",
      );
      return response.data?.data ?? null;
    },
  });
};
