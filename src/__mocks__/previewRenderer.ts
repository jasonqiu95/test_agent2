/**
 * Mock Preview Renderer Module
 *
 * Provides a mock implementation of the preview rendering engine for testing purposes.
 * Returns predictable HTML/DOM structures and simulates device-specific rendering behaviors.
 */

import { Element } from '../types/element';
import { BookStyle } from '../types/style';
import {
  DeviceType,
  DeviceConfig,
  PreviewResult,
  RenderOptions,
} from '../utils/previewRenderer';

/**
 * Mock device configurations matching the real implementation
 */
const MOCK_DEVICE_CONFIGS: Record<DeviceType, DeviceConfig> = {
  desktop: {
    width: 1920,
    height: 1080,
    pixelRatio: 1,
    pageWidth: 816,
    pageHeight: 1056,
  },
  tablet: {
    width: 1024,
    height: 768,
    pixelRatio: 2,
    pageWidth: 768,
    pageHeight: 1024,
  },
  mobile: {
    width: 375,
    height: 667,
    pixelRatio: 3,
    pageWidth: 375,
    pageHeight: 667,
  },
  print: {
    width: 816,
    height: 1056,
    pixelRatio: 1,
    pageWidth: 816,
    pageHeight: 1056,
  },
};

/**
 * Mock state to track calls and allow test assertions
 */
interface MockState {
  calls: Array<{
    elementData: Element;
    styleConfig: BookStyle;
    deviceType: DeviceType;
    options?: RenderOptions;
  }>;
  renderCount: number;
  lastRenderTime: number;
}

let mockState: MockState = {
  calls: [],
  renderCount: 0,
  lastRenderTime: 0,
};

/**
 * Mock implementation of renderPreview function
 *
 * Returns predictable HTML/CSS output based on input parameters for testing.
 * All outputs are deterministic and suitable for snapshot testing.
 *
 * @param elementData - The book element to render
 * @param styleConfig - Style configuration
 * @param deviceType - Target device type
 * @param options - Optional rendering options
 * @returns Predictable PreviewResult for testing
 */
export function renderPreview(
  elementData: Element,
  styleConfig: BookStyle,
  deviceType: DeviceType,
  options?: RenderOptions
): PreviewResult {
  // Track the call for testing purposes
  mockState.calls.push({ elementData, styleConfig, deviceType, options });
  mockState.renderCount++;
  mockState.lastRenderTime = Date.now();

  // Validate required parameters
  if (!elementData) {
    throw new Error('elementData is required');
  }

  if (!styleConfig) {
    throw new Error('styleConfig is required');
  }

  if (!deviceType) {
    throw new Error('deviceType is required');
  }

  const deviceConfig = MOCK_DEVICE_CONFIGS[deviceType];
  if (!deviceConfig) {
    throw new Error(`Invalid deviceType: ${deviceType}`);
  }

  // Merge default options
  const renderOptions: Required<RenderOptions> = {
    includePageBreaks: options?.includePageBreaks ?? true,
    printOptimized: options?.printOptimized ?? deviceType === 'print',
    classPrefix: options?.classPrefix ?? 'preview',
    useInlineStyles: options?.useInlineStyles ?? false,
  };

  // Generate predictable mock HTML
  const html = generateMockHTML(elementData, styleConfig, deviceType, renderOptions);

  // Generate predictable mock CSS
  const css = generateMockCSS(styleConfig, deviceConfig, renderOptions);

  // Calculate predictable page count
  const pageCount = calculateMockPageCount(elementData, deviceConfig);

  return {
    html,
    css,
    pageCount,
  };
}

/**
 * Generates predictable mock HTML for testing
 */
function generateMockHTML(
  elementData: Element,
  styleConfig: BookStyle,
  deviceType: DeviceType,
  options: Required<RenderOptions>
): string {
  const { classPrefix, includePageBreaks, useInlineStyles } = options;
  const contentBlocks = elementData.content || [];

  // Generate mock content blocks
  const contentHTML = contentBlocks
    .map((block, index) => {
      const blockType = (block as any).type || 'paragraph';
      const blockContent = (block as any).text || `Mock content block ${index + 1}`;

      const inlineStyles = useInlineStyles
        ? ` style="font-family: ${styleConfig.fonts.body}; font-size: ${styleConfig.body.fontSize};"`
        : '';

      return `<div class="${classPrefix}-block ${classPrefix}-block--${blockType}" data-block-id="${index}"${inlineStyles}>
        ${escapeHtml(blockContent)}
      </div>`;
    })
    .join('\n      ');

  // Add page breaks if enabled
  const pageBreakHTML = includePageBreaks
    ? `\n      <div class="${classPrefix}-page-break" data-page-number="1"></div>`
    : '';

  return `<div class="${classPrefix}-container" data-device="${deviceType}" data-element-id="${elementData.id}">
  <article class="${classPrefix}-element" data-type="${elementData.type}" data-matter="${elementData.matter}">
    <header class="${classPrefix}-header">
      <h1 class="${classPrefix}-title" data-style="${styleConfig.id}">${escapeHtml(elementData.title)}</h1>
    </header>
    <div class="${classPrefix}-content">
      ${contentHTML || `<p class="${classPrefix}-placeholder">No content available</p>`}${pageBreakHTML}
    </div>
    <footer class="${classPrefix}-footer" data-page-count="${calculateMockPageCount(elementData, MOCK_DEVICE_CONFIGS[deviceType])}">
    </footer>
  </article>
</div>`;
}

/**
 * Generates predictable mock CSS for testing
 */
function generateMockCSS(
  styleConfig: BookStyle,
  deviceConfig: DeviceConfig,
  options: Required<RenderOptions>
): string {
  const { classPrefix } = options;

  return `.${classPrefix}-container {
  max-width: ${deviceConfig.pageWidth}px;
  height: ${deviceConfig.pageHeight}px;
  margin: 0 auto;
  padding: 0;
  box-sizing: border-box;
  font-family: ${styleConfig.fonts.body}, ${styleConfig.fonts.fallback};
  font-size: ${styleConfig.body.fontSize};
  line-height: ${styleConfig.body.lineHeight};
  color: ${styleConfig.colors.text};
  background-color: ${styleConfig.colors.background || '#ffffff'};
}

.${classPrefix}-element {
  padding: ${styleConfig.spacing.chapterSpacing};
  text-align: ${styleConfig.body.textAlign || 'left'};
}

.${classPrefix}-header {
  margin-bottom: ${styleConfig.spacing.sectionSpacing};
}

.${classPrefix}-title {
  font-family: ${styleConfig.fonts.heading}, ${styleConfig.fonts.fallback};
  font-size: ${styleConfig.headings.h1.fontSize};
  font-weight: ${styleConfig.headings.h1.fontWeight || 'bold'};
  line-height: ${styleConfig.headings.h1.lineHeight || '1.2'};
  color: ${styleConfig.colors.heading};
  margin: ${styleConfig.headings.h1.marginTop || '0'} 0 ${styleConfig.headings.h1.marginBottom || '2rem'};
  text-transform: ${styleConfig.headings.h1.textTransform || 'none'};
}

.${classPrefix}-content {
  margin-bottom: ${styleConfig.spacing.paragraphSpacing};
}

.${classPrefix}-block {
  margin-bottom: ${styleConfig.spacing.paragraphSpacing};
}

.${classPrefix}-block--paragraph {
  text-indent: 0;
}

.${classPrefix}-page-break {
  page-break-after: always;
  break-after: page;
  height: 0;
  margin: 0;
  padding: 0;
  border: none;
}

.${classPrefix}-footer {
  margin-top: ${styleConfig.spacing.sectionSpacing};
  font-size: 0.875rem;
  color: ${styleConfig.colors.text};
  opacity: 0.7;
}

@media print {
  .${classPrefix}-container {
    width: ${deviceConfig.pageWidth}px;
    height: ${deviceConfig.pageHeight}px;
  }
}`;
}

/**
 * Calculates predictable mock page count based on content
 */
function calculateMockPageCount(
  elementData: Element,
  deviceConfig: DeviceConfig
): number {
  const contentBlocks = elementData.content?.length || 0;

  // Simple calculation: estimate blocks per page based on device height
  const estimatedBlockHeight = 100; // pixels
  const usableHeight = (deviceConfig.pageHeight || 1000) * 0.8; // 80% usable space
  const blocksPerPage = Math.floor(usableHeight / estimatedBlockHeight);

  const pageCount = Math.max(1, Math.ceil(contentBlocks / blocksPerPage));

  return pageCount;
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  if (!text) return '';

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Gets the device configuration for a specific device type
 */
export function getDeviceConfig(deviceType: DeviceType): DeviceConfig {
  const config = MOCK_DEVICE_CONFIGS[deviceType];
  if (!config) {
    throw new Error(`Invalid deviceType: ${deviceType}`);
  }
  return { ...config };
}

/**
 * Validates whether a device type is supported
 */
export function isValidDeviceType(deviceType: string): deviceType is DeviceType {
  return deviceType in MOCK_DEVICE_CONFIGS;
}

/**
 * Mock-specific utility: Creates a mock renderer instance with isolated state
 *
 * Use this factory function in tests to create independent renderer instances
 * that don't share state with other tests.
 *
 * @returns Mock renderer instance with isolated state and utility methods
 *
 * @example
 * ```typescript
 * const renderer = createMockRenderer();
 * const result = renderer.render(element, style, 'desktop');
 * expect(renderer.getCalls()).toHaveLength(1);
 * renderer.reset();
 * ```
 */
export function createMockRenderer() {
  const instanceState: MockState = {
    calls: [],
    renderCount: 0,
    lastRenderTime: 0,
  };

  return {
    /**
     * Renders a preview with isolated state tracking
     */
    render(
      elementData: Element,
      styleConfig: BookStyle,
      deviceType: DeviceType,
      options?: RenderOptions
    ): PreviewResult {
      instanceState.calls.push({ elementData, styleConfig, deviceType, options });
      instanceState.renderCount++;
      instanceState.lastRenderTime = Date.now();

      return renderPreview(elementData, styleConfig, deviceType, options);
    },

    /**
     * Gets device configuration
     */
    getDeviceConfig(deviceType: DeviceType): DeviceConfig {
      return getDeviceConfig(deviceType);
    },

    /**
     * Validates device type
     */
    isValidDeviceType(deviceType: string): deviceType is DeviceType {
      return isValidDeviceType(deviceType);
    },

    /**
     * Renders a single page with specific page number
     */
    renderPage(
      elementData: Element,
      styleConfig: BookStyle,
      deviceType: DeviceType,
      pageNumber: number,
      options?: RenderOptions
    ): PreviewResult {
      const result = renderPreview(elementData, styleConfig, deviceType, options);

      // Add page number to HTML
      const pageAnnotatedHTML = result.html.replace(
        'data-page-number="1"',
        `data-page-number="${pageNumber}"`
      );

      return {
        ...result,
        html: pageAnnotatedHTML,
      };
    },

    /**
     * Applies custom styles to rendered output
     */
    applyCustomStyles(
      result: PreviewResult,
      customCSS: string
    ): PreviewResult {
      return {
        ...result,
        css: `${result.css}\n\n/* Custom Styles */\n${customCSS}`,
      };
    },

    /**
     * Gets all render calls made to this instance
     */
    getCalls(): Array<{
      elementData: Element;
      styleConfig: BookStyle;
      deviceType: DeviceType;
      options?: RenderOptions;
    }> {
      return [...instanceState.calls];
    },

    /**
     * Gets the number of render calls
     */
    getRenderCount(): number {
      return instanceState.renderCount;
    },

    /**
     * Gets the last render timestamp
     */
    getLastRenderTime(): number {
      return instanceState.lastRenderTime;
    },

    /**
     * Resets the instance state (useful between tests)
     */
    reset(): void {
      instanceState.calls = [];
      instanceState.renderCount = 0;
      instanceState.lastRenderTime = 0;
    },

    /**
     * Checks if a specific device type was used in any render call
     */
    wasDeviceTypeUsed(deviceType: DeviceType): boolean {
      return instanceState.calls.some(call => call.deviceType === deviceType);
    },

    /**
     * Gets all unique device types used in render calls
     */
    getUsedDeviceTypes(): DeviceType[] {
      const types = new Set(instanceState.calls.map(call => call.deviceType));
      return Array.from(types);
    },
  };
}

/**
 * Mock-specific utility: Gets global mock state
 *
 * Use this to inspect global mock behavior across all render calls.
 * Prefer using createMockRenderer() for isolated test scenarios.
 */
export function __getMockState(): Readonly<MockState> {
  return { ...mockState };
}

/**
 * Mock-specific utility: Resets global mock state
 *
 * Call this in test cleanup (e.g., afterEach) to reset global state.
 */
export function __resetMockState(): void {
  mockState = {
    calls: [],
    renderCount: 0,
    lastRenderTime: 0,
  };
}

/**
 * Mock-specific utility: Sets custom behavior for next render
 *
 * Allows tests to inject specific behavior or return values.
 */
export function __mockNextRender(
  customResult: Partial<PreviewResult>
): void {
  // This would be used in more advanced mocking scenarios
  // For now, it's a placeholder for potential future functionality
  console.warn('__mockNextRender is not yet implemented');
}

// Export types for convenience
export type {
  DeviceType,
  DeviceConfig,
  PreviewResult,
  RenderOptions,
} from '../utils/previewRenderer';
