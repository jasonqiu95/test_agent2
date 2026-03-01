/**
 * Template definitions for front/back matter elements
 */

import { Element, ElementType, MatterType } from './element';
import { TextBlock } from './textBlock';

export interface TemplateField {
  name: string;
  label: string;
  placeholder: string;
  type: 'text' | 'number' | 'year' | 'multiline' | 'image';
  required?: boolean;
  defaultValue?: string | number;
}

export interface ElementTemplate {
  id: string;
  type: ElementType;
  matter: MatterType;
  name: string;
  description: string;
  fields: TemplateField[];
  content: TextBlock[];
  includeInToc?: boolean;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  templates: ElementTemplate[];
}
