/**
 * Template exports and template library
 */

import { ElementTemplate, TemplateCategory } from '../../types/template';
import { copyrightTemplate } from './copyright';
import { dedicationTemplate } from './dedication';
import { aboutAuthorTemplate } from './aboutAuthor';
import { alsoByTemplate } from './alsoBy';
import { acknowledgementsTemplate } from './acknowledgments';
import { forewordTemplate } from './foreword';
import { prefaceTemplate } from './preface';
import { epilogueTemplate } from './epilogue';

// Export individual templates
export {
  copyrightTemplate,
  dedicationTemplate,
  aboutAuthorTemplate,
  alsoByTemplate,
  acknowledgementsTemplate,
  forewordTemplate,
  prefaceTemplate,
  epilogueTemplate,
};

// Front matter templates
export const frontMatterTemplates: ElementTemplate[] = [
  copyrightTemplate,
  dedicationTemplate,
  alsoByTemplate,
  forewordTemplate,
  prefaceTemplate,
];

// Back matter templates
export const backMatterTemplates: ElementTemplate[] = [
  epilogueTemplate,
  acknowledgementsTemplate,
  aboutAuthorTemplate,
];

// All templates organized by category
export const templateCategories: TemplateCategory[] = [
  {
    id: 'front-matter',
    name: 'Front Matter',
    description: 'Elements that appear before the main content',
    templates: frontMatterTemplates,
  },
  {
    id: 'back-matter',
    name: 'Back Matter',
    description: 'Elements that appear after the main content',
    templates: backMatterTemplates,
  },
];

// Get all templates as a flat array
export const allTemplates: ElementTemplate[] = [
  ...frontMatterTemplates,
  ...backMatterTemplates,
];

// Map for quick template lookup by ID
export const templateMap = new Map<string, ElementTemplate>(
  allTemplates.map(template => [template.id, template])
);
