import React, { useState } from 'react';
import { SearchBar, ElementTypeFilter } from './SearchBar';
import './NavigatorPanel.css';

export interface NavigatorPanelProps {
  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  className?: string;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  typeFilter?: ElementTypeFilter;
  onTypeFilterChange?: (filter: ElementTypeFilter) => void;
  showTypeFilter?: boolean;
}

export const NavigatorPanel: React.FC<NavigatorPanelProps> = ({
  title = 'Navigator',
  children,
  footer,
  onClose,
  className = '',
  showSearch = false,
  searchQuery: controlledSearchQuery,
  onSearchChange: controlledOnSearchChange,
  typeFilter: controlledTypeFilter,
  onTypeFilterChange: controlledOnTypeFilterChange,
  showTypeFilter = true,
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [internalTypeFilter, setInternalTypeFilter] = useState<ElementTypeFilter>('all');

  const searchQuery = controlledSearchQuery !== undefined ? controlledSearchQuery : internalSearchQuery;
  const onSearchChange = controlledOnSearchChange || setInternalSearchQuery;
  const typeFilter = controlledTypeFilter !== undefined ? controlledTypeFilter : internalTypeFilter;
  const onTypeFilterChange = controlledOnTypeFilterChange || setInternalTypeFilter;

  return (
    <div className={`navigator-panel ${className}`}>
      <div className="navigator-panel-header">
        <h2 className="navigator-panel-title">{title}</h2>
        {onClose && (
          <button
            className="navigator-panel-close"
            onClick={onClose}
            aria-label="Close navigator panel"
          >
            ×
          </button>
        )}
      </div>

      {showSearch && (
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          typeFilter={typeFilter}
          onTypeFilterChange={onTypeFilterChange}
          showTypeFilter={showTypeFilter}
        />
      )}

      <div className="navigator-panel-content">
        {children}
      </div>

      {footer && (
        <div className="navigator-panel-footer">
          {footer}
        </div>
      )}
    </div>
  );
};
