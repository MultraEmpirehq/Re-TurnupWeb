import { getData } from "@/api";
import { ITicketAnalytics } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const getTicketAnalytics = async () => {
  const { data } = await getData<ITicketAnalytics>("/tickets/analytics");
  return data;
};

export const useTicketAnalytics = () => {
  return useQuery({
    queryKey: ["ticket-analytics"],
    queryFn: getTicketAnalytics,
    retry: 0,
  });
};

export const useScopedTicketAnalytics = (enabled: boolean) => {
  return useQuery({
    queryKey: ["ticket-analytics"],
    queryFn: getTicketAnalytics,
    enabled,
    retry: 0,
  });
};
