import { getData } from "@/api";
import { UserTicketDetailsResponseType } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export const useUserTickets = () => {
  return useQuery({
    queryKey: ["user-tickets"],
    queryFn: async () => {
      const { data } = await getData<UserTicketDetailsResponseType[]>(
        "/tickets/user",
      );
      return data;
    },
  });
};
