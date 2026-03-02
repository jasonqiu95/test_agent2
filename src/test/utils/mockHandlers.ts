/**
 * Mock API Handlers for Testing
 * Provides mock implementations of API calls and data fetching
 */

import { Book } from '../../types/book';
import { Chapter } from '../../types/chapter';
import { Element } from '../../types/element';
import {
  simpleBook,
  complexBook,
  emptyBook,
  bookWithParts,
  bookWithOnlyFrontMatter,
  allBookFixtures,
} from '../fixtures/bookData';

/**
 * Mock API response structure
 */
export interface MockApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Mock delay for simulating network requests
 */
const DEFAULT_DELAY = 100;

/**
 * Simulates a network delay
 */
const simulateDelay = (ms: number = DEFAULT_DELAY): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Mock Book API
 */
export class MockBookApi {
  private books: Map<string, Book>;
  private shouldFail: boolean = false;
  private delay: number = DEFAULT_DELAY;

  constructor(initialBooks?: Book[]) {
    this.books = new Map();

    // Add default fixtures
    Object.values(allBookFixtures).forEach(book => {
      this.books.set(book.id, book);
    });

    // Add any additional books
    initialBooks?.forEach(book => {
      this.books.set(book.id, book);
    });
  }

  /**
   * Configure the mock to fail on next call
   */
  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  /**
   * Configure the mock delay
   */
  setDelay(delay: number): void {
    this.delay = delay;
  }

  /**
   * Get all books
   */
  async getAllBooks(): Promise<MockApiResponse<Book[]>> {
    await simulateDelay(this.delay);

    if (this.shouldFail) {
      return {
        status: 500,
        error: 'Failed to fetch books',
      };
    }

    return {
      status: 200,
      data: Array.from(this.books.values()),
    };
  }

  /**
   * Get a book by ID
   */
  async getBookById(id: string): Promise<MockApiResponse<Book>> {
    await simulateDelay(this.delay);

    if (this.shouldFail) {
      return {
        status: 500,
        error: 'Failed to fetch book',
      };
    }

    const book = this.books.get(id);

    if (!book) {
      return {
        status: 404,
        error: 'Book not found',
      };
    }

    return {
      status: 200,
      data: book,
    };
  }

  /**
   * Get chapters for a book
   */
  async getChapters(bookId: string): Promise<MockApiResponse<Chapter[]>> {
    await simulateDelay(this.delay);

    if (this.shouldFail) {
      return {
        status: 500,
        error: 'Failed to fetch chapters',
      };
    }

    const book = this.books.get(bookId);

    if (!book) {
      return {
        status: 404,
        error: 'Book not found',
      };
    }

    return {
      status: 200,
      data: book.chapters || [],
    };
  }

  /**
   * Get a specific chapter
   */
  async getChapter(bookId: string, chapterId: string): Promise<MockApiResponse<Chapter>> {
    await simulateDelay(this.delay);

    if (this.shouldFail) {
      return {
        status: 500,
        error: 'Failed to fetch chapter',
      };
    }

    const book = this.books.get(bookId);

    if (!book) {
      return {
        status: 404,
        error: 'Book not found',
      };
    }

    const chapter = book.chapters?.find(c => c.id === chapterId);

    if (!chapter) {
      return {
        status: 404,
        error: 'Chapter not found',
      };
    }

    return {
      status: 200,
      data: chapter,
    };
  }

  /**
   * Get front matter for a book
   */
  async getFrontMatter(bookId: string): Promise<MockApiResponse<Element[]>> {
    await simulateDelay(this.delay);

    if (this.shouldFail) {
      return {
        status: 500,
        error: 'Failed to fetch front matter',
      };
    }

    const book = this.books.get(bookId);

    if (!book) {
      return {
        status: 404,
        error: 'Book not found',
      };
    }

    return {
      status: 200,
      data: book.frontMatter || [],
    };
  }

  /**
   * Get back matter for a book
   */
  async getBackMatter(bookId: string): Promise<MockApiResponse<Element[]>> {
    await simulateDelay(this.delay);

    if (this.shouldFail) {
      return {
        status: 500,
        error: 'Failed to fetch back matter',
      };
    }

    const book = this.books.get(bookId);

    if (!book) {
      return {
        status: 404,
        error: 'Book not found',
      };
    }

    return {
      status: 200,
      data: book.backMatter || [],
    };
  }

  /**
   * Get a specific element (front or back matter)
   */
  async getElement(bookId: string, elementId: string): Promise<MockApiResponse<Element>> {
    await simulateDelay(this.delay);

    if (this.shouldFail) {
      return {
        status: 500,
        error: 'Failed to fetch element',
      };
    }

    const book = this.books.get(bookId);

    if (!book) {
      return {
        status: 404,
        error: 'Book not found',
      };
    }

    const element = [...(book.frontMatter || []), ...(book.backMatter || [])].find(
      e => e.id === elementId
    );

    if (!element) {
      return {
        status: 404,
        error: 'Element not found',
      };
    }

    return {
      status: 200,
      data: element,
    };
  }

  /**
   * Add a book to the mock database
   */
  addBook(book: Book): void {
    this.books.set(book.id, book);
  }

  /**
   * Remove a book from the mock database
   */
  removeBook(bookId: string): void {
    this.books.delete(bookId);
  }

  /**
   * Clear all books
   */
  clear(): void {
    this.books.clear();
  }

  /**
   * Reset to default fixtures
   */
  reset(): void {
    this.books.clear();
    Object.values(allBookFixtures).forEach(book => {
      this.books.set(book.id, book);
    });
    this.shouldFail = false;
    this.delay = DEFAULT_DELAY;
  }
}

/**
 * Global mock API instance
 */
export const mockBookApi = new MockBookApi();

/**
 * Mock fetch function that can be used to override global fetch
 */
export const createMockFetch = (api: MockBookApi) => {
  return async (url: string, options?: RequestInit): Promise<Response> => {
    // Parse the URL to determine which API endpoint is being called
    const urlObj = new URL(url, 'http://localhost');
    const pathname = urlObj.pathname;

    let response: MockApiResponse<any>;

    if (pathname === '/api/books') {
      response = await api.getAllBooks();
    } else if (pathname.match(/\/api\/books\/([^/]+)$/)) {
      const bookId = pathname.split('/').pop()!;
      response = await api.getBookById(bookId);
    } else if (pathname.match(/\/api\/books\/([^/]+)\/chapters$/)) {
      const bookId = pathname.split('/')[3];
      response = await api.getChapters(bookId);
    } else if (pathname.match(/\/api\/books\/([^/]+)\/chapters\/([^/]+)$/)) {
      const [, , , bookId, , chapterId] = pathname.split('/');
      response = await api.getChapter(bookId, chapterId);
    } else if (pathname.match(/\/api\/books\/([^/]+)\/front-matter$/)) {
      const bookId = pathname.split('/')[3];
      response = await api.getFrontMatter(bookId);
    } else if (pathname.match(/\/api\/books\/([^/]+)\/back-matter$/)) {
      const bookId = pathname.split('/')[3];
      response = await api.getBackMatter(bookId);
    } else if (pathname.match(/\/api\/books\/([^/]+)\/elements\/([^/]+)$/)) {
      const [, , , bookId, , elementId] = pathname.split('/');
      response = await api.getElement(bookId, elementId);
    } else {
      response = {
        status: 404,
        error: 'Not found',
      };
    }

    return new Response(JSON.stringify(response.data || { error: response.error }), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };
};

/**
 * Setup mock fetch globally
 */
export const setupMockFetch = (api: MockBookApi = mockBookApi): void => {
  global.fetch = createMockFetch(api) as any;
};

/**
 * Reset mock fetch
 */
export const resetMockFetch = (): void => {
  mockBookApi.reset();
};

/**
 * Cleanup mock fetch
 */
export const cleanupMockFetch = (): void => {
  // Restore original fetch if needed
  delete (global as any).fetch;
};
