/**
 * Foreword template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const forewordTemplate: ElementTemplate = {
  id: 'foreword-standard',
  type: 'foreword',
  matter: 'front',
  name: 'Foreword',
  description: 'Foreword written by someone other than the author',
  fields: [
    {
      name: 'forewordText',
      label: 'Foreword Text',
      placeholder: 'Write the foreword content here...',
      type: 'multiline',
      required: true,
    },
    {
      name: 'forewordAuthor',
      label: 'Foreword Author',
      placeholder: 'Name of foreword writer',
      type: 'text',
      required: false,
    },
    {
      name: 'forewordAuthorTitle',
      label: 'Foreword Author Title',
      placeholder: 'Title or credentials',
      type: 'text',
      required: false,
    },
  ],
  content: [
    createTextBlock('Foreword', 'heading', {
      level: 1,
      style: { name: 'foreword-heading', type: 'inline' },
    }),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{forewordText}}', 'paragraph'),
    createTextBlock('', 'paragraph'),
    createTextBlock('— {{forewordAuthor}}', 'paragraph', {
      style: { name: 'foreword-attribution', type: 'inline' },
    }),
    createTextBlock('{{forewordAuthorTitle}}', 'paragraph', {
      style: { name: 'foreword-attribution', type: 'inline' },
    }),
  ],
  includeInToc: true,
};
