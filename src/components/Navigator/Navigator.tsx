import React from 'react';
import { Book } from '../../types/book';
import { TreeView } from '../NavigatorPanel/TreeView';
import './Navigator.css';

export interface NavigatorProps {
  book?: Book;
  selectedId?: string;
  onSelect?: (id: string, type: 'frontMatter' | 'chapter' | 'backMatter') => void;
  className?: string;
}

export const Navigator: React.FC<NavigatorProps> = ({
  book,
  selectedId,
  onSelect,
  className = '',
}) => {
  if (!book) {
    return (
      <div className={`navigator navigator-empty ${className}`}>
        <div className="navigator-empty-state">
          <p className="navigator-empty-message">No book loaded</p>
          <p className="navigator-empty-hint">Open or create a book to get started</p>
        </div>
      </div>
    );
  }

  const hasContent =
    (book.frontMatter && book.frontMatter.length > 0) ||
    (book.chapters && book.chapters.length > 0) ||
    (book.backMatter && book.backMatter.length > 0);

  if (!hasContent) {
    return (
      <div className={`navigator navigator-empty ${className}`}>
        <div className="navigator-empty-state">
          <p className="navigator-empty-message">No content yet</p>
          <p className="navigator-empty-hint">Add chapters or matter to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`navigator ${className}`}>
      <TreeView book={book} selectedId={selectedId} onSelect={onSelect} />
    </div>
  );
};
