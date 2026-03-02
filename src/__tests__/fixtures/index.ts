/**
 * Test fixtures index - exports all test fixtures for easy importing
 */

// Export all chapter fixtures
export * from './sampleChapters';
export * from './chapters';

// Export all book content fixtures
export * from './bookContent';

// Re-export types for convenience
export type { Book, Author } from '../../types/book';
export type { Chapter } from '../../types/chapter';
export type { Element, ElementType, MatterType } from '../../types/element';
export type { TextBlock } from '../../types/textBlock';
export type {
  TextFeature,
  TextFeatureType,
  Subhead,
  Break,
  Quote,
  Verse,
  List,
  ListItem,
  Link,
  Note,
} from '../../types/textFeature';
