/**
 * Preface template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const prefaceTemplate: ElementTemplate = {
  id: 'preface-standard',
  type: 'preface',
  matter: 'front',
  name: 'Preface',
  description: 'Author\'s preface to the book',
  fields: [
    {
      name: 'prefaceText',
      label: 'Preface Text',
      placeholder: 'Write the preface content here...',
      type: 'multiline',
      required: true,
    },
  ],
  content: [
    createTextBlock('Preface', 'heading', {
      level: 1,
      style: { name: 'preface-heading', type: 'inline' },
    }),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{prefaceText}}', 'paragraph'),
  ],
  includeInToc: true,
};
