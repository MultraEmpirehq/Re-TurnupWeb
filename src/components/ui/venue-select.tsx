"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./combobox";
import { CheckIcon } from "lucide-react";
import { Spinner } from "./spinner";
import { useVenues } from "@/hooks/use-venue";
import { useDebouncedCallback } from "use-debounce";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "./button";
import { AlertTriangle } from "lucide-react";

const DEBOUNCE_MS = 300;
const SCROLL_LOAD_THRESHOLD = 80;

export interface IVenueSelectProps {
  value: string;
  onChange: (venueId: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  emptyText?: string;
  required?: boolean;
  allowCreateOption?: boolean;
  onCreateOption?: (venueName: string) => void;
}

const VenueSelect: React.FC<IVenueSelectProps> = ({
  value,
  onChange,
  label,
  placeholder = "Search venues...",
  error,
  className,
  inputClassName,
  labelClassName,
  errorClassName,
  emptyText = "No venue found.",
  required,
  allowCreateOption,
  onCreateOption,
}) => {
  const [search, setSearch] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const debouncedSetSearch = useDebouncedCallback((q: string) => {
    setDebouncedQuery(q);
  }, DEBOUNCE_MS);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error: fetchError,
    refetch,
  } = useVenues(
    debouncedQuery.trim() ? { q: debouncedQuery.trim() } : undefined,
  );

  const venueItems = useMemo(() => {
    const list = data?.pages?.flatMap((p) => p?.data ?? []) ?? [];
    return list.map((venue) => ({
      value: venue.id,
      label: venue.name,
    }));
  }, [data]);

  useEffect(() => {
    const found = venueItems.find((i) => i.value === value);
    if (found && search !== found.label) setSearch(found.label);
  }, [value, venueItems, search]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight - scrollTop - clientHeight < SCROLL_LOAD_THRESHOLD) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const fetchingError = fetchError
    ? constructErrorMessage(
        fetchError as Parameters<typeof constructErrorMessage>[0],
        "Failed to load venues",
      )
    : null;
  const shouldDisable = isLoading && venueItems.length === 0 && !fetchingError;

  const handleValueChange = useCallback(
    (v: string | null) => {
      const next = v ?? "";
      onChange(next);
      const item = venueItems.find((i) => i.value === next);
      if (item) setSearch(item.label);
    },
    [onChange, venueItems],
  );

  return (
    <div className={cn("space-y-1 relative", className)}>
      {label && (
        <div className="flex items-center gap-2">
          <Label className={cn("opacity-70", labelClassName)}>{label}</Label>
          {required && <span className="text-destructive">*</span>}
          {isLoading && <Spinner className="w-4 h-4 animate-spin" />}
        </div>
      )}
      <Combobox
        items={fetchingError ? [] : venueItems}
        disabled={shouldDisable}
      >
        <ComboboxInput
          placeholder={placeholder}
          className={cn("w-full", inputClassName)}
          value={search}
          onChange={(e) => {
            const v = e?.target?.value ?? "";
            setSearch(v);
            debouncedSetSearch(v);
          }}
          disabled={shouldDisable}
        />
        {!fetchingError && (
          <ComboboxContent className="w-full">
            <ComboboxEmpty className="space-y-2">
              <p>{emptyText}</p>
              {allowCreateOption && search.trim() && onCreateOption && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onCreateOption(search.trim())}
                >
                  Use &quot;{search.trim()}&quot;
                </Button>
              )}
            </ComboboxEmpty>
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="max-h-60 overflow-y-auto overflow-x-hidden"
            >
              <ComboboxList className="w-full overflow-visible border-0 p-0">
                {(contentItem: { value: string; label: string }) => (
                  <ComboboxItem
                    key={contentItem.value}
                    value={contentItem.value}
                    onClick={() => {
                      handleValueChange(contentItem.value);
                    }}
                    className={cn(value === contentItem.value && "bg-accent")}
                  >
                    <div className="flex items-center gap-2 justify-between w-full">
                      <span className="text-sm">{contentItem.label}</span>
                      {value === contentItem.value && (
                        <CheckIcon className="w-4 h-4 shrink-0" />
                      )}
                    </div>
                  </ComboboxItem>
                )}
              </ComboboxList>
              {hasNextPage && isFetchingNextPage && (
                <div className="flex justify-center py-2">
                  <Spinner className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </ComboboxContent>
        )}
        {fetchingError && (
          <ComboboxContent className="w-full">
            <ComboboxEmpty className="flex flex-col items-center justify-center py-10 gap-2">
              <AlertTriangle className="size-10 text-destructive" />
              <span className="text-sm text-destructive text-center">
                {fetchingError}
              </span>
              <Button variant="link" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </ComboboxEmpty>
          </ComboboxContent>
        )}
      </Combobox>
      {error && (
        <p className={cn("text-sm text-destructive", errorClassName)}>
          {error}
        </p>
      )}
    </div>
  );
};

export default memo(VenueSelect);
