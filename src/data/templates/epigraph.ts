/**
 * Epigraph template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const epigraphTemplate: ElementTemplate = {
  id: 'epigraph-standard',
  type: 'epigraph',
  matter: 'front',
  name: 'Epigraph',
  description: 'Quote or passage at the beginning of the book',
  fields: [
    {
      name: 'quote',
      label: 'Quote',
      placeholder: 'Enter the quote or passage',
      type: 'multiline',
      required: true,
    },
    {
      name: 'attribution',
      label: 'Attribution',
      placeholder: 'Author name or source',
      type: 'text',
      required: false,
    },
  ],
  content: [
    createTextBlock('', 'paragraph'),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{quote}}', 'paragraph'),
    createTextBlock('{{attribution}}', 'paragraph'),
  ],
  includeInToc: false,
};
