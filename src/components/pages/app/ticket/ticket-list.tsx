"use client";
import { getData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import ResultPagination from "@/components/ui/result-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ITicketDetailsType } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { TicketIcon } from "lucide-react";
import React, { memo, useMemo } from "react";

const getTickets = async ({ page = 1 }) => {
  const urlParams = new URLSearchParams();
  urlParams.set("page", page.toString());
  urlParams.set("limit", "10");
  const url = `/tickets?${urlParams.toString()}`;
  const { data } = await getData<ITicketDetailsType[]>(url);
  return data;
};

const TicketList = () => {
  const {
    data,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    hasPreviousPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["dashboard-created-tickets"],
    queryFn: ({ pageParam }) => getTickets({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.pagination?.nextPage,
  });
  const tickets = useMemo(
    () => data?.pages?.flatMap((page) => page?.data || []) || [],
    [data]
  );
  const isLoading = useMemo(() => !data, [data]);
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="opacity-60">
            <TableHead className="w-[100px]">Ticket ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="">Event</TableHead>
            <TableHead className="">Ticket Category</TableHead>
            <TableHead className="">Price</TableHead>
            <TableHead className="">Quantity</TableHead>
            <TableHead className="">Amount</TableHead>
            <TableHead className="">Status</TableHead>
            <TableHead className="">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            !error &&
            Array.from({ length: 10 }).map((_, index) => (
              <TableRow key={index}>
                {new Array(10).fill(null).map((_, index) => (
                  <TableCell key={index}>
                    <Skeleton className="w-full h-10 rounded-lg" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          {!isLoading && tickets.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-center">
                <EmptyContainer
                  icon={<TicketIcon className="size-10" />}
                  title="No tickets found"
                  description="There are no tickets available at the moment"
                />
              </TableCell>
            </TableRow>
          )}
          {!isLoading &&
            tickets.length > 0 &&
            tickets.map((ticket) => (
              <TableRow key={ticket?.id}>
                <TableCell>{ticket?.id}</TableCell>
                <TableCell>
                  {format(new Date(ticket?.event?.date || ""), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>{ticket?.name}</TableCell>
                <TableCell>{ticket?.event?.name}</TableCell>
                <TableCell>{ticket?.type}</TableCell>
              </TableRow>
            ))}
          {error && isLoading && (
            <TableRow className="">
              <TableCell colSpan={10} className="text-center py-20">
                <ErrorContainer
                  error={constructErrorMessage(
                    error as TApiErrorResponseType,
                    "Unknown error occurred whilst getting tickets list"
                  )}
                  retryFunction={() => refetch?.()}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={10} className="text-center">
              <ResultPagination
                totalPages={tickets?.length}
                currentPage={1}
                onPageChange={() => {}}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default memo(TicketList);
