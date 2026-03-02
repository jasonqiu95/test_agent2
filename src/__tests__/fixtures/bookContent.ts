/**
 * Comprehensive book content fixtures including front matter, back matter, and chapters
 */

import { Book, Author } from '../../types/book';
import { Element } from '../../types/element';
import { allSampleChapters } from './sampleChapters';

/**
 * Sample authors
 */
export const sampleAuthors: Author[] = [
  {
    id: 'author-1',
    name: 'Jane Anderson',
    role: 'author',
    bio: 'Jane Anderson is an award-winning novelist with over fifteen years of experience crafting compelling narratives. Her works have been translated into twenty-three languages.',
    website: 'https://janeanderson.com',
    email: 'jane@janeanderson.com',
  },
  {
    id: 'author-2',
    name: 'Michael Chen',
    role: 'co-author',
    bio: 'Michael Chen brings expertise in historical research and has contributed to numerous academic publications.',
  },
];

/**
 * Title Page element
 */
export const titlePageElement: Element = {
  id: 'front-title-page',
  type: 'title-page',
  matter: 'front',
  title: 'Title Page',
  order: 1,
  includeInToc: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'title-block-1',
      blockType: 'heading',
      content: 'The Journey Beyond',
      level: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'title-block-2',
      blockType: 'heading',
      content: 'A Tale of Discovery and Redemption',
      level: 2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'title-block-3',
      blockType: 'paragraph',
      content: 'by Jane Anderson and Michael Chen',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
};

/**
 * Copyright page element
 */
export const copyrightElement: Element = {
  id: 'front-copyright',
  type: 'copyright',
  matter: 'front',
  title: 'Copyright',
  order: 2,
  includeInToc: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'copy-block-1',
      blockType: 'paragraph',
      content: 'Copyright © 2024 by Jane Anderson and Michael Chen',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'copy-block-2',
      blockType: 'paragraph',
      content: 'All rights reserved. No part of this book may be reproduced in any form or by any electronic or mechanical means, including information storage and retrieval systems, without permission in writing from the publisher, except by reviewers, who may quote brief passages in a review.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'copy-block-3',
      blockType: 'paragraph',
      content: 'ISBN: 978-0-123456-78-9',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'copy-block-4',
      blockType: 'paragraph',
      content: 'Published by Narrative Press, New York',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'copy-block-5',
      blockType: 'paragraph',
      content: 'First Edition: January 2024',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
};

/**
 * Dedication element
 */
export const dedicationElement: Element = {
  id: 'front-dedication',
  type: 'dedication',
  matter: 'front',
  title: 'Dedication',
  order: 3,
  includeInToc: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'ded-block-1',
      blockType: 'paragraph',
      content: 'For all those who dare to dream,',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'ded-block-2',
      blockType: 'paragraph',
      content: 'and for those who never stopped believing.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
};

/**
 * Epigraph element
 */
export const epigraphElement: Element = {
  id: 'front-epigraph',
  type: 'epigraph',
  matter: 'front',
  title: 'Epigraph',
  order: 4,
  includeInToc: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'epi-block-1',
      blockType: 'paragraph',
      content: '',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      features: [
        {
          id: 'epi-quote-1',
          type: 'quote',
          quoteType: 'epigraph',
          content: 'Not all those who wander are lost.',
          attribution: 'J.R.R. Tolkien',
          source: 'The Fellowship of the Ring',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
    },
  ],
};

/**
 * Foreword element with images
 */
export const forewordElement: Element = {
  id: 'front-foreword',
  type: 'foreword',
  matter: 'front',
  title: 'Foreword',
  order: 5,
  includeInToc: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'fore-block-1',
      blockType: 'heading',
      content: 'Foreword',
      level: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'fore-block-2',
      blockType: 'paragraph',
      content: 'When I first encountered this manuscript, I was immediately struck by its depth and authenticity. The authors have crafted a narrative that is both timeless and urgently relevant.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'fore-block-3',
      blockType: 'paragraph',
      content: 'Throughout my career as an editor and critic, I have read countless works of fiction. Few have moved me as profoundly as this one.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'fore-block-4',
      blockType: 'paragraph',
      content: '— Dr. Sarah Williams, Literary Critic and Professor of Contemporary Literature',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
};

/**
 * Acknowledgments element
 */
export const acknowledgementsElement: Element = {
  id: 'front-acknowledgments',
  type: 'acknowledgments',
  matter: 'front',
  title: 'Acknowledgments',
  order: 6,
  includeInToc: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'ack-block-1',
      blockType: 'heading',
      content: 'Acknowledgments',
      level: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'ack-block-2',
      blockType: 'paragraph',
      content: 'This book would not have been possible without the support and encouragement of many people.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'ack-block-3',
      blockType: 'paragraph',
      content: 'First and foremost, we thank our families for their patience during the long hours of writing and research. Your understanding and support sustained us through the difficult moments.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'ack-block-4',
      blockType: 'paragraph',
      content: 'We are deeply grateful to our editor, Margaret Thompson, whose keen eye and thoughtful feedback improved every page. Our agent, David Rodriguez, believed in this project from the beginning and fought tirelessly to bring it to readers.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'ack-block-5',
      blockType: 'paragraph',
      content: 'Special thanks to the staff at the New York Public Library and the Library of Congress, whose collections and assistance proved invaluable to our research.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'ack-block-6',
      blockType: 'paragraph',
      content: 'Finally, we thank our readers. Your enthusiasm for storytelling makes all of this worthwhile.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
};

/**
 * Prologue element
 */
export const prologueElement: Element = {
  id: 'front-prologue',
  type: 'prologue',
  matter: 'front',
  title: 'Prologue',
  order: 7,
  includeInToc: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'pro-block-1',
      blockType: 'heading',
      content: 'Prologue',
      level: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'pro-block-2',
      blockType: 'heading',
      content: 'Ten Years Earlier',
      level: 2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'pro-block-3',
      blockType: 'paragraph',
      content: 'The storm came without warning. One moment the sky was clear, the next it was dark with roiling clouds that seemed to swallow the horizon.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'pro-block-4',
      blockType: 'paragraph',
      content: 'Standing on the pier, young Thomas watched as the fishing boats scrambled for shore. His father\'s boat was still out there, somewhere beyond the harbor entrance.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'pro-block-5',
      blockType: 'paragraph',
      content: 'He didn\'t know it then, but that day would change everything. The choices made in those desperate hours would echo through the years, shaping not just his life, but the lives of everyone in the small coastal town.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'pro-block-6',
      blockType: 'paragraph',
      content: 'This is the story of what happened next.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
};

/**
 * All front matter elements
 */
export const frontMatter: Element[] = [
  titlePageElement,
  copyrightElement,
  dedicationElement,
  epigraphElement,
  forewordElement,
  acknowledgementsElement,
  prologueElement,
];

/**
 * Epilogue element with verse
 */
export const epilogueElement: Element = {
  id: 'back-epilogue',
  type: 'epilogue',
  matter: 'back',
  title: 'Epilogue',
  order: 1,
  includeInToc: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'epi-block-1',
      blockType: 'heading',
      content: 'Epilogue',
      level: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'epi-block-2',
      blockType: 'heading',
      content: 'Five Years Later',
      level: 2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'epi-block-3',
      blockType: 'paragraph',
      content: 'Emma stood at the same airport terminal where her journey had begun. But this time, she wasn\'t leaving—she was coming home.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'epi-block-4',
      blockType: 'paragraph',
      content: 'The years abroad had changed her in ways she was still discovering. She had learned new languages, explored distant cities, and met people whose stories had become part of her own.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'epi-block-5',
      blockType: 'paragraph',
      content: 'As she collected her bags and walked toward the exit, she noticed a familiar face in the crowd. Thomas was there, just as he had promised he would be, holding a sign with her name and a smile that spoke of everything that was yet to come.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'epi-block-6',
      blockType: 'paragraph',
      content: '',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      features: [
        {
          id: 'epi-verse-1',
          type: 'verse',
          lines: [
            'The journey ends where it began,',
            'Yet nothing is the same,',
            'For we who travel far and wide',
            'Return with different names.',
          ],
          stanza: 1,
          indentation: [0, 0, 0, 0],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
    },
  ],
};

/**
 * Afterword element
 */
export const afterwordElement: Element = {
  id: 'back-afterword',
  type: 'afterword',
  matter: 'back',
  title: 'Afterword',
  order: 2,
  includeInToc: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'aft-block-1',
      blockType: 'heading',
      content: 'Afterword',
      level: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'aft-block-2',
      blockType: 'paragraph',
      content: 'Writing this book has been a journey in itself, one that spanned three years and took us to places we never expected to go.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'aft-block-3',
      blockType: 'paragraph',
      content: 'The characters in these pages are fictional, but their struggles and triumphs are inspired by real people we have known and real experiences we have witnessed. We hope their stories resonate with you as deeply as they have with us.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'aft-block-4',
      blockType: 'paragraph',
      content: 'Thank you for taking this journey with us.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'aft-block-5',
      blockType: 'paragraph',
      content: '— Jane Anderson and Michael Chen, December 2023',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
};

/**
 * About the Author element
 */
export const aboutAuthorElement: Element = {
  id: 'back-about-author',
  type: 'about-author',
  matter: 'back',
  title: 'About the Authors',
  order: 3,
  includeInToc: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'about-block-1',
      blockType: 'heading',
      content: 'About the Authors',
      level: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'about-block-2',
      blockType: 'heading',
      content: 'Jane Anderson',
      level: 2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'about-block-3',
      blockType: 'paragraph',
      content: 'Jane Anderson is the author of seven novels, including the bestselling "Whispers in the Wind" and "The Last Summer." Her work has been recognized with the National Book Critics Circle Award and the PEN/Faulkner Award for Fiction.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'about-block-4',
      blockType: 'paragraph',
      content: 'Born in Portland, Oregon, Jane studied creative writing at Columbia University and now divides her time between New York City and a small cabin in the Adirondacks. When not writing, she enjoys hiking, photography, and teaching workshops for aspiring writers.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'about-block-5',
      blockType: 'heading',
      content: 'Michael Chen',
      level: 2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'about-block-6',
      blockType: 'paragraph',
      content: 'Michael Chen holds a Ph.D. in History from Yale University and has published extensively on 20th-century European history. His academic work has appeared in numerous peer-reviewed journals, and he has contributed to several anthologies.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'about-block-7',
      blockType: 'paragraph',
      content: 'This is his first work of fiction, co-authored with longtime friend Jane Anderson. He lives in Boston with his wife and two children, where he continues to teach and write.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
};

/**
 * Appendix with lists and technical content
 */
export const appendixElement: Element = {
  id: 'back-appendix',
  type: 'appendix',
  matter: 'back',
  title: 'Appendix A: Historical Timeline',
  order: 4,
  includeInToc: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'app-block-1',
      blockType: 'heading',
      content: 'Appendix A: Historical Timeline',
      level: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'app-block-2',
      blockType: 'paragraph',
      content: 'The following timeline provides context for the historical events referenced throughout the narrative:',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'app-block-3',
      blockType: 'paragraph',
      content: '',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      features: [
        {
          id: 'app-list-1',
          type: 'list',
          listType: 'unordered',
          items: [
            { content: '1848 - The Great Migration begins', level: 0 },
            { content: '1863 - The Treaty of New Haven signed', level: 0 },
            { content: '1889 - Establishment of the Coastal Trading Company', level: 0 },
            { content: '1902 - The Great Storm devastates the harbor', level: 0 },
            { content: '1918 - The Armistice brings an end to hostilities', level: 0 },
            { content: '1945 - Post-war reconstruction begins', level: 0 },
            { content: '1968 - The Modern Era dawns', level: 0 },
            { content: '2001 - The Digital Revolution transforms communication', level: 0 },
          ],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
    },
    {
      id: 'app-block-4',
      blockType: 'paragraph',
      content: 'For more detailed information on any of these events, please consult the bibliography.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
};

/**
 * Bibliography element
 */
export const bibliographyElement: Element = {
  id: 'back-bibliography',
  type: 'bibliography',
  matter: 'back',
  title: 'Selected Bibliography',
  order: 5,
  includeInToc: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'bib-block-1',
      blockType: 'heading',
      content: 'Selected Bibliography',
      level: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'bib-block-2',
      blockType: 'paragraph',
      content: 'The following works were consulted during the research and writing of this book:',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'bib-block-3',
      blockType: 'paragraph',
      content: 'Adams, Robert. "Maritime History of New England." Boston: Maritime Press, 1998.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'bib-block-4',
      blockType: 'paragraph',
      content: 'Chen, Liu. "Immigration Patterns in 19th Century America." New York: Academic Publishers, 2005.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'bib-block-5',
      blockType: 'paragraph',
      content: 'Davidson, Emily. "Small Town America: A Social History." Chicago: University Press, 2010.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'bib-block-6',
      blockType: 'paragraph',
      content: 'Thompson, James. "The Great Storm of 1902: A Documentary History." Portland: Regional Historical Society, 2003.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'bib-block-7',
      blockType: 'paragraph',
      content: 'Williams, Sarah. "Narratives of Displacement and Return in Contemporary Fiction." New York: Literary Studies Press, 2018.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
};

/**
 * All back matter elements
 */
export const backMatter: Element[] = [
  epilogueElement,
  afterwordElement,
  aboutAuthorElement,
  appendixElement,
  bibliographyElement,
];

/**
 * Complete sample book with all elements
 */
export const sampleBook: Book = {
  id: 'book-sample-1',
  title: 'The Journey Beyond',
  subtitle: 'A Tale of Discovery and Redemption',
  authors: sampleAuthors,
  frontMatter: frontMatter,
  chapters: allSampleChapters,
  backMatter: backMatter,
  styles: [],
  metadata: {
    isbn: '978-0-123456-78-9',
    isbn13: '978-0-123456-78-9',
    publisher: 'Narrative Press',
    publicationDate: new Date('2024-01-15'),
    edition: 'First Edition',
    language: 'en-US',
    genre: ['Fiction', 'Literary Fiction', 'Contemporary'],
    keywords: [
      'journey',
      'self-discovery',
      'redemption',
      'family',
      'relationships',
    ],
    description:
      'A compelling narrative that follows multiple characters as they navigate love, loss, and the search for meaning in a changing world.',
    rights: 'All rights reserved',
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2024-01-01'),
  },
  wordCount: 75000,
  pageCount: 320,
  status: 'published',
  createdAt: new Date('2023-06-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * Minimal book for testing basic functionality
 */
export const minimalBook: Book = {
  id: 'book-minimal',
  title: 'A Simple Story',
  authors: [sampleAuthors[0]],
  frontMatter: [titlePageElement],
  chapters: [allSampleChapters[0]],
  backMatter: [],
  styles: [],
  metadata: {
    language: 'en-US',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  status: 'draft',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * Book with complex formatting for stress testing
 */
export const complexFormattingBook: Book = {
  id: 'book-complex',
  title: 'The Complete Works',
  subtitle: 'An Anthology',
  authors: sampleAuthors,
  frontMatter: frontMatter,
  chapters: allSampleChapters,
  backMatter: backMatter,
  styles: [],
  metadata: {
    isbn: '978-0-987654-32-1',
    publisher: 'Academic Press',
    publicationDate: new Date('2024-03-01'),
    edition: 'Collector\'s Edition',
    language: 'en-US',
    genre: ['Anthology', 'Literary Fiction', 'Poetry'],
    keywords: ['comprehensive', 'complete', 'anthology', 'collection'],
    description:
      'A comprehensive collection showcasing the full range of literary forms and styles, from poetry to prose, historical fiction to contemporary narrative.',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  wordCount: 120000,
  pageCount: 485,
  status: 'published',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * Helper function to get element by type
 */
export function getElementByType(
  elements: Element[],
  type: Element['type']
): Element | undefined {
  return elements.find((element) => element.type === type);
}

/**
 * Helper function to get all elements of a matter type
 */
export function getElementsByMatter(
  book: Book,
  matter: 'front' | 'back'
): Element[] {
  return matter === 'front' ? book.frontMatter : book.backMatter;
}

/**
 * Helper to create a text block (useful for testing)
 */
export function createTextBlock(
  content: string,
  blockType: TextBlock['blockType'] = 'paragraph',
  features?: TextFeature[]
): TextBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    blockType,
    features,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Export all fixtures
 */
export const fixtures = {
  // Books
  sampleBook,
  minimalBook,
  complexFormattingBook,

  // Authors
  sampleAuthors,

  // Front Matter
  frontMatter,
  titlePageElement,
  copyrightElement,
  dedicationElement,
  epigraphElement,
  forewordElement,
  acknowledgementsElement,
  prologueElement,

  // Back Matter
  backMatter,
  epilogueElement,
  afterwordElement,
  aboutAuthorElement,
  appendixElement,
  bibliographyElement,

  // Helpers
  getElementByType,
  getElementsByMatter,
  createTextBlock,
};
