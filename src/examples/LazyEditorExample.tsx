/**
 * Lazy Editor Example
 * Demonstrates the lazy loading editor with chapter navigation
 */

import React from 'react';
import { Editor } from '../components/Editor';
import { useChapterStore } from '../hooks/useChapterStore';
import { Chapter } from '../types/chapter';
import { TextBlock } from '../types/textBlock';

// Sample chapters for demonstration
const createSampleChapters = (): Chapter[] => {
  const chapters: Chapter[] = [];

  for (let i = 1; i <= 10; i++) {
    const blocks: TextBlock[] = [
      {
        id: `ch${i}-block1`,
        content: `This is the opening paragraph of chapter ${i}. It sets the scene and introduces the main themes that will be explored in this chapter.`,
        blockType: 'paragraph',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `ch${i}-block2`,
        content: `Chapter ${i} continues with additional context and development of the story. This is where the action begins to unfold.`,
        blockType: 'paragraph',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `ch${i}-block3`,
        content: `The chapter concludes with a cliffhanger or resolution that leads into the next chapter. Readers are left wanting more.`,
        blockType: 'paragraph',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    chapters.push({
      id: `chapter-${i}`,
      number: i,
      title: `Chapter ${i}: The ${['Beginning', 'Journey', 'Challenge', 'Discovery', 'Conflict', 'Resolution', 'Transformation', 'Revelation', 'Climax', 'Conclusion'][i - 1]}`,
      content: blocks,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return chapters;
};

export const LazyEditorExample: React.FC = () => {
  const chapters = createSampleChapters();

  const { store, state, getCacheStats } = useChapterStore(chapters, {
    cacheSize: 5,
    maxHistorySize: 50,
    initialChapterId: 'chapter-1',
  });

  const handleChapterChange = (chapterId: string) => {
    console.log('Chapter changed to:', chapterId);
  };

  const showStats = () => {
    const stats = getCacheStats();
    console.log('Cache Statistics:', stats);
    alert(JSON.stringify(stats, null, 2));
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '16px',
        background: '#2c3e50',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>Lazy Loading Editor Demo</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px' }}>
            {state.activeChapterId ? `Editing: ${store.getChapterInfo(state.activeChapterId)?.title}` : 'No chapter selected'}
          </span>
          <button
            onClick={showStats}
            style={{
              padding: '8px 16px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Show Cache Stats
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          store={store}
          initialChapterId="chapter-1"
          onChapterChange={handleChapterChange}
        />
      </div>

      <div style={{
        padding: '12px 16px',
        background: '#ecf0f1',
        borderTop: '1px solid #bdc3c7',
        fontSize: '13px',
        color: '#7f8c8d',
        display: 'flex',
        gap: '24px'
      }}>
        <span><strong>Features:</strong></span>
        <span>✓ Lazy loading (only loads active chapter)</span>
        <span>✓ LRU cache (keeps 5 recent chapters)</span>
        <span>✓ Preloading (adjacent chapters)</span>
        <span>✓ Undo/Redo (per chapter)</span>
        <span>✓ Unsaved changes tracking</span>
      </div>
    </div>
  );
};

export default LazyEditorExample;
