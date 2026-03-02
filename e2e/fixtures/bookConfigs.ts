/**
 * Test book configurations
 *
 * These fixtures provide various book configuration scenarios
 * for testing different settings and preferences.
 */

import type { Book } from '../../src/types/book';

/**
 * Book configuration options
 */
export interface BookConfig {
  title?: string;
  authors?: string[];
  status?: Book['status'];
  language?: string;
  genre?: string[];
  includeMetadata?: boolean;
  includeFrontMatter?: boolean;
  includeBackMatter?: boolean;
  chapterCount?: number;
}

/**
 * Default book configuration
 */
export const defaultConfig: BookConfig = {
  title: 'Test Book',
  authors: ['Test Author'],
  status: 'draft',
  language: 'English',
  genre: ['Fiction'],
  includeMetadata: true,
  includeFrontMatter: false,
  includeBackMatter: false,
  chapterCount: 3,
};

/**
 * Minimal book configuration
 */
export const minimalConfig: BookConfig = {
  title: 'Minimal',
  authors: [],
  status: 'draft',
  includeMetadata: false,
  includeFrontMatter: false,
  includeBackMatter: false,
  chapterCount: 1,
};

/**
 * Complete book configuration (with all optional elements)
 */
export const completeConfig: BookConfig = {
  title: 'Complete Test Book',
  authors: ['Author One', 'Author Two'],
  status: 'review',
  language: 'English',
  genre: ['Fiction', 'Fantasy', 'Adventure'],
  includeMetadata: true,
  includeFrontMatter: true,
  includeBackMatter: true,
  chapterCount: 10,
};

/**
 * Non-fiction book configuration
 */
export const nonFictionConfig: BookConfig = {
  title: 'The Art of Testing',
  authors: ['Expert Tester'],
  status: 'draft',
  language: 'English',
  genre: ['Non-Fiction', 'Technology', 'Education'],
  includeMetadata: true,
  includeFrontMatter: true,
  includeBackMatter: true,
  chapterCount: 12,
};

/**
 * Novel configuration
 */
export const novelConfig: BookConfig = {
  title: 'The Testing Chronicles',
  authors: ['Fiction Writer'],
  status: 'draft',
  language: 'English',
  genre: ['Fiction', 'Science Fiction'],
  includeMetadata: true,
  includeFrontMatter: true,
  includeBackMatter: true,
  chapterCount: 25,
};

/**
 * Short story collection configuration
 */
export const shortStoryConfig: BookConfig = {
  title: 'Tales of Testing',
  authors: ['Story Teller'],
  status: 'draft',
  language: 'English',
  genre: ['Fiction', 'Short Stories'],
  includeMetadata: true,
  includeFrontMatter: true,
  includeBackMatter: false,
  chapterCount: 15,
};

/**
 * Academic book configuration
 */
export const academicConfig: BookConfig = {
  title: 'Advanced Software Testing Techniques',
  authors: ['Dr. Test Expert', 'Prof. Quality Assurance'],
  status: 'review',
  language: 'English',
  genre: ['Non-Fiction', 'Academic', 'Technology'],
  includeMetadata: true,
  includeFrontMatter: true,
  includeBackMatter: true,
  chapterCount: 20,
};

/**
 * Configuration for testing multi-language support
 */
export const multiLanguageConfigs: Record<string, BookConfig> = {
  english: {
    title: 'English Book',
    authors: ['English Author'],
    language: 'English',
    status: 'draft',
  },
  spanish: {
    title: 'Libro Español',
    authors: ['Autor Español'],
    language: 'Spanish',
    status: 'draft',
  },
  french: {
    title: 'Livre Français',
    authors: ['Auteur Français'],
    language: 'French',
    status: 'draft',
  },
  german: {
    title: 'Deutsches Buch',
    authors: ['Deutscher Autor'],
    language: 'German',
    status: 'draft',
  },
};

/**
 * Configuration for testing different book statuses
 */
export const statusConfigs: Record<Book['status'], BookConfig> = {
  draft: {
    title: 'Draft Book',
    status: 'draft',
  },
  review: {
    title: 'Book in Review',
    status: 'review',
  },
  published: {
    title: 'Published Book',
    status: 'published',
  },
  archived: {
    title: 'Archived Book',
    status: 'archived',
  },
};

/**
 * Export configurations for different scenarios
 */
export const exportConfigs = {
  pdf: {
    format: 'pdf',
    includeMetadata: true,
    includeTOC: true,
    pageSize: 'A4',
    margins: { top: 1, right: 1, bottom: 1, left: 1 },
  },
  epub: {
    format: 'epub',
    includeMetadata: true,
    includeTOC: true,
    version: '3.0',
  },
  docx: {
    format: 'docx',
    includeMetadata: true,
    preserveFormatting: true,
  },
  markdown: {
    format: 'md',
    includeMetadata: false,
    syntax: 'commonmark',
  },
};

/**
 * All predefined book configurations
 */
export const bookConfigs = {
  default: defaultConfig,
  minimal: minimalConfig,
  complete: completeConfig,
  nonFiction: nonFictionConfig,
  novel: novelConfig,
  shortStory: shortStoryConfig,
  academic: academicConfig,
  multiLanguage: multiLanguageConfigs,
  status: statusConfigs,
  export: exportConfigs,
};

/**
 * Helper to merge configuration with defaults
 */
export function mergeConfig(
  config: Partial<BookConfig>
): BookConfig {
  return {
    ...defaultConfig,
    ...config,
  };
}

/**
 * Helper to validate configuration
 */
export function validateConfig(config: BookConfig): boolean {
  if (!config.title || config.title.trim() === '') {
    return false;
  }
  if (config.chapterCount !== undefined && config.chapterCount < 0) {
    return false;
  }
  return true;
}
