/**
 * Style definitions for text formatting
 */

import { Metadata } from './common';

export interface Style extends Metadata {
  name: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecoration?: 'none' | 'underline' | 'overline' | 'line-through';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  lineHeight?: number | string;
  letterSpacing?: number | string;
  color?: string;
  backgroundColor?: string;
  padding?: string | number;
  margin?: string | number;
  border?: string;
  customProperties?: Record<string, string | number>;
}

export interface StyleReference {
  styleId: string;
  overrides?: Partial<Style>;
}

export type BookStyleCategory = 'serif' | 'sans-serif' | 'script' | 'modern';

export interface DropCapStyle {
  enabled: boolean;
  lines: number;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  marginRight?: string;
}

export interface HeadingStyle {
  fontFamily?: string;
  fontSize: string;
  fontWeight?: string;
  lineHeight?: string;
  marginTop?: string;
  marginBottom?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: string;
  color?: string;
}

export interface FirstParagraphStyle {
  enabled: boolean;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize' | 'small-caps';
  fontVariant?: string;
  letterSpacing?: string;
  fontSize?: string;
}

export interface SpacingConfig {
  paragraphSpacing: string;
  lineHeight: string;
  sectionSpacing: string;
  chapterSpacing: string;
}

export interface ColorScheme {
  text: string;
  heading: string;
  accent?: string;
  background?: string;
  dropCap?: string;
}

export interface BookStyle {
  id: string;
  name: string;
  description: string;
  category: BookStyleCategory;
  fonts: {
    body: string;
    heading: string;
    script?: string;
    fallback: string;
  };
  headings: {
    h1: HeadingStyle;
    h2: HeadingStyle;
    h3: HeadingStyle;
    h4?: HeadingStyle;
  };
  body: {
    fontSize: string;
    lineHeight: string;
    fontWeight?: string;
    textAlign?: 'left' | 'justify';
  };
  dropCap: DropCapStyle;
  ornamentalBreak: {
    enabled: boolean;
    symbol: string;
    spacing?: string;
    fontSize?: string;
  };
  firstParagraph: FirstParagraphStyle;
  spacing: SpacingConfig;
  colors: ColorScheme;
}
