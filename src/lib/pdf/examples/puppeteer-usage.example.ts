/**
 * Example usage of Puppeteer page configuration for PDF generation
 */

import puppeteer from 'puppeteer';
import {
  configurePage,
  generatePdfFromHtml,
  createDefaultPageConfig,
  type PuppeteerPageConfig,
} from '../puppeteerConfig';
import type { BookStyle } from '../../../types/style';

/**
 * Example 1: Basic PDF generation with default settings
 */
export async function basicExample() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const config = createDefaultPageConfig();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Sample Book</title>
      </head>
      <body>
        <h1>Chapter 1: Introduction</h1>
        <p>This is the first paragraph of the book.</p>
        <p>This is the second paragraph with more content.</p>
      </body>
    </html>
  `;

  const pdfBuffer = await generatePdfFromHtml(page, htmlContent, config);

  await browser.close();

  return pdfBuffer;
}

/**
 * Example 2: Custom page configuration with headers and page numbers
 */
export async function customConfigExample() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const config: PuppeteerPageConfig = {
    trimSize: '5x8',
    margins: {
      top: 1.0,
      bottom: 1.0,
      inside: 0.875,
      outside: 0.625,
    },
    printBackground: true,
    quality: 'high',
    waitForFonts: true,
    headerConfig: {
      enabled: true,
      leftPage: 'My Book Title',
      rightPage: 'Chapter Title',
      fontSize: 10,
      fontFamily: 'Georgia',
    },
    pageNumberConfig: {
      enabled: true,
      position: 'bottom',
      alignment: 'center',
      startNumber: 1,
      fontSize: 10,
      fontFamily: 'Georgia',
    },
    pageBreaks: {
      avoidOrphans: true,
      avoidWidows: true,
      minOrphanLines: 2,
      minWidowLines: 2,
    },
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Sample Book</title>
        <style>
          body {
            font-family: Georgia, serif;
            font-size: 11pt;
            line-height: 1.5;
          }
          h1 {
            font-size: 18pt;
            margin-top: 2em;
            margin-bottom: 1em;
          }
          p {
            text-align: justify;
            margin-bottom: 0.5em;
          }
        </style>
      </head>
      <body>
        <h1>Chapter 1: The Beginning</h1>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
        <div class="page-break"></div>
        <h1>Chapter 2: The Middle</h1>
        <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...</p>
      </body>
    </html>
  `;

  const pdfBuffer = await generatePdfFromHtml(page, htmlContent, config);

  await browser.close();

  return pdfBuffer;
}

/**
 * Example 3: Using style configuration
 */
export async function styledExample(bookStyle: BookStyle) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const config: PuppeteerPageConfig = {
    trimSize: '6x9',
    margins: {
      top: 0.75,
      bottom: 0.75,
      inside: 0.75,
      outside: 0.5,
    },
    printBackground: true,
    style: bookStyle,
    quality: 'standard',
    waitForFonts: true,
    headerConfig: {
      enabled: true,
      leftPage: 'Author Name',
      rightPage: 'Book Title',
    },
    pageNumberConfig: {
      enabled: true,
      position: 'bottom',
      alignment: 'center',
      startNumber: 1,
    },
  };

  const htmlContent = generateStyledHtml(bookStyle);

  const pdfBuffer = await generatePdfFromHtml(page, htmlContent, config);

  await browser.close();

  return pdfBuffer;
}

/**
 * Example 4: Manual page configuration (more control)
 */
export async function manualConfigExample() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const config: PuppeteerPageConfig = {
    trimSize: '6x9',
    margins: {
      top: 0.75,
      bottom: 0.75,
      inside: 0.75,
      outside: 0.5,
    },
    printBackground: true,
    quality: 'high',
    waitForFonts: true,
  };

  // Configure the page manually
  const { pdfOptions } = await configurePage(page, config);

  // Load content
  await page.goto('https://example.com', { waitUntil: 'networkidle0' });

  // Generate PDF with custom options
  const pdfBuffer = await page.pdf({
    ...pdfOptions,
    // You can override or add additional options here
    printBackground: true,
    pageRanges: '1-10', // Only print first 10 pages
  });

  await browser.close();

  return pdfBuffer;
}

/**
 * Helper: Generate styled HTML from BookStyle
 */
function generateStyledHtml(style: BookStyle): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Styled Book</title>
        <style>
          body {
            font-family: ${style.fonts.body};
            font-size: ${style.body.fontSize};
            line-height: ${style.body.lineHeight};
            color: ${style.colors.text};
            text-align: ${style.body.textAlign || 'justify'};
          }
          h1 {
            font-family: ${style.fonts.heading};
            font-size: ${style.headings.h1.fontSize};
            font-weight: ${style.headings.h1.fontWeight || 'bold'};
            color: ${style.colors.heading};
            margin-top: ${style.headings.h1.marginTop || '2em'};
            margin-bottom: ${style.headings.h1.marginBottom || '1em'};
          }
          h2 {
            font-family: ${style.fonts.heading};
            font-size: ${style.headings.h2.fontSize};
            font-weight: ${style.headings.h2.fontWeight || 'bold'};
            color: ${style.colors.heading};
            margin-top: ${style.headings.h2.marginTop || '1.5em'};
            margin-bottom: ${style.headings.h2.marginBottom || '0.75em'};
          }
          p {
            margin-bottom: ${style.spacing.paragraphSpacing};
          }
          p:first-of-type::first-letter {
            ${
              style.dropCap.enabled
                ? `
              font-size: ${style.dropCap.fontSize || '3em'};
              font-weight: ${style.dropCap.fontWeight || 'bold'};
              float: left;
              line-height: 1;
              margin-right: ${style.dropCap.marginRight || '0.1em'};
              color: ${style.dropCap.color || style.colors.dropCap || style.colors.text};
            `
                : ''
            }
          }
        </style>
      </head>
      <body>
        <h1>Chapter 1: The Story Begins</h1>
        <p>Once upon a time, in a faraway land, there lived a wise old sage...</p>
        <p>The sage spent his days teaching the village children about the mysteries of the world.</p>
        <h2>Section 1: The Discovery</h2>
        <p>One day, a young boy discovered something extraordinary in the forest...</p>
      </body>
    </html>
  `;
}

/**
 * Example 5: A4 format with custom quality
 */
export async function a4HighQualityExample() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const config = createDefaultPageConfig({
    trimSize: 'A4',
    quality: 'high',
    margins: {
      top: 1.0,
      bottom: 1.0,
      inside: 1.0,
      outside: 0.75,
    },
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>High Quality A4 Document</title>
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Crimson Text', serif;
            font-size: 12pt;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <h1>High Quality Document</h1>
        <p>This document is rendered at high DPI for print quality output.</p>
      </body>
    </html>
  `;

  const pdfBuffer = await generatePdfFromHtml(page, htmlContent, config);

  await browser.close();

  return pdfBuffer;
}
