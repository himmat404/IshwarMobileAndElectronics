import { useEffect, useRef, useState } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

interface UseInfiniteScrollReturn {
  observerTarget: React.RefObject<HTMLDivElement | null>;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  hasMore: boolean;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  resetPagination: () => void;
}

/**
 * Custom hook for implementing infinite scroll pagination
 * 
 * @param hasMore - Whether there are more items to load
 * @param isLoading - Whether data is currently being loaded
 * @param options - IntersectionObserver options
 * @returns Object containing observer ref, page state, and utility functions
 * 
 * @example
 * const { observerTarget, page, hasMore, setHasMore, resetPagination } = useInfiniteScroll({
 *   hasMore: page < totalPages,
 *   isLoading: loading || loadingMore
 * });
 */
export function useInfiniteScroll(
  isLoading: boolean,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const { threshold = 0.1, rootMargin = '100px' } = options;
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const resetPagination = () => {
    setPage(1);
    setHasMore(true);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold, rootMargin }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, threshold, rootMargin]);

  return {
    observerTarget,
    page,
    setPage,
    hasMore,
    setHasMore,
    resetPagination,
  };
}