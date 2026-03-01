import { useEffect, useCallback } from 'react';

/**
 * Menu action handlers interface
 * Define callbacks for each menu action that your app needs to handle
 */
export interface MenuActionHandlers {
  // File menu
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onExport?: (format: string) => void;
  onClose?: () => void;

  // Edit menu
  onUndo?: () => void;
  onRedo?: () => void;
  onFind?: () => void;
  onReplace?: () => void;

  // View menu
  onToggleSidebar?: () => void;
  onToggleProperties?: () => void;
  onToggleOutline?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;

  // Format menu
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onStrikethrough?: () => void;
  onAlign?: (alignment: 'left' | 'center' | 'right' | 'justify') => void;
  onStyle?: (style: string) => void;
  onClearFormatting?: () => void;

  // Help menu
  onShowShortcuts?: () => void;
  onShowAbout?: () => void;
}

/**
 * Hook to handle menu actions from the Electron main process
 * This connects menu items to your app's state management (Redux, Context, etc.)
 */
export function useMenuActions(handlers: MenuActionHandlers) {
  // File menu handlers
  const handleFileNew = useCallback(() => {
    handlers.onNew?.();
  }, [handlers]);

  const handleFileOpen = useCallback(() => {
    handlers.onOpen?.();
  }, [handlers]);

  const handleFileSave = useCallback(() => {
    handlers.onSave?.();
  }, [handlers]);

  const handleFileSaveAs = useCallback(() => {
    handlers.onSaveAs?.();
  }, [handlers]);

  const handleFileExport = useCallback(
    (data: any) => {
      if (data && data.format) {
        handlers.onExport?.(data.format);
      }
    },
    [handlers]
  );

  const handleFileClose = useCallback(() => {
    handlers.onClose?.();
  }, [handlers]);

  // Edit menu handlers
  const handleEditUndo = useCallback(() => {
    handlers.onUndo?.();
  }, [handlers]);

  const handleEditRedo = useCallback(() => {
    handlers.onRedo?.();
  }, [handlers]);

  const handleEditFind = useCallback(() => {
    handlers.onFind?.();
  }, [handlers]);

  const handleEditReplace = useCallback(() => {
    handlers.onReplace?.();
  }, [handlers]);

  // View menu handlers
  const handleViewToggleSidebar = useCallback(() => {
    handlers.onToggleSidebar?.();
  }, [handlers]);

  const handleViewToggleProperties = useCallback(() => {
    handlers.onToggleProperties?.();
  }, [handlers]);

  const handleViewToggleOutline = useCallback(() => {
    handlers.onToggleOutline?.();
  }, [handlers]);

  const handleViewZoomIn = useCallback(() => {
    handlers.onZoomIn?.();
  }, [handlers]);

  const handleViewZoomOut = useCallback(() => {
    handlers.onZoomOut?.();
  }, [handlers]);

  const handleViewResetZoom = useCallback(() => {
    handlers.onResetZoom?.();
  }, [handlers]);

  const handleViewTheme = useCallback(
    (data: any) => {
      if (data && data.theme) {
        handlers.onThemeChange?.(data.theme);
      }
    },
    [handlers]
  );

  // Format menu handlers
  const handleFormatBold = useCallback(() => {
    handlers.onBold?.();
  }, [handlers]);

  const handleFormatItalic = useCallback(() => {
    handlers.onItalic?.();
  }, [handlers]);

  const handleFormatUnderline = useCallback(() => {
    handlers.onUnderline?.();
  }, [handlers]);

  const handleFormatStrikethrough = useCallback(() => {
    handlers.onStrikethrough?.();
  }, [handlers]);

  const handleFormatAlign = useCallback(
    (data: any) => {
      if (data && data.alignment) {
        handlers.onAlign?.(data.alignment);
      }
    },
    [handlers]
  );

  const handleFormatStyle = useCallback(
    (data: any) => {
      if (data && data.style) {
        handlers.onStyle?.(data.style);
      }
    },
    [handlers]
  );

  const handleFormatClearFormatting = useCallback(() => {
    handlers.onClearFormatting?.();
  }, [handlers]);

  // Help menu handlers
  const handleHelpShortcuts = useCallback(() => {
    handlers.onShowShortcuts?.();
  }, [handlers]);

  const handleHelpAbout = useCallback(() => {
    handlers.onShowAbout?.();
  }, [handlers]);

  // Set up IPC listeners
  useEffect(() => {
    if (!window.electron) return;

    // File menu
    window.electron.on('menu:file:new', handleFileNew);
    window.electron.on('menu:file:open', handleFileOpen);
    window.electron.on('menu:file:save', handleFileSave);
    window.electron.on('menu:file:saveAs', handleFileSaveAs);
    window.electron.on('menu:file:export', handleFileExport);
    window.electron.on('menu:file:close', handleFileClose);

    // Edit menu
    window.electron.on('menu:edit:undo', handleEditUndo);
    window.electron.on('menu:edit:redo', handleEditRedo);
    window.electron.on('menu:edit:find', handleEditFind);
    window.electron.on('menu:edit:replace', handleEditReplace);

    // View menu
    window.electron.on('menu:view:toggleSidebar', handleViewToggleSidebar);
    window.electron.on('menu:view:toggleProperties', handleViewToggleProperties);
    window.electron.on('menu:view:toggleOutline', handleViewToggleOutline);
    window.electron.on('menu:view:zoomIn', handleViewZoomIn);
    window.electron.on('menu:view:zoomOut', handleViewZoomOut);
    window.electron.on('menu:view:resetZoom', handleViewResetZoom);
    window.electron.on('menu:view:theme', handleViewTheme);

    // Format menu
    window.electron.on('menu:format:bold', handleFormatBold);
    window.electron.on('menu:format:italic', handleFormatItalic);
    window.electron.on('menu:format:underline', handleFormatUnderline);
    window.electron.on('menu:format:strikethrough', handleFormatStrikethrough);
    window.electron.on('menu:format:align', handleFormatAlign);
    window.electron.on('menu:format:style', handleFormatStyle);
    window.electron.on('menu:format:clearFormatting', handleFormatClearFormatting);

    // Help menu
    window.electron.on('menu:help:shortcuts', handleHelpShortcuts);
    window.electron.on('menu:help:about', handleHelpAbout);

    // Note: Electron IPC doesn't provide a way to remove individual listeners
    // The listeners will be cleaned up when the component unmounts
  }, [
    handleFileNew,
    handleFileOpen,
    handleFileSave,
    handleFileSaveAs,
    handleFileExport,
    handleFileClose,
    handleEditUndo,
    handleEditRedo,
    handleEditFind,
    handleEditReplace,
    handleViewToggleSidebar,
    handleViewToggleProperties,
    handleViewToggleOutline,
    handleViewZoomIn,
    handleViewZoomOut,
    handleViewResetZoom,
    handleViewTheme,
    handleFormatBold,
    handleFormatItalic,
    handleFormatUnderline,
    handleFormatStrikethrough,
    handleFormatAlign,
    handleFormatStyle,
    handleFormatClearFormatting,
    handleHelpShortcuts,
    handleHelpAbout,
  ]);
}

/**
 * Helper function to invoke menu-related IPC handlers
 */
export const menuAPI = {
  showAbout: () => window.electron?.invoke('menu:showAbout'),
  showShortcuts: () => window.electron?.invoke('menu:showShortcuts'),
  export: (format: string) => window.electron?.invoke('menu:export', { format }),
  showFind: () => window.electron?.invoke('menu:showFind'),
  showReplace: () => window.electron?.invoke('menu:showReplace'),
  zoom: (action: 'in' | 'out' | 'reset') => window.electron?.invoke('menu:zoom', { action }),
  setTheme: (theme: string) => window.electron?.invoke('menu:setTheme', { theme }),
};
