import { useState, useCallback, useEffect, useRef } from 'react';
import { BookStyle, HeadingStyle } from '../../types/style';

export interface ValidationError {
  field: string;
  message: string;
}

export interface StyleEditorState {
  currentStyle: BookStyle;
  originalStyle: BookStyle;
  isDirty: boolean;
  validationErrors: ValidationError[];
  isValid: boolean;
}

export interface StyleEditorActions {
  updateStyle: (updates: Partial<BookStyle>) => void;
  updateBodyFont: (fontFamily: string) => void;
  updateHeadingFont: (fontFamily: string) => void;
  updateDropCapFont: (fontFamily: string) => void;
  updateHeading: (level: 'h1' | 'h2' | 'h3' | 'h4', style: HeadingStyle) => void;
  resetStyle: () => void;
  validateStyle: (style: BookStyle) => ValidationError[];
}

export interface UseStyleEditorReturn extends StyleEditorState, StyleEditorActions {}

interface UseStyleEditorOptions {
  debounceMs?: number;
  onChange?: (style: BookStyle) => void;
}

/**
 * Custom hook for managing StyleEditor state, validation, and debounced updates
 */
export function useStyleEditor(
  initialStyle: BookStyle,
  options: UseStyleEditorOptions = {}
): UseStyleEditorReturn {
  const { debounceMs = 300, onChange } = options;

  const [currentStyle, setCurrentStyle] = useState<BookStyle>(initialStyle);
  const [originalStyle] = useState<BookStyle>(initialStyle);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Refs for debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidStyleRef = useRef<BookStyle>(initialStyle);

  /**
   * Validate a BookStyle object
   */
  const validateStyle = useCallback((style: BookStyle): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Validate font sizes (must be positive)
    const fontSizeRegex = /^(\d+(?:\.\d+)?)(px|pt|em|rem)$/;

    // Body font size
    if (style.body.fontSize) {
      const match = style.body.fontSize.match(fontSizeRegex);
      if (!match || parseFloat(match[1]) <= 0) {
        errors.push({
          field: 'body.fontSize',
          message: 'Body font size must be a positive number with units (px, pt, em, rem)',
        });
      }
    }

    // Heading font sizes
    const headingLevels: Array<'h1' | 'h2' | 'h3' | 'h4'> = ['h1', 'h2', 'h3'];
    if (style.headings.h4) {
      headingLevels.push('h4');
    }

    headingLevels.forEach((level) => {
      const heading = style.headings[level];
      if (heading && heading.fontSize) {
        const match = heading.fontSize.match(fontSizeRegex);
        if (!match || parseFloat(match[1]) <= 0) {
          errors.push({
            field: `headings.${level}.fontSize`,
            message: `${level.toUpperCase()} font size must be a positive number with units`,
          });
        }
      }
    });

    // Validate drop cap lines (must be 1-5)
    if (style.dropCap.enabled) {
      const lines = style.dropCap.lines;
      if (!Number.isInteger(lines) || lines < 1 || lines > 5) {
        errors.push({
          field: 'dropCap.lines',
          message: 'Drop cap lines must be an integer between 1 and 5',
        });
      }
    }

    // Validate required fields
    if (!style.fonts.body || style.fonts.body.trim() === '') {
      errors.push({
        field: 'fonts.body',
        message: 'Body font is required',
      });
    }

    if (!style.fonts.heading || style.fonts.heading.trim() === '') {
      errors.push({
        field: 'fonts.heading',
        message: 'Heading font is required',
      });
    }

    if (!style.body.fontSize || style.body.fontSize.trim() === '') {
      errors.push({
        field: 'body.fontSize',
        message: 'Body font size is required',
      });
    }

    if (!style.body.lineHeight || style.body.lineHeight.trim() === '') {
      errors.push({
        field: 'body.lineHeight',
        message: 'Body line height is required',
      });
    }

    // Validate heading font sizes (required)
    headingLevels.forEach((level) => {
      const heading = style.headings[level];
      if (heading && (!heading.fontSize || heading.fontSize.trim() === '')) {
        errors.push({
          field: `headings.${level}.fontSize`,
          message: `${level.toUpperCase()} font size is required`,
        });
      }
    });

    return errors;
  }, []);

  /**
   * Debounced onChange callback
   */
  const debouncedOnChange = useCallback(
    (style: BookStyle) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const errors = validateStyle(style);
        setValidationErrors(errors);

        // Only call onChange if validation passes
        if (errors.length === 0) {
          lastValidStyleRef.current = style;
          onChange?.(style);
        }
      }, debounceMs);
    },
    [debounceMs, onChange, validateStyle]
  );

  /**
   * Update style with validation
   */
  const updateStyle = useCallback(
    (updates: Partial<BookStyle>) => {
      setCurrentStyle((prev) => {
        const newStyle = { ...prev, ...updates };
        setIsDirty(true);
        debouncedOnChange(newStyle);
        return newStyle;
      });
    },
    [debouncedOnChange]
  );

  /**
   * Update body font
   */
  const updateBodyFont = useCallback(
    (fontFamily: string) => {
      updateStyle({
        fonts: {
          ...currentStyle.fonts,
          body: fontFamily,
        },
      });
    },
    [currentStyle.fonts, updateStyle]
  );

  /**
   * Update heading font
   */
  const updateHeadingFont = useCallback(
    (fontFamily: string) => {
      updateStyle({
        fonts: {
          ...currentStyle.fonts,
          heading: fontFamily,
        },
      });
    },
    [currentStyle.fonts, updateStyle]
  );

  /**
   * Update drop cap font
   */
  const updateDropCapFont = useCallback(
    (fontFamily: string) => {
      updateStyle({
        dropCap: {
          ...currentStyle.dropCap,
          fontFamily,
        },
      });
    },
    [currentStyle.dropCap, updateStyle]
  );

  /**
   * Update heading style
   */
  const updateHeading = useCallback(
    (level: 'h1' | 'h2' | 'h3' | 'h4', style: HeadingStyle) => {
      updateStyle({
        headings: {
          ...currentStyle.headings,
          [level]: style,
        },
      });
    },
    [currentStyle.headings, updateStyle]
  );

  /**
   * Reset to original style
   */
  const resetStyle = useCallback(() => {
    setCurrentStyle(originalStyle);
    setIsDirty(false);
    setValidationErrors([]);
    lastValidStyleRef.current = originalStyle;
    onChange?.(originalStyle);
  }, [originalStyle, onChange]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Initial validation
  useEffect(() => {
    const errors = validateStyle(initialStyle);
    setValidationErrors(errors);
  }, [initialStyle, validateStyle]);

  return {
    currentStyle,
    originalStyle,
    isDirty,
    validationErrors,
    isValid: validationErrors.length === 0,
    updateStyle,
    updateBodyFont,
    updateHeadingFont,
    updateDropCapFont,
    updateHeading,
    resetStyle,
    validateStyle,
  };
}
