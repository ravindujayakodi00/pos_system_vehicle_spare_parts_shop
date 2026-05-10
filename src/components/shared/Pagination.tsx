"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  limit,
  onPageChange,
}: PaginationProps) {
  if (totalRecords === 0) return null;

  const startRecord = (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalRecords);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-0">
        Showing <span className="font-medium text-gray-900 dark:text-white">{startRecord}</span> to <span className="font-medium text-gray-900 dark:text-white">{endRecord}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalRecords}</span> results
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
