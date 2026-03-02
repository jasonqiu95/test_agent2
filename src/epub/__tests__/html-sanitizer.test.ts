/**
 * Tests for HTML Sanitizer
 */

import {
  HtmlSanitizer,
  sanitizeHtml,
  encodeSpecialCharacters,
  decodeHtmlEntities,
  validateHtmlStructure,
  cleanMalformedHtml,
  type SanitizationOptions,
} from '../html-sanitizer';

describe('HtmlSanitizer', () => {
  describe('Basic sanitization', () => {
    it('should allow safe HTML tags', () => {
      const html = '<p>Hello <strong>world</strong>!</p>';
      const result = sanitizeHtml(html);
      expect(result).toBe(html);
    });

    it('should remove dangerous script tags', () => {
      const html = '<p>Hello</p><script>alert("XSS")</script><p>World</p>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('should remove dangerous event handlers', () => {
      const html = '<p onclick="alert(\'XSS\')">Click me</p>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('onclick');
      expect(result).toContain('Click me');
    });

    it('should preserve safe attributes', () => {
      const html = '<p id="test" class="content" title="Hello">Text</p>';
      const result = sanitizeHtml(html);
      expect(result).toContain('id="test"');
      expect(result).toContain('class="content"');
      expect(result).toContain('title="Hello"');
    });

    it('should handle empty input', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
    });
  });

  describe('Dangerous tag removal', () => {
    it('should remove script tags', () => {
      const html = '<div><script>malicious()</script>Content</div>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('script');
      expect(result).toContain('Content');
    });

    it('should remove style tags', () => {
      const html = '<div><style>body { background: red; }</style>Content</div>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('style>');
      expect(result).toContain('Content');
    });

    it('should remove iframe tags', () => {
      const html = '<div><iframe src="evil.com"></iframe>Content</div>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('iframe');
      expect(result).toContain('Content');
    });

    it('should remove object and embed tags', () => {
      const html = '<div><object data="evil.swf"></object><embed src="evil.swf">Content</div>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('object');
      expect(result).not.toContain('embed');
      expect(result).toContain('Content');
    });
  });

  describe('Attribute sanitization', () => {
    it('should remove all event handler attributes', () => {
      const events = [
        'onclick', 'onload', 'onerror', 'onmouseover',
        'onmouseout', 'onfocus', 'onblur',
      ];

      for (const event of events) {
        const html = `<div ${event}="alert('XSS')">Test</div>`;
        const result = sanitizeHtml(html);
        expect(result).not.toContain(event);
      }
    });

    it('should allow safe link attributes', () => {
      const html = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
      const result = sanitizeHtml(html);
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener"');
    });

    it('should allow safe image attributes', () => {
      const html = '<img src="image.jpg" alt="Description" width="100" height="100">';
      const result = sanitizeHtml(html);
      expect(result).toContain('src="image.jpg"');
      expect(result).toContain('alt="Description"');
      expect(result).toContain('width="100"');
      expect(result).toContain('height="100"');
    });

    it('should remove data attributes by default', () => {
      const html = '<div data-id="123" data-custom="value">Test</div>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('data-id');
      expect(result).not.toContain('data-custom');
    });

    it('should allow data attributes when enabled', () => {
      const html = '<div data-id="123" data-custom="value">Test</div>';
      const result = sanitizeHtml(html, { allowDataAttributes: true });
      expect(result).toContain('data-id="123"');
      expect(result).toContain('data-custom="value"');
    });
  });

  describe('URL validation', () => {
    it('should allow safe URL protocols', () => {
      const urls = [
        'https://example.com',
        'http://example.com',
        'mailto:test@example.com',
        'tel:+1234567890',
        '#section',
      ];

      for (const url of urls) {
        const html = `<a href="${url}">Link</a>`;
        const result = sanitizeHtml(html);
        expect(result).toContain(`href="${url}"`);
      }
    });

    it('should remove javascript: URLs', () => {
      const html = '<a href="javascript:alert(\'XSS\')">Link</a>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('javascript:');
      expect(result).toContain('Link');
    });

    it('should remove data: URLs', () => {
      const html = '<a href="data:text/html,<script>alert(\'XSS\')</script>">Link</a>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('data:');
      expect(result).toContain('Link');
    });

    it('should remove vbscript: URLs', () => {
      const html = '<a href="vbscript:msgbox">Link</a>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('vbscript:');
      expect(result).toContain('Link');
    });

    it('should allow relative URLs', () => {
      const urls = ['/path/to/page', './relative', '../parent'];

      for (const url of urls) {
        const html = `<a href="${url}">Link</a>`;
        const result = sanitizeHtml(html);
        expect(result).toContain(`href="${url}"`);
      }
    });
  });

  describe('Style attribute sanitization', () => {
    it('should remove style attributes by default', () => {
      const html = '<div style="color: red;">Styled</div>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('style=');
    });

    it('should allow safe styles when enabled', () => {
      const html = '<div style="color: red; font-size: 14px;">Styled</div>';
      const result = sanitizeHtml(html, { allowStyles: true });
      expect(result).toContain('style=');
      expect(result).toContain('color: red');
    });

    it('should remove dangerous CSS properties', () => {
      const html = '<div style="behavior: url(xss.htc);">Styled</div>';
      const result = sanitizeHtml(html, { allowStyles: true });
      expect(result).not.toContain('behavior');
    });

    it('should remove javascript: in CSS urls', () => {
      const html = '<div style="background: url(javascript:alert(\'XSS\'));">Styled</div>';
      const result = sanitizeHtml(html, { allowStyles: true });
      expect(result).not.toContain('javascript:');
    });
  });

  describe('Custom options', () => {
    it('should allow custom tags', () => {
      const html = '<custom-tag>Content</custom-tag>';
      const result = sanitizeHtml(html, {
        allowedTags: ['custom-tag'],
      });
      expect(result).toContain('custom-tag');
    });

    it('should allow custom attributes', () => {
      const html = '<div custom-attr="value">Content</div>';
      const result = sanitizeHtml(html, {
        allowedAttributes: { div: ['custom-attr'] },
      });
      expect(result).toContain('custom-attr="value"');
    });

    it('should allow custom protocols', () => {
      const html = '<a href="custom://resource">Link</a>';
      const result = sanitizeHtml(html, {
        allowedProtocols: ['custom:'],
      });
      expect(result).toContain('href="custom://resource"');
    });

    it('should strip all tags when requested', () => {
      const html = '<p>Hello <strong>world</strong>!</p>';
      const result = sanitizeHtml(html, { stripAll: true });
      expect(result).toBe('Hello world!');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should remove comments by default', () => {
      const html = '<p>Text</p><!-- Comment --><p>More</p>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<!--');
      expect(result).not.toContain('Comment');
    });

    it('should keep comments when requested', () => {
      const html = '<p>Text</p><!-- Comment --><p>More</p>';
      const result = sanitizeHtml(html, { keepComments: true });
      expect(result).toContain('<!--');
      expect(result).toContain('Comment');
    });
  });

  describe('Sanitization result', () => {
    it('should return detailed result with metadata', () => {
      const sanitizer = new HtmlSanitizer();
      const html = '<p>Safe</p><script>alert("XSS")</script><div onclick="evil()">Test</div>';
      const result = sanitizer.sanitize(html);

      expect(result.modified).toBe(true);
      expect(result.removedTags).toContain('script');
      expect(result.removedAttributes).toContain('onclick');
      expect(result.html).toContain('Safe');
      expect(result.html).not.toContain('script');
    });

    it('should indicate no modifications for safe HTML', () => {
      const sanitizer = new HtmlSanitizer();
      const html = '<p>Safe content</p>';
      const result = sanitizer.sanitize(html);

      expect(result.modified).toBe(false);
      expect(result.removedTags).toHaveLength(0);
      expect(result.removedAttributes).toHaveLength(0);
    });
  });

  describe('Complex HTML structures', () => {
    it('should handle nested structures', () => {
      const html = `
        <div class="container">
          <h1>Title</h1>
          <p>Paragraph with <strong>bold</strong> and <em>italic</em></p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      `;
      const result = sanitizeHtml(html);
      expect(result).toContain('container');
      expect(result).toContain('Title');
      expect(result).toContain('bold');
      expect(result).toContain('italic');
      expect(result).toContain('Item 1');
    });

    it('should handle tables', () => {
      const html = `
        <table>
          <thead>
            <tr><th>Header</th></tr>
          </thead>
          <tbody>
            <tr><td>Data</td></tr>
          </tbody>
        </table>
      `;
      const result = sanitizeHtml(html);
      expect(result).toContain('table');
      expect(result).toContain('thead');
      expect(result).toContain('tbody');
      expect(result).toContain('Header');
      expect(result).toContain('Data');
    });

    it('should preserve text content when removing tags', () => {
      const html = '<div>Start <script>alert("XSS")</script> Middle <style>evil</style> End</div>';
      const result = sanitizeHtml(html);
      expect(result).toContain('Start');
      expect(result).toContain('Middle');
      expect(result).toContain('End');
    });
  });
});

describe('encodeSpecialCharacters', () => {
  it('should encode HTML special characters', () => {
    expect(encodeSpecialCharacters('&')).toBe('&amp;');
    expect(encodeSpecialCharacters('<')).toBe('&lt;');
    expect(encodeSpecialCharacters('>')).toBe('&gt;');
    expect(encodeSpecialCharacters('"')).toBe('&quot;');
    expect(encodeSpecialCharacters("'")).toBe('&#39;');
  });

  it('should encode multiple characters', () => {
    const text = '<script>alert("XSS")</script>';
    const encoded = encodeSpecialCharacters(text);
    expect(encoded).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  });

  it('should preserve normal text', () => {
    const text = 'Hello world!';
    expect(encodeSpecialCharacters(text)).toBe(text);
  });
});

describe('decodeHtmlEntities', () => {
  it('should decode HTML entities', () => {
    expect(decodeHtmlEntities('&amp;')).toBe('&');
    expect(decodeHtmlEntities('&lt;')).toBe('<');
    expect(decodeHtmlEntities('&gt;')).toBe('>');
    expect(decodeHtmlEntities('&quot;')).toBe('"');
  });

  it('should decode multiple entities', () => {
    const encoded = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
    const decoded = decodeHtmlEntities(encoded);
    expect(decoded).toBe('<script>alert("XSS")</script>');
  });

  it('should preserve normal text', () => {
    const text = 'Hello world!';
    expect(decodeHtmlEntities(text)).toBe(text);
  });
});

describe('validateHtmlStructure', () => {
  it('should validate correct HTML', () => {
    const html = '<div><p>Hello</p></div>';
    const result = validateHtmlStructure(html);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect unclosed tags', () => {
    const html = '<div><p>Hello</div>';
    const result = validateHtmlStructure(html);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should detect unexpected closing tags', () => {
    const html = '<div></p></div>';
    const result = validateHtmlStructure(html);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should allow self-closing tags', () => {
    const html = '<div><br><hr><img src="test.jpg"></div>';
    const result = validateHtmlStructure(html);
    expect(result.valid).toBe(true);
  });
});

describe('cleanMalformedHtml', () => {
  it('should clean up malformed HTML', () => {
    const html = '<div><p>Unclosed paragraph<div>Content</div>';
    const cleaned = cleanMalformedHtml(html);
    // Browser will auto-close the p tag
    expect(cleaned).toBeTruthy();
  });

  it('should preserve well-formed HTML', () => {
    const html = '<div><p>Hello</p></div>';
    const cleaned = cleanMalformedHtml(html);
    expect(cleaned).toContain('Hello');
    expect(cleaned).toContain('div');
    expect(cleaned).toContain('p');
  });

  it('should handle empty input', () => {
    expect(cleanMalformedHtml('')).toBe('');
  });
});

describe('Real-world scenarios', () => {
  it('should sanitize EPUB chapter content', () => {
    const html = `
      <section id="chapter-1" class="chapter">
        <h1>Chapter 1: The Beginning</h1>
        <p>It was a dark and stormy night...</p>
        <p>The hero <strong>ventured</strong> into the <em>unknown</em>.</p>
        <blockquote>
          <p>"This is a quote."</p>
        </blockquote>
        <figure>
          <img src="image.jpg" alt="Scene">
          <figcaption>A dramatic scene</figcaption>
        </figure>
      </section>
    `;

    const result = sanitizeHtml(html);
    expect(result).toContain('chapter-1');
    expect(result).toContain('Chapter 1');
    expect(result).toContain('ventured');
    expect(result).toContain('blockquote');
    expect(result).toContain('figure');
    expect(result).toContain('img');
  });

  it('should handle mixed safe and dangerous content', () => {
    const html = `
      <div class="content">
        <h2>Title</h2>
        <script>stealData()</script>
        <p onclick="malicious()">Click me</p>
        <a href="javascript:alert('XSS')">Link</a>
        <p>Safe content</p>
        <img src="x" onerror="alert('XSS')">
      </div>
    `;

    const result = sanitizeHtml(html);
    expect(result).toContain('Title');
    expect(result).toContain('Safe content');
    expect(result).not.toContain('script');
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('onerror');
  });

  it('should sanitize user-generated content', () => {
    const userInput = '<p>My review: <strong>Amazing!</strong></p><script>steal()</script>';
    const result = sanitizeHtml(userInput);
    expect(result).toContain('My review');
    expect(result).toContain('Amazing');
    expect(result).not.toContain('script');
    expect(result).not.toContain('steal');
  });
});
