/**
 * Glossary template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const glossaryTemplate: ElementTemplate = {
  id: 'glossary-standard',
  type: 'glossary',
  matter: 'back',
  name: 'Glossary',
  description: 'Alphabetical list of terms and definitions',
  fields: [
    {
      name: 'content',
      label: 'Glossary Entries',
      placeholder: 'Enter terms and definitions',
      type: 'multiline',
      required: false,
    },
  ],
  content: [
    createTextBlock('Glossary', 'paragraph'),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{content}}', 'paragraph'),
  ],
  includeInToc: true,
};
