import { getData } from "@/api";
import { ITicketDetailsType } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const getEventTickets = async (eventId: string, access?: string) => {
  const urlParams = new URLSearchParams();
  urlParams.set("eventId", eventId);
  if (access) urlParams.set("access", access);
  const url = `/tickets?${urlParams.toString()}`;
  const { data } = await getData<ITicketDetailsType[]>(url);
  return data;
};

export const useEventTickets = (eventId: string, access?: string) => {
  return useQuery({
    queryKey: ["event-tickets", eventId, access],
    queryFn: () => getEventTickets(eventId, access),
    enabled: !!eventId,
  });
};
