/**
 * EditorPanel Component Tests
 * Tests for editor initialization, lifecycle, and basic functionality
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorPanel } from '../EditorPanel';
import { renderWithProviders } from '../../../__tests__/testUtils';
import {
  emptyDocument,
  simpleDocument,
  formattedDocument,
  longDocument,
} from '../../../editor/__tests__/fixtures/documentFixtures';

describe('EditorPanel', () => {
  describe('Component Rendering', () => {
    it('should render with default props', () => {
      renderWithProviders(<EditorPanel />);
      expect(screen.getByText('Editor')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      renderWithProviders(<EditorPanel title="My Custom Editor" />);
      expect(screen.getByText('My Custom Editor')).toBeInTheDocument();
    });

    it('should render close button when onClose is provided', () => {
      const handleClose = jest.fn();
      renderWithProviders(<EditorPanel onClose={handleClose} />);
      const closeButton = screen.getByLabelText('Close editor panel');
      expect(closeButton).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();
      renderWithProviders(<EditorPanel onClose={handleClose} />);

      const closeButton = screen.getByLabelText('Close editor panel');
      await user.click(closeButton);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should render toolbar when provided', () => {
      const toolbar = <div data-testid="custom-toolbar">Custom Toolbar</div>;
      renderWithProviders(<EditorPanel toolbar={toolbar} />);
      expect(screen.getByTestId('custom-toolbar')).toBeInTheDocument();
    });

    it('should render footer when provided', () => {
      const footer = <div data-testid="custom-footer">Custom Footer</div>;
      renderWithProviders(<EditorPanel footer={footer} />);
      expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = renderWithProviders(
        <EditorPanel className="custom-class" />
      );
      const panel = container.querySelector('.editor-panel.custom-class');
      expect(panel).toBeInTheDocument();
    });

    it('should render children when provided', () => {
      const children = <div data-testid="custom-children">Custom Content</div>;
      renderWithProviders(<EditorPanel>{children}</EditorPanel>);
      expect(screen.getByTestId('custom-children')).toBeInTheDocument();
    });
  });

  describe('Editor Initialization', () => {
    it('should initialize editor with empty document', () => {
      const { container } = renderWithProviders(<EditorPanel />);
      const editor = container.querySelector('.editor-panel-prosemirror');
      expect(editor).toBeInTheDocument();
    });

    it('should initialize editor with provided content', () => {
      const { container } = renderWithProviders(
        <EditorPanel content={simpleDocument} />
      );
      const editor = container.querySelector('.editor-panel-prosemirror');
      expect(editor).toBeInTheDocument();
      expect(editor?.textContent).toContain('Hello world');
    });

    it('should initialize editor with formatted content', () => {
      const { container } = renderWithProviders(
        <EditorPanel content={formattedDocument} />
      );
      const editor = container.querySelector('.editor-panel-prosemirror');
      expect(editor).toBeInTheDocument();
      expect(editor?.textContent).toContain('This is bold and italic text.');
    });

    it('should handle empty document initialization', () => {
      const { container } = renderWithProviders(
        <EditorPanel content={emptyDocument} />
      );
      const editor = container.querySelector('.editor-panel-prosemirror');
      expect(editor).toBeInTheDocument();
    });

    it('should handle long document initialization', () => {
      const { container } = renderWithProviders(
        <EditorPanel content={longDocument} />
      );
      const editor = container.querySelector('.editor-panel-prosemirror');
      expect(editor).toBeInTheDocument();
      expect(editor?.textContent).toContain('This is paragraph 1');
      expect(editor?.textContent).toContain('This is paragraph 100');
    });
  });

  describe('Editor Editability', () => {
    it('should be editable by default', () => {
      const { container } = renderWithProviders(<EditorPanel />);
      const editor = container.querySelector('.ProseMirror');
      expect(editor).not.toHaveAttribute('contenteditable', 'false');
    });

    it('should be read-only when editable is false', () => {
      const { container } = renderWithProviders(
        <EditorPanel editable={false} />
      );
      const editor = container.querySelector('.ProseMirror');
      expect(editor).toHaveAttribute('contenteditable', 'false');
    });

    it('should update editability when prop changes', () => {
      const { container, rerender } = renderWithProviders(
        <EditorPanel editable={true} />
      );
      const editor = container.querySelector('.ProseMirror');

      expect(editor).not.toHaveAttribute('contenteditable', 'false');

      rerender(<EditorPanel editable={false} />);
      expect(editor).toHaveAttribute('contenteditable', 'false');
    });
  });

  describe('Event Handlers', () => {
    it('should call onChange handler when content changes', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      const { container } = renderWithProviders(
        <EditorPanel
          handlers={{ onChange: handleChange }}
          content={emptyDocument}
        />
      );

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
        await user.keyboard('Hello');
      }

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalled();
      });
    });

    it('should call onFocus handler when editor gains focus', async () => {
      const user = userEvent.setup();
      const handleFocus = jest.fn();
      const { container } = renderWithProviders(
        <EditorPanel handlers={{ onFocus: handleFocus }} />
      );

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
      }

      await waitFor(() => {
        expect(handleFocus).toHaveBeenCalled();
      });
    });

    it('should call onBlur handler when editor loses focus', async () => {
      const user = userEvent.setup();
      const handleBlur = jest.fn();
      const { container } = renderWithProviders(
        <EditorPanel handlers={{ onBlur: handleBlur }} />
      );

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
        await user.tab(); // Move focus away
      }

      await waitFor(() => {
        expect(handleBlur).toHaveBeenCalled();
      });
    });

    it('should call onUpdate handler on every transaction', async () => {
      const user = userEvent.setup();
      const handleUpdate = jest.fn();
      const { container } = renderWithProviders(
        <EditorPanel handlers={{ onUpdate: handleUpdate }} />
      );

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
        await user.keyboard('a');
      }

      await waitFor(() => {
        expect(handleUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Auto-focus', () => {
    it('should not auto-focus by default', () => {
      const { container } = renderWithProviders(<EditorPanel />);
      const editor = container.querySelector('.ProseMirror');
      expect(document.activeElement).not.toBe(editor);
    });

    it('should auto-focus when autoFocus is true', async () => {
      const { container } = renderWithProviders(
        <EditorPanel autoFocus={true} />
      );
      const editor = container.querySelector('.ProseMirror');

      await waitFor(() => {
        expect(document.activeElement).toBe(editor);
      });
    });
  });

  describe('Content Updates', () => {
    it('should update content when prop changes', async () => {
      const { container, rerender } = renderWithProviders(
        <EditorPanel content={simpleDocument} useRedux={false} />
      );
      const editor = container.querySelector('.ProseMirror');

      expect(editor?.textContent).toContain('Hello world');

      rerender(<EditorPanel content={formattedDocument} useRedux={false} />);

      await waitFor(() => {
        expect(editor?.textContent).toContain('This is bold and italic text.');
      });
    });

    it('should not update if content is the same', async () => {
      const onChange = jest.fn();
      const { rerender } = renderWithProviders(
        <EditorPanel
          content={simpleDocument}
          handlers={{ onChange }}
          useRedux={false}
        />
      );

      const callCount = onChange.mock.calls.length;

      rerender(
        <EditorPanel
          content={simpleDocument}
          handlers={{ onChange }}
          useRedux={false}
        />
      );

      await waitFor(() => {
        expect(onChange.mock.calls.length).toBe(callCount);
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup editor on unmount', () => {
      const { container, unmount } = renderWithProviders(<EditorPanel />);
      const editor = container.querySelector('.ProseMirror');

      expect(editor).toBeInTheDocument();

      unmount();

      expect(editor).not.toBeInTheDocument();
    });

    it('should clear debounce timers on unmount', async () => {
      jest.useFakeTimers();

      const { unmount } = renderWithProviders(
        <EditorPanel
          chapterId="test-chapter"
          debounceDelay={300}
        />
      );

      unmount();

      // Advance timers to ensure no pending callbacks execute
      jest.runAllTimers();

      jest.useRealTimers();
    });
  });

  describe('Redux Integration (disabled)', () => {
    it('should work without Redux when useRedux is false', () => {
      const { container } = renderWithProviders(
        <EditorPanel
          content={simpleDocument}
          useRedux={false}
        />
      );
      const editor = container.querySelector('.ProseMirror');
      expect(editor?.textContent).toContain('Hello world');
    });

    it('should not dispatch to Redux when useRedux is false', async () => {
      const user = userEvent.setup();
      const { container, store } = renderWithProviders(
        <EditorPanel useRedux={false} />
      );

      const initialActions = store.getState();

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
        await user.keyboard('test');
      }

      // Editor content should not be in Redux state
      expect(store.getState().editor).toBeUndefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible close button', () => {
      const handleClose = jest.fn();
      renderWithProviders(<EditorPanel onClose={handleClose} />);
      const closeButton = screen.getByLabelText('Close editor panel');
      expect(closeButton).toHaveAttribute('aria-label', 'Close editor panel');
    });

    it('should have proper heading structure', () => {
      renderWithProviders(<EditorPanel title="Test Editor" />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Test Editor');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null content prop', () => {
      const { container } = renderWithProviders(
        <EditorPanel content={null} useRedux={false} />
      );
      const editor = container.querySelector('.ProseMirror');
      expect(editor).toBeInTheDocument();
    });

    it('should handle undefined handlers', () => {
      expect(() => {
        renderWithProviders(<EditorPanel handlers={undefined} />);
      }).not.toThrow();
    });

    it('should handle rapid content changes', async () => {
      const { rerender, container } = renderWithProviders(
        <EditorPanel content={simpleDocument} useRedux={false} />
      );

      rerender(<EditorPanel content={formattedDocument} useRedux={false} />);
      rerender(<EditorPanel content={emptyDocument} useRedux={false} />);
      rerender(<EditorPanel content={simpleDocument} useRedux={false} />);

      const editor = container.querySelector('.ProseMirror');
      await waitFor(() => {
        expect(editor?.textContent).toContain('Hello world');
      });
    });

    it('should handle zero debounce delay', () => {
      expect(() => {
        renderWithProviders(
          <EditorPanel
            chapterId="test"
            debounceDelay={0}
          />
        );
      }).not.toThrow();
    });

    it('should handle large debounce delay', () => {
      expect(() => {
        renderWithProviders(
          <EditorPanel
            chapterId="test"
            debounceDelay={10000}
          />
        );
      }).not.toThrow();
    });
  });
});
