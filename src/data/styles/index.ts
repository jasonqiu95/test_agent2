/**
 * Built-in Book Styles
 * Collection of professionally designed book typography styles
 */

import { BookStyle } from '../../types/style';

// Import all style definitions
import baskervilleData from './baskerville.json';
import garamondData from './garamond.json';
import caslonData from './caslon.json';
import helveticaData from './helvetica.json';
import avenirData from './avenir.json';
import edwardianData from './edwardian.json';
import futuraData from './futura.json';
import didotData from './didot.json';
import centuryGothicData from './century-gothic.json';
import minionProData from './minion-pro.json';
import palatinoData from './palatino.json';
import gillSansData from './gill-sans.json';
import optimaData from './optima.json';

// Type-cast JSON imports to BookStyle
export const baskerville = baskervilleData as BookStyle;
export const garamond = garamondData as BookStyle;
export const caslon = caslonData as BookStyle;
export const helvetica = helveticaData as BookStyle;
export const avenir = avenirData as BookStyle;
export const edwardian = edwardianData as BookStyle;
export const futura = futuraData as BookStyle;
export const didot = didotData as BookStyle;
export const centuryGothic = centuryGothicData as BookStyle;
export const minionPro = minionProData as BookStyle;
export const palatino = palatinoData as BookStyle;
export const gillSans = gillSansData as BookStyle;
export const optima = optimaData as BookStyle;

// Collection of all styles
export const allStyles: BookStyle[] = [
  baskerville,
  garamond,
  caslon,
  helvetica,
  avenir,
  edwardian,
  futura,
  didot,
  centuryGothic,
  minionPro,
  palatino,
  gillSans,
  optima,
];

// Styles organized by category
export const stylesByCategory = {
  serif: [baskerville, garamond, caslon, minionPro, palatino],
  'sans-serif': [helvetica, avenir, gillSans, optima],
  script: [edwardian],
  modern: [futura, didot, centuryGothic],
};

// Style lookup by ID
export const stylesById: Record<string, BookStyle> = {
  baskerville,
  garamond,
  caslon,
  helvetica,
  avenir,
  edwardian,
  futura,
  didot,
  'century-gothic': centuryGothic,
  'minion-pro': minionPro,
  palatino,
  'gill-sans': gillSans,
  optima,
};

/**
 * Get a book style by ID
 */
export function getStyleById(id: string): BookStyle | undefined {
  return stylesById[id];
}

/**
 * Get all styles for a specific category
 */
export function getStylesByCategory(category: BookStyle['category']): BookStyle[] {
  return stylesByCategory[category] || [];
}

/**
 * Get all available style IDs
 */
export function getAllStyleIds(): string[] {
  return Object.keys(stylesById);
}

/**
 * Get all available style names
 */
export function getAllStyleNames(): Array<{ id: string; name: string }> {
  return allStyles.map(style => ({ id: style.id, name: style.name }));
}

// Default export
export default {
  allStyles,
  stylesByCategory,
  stylesById,
  getStyleById,
  getStylesByCategory,
  getAllStyleIds,
  getAllStyleNames,
};
