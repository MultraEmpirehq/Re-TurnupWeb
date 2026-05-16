import { IEventDetailsType } from "@/lib/types";
import { formatDate } from "date-fns";
import { BellIcon, InfoIcon, MapPinIcon, TicketIcon } from "lucide-react";
import React, { memo, useMemo } from "react";

const SmallButton: React.FC<{ children: React.ReactNode; title: string }> =
  memo(({ children, title }) => {
    return (
      <button
        title={title}
        type="button"
        className="bg-secondary-300 size-5 rounded-sm inline-flex items-center justify-center"
      >
        {children}
        <span className="sr-only">{title}</span>
      </button>
    );
  });

SmallButton.displayName = "Small Button";

const ICON_SIZE = 12,
  OPACITY = 0.6;

const HappeningNowCard: React.FC<IEventDetailsType> = ({
  name,
  venue,
  date = new Date(),
}) => {
  const eventDate = useMemo(() => {
    const parsedDate = date ? new Date(date) : null;
    return parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
  }, [date]);

  return (
    <div className="bg-white dark:bg-secondary-950 py-3 px-2 flex flex-row items-start gap-2 shadow-md rounded-md text-secondary-950 dark:text-white">
      <div className="flex flex-col self-stretch items-center gap-1.5">
        <div className="bg-secondary size-3 rounded-full items-center justify-center flex flex-col">
          <div className="size-[50%] bg-white rounded-full" />
        </div>
        <div className="flex-1 border-l border-black/30 border-dashed" />
      </div>
      <div className="flex-1 space-y-2">
        <h3 className="text-secondary-600 dark:text-secondary-300">Happening Now</h3>
        <p className="font-bold text-[clamp(1.1rem,1.5vw,1.5rem)] uppercase text-secondary-800 dark:text-white">
          {name || "Event Name"}
        </p>
        <div className="flex-row items-center flex gap-1 text-secondary-700 dark:text-secondary-300">
          <span>
            <MapPinIcon size={16} />
          </span>
          <p>{venue?.address || "Event Location"}</p>
        </div>
        <div className="flex flex-row items-center text-xs gap-2">
          <p className="text-secondary-600 dark:text-secondary-300">
            {eventDate ? formatDate(eventDate, "hh:mm a") : "Time pending"}
          </p>
          <SmallButton title="Info">
            <InfoIcon size={ICON_SIZE} opacity={OPACITY} />
          </SmallButton>
          <SmallButton title="Tickets">
            <TicketIcon size={ICON_SIZE} opacity={OPACITY} />
          </SmallButton>
          <SmallButton title="Notify">
            <BellIcon size={ICON_SIZE} opacity={OPACITY} />
          </SmallButton>
        </div>
      </div>
    </div>
  );
};

export default memo(HappeningNowCard);
