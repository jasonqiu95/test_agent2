/**
 * Introduction template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const introductionTemplate: ElementTemplate = {
  id: 'introduction-standard',
  type: 'introduction',
  matter: 'front',
  name: 'Introduction',
  description: 'Introduction section for the book',
  fields: [
    {
      name: 'content',
      label: 'Introduction Content',
      placeholder: 'Enter introduction text',
      type: 'multiline',
      required: true,
    },
  ],
  content: [
    createTextBlock('Introduction', 'paragraph'),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{content}}', 'paragraph'),
  ],
  includeInToc: true,
};
