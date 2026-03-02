import React, { useState, useEffect, useRef } from 'react';
import './SearchDialog.css';

export interface SearchOptions {
  caseSensitive: boolean;
  useRegex: boolean;
  wholeWord: boolean;
}

export interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string, options: SearchOptions) => void;
  onReplace?: (query: string, replacement: string, options: SearchOptions) => void;
  onReplaceAll?: (query: string, replacement: string, options: SearchOptions) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  currentMatch?: number;
  totalMatches?: number;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({
  isOpen,
  onClose,
  onSearch,
  onReplace,
  onReplaceAll,
  onNext,
  onPrevious,
  currentMatch = 0,
  totalMatches = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    useRegex: false,
    wholeWord: false,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when dialog opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  }, [isOpen]);

  // Trigger search when query or options change
  useEffect(() => {
    if (searchQuery && onSearch) {
      onSearch(searchQuery, options);
    }
  }, [searchQuery, options, onSearch]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handlePrevious();
    }
  };

  const toggleOption = (option: keyof SearchOptions) => {
    setOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const handleNext = () => {
    if (searchQuery && onNext) {
      onNext();
    }
  };

  const handlePrevious = () => {
    if (searchQuery && onPrevious) {
      onPrevious();
    }
  };

  const handleReplace = () => {
    if (searchQuery && onReplace) {
      onReplace(searchQuery, replaceValue, options);
    }
  };

  const handleReplaceAll = () => {
    if (searchQuery && onReplaceAll) {
      onReplaceAll(searchQuery, replaceValue, options);
    }
  };

  const hasMatches = totalMatches > 0;
  const matchText = hasMatches
    ? `${currentMatch} of ${totalMatches}`
    : searchQuery
    ? 'No matches'
    : '';

  return (
    <div
      className="search-dialog-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-dialog-title"
    >
      <div className="search-dialog">
        <div className="search-dialog-header">
          <h2 id="search-dialog-title">Find and Replace</h2>
          <button
            className="search-dialog-close"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close (Esc)"
          >
            ×
          </button>
        </div>

        <div className="search-dialog-content">
          {/* Search Input */}
          <div className="search-input-group">
            <label htmlFor="search-query" className="search-label">
              Find
            </label>
            <div className="search-input-wrapper">
              <input
                ref={searchInputRef}
                id="search-query"
                type="text"
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search text..."
                aria-label="Search query"
              />
              {matchText && (
                <span className="search-match-counter" aria-live="polite">
                  {matchText}
                </span>
              )}
            </div>
          </div>

          {/* Replace Input */}
          <div className="search-input-group">
            <label htmlFor="replace-value" className="search-label">
              Replace
            </label>
            <div className="search-input-wrapper">
              <input
                id="replace-value"
                type="text"
                className="search-input"
                value={replaceValue}
                onChange={(e) => setReplaceValue(e.target.value)}
                placeholder="Replace with..."
                aria-label="Replace value"
              />
            </div>
          </div>

          {/* Options */}
          <div className="search-options">
            <button
              className={`search-option-btn ${options.caseSensitive ? 'active' : ''}`}
              onClick={() => toggleOption('caseSensitive')}
              aria-pressed={options.caseSensitive}
              title="Match case"
              data-testid="btn-case-sensitive"
            >
              <span className="option-icon">Aa</span>
              <span className="option-label">Match Case</span>
            </button>

            <button
              className={`search-option-btn ${options.wholeWord ? 'active' : ''}`}
              onClick={() => toggleOption('wholeWord')}
              aria-pressed={options.wholeWord}
              title="Match whole word"
              data-testid="btn-whole-word"
            >
              <span className="option-icon">W</span>
              <span className="option-label">Whole Word</span>
            </button>

            <button
              className={`search-option-btn ${options.useRegex ? 'active' : ''}`}
              onClick={() => toggleOption('useRegex')}
              aria-pressed={options.useRegex}
              title="Use regular expression"
              data-testid="btn-regex"
            >
              <span className="option-icon">.*</span>
              <span className="option-label">Regex</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="search-actions">
            <div className="search-nav-buttons">
              <button
                className="search-btn search-btn-secondary"
                onClick={handlePrevious}
                disabled={!searchQuery || !hasMatches}
                title="Previous match (Shift+Enter)"
                aria-label="Previous match"
              >
                ← Previous
              </button>
              <button
                className="search-btn search-btn-secondary"
                onClick={handleNext}
                disabled={!searchQuery || !hasMatches}
                title="Next match (Enter)"
                aria-label="Next match"
              >
                Next →
              </button>
            </div>

            <div className="search-replace-buttons">
              <button
                className="search-btn search-btn-secondary"
                onClick={handleReplace}
                disabled={!searchQuery || !hasMatches}
                aria-label="Replace current match"
              >
                Replace
              </button>
              <button
                className="search-btn search-btn-primary"
                onClick={handleReplaceAll}
                disabled={!searchQuery || !hasMatches}
                aria-label="Replace all matches"
              >
                Replace All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
