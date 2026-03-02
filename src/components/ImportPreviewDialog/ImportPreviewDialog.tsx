import React, { useState, useEffect, useRef } from 'react';
import type { DetectedChapter } from '../lib/docx/chapterDetection';
import type { StructuredDocument, Paragraph } from '../lib/docx/types';
import './ImportPreviewDialog.css';

export interface ChapterPreviewItem extends DetectedChapter {
  id: string;
  isIncluded: boolean;
  editedTitle?: string;
  preview: string[];
}

export interface ImportPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (chapters: ChapterPreviewItem[]) => void;
  document: StructuredDocument;
  detectedChapters: DetectedChapter[];
  title?: string;
}

export const ImportPreviewDialog: React.FC<ImportPreviewDialogProps> = ({
  isOpen,
  onClose,
  onImport,
  document,
  detectedChapters,
  title = 'Import Preview',
}) => {
  const [chapters, setChapters] = useState<ChapterPreviewItem[]>(() =>
    detectedChapters.map((chapter, index) => ({
      ...chapter,
      id: `chapter-${index}`,
      isIncluded: true,
      preview: getChapterPreview(document, chapter),
    }))
  );

  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());

  // Progress tracking state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const importTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount or when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Reset import state when dialog closes
      setIsImporting(false);
      setImportProgress(0);
      setStatusMessage('');
      setProcessedCount(0);
      setTotalCount(0);
      setIsCancelled(false);
      if (importTimerRef.current) {
        clearInterval(importTimerRef.current);
        importTimerRef.current = null;
      }
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (importTimerRef.current) {
        clearInterval(importTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleToggleChapter = (id: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === id ? { ...ch, isIncluded: !ch.isIncluded } : ch
      )
    );
  };

  const handleTitleEdit = (id: string, newTitle: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === id ? { ...ch, editedTitle: newTitle } : ch
      )
    );
  };

  const handleSelectChapter = (id: string, isShiftKey: boolean) => {
    if (isShiftKey && selectedChapters.size > 0) {
      const chapterIds = chapters.map((ch) => ch.id);
      const lastSelected = Array.from(selectedChapters).pop()!;
      const currentIndex = chapterIds.indexOf(id);
      const lastIndex = chapterIds.indexOf(lastSelected);

      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);
      const rangeIds = chapterIds.slice(start, end + 1);

      setSelectedChapters(new Set([...selectedChapters, ...rangeIds]));
    } else {
      setSelectedChapters((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    }
  };

  const handleMergeSelected = () => {
    if (selectedChapters.size < 2) return;

    const selectedIds = Array.from(selectedChapters);
    const selectedIndices = selectedIds
      .map((id) => chapters.findIndex((ch) => ch.id === id))
      .sort((a, b) => a - b);

    if (selectedIndices.length < 2) return;

    const firstIndex = selectedIndices[0];
    const lastIndex = selectedIndices[selectedIndices.length - 1];

    const mergedChapter: ChapterPreviewItem = {
      ...chapters[firstIndex],
      endIndex: chapters[lastIndex].endIndex,
      title: chapters[firstIndex].editedTitle || chapters[firstIndex].title,
      preview: getChapterPreview(document, {
        ...chapters[firstIndex],
        endIndex: chapters[lastIndex].endIndex,
      }),
    };

    const newChapters = [
      ...chapters.slice(0, firstIndex),
      mergedChapter,
      ...chapters.slice(lastIndex + 1),
    ];

    setChapters(newChapters);
    setSelectedChapters(new Set([mergedChapter.id]));
  };

  const handleSplitChapter = (id: string) => {
    const chapterIndex = chapters.findIndex((ch) => ch.id === id);
    if (chapterIndex === -1) return;

    const chapter = chapters[chapterIndex];
    const midPoint = Math.floor((chapter.startIndex + chapter.endIndex) / 2);

    if (midPoint <= chapter.startIndex) return;

    const firstHalf: ChapterPreviewItem = {
      ...chapter,
      id: `${chapter.id}-1`,
      endIndex: midPoint,
      title: `${chapter.editedTitle || chapter.title} (Part 1)`,
      preview: getChapterPreview(document, { ...chapter, endIndex: midPoint }),
    };

    const secondHalf: ChapterPreviewItem = {
      ...chapter,
      id: `${chapter.id}-2`,
      startIndex: midPoint + 1,
      title: `${chapter.editedTitle || chapter.title} (Part 2)`,
      preview: getChapterPreview(document, { ...chapter, startIndex: midPoint + 1 }),
    };

    const newChapters = [
      ...chapters.slice(0, chapterIndex),
      firstHalf,
      secondHalf,
      ...chapters.slice(chapterIndex + 1),
    ];

    setChapters(newChapters);
    setSelectedChapters(new Set());
  };

  const handleImport = () => {
    const includedChapters = chapters.filter((ch) => ch.isIncluded);

    // Start import process with progress tracking
    setIsImporting(true);
    setImportProgress(0);
    setProcessedCount(0);
    setTotalCount(includedChapters.length);
    setIsCancelled(false);
    setStatusMessage('Preparing import...');

    // Simulate import progress (in real implementation, this would be driven by actual import)
    let currentProgress = 0;
    let currentChapter = 0;

    importTimerRef.current = setInterval(() => {
      if (isCancelled) {
        if (importTimerRef.current) {
          clearInterval(importTimerRef.current);
          importTimerRef.current = null;
        }
        setIsImporting(false);
        setStatusMessage('Import cancelled');
        return;
      }

      currentProgress += 2;

      if (currentProgress >= 100) {
        if (importTimerRef.current) {
          clearInterval(importTimerRef.current);
          importTimerRef.current = null;
        }
        setImportProgress(100);
        setProcessedCount(includedChapters.length);
        setStatusMessage('Import complete!');

        // Complete import after a brief delay
        setTimeout(() => {
          setIsImporting(false);
          onImport(includedChapters);
        }, 500);
        return;
      }

      setImportProgress(currentProgress);

      // Update processed count based on progress
      const newProcessedCount = Math.floor((currentProgress / 100) * includedChapters.length);
      if (newProcessedCount > currentChapter) {
        currentChapter = newProcessedCount;
        setProcessedCount(currentChapter);

        if (currentChapter < includedChapters.length) {
          const chapter = includedChapters[currentChapter];
          const elementCount = chapter.endIndex - chapter.startIndex + 1;
          setStatusMessage(`Processing "${chapter.editedTitle || chapter.title}" (${elementCount} elements)...`);
        }
      }
    }, 100); // Update every 100ms
  };

  const handleCancelImport = () => {
    setIsCancelled(true);
    setStatusMessage('Cancelling import...');
  };

  const includedCount = chapters.filter((ch) => ch.isIncluded).length;
  const totalCount = chapters.length;

  return (
    <div
      className="import-preview-dialog-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-preview-dialog-title"
    >
      <div className="import-preview-dialog">
        <div className="import-preview-dialog-header">
          <h2 id="import-preview-dialog-title">{title}</h2>
          <button
            className="import-preview-dialog-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className="import-preview-dialog-toolbar">
          <div className="import-preview-stats">
            {includedCount} of {totalCount} chapters selected
          </div>
          <div className="import-preview-actions">
            <button
              className="import-preview-action-btn"
              onClick={handleMergeSelected}
              disabled={selectedChapters.size < 2}
              title="Merge selected chapters"
            >
              Merge Selected
            </button>
          </div>
        </div>

        <div className="import-preview-dialog-content">
          {isImporting ? (
            <div className="import-progress-view">
              <div className="import-progress-header">
                <h3 className="import-progress-title">Importing Chapters</h3>
                <div className="import-progress-count">
                  {processedCount} / {totalCount} chapters processed
                </div>
              </div>

              <div className="import-progress-bar-container">
                <div
                  className="import-progress-bar-fill"
                  style={{ width: `${importProgress}%` }}
                >
                  <span className="import-progress-percentage">{importProgress}%</span>
                </div>
              </div>

              <div className="import-progress-status">
                {statusMessage}
              </div>
            </div>
          ) : chapters.length === 0 ? (
            <div className="import-preview-empty">
              <p>No chapters detected in this document.</p>
            </div>
          ) : (
            <div className="import-preview-chapters">
              {chapters.map((chapter) => (
                <ChapterPreviewCard
                  key={chapter.id}
                  chapter={chapter}
                  isSelected={selectedChapters.has(chapter.id)}
                  onToggle={handleToggleChapter}
                  onTitleEdit={handleTitleEdit}
                  onSelect={handleSelectChapter}
                  onSplit={handleSplitChapter}
                />
              ))}
            </div>
          )}
        </div>

        <div className="import-preview-dialog-footer">
          {isImporting ? (
            <>
              <button
                className="import-preview-btn-secondary"
                onClick={handleCancelImport}
                disabled={isCancelled}
              >
                {isCancelled ? 'Cancelling...' : 'Cancel Import'}
              </button>
            </>
          ) : (
            <>
              <button className="import-preview-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="import-preview-btn-primary"
                onClick={handleImport}
                disabled={includedCount === 0}
              >
                Import {includedCount > 0 && `(${includedCount})`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface ChapterPreviewCardProps {
  chapter: ChapterPreviewItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onTitleEdit: (id: string, newTitle: string) => void;
  onSelect: (id: string, isShiftKey: boolean) => void;
  onSplit: (id: string) => void;
}

const ChapterPreviewCard: React.FC<ChapterPreviewCardProps> = ({
  chapter,
  isSelected,
  onToggle,
  onTitleEdit,
  onSelect,
  onSplit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(chapter.editedTitle || chapter.title);

  const handleEditStart = () => {
    setIsEditing(true);
    setEditValue(chapter.editedTitle || chapter.title);
  };

  const handleEditSave = () => {
    onTitleEdit(chapter.id, editValue);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(chapter.editedTitle || chapter.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.chapter-preview-checkbox') &&
        !(e.target as HTMLElement).closest('.chapter-preview-title-edit')) {
      onSelect(chapter.id, e.shiftKey);
    }
  };

  const displayTitle = chapter.editedTitle || chapter.title;
  const confidencePercent = Math.round(chapter.confidence * 100);

  return (
    <div
      className={`chapter-preview-card ${isSelected ? 'selected' : ''} ${
        !chapter.isIncluded ? 'excluded' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="chapter-preview-header">
        <div className="chapter-preview-checkbox">
          <input
            type="checkbox"
            checked={chapter.isIncluded}
            onChange={() => onToggle(chapter.id)}
            aria-label={`Include ${displayTitle}`}
          />
        </div>

        <div className="chapter-preview-title-section">
          {isEditing ? (
            <div className="chapter-preview-title-edit">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleEditSave}
                autoFocus
                className="chapter-preview-title-input"
              />
            </div>
          ) : (
            <h3 className="chapter-preview-title" onDoubleClick={handleEditStart}>
              {displayTitle}
              <button
                className="chapter-preview-edit-btn"
                onClick={handleEditStart}
                aria-label="Edit title"
                title="Edit title"
              >
                ✎
              </button>
            </h3>
          )}

          <div className="chapter-preview-metadata">
            <span className="chapter-preview-type">{chapter.type}</span>
            {chapter.headingLevel && (
              <span className="chapter-preview-heading">H{chapter.headingLevel}</span>
            )}
            <span
              className={`chapter-preview-confidence ${
                chapter.confidence >= 0.8
                  ? 'high'
                  : chapter.confidence >= 0.5
                  ? 'medium'
                  : 'low'
              }`}
              title={`Detection confidence: ${confidencePercent}%`}
            >
              {confidencePercent}%
            </span>
            {chapter.isNumbered && chapter.chapterNumber && (
              <span className="chapter-preview-number">#{chapter.chapterNumber}</span>
            )}
          </div>
        </div>

        <button
          className="chapter-preview-split-btn"
          onClick={(e) => {
            e.stopPropagation();
            onSplit(chapter.id);
          }}
          title="Split chapter"
          aria-label="Split chapter"
        >
          ⚡
        </button>
      </div>

      <div className="chapter-preview-content">
        <div className="chapter-preview-text">
          {chapter.preview.length > 0 ? (
            chapter.preview.map((line, idx) => (
              <p key={idx} className="chapter-preview-line">
                {line || '\u00A0'}
              </p>
            ))
          ) : (
            <p className="chapter-preview-empty-text">(Empty chapter)</p>
          )}
        </div>
      </div>

      <div className="chapter-preview-footer">
        <span className="chapter-preview-range">
          Elements {chapter.startIndex} - {chapter.endIndex}
        </span>
      </div>
    </div>
  );
};

function getChapterPreview(
  document: StructuredDocument,
  chapter: DetectedChapter,
  maxLines: number = 5
): string[] {
  const elements = document.elements.slice(
    chapter.startIndex,
    Math.min(chapter.endIndex + 1, document.elements.length)
  );

  const lines: string[] = [];
  let lineCount = 0;

  for (const element of elements) {
    if (lineCount >= maxLines) break;

    if (element.type === 'paragraph') {
      const paragraph = element as Paragraph;
      const text = paragraph.rawText.trim();

      if (text) {
        lines.push(text);
        lineCount++;
      }
    }
  }

  return lines;
}
