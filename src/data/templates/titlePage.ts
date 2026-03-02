/**
 * Title Page template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const titlePageTemplate: ElementTemplate = {
  id: 'title-page-standard',
  type: 'title-page',
  matter: 'front',
  name: 'Title Page',
  description: 'Standard title page with book title and author',
  fields: [
    {
      name: 'title',
      label: 'Book Title',
      placeholder: 'Enter book title',
      type: 'text',
      required: true,
    },
    {
      name: 'subtitle',
      label: 'Subtitle',
      placeholder: 'Enter subtitle (optional)',
      type: 'text',
      required: false,
    },
    {
      name: 'author',
      label: 'Author Name',
      placeholder: 'Enter author name',
      type: 'text',
      required: true,
    },
  ],
  content: [
    createTextBlock('', 'paragraph'),
    createTextBlock('', 'paragraph'),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{title}}', 'paragraph'),
    createTextBlock('{{subtitle}}', 'paragraph'),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{author}}', 'paragraph'),
  ],
  includeInToc: false,
};
