/**
 * TextBlock definitions for structured text content
 */

import { Metadata, Location } from './common';
import { StyleReference } from './style';
import { TextFeature } from './textFeature';
import { RichText } from './inlineText';

export interface TextBlock extends Metadata {
  content: string;
  richText?: RichText; // Rich text with inline formatting
  blockType: 'paragraph' | 'heading' | 'preformatted' | 'code' | 'list';
  style?: StyleReference & {
    alignment?: 'left' | 'center' | 'right' | 'justify';
  };
  features?: TextFeature[];
  location?: Location;
  language?: string; // For code blocks
  level?: number; // For headings (1-6)
  listType?: 'ordered' | 'unordered'; // For list blocks
  indentLevel?: number; // For nested lists (0-6)
}
