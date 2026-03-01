/**
 * Application menu bar configuration for Electron
 */

import { Menu, MenuItemConstructorOptions, BrowserWindow, app, shell } from 'electron';

export function createApplicationMenu(mainWindow: BrowserWindow | null): Menu {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    // App Menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              {
                label: `About ${app.name}`,
                click: () => {
                  mainWindow?.webContents.send('menu:help:about');
                },
              },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),

    // File Menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu:file:new');
          },
        },
        { type: 'separator' },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send('menu:file:open');
          },
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu:file:save');
          },
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow?.webContents.send('menu:file:saveAs');
          },
        },
        { type: 'separator' },
        {
          label: 'Export',
          submenu: [
            {
              label: 'Export as PDF...',
              click: () => {
                mainWindow?.webContents.send('menu:file:export', { format: 'pdf' });
              },
            },
            {
              label: 'Export as DOCX...',
              click: () => {
                mainWindow?.webContents.send('menu:file:export', { format: 'docx' });
              },
            },
            {
              label: 'Export as EPUB...',
              click: () => {
                mainWindow?.webContents.send('menu:file:export', { format: 'epub' });
              },
            },
          ],
        },
        { type: 'separator' },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow?.webContents.send('menu:file:close');
          },
        },
        ...(!isMac
          ? [
              { type: 'separator' as const },
              {
                label: 'Exit',
                click: () => {
                  app.quit();
                },
              },
            ]
          : []),
      ],
    },

    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => {
            mainWindow?.webContents.send('menu:edit:undo');
          },
        },
        {
          label: 'Redo',
          accelerator: isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y',
          click: () => {
            mainWindow?.webContents.send('menu:edit:redo');
          },
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut',
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste',
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectAll',
        },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            mainWindow?.webContents.send('menu:edit:find');
          },
        },
        {
          label: 'Replace',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            mainWindow?.webContents.send('menu:edit:replace');
          },
        },
      ],
    },

    // View Menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow?.webContents.send('menu:view:toggleSidebar');
          },
        },
        {
          label: 'Toggle Properties Panel',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => {
            mainWindow?.webContents.send('menu:view:toggleProperties');
          },
        },
        {
          label: 'Toggle Outline',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            mainWindow?.webContents.send('menu:view:toggleOutline');
          },
        },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            mainWindow?.webContents.send('menu:view:zoomIn');
          },
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            mainWindow?.webContents.send('menu:view:zoomOut');
          },
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow?.webContents.send('menu:view:resetZoom');
          },
        },
        { type: 'separator' },
        {
          label: 'Theme',
          submenu: [
            {
              label: 'Light Theme',
              click: () => {
                mainWindow?.webContents.send('menu:view:theme', { theme: 'light' });
              },
            },
            {
              label: 'Dark Theme',
              click: () => {
                mainWindow?.webContents.send('menu:view:theme', { theme: 'dark' });
              },
            },
            {
              label: 'System Default',
              click: () => {
                mainWindow?.webContents.send('menu:view:theme', { theme: 'system' });
              },
            },
          ],
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          role: 'reload',
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: isMac ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          role: 'toggleDevTools',
        },
        { type: 'separator' },
        {
          label: 'Toggle Full Screen',
          accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11',
          role: 'togglefullscreen',
        },
      ],
    },

    // Format Menu
    {
      label: 'Format',
      submenu: [
        {
          label: 'Bold',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow?.webContents.send('menu:format:bold');
          },
        },
        {
          label: 'Italic',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow?.webContents.send('menu:format:italic');
          },
        },
        {
          label: 'Underline',
          accelerator: 'CmdOrCtrl+U',
          click: () => {
            mainWindow?.webContents.send('menu:format:underline');
          },
        },
        {
          label: 'Strikethrough',
          accelerator: 'CmdOrCtrl+Shift+X',
          click: () => {
            mainWindow?.webContents.send('menu:format:strikethrough');
          },
        },
        { type: 'separator' },
        {
          label: 'Alignment',
          submenu: [
            {
              label: 'Align Left',
              accelerator: 'CmdOrCtrl+Shift+L',
              click: () => {
                mainWindow?.webContents.send('menu:format:align', { alignment: 'left' });
              },
            },
            {
              label: 'Align Center',
              accelerator: 'CmdOrCtrl+Shift+E',
              click: () => {
                mainWindow?.webContents.send('menu:format:align', {
                  alignment: 'center',
                });
              },
            },
            {
              label: 'Align Right',
              accelerator: 'CmdOrCtrl+Shift+R',
              click: () => {
                mainWindow?.webContents.send('menu:format:align', { alignment: 'right' });
              },
            },
            {
              label: 'Justify',
              accelerator: 'CmdOrCtrl+Shift+J',
              click: () => {
                mainWindow?.webContents.send('menu:format:align', {
                  alignment: 'justify',
                });
              },
            },
          ],
        },
        { type: 'separator' },
        {
          label: 'Text Styles',
          submenu: [
            {
              label: 'Heading 1',
              accelerator: 'CmdOrCtrl+Alt+1',
              click: () => {
                mainWindow?.webContents.send('menu:format:style', { style: 'heading1' });
              },
            },
            {
              label: 'Heading 2',
              accelerator: 'CmdOrCtrl+Alt+2',
              click: () => {
                mainWindow?.webContents.send('menu:format:style', { style: 'heading2' });
              },
            },
            {
              label: 'Heading 3',
              accelerator: 'CmdOrCtrl+Alt+3',
              click: () => {
                mainWindow?.webContents.send('menu:format:style', { style: 'heading3' });
              },
            },
            { type: 'separator' },
            {
              label: 'Paragraph',
              accelerator: 'CmdOrCtrl+Alt+0',
              click: () => {
                mainWindow?.webContents.send('menu:format:style', { style: 'paragraph' });
              },
            },
            {
              label: 'Quote',
              click: () => {
                mainWindow?.webContents.send('menu:format:style', { style: 'quote' });
              },
            },
          ],
        },
        { type: 'separator' },
        {
          label: 'Clear Formatting',
          accelerator: 'CmdOrCtrl+\\',
          click: () => {
            mainWindow?.webContents.send('menu:format:clearFormatting');
          },
        },
      ],
    },

    // Help Menu
    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://github.com/your-repo/docs');
          },
        },
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: () => {
            mainWindow?.webContents.send('menu:help:shortcuts');
          },
        },
        { type: 'separator' },
        {
          label: 'Report an Issue',
          click: async () => {
            await shell.openExternal('https://github.com/your-repo/issues');
          },
        },
        { type: 'separator' },
        ...(!isMac
          ? [
              {
                label: `About ${app.name}`,
                click: () => {
                  mainWindow?.webContents.send('menu:help:about');
                },
              },
            ]
          : []),
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

/**
 * Set the application menu
 */
export function setApplicationMenu(mainWindow: BrowserWindow | null): void {
  const menu = createApplicationMenu(mainWindow);
  Menu.setApplicationMenu(menu);
}
