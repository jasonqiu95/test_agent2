/**
 * Afterword template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const afterwordTemplate: ElementTemplate = {
  id: 'afterword-standard',
  type: 'afterword',
  matter: 'back',
  name: 'Afterword',
  description: 'Concluding remarks after the main content',
  fields: [
    {
      name: 'content',
      label: 'Afterword Content',
      placeholder: 'Enter afterword text',
      type: 'multiline',
      required: true,
    },
  ],
  content: [
    createTextBlock('Afterword', 'paragraph'),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{content}}', 'paragraph'),
  ],
  includeInToc: true,
};
