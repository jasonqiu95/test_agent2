/**
 * Also By (Other Works) template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const alsoByTemplate: ElementTemplate = {
  id: 'also-by-standard',
  type: 'also-by',
  matter: 'front',
  name: 'Also By This Author',
  description: 'List of other works by the author',
  fields: [
    {
      name: 'authorName',
      label: 'Author Name',
      placeholder: 'Author Name',
      type: 'text',
      required: true,
    },
    {
      name: 'books',
      label: 'Book Titles (one per line)',
      placeholder: 'Book Title 1\nBook Title 2\nBook Title 3',
      type: 'multiline',
      required: true,
    },
  ],
  content: [
    createTextBlock('Also by {{authorName}}', 'heading', {
      level: 1,
      style: { name: 'also-by-heading', type: 'inline' },
    }),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{books}}', 'paragraph', {
      style: { name: 'also-by-list', type: 'inline' },
    }),
  ],
  includeInToc: false,
};
