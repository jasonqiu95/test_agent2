/**
 * Device dimension configurations for various display modes
 * Includes viewport dimensions, DPI/PPI, and device identifiers
 */

const deviceDimensions = {
  iPad: {
    identifier: 'ipad',
    name: 'iPad',
    viewport: {
      width: 1536,
      height: 2048,
    },
    dimensions: {
      width: 1536,
      height: 2048,
    },
    ppi: 264,
    dpi: 264,
  },

  Kindle: {
    identifier: 'kindle',
    name: 'Kindle',
    viewport: {
      width: 758,
      height: 1024,
    },
    dimensions: {
      width: 758,
      height: 1024,
    },
    ppi: 300,
    dpi: 300,
  },

  iPhone: {
    identifier: 'iphone',
    name: 'iPhone',
    viewport: {
      width: 750,
      height: 1334,
    },
    dimensions: {
      width: 750,
      height: 1334,
    },
    ppi: 326,
    dpi: 326,
  },

  PrintSpread: {
    identifier: 'print-spread',
    name: 'Print Spread',
    viewport: {
      width: null, // Variable by trim size
      height: null, // Variable by trim size
    },
    dimensions: {
      width: null, // Set dynamically based on trim size
      height: null, // Set dynamically based on trim size
    },
    ppi: 300, // Standard print resolution
    dpi: 300, // Standard print resolution
    isVariable: true,
    // Common trim sizes can be added here as presets
    trimSizes: {
      '5x8': { width: 1500, height: 2400 }, // 5" x 8" at 300 DPI
      '6x9': { width: 1800, height: 2700 }, // 6" x 9" at 300 DPI
      '8.5x11': { width: 2550, height: 3300 }, // 8.5" x 11" at 300 DPI
    },
  },
};

export default deviceDimensions;
