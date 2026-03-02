# E2E Tests for Keyboard Shortcuts and Accessibility

This directory contains comprehensive end-to-end (E2E) tests for keyboard shortcuts and accessibility features using Playwright.

## Test Files

### 1. `keyboard-shortcuts-accessibility.spec.ts`
Main test suite covering:
- **Keyboard Navigation**: Tab, Shift+Tab, Enter, Space, ESC, Arrow keys
- **Keyboard Shortcuts**:
  - `Cmd/Ctrl + Z`: Undo
  - `Cmd/Ctrl + Shift + Z`: Redo
  - `Cmd/Ctrl + S`: Save
  - `Cmd/Ctrl + /`: Open shortcuts dialog
  - `Cmd/Ctrl + B/I/U`: Text formatting (Bold, Italic, Underline)
  - `Cmd/Ctrl + 1/2/3`: Focus panels
  - `Cmd/Ctrl + P`: Toggle preview
  - `Cmd/Ctrl + ArrowUp/Down`: Navigate chapters
- **Accessibility Features**:
  - ARIA labels and roles
  - Focus indicators
  - Semantic HTML structure
  - Dialog accessibility (ESC to close, proper ARIA attributes)
  - Color contrast
  - Rapid shortcut handling

### 2. `accessibility-advanced.spec.ts`
Advanced accessibility tests using custom helpers

### 3. `helpers/accessibility.ts`
Reusable accessibility testing utilities

### 4. `helpers/electron.ts`
Electron app lifecycle helpers

## Running the Tests

### Prerequisites
1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the application:
   ```bash
   npm run build:dir
   ```

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Tests in Headed Mode
```bash
npm run test:e2e:headed
```

### Run Tests in Debug Mode
```bash
npm run test:e2e:debug
```

## Test Coverage

- ✅ Tab/Shift+Tab navigation
- ✅ Keyboard shortcuts (Undo, Redo, Save, etc.)
- ✅ ARIA labels and roles
- ✅ Focus indicators
- ✅ Dialog accessibility
- ✅ Semantic HTML
- ✅ Cross-platform support
