/**
 * Text feature definitions (subheads, breaks, quotes, verse, lists, links, notes)
 */

import { Metadata, Location } from './common';
import { StyleReference } from './style';

export type TextFeatureType =
  | 'subhead'
  | 'break'
  | 'quote'
  | 'verse'
  | 'list'
  | 'link'
  | 'note'
  | 'image'
  | 'figure';

export interface BaseTextFeature extends Metadata {
  type: TextFeatureType;
  content?: string;
  style?: StyleReference;
  location?: Location;
}

export interface Subhead extends BaseTextFeature {
  type: 'subhead';
  content: string;
  level?: number;
}

export interface Break extends BaseTextFeature {
  type: 'break';
  breakType?: 'line' | 'section' | 'page' | 'scene';
  symbol?: string;
}

export interface Quote extends BaseTextFeature {
  type: 'quote';
  content: string;
  attribution?: string;
  source?: string;
  quoteType?: 'block' | 'inline' | 'epigraph';
}

export interface Verse extends BaseTextFeature {
  type: 'verse';
  lines: string[];
  stanza?: number;
  indentation?: number[];
}

export interface ListItem {
  content: string;
  level?: number;
  marker?: string;
  children?: ListItem[];
}

export interface List extends BaseTextFeature {
  type: 'list';
  items: ListItem[];
  listType: 'ordered' | 'unordered' | 'definition';
  startNumber?: number;
}

export interface Link extends BaseTextFeature {
  type: 'link';
  content: string;
  url: string;
  title?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  rel?: string;
}

export interface Note extends BaseTextFeature {
  type: 'note';
  content: string;
  noteType: 'footnote' | 'endnote' | 'sidenote' | 'inline';
  number?: number;
  symbol?: string;
  referenceId?: string;
}

export type ImageAlignment = 'left' | 'center' | 'right' | 'full-width';
export type ImageSizing = 'small' | 'medium' | 'large' | 'full' | 'custom';

export interface Image extends BaseTextFeature {
  type: 'image';
  /** Image source - can be URL, file path, or base64 data URI */
  src: string;
  /** Alternative text for accessibility */
  alt: string;
  /** Optional title attribute */
  title?: string;
  /** Image alignment */
  alignment?: ImageAlignment;
  /** Image sizing preset */
  sizing?: ImageSizing;
  /** Custom width (e.g., '300px', '50%') */
  width?: string;
  /** Custom height (e.g., '200px', 'auto') */
  height?: string;
  /** Whether this is a base64 embedded image */
  isBase64?: boolean;
  /** Additional CSS classes */
  cssClasses?: string[];
}

export interface Figure extends BaseTextFeature {
  type: 'figure';
  /** The image within the figure */
  image: Image;
  /** Optional caption */
  caption?: string;
  /** Figure alignment */
  alignment?: ImageAlignment;
  /** Additional CSS classes */
  cssClasses?: string[];
}

export type TextFeature = Subhead | Break | Quote | Verse | List | Link | Note | Image | Figure;
