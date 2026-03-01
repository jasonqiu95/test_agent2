import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Custom hook for managing global keyboard shortcuts
 * Supports both Windows (Ctrl) and Mac (Cmd/Meta) modifiers
 */
export const useKeyboardShortcuts = ({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) => {
  const shortcutsRef = useRef(shortcuts);

  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const { key, ctrlKey, altKey, shiftKey, metaKey } = event;

    // Find matching shortcut
    const matchedShortcut = shortcutsRef.current.find((shortcut) => {
      const keyMatches = shortcut.key.toLowerCase() === key.toLowerCase();
      const ctrlMatches = shortcut.ctrl ? ctrlKey || metaKey : !ctrlKey && !metaKey;
      const altMatches = shortcut.alt ? altKey : !altKey;
      const shiftMatches = shortcut.shift ? shiftKey : !shiftKey;
      const metaMatches = shortcut.meta ? metaKey : !metaKey;

      // For Ctrl shortcuts, accept either Ctrl or Meta (Cmd on Mac)
      if (shortcut.ctrl) {
        return keyMatches && (ctrlKey || metaKey) && altMatches && shiftMatches;
      }

      return keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches;
    });

    if (matchedShortcut) {
      if (matchedShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      matchedShortcut.action();
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return {
    shortcuts: shortcutsRef.current,
  };
};

/**
 * Utility function to get the modifier key label based on platform
 */
export const getModifierKey = (): string => {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
  return isMac ? '⌘' : 'Ctrl';
};

/**
 * Utility function to format shortcut for display
 */
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

  if (shortcut.ctrl) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.meta && !shortcut.ctrl) {
    parts.push(isMac ? '⌘' : 'Meta');
  }

  parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
};
