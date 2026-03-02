import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock the EPUB generation hook
jest.mock('./hooks/useEpubGeneration', () => ({
  useEpubGeneration: () => ({
    state: 'idle',
    progress: null,
    error: null,
    result: null,
    isGenerating: false,
    generate: jest.fn(),
    cancel: jest.fn(),
    reset: jest.fn(),
    saveFile: jest.fn(),
  }),
}));

// Mock the undo/redo hook
jest.mock('./hooks/useUndoRedo', () => ({
  useUndoRedo: jest.fn(),
}));

describe('App Component', () => {
  it('renders the welcome screen initially', () => {
    render(<App />);
    expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
  });

  it('shows the editor view when a project is created', async () => {
    render(<App />);

    const newProjectButton = screen.getByRole('button', { name: /New Project/i });
    fireEvent.click(newProjectButton);

    await waitFor(() => {
      expect(screen.getByText(/Untitled/i)).toBeInTheDocument();
    });
  });

  it('shows the export button in editor view', async () => {
    render(<App />);

    // Create a new project to enter editor view
    const newProjectButton = screen.getByRole('button', { name: /New Project/i });
    fireEvent.click(newProjectButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Export EPUB/i })).toBeInTheDocument();
    });
  });

  it('disables export button when no book is loaded', async () => {
    render(<App />);

    // Create a new project
    const newProjectButton = screen.getByRole('button', { name: /New Project/i });
    fireEvent.click(newProjectButton);

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /Export EPUB/i });
      expect(exportButton).toBeInTheDocument();
    });
  });
});
