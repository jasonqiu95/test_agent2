import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UnsavedChangesWarning } from '../UnsavedChangesWarning'

describe('UnsavedChangesWarning', () => {
  const mockOnSave = jest.fn()
  const mockOnDiscard = jest.fn()

  beforeEach(() => {
    mockOnSave.mockClear()
    mockOnDiscard.mockClear()
  })

  describe('Rendering', () => {
    it('renders warning banner when hasUnsavedChanges is true', () => {
      render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument()
    })

    it('does not render when hasUnsavedChanges is false', () => {
      const { container } = render(
        <UnsavedChangesWarning
          hasUnsavedChanges={false}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      expect(container.firstChild).toBeNull()
      expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument()
    })

    it('renders Save and Discard buttons when unsaved changes present', () => {
      render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument()
    })

    it('renders warning icon', () => {
      const { container } = render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('width', '20')
      expect(svg).toHaveAttribute('height', '20')
    })

    it('applies correct styling for warning banner', () => {
      const { container } = render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      const banner = container.firstChild as HTMLElement
      expect(banner).toHaveStyle({
        position: 'fixed',
        top: '0',
        backgroundColor: '#fff3cd',
        zIndex: '1000',
      })
    })
  })

  describe('User Interactions', () => {
    it('calls onSave when Save button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalledTimes(1)
      expect(mockOnDiscard).not.toHaveBeenCalled()
    })

    it('calls onDiscard when Discard button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      const discardButton = screen.getByRole('button', { name: /discard/i })
      await user.click(discardButton)

      expect(mockOnDiscard).toHaveBeenCalledTimes(1)
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('allows Save button to be clicked multiple times', async () => {
      const user = userEvent.setup()
      render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      await user.click(saveButton)
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalledTimes(3)
    })

    it('allows Discard button to be clicked multiple times', async () => {
      const user = userEvent.setup()
      render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      const discardButton = screen.getByRole('button', { name: /discard/i })
      await user.click(discardButton)
      await user.click(discardButton)

      expect(mockOnDiscard).toHaveBeenCalledTimes(2)
    })
  })

  describe('Accessibility', () => {
    it('Save button is keyboard accessible', async () => {
      const user = userEvent.setup()
      render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      const saveButton = screen.getByRole('button', { name: /save/i })
      saveButton.focus()
      expect(saveButton).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(mockOnSave).toHaveBeenCalledTimes(1)
    })

    it('Discard button is keyboard accessible', async () => {
      const user = userEvent.setup()
      render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      const discardButton = screen.getByRole('button', { name: /discard/i })
      discardButton.focus()
      expect(discardButton).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(mockOnDiscard).toHaveBeenCalledTimes(1)
    })

    it('buttons can be navigated via Tab key', async () => {
      const user = userEvent.setup()
      render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      const saveButton = screen.getByRole('button', { name: /save/i })
      const discardButton = screen.getByRole('button', { name: /discard/i })

      await user.tab()
      expect(saveButton).toHaveFocus()

      await user.tab()
      expect(discardButton).toHaveFocus()
    })

    it('has meaningful button text for screen readers', () => {
      render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      const saveButton = screen.getByRole('button', { name: /save/i })
      const discardButton = screen.getByRole('button', { name: /discard/i })

      expect(saveButton).toHaveAccessibleName('Save')
      expect(discardButton).toHaveAccessibleName('Discard')
    })

    it('warning message has appropriate color contrast', () => {
      const { container } = render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      const warningText = screen.getByText('You have unsaved changes')
      const textElement = warningText as HTMLElement
      expect(textElement).toHaveStyle({ color: '#856404' })
    })

    it('banner has high z-index for visibility', () => {
      const { container } = render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      const banner = container.firstChild as HTMLElement
      expect(banner).toHaveStyle({ zIndex: '1000' })
    })
  })

  describe('Component State Changes', () => {
    it('unmounts cleanly when hasUnsavedChanges changes to false', () => {
      const { rerender, container } = render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument()

      rerender(
        <UnsavedChangesWarning
          hasUnsavedChanges={false}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      expect(container.firstChild).toBeNull()
      expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument()
    })

    it('mounts when hasUnsavedChanges changes from false to true', () => {
      const { rerender } = render(
        <UnsavedChangesWarning
          hasUnsavedChanges={false}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument()

      rerender(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      )

      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument()
    })
  })

  describe('Callback Props', () => {
    it('accepts and uses different onSave callback', async () => {
      const user = userEvent.setup()
      const alternativeSave = jest.fn()

      render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={alternativeSave}
          onDiscard={mockOnDiscard}
        />
      )

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(alternativeSave).toHaveBeenCalledTimes(1)
    })

    it('accepts and uses different onDiscard callback', async () => {
      const user = userEvent.setup()
      const alternativeDiscard = jest.fn()

      render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={mockOnSave}
          onDiscard={alternativeDiscard}
        />
      )

      const discardButton = screen.getByRole('button', { name: /discard/i })
      await user.click(discardButton)

      expect(alternativeDiscard).toHaveBeenCalledTimes(1)
    })

    it('handles synchronous onSave callback', async () => {
      const user = userEvent.setup()
      let saveCalled = false
      const syncSave = () => {
        saveCalled = true
      }

      render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={syncSave}
          onDiscard={mockOnDiscard}
        />
      )

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(saveCalled).toBe(true)
    })

    it('handles asynchronous onSave callback', async () => {
      const user = userEvent.setup()
      const asyncSave = jest.fn().mockResolvedValue(undefined)

      render(
        <UnsavedChangesWarning
          hasUnsavedChanges={true}
          onSave={asyncSave}
          onDiscard={mockOnDiscard}
        />
      )

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(asyncSave).toHaveBeenCalledTimes(1)
    })
  })
})
