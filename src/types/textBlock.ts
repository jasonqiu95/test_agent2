/**
 * TextBlock definitions for structured text content
 */

import { Metadata, Location } from './common';
import { StyleReference } from './style';
import { TextFeature } from './textFeature';

export interface TextBlock extends Metadata {
  content: string;
  blockType: 'paragraph' | 'heading' | 'preformatted' | 'code';
  style?: StyleReference;
  features?: TextFeature[];
  location?: Location;
  language?: string; // For code blocks
  level?: number; // For headings
}
