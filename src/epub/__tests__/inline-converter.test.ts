/**
 * Tests for inline formatting converter
 */

import {
  escapeHtml,
  convertInlineText,
  convertLink,
  convertImage,
  convertFootnote,
  convertTextSegment,
  convertRichText,
  convertContent,
  createInlineText,
  createLink,
  parseSimpleFormatting,
} from '../inline-converter';
import {
  InlineText,
  LinkReference,
  ImageReference,
  FootnoteReference,
  RichText,
} from '../../types/inlineText';

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('Hello & goodbye')).toBe('Hello &amp; goodbye');
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
    expect(escapeHtml("It's a test")).toBe('It&#39;s a test');
  });

  it('should handle empty strings', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should handle null/undefined', () => {
    expect(escapeHtml(null as any)).toBe('');
    expect(escapeHtml(undefined as any)).toBe('');
  });
});

describe('convertInlineText', () => {
  it('should convert plain text', () => {
    const inline: InlineText = { text: 'Hello world' };
    expect(convertInlineText(inline)).toBe('Hello world');
  });

  it('should convert bold text', () => {
    const inline: InlineText = {
      text: 'Hello',
      style: { bold: true },
    };
    expect(convertInlineText(inline)).toBe('<strong>Hello</strong>');
  });

  it('should convert italic text', () => {
    const inline: InlineText = {
      text: 'Hello',
      style: { italic: true },
    };
    expect(convertInlineText(inline)).toBe('<em>Hello</em>');
  });

  it('should convert underlined text', () => {
    const inline: InlineText = {
      text: 'Hello',
      style: { underline: true },
    };
    expect(convertInlineText(inline)).toBe('<u>Hello</u>');
  });

  it('should convert strikethrough text', () => {
    const inline: InlineText = {
      text: 'Hello',
      style: { strikethrough: true },
    };
    expect(convertInlineText(inline)).toBe('<del>Hello</del>');
  });

  it('should convert subscript text', () => {
    const inline: InlineText = {
      text: '2',
      style: { subscript: true },
    };
    expect(convertInlineText(inline)).toBe('<sub>2</sub>');
  });

  it('should convert superscript text', () => {
    const inline: InlineText = {
      text: '2',
      style: { superscript: true },
    };
    expect(convertInlineText(inline)).toBe('<sup>2</sup>');
  });

  it('should handle nested formatting (bold + italic)', () => {
    const inline: InlineText = {
      text: 'Hello',
      style: { bold: true, italic: true },
    };
    expect(convertInlineText(inline)).toBe('<em><strong>Hello</strong></em>');
  });

  it('should handle complex nested formatting', () => {
    const inline: InlineText = {
      text: 'Hello',
      style: {
        bold: true,
        italic: true,
        underline: true,
        strikethrough: true,
      },
    };
    expect(convertInlineText(inline)).toBe(
      '<del><u><em><strong>Hello</strong></em></u></del>'
    );
  });

  it('should apply color styling', () => {
    const inline: InlineText = {
      text: 'Red text',
      style: { color: '#ff0000' },
    };
    expect(convertInlineText(inline)).toBe(
      '<span style="color: #ff0000">Red text</span>'
    );
  });

  it('should apply multiple styles with span', () => {
    const inline: InlineText = {
      text: 'Styled',
      style: {
        color: '#ff0000',
        highlight: '#ffff00',
        fontSize: 14,
        fontFamily: 'Arial',
      },
    };
    const result = convertInlineText(inline);
    expect(result).toContain('color: #ff0000');
    expect(result).toContain('background-color: #ffff00');
    expect(result).toContain('font-size: 14px');
    expect(result).toContain('font-family: Arial');
  });

  it('should combine formatting and styling', () => {
    const inline: InlineText = {
      text: 'Fancy',
      style: {
        bold: true,
        italic: true,
        color: '#0000ff',
      },
    };
    const result = convertInlineText(inline);
    expect(result).toContain('<strong>');
    expect(result).toContain('<em>');
    expect(result).toContain('color: #0000ff');
  });

  it('should escape HTML in text content', () => {
    const inline: InlineText = {
      text: '<script>alert("xss")</script>',
      style: { bold: true },
    };
    const result = convertInlineText(inline);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('should handle empty text', () => {
    const inline: InlineText = { text: '' };
    expect(convertInlineText(inline)).toBe('');
  });
});

describe('convertLink', () => {
  it('should convert a basic link', () => {
    const link: LinkReference = {
      type: 'link',
      text: 'Click here',
      url: 'https://example.com',
    };
    expect(convertLink(link)).toBe(
      '<a href="https://example.com">Click here</a>'
    );
  });

  it('should handle link with title', () => {
    const link: LinkReference = {
      type: 'link',
      text: 'Example',
      url: 'https://example.com',
      title: 'Example Website',
    };
    expect(convertLink(link)).toBe(
      '<a href="https://example.com" title="Example Website">Example</a>'
    );
  });

  it('should handle link with target', () => {
    const link: LinkReference = {
      type: 'link',
      text: 'External',
      url: 'https://example.com',
      target: '_blank',
    };
    expect(convertLink(link)).toBe(
      '<a href="https://example.com" target="_blank">External</a>'
    );
  });

  it('should handle link with rel attribute', () => {
    const link: LinkReference = {
      type: 'link',
      text: 'Nofollow',
      url: 'https://example.com',
      rel: 'nofollow noopener',
    };
    expect(convertLink(link)).toBe(
      '<a href="https://example.com" rel="nofollow noopener">Nofollow</a>'
    );
  });

  it('should handle link with all attributes', () => {
    const link: LinkReference = {
      type: 'link',
      text: 'Full Link',
      url: 'https://example.com',
      title: 'Example',
      target: '_blank',
      rel: 'noopener noreferrer',
    };
    const result = convertLink(link);
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('title="Example"');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('should apply inline style to link text', () => {
    const link: LinkReference = {
      type: 'link',
      text: 'Bold Link',
      url: 'https://example.com',
      style: { bold: true, italic: true },
    };
    const result = convertLink(link);
    expect(result).toContain('<strong>');
    expect(result).toContain('<em>');
  });

  it('should escape HTML in link attributes', () => {
    const link: LinkReference = {
      type: 'link',
      text: 'Link',
      url: 'https://example.com?param=<script>',
      title: 'Test "quotes"',
    };
    const result = convertLink(link);
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('&quot;quotes&quot;');
  });

  it('should use URL as fallback text', () => {
    const link: LinkReference = {
      type: 'link',
      text: '',
      url: 'https://example.com',
    };
    expect(convertLink(link)).toContain('https://example.com</a>');
  });
});

describe('convertImage', () => {
  it('should convert a basic image', () => {
    const image: ImageReference = {
      type: 'image',
      id: 'img-1',
      src: 'images/photo.jpg',
    };
    const result = convertImage(image);
    expect(result).toContain('src="images/photo.jpg"');
    expect(result).toContain('alt=""'); // Empty alt for images without alt text
  });

  it('should handle image with alt text', () => {
    const image: ImageReference = {
      type: 'image',
      id: 'img-1',
      src: 'images/photo.jpg',
      alt: 'A beautiful landscape',
    };
    const result = convertImage(image);
    expect(result).toContain('alt="A beautiful landscape"');
  });

  it('should handle image with title', () => {
    const image: ImageReference = {
      type: 'image',
      id: 'img-1',
      src: 'images/photo.jpg',
      title: 'Landscape Photo',
    };
    expect(convertImage(image)).toContain('title="Landscape Photo"');
  });

  it('should handle image with dimensions', () => {
    const image: ImageReference = {
      type: 'image',
      id: 'img-1',
      src: 'images/photo.jpg',
      width: 800,
      height: 600,
    };
    const result = convertImage(image);
    expect(result).toContain('width="800"');
    expect(result).toContain('height="600"');
  });

  it('should escape HTML in image attributes', () => {
    const image: ImageReference = {
      type: 'image',
      id: 'img-1',
      src: 'images/photo.jpg',
      alt: 'Photo with "quotes"',
      title: 'Title <script>',
    };
    const result = convertImage(image);
    expect(result).toContain('&quot;quotes&quot;');
    expect(result).toContain('&lt;script&gt;');
  });
});

describe('convertFootnote', () => {
  it('should convert a numbered footnote', () => {
    const footnote: FootnoteReference = {
      type: 'footnote',
      referenceId: 'fn-1',
      number: 1,
    };
    const result = convertFootnote(footnote);
    expect(result).toContain('<sup>');
    expect(result).toContain('href="#fn-1"');
    expect(result).toContain('id="ref-fn-1"');
    expect(result).toContain('>1<');
  });

  it('should convert a footnote with symbol', () => {
    const footnote: FootnoteReference = {
      type: 'footnote',
      referenceId: 'fn-asterisk',
      symbol: '*',
    };
    const result = convertFootnote(footnote);
    expect(result).toContain('>*<');
  });

  it('should prefer symbol over number', () => {
    const footnote: FootnoteReference = {
      type: 'footnote',
      referenceId: 'fn-2',
      number: 2,
      symbol: '†',
    };
    const result = convertFootnote(footnote);
    expect(result).toContain('>†<');
    expect(result).not.toContain('>2<');
  });

  it('should include epub:type attribute', () => {
    const footnote: FootnoteReference = {
      type: 'footnote',
      referenceId: 'fn-1',
      number: 1,
    };
    expect(convertFootnote(footnote)).toContain('epub:type="noteref"');
  });
});

describe('convertTextSegment', () => {
  it('should handle InlineText segment', () => {
    const segment: InlineText = {
      text: 'Plain text',
    };
    expect(convertTextSegment(segment)).toBe('Plain text');
  });

  it('should handle LinkReference segment', () => {
    const segment: LinkReference = {
      type: 'link',
      text: 'Link',
      url: 'https://example.com',
    };
    expect(convertTextSegment(segment)).toContain('<a href=');
  });

  it('should handle ImageReference segment', () => {
    const segment: ImageReference = {
      type: 'image',
      id: 'img-1',
      src: 'image.jpg',
    };
    expect(convertTextSegment(segment)).toContain('<img');
  });

  it('should handle FootnoteReference segment', () => {
    const segment: FootnoteReference = {
      type: 'footnote',
      referenceId: 'fn-1',
      number: 1,
    };
    expect(convertTextSegment(segment)).toContain('<sup>');
  });
});

describe('convertRichText', () => {
  it('should convert rich text with multiple segments', () => {
    const richText: RichText = {
      segments: [
        { text: 'Hello ' },
        { text: 'world', style: { bold: true } },
        { text: '!' },
      ],
      plainText: 'Hello world!',
    };
    expect(convertRichText(richText)).toBe(
      'Hello <strong>world</strong>!'
    );
  });

  it('should handle rich text with links', () => {
    const richText: RichText = {
      segments: [
        { text: 'Visit ' },
        {
          type: 'link',
          text: 'our website',
          url: 'https://example.com',
        },
        { text: ' for more info.' },
      ],
      plainText: 'Visit our website for more info.',
    };
    const result = convertRichText(richText);
    expect(result).toContain('Visit ');
    expect(result).toContain('<a href="https://example.com">our website</a>');
    expect(result).toContain(' for more info.');
  });

  it('should handle rich text with footnotes', () => {
    const richText: RichText = {
      segments: [
        { text: 'Some text' },
        {
          type: 'footnote',
          referenceId: 'fn-1',
          number: 1,
        },
        { text: ' continues here.' },
      ],
      plainText: 'Some text continues here.',
    };
    const result = convertRichText(richText);
    expect(result).toContain('Some text');
    expect(result).toContain('<sup>');
    expect(result).toContain(' continues here.');
  });

  it('should fallback to plain text when no segments', () => {
    const richText: RichText = {
      segments: [],
      plainText: 'Fallback text',
    };
    expect(convertRichText(richText)).toBe('Fallback text');
  });
});

describe('convertContent', () => {
  it('should handle string content', () => {
    expect(convertContent('Simple text')).toBe('Simple text');
  });

  it('should handle RichText content', () => {
    const richText: RichText = {
      segments: [{ text: 'Rich', style: { bold: true } }],
      plainText: 'Rich',
    };
    expect(convertContent(richText)).toBe('<strong>Rich</strong>');
  });

  it('should handle array of segments', () => {
    const segments = [
      { text: 'Hello ' },
      { text: 'world', style: { italic: true } },
    ];
    expect(convertContent(segments)).toBe('Hello <em>world</em>');
  });

  it('should escape HTML in string content', () => {
    expect(convertContent('<script>bad</script>')).toBe(
      '&lt;script&gt;bad&lt;/script&gt;'
    );
  });
});

describe('createInlineText', () => {
  it('should create InlineText without style', () => {
    const inline = createInlineText('Test');
    expect(inline.text).toBe('Test');
    expect(inline.style).toBeUndefined();
  });

  it('should create InlineText with style', () => {
    const inline = createInlineText('Test', { bold: true, italic: true });
    expect(inline.text).toBe('Test');
    expect(inline.style?.bold).toBe(true);
    expect(inline.style?.italic).toBe(true);
  });
});

describe('createLink', () => {
  it('should create basic link', () => {
    const link = createLink('Text', 'https://example.com');
    expect(link.type).toBe('link');
    expect(link.text).toBe('Text');
    expect(link.url).toBe('https://example.com');
  });

  it('should create link with options', () => {
    const link = createLink('Text', 'https://example.com', {
      title: 'Title',
      target: '_blank',
      rel: 'noopener',
      style: { bold: true },
    });
    expect(link.title).toBe('Title');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener');
    expect(link.style?.bold).toBe(true);
  });
});

describe('parseSimpleFormatting', () => {
  it('should parse bold text', () => {
    const segments = parseSimpleFormatting('This is **bold** text');
    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ text: 'This is ' });
    expect(segments[1]).toEqual({ text: 'bold', style: { bold: true } });
    expect(segments[2]).toEqual({ text: ' text' });
  });

  it('should handle plain text without formatting', () => {
    const segments = parseSimpleFormatting('Plain text');
    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({ text: 'Plain text' });
  });

  it('should handle multiple bold segments', () => {
    const segments = parseSimpleFormatting('**First** and **second**');
    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ text: 'First', style: { bold: true } });
    expect(segments[1]).toEqual({ text: ' and ' });
    expect(segments[2]).toEqual({ text: 'second', style: { bold: true } });
  });

  it('should handle empty string', () => {
    const segments = parseSimpleFormatting('');
    expect(segments).toHaveLength(0);
  });
});
