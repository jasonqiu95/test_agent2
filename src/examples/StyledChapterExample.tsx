/**
 * Example: Styled Chapter Component
 * Demonstrates the use of memoized style calculations
 */

import React from 'react';
import { useChapterRenderStyles, useTextBlockStyles } from '../hooks/useStyleCalculations';
import { Chapter, BookStyle } from '../types';

interface StyledChapterProps {
  chapter: Chapter;
  bookStyle: BookStyle;
}

/**
 * Example chapter component using memoized styles
 * Styles are automatically cached and only recompute when dependencies change
 */
export function StyledChapter({ chapter, bookStyle }: StyledChapterProps) {
  // Get all necessary styles with a single hook
  const { chapter: chapterStyles, blocks: blockStyles } = useChapterRenderStyles(
    chapter,
    bookStyle
  );

  return (
    <article style={chapterStyles}>
      {chapter.title && (
        <header>
          <h1>{chapter.title}</h1>
          {chapter.subtitle && <h2>{chapter.subtitle}</h2>}
        </header>
      )}

      <div className="chapter-content">
        {chapter.content.map((block, index) => (
          <TextBlockComponent
            key={block.id}
            block={block}
            bookStyle={bookStyle}
            isFirstParagraph={index === 0}
            style={blockStyles.get(block.id)}
          />
        ))}
      </div>
    </article>
  );
}

interface TextBlockComponentProps {
  block: any;
  bookStyle: BookStyle;
  isFirstParagraph: boolean;
  style?: React.CSSProperties;
}

/**
 * Individual text block component with drop cap support
 */
function TextBlockComponent({
  block,
  bookStyle,
  isFirstParagraph,
  style,
}: TextBlockComponentProps) {
  const { dropCapStyles } = useTextBlockStyles({
    block,
    bookStyle,
    isFirstParagraph,
  });

  // Handle drop cap for first paragraph
  if (
    block.blockType === 'paragraph' &&
    isFirstParagraph &&
    dropCapStyles &&
    block.content
  ) {
    const firstChar = block.content.charAt(0);
    const restOfText = block.content.slice(1);

    return (
      <p style={style}>
        <span style={dropCapStyles}>{firstChar}</span>
        {restOfText}
      </p>
    );
  }

  // Handle different block types
  switch (block.blockType) {
    case 'heading':
      const HeadingTag = `h${block.level || 1}` as keyof JSX.IntrinsicElements;
      return <HeadingTag style={style}>{block.content}</HeadingTag>;

    case 'paragraph':
      return <p style={style}>{block.content}</p>;

    case 'code':
    case 'preformatted':
      return (
        <pre style={style}>
          <code>{block.content}</code>
        </pre>
      );

    default:
      return <div style={style}>{block.content}</div>;
  }
}

/**
 * Example with profiling enabled
 */
export function ProfiledStyledChapter({ chapter, bookStyle }: StyledChapterProps) {
  // In development, you can enable profiling
  if (process.env.NODE_ENV === 'development') {
    // Import profiler dynamically to avoid production bundle
    const { useRenderProfiler } = require('../services/style-profiler');
    useRenderProfiler('StyledChapter');
  }

  return <StyledChapter chapter={chapter} bookStyle={bookStyle} />;
}

export default StyledChapter;
