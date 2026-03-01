# Electron React App

A modern Electron application built with React, TypeScript, and Vite.

## Features

- ⚡ Vite for fast development and building
- ⚛️ React 18 with TypeScript
- 🔧 ESLint and Prettier configured
- 📦 electron-builder for packaging
- 🎨 Modern UI with CSS
- 🔄 Hot Module Replacement (HMR)
- 🏗️ Separate dev and production modes

## Project Structure

```
.
├── electron/          # Electron main process
│   ├── main.ts       # Main process entry
│   └── preload.ts    # Preload script
├── src/              # React application
│   ├── App.tsx       # Main App component
│   ├── App.css       # App styles
│   ├── main.tsx      # React entry point
│   └── index.css     # Global styles
├── public/           # Static assets
├── build/            # Build resources
├── dist/             # Compiled React app
├── dist-electron/    # Compiled Electron files
└── release/          # Built installers
```

## Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

This will start Vite dev server and launch Electron with hot reload enabled.

## Building

Build for production:

```bash
npm run build
```

Build for testing (unpacked):

```bash
npm run build:dir
```

## Code Quality

Run ESLint:

```bash
npm run lint
```

Fix ESLint issues:

```bash
npm run lint:fix
```

Format code with Prettier:

```bash
npm run format
```

Type checking:

```bash
npm run type-check
```

## Main Process Features

The Electron main process (`electron/main.ts`) includes:

- Window management with proper lifecycle handling
- Dev/Production mode detection
- Preload script for secure IPC communication
- DevTools in development mode
- Proper window state management

## Technologies

- **Electron** - Desktop application framework
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **electron-builder** - Application packaging
- **ESLint** - Code linting
- **Prettier** - Code formatting
