/**
 * Editor Content Component
 * Displays and edits chapter content
 */

import React from 'react';
import { TextBlock } from '../../types/textBlock';
import { WordCount } from './WordCount';

export interface EditorContentProps {
  chapterId: string;
  content: TextBlock[];
  chapterTitle?: string;
  onChange: (content: TextBlock[]) => void;
}

export const EditorContent: React.FC<EditorContentProps> = ({
  chapterId,
  content,
  chapterTitle,
  onChange,
}) => {
  const handleBlockChange = (index: number, newContent: string) => {
    const updatedContent = [...content];
    updatedContent[index] = {
      ...updatedContent[index],
      content: newContent,
    };
    onChange(updatedContent);
  };

  const handleAddBlock = () => {
    const newBlock: TextBlock = {
      id: `block-${Date.now()}`,
      content: '',
      blockType: 'paragraph',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    onChange([...content, newBlock]);
  };

  const handleRemoveBlock = (index: number) => {
    const updatedContent = content.filter((_, i) => i !== index);
    onChange(updatedContent);
  };

  return (
    <div className="editor-content" data-chapter-id={chapterId}>
      {chapterTitle && (
        <div className="editor-chapter-header">
          <h2>{chapterTitle}</h2>
        </div>
      )}

      <div className="editor-blocks">
        {content.length === 0 ? (
          <div className="editor-empty-content">
            <p>This chapter is empty. Add a text block to start writing.</p>
            <button className="add-block-button" onClick={handleAddBlock}>
              Add Text Block
            </button>
          </div>
        ) : (
          <>
            {content.map((block, index) => (
              <div key={block.id} className={`editor-block block-${block.blockType}`}>
                <div className="block-controls">
                  <span className="block-type">{block.blockType}</span>
                  <button
                    className="block-remove"
                    onClick={() => handleRemoveBlock(index)}
                    title="Remove Block"
                  >
                    ×
                  </button>
                </div>

                <textarea
                  className="block-textarea"
                  value={block.content}
                  onChange={(e) => handleBlockChange(index, e.target.value)}
                  placeholder={`Enter ${block.blockType} content...`}
                  rows={Math.max(3, block.content.split('\n').length)}
                />

                {block.features && block.features.length > 0 && (
                  <div className="block-features">
                    {block.features.map((feature, i) => (
                      <span key={i} className="feature-tag">
                        {feature.type}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button className="add-block-button" onClick={handleAddBlock}>
              + Add Text Block
            </button>
          </>
        )}
      </div>

      <div className="editor-stats">
        <span>Blocks: {content.length}</span>
        <WordCount
          content={content}
          debounceMs={300}
          showPageCount={true}
          showReadingTime={true}
          label="Chapter:"
          className="editor-word-count"
        />
      </div>
    </div>
  );
};
