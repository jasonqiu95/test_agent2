/**
 * DeviceSwitcher Component Test Suite
 *
 * Tests for device type switching functionality including:
 * - Rendering device controls
 * - Clicking device buttons to trigger mode changes
 * - Verifying Redux state updates
 * - Testing device transitions
 * - Accessibility compliance
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderWithProviders,
  mockRequestIdleCallback,
  cleanupMocks,
} from '../../__tests__/testUtils';
import { DeviceSwitcher } from './DeviceSwitcher';
import { setDeviceMode } from '../../store/previewSlice';

// Mock CSS imports
jest.mock('./DeviceSwitcher.css', () => ({}));

describe('DeviceSwitcher Component', () => {
  beforeEach(() => {
    mockRequestIdleCallback();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupMocks();
    jest.resetAllMocks();
  });

  describe('Rendering', () => {
    it('should render all device buttons', () => {
      renderWithProviders(<DeviceSwitcher />);

      expect(screen.getByLabelText('Switch to iPad mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Switch to Kindle mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Switch to iPhone mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Switch to Print Spread mode')).toBeInTheDocument();
    });

    it('should render with accessible role and label', () => {
      renderWithProviders(<DeviceSwitcher />);

      const switcher = screen.getByRole('group', { name: 'Device mode selector' });
      expect(switcher).toBeInTheDocument();
    });

    it('should render device icons', () => {
      const { container } = renderWithProviders(<DeviceSwitcher />);

      const icons = container.querySelectorAll('.device-switcher__icon svg');
      expect(icons).toHaveLength(4); // iPad, Kindle, iPhone, PrintSpread
    });

    it('should render device labels', () => {
      renderWithProviders(<DeviceSwitcher />);

      expect(screen.getByText('iPad')).toBeInTheDocument();
      expect(screen.getByText('Kindle')).toBeInTheDocument();
      expect(screen.getByText('iPhone')).toBeInTheDocument();
      expect(screen.getByText('Print Spread')).toBeInTheDocument();
    });
  });

  describe('Device Selection and Active State', () => {
    it('should mark iPad as active by default', () => {
      const { store } = renderWithProviders(<DeviceSwitcher />);

      // Default state is iPad
      expect(store.getState().preview.deviceMode).toBe('iPad');

      const iPadButton = screen.getByLabelText('Switch to iPad mode');
      expect(iPadButton).toHaveClass('device-switcher__button--active');
      expect(iPadButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should render with preloaded Kindle device mode', () => {
      const { store } = renderWithProviders(<DeviceSwitcher />, {
        preloadedState: {
          preview: {
            deviceMode: 'Kindle',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 0,
          },
        },
      });

      expect(store.getState().preview.deviceMode).toBe('Kindle');

      const kindleButton = screen.getByLabelText('Switch to Kindle mode');
      expect(kindleButton).toHaveClass('device-switcher__button--active');
      expect(kindleButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should render with preloaded iPhone device mode', () => {
      const { store } = renderWithProviders(<DeviceSwitcher />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPhone',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 0,
          },
        },
      });

      expect(store.getState().preview.deviceMode).toBe('iPhone');

      const iPhoneButton = screen.getByLabelText('Switch to iPhone mode');
      expect(iPhoneButton).toHaveClass('device-switcher__button--active');
    });

    it('should render with preloaded PrintSpread device mode', () => {
      const { store } = renderWithProviders(<DeviceSwitcher />, {
        preloadedState: {
          preview: {
            deviceMode: 'PrintSpread',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 0,
          },
        },
      });

      expect(store.getState().preview.deviceMode).toBe('PrintSpread');

      const printButton = screen.getByLabelText('Switch to Print Spread mode');
      expect(printButton).toHaveClass('device-switcher__button--active');
    });
  });

  describe('Device Mode Switching', () => {
    it('should switch from iPad to Kindle when Kindle button is clicked', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />);

      // Initially iPad
      expect(store.getState().preview.deviceMode).toBe('iPad');

      const kindleButton = screen.getByLabelText('Switch to Kindle mode');
      await user.click(kindleButton);

      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('Kindle');
      });

      expect(kindleButton).toHaveClass('device-switcher__button--active');
      expect(kindleButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should switch from iPad to iPhone when iPhone button is clicked', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />);

      expect(store.getState().preview.deviceMode).toBe('iPad');

      const iPhoneButton = screen.getByLabelText('Switch to iPhone mode');
      await user.click(iPhoneButton);

      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('iPhone');
      });

      expect(iPhoneButton).toHaveClass('device-switcher__button--active');
    });

    it('should switch from iPad to PrintSpread when Print Spread button is clicked', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />);

      expect(store.getState().preview.deviceMode).toBe('iPad');

      const printButton = screen.getByLabelText('Switch to Print Spread mode');
      await user.click(printButton);

      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('PrintSpread');
      });

      expect(printButton).toHaveClass('device-switcher__button--active');
    });

    it('should switch from Kindle to iPhone', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />, {
        preloadedState: {
          preview: {
            deviceMode: 'Kindle',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 0,
          },
        },
      });

      const iPhoneButton = screen.getByLabelText('Switch to iPhone mode');
      await user.click(iPhoneButton);

      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('iPhone');
      });
    });

    it('should switch from iPhone to PrintSpread', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPhone',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 0,
          },
        },
      });

      const printButton = screen.getByLabelText('Switch to Print Spread mode');
      await user.click(printButton);

      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('PrintSpread');
      });
    });

    it('should switch from PrintSpread back to iPad', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />, {
        preloadedState: {
          preview: {
            deviceMode: 'PrintSpread',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 0,
          },
        },
      });

      const iPadButton = screen.getByLabelText('Switch to iPad mode');
      await user.click(iPadButton);

      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('iPad');
      });
    });

    it('should allow clicking the same device button multiple times', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />);

      const iPadButton = screen.getByLabelText('Switch to iPad mode');

      await user.click(iPadButton);
      expect(store.getState().preview.deviceMode).toBe('iPad');

      await user.click(iPadButton);
      expect(store.getState().preview.deviceMode).toBe('iPad');
    });
  });

  describe('Complete Device Transition Cycle', () => {
    it('should cycle through all device modes: iPad -> Kindle -> iPhone -> PrintSpread -> iPad', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />);

      // Start at iPad
      expect(store.getState().preview.deviceMode).toBe('iPad');

      // Switch to Kindle
      await user.click(screen.getByLabelText('Switch to Kindle mode'));
      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('Kindle');
      });

      // Switch to iPhone
      await user.click(screen.getByLabelText('Switch to iPhone mode'));
      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('iPhone');
      });

      // Switch to PrintSpread
      await user.click(screen.getByLabelText('Switch to Print Spread mode'));
      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('PrintSpread');
      });

      // Switch back to iPad
      await user.click(screen.getByLabelText('Switch to iPad mode'));
      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('iPad');
      });
    });

    it('should handle rapid device switching', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />);

      // Rapidly switch between devices
      await user.click(screen.getByLabelText('Switch to Kindle mode'));
      await user.click(screen.getByLabelText('Switch to iPhone mode'));
      await user.click(screen.getByLabelText('Switch to Print Spread mode'));
      await user.click(screen.getByLabelText('Switch to iPad mode'));

      // Wait for final state
      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('iPad');
      });
    });
  });

  describe('Visual State Updates', () => {
    it('should remove active class from previous device when switching', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceSwitcher />);

      const iPadButton = screen.getByLabelText('Switch to iPad mode');
      const kindleButton = screen.getByLabelText('Switch to Kindle mode');

      // iPad starts active
      expect(iPadButton).toHaveClass('device-switcher__button--active');
      expect(kindleButton).not.toHaveClass('device-switcher__button--active');

      // Switch to Kindle
      await user.click(kindleButton);

      await waitFor(() => {
        expect(kindleButton).toHaveClass('device-switcher__button--active');
        expect(iPadButton).not.toHaveClass('device-switcher__button--active');
      });
    });

    it('should update aria-pressed attribute correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceSwitcher />);

      const iPadButton = screen.getByLabelText('Switch to iPad mode');
      const iPhoneButton = screen.getByLabelText('Switch to iPhone mode');

      expect(iPadButton).toHaveAttribute('aria-pressed', 'true');
      expect(iPhoneButton).toHaveAttribute('aria-pressed', 'false');

      await user.click(iPhoneButton);

      await waitFor(() => {
        expect(iPhoneButton).toHaveAttribute('aria-pressed', 'true');
        expect(iPadButton).toHaveAttribute('aria-pressed', 'false');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      renderWithProviders(<DeviceSwitcher />);

      expect(screen.getByLabelText('Switch to iPad mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Switch to Kindle mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Switch to iPhone mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Switch to Print Spread mode')).toBeInTheDocument();
    });

    it('should have title attributes for tooltips', () => {
      renderWithProviders(<DeviceSwitcher />);

      expect(screen.getByLabelText('Switch to iPad mode')).toHaveAttribute('title', 'iPad');
      expect(screen.getByLabelText('Switch to Kindle mode')).toHaveAttribute('title', 'Kindle');
      expect(screen.getByLabelText('Switch to iPhone mode')).toHaveAttribute('title', 'iPhone');
      expect(screen.getByLabelText('Switch to Print Spread mode')).toHaveAttribute('title', 'Print Spread');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />);

      // Tab to first button (should be iPad)
      await user.tab();
      expect(screen.getByLabelText('Switch to iPad mode')).toHaveFocus();

      // Tab to Kindle
      await user.tab();
      expect(screen.getByLabelText('Switch to Kindle mode')).toHaveFocus();

      // Press Enter to activate
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('Kindle');
      });
    });

    it('should support Space key to activate buttons', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />);

      const iPhoneButton = screen.getByLabelText('Switch to iPhone mode');
      iPhoneButton.focus();

      await user.keyboard(' ');

      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('iPhone');
      });
    });
  });

  describe('Redux Integration', () => {
    it('should dispatch setDeviceMode action when button is clicked', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />);

      const dispatchSpy = jest.spyOn(store, 'dispatch');

      await user.click(screen.getByLabelText('Switch to Kindle mode'));

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'preview/setDeviceMode',
          payload: 'Kindle',
        })
      );
    });

    it('should reflect store state changes in the UI', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />);

      // Manually dispatch action
      store.dispatch(setDeviceMode('iPhone'));

      await waitFor(() => {
        const iPhoneButton = screen.getByLabelText('Switch to iPhone mode');
        expect(iPhoneButton).toHaveClass('device-switcher__button--active');
      });
    });

    it('should maintain state consistency across rapid updates', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />);

      // Perform multiple rapid clicks
      const devices = [
        'Switch to Kindle mode',
        'Switch to iPhone mode',
        'Switch to Print Spread mode',
        'Switch to iPad mode',
      ];

      for (const device of devices) {
        await user.click(screen.getByLabelText(device));
      }

      // Final state should be iPad
      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('iPad');
      });

      // UI should reflect the final state
      const iPadButton = screen.getByLabelText('Switch to iPad mode');
      expect(iPadButton).toHaveClass('device-switcher__button--active');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined device mode gracefully', () => {
      const { store } = renderWithProviders(<DeviceSwitcher />, {
        preloadedState: {
          preview: {
            deviceMode: undefined as any,
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 0,
          },
        },
      });

      // Should render without crashing
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('should not render extra buttons for invalid devices', () => {
      const { container } = renderWithProviders(<DeviceSwitcher />);

      const buttons = container.querySelectorAll('.device-switcher__button');
      expect(buttons).toHaveLength(4); // Only 4 valid devices
    });
  });
});
