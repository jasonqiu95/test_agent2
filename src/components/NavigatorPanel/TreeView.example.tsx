/**
 * Example usage of TreeView component
 * This file demonstrates how to use the TreeView component with a Book structure
 */

import React, { useState } from 'react';
import { TreeView } from './TreeView';
import { Book } from '../../types/book';

export const TreeViewExample: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | undefined>();

  // Example book data
  const exampleBook: Book = {
    id: 'book-1',
    title: 'My Novel',
    createdAt: new Date(),
    updatedAt: new Date(),
    authors: [],
    frontMatter: [
      {
        id: 'fm-1',
        type: 'title-page',
        matter: 'front',
        title: 'Title Page',
        content: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'fm-2',
        type: 'dedication',
        matter: 'front',
        title: 'Dedication',
        content: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'fm-3',
        type: 'preface',
        matter: 'front',
        title: 'Preface',
        content: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    chapters: [
      {
        id: 'ch-1',
        number: 1,
        title: 'The Beginning',
        content: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'ch-2',
        number: 2,
        title: 'The Journey',
        content: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'ch-3',
        number: 3,
        title: 'The Climax',
        content: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    backMatter: [
      {
        id: 'bm-1',
        type: 'epilogue',
        matter: 'back',
        title: 'Epilogue',
        content: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'bm-2',
        type: 'acknowledgments',
        matter: 'back',
        title: 'Acknowledgments',
        content: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    styles: [],
    metadata: {
      title: 'My Novel',
    },
  };

  const handleSelect = (id: string, type: 'frontMatter' | 'chapter' | 'backMatter') => {
    console.log('Selected:', id, type);
    setSelectedId(id);
  };

  return (
    <div style={{ width: '300px', padding: '20px' }}>
      <h1>TreeView Example</h1>
      <TreeView
        book={exampleBook}
        selectedId={selectedId}
        onSelect={handleSelect}
      />
    </div>
  );
};
