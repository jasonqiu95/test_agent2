/**
 * ProseMirror schema definition for the novel editor
 * Defines all node types and marks for rich text editing
 */

import { Schema, NodeSpec, MarkSpec } from 'prosemirror-model';
import {
  NodeType,
  MarkType,
  HeadingAttrs,
  SceneBreakAttrs,
  OrnamentalBreakAttrs,
  VerseAttrs,
  ImageAttrs,
  LinkAttrs,
  OrderedListAttrs,
} from './types';

/**
 * Node specifications for the editor schema
 */
const nodes: Record<string, NodeSpec> = {
  // Top-level document node
  [NodeType.DOC]: {
    content: 'block+',
  },

  // Paragraph node - basic text block
  [NodeType.PARAGRAPH]: {
    content: 'inline*',
    group: 'block',
    parseDOM: [{ tag: 'p' }],
    toDOM() {
      return ['p', 0];
    },
  },

  // Heading nodes (H1-H6)
  [NodeType.HEADING]: {
    attrs: {
      level: { default: 1 },
    } as Record<keyof HeadingAttrs, { default: number }>,
    content: 'inline*',
    group: 'block',
    defining: true,
    parseDOM: [
      { tag: 'h1', attrs: { level: 1 } },
      { tag: 'h2', attrs: { level: 2 } },
      { tag: 'h3', attrs: { level: 3 } },
      { tag: 'h4', attrs: { level: 4 } },
      { tag: 'h5', attrs: { level: 5 } },
      { tag: 'h6', attrs: { level: 6 } },
    ],
    toDOM(node) {
      const level = node.attrs.level as number;
      return ['h' + level, 0];
    },
  },

  // Block quote node
  [NodeType.BLOCKQUOTE]: {
    content: 'block+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'blockquote' }],
    toDOM() {
      return ['blockquote', 0];
    },
  },

  // Ordered list node
  [NodeType.ORDERED_LIST]: {
    attrs: {
      order: { default: 1 },
    } as Record<keyof OrderedListAttrs, { default: number }>,
    content: 'list_item+',
    group: 'block',
    parseDOM: [
      {
        tag: 'ol',
        getAttrs(dom) {
          const element = dom as HTMLElement;
          return {
            order: element.hasAttribute('start')
              ? parseInt(element.getAttribute('start') || '1', 10)
              : 1,
          };
        },
      },
    ],
    toDOM(node) {
      const order = node.attrs.order as number;
      return order === 1
        ? ['ol', 0]
        : ['ol', { start: order }, 0];
    },
  },

  // Bullet (unordered) list node
  [NodeType.BULLET_LIST]: {
    content: 'list_item+',
    group: 'block',
    parseDOM: [{ tag: 'ul' }],
    toDOM() {
      return ['ul', 0];
    },
  },

  // List item node
  [NodeType.LIST_ITEM]: {
    content: 'paragraph block*',
    defining: true,
    parseDOM: [{ tag: 'li' }],
    toDOM() {
      return ['li', 0];
    },
  },

  // Scene break node - used to separate scenes in a chapter
  [NodeType.SCENE_BREAK]: {
    attrs: {
      symbol: { default: '* * *' },
    } as Record<keyof SceneBreakAttrs, { default: string }>,
    group: 'block',
    atom: true,
    parseDOM: [
      {
        tag: 'div.scene-break',
        getAttrs(dom) {
          const element = dom as HTMLElement;
          return {
            symbol: element.getAttribute('data-symbol') || '* * *',
          };
        },
      },
    ],
    toDOM(node) {
      const symbol = node.attrs.symbol as string;
      return [
        'div',
        {
          class: 'scene-break',
          'data-symbol': symbol,
        },
        symbol,
      ];
    },
  },

  // Ornamental break node (placeholder for future implementation)
  // Used for decorative section separators
  [NodeType.ORNAMENTAL_BREAK]: {
    attrs: {
      style: { default: 'default' },
      symbol: { default: '❦' },
    } as Record<keyof OrnamentalBreakAttrs, { default: string }>,
    group: 'block',
    atom: true,
    parseDOM: [
      {
        tag: 'div.ornamental-break',
        getAttrs(dom) {
          const element = dom as HTMLElement;
          return {
            style: element.getAttribute('data-style') || 'default',
            symbol: element.getAttribute('data-symbol') || '❦',
          };
        },
      },
    ],
    toDOM(node) {
      const symbol = node.attrs.symbol as string;
      const style = node.attrs.style as string;
      return [
        'div',
        {
          class: 'ornamental-break',
          'data-style': style,
          'data-symbol': symbol,
        },
        symbol,
      ];
    },
  },

  // Verse container node (placeholder for future implementation)
  // Used for poetry or verse sections
  [NodeType.VERSE]: {
    attrs: {
      stanza: { default: undefined },
    } as Record<keyof VerseAttrs, { default: number | undefined }>,
    content: 'verse_line+',
    group: 'block',
    defining: true,
    parseDOM: [
      {
        tag: 'div.verse',
        getAttrs(dom) {
          const element = dom as HTMLElement;
          const stanzaAttr = element.getAttribute('data-stanza');
          return {
            stanza: stanzaAttr ? parseInt(stanzaAttr, 10) : undefined,
          };
        },
      },
    ],
    toDOM(node) {
      const stanza = node.attrs.stanza as number | undefined;
      return [
        'div',
        {
          class: 'verse',
          ...(stanza !== undefined ? { 'data-stanza': stanza } : {}),
        },
        0,
      ];
    },
  },

  // Verse line node - individual line in a verse
  [NodeType.VERSE_LINE]: {
    content: 'inline*',
    parseDOM: [{ tag: 'div.verse-line' }],
    toDOM() {
      return ['div', { class: 'verse-line' }, 0];
    },
  },

  // Image node (placeholder for future implementation)
  [NodeType.IMAGE]: {
    attrs: {
      src: { default: '' },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      height: { default: null },
    } as Record<keyof ImageAttrs, { default: string | number | null }>,
    group: 'block',
    atom: true,
    draggable: true,
    parseDOM: [
      {
        tag: 'img',
        getAttrs(dom) {
          const element = dom as HTMLImageElement;
          return {
            src: element.getAttribute('src') || '',
            alt: element.getAttribute('alt'),
            title: element.getAttribute('title'),
            width: element.width || null,
            height: element.height || null,
          };
        },
      },
    ],
    toDOM(node) {
      const attrs = node.attrs as ImageAttrs;
      const domAttrs: Record<string, string | number> = { src: attrs.src };

      if (attrs.alt) domAttrs.alt = attrs.alt;
      if (attrs.title) domAttrs.title = attrs.title;
      if (attrs.width) domAttrs.width = attrs.width;
      if (attrs.height) domAttrs.height = attrs.height;

      return ['img', domAttrs];
    },
  },

  // Hard break node - line break within a paragraph
  [NodeType.HARD_BREAK]: {
    inline: true,
    group: 'inline',
    selectable: false,
    parseDOM: [{ tag: 'br' }],
    toDOM() {
      return ['br'];
    },
  },

  // Text node - leaf node containing actual text content
  [NodeType.TEXT]: {
    group: 'inline',
    inline: true,
  },
};

/**
 * Mark specifications for inline formatting
 */
const marks: Record<string, MarkSpec> = {
  // Bold text
  [MarkType.BOLD]: {
    parseDOM: [
      { tag: 'strong' },
      { tag: 'b' },
      {
        style: 'font-weight',
        getAttrs: (value) => {
          const weight = value as string;
          return /^(bold(er)?|[5-9]\d{2,})$/.test(weight) && null;
        },
      },
    ],
    toDOM() {
      return ['strong', 0];
    },
  },

  // Italic text
  [MarkType.ITALIC]: {
    parseDOM: [
      { tag: 'em' },
      { tag: 'i' },
      { style: 'font-style=italic' },
    ],
    toDOM() {
      return ['em', 0];
    },
  },

  // Underlined text
  [MarkType.UNDERLINE]: {
    parseDOM: [
      { tag: 'u' },
      { style: 'text-decoration=underline' },
    ],
    toDOM() {
      return ['u', 0];
    },
  },

  // Strikethrough text
  [MarkType.STRIKETHROUGH]: {
    parseDOM: [
      { tag: 's' },
      { tag: 'strike' },
      { tag: 'del' },
      { style: 'text-decoration=line-through' },
    ],
    toDOM() {
      return ['s', 0];
    },
  },

  // Subscript text
  [MarkType.SUBSCRIPT]: {
    excludes: 'superscript',
    parseDOM: [{ tag: 'sub' }],
    toDOM() {
      return ['sub', 0];
    },
  },

  // Superscript text
  [MarkType.SUPERSCRIPT]: {
    excludes: 'subscript',
    parseDOM: [{ tag: 'sup' }],
    toDOM() {
      return ['sup', 0];
    },
  },

  // Code/monospace text
  [MarkType.CODE]: {
    parseDOM: [{ tag: 'code' }],
    toDOM() {
      return ['code', 0];
    },
  },

  // Link mark
  [MarkType.LINK]: {
    attrs: {
      href: { default: '' },
      title: { default: null },
      target: { default: null },
    } as Record<keyof LinkAttrs, { default: string | null }>,
    inclusive: false,
    parseDOM: [
      {
        tag: 'a[href]',
        getAttrs(dom) {
          const element = dom as HTMLAnchorElement;
          return {
            href: element.getAttribute('href') || '',
            title: element.getAttribute('title'),
            target: element.getAttribute('target'),
          };
        },
      },
    ],
    toDOM(mark) {
      const attrs = mark.attrs as LinkAttrs;
      const domAttrs: Record<string, string> = { href: attrs.href };

      if (attrs.title) domAttrs.title = attrs.title;
      if (attrs.target) domAttrs.target = attrs.target;

      return ['a', domAttrs, 0];
    },
  },
};

/**
 * The complete editor schema
 * Combines all node and mark specifications
 */
export const editorSchema = new Schema({
  nodes,
  marks,
});

/**
 * Export individual specs for testing and extension
 */
export { nodes as nodeSpecs, marks as markSpecs };

/**
 * Helper function to get node type from schema
 */
export function getNodeType(schema: Schema, type: NodeType) {
  return schema.nodes[type];
}

/**
 * Helper function to get mark type from schema
 */
export function getMarkType(schema: Schema, type: MarkType) {
  return schema.marks[type];
}

/**
 * Check if a node is a block node
 */
export function isBlockNode(nodeName: string): boolean {
  const spec = nodes[nodeName];
  return spec?.group?.includes('block') || false;
}

/**
 * Check if a node is an inline node
 */
export function isInlineNode(nodeName: string): boolean {
  const spec = nodes[nodeName];
  return spec?.group?.includes('inline') || false;
}
