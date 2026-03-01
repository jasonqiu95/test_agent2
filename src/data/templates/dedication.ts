/**
 * Dedication template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const dedicationTemplate: ElementTemplate = {
  id: 'dedication-standard',
  type: 'dedication',
  matter: 'front',
  name: 'Dedication',
  description: 'Centered, italicized dedication page',
  fields: [
    {
      name: 'dedicationText',
      label: 'Dedication Text',
      placeholder: 'For my family and friends',
      type: 'multiline',
      required: true,
    },
  ],
  content: [
    createTextBlock('', 'paragraph'),
    createTextBlock('', 'paragraph'),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{dedicationText}}', 'paragraph', {
      style: {
        name: 'dedication',
        type: 'inline',
      },
    }),
  ],
  includeInToc: false,
};
