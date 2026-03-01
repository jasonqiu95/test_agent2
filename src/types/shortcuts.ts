export interface ShortcutAction {
  save: () => void;
  export: () => void;
  newChapter: () => void;
  toggleStyleBrowser: () => void;
  togglePreview: () => void;
  find: () => void;
  showShortcuts: () => void;
}

export type ShortcutKey =
  | 'save'
  | 'export'
  | 'newChapter'
  | 'toggleStyleBrowser'
  | 'togglePreview'
  | 'find'
  | 'showShortcuts';
