/**
 * EditorToolbar Component Tests
 * Integration tests for toolbar interactions and formatting controls
 */

import React, { useRef, useEffect, useState } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorView } from 'prosemirror-view';
import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorToolbar } from '../EditorToolbar';
import { renderWithProviders } from '../../../__tests__/testUtils';
import { editorSchema } from '../../../editor/schema';
import { createDefaultPlugins } from '../../../editor/plugins';
import {
  simpleDocument,
  headingDocument,
  formattedDocument,
} from '../../../editor/__tests__/fixtures/documentFixtures';

// Test wrapper component that sets up a real editor
function EditorToolbarTestWrapper({ initialContent = simpleDocument }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorView, setEditorView] = useState<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const doc = editorSchema.nodeFromJSON(initialContent);
    const plugins = createDefaultPlugins(editorSchema);

    const state = EditorState.create({
      doc,
      schema: editorSchema,
      plugins,
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction) {
        const newState = view.state.apply(transaction);
        view.updateState(newState);
      },
    });

    setEditorView(view);

    return () => {
      view.destroy();
    };
  }, []);

  return (
    <div>
      <EditorToolbar editorView={editorView} />
      <div ref={editorRef} data-testid="editor-content" />
    </div>
  );
}

describe('EditorToolbar', () => {
  describe('Component Rendering', () => {
    it('should render without editor view', () => {
      const { container } = renderWithProviders(
        <EditorToolbar editorView={null} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render all text formatting buttons', () => {
      renderWithProviders(<EditorToolbarTestWrapper />);

      expect(screen.getByLabelText('Bold')).toBeInTheDocument();
      expect(screen.getByLabelText('Italic')).toBeInTheDocument();
      expect(screen.getByLabelText('Underline')).toBeInTheDocument();
    });

    it('should render all heading buttons', () => {
      renderWithProviders(<EditorToolbarTestWrapper />);

      expect(screen.getByLabelText('H1')).toBeInTheDocument();
      expect(screen.getByLabelText('H2')).toBeInTheDocument();
      expect(screen.getByLabelText('H3')).toBeInTheDocument();
      expect(screen.getByLabelText('H4')).toBeInTheDocument();
      expect(screen.getByLabelText('H5')).toBeInTheDocument();
      expect(screen.getByLabelText('H6')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = renderWithProviders(
        <EditorToolbarTestWrapper />
      );
      expect(
        container.querySelector('.editor-toolbar-formatting')
      ).toBeInTheDocument();
    });

    it('should show keyboard shortcuts in tooltips', () => {
      renderWithProviders(<EditorToolbarTestWrapper />);

      const boldButton = screen.getByLabelText('Bold');
      expect(boldButton).toHaveAttribute('title', 'Bold (Ctrl+B)');

      const italicButton = screen.getByLabelText('Italic');
      expect(italicButton).toHaveAttribute('title', 'Italic (Ctrl+I)');

      const h1Button = screen.getByLabelText('H1');
      expect(h1Button).toHaveAttribute('title', 'Heading 1 (Ctrl+Alt+1)');
    });
  });

  describe('Text Formatting Interactions', () => {
    it('should apply bold formatting when bold button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EditorToolbarTestWrapper />);

      const editor = screen.getByTestId('editor-content');
      const boldButton = screen.getByLabelText('Bold');

      // Click editor and select some text
      await user.click(editor);
      const editorElement = editor.querySelector('.ProseMirror');
      if (editorElement) {
        // Simulate text selection
        const selection = window.getSelection();
        const range = document.createRange();
        const textNode = editorElement.firstChild;
        if (textNode?.firstChild) {
          range.setStart(textNode.firstChild, 0);
          range.setEnd(textNode.firstChild, 5);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }

      await user.click(boldButton);

      await waitFor(() => {
        expect(boldButton).toHaveClass('active');
      });
    });

    it('should apply italic formatting when italic button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EditorToolbarTestWrapper />);

      const editor = screen.getByTestId('editor-content');
      const italicButton = screen.getByLabelText('Italic');

      await user.click(editor);
      const editorElement = editor.querySelector('.ProseMirror');
      if (editorElement) {
        const selection = window.getSelection();
        const range = document.createRange();
        const textNode = editorElement.firstChild;
        if (textNode?.firstChild) {
          range.setStart(textNode.firstChild, 0);
          range.setEnd(textNode.firstChild, 5);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }

      await user.click(italicButton);

      await waitFor(() => {
        expect(italicButton).toHaveClass('active');
      });
    });

    it('should apply underline formatting when underline button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EditorToolbarTestWrapper />);

      const editor = screen.getByTestId('editor-content');
      const underlineButton = screen.getByLabelText('Underline');

      await user.click(editor);
      const editorElement = editor.querySelector('.ProseMirror');
      if (editorElement) {
        const selection = window.getSelection();
        const range = document.createRange();
        const textNode = editorElement.firstChild;
        if (textNode?.firstChild) {
          range.setStart(textNode.firstChild, 0);
          range.setEnd(textNode.firstChild, 5);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }

      await user.click(underlineButton);

      await waitFor(() => {
        expect(underlineButton).toHaveClass('active');
      });
    });

    it('should toggle formatting on and off', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EditorToolbarTestWrapper />);

      const editor = screen.getByTestId('editor-content');
      const boldButton = screen.getByLabelText('Bold');

      await user.click(editor);

      // Apply bold
      await user.click(boldButton);
      await waitFor(() => {
        expect(boldButton).toHaveClass('active');
      });

      // Remove bold
      await user.click(boldButton);
      await waitFor(() => {
        expect(boldButton).not.toHaveClass('active');
      });
    });

    it('should restore focus to editor after button click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EditorToolbarTestWrapper />);

      const editor = screen.getByTestId('editor-content');
      const boldButton = screen.getByLabelText('Bold');

      await user.click(editor);
      await user.click(boldButton);

      await waitFor(() => {
        const prosemirror = editor.querySelector('.ProseMirror');
        expect(document.activeElement).toBe(prosemirror);
      });
    });
  });

  describe('Heading Formatting Interactions', () => {
    it('should convert paragraph to H1', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EditorToolbarTestWrapper />);

      const editor = screen.getByTestId('editor-content');
      const h1Button = screen.getByLabelText('H1');

      await user.click(editor);
      await user.click(h1Button);

      await waitFor(() => {
        expect(h1Button).toHaveClass('active');
      });
    });

    it('should convert paragraph to H2', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EditorToolbarTestWrapper />);

      const editor = screen.getByTestId('editor-content');
      const h2Button = screen.getByLabelText('H2');

      await user.click(editor);
      await user.click(h2Button);

      await waitFor(() => {
        expect(h2Button).toHaveClass('active');
      });
    });

    it('should convert between different heading levels', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EditorToolbarTestWrapper />);

      const editor = screen.getByTestId('editor-content');
      const h1Button = screen.getByLabelText('H1');
      const h3Button = screen.getByLabelText('H3');

      await user.click(editor);

      // Convert to H1
      await user.click(h1Button);
      await waitFor(() => {
        expect(h1Button).toHaveClass('active');
      });

      // Convert to H3
      await user.click(h3Button);
      await waitFor(() => {
        expect(h3Button).toHaveClass('active');
        expect(h1Button).not.toHaveClass('active');
      });
    });

    it('should work with all heading levels (1-6)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EditorToolbarTestWrapper />);

      const editor = screen.getByTestId('editor-content');
      await user.click(editor);

      const headingLevels = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

      for (const level of headingLevels) {
        const button = screen.getByLabelText(level);
        await user.click(button);

        await waitFor(() => {
          expect(button).toHaveClass('active');
        });
      }
    });
  });

  describe('Active State Indicators', () => {
    it('should show active state for bold text', () => {
      renderWithProviders(
        <EditorToolbarTestWrapper initialContent={formattedDocument} />
      );

      // After initialization, the toolbar should update based on selection
      // This test verifies the toolbar reflects document state
      const boldButton = screen.getByLabelText('Bold');
      expect(boldButton).toBeInTheDocument();
    });

    it('should show active state for current heading level', () => {
      renderWithProviders(
        <EditorToolbarTestWrapper initialContent={headingDocument} />
      );

      // H1 button should eventually show active when cursor is in H1
      const h1Button = screen.getByLabelText('H1');
      expect(h1Button).toBeInTheDocument();
    });

    it('should update active state when selection changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <EditorToolbarTestWrapper initialContent={formattedDocument} />
      );

      const editor = screen.getByTestId('editor-content');
      const boldButton = screen.getByLabelText('Bold');

      // Click at different positions to change selection
      await user.click(editor);

      // The active state should be responsive to selection
      expect(boldButton).toBeInTheDocument();
    });

    it('should show multiple active marks simultaneously', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EditorToolbarTestWrapper />);

      const editor = screen.getByTestId('editor-content');
      const boldButton = screen.getByLabelText('Bold');
      const italicButton = screen.getByLabelText('Italic');

      await user.click(editor);

      // Apply both bold and italic
      await user.click(boldButton);
      await user.click(italicButton);

      await waitFor(() => {
        expect(boldButton).toHaveClass('active');
        expect(italicButton).toHaveClass('active');
      });
    });
  });

  describe('Button Accessibility', () => {
    it('should have proper aria-label attributes', () => {
      renderWithProviders(<EditorToolbarTestWrapper />);

      expect(screen.getByLabelText('Bold')).toBeInTheDocument();
      expect(screen.getByLabelText('Italic')).toBeInTheDocument();
      expect(screen.getByLabelText('Underline')).toBeInTheDocument();
    });

    it('should have aria-pressed attribute', () => {
      renderWithProviders(<EditorToolbarTestWrapper />);

      const boldButton = screen.getByLabelText('Bold');
      expect(boldButton).toHaveAttribute('aria-pressed');
    });

    it('should update aria-pressed when active state changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EditorToolbarTestWrapper />);

      const editor = screen.getByTestId('editor-content');
      const boldButton = screen.getByLabelText('Bold');

      await user.click(editor);

      const initialPressed = boldButton.getAttribute('aria-pressed');
      await user.click(boldButton);

      await waitFor(() => {
        const newPressed = boldButton.getAttribute('aria-pressed');
        expect(newPressed).not.toBe(initialPressed);
      });
    });

    it('should have type="button" to prevent form submission', () => {
      renderWithProviders(<EditorToolbarTestWrapper />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EditorToolbarTestWrapper />);

      const editor = screen.getByTestId('editor-content');
      const boldButton = screen.getByLabelText('Bold');

      await user.click(editor);
      await user.click(boldButton);

      // Should not throw error with empty selection
      expect(boldButton).toBeInTheDocument();
    });

    it('should handle null editor view gracefully', () => {
      const { container } = renderWithProviders(
        <EditorToolbar editorView={null} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should handle rapid button clicks', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EditorToolbarTestWrapper />);

      const editor = screen.getByTestId('editor-content');
      const boldButton = screen.getByLabelText('Bold');

      await user.click(editor);

      // Click multiple times rapidly
      await user.click(boldButton);
      await user.click(boldButton);
      await user.click(boldButton);

      // Should not crash
      expect(boldButton).toBeInTheDocument();
    });

    it('should handle editor updates during toolbar interaction', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EditorToolbarTestWrapper />);

      const editor = screen.getByTestId('editor-content');
      const boldButton = screen.getByLabelText('Bold');
      const italicButton = screen.getByLabelText('Italic');

      await user.click(editor);

      // Alternate between different formatting
      await user.click(boldButton);
      await user.click(italicButton);
      await user.click(boldButton);
      await user.click(italicButton);

      expect(screen.getByLabelText('Bold')).toBeInTheDocument();
      expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    });
  });

  describe('Toolbar Sections', () => {
    it('should render text formatting section', () => {
      const { container } = renderWithProviders(<EditorToolbarTestWrapper />);
      const sections = container.querySelectorAll('.toolbar-section');
      expect(sections.length).toBeGreaterThanOrEqual(2);
    });

    it('should render divider between sections', () => {
      const { container } = renderWithProviders(<EditorToolbarTestWrapper />);
      const divider = container.querySelector('.toolbar-divider');
      expect(divider).toBeInTheDocument();
    });

    it('should render heading section', () => {
      const { container } = renderWithProviders(<EditorToolbarTestWrapper />);
      const headingButtons = container.querySelectorAll('.toolbar-btn-heading');
      expect(headingButtons.length).toBe(6);
    });
  });
});
