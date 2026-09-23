import React, { memo } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

/**
 * The page numbers to render: always the first and last page, plus a window around the
 * current one, with nulls marking where an ellipsis goes.
 */
const buildPageList = (totalPages: number, currentPage: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: (number | null)[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push(null);
  for (let page = start; page <= end; page++) pages.push(page);
  if (end < totalPages - 1) pages.push(null);

  pages.push(totalPages);
  return pages;
};

const ResultPagination: React.FC<{
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}> = ({ totalPages, currentPage, onPageChange }) => {
  if (!totalPages || totalPages < 2) {
    return null;
  }

  const pages = buildPageList(totalPages, currentPage);
  const go = (page: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={isFirst}
            className={isFirst ? "pointer-events-none opacity-50" : undefined}
            onClick={go(currentPage - 1)}
          />
        </PaginationItem>

        {pages.map((page, index) =>
          page === null ? (
            <PaginationItem key={`gap-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={page === currentPage}
                onClick={go(page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={isLast}
            className={isLast ? "pointer-events-none opacity-50" : undefined}
            onClick={go(currentPage + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default memo(ResultPagination);
