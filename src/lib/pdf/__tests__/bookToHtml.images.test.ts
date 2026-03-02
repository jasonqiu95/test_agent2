/**
 * Unit tests for image and figure generation functions in bookToHtml
 * Tests inline images, figures with captions, alignment, sizing, and styling
 */

import {
  generateImage,
  generateFigure,
  generateImageClasses,
  generateFigureClasses,
  generateImageStyles,
} from '../bookToHtml';
import { Image, Figure } from '../../../types/textFeature';

describe('Image and Figure Generation Functions', () => {
  describe('generateImageClasses', () => {
    it('should generate base image classes', () => {
      const image: Image = {
        type: 'image',
        src: '/images/test.jpg',
        alt: 'Test image',
      };
      const classes = generateImageClasses(image);
      expect(classes).toContain('book-element-image');
      expect(classes).toContain('book-element-image-responsive');
    });

    it('should add alignment classes', () => {
      const image: Image = {
        type: 'image',
        src: '/images/test.jpg',
        alt: 'Test image',
        alignment: 'center',
      };
      const classes = generateImageClasses(image);
      expect(classes).toContain('book-element-image-center');
    });

    it('should add sizing classes', () => {
      const image: Image = {
        type: 'image',
        src: '/images/test.jpg',
        alt: 'Test image',
        sizing: 'medium',
      };
      const classes = generateImageClasses(image);
      expect(classes).toContain('book-element-image-size-medium');
    });

    it('should add base64 embedded class when isBase64 is true', () => {
      const image: Image = {
        type: 'image',
        src: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        alt: 'Embedded image',
        isBase64: true,
      };
      const classes = generateImageClasses(image);
      expect(classes).toContain('book-element-image-embedded');
    });

    it('should add custom CSS classes', () => {
      const image: Image = {
        type: 'image',
        src: '/images/test.jpg',
        alt: 'Test image',
        cssClasses: ['custom-class-1', 'custom-class-2'],
      };
      const classes = generateImageClasses(image);
      expect(classes).toContain('custom-class-1');
      expect(classes).toContain('custom-class-2');
    });

    it('should use custom class prefix', () => {
      const image: Image = {
        type: 'image',
        src: '/images/test.jpg',
        alt: 'Test image',
      };
      const classes = generateImageClasses(image, 'custom');
      expect(classes).toContain('custom-element-image');
      expect(classes).not.toContain('book-element-image');
    });
  });

  describe('generateImage', () => {
    it('should generate basic img tag with required attributes', () => {
      const image: Image = {
        type: 'image',
        src: '/images/test.jpg',
        alt: 'Test image',
      };
      const html = generateImage(image);
      expect(html).toContain('<img');
      expect(html).toContain('src="/images/test.jpg"');
      expect(html).toContain('alt="Test image"');
      expect(html).toContain('loading="lazy"');
      expect(html).toContain('/>');
    });

    it('should include title attribute when provided', () => {
      const image: Image = {
        type: 'image',
        src: '/images/test.jpg',
        alt: 'Test image',
        title: 'Image title',
      };
      const html = generateImage(image);
      expect(html).toContain('title="Image title"');
    });

    it('should include width and height when provided', () => {
      const image: Image = {
        type: 'image',
        src: '/images/test.jpg',
        alt: 'Test image',
        width: '300px',
        height: '200px',
      };
      const html = generateImage(image);
      expect(html).toContain('width="300px"');
      expect(html).toContain('height="200px"');
    });

    it('should escape HTML in alt text', () => {
      const image: Image = {
        type: 'image',
        src: '/images/test.jpg',
        alt: '<script>alert("xss")</script>',
      };
      const html = generateImage(image);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape quotes in src URL', () => {
      const image: Image = {
        type: 'image',
        src: '/images/test"quoted.jpg',
        alt: 'Test image',
      };
      const html = generateImage(image);
      expect(html).toContain('src="/images/test&quot;quoted.jpg"');
    });

    it('should handle base64 data URIs', () => {
      const image: Image = {
        type: 'image',
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
        alt: 'Embedded image',
        isBase64: true,
      };
      const html = generateImage(image);
      expect(html).toContain('src="data:image/png;base64,');
      expect(html).toContain('class=');
      expect(html).toContain('book-element-image-embedded');
    });

    it('should apply alignment classes', () => {
      const image: Image = {
        type: 'image',
        src: '/images/test.jpg',
        alt: 'Test image',
        alignment: 'left',
      };
      const html = generateImage(image);
      expect(html).toContain('class=');
      expect(html).toContain('book-element-image-left');
    });

    it('should apply sizing classes', () => {
      const image: Image = {
        type: 'image',
        src: '/images/test.jpg',
        alt: 'Test image',
        sizing: 'large',
      };
      const html = generateImage(image);
      expect(html).toContain('book-element-image-size-large');
    });
  });

  describe('generateFigureClasses', () => {
    it('should generate base figure classes', () => {
      const figure: Figure = {
        type: 'figure',
        image: {
          type: 'image',
          src: '/images/test.jpg',
          alt: 'Test image',
        },
      };
      const classes = generateFigureClasses(figure);
      expect(classes).toContain('book-element-figure');
    });

    it('should add alignment classes', () => {
      const figure: Figure = {
        type: 'figure',
        image: {
          type: 'image',
          src: '/images/test.jpg',
          alt: 'Test image',
        },
        alignment: 'center',
      };
      const classes = generateFigureClasses(figure);
      expect(classes).toContain('book-element-figure-center');
    });

    it('should add caption indicator class when caption is present', () => {
      const figure: Figure = {
        type: 'figure',
        image: {
          type: 'image',
          src: '/images/test.jpg',
          alt: 'Test image',
        },
        caption: 'Figure caption',
      };
      const classes = generateFigureClasses(figure);
      expect(classes).toContain('book-element-figure-with-caption');
    });

    it('should add custom CSS classes', () => {
      const figure: Figure = {
        type: 'figure',
        image: {
          type: 'image',
          src: '/images/test.jpg',
          alt: 'Test image',
        },
        cssClasses: ['custom-figure', 'special-figure'],
      };
      const classes = generateFigureClasses(figure);
      expect(classes).toContain('custom-figure');
      expect(classes).toContain('special-figure');
    });
  });

  describe('generateFigure', () => {
    it('should generate figure with image', () => {
      const figure: Figure = {
        type: 'figure',
        image: {
          type: 'image',
          src: '/images/test.jpg',
          alt: 'Test image',
        },
      };
      const html = generateFigure(figure);
      expect(html).toContain('<figure');
      expect(html).toContain('<img');
      expect(html).toContain('src="/images/test.jpg"');
      expect(html).toContain('</figure>');
    });

    it('should include figcaption when caption is provided', () => {
      const figure: Figure = {
        type: 'figure',
        image: {
          type: 'image',
          src: '/images/test.jpg',
          alt: 'Test image',
        },
        caption: 'This is a figure caption',
      };
      const html = generateFigure(figure);
      expect(html).toContain('<figcaption');
      expect(html).toContain('This is a figure caption');
      expect(html).toContain('</figcaption>');
      expect(html).toContain('book-element-caption');
    });

    it('should escape HTML in caption', () => {
      const figure: Figure = {
        type: 'figure',
        image: {
          type: 'image',
          src: '/images/test.jpg',
          alt: 'Test image',
        },
        caption: '<script>alert("xss")</script>',
      };
      const html = generateFigure(figure);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should apply alignment classes to figure', () => {
      const figure: Figure = {
        type: 'figure',
        image: {
          type: 'image',
          src: '/images/test.jpg',
          alt: 'Test image',
        },
        alignment: 'right',
      };
      const html = generateFigure(figure);
      expect(html).toContain('class=');
      expect(html).toContain('book-element-figure-right');
    });

    it('should handle full-width figures', () => {
      const figure: Figure = {
        type: 'figure',
        image: {
          type: 'image',
          src: '/images/wide.jpg',
          alt: 'Wide image',
          alignment: 'full-width',
        },
        alignment: 'full-width',
      };
      const html = generateFigure(figure);
      expect(html).toContain('book-element-figure-full-width');
    });

    it('should use custom class prefix', () => {
      const figure: Figure = {
        type: 'figure',
        image: {
          type: 'image',
          src: '/images/test.jpg',
          alt: 'Test image',
        },
        caption: 'Caption',
      };
      const html = generateFigure(figure, 'custom');
      expect(html).toContain('custom-element-figure');
      expect(html).toContain('custom-element-caption');
      expect(html).not.toContain('book-element');
    });

    it('should properly nest image within figure', () => {
      const figure: Figure = {
        type: 'figure',
        image: {
          type: 'image',
          src: '/images/test.jpg',
          alt: 'Test image',
        },
        caption: 'Caption',
      };
      const html = generateFigure(figure);

      const figureOpenIndex = html.indexOf('<figure');
      const imgIndex = html.indexOf('<img');
      const figcaptionIndex = html.indexOf('<figcaption');
      const figureCloseIndex = html.indexOf('</figure>');

      expect(figureOpenIndex).toBeLessThan(imgIndex);
      expect(imgIndex).toBeLessThan(figcaptionIndex);
      expect(figcaptionIndex).toBeLessThan(figureCloseIndex);
    });
  });

  describe('generateImageStyles', () => {
    it('should generate CSS rules for images', () => {
      const css = generateImageStyles();
      expect(css).toContain('.book-element-image');
      expect(css).toContain('max-width: 100%');
      expect(css).toContain('height: auto');
    });

    it('should include sizing styles', () => {
      const css = generateImageStyles();
      expect(css).toContain('.book-element-image-size-small');
      expect(css).toContain('.book-element-image-size-medium');
      expect(css).toContain('.book-element-image-size-large');
      expect(css).toContain('.book-element-image-size-full');
    });

    it('should include alignment styles', () => {
      const css = generateImageStyles();
      expect(css).toContain('.book-element-image-left');
      expect(css).toContain('.book-element-image-right');
      expect(css).toContain('.book-element-image-center');
      expect(css).toContain('.book-element-image-full-width');
    });

    it('should include figure styles', () => {
      const css = generateImageStyles();
      expect(css).toContain('.book-element-figure');
      expect(css).toContain('.book-element-caption');
      expect(css).toContain('.book-element-figure-with-caption');
    });

    it('should include responsive media queries', () => {
      const css = generateImageStyles();
      expect(css).toContain('@media screen and (max-width: 768px)');
    });

    it('should include print styles', () => {
      const css = generateImageStyles();
      expect(css).toContain('@media print');
      expect(css).toContain('page-break-inside: avoid');
    });

    it('should use custom class prefix', () => {
      const css = generateImageStyles('custom');
      expect(css).toContain('.custom-element-image');
      expect(css).toContain('.custom-element-figure');
      expect(css).not.toContain('.book-element-image');
    });
  });

  describe('Integration - Images and Figures Together', () => {
    it('should handle multiple images with different alignments', () => {
      const images = [
        { type: 'image' as const, src: '/img1.jpg', alt: 'Image 1', alignment: 'left' as const },
        { type: 'image' as const, src: '/img2.jpg', alt: 'Image 2', alignment: 'center' as const },
        { type: 'image' as const, src: '/img3.jpg', alt: 'Image 3', alignment: 'right' as const },
      ];

      const htmls = images.map(img => generateImage(img));

      expect(htmls[0]).toContain('book-element-image-left');
      expect(htmls[1]).toContain('book-element-image-center');
      expect(htmls[2]).toContain('book-element-image-right');
    });

    it('should handle figures with different image sizes', () => {
      const figures: Figure[] = [
        {
          type: 'figure',
          image: { type: 'image', src: '/small.jpg', alt: 'Small', sizing: 'small' },
          caption: 'Small figure',
        },
        {
          type: 'figure',
          image: { type: 'image', src: '/large.jpg', alt: 'Large', sizing: 'large' },
          caption: 'Large figure',
        },
      ];

      const htmls = figures.map(fig => generateFigure(fig));

      expect(htmls[0]).toContain('book-element-image-size-small');
      expect(htmls[0]).toContain('Small figure');
      expect(htmls[1]).toContain('book-element-image-size-large');
      expect(htmls[1]).toContain('Large figure');
    });
  });
});
