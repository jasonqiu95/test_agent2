/**
 * Unit tests for useKeyboardShortcuts hook
 */

import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, getModifierKey, formatShortcut } from '../useKeyboardShortcuts';
import type { KeyboardShortcut } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let mockAction: jest.Mock;

  beforeEach(() => {
    mockAction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hook registration', () => {
    it('should register keyboard shortcuts', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 's',
          ctrl: true,
          description: 'Save',
          action: mockAction,
        },
      ];

      const { result } = renderHook(() =>
        useKeyboardShortcuts({ shortcuts })
      );

      expect(result.current.shortcuts).toEqual(shortcuts);
    });

    it('should update shortcuts when they change', () => {
      const mockAction1 = jest.fn();
      const mockAction2 = jest.fn();

      const shortcuts1: KeyboardShortcut[] = [
        {
          key: 's',
          ctrl: true,
          description: 'Save',
          action: mockAction1,
        },
      ];

      const { rerender } = renderHook(
        ({ shortcuts }) => useKeyboardShortcuts({ shortcuts }),
        { initialProps: { shortcuts: shortcuts1 } }
      );

      // Test that first shortcut works
      let event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      window.dispatchEvent(event);
      expect(mockAction1).toHaveBeenCalledTimes(1);

      const shortcuts2: KeyboardShortcut[] = [
        {
          key: 'z',
          ctrl: true,
          description: 'Undo',
          action: mockAction2,
        },
      ];

      rerender({ shortcuts: shortcuts2 });

      // Test that new shortcut works
      event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
      });
      window.dispatchEvent(event);
      expect(mockAction2).toHaveBeenCalledTimes(1);

      // Old shortcut should not work anymore
      event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      window.dispatchEvent(event);
      expect(mockAction1).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should not trigger when enabled is false', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 's',
          ctrl: true,
          description: 'Save',
          action: mockAction,
        },
      ];

      renderHook(() =>
        useKeyboardShortcuts({ shortcuts, enabled: false })
      );

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(mockAction).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should remove event listener on unmount', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 's',
          ctrl: true,
          description: 'Save',
          action: mockAction,
        },
      ];

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ shortcuts })
      );

      unmount();

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should cleanup when enabled changes to false', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 's',
          ctrl: true,
          description: 'Save',
          action: mockAction,
        },
      ];

      const { rerender } = renderHook(
        ({ enabled }) => useKeyboardShortcuts({ shortcuts, enabled }),
        { initialProps: { enabled: true } }
      );

      // Trigger with enabled=true
      let event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      window.dispatchEvent(event);
      expect(mockAction).toHaveBeenCalledTimes(1);

      // Disable and try again
      rerender({ enabled: false });
      event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      window.dispatchEvent(event);
      expect(mockAction).toHaveBeenCalledTimes(1); // Still 1, not called again
    });
  });

  describe('modifier key combinations', () => {
    it('should trigger on Ctrl+key', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 's',
          ctrl: true,
          description: 'Save',
          action: mockAction,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should trigger on Meta+key (Cmd on Mac)', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 's',
          ctrl: true,
          description: 'Save',
          action: mockAction,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
      });
      window.dispatchEvent(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should trigger on Alt+key', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'a',
          alt: true,
          description: 'Alternative action',
          action: mockAction,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        altKey: true,
      });
      window.dispatchEvent(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should trigger on Shift+key', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'S',
          shift: true,
          description: 'Shift action',
          action: mockAction,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 'S',
        shiftKey: true,
      });
      window.dispatchEvent(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should trigger on Ctrl+Shift+key', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'Z',
          ctrl: true,
          shift: true,
          description: 'Redo',
          action: mockAction,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 'Z',
        ctrlKey: true,
        shiftKey: true,
      });
      window.dispatchEvent(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should trigger on Ctrl+Alt+key', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'd',
          ctrl: true,
          alt: true,
          description: 'Delete',
          action: mockAction,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 'd',
        ctrlKey: true,
        altKey: true,
      });
      window.dispatchEvent(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should not trigger when modifier keys do not match', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 's',
          ctrl: true,
          description: 'Save',
          action: mockAction,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      // Wrong key
      let event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
      });
      window.dispatchEvent(event);
      expect(mockAction).not.toHaveBeenCalled();

      // Missing Ctrl
      event = new KeyboardEvent('keydown', {
        key: 's',
      });
      window.dispatchEvent(event);
      expect(mockAction).not.toHaveBeenCalled();

      // Extra unwanted modifier
      event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        altKey: true,
      });
      window.dispatchEvent(event);
      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should handle key case-insensitively', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 's',
          ctrl: true,
          description: 'Save',
          action: mockAction,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 'S',
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('preventDefault', () => {
    it('should call preventDefault by default', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 's',
          ctrl: true,
          description: 'Save',
          action: mockAction,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should not call preventDefault when explicitly set to false', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 's',
          ctrl: true,
          description: 'Save',
          action: mockAction,
          preventDefault: false,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should call preventDefault when explicitly set to true', () => {
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 's',
          ctrl: true,
          description: 'Save',
          action: mockAction,
          preventDefault: true,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('multiple shortcuts', () => {
    it('should handle multiple registered shortcuts', () => {
      const mockAction1 = jest.fn();
      const mockAction2 = jest.fn();
      const mockAction3 = jest.fn();

      const shortcuts: KeyboardShortcut[] = [
        {
          key: 's',
          ctrl: true,
          description: 'Save',
          action: mockAction1,
        },
        {
          key: 'z',
          ctrl: true,
          description: 'Undo',
          action: mockAction2,
        },
        {
          key: 'y',
          ctrl: true,
          description: 'Redo',
          action: mockAction3,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      let event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });
      window.dispatchEvent(event);
      expect(mockAction1).toHaveBeenCalledTimes(1);
      expect(mockAction2).not.toHaveBeenCalled();
      expect(mockAction3).not.toHaveBeenCalled();

      event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
      });
      window.dispatchEvent(event);
      expect(mockAction1).toHaveBeenCalledTimes(1);
      expect(mockAction2).toHaveBeenCalledTimes(1);
      expect(mockAction3).not.toHaveBeenCalled();

      event = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true,
      });
      window.dispatchEvent(event);
      expect(mockAction1).toHaveBeenCalledTimes(1);
      expect(mockAction2).toHaveBeenCalledTimes(1);
      expect(mockAction3).toHaveBeenCalledTimes(1);
    });
  });
});

describe('getModifierKey', () => {
  it('should return Cmd symbol for Mac', () => {
    Object.defineProperty(window.navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
      configurable: true,
    });

    expect(getModifierKey()).toBe('⌘');
  });

  it('should return Ctrl for non-Mac platforms', () => {
    Object.defineProperty(window.navigator, 'platform', {
      value: 'Win32',
      writable: true,
      configurable: true,
    });

    expect(getModifierKey()).toBe('Ctrl');
  });
});

describe('formatShortcut', () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, 'platform', {
      value: 'Win32',
      writable: true,
      configurable: true,
    });
  });

  it('should format Ctrl+key shortcut', () => {
    const shortcut: KeyboardShortcut = {
      key: 's',
      ctrl: true,
      description: 'Save',
      action: jest.fn(),
    };

    expect(formatShortcut(shortcut)).toBe('Ctrl+S');
  });

  it('should format Alt+key shortcut', () => {
    const shortcut: KeyboardShortcut = {
      key: 'a',
      alt: true,
      description: 'Action',
      action: jest.fn(),
    };

    expect(formatShortcut(shortcut)).toBe('Alt+A');
  });

  it('should format Shift+key shortcut', () => {
    const shortcut: KeyboardShortcut = {
      key: 'z',
      shift: true,
      description: 'Action',
      action: jest.fn(),
    };

    expect(formatShortcut(shortcut)).toBe('Shift+Z');
  });

  it('should format Ctrl+Shift+key shortcut', () => {
    const shortcut: KeyboardShortcut = {
      key: 'z',
      ctrl: true,
      shift: true,
      description: 'Redo',
      action: jest.fn(),
    };

    expect(formatShortcut(shortcut)).toBe('Ctrl+Shift+Z');
  });

  it('should format Mac shortcuts with symbols', () => {
    Object.defineProperty(window.navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
      configurable: true,
    });

    const shortcut: KeyboardShortcut = {
      key: 's',
      ctrl: true,
      shift: true,
      alt: true,
      description: 'Save',
      action: jest.fn(),
    };

    expect(formatShortcut(shortcut)).toBe('⌘⌥⇧S');
  });

  it('should format arrow keys with symbols', () => {
    const shortcuts = [
      { key: 'arrowup', description: 'Up', action: jest.fn() },
      { key: 'arrowdown', description: 'Down', action: jest.fn() },
      { key: 'arrowleft', description: 'Left', action: jest.fn() },
      { key: 'arrowright', description: 'Right', action: jest.fn() },
    ];

    expect(formatShortcut(shortcuts[0])).toBe('↑');
    expect(formatShortcut(shortcuts[1])).toBe('↓');
    expect(formatShortcut(shortcuts[2])).toBe('←');
    expect(formatShortcut(shortcuts[3])).toBe('→');
  });

  it('should format space key', () => {
    const shortcut: KeyboardShortcut = {
      key: ' ',
      description: 'Space',
      action: jest.fn(),
    };

    expect(formatShortcut(shortcut)).toBe('Space');
  });
});
