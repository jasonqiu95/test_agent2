/**
 * Element definitions for front and back matter
 */

import { Metadata } from './common';
import { StyleReference } from './style';
import { TextBlock } from './textBlock';

export type ElementType =
  | 'title-page'
  | 'copyright'
  | 'dedication'
  | 'epigraph'
  | 'foreword'
  | 'preface'
  | 'acknowledgments'
  | 'introduction'
  | 'prologue'
  | 'epilogue'
  | 'afterword'
  | 'appendix'
  | 'glossary'
  | 'bibliography'
  | 'index'
  | 'about-author'
  | 'also-by'
  | 'other';

export type MatterType = 'front' | 'body' | 'back';

export interface Element extends Metadata {
  type: ElementType;
  matter: MatterType;
  title: string;
  content: TextBlock[];
  style?: StyleReference;
  order?: number;
  includeInToc?: boolean;
}
