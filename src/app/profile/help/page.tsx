"use client";

import { getData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, HelpCircle } from "lucide-react";
import React, { memo, useCallback, useState } from "react";

interface IFaqItem {
  id: string;
  question: string;
  answer: string;
}

const FaqAccordionItem: React.FC<{
  faq: IFaqItem;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ faq, isOpen, onToggle }) => {
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-4 text-left cursor-pointer hover:bg-accent/50 transition-colors"
      >
        <p className="font-medium text-sm">{faq.question}</p>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
          {faq.answer}
        </div>
      )}
    </div>
  );
};

const HelpPage = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, error, refetch, isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data } = await getData<IFaqItem[]>("/faqs");
      return data;
    },
  });

  const faqs = data?.data ?? [];

  const handleToggle = useCallback(
    (id: string) => {
      setOpenId((prev) => (prev === id ? null : id));
    },
    [],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Help & FAQs</h2>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Failed to load FAQs",
          )}
          retryFunction={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Help & FAQs</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Find answers to commonly asked questions.
        </p>
      </div>

      {faqs.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <HelpCircle className="size-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No FAQs available</p>
          <p className="text-sm mt-1">Check back later for helpful answers.</p>
        </div>
      )}

      <div className="space-y-3">
        {faqs.map((faq) => (
          <FaqAccordionItem
            key={faq.id}
            faq={faq}
            isOpen={openId === faq.id}
            onToggle={() => handleToggle(faq.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(HelpPage);
