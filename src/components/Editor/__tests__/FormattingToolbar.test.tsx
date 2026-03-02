/**
 * Formatting Toolbar Tests
 * Tests for toolbar button interactions for inline text formatting
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import {
  createTestEditorState,
  createTestEditorView,
  setSelection,
  hasMarkAt,
  destroyEditor,
} from '../../../__tests__/utils/prosemirrorTestUtils';
import { editorSchema } from '../../../editor/schema';
import { MarkType } from '../../../editor/types';

/**
 * Mock FormattingToolbar component for testing
 * This represents the expected interface for a formatting toolbar
 */
interface FormattingToolbarProps {
  editorView: EditorView | null;
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onStrikethrough?: () => void;
  isActive?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
  };
}

const MockFormattingToolbar: React.FC<FormattingToolbarProps> = ({
  onBold,
  onItalic,
  onUnderline,
  onStrikethrough,
  isActive = {},
}) => {
  return (
    <div data-testid="formatting-toolbar">
      <button
        data-testid="bold-button"
        onClick={onBold}
        className={isActive.bold ? 'active' : ''}
        aria-label="Bold"
        aria-pressed={isActive.bold}
      >
        <strong>B</strong>
      </button>
      <button
        data-testid="italic-button"
        onClick={onItalic}
        className={isActive.italic ? 'active' : ''}
        aria-label="Italic"
        aria-pressed={isActive.italic}
      >
        <em>I</em>
      </button>
      <button
        data-testid="underline-button"
        onClick={onUnderline}
        className={isActive.underline ? 'active' : ''}
        aria-label="Underline"
        aria-pressed={isActive.underline}
      >
        <u>U</u>
      </button>
      <button
        data-testid="strikethrough-button"
        onClick={onStrikethrough}
        className={isActive.strikethrough ? 'active' : ''}
        aria-label="Strikethrough"
        aria-pressed={isActive.strikethrough}
      >
        <s>S</s>
      </button>
    </div>
  );
};

describe('FormattingToolbar', () => {
  let view: EditorView;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (view) {
      destroyEditor(view);
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Toolbar button rendering', () => {
    it('should render all formatting buttons', () => {
      render(<MockFormattingToolbar editorView={null} />);

      expect(screen.getByTestId('bold-button')).toBeInTheDocument();
      expect(screen.getByTestId('italic-button')).toBeInTheDocument();
      expect(screen.getByTestId('underline-button')).toBeInTheDocument();
      expect(screen.getByTestId('strikethrough-button')).toBeInTheDocument();
    });

    it('should have correct aria labels', () => {
      render(<MockFormattingToolbar editorView={null} />);

      expect(screen.getByLabelText('Bold')).toBeInTheDocument();
      expect(screen.getByLabelText('Italic')).toBeInTheDocument();
      expect(screen.getByLabelText('Underline')).toBeInTheDocument();
      expect(screen.getByLabelText('Strikethrough')).toBeInTheDocument();
    });

    it('should show button icons correctly', () => {
      render(<MockFormattingToolbar editorView={null} />);

      const boldButton = screen.getByTestId('bold-button');
      expect(boldButton.querySelector('strong')).toBeInTheDocument();

      const italicButton = screen.getByTestId('italic-button');
      expect(italicButton.querySelector('em')).toBeInTheDocument();

      const underlineButton = screen.getByTestId('underline-button');
      expect(underlineButton.querySelector('u')).toBeInTheDocument();

      const strikethroughButton = screen.getByTestId('strikethrough-button');
      expect(strikethroughButton.querySelector('s')).toBeInTheDocument();
    });
  });

  describe('Button click interactions', () => {
    it('should call onBold when bold button is clicked', async () => {
      const handleBold = jest.fn();
      render(<MockFormattingToolbar editorView={null} onBold={handleBold} />);

      const boldButton = screen.getByTestId('bold-button');
      await userEvent.click(boldButton);

      expect(handleBold).toHaveBeenCalledTimes(1);
    });

    it('should call onItalic when italic button is clicked', async () => {
      const handleItalic = jest.fn();
      render(<MockFormattingToolbar editorView={null} onItalic={handleItalic} />);

      const italicButton = screen.getByTestId('italic-button');
      await userEvent.click(italicButton);

      expect(handleItalic).toHaveBeenCalledTimes(1);
    });

    it('should call onUnderline when underline button is clicked', async () => {
      const handleUnderline = jest.fn();
      render(<MockFormattingToolbar editorView={null} onUnderline={handleUnderline} />);

      const underlineButton = screen.getByTestId('underline-button');
      await userEvent.click(underlineButton);

      expect(handleUnderline).toHaveBeenCalledTimes(1);
    });

    it('should call onStrikethrough when strikethrough button is clicked', async () => {
      const handleStrikethrough = jest.fn();
      render(<MockFormattingToolbar editorView={null} onStrikethrough={handleStrikethrough} />);

      const strikethroughButton = screen.getByTestId('strikethrough-button');
      await userEvent.click(strikethroughButton);

      expect(handleStrikethrough).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple button clicks', async () => {
      const handleBold = jest.fn();
      const handleItalic = jest.fn();
      render(
        <MockFormattingToolbar
          editorView={null}
          onBold={handleBold}
          onItalic={handleItalic}
        />
      );

      await userEvent.click(screen.getByTestId('bold-button'));
      await userEvent.click(screen.getByTestId('italic-button'));
      await userEvent.click(screen.getByTestId('bold-button'));

      expect(handleBold).toHaveBeenCalledTimes(2);
      expect(handleItalic).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid button clicks', async () => {
      const handleBold = jest.fn();
      render(<MockFormattingToolbar editorView={null} onBold={handleBold} />);

      const boldButton = screen.getByTestId('bold-button');
      await userEvent.click(boldButton);
      await userEvent.click(boldButton);
      await userEvent.click(boldButton);

      expect(handleBold).toHaveBeenCalledTimes(3);
    });
  });

  describe('Active state indication', () => {
    it('should show bold button as active when bold is applied', () => {
      render(
        <MockFormattingToolbar
          editorView={null}
          isActive={{ bold: true }}
        />
      );

      const boldButton = screen.getByTestId('bold-button');
      expect(boldButton).toHaveClass('active');
      expect(boldButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should show italic button as active when italic is applied', () => {
      render(
        <MockFormattingToolbar
          editorView={null}
          isActive={{ italic: true }}
        />
      );

      const italicButton = screen.getByTestId('italic-button');
      expect(italicButton).toHaveClass('active');
      expect(italicButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should show underline button as active when underline is applied', () => {
      render(
        <MockFormattingToolbar
          editorView={null}
          isActive={{ underline: true }}
        />
      );

      const underlineButton = screen.getByTestId('underline-button');
      expect(underlineButton).toHaveClass('active');
      expect(underlineButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should show multiple buttons as active for combined formatting', () => {
      render(
        <MockFormattingToolbar
          editorView={null}
          isActive={{ bold: true, italic: true, underline: true }}
        />
      );

      expect(screen.getByTestId('bold-button')).toHaveClass('active');
      expect(screen.getByTestId('italic-button')).toHaveClass('active');
      expect(screen.getByTestId('underline-button')).toHaveClass('active');
    });

    it('should not show active class when formatting is not applied', () => {
      render(
        <MockFormattingToolbar
          editorView={null}
          isActive={{ bold: false, italic: false }}
        />
      );

      expect(screen.getByTestId('bold-button')).not.toHaveClass('active');
      expect(screen.getByTestId('italic-button')).not.toHaveClass('active');
    });

    it('should update active state when formatting changes', () => {
      const { rerender } = render(
        <MockFormattingToolbar
          editorView={null}
          isActive={{ bold: false }}
        />
      );

      let boldButton = screen.getByTestId('bold-button');
      expect(boldButton).not.toHaveClass('active');

      // Update to active
      rerender(
        <MockFormattingToolbar
          editorView={null}
          isActive={{ bold: true }}
        />
      );

      boldButton = screen.getByTestId('bold-button');
      expect(boldButton).toHaveClass('active');
    });
  });

  describe('Integration with editor state', () => {
    it('should detect bold format in editor selection', () => {
      const state = createTestEditorState('<p><strong>Hello</strong> world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select bold text
      setSelection(view, 1, 6);

      // Check if bold is active at selection
      const isBoldActive = hasMarkAt(view.state, 3, MarkType.BOLD);
      expect(isBoldActive).toBe(true);
    });

    it('should detect italic format in editor selection', () => {
      const state = createTestEditorState('<p><em>Hello</em> world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select italic text
      setSelection(view, 1, 6);

      // Check if italic is active at selection
      const isItalicActive = hasMarkAt(view.state, 3, MarkType.ITALIC);
      expect(isItalicActive).toBe(true);
    });

    it('should detect multiple formats at selection', () => {
      const state = createTestEditorState(
        '<p><strong><em>Hello</em></strong> world</p>',
        editorSchema
      );
      view = createTestEditorView(state, container);

      // Select formatted text
      setSelection(view, 1, 6);

      // Check both formats are active
      const isBoldActive = hasMarkAt(view.state, 3, MarkType.BOLD);
      const isItalicActive = hasMarkAt(view.state, 3, MarkType.ITALIC);
      expect(isBoldActive).toBe(true);
      expect(isItalicActive).toBe(true);
    });

    it('should detect no format on plain text', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select plain text
      setSelection(view, 1, 6);

      // Check no formats are active
      const isBoldActive = hasMarkAt(view.state, 3, MarkType.BOLD);
      const isItalicActive = hasMarkAt(view.state, 3, MarkType.ITALIC);
      const isUnderlineActive = hasMarkAt(view.state, 3, MarkType.UNDERLINE);

      expect(isBoldActive).toBe(false);
      expect(isItalicActive).toBe(false);
      expect(isUnderlineActive).toBe(false);
    });
  });

  describe('Keyboard accessibility', () => {
    it('should allow keyboard navigation between buttons', async () => {
      render(<MockFormattingToolbar editorView={null} />);

      const boldButton = screen.getByTestId('bold-button');
      const italicButton = screen.getByTestId('italic-button');

      boldButton.focus();
      expect(document.activeElement).toBe(boldButton);

      await userEvent.tab();
      expect(document.activeElement).toBe(italicButton);
    });

    it('should trigger button action with Enter key', async () => {
      const handleBold = jest.fn();
      render(<MockFormattingToolbar editorView={null} onBold={handleBold} />);

      const boldButton = screen.getByTestId('bold-button');
      boldButton.focus();

      await userEvent.keyboard('{Enter}');
      expect(handleBold).toHaveBeenCalledTimes(1);
    });

    it('should trigger button action with Space key', async () => {
      const handleItalic = jest.fn();
      render(<MockFormattingToolbar editorView={null} onItalic={handleItalic} />);

      const italicButton = screen.getByTestId('italic-button');
      italicButton.focus();

      await userEvent.keyboard(' ');
      expect(handleItalic).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mouse interactions', () => {
    it('should respond to mousedown event', () => {
      const handleBold = jest.fn();
      render(<MockFormattingToolbar editorView={null} onBold={handleBold} />);

      const boldButton = screen.getByTestId('bold-button');
      fireEvent.mouseDown(boldButton);
      fireEvent.click(boldButton);

      expect(handleBold).toHaveBeenCalled();
    });

    it('should respond to double click', async () => {
      const handleBold = jest.fn();
      render(<MockFormattingToolbar editorView={null} onBold={handleBold} />);

      const boldButton = screen.getByTestId('bold-button');
      await userEvent.dblClick(boldButton);

      expect(handleBold).toHaveBeenCalledTimes(2);
    });

    it('should handle hover state', () => {
      render(<MockFormattingToolbar editorView={null} />);

      const boldButton = screen.getByTestId('bold-button');
      fireEvent.mouseEnter(boldButton);
      fireEvent.mouseLeave(boldButton);

      // Button should handle hover without errors
      expect(boldButton).toBeInTheDocument();
    });
  });

  describe('Toolbar state management', () => {
    it('should maintain button state across re-renders', () => {
      const { rerender } = render(
        <MockFormattingToolbar
          editorView={null}
          isActive={{ bold: true }}
        />
      );

      expect(screen.getByTestId('bold-button')).toHaveClass('active');

      rerender(
        <MockFormattingToolbar
          editorView={null}
          isActive={{ bold: true }}
        />
      );

      expect(screen.getByTestId('bold-button')).toHaveClass('active');
    });

    it('should handle disabled state if no editor view', () => {
      render(<MockFormattingToolbar editorView={null} />);

      // Buttons should still be rendered even without editor view
      expect(screen.getByTestId('bold-button')).toBeInTheDocument();
      expect(screen.getByTestId('italic-button')).toBeInTheDocument();
    });
  });

  describe('Button grouping and layout', () => {
    it('should render toolbar container', () => {
      render(<MockFormattingToolbar editorView={null} />);

      const toolbar = screen.getByTestId('formatting-toolbar');
      expect(toolbar).toBeInTheDocument();
    });

    it('should contain all buttons in toolbar', () => {
      render(<MockFormattingToolbar editorView={null} />);

      const toolbar = screen.getByTestId('formatting-toolbar');
      const buttons = toolbar.querySelectorAll('button');
      expect(buttons.length).toBe(4);
    });
  });

  describe('Edge cases', () => {
    it('should handle missing callback props gracefully', async () => {
      render(<MockFormattingToolbar editorView={null} />);

      const boldButton = screen.getByTestId('bold-button');

      // Should not throw error when clicking without handler
      expect(async () => {
        await userEvent.click(boldButton);
      }).not.toThrow();
    });

    it('should handle all isActive flags as undefined', () => {
      render(<MockFormattingToolbar editorView={null} />);

      expect(screen.getByTestId('bold-button')).not.toHaveClass('active');
      expect(screen.getByTestId('italic-button')).not.toHaveClass('active');
      expect(screen.getByTestId('underline-button')).not.toHaveClass('active');
    });

    it('should handle partial isActive state', () => {
      render(
        <MockFormattingToolbar
          editorView={null}
          isActive={{ bold: true }}
        />
      );

      expect(screen.getByTestId('bold-button')).toHaveClass('active');
      expect(screen.getByTestId('italic-button')).not.toHaveClass('active');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <MockFormattingToolbar
          editorView={null}
          isActive={{ bold: true, italic: false }}
        />
      );

      const boldButton = screen.getByTestId('bold-button');
      const italicButton = screen.getByTestId('italic-button');

      expect(boldButton).toHaveAttribute('aria-pressed', 'true');
      expect(italicButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should be navigable with screen readers', () => {
      render(<MockFormattingToolbar editorView={null} />);

      const buttons = [
        screen.getByLabelText('Bold'),
        screen.getByLabelText('Italic'),
        screen.getByLabelText('Underline'),
        screen.getByLabelText('Strikethrough'),
      ];

      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('aria-pressed');
      });
    });
  });
});
