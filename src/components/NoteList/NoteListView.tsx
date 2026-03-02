import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectActiveChapterId } from '../../store/editorSlice';
import { Note, Footnote, Endnote } from '../../types/notes';
import './NoteListView.css';

export type NoteFilter = 'all' | 'footnote' | 'endnote';
export type NoteSortBy = 'number' | 'position';

export interface NoteListViewProps {
  /** Optional callback when a note is clicked */
  onNoteClick?: (note: Note) => void;
  /** Optional CSS class name */
  className?: string;
}

interface NoteListItemData {
  note: Note;
  displayNumber: string;
}

/**
 * NoteListView component displays all footnotes and endnotes in the current chapter
 * with filtering and sorting capabilities
 */
export const NoteListView: React.FC<NoteListViewProps> = ({
  onNoteClick,
  className = '',
}) => {
  const [filter, setFilter] = useState<NoteFilter>('all');
  const [sortBy, setSortBy] = useState<NoteSortBy>('number');

  // Get active chapter ID from editor state
  const activeChapterId = useAppSelector(selectActiveChapterId);

  // Get the current chapter from book state
  const currentChapter = useAppSelector((state) => {
    if (!activeChapterId || !state.book.book) {
      return null;
    }
    return state.book.book.chapters.find((ch) => ch.id === activeChapterId);
  });

  // Extract and combine notes from the chapter
  const allNotes = useMemo(() => {
    if (!currentChapter) {
      return [];
    }

    const notes: NoteListItemData[] = [];

    // Add footnotes
    if (currentChapter.footnotes && currentChapter.footnotes.length > 0) {
      currentChapter.footnotes.forEach((footnote) => {
        notes.push({
          note: footnote,
          displayNumber: getDisplayNumber(footnote),
        });
      });
    }

    // Add endnotes
    if (currentChapter.endnotes && currentChapter.endnotes.length > 0) {
      currentChapter.endnotes.forEach((endnote) => {
        notes.push({
          note: endnote,
          displayNumber: getDisplayNumber(endnote),
        });
      });
    }

    return notes;
  }, [currentChapter]);

  // Filter notes based on selected filter
  const filteredNotes = useMemo(() => {
    if (filter === 'all') {
      return allNotes;
    }
    return allNotes.filter((item) => item.note.noteType === filter);
  }, [allNotes, filter]);

  // Sort notes based on selected sort option
  const sortedNotes = useMemo(() => {
    const notesCopy = [...filteredNotes];

    if (sortBy === 'number') {
      notesCopy.sort((a, b) => {
        // Sort by number if available, otherwise by ID
        const numA = a.note.number ?? 0;
        const numB = b.note.number ?? 0;
        if (numA !== numB) {
          return numA - numB;
        }
        return a.note.id.localeCompare(b.note.id);
      });
    } else if (sortBy === 'position') {
      // For position sort, maintain the order they were added (by ID)
      notesCopy.sort((a, b) => a.note.id.localeCompare(b.note.id));
    }

    return notesCopy;
  }, [filteredNotes, sortBy]);

  // Handle note click
  const handleNoteClick = (note: Note) => {
    onNoteClick?.(note);
  };

  // Get display number/marker for a note
  function getDisplayNumber(note: Note): string {
    if (note.markerType === 'custom' && note.customMarker) {
      return note.customMarker;
    }
    if (note.markerType === 'symbol' && note.symbol) {
      return note.symbol;
    }
    if (note.number !== undefined) {
      return note.number.toString();
    }
    return '?';
  }

  // Get content preview (first 100 characters)
  function getContentPreview(content: string): string {
    if (content.length <= 100) {
      return content;
    }
    return content.substring(0, 100) + '...';
  }

  // Count notes by type
  const noteCounts = useMemo(() => {
    const footnoteCount = allNotes.filter((item) => item.note.noteType === 'footnote').length;
    const endnoteCount = allNotes.filter((item) => item.note.noteType === 'endnote').length;
    return { footnoteCount, endnoteCount, total: allNotes.length };
  }, [allNotes]);

  // Render empty state
  if (!currentChapter) {
    return (
      <div className={`note-list-view ${className}`}>
        <div className="note-list-empty">
          <div className="note-list-empty-icon">📝</div>
          <div className="note-list-empty-text">No chapter selected</div>
          <div className="note-list-empty-subtext">
            Select a chapter to view its notes
          </div>
        </div>
      </div>
    );
  }

  if (allNotes.length === 0) {
    return (
      <div className={`note-list-view ${className}`}>
        <div className="note-list-header">
          <h2 className="note-list-title">Notes</h2>
        </div>
        <div className="note-list-empty">
          <div className="note-list-empty-icon">📝</div>
          <div className="note-list-empty-text">No notes in this chapter</div>
          <div className="note-list-empty-subtext">
            Add footnotes or endnotes to see them here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`note-list-view ${className}`}>
      {/* Header */}
      <div className="note-list-header">
        <h2 className="note-list-title">
          Notes ({noteCounts.total})
        </h2>
      </div>

      {/* Filter Controls */}
      <div className="note-list-controls">
        <div className="note-list-filter">
          <label className="note-list-control-label">Filter:</label>
          <div className="note-list-filter-buttons">
            <button
              type="button"
              className={`note-list-filter-button ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({noteCounts.total})
            </button>
            <button
              type="button"
              className={`note-list-filter-button ${filter === 'footnote' ? 'active' : ''}`}
              onClick={() => setFilter('footnote')}
            >
              Footnotes ({noteCounts.footnoteCount})
            </button>
            <button
              type="button"
              className={`note-list-filter-button ${filter === 'endnote' ? 'active' : ''}`}
              onClick={() => setFilter('endnote')}
            >
              Endnotes ({noteCounts.endnoteCount})
            </button>
          </div>
        </div>

        <div className="note-list-sort">
          <label className="note-list-control-label" htmlFor="sort-select">
            Sort by:
          </label>
          <select
            id="sort-select"
            className="note-list-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as NoteSortBy)}
          >
            <option value="number">Number</option>
            <option value="position">Position</option>
          </select>
        </div>
      </div>

      {/* Notes List */}
      <div className="note-list-items">
        {sortedNotes.length === 0 ? (
          <div className="note-list-no-results">
            No {filter === 'all' ? 'notes' : `${filter}s`} found
          </div>
        ) : (
          sortedNotes.map((item) => (
            <div
              key={item.note.id}
              className="note-list-item"
              onClick={() => handleNoteClick(item.note)}
            >
              <div className="note-list-item-header">
                <span className="note-list-item-number">{item.displayNumber}</span>
                <span className="note-list-item-type">
                  {item.note.noteType === 'footnote' ? 'Footnote' : 'Endnote'}
                </span>
              </div>
              <div className="note-list-item-content">
                {getContentPreview(item.note.content)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NoteListView;
