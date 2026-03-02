/**
 * Index template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const indexTemplate: ElementTemplate = {
  id: 'index-standard',
  type: 'index',
  matter: 'back',
  name: 'Index',
  description: 'Alphabetical index of topics and page references',
  fields: [
    {
      name: 'content',
      label: 'Index Entries',
      placeholder: 'Enter index entries',
      type: 'multiline',
      required: false,
    },
  ],
  content: [
    createTextBlock('Index', 'paragraph'),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{content}}', 'paragraph'),
  ],
  includeInToc: true,
};
