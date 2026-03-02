/**
 * Font Loading Example
 *
 * Demonstrates how to use the font loading system to load Google Fonts
 * and custom fonts, generate @font-face rules, and apply fonts to previews.
 */

import {
  generateFontLoadingConfig,
  extractFontFamilies,
  createFontFallbackChain,
  generateGoogleFontsUrl,
  generateFontFaceRule,
  preloadFont,
  type CustomFontConfig,
} from '../utils/fontLoader';
import { BookStyle } from '../types/style';

// Example 1: Extract font families from a style configuration
export function exampleExtractFonts() {
  const fontString = "'Garamond', 'EB Garamond', serif";
  const extracted = extractFontFamilies(fontString);

  console.log('Primary Font:', extracted.primary); // "Garamond"
  console.log('All Families:', extracted.families); // ["Garamond", "EB Garamond", "serif"]
  console.log('Fallback Chain:', extracted.fallbackChain); // "Garamond, 'EB Garamond', serif"
  console.log('Source Type:', extracted.source); // "google", "system", or "custom"
}

// Example 2: Generate Google Fonts URL
export function exampleGoogleFontsUrl() {
  // Load specific weights and styles
  const url = generateGoogleFontsUrl(
    ['EB Garamond', 'Roboto'],
    [300, 400, 500, 700], // Font weights
    ['normal', 'italic']  // Font styles
  );

  console.log('Google Fonts URL:', url);

  // Add to document
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

// Example 3: Generate @font-face rules for custom fonts
export function exampleCustomFontFace() {
  const customFontConfig: CustomFontConfig = {
    family: 'My Custom Font',
    weight: 400,
    style: 'normal',
    sources: [
      { url: '/fonts/custom-regular.woff2', format: 'woff2' },
      { url: '/fonts/custom-regular.woff', format: 'woff' },
      { url: '/fonts/custom-regular.ttf', format: 'ttf' },
    ],
    display: 'swap',
    unicodeRange: 'U+0000-00FF, U+0131, U+0152-0153', // Latin subset
  };

  const css = generateFontFaceRule(customFontConfig);
  console.log('Generated @font-face CSS:', css);

  // Add to document
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// Example 4: Create font fallback chain
export function exampleFallbackChain() {
  // Serif font stack
  const serifStack = createFontFallbackChain('Garamond', 'serif');
  console.log('Serif Stack:', serifStack);
  // Output: "'Garamond', 'Palatino', 'Georgia', 'Times New Roman', serif"

  // Sans-serif font stack
  const sansStack = createFontFallbackChain('Helvetica Neue', 'sans-serif');
  console.log('Sans-serif Stack:', sansStack);
  // Output: "'Helvetica Neue', 'Helvetica', 'Arial', -apple-system, BlinkMacSystemFont, sans-serif"

  // Script font stack
  const scriptStack = createFontFallbackChain('Dancing Script', 'script');
  console.log('Script Stack:', scriptStack);
  // Output: "'Dancing Script', 'Brush Script MT', 'Lucida Calligraphy', cursive"
}

// Example 5: Complete font loading configuration from BookStyle
export function exampleCompleteConfig(bookStyle: BookStyle) {
  // Generate complete font loading configuration
  const config = generateFontLoadingConfig(bookStyle);

  console.log('Fonts to load:', config.fonts);
  console.log('Google Fonts URL:', config.googleFontsUrl);
  console.log('@font-face rules:', config.fontFaceRules);

  // Load Google Fonts
  if (config.googleFontsUrl) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = config.googleFontsUrl;
    document.head.appendChild(link);
  }

  // Add custom font CSS
  if (config.fontFaceRules) {
    const style = document.createElement('style');
    style.textContent = config.fontFaceRules;
    document.head.appendChild(style);
  }
}

// Example 6: Complete font loading with custom fonts
export function exampleWithCustomFonts(bookStyle: BookStyle) {
  // Define custom fonts
  const customFonts: CustomFontConfig[] = [
    {
      family: 'Custom Serif',
      weight: 400,
      style: 'normal',
      sources: [
        { url: '/fonts/custom-serif-regular.woff2', format: 'woff2' },
      ],
      display: 'swap',
    },
    {
      family: 'Custom Serif',
      weight: 700,
      style: 'normal',
      sources: [
        { url: '/fonts/custom-serif-bold.woff2', format: 'woff2' },
      ],
      display: 'swap',
    },
    {
      family: 'Custom Serif',
      weight: 400,
      style: 'italic',
      sources: [
        { url: '/fonts/custom-serif-italic.woff2', format: 'woff2' },
      ],
      display: 'swap',
    },
  ];

  // Generate configuration with custom fonts
  const config = generateFontLoadingConfig(bookStyle, customFonts);

  // Apply to document
  if (config.googleFontsUrl) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = config.googleFontsUrl;
    document.head.appendChild(link);
  }

  if (config.fontFaceRules) {
    const style = document.createElement('style');
    style.textContent = config.fontFaceRules;
    document.head.appendChild(style);
  }
}

// Example 7: Preload critical fonts for performance
export function examplePreloadFonts() {
  // Preload the most critical fonts to improve performance
  const criticalFonts = [
    { url: '/fonts/main-font-regular.woff2', format: 'woff2' as const },
    { url: '/fonts/heading-font-bold.woff2', format: 'woff2' as const },
  ];

  criticalFonts.forEach(({ url, format }) => {
    const link = preloadFont(url, format);
    document.head.appendChild(link);
  });
}

// Example 8: React Hook for font loading
export function useFontLoader(bookStyle: BookStyle, customFonts?: CustomFontConfig[]) {
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    const config = generateFontLoadingConfig(bookStyle, customFonts);

    // Load Google Fonts
    if (config.googleFontsUrl) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = config.googleFontsUrl;
      link.onload = () => {
        setIsLoaded(true);
      };
      document.head.appendChild(link);
    }

    // Add custom font CSS
    if (config.fontFaceRules) {
      const style = document.createElement('style');
      style.textContent = config.fontFaceRules;
      document.head.appendChild(style);
      setIsLoaded(true);
    }

    return () => {
      // Cleanup if needed
    };
  }, [bookStyle, customFonts]);

  return { isLoaded, fonts: config.fonts };
}

// Example 9: Integration with preview renderer
export function examplePreviewIntegration() {
  const mockStyle: BookStyle = {
    id: 'elegant-serif',
    name: 'Elegant Serif',
    description: 'Classic serif typography',
    category: 'serif',
    fonts: {
      body: "'EB Garamond', serif",
      heading: "'Cinzel', serif",
      fallback: 'serif',
    },
    headings: {
      h1: {
        fontSize: '2.5em',
        fontWeight: '700',
        lineHeight: '1.2',
      },
      h2: {
        fontSize: '2em',
        fontWeight: '600',
        lineHeight: '1.3',
      },
      h3: {
        fontSize: '1.5em',
        fontWeight: '500',
        lineHeight: '1.4',
      },
    },
    body: {
      fontSize: '1.1em',
      lineHeight: '1.7',
      textAlign: 'justify',
    },
    dropCap: {
      enabled: true,
      lines: 3,
      fontSize: '4em',
      fontFamily: "'Cinzel', serif",
    },
    ornamentalBreak: {
      enabled: true,
      symbol: '✦ ✦ ✦',
    },
    firstParagraph: {
      enabled: true,
      fontVariant: 'small-caps',
    },
    spacing: {
      paragraphSpacing: '1.2em',
      lineHeight: '1.7',
      sectionSpacing: '3em',
      chapterSpacing: '5em',
    },
    colors: {
      text: '#2c2c2c',
      heading: '#1a1a1a',
      accent: '#8b4513',
      background: '#fffef8',
    },
  };

  // Generate font configuration
  const fontConfig = generateFontLoadingConfig(mockStyle);

  console.log('Fonts needed for preview:', fontConfig.fonts);
  console.log('Load fonts from:', fontConfig.googleFontsUrl);

  // The preview renderer will automatically include these fonts
  // in the generated CSS
}

// Note: Import React if using the hook example
declare const React: any;
