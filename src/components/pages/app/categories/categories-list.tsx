"use client";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import useCategory from "@/hooks/use-category";
import { ROUTES } from "@/lib/variables";
import { Plus, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { memo } from "react";

const CategoriesList = () => {
  const router = useRouter();
  const { data, error, isLoading, refetch } = useCategory();

  const showSkeleton = isLoading && !data;
  const hasCategories = !!data && data.length > 0;
  const isEmpty = !!data && data.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between gap-3">
        <h1 className="font-bold text-secondary-800">Categories</h1>
        <Button asChild size="sm">
          <Link href={ROUTES.CREATE_CATEGORY.href}>
            <Plus className="size-4" />
            Create Category
          </Link>
        </Button>
      </div>

      {showSkeleton && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {hasCategories && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {data.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-secondary-50 text-secondary-800">
                <Tag className="size-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="font-medium truncate">{category.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {category.id}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !data && (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Unknown error occurred whilst getting categories list",
          )}
          retryFunction={refetch}
        />
      )}

      {isEmpty && (
        <EmptyContainer
          icon={<Tag className="size-10" />}
          title="No categories yet"
          description="Create your first category to start organising events"
          action={() => router.push(ROUTES.CREATE_CATEGORY.href)}
          actionText="Create Category"
        />
      )}
    </div>
  );
};

export default memo(CategoriesList);
