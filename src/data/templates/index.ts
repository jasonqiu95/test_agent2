/**
 * Template exports and template library
 */

import { ElementTemplate, TemplateCategory } from '../../types/template';
import { titlePageTemplate } from './titlePage';
import { copyrightTemplate } from './copyright';
import { dedicationTemplate } from './dedication';
import { epigraphTemplate } from './epigraph';
import { forewordTemplate } from './foreword';
import { prefaceTemplate } from './preface';
import { acknowledgementsTemplate } from './acknowledgments';
import { introductionTemplate } from './introduction';
import { prologueTemplate } from './prologue';
import { epilogueTemplate } from './epilogue';
import { afterwordTemplate } from './afterword';
import { aboutAuthorTemplate } from './aboutAuthor';
import { bibliographyTemplate } from './bibliography';
import { glossaryTemplate } from './glossary';
import { indexTemplate } from './indexTemplate';
import { appendixTemplate } from './appendix';
import { alsoByTemplate } from './alsoBy';

// Export individual templates
export {
  titlePageTemplate,
  copyrightTemplate,
  dedicationTemplate,
  epigraphTemplate,
  forewordTemplate,
  prefaceTemplate,
  acknowledgementsTemplate,
  introductionTemplate,
  prologueTemplate,
  epilogueTemplate,
  afterwordTemplate,
  aboutAuthorTemplate,
  bibliographyTemplate,
  glossaryTemplate,
  indexTemplate,
  appendixTemplate,
  alsoByTemplate,
};

// Front matter templates
export const frontMatterTemplates: ElementTemplate[] = [
  titlePageTemplate,
  copyrightTemplate,
  dedicationTemplate,
  epigraphTemplate,
  forewordTemplate,
  prefaceTemplate,
  acknowledgementsTemplate,
  introductionTemplate,
  prologueTemplate,
  alsoByTemplate,
];

// Back matter templates
export const backMatterTemplates: ElementTemplate[] = [
  epilogueTemplate,
  afterwordTemplate,
  aboutAuthorTemplate,
  bibliographyTemplate,
  glossaryTemplate,
  indexTemplate,
  appendixTemplate,
  acknowledgementsTemplate,
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
