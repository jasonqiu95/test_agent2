/**
 * Chapter definitions
 */

import { Metadata } from './common';
import { StyleReference } from './style';
import { TextBlock } from './textBlock';

export interface Chapter extends Metadata {
  number?: number;
  title: string;
  subtitle?: string;
  content: TextBlock[];
  style?: StyleReference;
  epigraph?: string;
  epigraphAttribution?: string;
  wordCount?: number;
  includeInToc?: boolean;
  partNumber?: number; // For books divided into parts
  partTitle?: string;
}
