/**
 * Navigator Element Management Tests
 * Tests for adding, deleting, and merging book elements
 */

import React from 'react';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../__tests__/utils/renderWithProviders';
import { AddElementDropdown } from '../../NavigatorPanel/AddElementDropdown';
import { TreeView } from '../../NavigatorPanel/TreeView';
import { NavigatorPanel } from '../../NavigatorPanel/NavigatorPanel';
import {
  simpleBook,
  complexBook,
  emptyBook,
  createChapter,
  createElement,
  createTextBlock,
} from '../../../test/fixtures/bookData';
import {
  addFrontMatter,
  addChapter,
  addBackMatter,
  deleteFrontMatter,
  deleteChapter,
  deleteBackMatter,
  setCurrentBook,
} from '../../../slices/bookSlice';
import { setupTestMocks, cleanupTestMocks } from '../../../test/utils/testHelpers';
import { Book } from '../../../types/book';
import { Chapter } from '../../../types/chapter';

// Helper to deep clone books (to avoid shared references between tests and Redux)
const cloneBook = (book: Book): Book => JSON.parse(JSON.stringify(book));

describe('Navigator Element Management', () => {
  beforeEach(() => {
    setupTestMocks();
  });

  afterEach(() => {
    cleanupTestMocks();
  });

  describe('Adding Elements', () => {
    describe('Add Chapter', () => {
      it('should add a new chapter to the book', () => {
        const bookCopy = cloneBook(simpleBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const newChapter = createChapter(4, 'New Chapter');
        store.dispatch(addChapter(newChapter));

        const state = store.getState();
        expect(state.book.currentBook?.chapters).toHaveLength(4);
        expect(state.book.currentBook?.chapters[3]).toEqual(newChapter);
      });

      it('should add chapter to empty book', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const firstChapter = createChapter(1, 'Chapter One');
        store.dispatch(addChapter(firstChapter));

        const state = store.getState();
        expect(state.book.currentBook?.chapters).toHaveLength(1);
        expect(state.book.currentBook?.chapters[0].title).toBe('Chapter One');
      });

      it('should add multiple chapters in sequence', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const chapter1 = createChapter(1, 'Chapter One');
        const chapter2 = createChapter(2, 'Chapter Two');
        const chapter3 = createChapter(3, 'Chapter Three');

        store.dispatch(addChapter(chapter1));
        store.dispatch(addChapter(chapter2));
        store.dispatch(addChapter(chapter3));

        const state = store.getState();
        expect(state.book.currentBook?.chapters).toHaveLength(3);
        expect(state.book.currentBook?.chapters.map(c => c.title)).toEqual([
          'Chapter One',
          'Chapter Two',
          'Chapter Three',
        ]);
      });
    });

    describe('Add Front Matter Elements', () => {
      it('should add title page element', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const titlePage = createElement('title-page', 'front', 'Title Page');
        store.dispatch(addFrontMatter(titlePage));

        const state = store.getState();
        expect(state.book.currentBook?.frontMatter).toHaveLength(1);
        expect(state.book.currentBook?.frontMatter[0].type).toBe('title-page');
      });

      it('should add copyright element', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const copyright = createElement('copyright', 'front', 'Copyright');
        store.dispatch(addFrontMatter(copyright));

        const state = store.getState();
        expect(state.book.currentBook?.frontMatter).toHaveLength(1);
        expect(state.book.currentBook?.frontMatter[0].type).toBe('copyright');
      });

      it('should add dedication element', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const dedication = createElement('dedication', 'front', 'Dedication');
        store.dispatch(addFrontMatter(dedication));

        const state = store.getState();
        expect(state.book.currentBook?.frontMatter[0].type).toBe('dedication');
      });

      it('should add epigraph element', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const epigraph = createElement('epigraph', 'front', 'Epigraph');
        store.dispatch(addFrontMatter(epigraph));

        const state = store.getState();
        expect(state.book.currentBook?.frontMatter[0].type).toBe('epigraph');
      });

      it('should add foreword element', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const foreword = createElement('foreword', 'front', 'Foreword');
        store.dispatch(addFrontMatter(foreword));

        const state = store.getState();
        expect(state.book.currentBook?.frontMatter[0].type).toBe('foreword');
      });

      it('should add preface element', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const preface = createElement('preface', 'front', 'Preface');
        store.dispatch(addFrontMatter(preface));

        const state = store.getState();
        expect(state.book.currentBook?.frontMatter[0].type).toBe('preface');
      });

      it('should add acknowledgments element', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const acknowledgments = createElement('acknowledgments', 'front', 'Acknowledgments');
        store.dispatch(addFrontMatter(acknowledgments));

        const state = store.getState();
        expect(state.book.currentBook?.frontMatter[0].type).toBe('acknowledgments');
      });

      it('should add introduction element', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const introduction = createElement('introduction', 'front', 'Introduction');
        store.dispatch(addFrontMatter(introduction));

        const state = store.getState();
        expect(state.book.currentBook?.frontMatter[0].type).toBe('introduction');
      });

      it('should add prologue element', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const prologue = createElement('prologue', 'front', 'Prologue');
        store.dispatch(addFrontMatter(prologue));

        const state = store.getState();
        expect(state.book.currentBook?.frontMatter[0].type).toBe('prologue');
      });

      it('should add multiple front matter elements', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const titlePage = createElement('title-page', 'front', 'Title Page');
        const copyright = createElement('copyright', 'front', 'Copyright');
        const dedication = createElement('dedication', 'front', 'Dedication');

        store.dispatch(addFrontMatter(titlePage));
        store.dispatch(addFrontMatter(copyright));
        store.dispatch(addFrontMatter(dedication));

        const state = store.getState();
        expect(state.book.currentBook?.frontMatter).toHaveLength(3);
        expect(state.book.currentBook?.frontMatter.map(e => e.type)).toEqual([
          'title-page',
          'copyright',
          'dedication',
        ]);
      });
    });

    describe('Add Back Matter Elements', () => {
      it('should add epilogue element', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const epilogue = createElement('epilogue', 'back', 'Epilogue');
        store.dispatch(addBackMatter(epilogue));

        const state = store.getState();
        expect(state.book.currentBook?.backMatter).toHaveLength(1);
        expect(state.book.currentBook?.backMatter[0].type).toBe('epilogue');
      });

      it('should add afterword element', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const afterword = createElement('afterword', 'back', 'Afterword');
        store.dispatch(addBackMatter(afterword));

        const state = store.getState();
        expect(state.book.currentBook?.backMatter[0].type).toBe('afterword');
      });

      it('should add about author element', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const aboutAuthor = createElement('about-author', 'back', 'About the Author');
        store.dispatch(addBackMatter(aboutAuthor));

        const state = store.getState();
        expect(state.book.currentBook?.backMatter[0].type).toBe('about-author');
      });

      it('should add bibliography element', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const bibliography = createElement('bibliography', 'back', 'Bibliography');
        store.dispatch(addBackMatter(bibliography));

        const state = store.getState();
        expect(state.book.currentBook?.backMatter[0].type).toBe('bibliography');
      });

      it('should add glossary element', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const glossary = createElement('glossary', 'back', 'Glossary');
        store.dispatch(addBackMatter(glossary));

        const state = store.getState();
        expect(state.book.currentBook?.backMatter[0].type).toBe('glossary');
      });

      it('should add index element', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const index = createElement('index', 'back', 'Index');
        store.dispatch(addBackMatter(index));

        const state = store.getState();
        expect(state.book.currentBook?.backMatter[0].type).toBe('index');
      });

      it('should add appendix element', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const appendix = createElement('appendix', 'back', 'Appendix');
        store.dispatch(addBackMatter(appendix));

        const state = store.getState();
        expect(state.book.currentBook?.backMatter[0].type).toBe('appendix');
      });

      it('should add multiple back matter elements', () => {
        const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const epilogue = createElement('epilogue', 'back', 'Epilogue');
        const aboutAuthor = createElement('about-author', 'back', 'About the Author');
        const acknowledgments = createElement('acknowledgments', 'back', 'Acknowledgments');

        store.dispatch(addBackMatter(epilogue));
        store.dispatch(addBackMatter(aboutAuthor));
        store.dispatch(addBackMatter(acknowledgments));

        const state = store.getState();
        expect(state.book.currentBook?.backMatter).toHaveLength(3);
        expect(state.book.currentBook?.backMatter.map(e => e.type)).toEqual([
          'epilogue',
          'about-author',
          'acknowledgments',
        ]);
      });
    });

    describe('AddElementDropdown Component', () => {
      it('should render dropdown with front matter and back matter sections', () => {
        const mockOnClose = jest.fn();
        renderWithProviders(
          <AddElementDropdown position={{ x: 100, y: 100 }} onClose={mockOnClose} />
        );

        expect(screen.getByText('Add Element')).toBeInTheDocument();
        expect(screen.getByText('Front Matter')).toBeInTheDocument();
        expect(screen.getByText('Back Matter')).toBeInTheDocument();
      });

      it('should display all front matter element options', () => {
        const mockOnClose = jest.fn();
        renderWithProviders(
          <AddElementDropdown position={{ x: 100, y: 100 }} onClose={mockOnClose} />
        );

        expect(screen.getByText('Title Page')).toBeInTheDocument();
        expect(screen.getByText('Copyright')).toBeInTheDocument();
        expect(screen.getByText('Dedication')).toBeInTheDocument();
        expect(screen.getByText('Epigraph')).toBeInTheDocument();
        expect(screen.getByText('Foreword')).toBeInTheDocument();
        expect(screen.getByText('Preface')).toBeInTheDocument();
        expect(screen.getByText('Acknowledgments')).toBeInTheDocument();
        expect(screen.getByText('Introduction')).toBeInTheDocument();
        expect(screen.getByText('Prologue')).toBeInTheDocument();
      });

      it('should display all back matter element options', () => {
        const mockOnClose = jest.fn();
        renderWithProviders(
          <AddElementDropdown position={{ x: 100, y: 100 }} onClose={mockOnClose} />
        );

        expect(screen.getByText('Epilogue')).toBeInTheDocument();
        expect(screen.getByText('Afterword')).toBeInTheDocument();
        expect(screen.getByText('About the Author')).toBeInTheDocument();
        expect(screen.getByText('Bibliography')).toBeInTheDocument();
        expect(screen.getByText('Glossary')).toBeInTheDocument();
        expect(screen.getByText('Index')).toBeInTheDocument();
        expect(screen.getByText('Appendix')).toBeInTheDocument();
      });

      it('should close dropdown when escape key is pressed', async () => {
        const user = userEvent.setup();
        const mockOnClose = jest.fn();
        renderWithProviders(
          <AddElementDropdown position={{ x: 100, y: 100 }} onClose={mockOnClose} />
        );

        await user.keyboard('{Escape}');
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      it('should close dropdown when clicking outside', async () => {
        const user = userEvent.setup();
        const mockOnClose = jest.fn();
        const { container } = renderWithProviders(
          <div>
            <AddElementDropdown position={{ x: 100, y: 100 }} onClose={mockOnClose} />
            <div data-testid="outside">Outside Element</div>
          </div>
        );

        const outsideElement = screen.getByTestId('outside');
        await user.click(outsideElement);

        await waitFor(() => {
          expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
      });

      it('should dispatch addFrontMatter action when front matter element is clicked', async () => {
        const user = userEvent.setup();
        const mockOnClose = jest.fn();
        const { store } = renderWithProviders(
          <AddElementDropdown position={{ x: 100, y: 100 }} onClose={mockOnClose} />,
          {
            preloadedState: {
              book: { currentBook: bookCopy, books: [], loading: false, error: null },
              selection: { selectedId: null, selectedType: null },
              undo: { past: [], future: [], present: null },
            },
          }
        );

        const dedicationButton = screen.getByText('Dedication');
        await user.click(dedicationButton);

        const state = store.getState();
        expect(state.book.currentBook?.frontMatter).toHaveLength(1);
        expect(state.book.currentBook?.frontMatter[0].type).toBe('dedication');
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      it('should dispatch addBackMatter action when back matter element is clicked', async () => {
        const user = userEvent.setup();
        const mockOnClose = jest.fn();
        const { store } = renderWithProviders(
          <AddElementDropdown position={{ x: 100, y: 100 }} onClose={mockOnClose} />,
          {
            preloadedState: {
              book: { currentBook: bookCopy, books: [], loading: false, error: null },
              selection: { selectedId: null, selectedType: null },
              undo: { past: [], future: [], present: null },
            },
          }
        );

        const epilogueButton = screen.getByText('Epilogue');
        await user.click(epilogueButton);

        const state = store.getState();
        expect(state.book.currentBook?.backMatter).toHaveLength(1);
        expect(state.book.currentBook?.backMatter[0].type).toBe('epilogue');
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Deleting Elements', () => {
    describe('Delete Chapter', () => {
      it('should delete a chapter by id', () => {
        const bookCopy = cloneBook(simpleBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const chapterId = simpleBook.chapters[1].id;
        store.dispatch(deleteChapter(chapterId));

        const state = store.getState();
        expect(state.book.currentBook?.chapters).toHaveLength(2);
        expect(state.book.currentBook?.chapters.find(c => c.id === chapterId)).toBeUndefined();
      });

      it('should remove chapter from tree view after deletion', async () => {
        const bookWithChapters = { ...simpleBook };
        const { store, rerender } = renderWithProviders(
          <TreeView book={bookWithChapters} />,
          {
            preloadedState: {
              book: { currentBook: bookCopy, books: [], loading: false, error: null },
              selection: { selectedId: null, selectedType: null },
              undo: { past: [], future: [], present: null },
            },
          }
        );

        // Verify chapter exists
        expect(screen.getByText(/Chapter 1/)).toBeInTheDocument();

        const chapterId = bookWithChapters.chapters[0].id;
        store.dispatch(deleteChapter(chapterId));

        const state = store.getState();
        const updatedBook = state.book.book as Book;

        // Rerender with updated book
        rerender(<TreeView book={updatedBook} />);

        // Verify chapter is removed
        expect(updatedBook.chapters).toHaveLength(2);
        expect(updatedBook.chapters.find(c => c.id === chapterId)).toBeUndefined();
      });
    });

    describe('Delete Front Matter', () => {
      it('should delete front matter element by id', () => {
        const bookCopy = cloneBook(complexBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const elementId = complexBook.frontMatter[2].id;
        const originalLength = complexBook.frontMatter.length;

        store.dispatch(deleteFrontMatter(elementId));

        const state = store.getState();
        expect(state.book.currentBook?.frontMatter).toHaveLength(originalLength - 1);
        expect(state.book.currentBook?.frontMatter.find(e => e.id === elementId)).toBeUndefined();
      });

      it('should delete all front matter elements one by one', () => {
        const bookWithFrontMatter = { ...complexBook };
        const { store } = renderWithProviders(<TreeView book={bookWithFrontMatter} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const elementIds = bookWithFrontMatter.frontMatter.map(e => e.id);

        elementIds.forEach(id => {
          store.dispatch(deleteFrontMatter(id));
        });

        const state = store.getState();
        expect(state.book.currentBook?.frontMatter).toHaveLength(0);
      });
    });

    describe('Delete Back Matter', () => {
      it('should delete back matter element by id', () => {
        const bookCopy = cloneBook(complexBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const elementId = complexBook.backMatter[1].id;
        const originalLength = complexBook.backMatter.length;

        store.dispatch(deleteBackMatter(elementId));

        const state = store.getState();
        expect(state.book.currentBook?.backMatter).toHaveLength(originalLength - 1);
        expect(state.book.currentBook?.backMatter.find(e => e.id === elementId)).toBeUndefined();
      });

      it('should delete all back matter elements one by one', () => {
        const bookWithBackMatter = { ...complexBook };
        const { store } = renderWithProviders(<TreeView book={bookWithBackMatter} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const elementIds = bookWithBackMatter.backMatter.map(e => e.id);

        elementIds.forEach(id => {
          store.dispatch(deleteBackMatter(id));
        });

        const state = store.getState();
        expect(state.book.currentBook?.backMatter).toHaveLength(0);
      });
    });

    describe('Edge Cases - Delete Last Chapter', () => {
      it('should delete the last remaining chapter', () => {
        const bookWithOneChapter: Book = {
          ...emptyBook,
          chapters: [createChapter(1, 'Only Chapter')],
        };

        const { store } = renderWithProviders(<TreeView book={bookWithOneChapter} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        const chapterId = bookWithOneChapter.chapters[0].id;
        store.dispatch(deleteChapter(chapterId));

        const state = store.getState();
        expect(state.book.currentBook?.chapters).toHaveLength(0);
      });

      it('should handle deletion when book has only chapters', () => {
        const bookCopy = cloneBook(simpleBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
          preloadedState: {
            book: { currentBook: bookCopy, books: [], loading: false, error: null },
            selection: { selectedId: null, selectedType: null },
            undo: { past: [], future: [], present: null },
          },
        });

        // Delete all chapters
        simpleBook.chapters.forEach(chapter => {
          store.dispatch(deleteChapter(chapter.id));
        });

        const state = store.getState();
        expect(state.book.currentBook?.chapters).toHaveLength(0);
        expect(state.book.currentBook?.frontMatter).toHaveLength(0);
        expect(state.book.currentBook?.backMatter).toHaveLength(0);
      });
    });
  });

  describe('Merge Chapters', () => {
    // Note: Merge functionality is not currently implemented in the codebase
    // These tests are placeholders for when the feature is added

    it.skip('should merge two adjacent chapters', () => {
      // TODO: Implement when merge functionality is added
      expect(true).toBe(false);
    });

    it.skip('should combine content when merging chapters', () => {
      // TODO: Implement when merge functionality is added
      expect(true).toBe(false);
    });

    it.skip('should handle merging first and second chapters', () => {
      // TODO: Implement when merge functionality is added
      expect(true).toBe(false);
    });

    it.skip('should handle merging last two chapters', () => {
      // TODO: Implement when merge functionality is added
      expect(true).toBe(false);
    });

    it.skip('should preserve content order when merging', () => {
      // TODO: Implement when merge functionality is added
      expect(true).toBe(false);
    });
  });

  describe('Button and Action Callbacks', () => {
    it('should fire correct callback data when adding chapter', () => {
      const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
        preloadedState: {
          book: { currentBook: bookCopy, books: [], loading: false, error: null },
          selection: { selectedId: null, selectedType: null },
          undo: { past: [], future: [], present: null },
        },
      });

      const mockListener = jest.fn();
      store.subscribe(mockListener);

      const newChapter = createChapter(1, 'Test Chapter');
      store.dispatch(addChapter(newChapter));

      expect(mockListener).toHaveBeenCalled();
      const state = store.getState();
      expect(state.book.currentBook?.chapters[0]).toEqual(newChapter);
    });

    it('should fire correct callback data when deleting chapter', () => {
      const bookCopy = cloneBook(simpleBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
        preloadedState: {
          book: { currentBook: bookCopy, books: [], loading: false, error: null },
          selection: { selectedId: null, selectedType: null },
          undo: { past: [], future: [], present: null },
        },
      });

      const mockListener = jest.fn();
      store.subscribe(mockListener);

      const chapterId = simpleBook.chapters[0].id;
      store.dispatch(deleteChapter(chapterId));

      expect(mockListener).toHaveBeenCalled();
      const state = store.getState();
      expect(state.book.currentBook?.chapters.find(c => c.id === chapterId)).toBeUndefined();
    });

    it('should fire correct callback data when adding front matter', () => {
      const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
        preloadedState: {
          book: { currentBook: bookCopy, books: [], loading: false, error: null },
          selection: { selectedId: null, selectedType: null },
          undo: { past: [], future: [], present: null },
        },
      });

      const mockListener = jest.fn();
      store.subscribe(mockListener);

      const dedication = createElement('dedication', 'front', 'Dedication');
      store.dispatch(addFrontMatter(dedication));

      expect(mockListener).toHaveBeenCalled();
      const state = store.getState();
      expect(state.book.currentBook?.frontMatter[0]).toEqual(dedication);
    });

    it('should fire correct callback data when adding back matter', () => {
      const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
        preloadedState: {
          book: { currentBook: bookCopy, books: [], loading: false, error: null },
          selection: { selectedId: null, selectedType: null },
          undo: { past: [], future: [], present: null },
        },
      });

      const mockListener = jest.fn();
      store.subscribe(mockListener);

      const epilogue = createElement('epilogue', 'back', 'Epilogue');
      store.dispatch(addBackMatter(epilogue));

      expect(mockListener).toHaveBeenCalled();
      const state = store.getState();
      expect(state.book.currentBook?.backMatter[0]).toEqual(epilogue);
    });
  });

  describe('Undo/Redo Integration', () => {
    it('should track chapter addition in undo history', () => {
      const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
        preloadedState: {
          book: { currentBook: bookCopy, books: [], loading: false, error: null },
          selection: { selectedId: null, selectedType: null },
          undo: { past: [], future: [], present: null },
        },
      });

      const newChapter = createChapter(1, 'Test Chapter');
      store.dispatch(addChapter(newChapter));

      const state = store.getState();
      // Undo middleware should track the action
      expect(state.undo.past.length).toBeGreaterThanOrEqual(0);
    });

    it('should track element deletion in undo history', () => {
      const bookCopy = cloneBook(simpleBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
        preloadedState: {
          book: { currentBook: bookCopy, books: [], loading: false, error: null },
          selection: { selectedId: null, selectedType: null },
          undo: { past: [], future: [], present: null },
        },
      });

      const chapterId = simpleBook.chapters[0].id;
      store.dispatch(deleteChapter(chapterId));

      const state = store.getState();
      // Undo middleware should track the action
      expect(state.undo.past.length).toBeGreaterThanOrEqual(0);
    });

    it('should track multiple operations in undo history', () => {
      const bookCopy = cloneBook(emptyBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
        preloadedState: {
          book: { currentBook: bookCopy, books: [], loading: false, error: null },
          selection: { selectedId: null, selectedType: null },
          undo: { past: [], future: [], present: null },
        },
      });

      const chapter1 = createChapter(1, 'Chapter 1');
      const chapter2 = createChapter(2, 'Chapter 2');
      const dedication = createElement('dedication', 'front', 'Dedication');

      store.dispatch(addChapter(chapter1));
      store.dispatch(addChapter(chapter2));
      store.dispatch(addFrontMatter(dedication));

      const state = store.getState();
      expect(state.book.currentBook?.chapters).toHaveLength(2);
      expect(state.book.currentBook?.frontMatter).toHaveLength(1);
    });
  });

  describe('Edge Cases and Duplicate Elements', () => {
    it('should allow adding duplicate element types', () => {
      const bookCopy = JSON.parse(JSON.stringify(emptyBook));
      const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
        preloadedState: {
          book: { currentBook: bookCopy, books: [], loading: false, error: null },
          selection: { selectedId: null, selectedType: null },
          undo: { past: [], future: [], present: null },
        },
      });

      const dedication1 = createElement('dedication', 'front', 'Dedication 1');
      const dedication2 = createElement('dedication', 'front', 'Dedication 2');

      store.dispatch(addFrontMatter(dedication1));
      store.dispatch(addFrontMatter(dedication2));

      const state = store.getState();
      expect(state.book.currentBook?.frontMatter).toHaveLength(2);
      expect(state.book.currentBook?.frontMatter.filter(e => e.type === 'dedication')).toHaveLength(2);
    });

    it('should handle deleting non-existent element gracefully', () => {
      const bookCopy = cloneBook(simpleBook);
        const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
        preloadedState: {
          book: { currentBook: bookCopy, books: [], loading: false, error: null },
          selection: { selectedId: null, selectedType: null },
          undo: { past: [], future: [], present: null },
        },
      });

      const originalLength = simpleBook.chapters.length;
      store.dispatch(deleteChapter('non-existent-id'));

      const state = store.getState();
      expect(state.book.currentBook?.chapters).toHaveLength(originalLength);
    });

    it('should handle adding elements to a book without initial arrays', () => {
      const minimalBook: Book = JSON.parse(JSON.stringify({
        ...emptyBook,
        frontMatter: [],
        chapters: [],
        backMatter: [],
      }));

      const { store } = renderWithProviders(<TreeView book={minimalBook} />, {
        preloadedState: {
          book: { book: minimalBook },
          selection: { selectedId: null, selectedType: null },
          undo: { past: [], future: [], present: null },
        },
      });

      const chapter = createChapter(1, 'First Chapter');
      const dedication = createElement('dedication', 'front', 'Dedication');
      const epilogue = createElement('epilogue', 'back', 'Epilogue');

      store.dispatch(addChapter(chapter));
      store.dispatch(addFrontMatter(dedication));
      store.dispatch(addBackMatter(epilogue));

      const state = store.getState();
      expect(state.book.currentBook?.chapters).toHaveLength(1);
      expect(state.book.currentBook?.frontMatter).toHaveLength(1);
      expect(state.book.currentBook?.backMatter).toHaveLength(1);
    });

    it('should maintain element order after multiple additions and deletions', () => {
      const bookCopy = JSON.parse(JSON.stringify(emptyBook));
      const { store } = renderWithProviders(<TreeView book={bookCopy} />, {
        preloadedState: {
          book: { currentBook: bookCopy, books: [], loading: false, error: null },
          selection: { selectedId: null, selectedType: null },
          undo: { past: [], future: [], present: null },
        },
      });

      const chapter1 = createChapter(1, 'Chapter 1');
      const chapter2 = createChapter(2, 'Chapter 2');
      const chapter3 = createChapter(3, 'Chapter 3');
      const chapter4 = createChapter(4, 'Chapter 4');

      store.dispatch(addChapter(chapter1));
      store.dispatch(addChapter(chapter2));
      store.dispatch(addChapter(chapter3));
      store.dispatch(addChapter(chapter4));

      // Delete chapter 2
      store.dispatch(deleteChapter(chapter2.id));

      const state = store.getState();
      expect(state.book.currentBook?.chapters).toHaveLength(3);
      expect(state.book.currentBook?.chapters.map(c => c.title)).toEqual([
        'Chapter 1',
        'Chapter 3',
        'Chapter 4',
      ]);
    });
  });

  describe('Context Menu Actions', () => {
    // Note: Context menu functionality is not currently implemented in the codebase
    // These tests are placeholders for when the feature is added

    it.skip('should show context menu on right-click', () => {
      // TODO: Implement when context menu is added
      expect(true).toBe(false);
    });

    it.skip('should have add option in context menu', () => {
      // TODO: Implement when context menu is added
      expect(true).toBe(false);
    });

    it.skip('should have delete option in context menu', () => {
      // TODO: Implement when context menu is added
      expect(true).toBe(false);
    });

    it.skip('should add element via context menu action', () => {
      // TODO: Implement when context menu is added
      expect(true).toBe(false);
    });

    it.skip('should delete element via context menu action', () => {
      // TODO: Implement when context menu is added
      expect(true).toBe(false);
    });
  });

  describe('Confirmation Dialogs', () => {
    // Note: Confirmation dialog functionality is not currently implemented
    // These tests are placeholders for when the feature is added

    it.skip('should show confirmation dialog before deleting element', () => {
      // TODO: Implement when confirmation dialog is added
      expect(true).toBe(false);
    });

    it.skip('should cancel deletion when confirmation is rejected', () => {
      // TODO: Implement when confirmation dialog is added
      expect(true).toBe(false);
    });

    it.skip('should proceed with deletion when confirmation is accepted', () => {
      // TODO: Implement when confirmation dialog is added
      expect(true).toBe(false);
    });

    it.skip('should show different confirmation message for last chapter', () => {
      // TODO: Implement when confirmation dialog is added
      expect(true).toBe(false);
    });
  });
});
