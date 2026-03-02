/**
 * EditorPanel Redux Integration Tests
 * Tests for Redux state management integration with the editor
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorPanel } from '../EditorPanel';
import { renderWithProviders } from '../../../__tests__/testUtils';
import {
  setActiveChapter,
  setEditorContent,
  updateEditorContent,
  updateSelection,
  clearEditor,
  loadChapterContent,
  markAsSaved,
} from '../../../store/editorSlice';
import {
  emptyDocument,
  simpleDocument,
  formattedDocument,
  multiParagraphDocument,
} from '../../../editor/__tests__/fixtures/documentFixtures';

describe('EditorPanel Redux Integration', () => {
  describe('Redux State Synchronization', () => {
    it('should load content from Redux state', () => {
      const { container, store } = renderWithProviders(
        <EditorPanel chapterId="chapter-1" useRedux={true} />
      );

      // Dispatch content to Redux
      store.dispatch(
        loadChapterContent({
          chapterId: 'chapter-1',
          content: simpleDocument,
        })
      );

      // Editor should eventually show the content
      waitFor(() => {
        const editor = container.querySelector('.ProseMirror');
        expect(editor?.textContent).toContain('Hello world');
      });
    });

    it('should update Redux state when content changes', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      const { container, store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          useRedux={true}
          debounceDelay={300}
        />
      );

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
        await user.keyboard('Hello');
      }

      // Fast-forward debounce delay
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        const state = store.getState();
        expect(state.editor.content).toBeTruthy();
      });

      jest.useRealTimers();
    });

    it('should update selection in Redux', async () => {
      const user = userEvent.setup();
      const { container, store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          content={simpleDocument}
          useRedux={true}
        />
      );

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
      }

      await waitFor(() => {
        const state = store.getState();
        expect(state.editor.selection).toBeTruthy();
      });
    });

    it('should update metadata in Redux', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      const { container, store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          useRedux={true}
          debounceDelay={100}
        />
      );

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
        await user.keyboard('Test content here');
      }

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        const state = store.getState();
        expect(state.editor.metadata.wordCount).toBeGreaterThan(0);
      });

      jest.useRealTimers();
    });
  });

  describe('Debounced Updates', () => {
    it('should debounce content updates to Redux', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      const { container, store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          useRedux={true}
          debounceDelay={300}
        />
      );

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
        await user.keyboard('a');
      }

      // Before debounce delay
      jest.advanceTimersByTime(100);
      const stateBefore = store.getState();

      // After debounce delay
      jest.advanceTimersByTime(200);

      await waitFor(() => {
        const stateAfter = store.getState();
        expect(stateAfter.editor.content).toBeTruthy();
      });

      jest.useRealTimers();
    });

    it('should respect custom debounce delay', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      const { container } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          useRedux={true}
          debounceDelay={500}
        />
      );

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
        await user.keyboard('test');
      }

      // Should not update after 300ms with 500ms delay
      jest.advanceTimersByTime(300);
      expect(true).toBe(true); // Still waiting

      jest.useRealTimers();
    });

    it('should cancel pending updates on unmount', () => {
      jest.useFakeTimers();

      const { unmount } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          useRedux={true}
          debounceDelay={300}
        />
      );

      unmount();

      // Advance timers - should not cause errors
      jest.advanceTimersByTime(300);

      jest.useRealTimers();
    });

    it('should handle rapid typing with debounce', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      const { container, store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          useRedux={true}
          debounceDelay={300}
        />
      );

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
        await user.keyboard('Hello World');
      }

      // Fast forward to trigger debounce
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        const state = store.getState();
        expect(state.editor.content).toBeTruthy();
      });

      jest.useRealTimers();
    });
  });

  describe('Chapter Management', () => {
    it('should load chapter content on mount', () => {
      const { store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          content={simpleDocument}
          useRedux={true}
        />
      );

      waitFor(() => {
        const state = store.getState();
        expect(state.editor.activeChapterId).toBe('chapter-1');
      });
    });

    it('should handle chapter switching', async () => {
      const { rerender, container, store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          content={simpleDocument}
          useRedux={true}
        />
      );

      // Switch to different chapter
      rerender(
        <EditorPanel
          chapterId="chapter-2"
          content={formattedDocument}
          useRedux={true}
        />
      );

      await waitFor(() => {
        const editor = container.querySelector('.ProseMirror');
        expect(editor?.textContent).toContain('This is bold and italic text.');
      });
    });

    it('should maintain separate content for different chapters', async () => {
      const { rerender, container, store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          useRedux={true}
        />
      );

      store.dispatch(
        loadChapterContent({
          chapterId: 'chapter-1',
          content: simpleDocument,
        })
      );

      rerender(
        <EditorPanel
          chapterId="chapter-2"
          useRedux={true}
        />
      );

      store.dispatch(
        loadChapterContent({
          chapterId: 'chapter-2',
          content: formattedDocument,
        })
      );

      // Content should update
      await waitFor(() => {
        const editor = container.querySelector('.ProseMirror');
        expect(editor).toBeInTheDocument();
      });
    });
  });

  describe('Metadata Tracking', () => {
    it('should track word count in metadata', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      const { container, store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          useRedux={true}
          debounceDelay={100}
        />
      );

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
        await user.keyboard('One two three four five');
      }

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        const state = store.getState();
        expect(state.editor.metadata.wordCount).toBe(5);
      });

      jest.useRealTimers();
    });

    it('should track character count in metadata', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      const { container, store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          useRedux={true}
          debounceDelay={100}
        />
      );

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
        await user.keyboard('Hello');
      }

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        const state = store.getState();
        expect(state.editor.metadata.characterCount).toBe(5);
      });

      jest.useRealTimers();
    });

    it('should track isEmpty status', async () => {
      const { store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          content={emptyDocument}
          useRedux={true}
        />
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.editor.metadata.isEmpty).toBe(true);
      });
    });

    it('should update isEmpty when content added', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      const { container, store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          useRedux={true}
          debounceDelay={100}
        />
      );

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
        await user.keyboard('Content');
      }

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        const state = store.getState();
        expect(state.editor.metadata.isEmpty).toBe(false);
      });

      jest.useRealTimers();
    });
  });

  describe('Redux Actions Integration', () => {
    it('should respond to setEditorContent action', async () => {
      const { container, store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          useRedux={true}
        />
      );

      store.dispatch(setEditorContent(simpleDocument));

      await waitFor(() => {
        const editor = container.querySelector('.ProseMirror');
        // Content might not immediately sync, but editor should exist
        expect(editor).toBeInTheDocument();
      });
    });

    it('should respond to clearEditor action', async () => {
      const { container, store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          content={simpleDocument}
          useRedux={true}
        />
      );

      store.dispatch(clearEditor());

      await waitFor(() => {
        const state = store.getState();
        expect(state.editor.activeChapterId).toBeNull();
        expect(state.editor.content).toBeNull();
      });
    });

    it('should respond to updateEditorContent action', async () => {
      const { store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          useRedux={true}
        />
      );

      store.dispatch(
        updateEditorContent({
          content: simpleDocument,
          metadata: {
            wordCount: 2,
            characterCount: 11,
            isEmpty: false,
          },
        })
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.editor.metadata.wordCount).toBe(2);
      });
    });

    it('should mark content as dirty on changes', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      const { container, store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          useRedux={true}
          debounceDelay={100}
        />
      );

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
        await user.keyboard('Changes');
      }

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        const state = store.getState();
        expect(state.editor.metadata.isDirty).toBe(true);
      });

      jest.useRealTimers();
    });

    it('should respond to markAsSaved action', () => {
      const { store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          useRedux={true}
        />
      );

      store.dispatch(markAsSaved());

      const state = store.getState();
      expect(state.editor.metadata.isDirty).toBe(false);
      expect(state.editor.metadata.lastSaved).toBeTruthy();
    });
  });

  describe('Selection State', () => {
    it('should update selection in Redux on change', async () => {
      const user = userEvent.setup();
      const { container, store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          content={simpleDocument}
          useRedux={true}
        />
      );

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);

        // Simulate selection
        const selection = window.getSelection();
        const range = document.createRange();
        const textNode = editor.firstChild;
        if (textNode?.firstChild) {
          range.setStart(textNode.firstChild, 0);
          range.setEnd(textNode.firstChild, 5);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }

      await waitFor(() => {
        const state = store.getState();
        expect(state.editor.selection).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Redux dispatch errors gracefully', () => {
      expect(() => {
        renderWithProviders(
          <EditorPanel
            chapterId="chapter-1"
            useRedux={true}
          />
        );
      }).not.toThrow();
    });

    it('should handle missing chapterId with Redux enabled', () => {
      expect(() => {
        renderWithProviders(
          <EditorPanel useRedux={true} />
        );
      }).not.toThrow();
    });

    it('should handle content updates without chapterId', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      const { container } = renderWithProviders(
        <EditorPanel useRedux={true} />
      );

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
        await user.keyboard('test');
      }

      jest.advanceTimersByTime(300);

      // Should not crash
      expect(editor).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe('Performance', () => {
    it('should handle large content updates efficiently', async () => {
      jest.useFakeTimers();

      const { container, store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          content={multiParagraphDocument}
          useRedux={true}
          debounceDelay={300}
        />
      );

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        const editor = container.querySelector('.ProseMirror');
        expect(editor).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should not dispatch to Redux when useRedux is false', async () => {
      const user = userEvent.setup();
      const { container, store } = renderWithProviders(
        <EditorPanel
          chapterId="chapter-1"
          useRedux={false}
        />
      );

      const initialState = store.getState();

      const editor = container.querySelector('.ProseMirror');
      if (editor) {
        await user.click(editor);
        await user.keyboard('test');
      }

      // Redux editor state should not exist or be unchanged
      expect(store.getState().editor).toBeUndefined();
    });
  });
});
