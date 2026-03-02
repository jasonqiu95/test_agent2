/**
 * Acknowledgments template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const acknowledgementsTemplate: ElementTemplate = {
  id: 'acknowledgments-standard',
  type: 'acknowledgments',
  matter: 'back',
  name: 'Acknowledgments',
  description: 'Standard acknowledgments section',
  fields: [
    {
      name: 'acknowledgmentText',
      label: 'Acknowledgment Text',
      placeholder: 'I would like to thank...',
      type: 'multiline',
      required: true,
    },
  ],
  content: [
    createTextBlock('Acknowledgments', 'heading', {
      level: 1,
      style: { name: 'acknowledgments-heading', type: 'inline' },
    }),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{acknowledgmentText}}', 'paragraph'),
  ],
  includeInToc: true,
};
