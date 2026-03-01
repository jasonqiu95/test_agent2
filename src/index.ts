// Main exports for the keyboard shortcuts system
export { useKeyboardShortcuts, getModifierKey, formatShortcut } from './hooks/useKeyboardShortcuts';
export type { KeyboardShortcut, UseKeyboardShortcutsOptions } from './hooks/useKeyboardShortcuts';
export { ShortcutsDialog } from './components/ShortcutsDialog';
export type { ShortcutsDialogProps } from './components/ShortcutsDialog';
export type { ShortcutAction, ShortcutKey } from './types/shortcuts';
