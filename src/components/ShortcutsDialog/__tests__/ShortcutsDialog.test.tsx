import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShortcutsDialog, ShortcutCategory } from '../ShortcutsDialog';
import { KeyboardShortcut } from '../../../hooks/useKeyboardShortcuts';

// Mock shortcuts data for testing
const mockShortcuts: KeyboardShortcut[] = [
  {
    key: 's',
    ctrl: true,
    description: 'Save document',
    action: jest.fn(),
  },
  {
    key: 'z',
    ctrl: true,
    description: 'Undo',
    action: jest.fn(),
  },
  {
    key: 'y',
    ctrl: true,
    description: 'Redo',
    action: jest.fn(),
  },
  {
    key: 'b',
    ctrl: true,
    description: 'Bold text',
    action: jest.fn(),
  },
];

const mockCategories: ShortcutCategory[] = [
  {
    name: 'Editing',
    shortcuts: [
      {
        key: 'z',
        ctrl: true,
        description: 'Undo',
        action: jest.fn(),
      },
      {
        key: 'y',
        ctrl: true,
        description: 'Redo',
        action: jest.fn(),
      },
    ],
  },
  {
    name: 'Formatting',
    shortcuts: [
      {
        key: 'b',
        ctrl: true,
        description: 'Bold text',
        action: jest.fn(),
      },
      {
        key: 'i',
        ctrl: true,
        description: 'Italic text',
        action: jest.fn(),
      },
    ],
  },
  {
    name: 'Navigation',
    shortcuts: [
      {
        key: 'ArrowUp',
        shift: true,
        description: 'Move up',
        action: jest.fn(),
      },
      {
        key: 'ArrowDown',
        shift: true,
        description: 'Move down',
        action: jest.fn(),
      },
    ],
  },
];

describe('ShortcutsDialog', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dialog visibility', () => {
    it('renders when isOpen is true', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <ShortcutsDialog
          isOpen={false}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders with custom title', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
          title="Custom Shortcuts"
        />
      );

      expect(screen.getByText('Custom Shortcuts')).toBeInTheDocument();
    });
  });

  describe('Dialog close functionality', () => {
    it('closes when close button is clicked', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('closes when backdrop is clicked', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when dialog content is clicked', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      const dialogContent = screen.getByText('Keyboard Shortcuts');
      fireEvent.click(dialogContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('closes when ESC key is pressed', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when other keys are pressed', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Enter', code: 'Enter' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard shortcut list rendering', () => {
    it('renders all shortcuts from shortcuts prop', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      expect(screen.getByText('Save document')).toBeInTheDocument();
      expect(screen.getByText('Undo')).toBeInTheDocument();
      expect(screen.getByText('Redo')).toBeInTheDocument();
      expect(screen.getByText('Bold text')).toBeInTheDocument();
    });

    it('renders shortcuts in a table format', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Check for table headers
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Shortcut')).toBeInTheDocument();
    });

    it('renders shortcuts with formatted keys', () => {
      const { container } = render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      const kbdElements = container.querySelectorAll('kbd');
      expect(kbdElements.length).toBeGreaterThan(0);
    });

    it('handles empty shortcuts array', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={[]}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.queryByRole('table')).toBeInTheDocument();
    });

    it('handles undefined shortcuts prop', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Categorization of shortcuts', () => {
    it('renders categories with titles', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      );

      expect(screen.getByText('Editing')).toBeInTheDocument();
      expect(screen.getByText('Formatting')).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
    });

    it('renders all shortcuts within categories', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      );

      // Editing category shortcuts
      expect(screen.getByText('Undo')).toBeInTheDocument();
      expect(screen.getByText('Redo')).toBeInTheDocument();

      // Formatting category shortcuts
      expect(screen.getByText('Bold text')).toBeInTheDocument();
      expect(screen.getByText('Italic text')).toBeInTheDocument();

      // Navigation category shortcuts
      expect(screen.getByText('Move up')).toBeInTheDocument();
      expect(screen.getByText('Move down')).toBeInTheDocument();
    });

    it('renders categories in separate sections', () => {
      const { container } = render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      );

      const categoryElements = container.querySelectorAll('.shortcuts-category');
      expect(categoryElements.length).toBe(3);
    });

    it('prioritizes categories over shortcuts prop', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
          categories={mockCategories}
        />
      );

      // Should render categories
      expect(screen.getByText('Editing')).toBeInTheDocument();

      // Should NOT render shortcuts that are not in categories
      expect(screen.queryByText('Save document')).not.toBeInTheDocument();
    });

    it('handles empty categories array', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={[]}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('role', 'dialog');
    });

    it('has aria-modal attribute', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby attribute pointing to title', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'shortcuts-dialog-title');

      const title = document.getElementById('shortcuts-dialog-title');
      expect(title).toHaveTextContent('Keyboard Shortcuts');
    });

    it('close button has proper aria-label', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('title has proper id for aria-labelledby', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      const title = screen.getByText('Keyboard Shortcuts');
      expect(title).toHaveAttribute('id', 'shortcuts-dialog-title');
    });

    it('close button is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      await user.tab();

      // Button should be focusable
      expect(document.activeElement).toBe(closeButton);
    });
  });

  describe('Special key rendering', () => {
    it('renders arrow keys with proper symbols', () => {
      const arrowShortcuts: KeyboardShortcut[] = [
        {
          key: 'ArrowUp',
          description: 'Move up',
          action: jest.fn(),
        },
        {
          key: 'ArrowDown',
          description: 'Move down',
          action: jest.fn(),
        },
        {
          key: 'ArrowLeft',
          description: 'Move left',
          action: jest.fn(),
        },
        {
          key: 'ArrowRight',
          description: 'Move right',
          action: jest.fn(),
        },
      ];

      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={arrowShortcuts}
        />
      );

      expect(screen.getByText('Move up')).toBeInTheDocument();
      expect(screen.getByText('Move down')).toBeInTheDocument();
      expect(screen.getByText('Move left')).toBeInTheDocument();
      expect(screen.getByText('Move right')).toBeInTheDocument();
    });

    it('renders modifier keys with shortcuts', () => {
      const modifierShortcuts: KeyboardShortcut[] = [
        {
          key: 'a',
          ctrl: true,
          shift: true,
          description: 'Select all with shift',
          action: jest.fn(),
        },
        {
          key: 'x',
          alt: true,
          description: 'Cut with alt',
          action: jest.fn(),
        },
      ];

      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={modifierShortcuts}
        />
      );

      expect(screen.getByText('Select all with shift')).toBeInTheDocument();
      expect(screen.getByText('Cut with alt')).toBeInTheDocument();
    });
  });

  describe('Integration scenarios', () => {
    it('renders dialog with mixed shortcuts and categories', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          categories={mockCategories}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Editing')).toBeInTheDocument();
      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('handles multiple close interactions', () => {
      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={mockShortcuts}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(2);
    });

    it('renders correctly with large number of shortcuts', () => {
      const largeShortcutList: KeyboardShortcut[] = Array.from(
        { length: 50 },
        (_, i) => ({
          key: `key${i}`,
          description: `Action ${i}`,
          action: jest.fn(),
        })
      );

      render(
        <ShortcutsDialog
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={largeShortcutList}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Action 0')).toBeInTheDocument();
      expect(screen.getByText('Action 49')).toBeInTheDocument();
    });
  });
});
