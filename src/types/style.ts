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
