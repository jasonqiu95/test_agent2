/**
 * Serialization and deserialization utilities
 * Convert between ProseMirror documents and TextBlock[] format
 */

import { Node as PMNode, Mark, Fragment, Schema } from 'prosemirror-model';
import { TextBlock } from '../types/textBlock';
import { TextFeature, Break, Quote, List, ListItem } from '../types/textFeature';
import { InlineStyle } from '../types/inlineText';
import { editorSchema } from './schema';
import { NodeType, MarkType } from './types';

/**
 * Convert ProseMirror document to TextBlock array
 */
export function serializeToTextBlocks(doc: PMNode): TextBlock[] {
  const blocks: TextBlock[] = [];

  doc.forEach((node, offset, index) => {
    const textBlock = nodeToTextBlock(node);
    if (textBlock) {
      blocks.push(textBlock);
    }
  });

  return blocks;
}

/**
 * Convert a single ProseMirror node to a TextBlock
 */
function nodeToTextBlock(node: PMNode): TextBlock | null {
  const { type, attrs } = node;

  // Handle different node types
  switch (type.name) {
    case NodeType.PARAGRAPH:
      return {
        id: generateId(),
        content: nodeToPlainText(node),
        blockType: 'paragraph',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

    case NodeType.HEADING: {
      const level = attrs.level as number;
      return {
        id: generateId(),
        content: nodeToPlainText(node),
        blockType: 'heading',
        level,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    case NodeType.BLOCKQUOTE: {
      const content = nodeToPlainText(node);
      const quoteFeature: Quote = {
        id: generateId(),
        type: 'quote',
        content,
        quoteType: 'block',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        id: generateId(),
        content,
        blockType: 'paragraph',
        features: [quoteFeature],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    case NodeType.SCENE_BREAK: {
      const symbol = attrs.symbol as string;
      const breakFeature: Break = {
        id: generateId(),
        type: 'break',
        breakType: 'scene',
        symbol,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        id: generateId(),
        content: symbol,
        blockType: 'paragraph',
        features: [breakFeature],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    case NodeType.ORDERED_LIST:
    case NodeType.BULLET_LIST: {
      const listItems: ListItem[] = [];
      node.forEach((itemNode) => {
        if (itemNode.type.name === NodeType.LIST_ITEM) {
          listItems.push({
            content: nodeToPlainText(itemNode),
            level: 0,
          });
        }
      });

      const listFeature: List = {
        id: generateId(),
        type: 'list',
        items: listItems,
        listType: type.name === NodeType.ORDERED_LIST ? 'ordered' : 'unordered',
        startNumber: type.name === NodeType.ORDERED_LIST ? (attrs.order as number) : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        id: generateId(),
        content: listItems.map((item) => item.content).join('\n'),
        blockType: 'paragraph',
        features: [listFeature],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    default:
      return null;
  }
}

/**
 * Convert ProseMirror node content to plain text
 */
function nodeToPlainText(node: PMNode): string {
  let text = '';

  node.forEach((child) => {
    if (child.isText) {
      text += child.text;
    } else if (child.type.name === NodeType.HARD_BREAK) {
      text += '\n';
    } else {
      text += nodeToPlainText(child);
    }
  });

  return text;
}

/**
 * Extract inline styles from ProseMirror marks
 */
function marksToInlineStyle(marks: readonly Mark[]): InlineStyle {
  const style: InlineStyle = {};

  marks.forEach((mark) => {
    switch (mark.type.name) {
      case MarkType.BOLD:
        style.bold = true;
        break;
      case MarkType.ITALIC:
        style.italic = true;
        break;
      case MarkType.UNDERLINE:
        style.underline = true;
        break;
      case MarkType.STRIKETHROUGH:
        style.strikethrough = true;
        break;
      case MarkType.SUBSCRIPT:
        style.subscript = true;
        break;
      case MarkType.SUPERSCRIPT:
        style.superscript = true;
        break;
    }
  });

  return style;
}

/**
 * Convert TextBlock array to ProseMirror document
 */
export function deserializeFromTextBlocks(
  blocks: TextBlock[],
  schema: Schema = editorSchema
): PMNode {
  const content: PMNode[] = [];

  blocks.forEach((block) => {
    const node = textBlockToNode(block, schema);
    if (node) {
      content.push(node);
    }
  });

  return schema.node(NodeType.DOC, null, content);
}

/**
 * Convert a TextBlock to a ProseMirror node
 */
function textBlockToNode(block: TextBlock, schema: Schema): PMNode | null {
  const { blockType, content, level, features } = block;

  // Check if block has special features
  if (features && features.length > 0) {
    const feature = features[0];

    switch (feature.type) {
      case 'break':
        if (feature.breakType === 'scene') {
          return schema.node(NodeType.SCENE_BREAK, {
            symbol: feature.symbol || '* * *',
          });
        }
        break;

      case 'quote':
        if (feature.quoteType === 'block') {
          const quotePara = schema.node(
            NodeType.PARAGRAPH,
            null,
            schema.text(content)
          );
          return schema.node(NodeType.BLOCKQUOTE, null, [quotePara]);
        }
        break;

      case 'list': {
        const listItems = feature.items.map((item) =>
          schema.node(NodeType.LIST_ITEM, null, [
            schema.node(NodeType.PARAGRAPH, null, schema.text(item.content)),
          ])
        );

        const listType =
          feature.listType === 'ordered'
            ? NodeType.ORDERED_LIST
            : NodeType.BULLET_LIST;

        const attrs =
          feature.listType === 'ordered' && feature.startNumber
            ? { order: feature.startNumber }
            : null;

        return schema.node(listType, attrs, listItems);
      }
    }
  }

  // Handle basic block types
  switch (blockType) {
    case 'heading':
      return schema.node(
        NodeType.HEADING,
        { level: level || 1 },
        content ? schema.text(content) : undefined
      );

    case 'paragraph':
      return schema.node(
        NodeType.PARAGRAPH,
        null,
        content ? schema.text(content) : undefined
      );

    case 'preformatted':
    case 'code':
      // For now, treat as paragraph with code mark
      return schema.node(
        NodeType.PARAGRAPH,
        null,
        content ? schema.text(content).mark([schema.marks[MarkType.CODE].create()]) : undefined
      );

    default:
      return schema.node(
        NodeType.PARAGRAPH,
        null,
        content ? schema.text(content) : undefined
      );
  }
}

/**
 * Convert ProseMirror document to JSON
 */
export function serializeToJSON(doc: PMNode): Record<string, any> {
  return doc.toJSON();
}

/**
 * Convert JSON to ProseMirror document
 */
export function deserializeFromJSON(
  json: Record<string, any>,
  schema: Schema = editorSchema
): PMNode {
  return PMNode.fromJSON(schema, json);
}

/**
 * Convert ProseMirror document to HTML string
 */
export function serializeToHTML(doc: PMNode): string {
  const div = document.createElement('div');
  const fragment = serializeFragment(doc.content);
  div.appendChild(fragment);
  return div.innerHTML;
}

/**
 * Serialize a ProseMirror fragment to DOM
 */
function serializeFragment(fragment: Fragment): DocumentFragment {
  const domFragment = document.createDocumentFragment();

  fragment.forEach((node) => {
    const domNode = serializeNode(node);
    if (domNode) {
      domFragment.appendChild(domNode);
    }
  });

  return domFragment;
}

/**
 * Serialize a ProseMirror node to DOM
 */
function serializeNode(node: PMNode): Node | null {
  const spec = node.type.spec;

  if (spec.toDOM) {
    const domSpec = spec.toDOM(node);
    return domSpecToDOM(domSpec, node);
  }

  return null;
}

/**
 * Convert ProseMirror DOM spec to actual DOM node
 */
function domSpecToDOM(
  domSpec: any,
  node: PMNode
): Node | null {
  if (typeof domSpec === 'string') {
    return document.createTextNode(domSpec);
  }

  if (!Array.isArray(domSpec)) {
    return null;
  }

  const [tag, ...rest] = domSpec;
  const element = document.createElement(tag);

  let contentIndex = 0;
  if (rest.length > 0 && typeof rest[0] === 'object' && !Array.isArray(rest[0])) {
    const attrs = rest[0];
    Object.keys(attrs).forEach((key) => {
      element.setAttribute(key, attrs[key]);
    });
    contentIndex = 1;
  }

  // Handle content
  if (rest[contentIndex] === 0) {
    // 0 means render node's content
    const fragment = serializeFragment(node.content);
    element.appendChild(fragment);
  }

  return element;
}

/**
 * Parse HTML string to ProseMirror document
 */
export function deserializeFromHTML(
  html: string,
  schema: Schema = editorSchema
): PMNode {
  const div = document.createElement('div');
  div.innerHTML = html;
  return schema.nodeFromHTML(div);
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper to create an empty document
 */
export function createEmptyDocument(schema: Schema = editorSchema): PMNode {
  return schema.node(NodeType.DOC, null, [
    schema.node(NodeType.PARAGRAPH),
  ]);
}

/**
 * Helper to check if document is empty
 */
export function isDocumentEmpty(doc: PMNode): boolean {
  if (doc.childCount === 0) return true;
  if (doc.childCount === 1) {
    const child = doc.firstChild;
    if (child && child.type.name === NodeType.PARAGRAPH && child.childCount === 0) {
      return true;
    }
  }
  return false;
}
