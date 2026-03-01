/**
 * Copyright page template
 */

import { ElementTemplate } from '../../types/template';
import { createTextBlock } from '../../models/factories';

export const copyrightTemplate: ElementTemplate = {
  id: 'copyright-standard',
  type: 'copyright',
  matter: 'front',
  name: 'Copyright Page',
  description: 'Standard copyright page with year, publisher, and rights information',
  fields: [
    {
      name: 'copyrightYear',
      label: 'Copyright Year',
      placeholder: '2026',
      type: 'year',
      required: true,
      defaultValue: new Date().getFullYear().toString(),
    },
    {
      name: 'authorName',
      label: 'Author Name',
      placeholder: 'Author Name',
      type: 'text',
      required: true,
    },
    {
      name: 'publisher',
      label: 'Publisher',
      placeholder: 'Publisher Name',
      type: 'text',
      required: false,
    },
    {
      name: 'isbn',
      label: 'ISBN',
      placeholder: '978-0-00-000000-0',
      type: 'text',
      required: false,
    },
    {
      name: 'edition',
      label: 'Edition',
      placeholder: 'First Edition',
      type: 'text',
      required: false,
    },
  ],
  content: [
    createTextBlock('Copyright © {{copyrightYear}} by {{authorName}}', 'paragraph', {
      style: { name: 'copyright', type: 'inline' },
    }),
    createTextBlock('', 'paragraph'),
    createTextBlock('All rights reserved. No part of this book may be reproduced in any form or by any electronic or mechanical means, including information storage and retrieval systems, without permission in writing from the publisher, except by reviewers, who may quote brief passages in a review.', 'paragraph', {
      style: { name: 'copyright', type: 'inline' },
    }),
    createTextBlock('', 'paragraph'),
    createTextBlock('{{edition}}', 'paragraph', {
      style: { name: 'copyright', type: 'inline' },
    }),
    createTextBlock('', 'paragraph'),
    createTextBlock('Published by {{publisher}}', 'paragraph', {
      style: { name: 'copyright', type: 'inline' },
    }),
    createTextBlock('', 'paragraph'),
    createTextBlock('ISBN: {{isbn}}', 'paragraph', {
      style: { name: 'copyright', type: 'inline' },
    }),
  ],
  includeInToc: false,
};
