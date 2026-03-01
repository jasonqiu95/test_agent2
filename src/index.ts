/**
 * Main entry point for book publishing application
 * Exports both core data models and keyboard shortcuts system
 */

// Core data models
export * from './types';
export * from './models';

// Keyboard shortcuts system
export { useKeyboardShortcuts, getModifierKey, formatShortcut } from './hooks/useKeyboardShortcuts';
export type { KeyboardShortcut, UseKeyboardShortcutsOptions } from './hooks/useKeyboardShortcuts';
export { ShortcutsDialog } from './components/ShortcutsDialog';
export type { ShortcutsDialogProps } from './components/ShortcutsDialog';
export type { ShortcutAction, ShortcutKey } from './types/shortcuts';
