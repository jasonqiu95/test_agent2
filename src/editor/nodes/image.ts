/**
 * ProseMirror Image Node Specification
 * Supports both inline and block images with flexible alignment options
 */

import { NodeSpec, DOMOutputSpec, Node as PMNode } from 'prosemirror-model';
import { ImageAttrs } from '../types';

/**
 * Image node specification
 *
 * Features:
 * - Supports both base64 data URIs and external URLs
 * - Dynamic inline/block behavior based on alignment attribute
 * - Optional width, height, alt, and title attributes
 * - Draggable and atom (treated as single unit)
 * - Alignment options: inline (default), block, left, right
 */
export const imageNodeSpec: NodeSpec = {
  attrs: {
    src: { default: '' },
    alt: { default: null },
    title: { default: null },
    width: { default: null },
    height: { default: null },
    alignment: { default: 'inline' },
  } as Record<keyof ImageAttrs, { default: string | number | null }>,

  // Dynamic inline/block behavior based on alignment
  inline: true,
  group: 'inline',

  atom: true,
  draggable: true,

  parseDOM: [
    {
      tag: 'img[src]',
      getAttrs(dom) {
        const element = dom as HTMLImageElement;
        const parent = element.parentElement;

        // Determine alignment from various sources
        let alignment: ImageAttrs['alignment'] = 'inline';

        // Check for data-alignment attribute
        const dataAlignment = element.getAttribute('data-alignment') as ImageAttrs['alignment'];
        if (dataAlignment) {
          alignment = dataAlignment;
        }
        // Check parent wrapper classes for alignment hints
        else if (parent) {
          if (parent.classList.contains('image-block')) {
            alignment = 'block';
          } else if (parent.classList.contains('image-left')) {
            alignment = 'left';
          } else if (parent.classList.contains('image-right')) {
            alignment = 'right';
          } else if (element.style.display === 'block' || parent.style.textAlign === 'center') {
            alignment = 'block';
          } else if (element.style.float === 'left' || parent.style.float === 'left') {
            alignment = 'left';
          } else if (element.style.float === 'right' || parent.style.float === 'right') {
            alignment = 'right';
          }
        }

        // Parse width and height
        const widthAttr = element.getAttribute('width');
        const heightAttr = element.getAttribute('height');

        return {
          src: element.getAttribute('src') || '',
          alt: element.getAttribute('alt') || null,
          title: element.getAttribute('title') || null,
          width: widthAttr ? parseInt(widthAttr, 10) : (element.width || null),
          height: heightAttr ? parseInt(heightAttr, 10) : (element.height || null),
          alignment,
        };
      },
    },
    // Also parse wrapped images
    {
      tag: 'div.image-wrapper img[src]',
      getAttrs(dom) {
        const element = dom as HTMLImageElement;
        const wrapper = element.parentElement;

        let alignment: ImageAttrs['alignment'] = 'block';

        if (wrapper) {
          if (wrapper.classList.contains('image-left')) {
            alignment = 'left';
          } else if (wrapper.classList.contains('image-right')) {
            alignment = 'right';
          } else if (wrapper.classList.contains('image-inline')) {
            alignment = 'inline';
          }
        }

        const widthAttr = element.getAttribute('width');
        const heightAttr = element.getAttribute('height');

        return {
          src: element.getAttribute('src') || '',
          alt: element.getAttribute('alt') || null,
          title: element.getAttribute('title') || null,
          width: widthAttr ? parseInt(widthAttr, 10) : (element.width || null),
          height: heightAttr ? parseInt(heightAttr, 10) : (element.height || null),
          alignment,
        };
      },
    },
  ],

  toDOM(node: PMNode): DOMOutputSpec {
    const attrs = node.attrs as ImageAttrs;
    const alignment = attrs.alignment || 'inline';

    // Build image attributes
    const imgAttrs: Record<string, string | number> = {
      src: attrs.src,
      'data-alignment': alignment,
    };

    if (attrs.alt) imgAttrs.alt = attrs.alt;
    if (attrs.title) imgAttrs.title = attrs.title;
    if (attrs.width) imgAttrs.width = attrs.width;
    if (attrs.height) imgAttrs.height = attrs.height;

    // For inline images, return just the img tag
    if (alignment === 'inline') {
      return ['img', imgAttrs];
    }

    // For block/left/right alignment, wrap in a div
    const wrapperClass = `image-wrapper image-${alignment}`;
    return ['div', { class: wrapperClass }, ['img', imgAttrs]];
  },
};

/**
 * Helper function to create an image node
 */
export function createImageNode(schema: any, attrs: ImageAttrs): PMNode {
  return schema.nodes.image.create(attrs);
}

/**
 * Helper function to validate image src (supports both URLs and data URIs)
 */
export function isValidImageSrc(src: string): boolean {
  if (!src) return false;

  // Check for data URI (base64)
  if (src.startsWith('data:image/')) {
    return true;
  }

  // Check for URL
  try {
    new URL(src);
    return true;
  } catch {
    // Could be a relative path
    return src.length > 0;
  }
}
