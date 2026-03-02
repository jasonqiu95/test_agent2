import { renderHook, act, waitFor } from '@testing-library/react';
import { useStyleEditor } from '../useStyleEditor';
import { BookStyle } from '../../../types/style';

const createMockStyle = (): BookStyle => ({
  id: 'test-style',
  name: 'Test Style',
  description: 'Test style description',
  category: 'serif',
  fonts: {
    body: 'Georgia, serif',
    heading: 'Times New Roman, serif',
    fallback: 'serif',
  },
  headings: {
    h1: {
      fontSize: '24pt',
      fontWeight: 'bold',
    },
    h2: {
      fontSize: '20pt',
      fontWeight: 'bold',
    },
    h3: {
      fontSize: '16pt',
      fontWeight: 'bold',
    },
  },
  body: {
    fontSize: '12pt',
    lineHeight: '1.5',
    textAlign: 'left',
  },
  dropCap: {
    enabled: false,
    lines: 3,
  },
  ornamentalBreak: {
    enabled: false,
    symbol: '✦',
  },
  firstParagraph: {
    enabled: false,
    indent: {
      enabled: false,
    },
  },
  spacing: {
    paragraphSpacing: '0.5em',
    lineHeight: '1.5',
    sectionSpacing: '2em',
    chapterSpacing: '4em',
  },
  colors: {
    text: '#000000',
    heading: '#000000',
  },
});

describe('useStyleEditor', () => {
  it('should initialize with the provided style', () => {
    const mockStyle = createMockStyle();
    const { result } = renderHook(() => useStyleEditor(mockStyle));

    expect(result.current.currentStyle).toEqual(mockStyle);
    expect(result.current.originalStyle).toEqual(mockStyle);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isValid).toBe(true);
  });

  it('should mark as dirty when style is updated', () => {
    const mockStyle = createMockStyle();
    const { result } = renderHook(() => useStyleEditor(mockStyle));

    act(() => {
      result.current.updateBodyFont('Arial, sans-serif');
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.currentStyle.fonts.body).toBe('Arial, sans-serif');
  });

  it('should validate font sizes are positive', async () => {
    const mockStyle = createMockStyle();
    const onChangeMock = jest.fn();
    const { result } = renderHook(() =>
      useStyleEditor(mockStyle, { onChange: onChangeMock, debounceMs: 50 })
    );

    act(() => {
      result.current.updateStyle({
        body: {
          ...mockStyle.body,
          fontSize: '-10pt', // Invalid: negative font size
        },
      });
    });

    await waitFor(
      () => {
        expect(result.current.validationErrors.length).toBeGreaterThan(0);
      },
      { timeout: 200 }
    );

    expect(result.current.isValid).toBe(false);
    expect(
      result.current.validationErrors.some((e) => e.field === 'body.fontSize')
    ).toBe(true);
    // onChange should not be called with invalid data
    expect(onChangeMock).not.toHaveBeenCalled();
  });

  it('should validate drop cap lines are between 1 and 5', async () => {
    const mockStyle = createMockStyle();
    const onChangeMock = jest.fn();
    const { result } = renderHook(() =>
      useStyleEditor(mockStyle, { onChange: onChangeMock, debounceMs: 50 })
    );

    act(() => {
      result.current.updateStyle({
        dropCap: {
          enabled: true,
          lines: 10, // Invalid: exceeds max of 5
        },
      });
    });

    await waitFor(
      () => {
        expect(result.current.validationErrors.length).toBeGreaterThan(0);
      },
      { timeout: 200 }
    );

    expect(result.current.isValid).toBe(false);
    expect(
      result.current.validationErrors.some((e) => e.field === 'dropCap.lines')
    ).toBe(true);
  });

  it('should call onChange with debounce after valid updates', async () => {
    const mockStyle = createMockStyle();
    const onChangeMock = jest.fn();
    const { result } = renderHook(() =>
      useStyleEditor(mockStyle, { onChange: onChangeMock, debounceMs: 50 })
    );

    act(() => {
      result.current.updateBodyFont('Arial, sans-serif');
    });

    // Should not call immediately
    expect(onChangeMock).not.toHaveBeenCalled();

    // Wait for debounce
    await waitFor(
      () => {
        expect(onChangeMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 200 }
    );

    const calledStyle = onChangeMock.mock.calls[0][0];
    expect(calledStyle.fonts.body).toBe('Arial, sans-serif');
  });

  it('should update heading styles', () => {
    const mockStyle = createMockStyle();
    const { result } = renderHook(() => useStyleEditor(mockStyle));

    act(() => {
      result.current.updateHeading('h1', {
        fontSize: '32pt',
        fontWeight: 'bold',
      });
    });

    expect(result.current.currentStyle.headings.h1.fontSize).toBe('32pt');
    expect(result.current.isDirty).toBe(true);
  });

  it('should reset to original style', () => {
    const mockStyle = createMockStyle();
    const { result } = renderHook(() => useStyleEditor(mockStyle));

    act(() => {
      result.current.updateBodyFont('Arial, sans-serif');
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.resetStyle();
    });

    expect(result.current.isDirty).toBe(false);
    expect(result.current.currentStyle).toEqual(mockStyle);
  });

  it('should validate required fields', async () => {
    const mockStyle = createMockStyle();
    const { result } = renderHook(() =>
      useStyleEditor(mockStyle, { debounceMs: 50 })
    );

    act(() => {
      result.current.updateStyle({
        fonts: {
          ...mockStyle.fonts,
          body: '', // Invalid: empty required field
        },
      });
    });

    await waitFor(
      () => {
        expect(result.current.validationErrors.length).toBeGreaterThan(0);
      },
      { timeout: 200 }
    );

    expect(result.current.isValid).toBe(false);
    expect(
      result.current.validationErrors.some((e) => e.field === 'fonts.body')
    ).toBe(true);
  });
});
