/**
 * Prologue template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const prologueTemplate: ElementTemplate = {
  id: 'prologue-standard',
  type: 'prologue',
  matter: 'front',
  name: 'Prologue',
  description: 'Prologue section before the main story',
  fields: [
    {
      name: 'content',
      label: 'Prologue Content',
      placeholder: 'Enter prologue text',
      type: 'multiline',
      required: true,
    },
  ],
  content: [
    createTextBlock('Prologue', 'paragraph'),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{content}}', 'paragraph'),
  ],
  includeInToc: true,
};
