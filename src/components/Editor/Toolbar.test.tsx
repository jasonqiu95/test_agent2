/**
 * Text Formatting Toolbar Tests
 * Comprehensive tests for text selection behavior and toolbar state
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { Toolbar, getFormatState, toggleFormat } from './Toolbar';
import {
  createTestEditor,
  setSelection,
  applyMark,
  removeMark,
  insertText,
  destroyEditor,
  nodeFromHTML,
  createTestSchema,
  getMarksAt,
} from '../../__tests__/utils/prosemirrorTestUtils';

describe('Toolbar', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(<Toolbar editorView={null} />);
      expect(screen.getByTestId('formatting-toolbar')).toBeInTheDocument();
    });

    it('renders all formatting buttons', () => {
      render(<Toolbar editorView={null} />);

      expect(screen.getByTestId('btn-bold')).toBeInTheDocument();
      expect(screen.getByTestId('btn-italic')).toBeInTheDocument();
      expect(screen.getByTestId('btn-code')).toBeInTheDocument();
    });

    it('disables buttons when no editor view is provided', () => {
      render(<Toolbar editorView={null} />);

      expect(screen.getByTestId('btn-bold')).toBeDisabled();
      expect(screen.getByTestId('btn-italic')).toBeDisabled();
      expect(screen.getByTestId('btn-code')).toBeDisabled();
    });

    it('shows cursor status initially', () => {
      render(<Toolbar editorView={null} />);
      expect(screen.getByTestId('toolbar-status')).toHaveTextContent('Cursor');
    });
  });

  describe('1. Toolbar shows active formats for current selection', () => {
    it('shows no active formats for plain text selection', () => {
      const { view } = createTestEditor('<p>Plain text here</p>', container);
      const { rerender } = render(<Toolbar editorView={view} />);

      // Select "Plain"
      setSelection(view, 1, 6);
      rerender(<Toolbar editorView={view} />);

      expect(screen.getByTestId('btn-bold')).not.toHaveClass('active');
      expect(screen.getByTestId('btn-italic')).not.toHaveClass('active');
      expect(screen.getByTestId('btn-code')).not.toHaveClass('active');

      destroyEditor(view);
    });

    it('shows bold as active when bold text is selected', () => {
      const { view } = createTestEditor('<p><strong>Bold text</strong></p>', container);
      const { rerender } = render(<Toolbar editorView={view} />);

      // Select "Bold text"
      setSelection(view, 1, 10);
      rerender(<Toolbar editorView={view} />);

      expect(screen.getByTestId('btn-bold')).toHaveClass('active');
      expect(screen.getByTestId('btn-italic')).not.toHaveClass('active');
      expect(screen.getByTestId('btn-code')).not.toHaveClass('active');

      destroyEditor(view);
    });

    it('shows italic as active when italic text is selected', () => {
      const { view } = createTestEditor('<p><em>Italic text</em></p>', container);
      const { rerender } = render(<Toolbar editorView={view} />);

      // Select "Italic text"
      setSelection(view, 1, 12);
      rerender(<Toolbar editorView={view} />);

      expect(screen.getByTestId('btn-bold')).not.toHaveClass('active');
      expect(screen.getByTestId('btn-italic')).toHaveClass('active');
      expect(screen.getByTestId('btn-code')).not.toHaveClass('active');

      destroyEditor(view);
    });

    it('shows code as active when code text is selected', () => {
      const { view } = createTestEditor('<p><code>Code text</code></p>', container);
      const { rerender } = render(<Toolbar editorView={view} />);

      // Select "Code text"
      setSelection(view, 1, 10);
      rerender(<Toolbar editorView={view} />);

      expect(screen.getByTestId('btn-bold')).not.toHaveClass('active');
      expect(screen.getByTestId('btn-italic')).not.toHaveClass('active');
      expect(screen.getByTestId('btn-code')).toHaveClass('active');

      destroyEditor(view);
    });
  });

  describe('2. Selecting formatted text updates toolbar buttons', () => {
    it('updates toolbar state when selection changes from plain to bold', () => {
      const { view } = createTestEditor(
        '<p>Plain text <strong>Bold text</strong></p>',
        container
      );
      const { rerender } = render(<Toolbar editorView={view} />);

      // Initially select plain text
      setSelection(view, 1, 6);
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('btn-bold')).not.toHaveClass('active');

      // Change selection to bold text
      setSelection(view, 12, 21);
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('btn-bold')).toHaveClass('active');

      destroyEditor(view);
    });

    it('updates toolbar state when selection changes from italic to plain', () => {
      const { view } = createTestEditor(
        '<p><em>Italic text</em> Plain text</p>',
        container
      );
      const { rerender } = render(<Toolbar editorView={view} />);

      // Initially select italic text
      setSelection(view, 1, 12);
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('btn-italic')).toHaveClass('active');

      // Change selection to plain text
      setSelection(view, 13, 23);
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('btn-italic')).not.toHaveClass('active');

      destroyEditor(view);
    });

    it('updates immediately when selection changes', () => {
      const { view } = createTestEditor(
        '<p>Plain <strong>Bold</strong> <em>Italic</em></p>',
        container
      );
      const { rerender } = render(<Toolbar editorView={view} />);

      // Plain text
      setSelection(view, 1, 6);
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('btn-bold')).not.toHaveClass('active');
      expect(screen.getByTestId('btn-italic')).not.toHaveClass('active');

      // Bold text
      setSelection(view, 7, 11);
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('btn-bold')).toHaveClass('active');
      expect(screen.getByTestId('btn-italic')).not.toHaveClass('active');

      // Italic text
      setSelection(view, 12, 18);
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('btn-bold')).not.toHaveClass('active');
      expect(screen.getByTestId('btn-italic')).toHaveClass('active');

      destroyEditor(view);
    });
  });

  describe('3. Multi-format detection (bold+italic shows both active)', () => {
    it('shows both bold and italic active when text has both formats', () => {
      const { view } = createTestEditor(
        '<p><strong><em>Bold and Italic</em></strong></p>',
        container
      );
      const { rerender } = render(<Toolbar editorView={view} />);

      // Select text with both formats
      setSelection(view, 1, 16);
      rerender(<Toolbar editorView={view} />);

      expect(screen.getByTestId('btn-bold')).toHaveClass('active');
      expect(screen.getByTestId('btn-italic')).toHaveClass('active');
      expect(screen.getByTestId('btn-code')).not.toHaveClass('active');

      destroyEditor(view);
    });

    it('shows bold and code active when text has both formats', () => {
      const { view } = createTestEditor(
        '<p><strong><code>Bold code</code></strong></p>',
        container
      );
      const { rerender } = render(<Toolbar editorView={view} />);

      // Select text with both formats
      setSelection(view, 1, 10);
      rerender(<Toolbar editorView={view} />);

      expect(screen.getByTestId('btn-bold')).toHaveClass('active');
      expect(screen.getByTestId('btn-code')).toHaveClass('active');
      expect(screen.getByTestId('btn-italic')).not.toHaveClass('active');

      destroyEditor(view);
    });

    it('shows all three formats active when text has all formats', () => {
      const schema = createTestSchema();
      const doc = schema.node('doc', null, [
        schema.node('paragraph', null, [
          schema.text('All formats', [
            schema.marks.strong.create(),
            schema.marks.em.create(),
            schema.marks.code.create(),
          ]),
        ]),
      ]);

      const state = EditorState.create({ doc, schema });
      const view = new EditorView(container, { state });
      const { rerender } = render(<Toolbar editorView={view} />);

      // Select text with all formats
      setSelection(view, 1, 12);
      rerender(<Toolbar editorView={view} />);

      expect(screen.getByTestId('btn-bold')).toHaveClass('active');
      expect(screen.getByTestId('btn-italic')).toHaveClass('active');
      expect(screen.getByTestId('btn-code')).toHaveClass('active');

      destroyEditor(view);
    });
  });

  describe('4. Selection across multiple blocks', () => {
    it('shows formats active when selection spans multiple paragraphs with same format', () => {
      const { view } = createTestEditor(
        '<p><strong>Bold paragraph one</strong></p><p><strong>Bold paragraph two</strong></p>',
        container
      );
      const { rerender } = render(<Toolbar editorView={view} />);

      // Select across both paragraphs
      setSelection(view, 1, 39);
      rerender(<Toolbar editorView={view} />);

      expect(screen.getByTestId('btn-bold')).toHaveClass('active');

      destroyEditor(view);
    });

    it('shows format inactive when selection spans mixed formatted blocks', () => {
      const { view } = createTestEditor(
        '<p><strong>Bold text</strong></p><p>Plain text</p>',
        container
      );
      const { rerender } = render(<Toolbar editorView={view} />);

      // Select across both paragraphs
      setSelection(view, 1, 31);
      rerender(<Toolbar editorView={view} />);

      // Bold should be inactive because not all text is bold
      expect(screen.getByTestId('btn-bold')).not.toHaveClass('active');

      destroyEditor(view);
    });

    it('shows multiple formats active when selection spans blocks with multiple formats', () => {
      const { view } = createTestEditor(
        '<p><strong><em>Bold italic one</em></strong></p><p><strong><em>Bold italic two</em></strong></p>',
        container
      );
      const { rerender } = render(<Toolbar editorView={view} />);

      // Select across both paragraphs
      setSelection(view, 1, 48);
      rerender(<Toolbar editorView={view} />);

      expect(screen.getByTestId('btn-bold')).toHaveClass('active');
      expect(screen.getByTestId('btn-italic')).toHaveClass('active');

      destroyEditor(view);
    });
  });

  describe('5. Collapsed selection (cursor) behavior', () => {
    it('shows cursor status when selection is collapsed', () => {
      const { view } = createTestEditor('<p>Plain text</p>', container);
      const { rerender } = render(<Toolbar editorView={view} />);

      // Collapsed selection (cursor at position)
      setSelection(view, 5);
      rerender(<Toolbar editorView={view} />);

      expect(screen.getByTestId('toolbar-status')).toHaveTextContent('Cursor');

      destroyEditor(view);
    });

    it('shows selection status when range is selected', () => {
      const { view } = createTestEditor('<p>Plain text</p>', container);
      const { rerender } = render(<Toolbar editorView={view} />);

      // Range selection
      setSelection(view, 1, 6);
      rerender(<Toolbar editorView={view} />);

      expect(screen.getByTestId('toolbar-status')).toHaveTextContent('Selection');

      destroyEditor(view);
    });

    it('shows format state at cursor position inside formatted text', () => {
      const { view } = createTestEditor('<p><strong>Bold text</strong></p>', container);
      const { rerender } = render(<Toolbar editorView={view} />);

      // Cursor inside bold text
      setSelection(view, 5);
      rerender(<Toolbar editorView={view} />);

      expect(screen.getByTestId('btn-bold')).toHaveClass('active');
      expect(screen.getByTestId('toolbar-status')).toHaveTextContent('Cursor');

      destroyEditor(view);
    });

    it('shows no format state at cursor position in plain text', () => {
      const { view } = createTestEditor('<p>Plain text</p>', container);
      const { rerender } = render(<Toolbar editorView={view} />);

      // Cursor in plain text
      setSelection(view, 5);
      rerender(<Toolbar editorView={view} />);

      expect(screen.getByTestId('btn-bold')).not.toHaveClass('active');
      expect(screen.getByTestId('btn-italic')).not.toHaveClass('active');
      expect(screen.getByTestId('toolbar-status')).toHaveTextContent('Cursor');

      destroyEditor(view);
    });
  });

  describe('6. Toolbar actions apply to current selection', () => {
    it('applies bold to selected text when bold button is clicked', () => {
      const { view } = createTestEditor('<p>Plain text</p>', container);
      render(<Toolbar editorView={view} />);

      // Select text
      setSelection(view, 1, 6);

      // Click bold button
      fireEvent.click(screen.getByTestId('btn-bold'));

      // Verify bold was applied
      const formatState = getFormatState(view.state);
      expect(formatState.bold).toBe(true);

      destroyEditor(view);
    });

    it('applies italic to selected text when italic button is clicked', () => {
      const { view } = createTestEditor('<p>Plain text</p>', container);
      render(<Toolbar editorView={view} />);

      // Select text
      setSelection(view, 1, 6);

      // Click italic button
      fireEvent.click(screen.getByTestId('btn-italic'));

      // Verify italic was applied
      const formatState = getFormatState(view.state);
      expect(formatState.italic).toBe(true);

      destroyEditor(view);
    });

    it('removes bold from selected bold text when bold button is clicked', () => {
      const { view } = createTestEditor('<p><strong>Bold text</strong></p>', container);
      render(<Toolbar editorView={view} />);

      // Select bold text
      setSelection(view, 1, 10);

      // Click bold button to remove bold
      fireEvent.click(screen.getByTestId('btn-bold'));

      // Verify bold was removed
      const formatState = getFormatState(view.state);
      expect(formatState.bold).toBe(false);

      destroyEditor(view);
    });

    it('applies format to entire selection range', () => {
      const { view } = createTestEditor('<p>This is a longer text selection</p>', container);
      render(<Toolbar editorView={view} />);

      // Select multiple words
      setSelection(view, 6, 20);

      // Apply bold
      fireEvent.click(screen.getByTestId('btn-bold'));

      // Verify bold was applied to entire selection
      const { state } = view;
      const strongMark = state.schema.marks.strong;
      expect(state.doc.rangeHasMark(6, 20, strongMark)).toBe(true);

      destroyEditor(view);
    });

    it('calls onFormat callback when format button is clicked', () => {
      const { view } = createTestEditor('<p>Plain text</p>', container);
      const onFormat = jest.fn();
      render(<Toolbar editorView={view} onFormat={onFormat} />);

      // Select text
      setSelection(view, 1, 6);

      // Click bold button
      fireEvent.click(screen.getByTestId('btn-bold'));

      expect(onFormat).toHaveBeenCalledWith('strong');

      destroyEditor(view);
    });
  });

  describe('7. Format state updates immediately', () => {
    it('updates button state immediately after applying format', () => {
      const { view } = createTestEditor('<p>Plain text</p>', container);
      const { rerender } = render(<Toolbar editorView={view} />);

      // Select text
      setSelection(view, 1, 6);
      rerender(<Toolbar editorView={view} />);

      // Initially not bold
      expect(screen.getByTestId('btn-bold')).not.toHaveClass('active');

      // Apply bold
      fireEvent.click(screen.getByTestId('btn-bold'));
      rerender(<Toolbar editorView={view} />);

      // Immediately shows as bold
      expect(screen.getByTestId('btn-bold')).toHaveClass('active');

      destroyEditor(view);
    });

    it('updates button state immediately after removing format', () => {
      const { view } = createTestEditor('<p><strong>Bold text</strong></p>', container);
      const { rerender } = render(<Toolbar editorView={view} />);

      // Select bold text
      setSelection(view, 1, 10);
      rerender(<Toolbar editorView={view} />);

      // Initially bold
      expect(screen.getByTestId('btn-bold')).toHaveClass('active');

      // Remove bold
      fireEvent.click(screen.getByTestId('btn-bold'));
      rerender(<Toolbar editorView={view} />);

      // Immediately shows as not bold
      expect(screen.getByTestId('btn-bold')).not.toHaveClass('active');

      destroyEditor(view);
    });

    it('updates multiple format states simultaneously', () => {
      const { view } = createTestEditor('<p>Plain text</p>', container);
      const { rerender } = render(<Toolbar editorView={view} />);

      // Select text
      setSelection(view, 1, 6);
      rerender(<Toolbar editorView={view} />);

      // Apply bold
      fireEvent.click(screen.getByTestId('btn-bold'));
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('btn-bold')).toHaveClass('active');

      // Apply italic (selection should still have bold)
      fireEvent.click(screen.getByTestId('btn-italic'));
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('btn-bold')).toHaveClass('active');
      expect(screen.getByTestId('btn-italic')).toHaveClass('active');

      destroyEditor(view);
    });
  });

  describe('8. Keyboard navigation updates toolbar', () => {
    it('updates toolbar when cursor moves with arrow keys', () => {
      const { view } = createTestEditor(
        '<p>Plain <strong>Bold</strong> Plain</p>',
        container
      );
      const { rerender } = render(<Toolbar editorView={view} />);

      // Start in plain text
      setSelection(view, 2);
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('btn-bold')).not.toHaveClass('active');

      // Move into bold text
      setSelection(view, 8);
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('btn-bold')).toHaveClass('active');

      // Move back to plain text
      setSelection(view, 13);
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('btn-bold')).not.toHaveClass('active');

      destroyEditor(view);
    });

    it('updates toolbar when selection extends with Shift+Arrow', () => {
      const { view } = createTestEditor('<p>Plain <strong>Bold</strong></p>', container);
      const { rerender } = render(<Toolbar editorView={view} />);

      // Start in plain text
      setSelection(view, 2);
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('toolbar-status')).toHaveTextContent('Cursor');

      // Extend selection into bold text
      setSelection(view, 2, 10);
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('toolbar-status')).toHaveTextContent('Selection');

      destroyEditor(view);
    });

    it('updates toolbar when cursor moves between different format regions', () => {
      const { view } = createTestEditor(
        '<p><strong>Bold</strong> <em>Italic</em> <code>Code</code></p>',
        container
      );
      const { rerender } = render(<Toolbar editorView={view} />);

      // In bold
      setSelection(view, 2);
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('btn-bold')).toHaveClass('active');
      expect(screen.getByTestId('btn-italic')).not.toHaveClass('active');
      expect(screen.getByTestId('btn-code')).not.toHaveClass('active');

      // In italic
      setSelection(view, 8);
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('btn-bold')).not.toHaveClass('active');
      expect(screen.getByTestId('btn-italic')).toHaveClass('active');
      expect(screen.getByTestId('btn-code')).not.toHaveClass('active');

      // In code
      setSelection(view, 16);
      rerender(<Toolbar editorView={view} />);
      expect(screen.getByTestId('btn-bold')).not.toHaveClass('active');
      expect(screen.getByTestId('btn-italic')).not.toHaveClass('active');
      expect(screen.getByTestId('btn-code')).toHaveClass('active');

      destroyEditor(view);
    });

    it('handles Ctrl+A (select all) and updates toolbar accordingly', () => {
      const { view } = createTestEditor(
        '<p><strong>All bold text here</strong></p>',
        container
      );
      const { rerender } = render(<Toolbar editorView={view} />);

      // Select all text
      const { state } = view;
      const tr = state.tr.setSelection(
        state.selection.constructor.create(state.doc, 0, state.doc.content.size)
      );
      view.dispatch(tr);
      rerender(<Toolbar editorView={view} />);

      expect(screen.getByTestId('btn-bold')).toHaveClass('active');
      expect(screen.getByTestId('toolbar-status')).toHaveTextContent('Selection');

      destroyEditor(view);
    });
  });

  describe('getFormatState utility function', () => {
    it('correctly detects bold format', () => {
      const { view, state } = createTestEditor('<p><strong>Bold</strong></p>', container);
      setSelection(view, 1, 5);

      const formatState = getFormatState(view.state);
      expect(formatState.bold).toBe(true);
      expect(formatState.italic).toBe(false);
      expect(formatState.code).toBe(false);

      destroyEditor(view);
    });

    it('correctly detects italic format', () => {
      const { view } = createTestEditor('<p><em>Italic</em></p>', container);
      setSelection(view, 1, 7);

      const formatState = getFormatState(view.state);
      expect(formatState.bold).toBe(false);
      expect(formatState.italic).toBe(true);
      expect(formatState.code).toBe(false);

      destroyEditor(view);
    });

    it('correctly detects multiple formats', () => {
      const { view } = createTestEditor('<p><strong><em>Both</em></strong></p>', container);
      setSelection(view, 1, 5);

      const formatState = getFormatState(view.state);
      expect(formatState.bold).toBe(true);
      expect(formatState.italic).toBe(true);
      expect(formatState.code).toBe(false);

      destroyEditor(view);
    });

    it('correctly detects collapsed selection', () => {
      const { view } = createTestEditor('<p>Text</p>', container);
      setSelection(view, 2);

      const formatState = getFormatState(view.state);
      expect(formatState.hasSelection).toBe(false);

      destroyEditor(view);
    });

    it('correctly detects non-collapsed selection', () => {
      const { view } = createTestEditor('<p>Text</p>', container);
      setSelection(view, 1, 5);

      const formatState = getFormatState(view.state);
      expect(formatState.hasSelection).toBe(true);

      destroyEditor(view);
    });
  });

  describe('toggleFormat utility function', () => {
    it('adds format when not present', () => {
      const { view } = createTestEditor('<p>Plain</p>', container);
      setSelection(view, 1, 6);

      toggleFormat(view, 'strong');

      const formatState = getFormatState(view.state);
      expect(formatState.bold).toBe(true);

      destroyEditor(view);
    });

    it('removes format when present', () => {
      const { view } = createTestEditor('<p><strong>Bold</strong></p>', container);
      setSelection(view, 1, 5);

      toggleFormat(view, 'strong');

      const formatState = getFormatState(view.state);
      expect(formatState.bold).toBe(false);

      destroyEditor(view);
    });

    it('handles invalid mark type gracefully', () => {
      const { view } = createTestEditor('<p>Text</p>', container);
      setSelection(view, 1, 5);

      // Should not throw
      expect(() => {
        toggleFormat(view, 'nonexistent');
      }).not.toThrow();

      destroyEditor(view);
    });
  });

  describe('ARIA and Accessibility', () => {
    it('sets aria-pressed attribute correctly for active buttons', () => {
      const { view } = createTestEditor('<p><strong>Bold</strong></p>', container);
      const { rerender } = render(<Toolbar editorView={view} />);

      setSelection(view, 1, 5);
      rerender(<Toolbar editorView={view} />);

      expect(screen.getByTestId('btn-bold')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('btn-italic')).toHaveAttribute('aria-pressed', 'false');

      destroyEditor(view);
    });

    it('includes descriptive title attributes on buttons', () => {
      render(<Toolbar editorView={null} />);

      expect(screen.getByTestId('btn-bold')).toHaveAttribute('title', 'Bold (Ctrl+B)');
      expect(screen.getByTestId('btn-italic')).toHaveAttribute('title', 'Italic (Ctrl+I)');
      expect(screen.getByTestId('btn-code')).toHaveAttribute('title', 'Code');
    });
  });
});
