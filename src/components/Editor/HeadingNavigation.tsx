/**
 * Heading Navigation Component
 * Displays a navigable list of headings in the document
 */

import React, { useEffect, useState } from 'react';
import { EditorView } from 'prosemirror-view';
import {
  extractHeadingsFromState,
  numberHeadings,
  HeadingInfo,
  TocEntry,
  generateTableOfContents,
} from '../../editor/headingUtils';

export interface HeadingNavigationProps {
  editorView: EditorView | null;
  numbered?: boolean;
  onHeadingClick?: (position: number) => void;
}

export const HeadingNavigation: React.FC<HeadingNavigationProps> = ({
  editorView,
  numbered = true,
  onHeadingClick,
}) => {
  const [headings, setHeadings] = useState<HeadingInfo[]>([]);
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([]);
  const [activePosition, setActivePosition] = useState<number | null>(null);

  // Update headings when editor view changes
  useEffect(() => {
    if (!editorView) {
      setHeadings([]);
      setTocEntries([]);
      return;
    }

    const updateHeadings = () => {
      const extracted = extractHeadingsFromState(editorView.state);
      const processed = numbered
        ? numberHeadings(extracted, { startLevel: 2 })
        : extracted;

      setHeadings(processed);

      // Generate TOC structure
      const toc = generateTableOfContents(extracted, {
        numbered,
        startLevel: 2,
        endLevel: 6,
      });
      setTocEntries(toc);

      // Track current position
      const { from } = editorView.state.selection;
      setActivePosition(from);
    };

    // Initial update
    updateHeadings();

    // Listen to state changes
    const originalDispatch = editorView.dispatch;
    editorView.dispatch = (tr) => {
      originalDispatch.call(editorView, tr);
      updateHeadings();
    };

    return () => {
      editorView.dispatch = originalDispatch;
    };
  }, [editorView, numbered]);

  const handleHeadingClick = (position: number) => {
    if (editorView) {
      // Focus the editor and set cursor to the heading position
      const tr = editorView.state.tr.setSelection(
        editorView.state.selection.constructor.near(
          editorView.state.doc.resolve(position)
        )
      );
      editorView.dispatch(tr);
      editorView.focus();

      // Scroll to the heading
      const domNode = editorView.domAtPos(position).node;
      if (domNode && domNode instanceof Element) {
        domNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      onHeadingClick?.(position);
    }
  };

  const isActive = (position: number): boolean => {
    if (activePosition === null) return false;

    // Find which heading range the active position is in
    const headingPositions = headings.map((h) => h.position);
    for (let i = 0; i < headingPositions.length; i++) {
      const currentPos = headingPositions[i];
      const nextPos = headingPositions[i + 1] || Infinity;

      if (activePosition >= currentPos && activePosition < nextPos) {
        return position === currentPos;
      }
    }

    return false;
  };

  const renderTocEntry = (entry: TocEntry, depth: number = 0): React.ReactNode => {
    const isEntryActive = isActive(entry.position);
    const indentStyle = { paddingLeft: `${depth * 16}px` };

    return (
      <div key={entry.position}>
        <button
          className={`heading-nav-item heading-level-${entry.level} ${
            isEntryActive ? 'active' : ''
          }`}
          style={indentStyle}
          onClick={() => handleHeadingClick(entry.position)}
          title={entry.text}
        >
          {entry.number && <span className="heading-number">{entry.number}</span>}
          <span className="heading-text">{entry.text}</span>
        </button>
        {entry.children &&
          entry.children.map((child) => renderTocEntry(child, depth + 1))}
      </div>
    );
  };

  if (!editorView || headings.length === 0) {
    return (
      <div className="heading-navigation" data-testid="heading-navigation">
        <div className="heading-nav-empty">No headings in document</div>
      </div>
    );
  }

  return (
    <div className="heading-navigation" data-testid="heading-navigation">
      <div className="heading-nav-header">
        <h3>Document Outline</h3>
        <span className="heading-count">{headings.length}</span>
      </div>
      <div className="heading-nav-list">
        {tocEntries.map((entry) => renderTocEntry(entry, 0))}
      </div>
    </div>
  );
};
