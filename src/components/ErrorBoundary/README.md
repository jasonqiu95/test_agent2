# Error Boundary System

A comprehensive error handling system for React applications with graceful failure recovery.

## Features

- **React Error Boundaries**: Catch errors in component trees
- **User-friendly Error Messages**: Contextual, actionable error messages
- **Error Logging**: Console and file logging with categorization
- **Unsaved Changes Preservation**: Automatic emergency saves on crashes
- **Recovery Options**: Try again, reload, or restore from emergency saves
- **Error Categorization**: Intelligent error type detection (file not found, parse errors, etc.)

## Usage

### App-Level Error Boundary

Wrap your entire application to catch all errors:

```tsx
import { ErrorBoundary } from './components/ErrorBoundary';
import { getPersistenceService } from './services/persistence';

const persistenceService = getPersistenceService();

<ErrorBoundary
  level="app"
  preserveState={() => persistenceService.getCurrentProject()}
  onError={(error) => console.error('App error:', error)}
>
  <App />
</ErrorBoundary>
```

### Layout-Level Error Boundary

Wrap major sections to isolate failures:

```tsx
<ErrorBoundary level="layout">
  <EditorLayout />
</ErrorBoundary>
```

### Component-Level Error Boundary

Wrap individual components for granular error handling:

```tsx
<ErrorBoundary level="component">
  <FileImporter />
</ErrorBoundary>
```

## Error Handler Utilities

### Basic Error Handling

```tsx
import { getErrorHandler, ErrorType } from './utils/errorHandler';

const errorHandler = getErrorHandler();

try {
  // Some operation
} catch (error) {
  errorHandler.handleError(error, {
    userAction: 'Importing file',
    filePath: '/path/to/file.docx',
  }, ErrorType.PARSE_ERROR);
}
```

### Async Error Handling

```tsx
import { withErrorHandling } from './utils/asyncErrorHandler';

const result = await withErrorHandling(
  async () => {
    return await fetchData();
  },
  {
    errorType: ErrorType.NETWORK_ERROR,
    retryAttempts: 3,
    retryDelay: 1000,
  }
);
```

### Safe Execution

```tsx
import { tryCatch } from './utils/asyncErrorHandler';

const value = tryCatch(
  () => JSON.parse(data),
  null, // fallback value
  ErrorType.PARSE_ERROR
);
```

## Error Types

- `FILE_NOT_FOUND`: Missing files
- `PARSE_ERROR`: JSON/XML parsing failures
- `EXPORT_ERROR`: File save failures
- `NETWORK_ERROR`: Network/fetch errors
- `PERMISSION_ERROR`: Access denied
- `VALIDATION_ERROR`: Invalid input
- `RUNTIME_ERROR`: Unexpected runtime errors
- `UNKNOWN_ERROR`: Uncategorized errors

## Emergency Recovery

The system automatically preserves unsaved changes when errors occur. Users can:

1. Check for emergency saves via the error UI
2. Restore from localStorage emergency saves
3. Access error logs for debugging

## Development vs Production

In development mode:
- Full error details and stack traces are shown
- Component stacks are displayed
- Detailed technical information is available

In production mode:
- Only user-friendly messages are shown
- Technical details are hidden
- Errors are still logged for debugging

## Customization

### Custom Error Messages

```tsx
const errorHandler = getErrorHandler();
errorHandler.onError((error) => {
  // Custom handling
  showNotification(error.userMessage);
});
```

### File Logging

Errors are automatically logged to files via Electron IPC if available.

## Best Practices

1. **Use appropriate boundary levels**: App > Layout > Component
2. **Provide context**: Always include user action and file paths
3. **Preserve state**: Pass preserveState for important data
4. **Handle recoverable errors**: Allow users to retry when possible
5. **Test error scenarios**: Verify error boundaries catch expected errors
