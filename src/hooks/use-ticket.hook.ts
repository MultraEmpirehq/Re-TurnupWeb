import { getData } from "@/api";
import { ITicketDetailsType } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const getEventTickets = async (eventId: string) => {
  const urlParams = new URLSearchParams();
  urlParams.set("eventId", eventId);
  const url = `/tickets?${urlParams.toString()}`;
  const { data } = await getData<ITicketDetailsType[]>(url);
  return data;
};

export const useEventTickets = (eventId: string) => {
  return useQuery({
    queryKey: ["event-tickets", eventId],
    queryFn: () => getEventTickets(eventId),
    enabled: !!eventId,
  });
};
