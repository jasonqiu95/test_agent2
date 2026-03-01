import React, { useState, useMemo, useEffect } from 'react';
import { BookStyle, BookStyleCategory } from '../../types/style';
import { allStyles, getStylesByCategory } from '../../data/styles/index';
import './StyleBrowserPanel.css';

export interface StyleBrowserPanelProps {
  onApplyStyle: (style: BookStyle) => void;
  currentStyleId?: string;
}

type ViewMode = 'all' | BookStyleCategory;

const CATEGORIES: Array<{ id: ViewMode; label: string; icon: string }> = [
  { id: 'all', label: 'All Styles', icon: '✨' },
  { id: 'serif', label: 'Serif', icon: '📖' },
  { id: 'sans-serif', label: 'Sans Serif', icon: '🔤' },
  { id: 'script', label: 'Script', icon: '✍️' },
  { id: 'modern', label: 'Modern', icon: '⚡' },
];

const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog';

export const StyleBrowserPanel: React.FC<StyleBrowserPanelProps> = ({
  onApplyStyle,
  currentStyleId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ViewMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // Load favorites and recents from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('styleBrowser.favorites');
    if (savedFavorites) {
      setFavoriteIds(new Set(JSON.parse(savedFavorites)));
    }

    const savedRecents = localStorage.getItem('styleBrowser.recents');
    if (savedRecents) {
      setRecentIds(JSON.parse(savedRecents));
    }
  }, []);

  // Save favorites to localStorage
  const toggleFavorite = (styleId: string) => {
    setFavoriteIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(styleId)) {
        newSet.delete(styleId);
      } else {
        newSet.add(styleId);
      }
      localStorage.setItem('styleBrowser.favorites', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  // Handle style application and update recents
  const handleApplyStyle = (style: BookStyle) => {
    onApplyStyle(style);

    // Update recents list
    setRecentIds((prev) => {
      const newRecents = [style.id, ...prev.filter((id) => id !== style.id)].slice(0, 10);
      localStorage.setItem('styleBrowser.recents', JSON.stringify(newRecents));
      return newRecents;
    });
  };

  // Filter and sort styles
  const filteredStyles = useMemo(() => {
    let styles = selectedCategory === 'all' ? allStyles : getStylesByCategory(selectedCategory);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      styles = styles.filter(
        (style) =>
          style.name.toLowerCase().includes(query) ||
          style.description.toLowerCase().includes(query) ||
          style.category.toLowerCase().includes(query)
      );
    }

    return styles;
  }, [selectedCategory, searchQuery]);

  // Get recent styles
  const recentStyles = useMemo(() => {
    return recentIds
      .map((id) => allStyles.find((s) => s.id === id))
      .filter((s): s is BookStyle => s !== undefined);
  }, [recentIds]);

  // Get favorite styles
  const favoriteStyles = useMemo(() => {
    return allStyles.filter((s) => favoriteIds.has(s.id));
  }, [favoriteIds]);

  return (
    <div className="style-browser-panel">
      <div className="style-browser-header">
        <h2 className="style-browser-title">Style Browser</h2>
        <div className="style-browser-search">
          <input
            type="text"
            placeholder="Search styles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="style-browser-search-input"
          />
          {searchQuery && (
            <button
              className="style-browser-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="style-browser-categories">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            className={`style-browser-category-btn ${
              selectedCategory === category.id ? 'active' : ''
            }`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-label">{category.label}</span>
          </button>
        ))}
      </div>

      <div className="style-browser-content">
        {recentStyles.length > 0 && selectedCategory === 'all' && !searchQuery && (
          <div className="style-browser-section">
            <h3 className="style-browser-section-title">Recently Used</h3>
            <div className="style-browser-grid">
              {recentStyles.map((style) => (
                <StyleCard
                  key={`recent-${style.id}`}
                  style={style}
                  isFavorite={favoriteIds.has(style.id)}
                  isActive={style.id === currentStyleId}
                  onApply={handleApplyStyle}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        )}

        {favoriteStyles.length > 0 && selectedCategory === 'all' && !searchQuery && (
          <div className="style-browser-section">
            <h3 className="style-browser-section-title">Favorites</h3>
            <div className="style-browser-grid">
              {favoriteStyles.map((style) => (
                <StyleCard
                  key={`favorite-${style.id}`}
                  style={style}
                  isFavorite={true}
                  isActive={style.id === currentStyleId}
                  onApply={handleApplyStyle}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        )}

        <div className="style-browser-section">
          {(recentStyles.length > 0 || favoriteStyles.length > 0) &&
            selectedCategory === 'all' &&
            !searchQuery && (
              <h3 className="style-browser-section-title">All Styles</h3>
            )}
          {filteredStyles.length > 0 ? (
            <div className="style-browser-grid">
              {filteredStyles.map((style) => (
                <StyleCard
                  key={style.id}
                  style={style}
                  isFavorite={favoriteIds.has(style.id)}
                  isActive={style.id === currentStyleId}
                  onApply={handleApplyStyle}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="style-browser-empty">
              <p>No styles found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StyleCardProps {
  style: BookStyle;
  isFavorite: boolean;
  isActive: boolean;
  onApply: (style: BookStyle) => void;
  onToggleFavorite: (styleId: string) => void;
}

const StyleCard: React.FC<StyleCardProps> = ({
  style,
  isFavorite,
  isActive,
  onApply,
  onToggleFavorite,
}) => {
  const handleClick = () => {
    onApply(style);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(style.id);
  };

  // Generate style preview CSS
  const previewStyle: React.CSSProperties = {
    fontFamily: style.fonts.body,
    fontSize: '0.875rem',
    lineHeight: style.body.lineHeight,
    color: style.colors.text,
    textAlign: style.body.textAlign || 'left',
  };

  const getCategoryBadgeClass = (category: BookStyleCategory) => {
    const classes: Record<BookStyleCategory, string> = {
      serif: 'category-serif',
      'sans-serif': 'category-sans-serif',
      script: 'category-script',
      modern: 'category-modern',
    };
    return classes[category];
  };

  return (
    <div
      className={`style-card ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className="style-card-header">
        <div className="style-card-title-row">
          <h4 className="style-card-title">{style.name}</h4>
          <button
            className={`style-card-favorite ${isFavorite ? 'active' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </div>
        <span className={`style-card-category ${getCategoryBadgeClass(style.category)}`}>
          {style.category}
        </span>
      </div>

      <div className="style-card-preview">
        <p style={previewStyle}>{SAMPLE_TEXT}</p>
      </div>

      <div className="style-card-description">
        <p>{style.description}</p>
      </div>

      <div className="style-card-footer">
        <div className="style-card-fonts">
          <span className="font-label">Body:</span> {style.fonts.body.split(',')[0].replace(/'/g, '')}
        </div>
        {isActive && <span className="style-card-active-badge">Active</span>}
      </div>
    </div>
  );
};
