/**
 * Epilogue template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const epilogueTemplate: ElementTemplate = {
  id: 'epilogue-standard',
  type: 'epilogue',
  matter: 'back',
  name: 'Epilogue',
  description: 'Concluding section after the main narrative',
  fields: [
    {
      name: 'epilogueText',
      label: 'Epilogue Text',
      placeholder: 'Write the epilogue content here...',
      type: 'multiline',
      required: true,
    },
  ],
  content: [
    createTextBlock('Epilogue', 'heading', {
      level: 1,
      style: { name: 'epilogue-heading', type: 'inline' },
    }),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{epilogueText}}', 'paragraph'),
  ],
  includeInToc: true,
};
