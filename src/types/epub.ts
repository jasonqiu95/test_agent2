/**
 * EPUB generation types and interfaces
 * Comprehensive type definitions for EPUB 3 generation workflow
 */

/**
 * EPUB metadata interface
 * Contains all standard Dublin Core metadata elements and EPUB-specific extensions
 */
export interface EpubMetadata {
  // Required metadata
  title: string;
  author: string | string[];
  language: string;
  identifier?: string; // UUID or other unique identifier

  // Standard Dublin Core metadata
  publisher?: string;
  description?: string;
  subject?: string | string[];
  contributor?: string | string[];
  creator?: string | string[];
  date?: string | Date;
  rights?: string;
  coverage?: string;
  relation?: string;
  source?: string;
  type?: string;

  // ISBN identifiers
  isbn?: string;
  isbn10?: string;
  isbn13?: string;

  // Publishing metadata
  publicationDate?: string | Date;
  modifiedDate?: string | Date;
  edition?: string;
  series?: string;
  seriesNumber?: number;
  volume?: string;

  // Classification
  genre?: string | string[];
  keywords?: string[];
  category?: string[];
  bisac?: string[]; // Book Industry Standards and Communications codes

  // Cover and images
  coverImage?: string;

  // Additional metadata
  awards?: string[];
  rating?: string;
  pageDirection?: 'ltr' | 'rtl';
}

/**
 * EPUB generation quality settings
 */
export type EpubQuality = 'draft' | 'standard' | 'high' | 'print-ready';

/**
 * EPUB compression levels
 */
export type CompressionLevel = 'none' | 'low' | 'medium' | 'high' | 'maximum';

/**
 * EPUB version specification
 */
export type EpubVersion = '2.0' | '3.0' | '3.1' | '3.2';

/**
 * EPUB navigation document types
 */
export type NavDocType = 'toc' | 'page-list' | 'landmarks' | 'lot' | 'loi';

/**
 * Font embedding options
 */
export interface FontEmbedding {
  enabled: boolean;
  subset?: boolean; // Include only used characters
  obfuscate?: boolean; // Apply font obfuscation for DRM
  formats?: ('ttf' | 'otf' | 'woff' | 'woff2')[];
}

/**
 * Image optimization settings
 */
export interface ImageOptimization {
  enabled: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 1-100
  format?: 'original' | 'jpeg' | 'png' | 'webp';
  progressive?: boolean;
}

/**
 * CSS optimization settings
 */
export interface CssOptimization {
  enabled: boolean;
  minify?: boolean;
  inline?: boolean;
  removeUnused?: boolean;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  enabled: boolean;
  strict?: boolean;
  checkLinks?: boolean;
  checkImages?: boolean;
  checkMetadata?: boolean;
  epubcheck?: boolean;
  ace?: boolean; // Accessibility checker
}

/**
 * Table of contents configuration
 */
export interface TocConfiguration {
  enabled: boolean;
  title?: string;
  depth?: number; // Maximum heading depth to include
  includePageNumbers?: boolean;
  navDocType?: NavDocType;
  landmarks?: boolean;
  pageList?: boolean;
}

/**
 * Accessibility options
 */
export interface AccessibilityOptions {
  enabled: boolean;
  semanticInflection?: boolean;
  alternativeText?: boolean;
  pageBreakMarkers?: boolean;
  readingOrder?: boolean;
  structuralNavigation?: boolean;
  mathML?: boolean;
  describedImages?: boolean;
}

/**
 * EPUB generation options
 * Comprehensive configuration for EPUB generation workflow
 */
export interface EpubOptions {
  // Version and format
  version?: EpubVersion;

  // Content options
  includeMetadata?: boolean;
  includeToc?: boolean;
  tocConfiguration?: TocConfiguration;
  includeCoverPage?: boolean;
  includeTitlePage?: boolean;
  includeCopyright?: boolean;

  // Quality and optimization
  quality?: EpubQuality;
  compression?: CompressionLevel;
  optimize?: boolean;

  // Font handling
  fontEmbedding?: FontEmbedding;

  // Image handling
  imageOptimization?: ImageOptimization;

  // CSS handling
  cssOptimization?: CssOptimization;

  // Validation
  validate?: boolean;
  validation?: ValidationOptions;

  // Accessibility
  accessibility?: AccessibilityOptions;

  // Advanced options
  customCSS?: string;
  customMetadata?: Record<string, string>;
  ncx?: boolean; // Include NCX for EPUB 2.0 compatibility
  packageDirection?: 'ltr' | 'rtl';

  // Output options
  verbose?: boolean;
  splitChapters?: boolean;
  chapterSizeLimit?: number; // In bytes

  // Experimental features
  experimental?: {
    fixedLayout?: boolean;
    spreads?: boolean;
    scriptedInteractivity?: boolean;
    mediOverlays?: boolean;
    remoteResources?: boolean;
  };
}

/**
 * Chapter data for EPUB generation
 */
export interface ChapterData {
  id?: string;
  title: string;
  subtitle?: string;
  content: string; // HTML content
  filename?: string;

  // Structure
  number?: number;
  partNumber?: number;
  partTitle?: string;

  // Navigation
  excludeFromToc?: boolean;
  beforeToc?: boolean;
  includeInLandmarks?: boolean;
  landmarkType?: string;

  // Styling
  className?: string;
  customCSS?: string;

  // Advanced
  epigraph?: string;
  epigraphAttribution?: string;
  language?: string;
  pageDirection?: 'ltr' | 'rtl';
}

/**
 * Book content structure for EPUB
 */
export interface BookContent {
  frontMatter?: ChapterData[];
  chapters: ChapterData[];
  backMatter?: ChapterData[];

  // Additional content
  coverPage?: string; // HTML content
  titlePage?: string; // HTML content
  copyright?: string; // HTML content
  dedication?: string; // HTML content
  acknowledgments?: string; // HTML content
}

/**
 * Image data for EPUB
 */
export interface EpubImageData {
  id: string;
  url: string;
  buffer?: ArrayBuffer;
  mimeType: string;
  width?: number;
  height?: number;
  altText?: string;
  caption?: string;
  role?: 'cover' | 'illustration' | 'diagram' | 'photo' | 'decorative';
}

/**
 * Font data for EPUB
 */
export interface EpubFontData {
  id: string;
  family: string;
  style?: 'normal' | 'italic' | 'oblique';
  weight?: number | string;
  buffer: ArrayBuffer;
  mimeType: string;
  format: 'ttf' | 'otf' | 'woff' | 'woff2';
  obfuscate?: boolean;
}

/**
 * CSS stylesheet for EPUB
 */
export interface EpubStylesheet {
  id: string;
  content: string;
  filename?: string;
  inline?: boolean;
}

/**
 * EPUB structure
 * Complete structure of an EPUB package
 */
export interface EpubStructure {
  metadata: EpubMetadata;
  content: BookContent;
  styles: EpubStylesheet[];
  images: EpubImageData[];
  fonts?: EpubFontData[];
  coverImage?: EpubImageData;

  // Navigation documents
  toc?: string; // Table of contents HTML
  ncx?: string; // NCX for EPUB 2.0 compatibility
  landmarks?: string; // Landmarks navigation
  pageList?: string; // Page list navigation
}

/**
 * EPUB validation error/warning
 */
export interface EpubValidationIssue {
  type: 'error' | 'warning' | 'info';
  code?: string;
  message: string;
  location?: string;
  line?: number;
  column?: number;
  severity?: 'critical' | 'major' | 'minor';
  suggestion?: string;
}

/**
 * EPUB validation result
 */
export interface EpubValidationResult {
  valid: boolean;
  errors: EpubValidationIssue[];
  warnings?: EpubValidationIssue[];
  info?: EpubValidationIssue[];

  // Validation details
  checkerVersion?: string;
  validatedAt?: Date;
  epubVersion?: string;

  // Statistics
  errorCount?: number;
  warningCount?: number;
  infoCount?: number;
}

/**
 * EPUB generation result
 */
export interface EpubGenerationResult {
  success: boolean;
  buffer?: ArrayBuffer;
  fileName: string;
  fileSize?: number;

  // Validation
  validation?: EpubValidationResult;

  // Metadata
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    characterCount?: number;
    chapterCount?: number;
    imageCount?: number;
    processingTimeMs?: number;
    epubVersion?: string;
  };

  // Error information
  error?: string;
  errorCode?: string;
  errorStack?: string;
}

/**
 * EPUB generator interface
 */
export interface EpubGenerator {
  /**
   * Generates an EPUB file from the provided content
   * @param structure EPUB structure with content and metadata
   * @param options EPUB generation options
   * @returns Promise resolving to generation result
   */
  generate(
    structure: EpubStructure,
    options?: EpubOptions
  ): Promise<EpubGenerationResult>;

  /**
   * Validates EPUB structure before generation
   * @param structure EPUB structure to validate
   * @returns Validation result
   */
  validate(structure: EpubStructure): EpubValidationResult;
}

/**
 * EPUB manifest item
 * Represents a resource in the EPUB manifest
 */
export interface EpubManifestItem {
  id: string;
  href: string;
  mediaType: string;
  properties?: string[];
  fallback?: string;
  mediaOverlay?: string;
}

/**
 * EPUB spine item
 * Represents the reading order of content documents
 */
export interface EpubSpineItem {
  idref: string;
  linear?: boolean;
  properties?: string[];
}

/**
 * EPUB package document
 * OPF (Open Packaging Format) structure
 */
export interface EpubPackage {
  version: EpubVersion;
  uniqueIdentifier: string;
  metadata: EpubMetadata;
  manifest: EpubManifestItem[];
  spine: EpubSpineItem[];
  guide?: Array<{
    type: string;
    title: string;
    href: string;
  }>;
}

/**
 * EPUB container structure
 * Complete EPUB container with all resources
 */
export interface EpubContainer {
  mimetype: string;
  container: string; // container.xml content
  package: EpubPackage;
  content: Map<string, string | ArrayBuffer>; // filepath -> content
}

/**
 * Progress callback for EPUB generation
 */
export interface EpubProgressInfo {
  step: string;
  percentage: number;
  message: string;
  currentChapter?: string;
  currentFile?: string;
}

export type EpubProgressCallback = (progress: EpubProgressInfo) => void;
