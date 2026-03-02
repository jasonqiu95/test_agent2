import React from 'react';
import './SearchBar.css';

export type ElementTypeFilter = 'all' | 'chapters' | 'frontMatter' | 'backMatter';

export interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: ElementTypeFilter;
  onTypeFilterChange: (filter: ElementTypeFilter) => void;
  placeholder?: string;
  showTypeFilter?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  placeholder = 'Search...',
  showTypeFilter = true,
}) => {
  const handleClear = () => {
    onSearchChange('');
  };

  return (
    <div className="search-bar">
      <div className="search-input-container">
        <input
          type="text"
          className="search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Search"
        />
        {searchQuery && (
          <button
            className="search-clear-button"
            onClick={handleClear}
            aria-label="Clear search"
            title="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {showTypeFilter && (
        <div className="search-filter-container">
          <select
            className="search-filter-select"
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as ElementTypeFilter)}
            aria-label="Filter by type"
          >
            <option value="all">All</option>
            <option value="chapters">Chapters Only</option>
            <option value="frontMatter">Front Matter Only</option>
            <option value="backMatter">Back Matter Only</option>
          </select>
        </div>
      )}
    </div>
  );
};
