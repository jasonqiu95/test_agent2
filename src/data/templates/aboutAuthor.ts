/**
 * About the Author template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const aboutAuthorTemplate: ElementTemplate = {
  id: 'about-author-standard',
  type: 'about-author',
  matter: 'back',
  name: 'About the Author',
  description: 'Author biography with photo placeholder',
  fields: [
    {
      name: 'authorPhoto',
      label: 'Author Photo',
      placeholder: '[Photo placeholder]',
      type: 'image',
      required: false,
    },
    {
      name: 'authorName',
      label: 'Author Name',
      placeholder: 'Author Name',
      type: 'text',
      required: true,
    },
    {
      name: 'biography',
      label: 'Biography',
      placeholder: 'Write a brief biography about the author...',
      type: 'multiline',
      required: true,
    },
    {
      name: 'website',
      label: 'Website',
      placeholder: 'www.authorwebsite.com',
      type: 'text',
      required: false,
    },
  ],
  content: [
    createTextBlock('About the Author', 'heading', {
      level: 1,
      style: { name: 'about-author-heading', type: 'inline' },
    }),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{authorPhoto}}', 'paragraph', {
      style: { name: 'author-photo', type: 'inline' },
    }),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{biography}}', 'paragraph'),
    createTextBlock('', 'paragraph'),
    createTextBlock('For more information, visit {{website}}', 'paragraph'),
  ],
  includeInToc: true,
};
