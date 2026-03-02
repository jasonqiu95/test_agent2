import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SearchDialog, SearchDialogProps } from './SearchDialog';

describe('SearchDialog', () => {
  const defaultProps: SearchDialogProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSearch: jest.fn(),
    onReplace: jest.fn(),
    onReplaceAll: jest.fn(),
    onNext: jest.fn(),
    onPrevious: jest.fn(),
    currentMatch: 1,
    totalMatches: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(<SearchDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Find and Replace')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<SearchDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should display match counter correctly', () => {
    render(<SearchDialog {...defaultProps} currentMatch={3} totalMatches={10} />);
    expect(screen.getByText('3 of 10')).toBeInTheDocument();
  });

  it('should display "No matches" when no matches found', () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} currentMatch={0} totalMatches={0} />);

    const searchInput = screen.getByLabelText('Search query');
    user.type(searchInput, 'test');

    waitFor(() => {
      expect(screen.getByText('No matches')).toBeInTheDocument();
    });
  });

  it('should focus search input when dialog opens', () => {
    const { rerender } = render(<SearchDialog {...defaultProps} isOpen={false} />);

    rerender(<SearchDialog {...defaultProps} isOpen={true} />);

    const searchInput = screen.getByLabelText('Search query');
    expect(searchInput).toHaveFocus();
  });

  it('should call onClose when close button is clicked', () => {
    render(<SearchDialog {...defaultProps} />);

    const closeButton = screen.getByLabelText('Close dialog');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', () => {
    render(<SearchDialog {...defaultProps} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    render(<SearchDialog {...defaultProps} />);

    const backdrop = document.querySelector('.search-dialog-backdrop');
    fireEvent.click(backdrop!);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should update search query on input', async () => {
    render(<SearchDialog {...defaultProps} />);

    const searchInput = screen.getByLabelText('Search query') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    expect(searchInput).toHaveValue('test query');
  });

  it('should update replace value on input', async () => {
    render(<SearchDialog {...defaultProps} />);

    const replaceInput = screen.getByLabelText('Replace value') as HTMLInputElement;
    fireEvent.change(replaceInput, { target: { value: 'replacement' } });

    expect(replaceInput).toHaveValue('replacement');
  });

  it('should toggle case sensitive option', () => {
    render(<SearchDialog {...defaultProps} />);

    const caseSensitiveBtn = screen.getByTestId('btn-case-sensitive');
    expect(caseSensitiveBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(caseSensitiveBtn);
    expect(caseSensitiveBtn).toHaveAttribute('aria-pressed', 'true');
    expect(caseSensitiveBtn).toHaveClass('active');
  });

  it('should toggle whole word option', () => {
    render(<SearchDialog {...defaultProps} />);

    const wholeWordBtn = screen.getByTestId('btn-whole-word');
    expect(wholeWordBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(wholeWordBtn);
    expect(wholeWordBtn).toHaveAttribute('aria-pressed', 'true');
    expect(wholeWordBtn).toHaveClass('active');
  });

  it('should toggle regex option', () => {
    render(<SearchDialog {...defaultProps} />);

    const regexBtn = screen.getByTestId('btn-regex');
    expect(regexBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(regexBtn);
    expect(regexBtn).toHaveAttribute('aria-pressed', 'true');
    expect(regexBtn).toHaveClass('active');
  });

  it('should call onNext when Next button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    const searchInput = screen.getByLabelText('Search query');
    await user.type(searchInput, 'test');

    const nextButton = screen.getByLabelText('Next match');
    fireEvent.click(nextButton);

    expect(defaultProps.onNext).toHaveBeenCalled();
  });

  it('should call onPrevious when Previous button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    const searchInput = screen.getByLabelText('Search query');
    await user.type(searchInput, 'test');

    const previousButton = screen.getByLabelText('Previous match');
    fireEvent.click(previousButton);

    expect(defaultProps.onPrevious).toHaveBeenCalled();
  });

  it('should call onNext when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    const searchInput = screen.getByLabelText('Search query');
    await user.type(searchInput, 'test');

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Enter' });

    expect(defaultProps.onNext).toHaveBeenCalled();
  });

  it('should call onPrevious when Shift+Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    const searchInput = screen.getByLabelText('Search query');
    await user.type(searchInput, 'test');

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Enter', shiftKey: true });

    expect(defaultProps.onPrevious).toHaveBeenCalled();
  });

  it('should call onReplace when Replace button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    const searchInput = screen.getByLabelText('Search query');
    const replaceInput = screen.getByLabelText('Replace value');
    await user.type(searchInput, 'find');
    await user.type(replaceInput, 'replace');

    const replaceButton = screen.getByLabelText('Replace current match');
    fireEvent.click(replaceButton);

    expect(defaultProps.onReplace).toHaveBeenCalledWith('find', 'replace', {
      caseSensitive: false,
      useRegex: false,
      wholeWord: false,
    });
  });

  it('should call onReplaceAll when Replace All button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    const searchInput = screen.getByLabelText('Search query');
    const replaceInput = screen.getByLabelText('Replace value');
    await user.type(searchInput, 'find');
    await user.type(replaceInput, 'replace');

    const replaceAllButton = screen.getByLabelText('Replace all matches');
    fireEvent.click(replaceAllButton);

    expect(defaultProps.onReplaceAll).toHaveBeenCalledWith('find', 'replace', {
      caseSensitive: false,
      useRegex: false,
      wholeWord: false,
    });
  });

  it('should call onSearch when query changes', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchDialog {...defaultProps} onSearch={onSearch} />);

    const searchInput = screen.getByLabelText('Search query');
    await user.type(searchInput, 'test');

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('test', {
        caseSensitive: false,
        useRegex: false,
        wholeWord: false,
      });
    });
  });

  it('should call onSearch when options change', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchDialog {...defaultProps} onSearch={onSearch} />);

    const searchInput = screen.getByLabelText('Search query');
    await user.type(searchInput, 'test');

    onSearch.mockClear();

    const caseSensitiveBtn = screen.getByTestId('btn-case-sensitive');
    fireEvent.click(caseSensitiveBtn);

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('test', {
        caseSensitive: true,
        useRegex: false,
        wholeWord: false,
      });
    });
  });

  it('should disable navigation buttons when no query', () => {
    render(<SearchDialog {...defaultProps} />);

    const nextButton = screen.getByLabelText('Next match');
    const previousButton = screen.getByLabelText('Previous match');

    expect(nextButton).toBeDisabled();
    expect(previousButton).toBeDisabled();
  });

  it('should disable navigation buttons when no matches', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} currentMatch={0} totalMatches={0} />);

    const searchInput = screen.getByLabelText('Search query');
    await user.type(searchInput, 'test');

    const nextButton = screen.getByLabelText('Next match');
    const previousButton = screen.getByLabelText('Previous match');

    expect(nextButton).toBeDisabled();
    expect(previousButton).toBeDisabled();
  });

  it('should disable replace buttons when no query', () => {
    render(<SearchDialog {...defaultProps} />);

    const replaceButton = screen.getByLabelText('Replace current match');
    const replaceAllButton = screen.getByLabelText('Replace all matches');

    expect(replaceButton).toBeDisabled();
    expect(replaceAllButton).toBeDisabled();
  });

  it('should have proper accessibility attributes', () => {
    render(<SearchDialog {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'search-dialog-title');

    expect(screen.getByLabelText('Search query')).toBeInTheDocument();
    expect(screen.getByLabelText('Replace value')).toBeInTheDocument();
    expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
  });
});
