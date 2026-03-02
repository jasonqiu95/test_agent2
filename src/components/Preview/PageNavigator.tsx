import React, { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  navigatePage,
  selectCurrentPage,
  selectTotalPages,
} from '../../store/previewSlice';
import './PageNavigation.css';

interface PageNavigatorProps {
  /** Optional callback when page changes */
  onPageChange?: (page: number) => void;
  /** Enable keyboard navigation (default: true) */
  enableKeyboardNav?: boolean;
}

/**
 * PageNavigator component for navigating between preview pages
 *
 * Features:
 * - Previous/Next page buttons
 * - Current page indicator (e.g., "Page 1 of 10")
 * - Keyboard navigation (Arrow Left/Right)
 * - Integrates with Redux preview state
 * - Disabled states for first/last pages
 */
export const PageNavigator: React.FC<PageNavigatorProps> = ({
  onPageChange,
  enableKeyboardNav = true,
}) => {
  const dispatch = useAppDispatch();
  const currentPage = useAppSelector(selectCurrentPage);
  const totalPages = useAppSelector(selectTotalPages);

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages || totalPages === 0;

  const handlePrevious = useCallback(() => {
    if (!isFirstPage) {
      const newPage = currentPage - 1;
      dispatch(navigatePage(newPage));
      onPageChange?.(newPage);
    }
  }, [currentPage, isFirstPage, dispatch, onPageChange]);

  const handleNext = useCallback(() => {
    if (!isLastPage) {
      const newPage = currentPage + 1;
      dispatch(navigatePage(newPage));
      onPageChange?.(newPage);
    }
  }, [currentPage, isLastPage, dispatch, onPageChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNav) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't interfere with input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableKeyboardNav, handlePrevious, handleNext]);

  return (
    <div className="page-navigation" role="navigation" aria-label="Page navigation">
      <button
        className="page-navigation-btn"
        onClick={handlePrevious}
        disabled={isFirstPage}
        aria-label="Previous page"
        title="Previous page (← Arrow Left)"
      >
        ‹ Previous
      </button>

      <span className="page-navigation-indicator" aria-live="polite" aria-atomic="true">
        {totalPages > 0 ? (
          <>
            Page {currentPage} of {totalPages}
          </>
        ) : (
          <>No pages</>
        )}
      </span>

      <button
        className="page-navigation-btn"
        onClick={handleNext}
        disabled={isLastPage}
        aria-label="Next page"
        title="Next page (→ Arrow Right)"
      >
        Next ›
      </button>
    </div>
  );
};

export default PageNavigator;
