/**
 * PageNavigation Component Test Suite
 *
 * Comprehensive tests for page navigation controls including:
 * - Next/previous page buttons
 * - Page number indicator
 * - Keyboard navigation (arrow keys)
 * - Navigation boundary conditions
 * - Page count calculation
 * - Preview content updates
 */

import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import {
  renderWithProviders,
  userEvent,
} from '../../__tests__/testUtils';
import { PageNavigation } from './PageNavigation';
import { navigatePage, updatePageCount } from '../../store/previewSlice';

// Mock CSS imports
jest.mock('./PageNavigation.css', () => ({}));

describe('PageNavigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render navigation controls with initial state', () => {
      renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 10,
          },
        },
      });

      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 10')).toBeInTheDocument();
    });

    it('should render "No pages" when totalPages is 0', () => {
      renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 0,
          },
        },
      });

      expect(screen.getByText('No pages')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 5,
            totalPages: 10,
          },
        },
      });

      const prevButton = screen.getByLabelText('Previous page');
      const nextButton = screen.getByLabelText('Next page');

      expect(prevButton).toHaveAttribute('title', 'Previous page (← Arrow Left)');
      expect(nextButton).toHaveAttribute('title', 'Next page (→ Arrow Right)');
    });
  });

  describe('Page Number Indicator', () => {
    it('should display current page number correctly', () => {
      renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 3,
            totalPages: 10,
          },
        },
      });

      expect(screen.getByText('Page 3 of 10')).toBeInTheDocument();
    });

    it('should update when page changes', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 10,
          },
        },
      });

      expect(screen.getByText('Page 1 of 10')).toBeInTheDocument();

      // Navigate to page 5
      act(() => {
        store.dispatch(navigatePage(5));
      });

      expect(screen.getByText('Page 5 of 10')).toBeInTheDocument();
    });

    it('should update when total pages changes', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 10,
          },
        },
      });

      expect(screen.getByText('Page 1 of 10')).toBeInTheDocument();

      // Update page count
      act(() => {
        store.dispatch(updatePageCount(15));
      });

      expect(screen.getByText('Page 1 of 15')).toBeInTheDocument();
    });
  });

  describe('Next/Previous Buttons', () => {
    it('should navigate to next page when Next button is clicked', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 10,
          },
        },
      });

      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);

      expect(store.getState().preview.currentPage).toBe(2);
      expect(screen.getByText('Page 2 of 10')).toBeInTheDocument();
    });

    it('should navigate to previous page when Previous button is clicked', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 5,
            totalPages: 10,
          },
        },
      });

      const prevButton = screen.getByLabelText('Previous page');
      fireEvent.click(prevButton);

      expect(store.getState().preview.currentPage).toBe(4);
      expect(screen.getByText('Page 4 of 10')).toBeInTheDocument();
    });

    it('should navigate multiple pages correctly', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 5,
            totalPages: 10,
          },
        },
      });

      const nextButton = screen.getByLabelText('Next page');

      // Click next 3 times
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      expect(store.getState().preview.currentPage).toBe(8);
      expect(screen.getByText('Page 8 of 10')).toBeInTheDocument();
    });
  });

  describe('Boundary Conditions', () => {
    it('should disable Previous button on first page', () => {
      renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 10,
          },
        },
      });

      const prevButton = screen.getByLabelText('Previous page');
      expect(prevButton).toBeDisabled();
    });

    it('should disable Next button on last page', () => {
      renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 10,
            totalPages: 10,
          },
        },
      });

      const nextButton = screen.getByLabelText('Next page');
      expect(nextButton).toBeDisabled();
    });

    it('should not navigate beyond first page', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 10,
          },
        },
      });

      const prevButton = screen.getByLabelText('Previous page');
      fireEvent.click(prevButton);

      // Should remain on page 1
      expect(store.getState().preview.currentPage).toBe(1);
      expect(screen.getByText('Page 1 of 10')).toBeInTheDocument();
    });

    it('should not navigate beyond last page', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 10,
            totalPages: 10,
          },
        },
      });

      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);

      // Should remain on page 10
      expect(store.getState().preview.currentPage).toBe(10);
      expect(screen.getByText('Page 10 of 10')).toBeInTheDocument();
    });

    it('should disable both buttons when totalPages is 0', () => {
      renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 0,
          },
        },
      });

      const prevButton = screen.getByLabelText('Previous page');
      const nextButton = screen.getByLabelText('Next page');

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it('should handle single page document', () => {
      renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 1,
          },
        },
      });

      const prevButton = screen.getByLabelText('Previous page');
      const nextButton = screen.getByLabelText('Next page');

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate to next page on ArrowRight key', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 3,
            totalPages: 10,
          },
        },
      });

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect(store.getState().preview.currentPage).toBe(4);
      expect(screen.getByText('Page 4 of 10')).toBeInTheDocument();
    });

    it('should navigate to previous page on ArrowLeft key', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 5,
            totalPages: 10,
          },
        },
      });

      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      expect(store.getState().preview.currentPage).toBe(4);
      expect(screen.getByText('Page 4 of 10')).toBeInTheDocument();
    });

    it('should not navigate on ArrowRight when on last page', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 10,
            totalPages: 10,
          },
        },
      });

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect(store.getState().preview.currentPage).toBe(10);
    });

    it('should not navigate on ArrowLeft when on first page', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 10,
          },
        },
      });

      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      expect(store.getState().preview.currentPage).toBe(1);
    });

    it('should ignore arrow keys when focus is in input field', () => {
      const { store, container } = renderWithProviders(
        <div>
          <input type="text" data-testid="test-input" />
          <PageNavigation />
        </div>,
        {
          preloadedState: {
            preview: {
              deviceMode: 'iPad',
              zoomLevel: 100,
              currentPage: 5,
              totalPages: 10,
            },
          },
        }
      );

      const input = screen.getByTestId('test-input') as HTMLInputElement;
      input.focus();

      fireEvent.keyDown(input, { key: 'ArrowRight' });

      // Should not navigate because focus is in input
      expect(store.getState().preview.currentPage).toBe(5);
    });

    it('should ignore arrow keys when focus is in textarea', () => {
      const { store } = renderWithProviders(
        <div>
          <textarea data-testid="test-textarea" />
          <PageNavigation />
        </div>,
        {
          preloadedState: {
            preview: {
              deviceMode: 'iPad',
              zoomLevel: 100,
              currentPage: 5,
              totalPages: 10,
            },
          },
        }
      );

      const textarea = screen.getByTestId('test-textarea') as HTMLTextAreaElement;
      textarea.focus();

      fireEvent.keyDown(textarea, { key: 'ArrowLeft' });

      // Should not navigate because focus is in textarea
      expect(store.getState().preview.currentPage).toBe(5);
    });

    it('should prevent default behavior for arrow keys', () => {
      renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 5,
            totalPages: 10,
          },
        },
      });

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Page Count Calculation', () => {
    it('should adjust current page when total pages decreases below current', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 10,
            totalPages: 15,
          },
        },
      });

      expect(screen.getByText('Page 10 of 15')).toBeInTheDocument();

      // Reduce total pages to 5
      act(() => {
        store.dispatch(updatePageCount(5));
      });

      // Current page should be adjusted to 5 (the new max)
      expect(store.getState().preview.currentPage).toBe(5);
      expect(screen.getByText('Page 5 of 5')).toBeInTheDocument();
    });

    it('should reset to page 1 when total pages becomes 0', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 5,
            totalPages: 10,
          },
        },
      });

      // Set total pages to 0
      act(() => {
        store.dispatch(updatePageCount(0));
      });

      expect(store.getState().preview.currentPage).toBe(1);
      expect(screen.getByText('No pages')).toBeInTheDocument();
    });

    it('should maintain current page when total pages increases', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 5,
            totalPages: 10,
          },
        },
      });

      // Increase total pages to 20
      act(() => {
        store.dispatch(updatePageCount(20));
      });

      // Current page should remain 5
      expect(store.getState().preview.currentPage).toBe(5);
      expect(screen.getByText('Page 5 of 20')).toBeInTheDocument();
    });
  });

  describe('Integration with Preview Content', () => {
    it('should enable navigation state changes that could trigger content updates', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 5,
          },
        },
      });

      const initialPage = store.getState().preview.currentPage;

      // Navigate to next page
      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);

      const newPage = store.getState().preview.currentPage;

      // Verify state changed (which could trigger preview content update)
      expect(newPage).toBe(initialPage + 1);
      expect(newPage).toBe(2);
    });

    it('should maintain page state consistency during rapid navigation', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 10,
          },
        },
      });

      const nextButton = screen.getByLabelText('Next page');

      // Rapid clicks
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      // State should be consistent
      expect(store.getState().preview.currentPage).toBe(4);
    });
  });

  describe('Event Cleanup', () => {
    it('should remove keyboard event listeners on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 10,
          },
        },
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Button States', () => {
    it('should enable Previous button when not on first page', () => {
      renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 5,
            totalPages: 10,
          },
        },
      });

      const prevButton = screen.getByLabelText('Previous page');
      expect(prevButton).not.toBeDisabled();
    });

    it('should enable Next button when not on last page', () => {
      renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 5,
            totalPages: 10,
          },
        },
      });

      const nextButton = screen.getByLabelText('Next page');
      expect(nextButton).not.toBeDisabled();
    });

    it('should update button states when navigating to first page', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 2,
            totalPages: 10,
          },
        },
      });

      const prevButton = screen.getByLabelText('Previous page');
      expect(prevButton).not.toBeDisabled();

      // Navigate to first page
      act(() => {
        store.dispatch(navigatePage(1));
      });

      expect(prevButton).toBeDisabled();
    });

    it('should update button states when navigating to last page', () => {
      const { store } = renderWithProviders(<PageNavigation />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 9,
            totalPages: 10,
          },
        },
      });

      const nextButton = screen.getByLabelText('Next page');
      expect(nextButton).not.toBeDisabled();

      // Navigate to last page
      act(() => {
        store.dispatch(navigatePage(10));
      });

      expect(nextButton).toBeDisabled();
    });
  });
});
