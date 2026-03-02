/**
 * Bibliography template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const bibliographyTemplate: ElementTemplate = {
  id: 'bibliography-standard',
  type: 'bibliography',
  matter: 'back',
  name: 'Bibliography',
  description: 'List of references and sources',
  fields: [
    {
      name: 'content',
      label: 'Bibliography Entries',
      placeholder: 'Enter bibliography entries',
      type: 'multiline',
      required: false,
    },
  ],
  content: [
    createTextBlock('Bibliography', 'paragraph'),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{content}}', 'paragraph'),
  ],
  includeInToc: true,
};
