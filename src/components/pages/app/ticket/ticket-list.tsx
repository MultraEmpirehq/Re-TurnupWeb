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

const TicketCard: React.FC<{ ticket: ITicketDetailsType }> = memo(
  ({ ticket }) => {
    return (
      <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span className="size-9 shrink-0 rounded-md bg-secondary-100 flex items-center justify-center">
              <TicketIcon className="size-4 text-secondary-700" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-secondary-800 truncate">
                {ticket?.name}
              </p>
              <p className="text-xs opacity-60 truncate">
                {ticket?.event?.name}
              </p>
            </div>
          </div>
          {ticket?.event?.date && (
            <span className="text-xs opacity-60 shrink-0">
              {format(new Date(ticket.event.date), "dd/MM/yyyy")}
            </span>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div className="space-y-0.5">
            <dt className="opacity-60">Ticket ID</dt>
            <dd className="font-medium truncate">{ticket?.id}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="opacity-60">Category</dt>
            <dd className="font-medium truncate">{ticket?.type}</dd>
          </div>
          {ticket?.price?.formatted?.withCurrency && (
            <div className="space-y-0.5">
              <dt className="opacity-60">Price</dt>
              <dd className="font-medium truncate">
                {ticket.price.formatted.withCurrency}
              </dd>
            </div>
          )}
          {typeof ticket?.quantity === "number" && (
            <div className="space-y-0.5">
              <dt className="opacity-60">Quantity</dt>
              <dd className="font-medium truncate">{ticket.quantity}</dd>
            </div>
          )}
        </dl>
      </div>
    );
  },
);

TicketCard.displayName = "TicketCard";

const TicketList = () => {
  const {
    data,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["dashboard-created-tickets"],
    queryFn: ({ pageParam }) => getTickets({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.pagination?.nextPage,
  });
  const tickets = useMemo(
    () => data?.pages?.flatMap((page) => page?.data || []) || [],
    [data],
  );
  const isLoading = useMemo(() => !data, [data]);
  return (
    <div className="w-full">
      {/* Mobile / tablet: list view */}
      <div className="md:hidden space-y-3">
        {isLoading && !error && (
          <>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="w-full h-28 rounded-lg" />
            ))}
          </>
        )}
        {!isLoading && tickets.length === 0 && !error && (
          <EmptyContainer
            icon={<TicketIcon className="size-10" />}
            title="No tickets found"
            description="There are no tickets available at the moment"
          />
        )}
        {!isLoading &&
          tickets.length > 0 &&
          tickets.map((ticket) => (
            <TicketCard key={ticket?.id} ticket={ticket} />
          ))}
        {error && isLoading && (
          <ErrorContainer
            error={constructErrorMessage(
              error as TApiErrorResponseType,
              "Unknown error occurred whilst getting tickets list",
            )}
            retryFunction={() => refetch?.()}
          />
        )}
        {!isLoading && tickets.length > 0 && (
          <div className="pt-2">
            <ResultPagination
              totalPages={tickets?.length}
              currentPage={1}
              onPageChange={() => {}}
            />
          </div>
        )}
      </div>

      {/* Desktop: table view */}
      <div className="hidden md:block overflow-x-auto">
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
                      "Unknown error occurred whilst getting tickets list",
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
    </div>
  );
};

export default memo(TicketList);
