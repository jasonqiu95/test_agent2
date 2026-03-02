import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  navigatePage,
  selectCurrentPage,
  selectTotalPages,
} from '../../store/previewSlice';
import './PageNavigation.css';

export const PageNavigation = () => {
  const dispatch = useDispatch();
  const currentPage = useSelector(selectCurrentPage);
  const totalPages = useSelector(selectTotalPages);

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages || totalPages === 0;

  const handlePrevious = () => {
    if (!isFirstPage) {
      dispatch(navigatePage(currentPage - 1));
    }
  };

  const handleNext = () => {
    if (!isLastPage) {
      dispatch(navigatePage(currentPage + 1));
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
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
  }, [currentPage, totalPages]);

  return (
    <div className="page-navigation">
      <button
        className="page-navigation-btn"
        onClick={handlePrevious}
        disabled={isFirstPage}
        aria-label="Previous page"
        title="Previous page (← Arrow Left)"
      >
        ‹ Previous
      </button>

      <span className="page-navigation-indicator">
        {totalPages > 0 ? (
          <>Page {currentPage} of {totalPages}</>
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
