/**
 * Appendix template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const appendixTemplate: ElementTemplate = {
  id: 'appendix-standard',
  type: 'appendix',
  matter: 'back',
  name: 'Appendix',
  description: 'Supplementary material at the end of the book',
  fields: [
    {
      name: 'title',
      label: 'Appendix Title',
      placeholder: 'Appendix A',
      type: 'text',
      required: false,
      defaultValue: 'Appendix',
    },
    {
      name: 'content',
      label: 'Appendix Content',
      placeholder: 'Enter appendix content',
      type: 'multiline',
      required: false,
    },
  ],
  content: [
    createTextBlock('{{title}}', 'paragraph'),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{content}}', 'paragraph'),
  ],
  includeInToc: true,
};
