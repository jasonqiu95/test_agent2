/**
 * EditorToolbar Example
 * Demonstrates how to use the EditorToolbar with EditorPanel
 */

import React, { useState, useRef } from 'react';
import { EditorPanel } from '../components/EditorPanel/EditorPanel';
import { EditorToolbar } from '../components/EditorPanel/EditorToolbar';
import { EditorView } from 'prosemirror-view';
import type { EditorInstance } from '../editor/types';

export const EditorToolbarExample: React.FC = () => {
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const editorInstanceRef = useRef<EditorInstance | null>(null);

  // Handler to capture the editor instance and view
  const handleEditorUpdate = (view: EditorView) => {
    if (!editorView) {
      setEditorView(view);
    }
  };

  // Sample initial content
  const initialContent = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Welcome to the Editor' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'This is a demo of the formatting toolbar. Try these features:' },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Select some text and click ' },
          { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
          { type: 'text', text: ', ' },
          { type: 'text', text: 'Italic', marks: [{ type: 'italic' }] },
          { type: 'text', text: ', or ' },
          { type: 'text', text: 'Underline', marks: [{ type: 'underline' }] },
          { type: 'text', text: ' buttons.' },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Or use keyboard shortcuts:' },
        ],
      },
      {
        type: 'bullet_list',
        content: [
          {
            type: 'list_item',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Ctrl+B', marks: [{ type: 'bold' }] },
                  { type: 'text', text: ' for bold' },
                ],
              },
            ],
          },
          {
            type: 'list_item',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Ctrl+I', marks: [{ type: 'bold' }] },
                  { type: 'text', text: ' for italic' },
                ],
              },
            ],
          },
          {
            type: 'list_item',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Ctrl+U', marks: [{ type: 'bold' }] },
                  { type: 'text', text: ' for underline' },
                ],
              },
            ],
          },
          {
            type: 'list_item',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Ctrl+Alt+1-6', marks: [{ type: 'bold' }] },
                  { type: 'text', text: ' for headings' },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Heading Levels' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'You can also change the current paragraph to different heading levels (H1-H6) using the toolbar buttons.' },
        ],
      },
    ],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <EditorPanel
        title="Formatting Toolbar Demo"
        content={initialContent}
        editable={true}
        autoFocus={true}
        toolbar={<EditorToolbar editorView={editorView} />}
        handlers={{
          onUpdate: handleEditorUpdate,
          onChange: (event) => {
            console.log('Document changed:', event);
          },
        }}
      />
    </div>
  );
};

export default EditorToolbarExample;
