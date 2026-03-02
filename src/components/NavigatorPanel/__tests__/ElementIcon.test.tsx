/**
 * ElementIcon Component and Icon Mapping Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ElementIcon } from '../ElementIcon';
import { ELEMENT_ICONS, getIcon, IconType } from '../icons';
import { ElementType } from '../../../types/element';

describe('Icon Mapping', () => {
  describe('Completeness', () => {
    it('should have icon mapping for chapter', () => {
      expect(ELEMENT_ICONS['chapter']).toBeDefined();
      expect(ELEMENT_ICONS['chapter']).toBe('📖');
    });

    it('should have icon mappings for all ElementType values', () => {
      const elementTypes: ElementType[] = [
        'title-page',
        'copyright',
        'dedication',
        'epigraph',
        'foreword',
        'preface',
        'acknowledgments',
        'introduction',
        'prologue',
        'epilogue',
        'afterword',
        'appendix',
        'glossary',
        'bibliography',
        'index',
        'about-author',
        'also-by',
        'other',
      ];

      elementTypes.forEach((type) => {
        expect(ELEMENT_ICONS[type]).toBeDefined();
        expect(typeof ELEMENT_ICONS[type]).toBe('string');
        expect(ELEMENT_ICONS[type].length).toBeGreaterThan(0);
      });
    });

    it('should have no missing mappings for any ElementType', () => {
      const elementTypes: ElementType[] = [
        'title-page',
        'copyright',
        'dedication',
        'epigraph',
        'foreword',
        'preface',
        'acknowledgments',
        'introduction',
        'prologue',
        'epilogue',
        'afterword',
        'appendix',
        'glossary',
        'bibliography',
        'index',
        'about-author',
        'also-by',
        'other',
      ];

      const missingMappings = elementTypes.filter((type) => !ELEMENT_ICONS[type]);
      expect(missingMappings).toEqual([]);
    });

    it('should include chapter in the complete IconType mapping', () => {
      const allIconTypes: IconType[] = [
        'chapter',
        'title-page',
        'copyright',
        'dedication',
        'epigraph',
        'foreword',
        'preface',
        'acknowledgments',
        'introduction',
        'prologue',
        'epilogue',
        'afterword',
        'appendix',
        'glossary',
        'bibliography',
        'index',
        'about-author',
        'also-by',
        'other',
      ];

      allIconTypes.forEach((type) => {
        expect(ELEMENT_ICONS[type]).toBeDefined();
      });
    });
  });

  describe('Individual Element Icons', () => {
    it('should have correct icon for chapter', () => {
      expect(ELEMENT_ICONS['chapter']).toBe('📖');
    });

    it('should have correct icon for title-page', () => {
      expect(ELEMENT_ICONS['title-page']).toBe('📄');
    });

    it('should have correct icon for copyright', () => {
      expect(ELEMENT_ICONS['copyright']).toBe('©️');
    });

    it('should have correct icon for dedication', () => {
      expect(ELEMENT_ICONS['dedication']).toBe('💝');
    });

    it('should have correct icon for prologue', () => {
      expect(ELEMENT_ICONS['prologue']).toBe('🎬');
    });

    it('should have correct icon for epilogue', () => {
      expect(ELEMENT_ICONS['epilogue']).toBe('🎭');
    });

    it('should have correct icon for other', () => {
      expect(ELEMENT_ICONS['other']).toBe('📄');
    });
  });

  describe('getIcon function', () => {
    it('should return correct icon for chapter', () => {
      expect(getIcon('chapter')).toBe('📖');
    });

    it('should return correct icon for any ElementType', () => {
      expect(getIcon('title-page')).toBe('📄');
      expect(getIcon('copyright')).toBe('©️');
      expect(getIcon('prologue')).toBe('🎬');
      expect(getIcon('epilogue')).toBe('🎭');
    });

    it('should return fallback icon for unknown type', () => {
      const result = getIcon('unknown-type' as IconType);
      expect(result).toBe(ELEMENT_ICONS.other);
    });
  });
});

describe('ElementIcon Component', () => {
  describe('Rendering', () => {
    it('should render chapter icon', () => {
      render(<ElementIcon type="chapter" />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveTextContent('📖');
      expect(icon).toHaveAttribute('aria-label', 'chapter icon');
    });

    it('should render all element type icons correctly', () => {
      const elementTypes: IconType[] = [
        'chapter',
        'title-page',
        'copyright',
        'dedication',
        'prologue',
        'epilogue',
      ];

      elementTypes.forEach((type) => {
        const { unmount } = render(<ElementIcon type={type} />);
        const icon = screen.getByRole('img', { hidden: true });
        expect(icon).toHaveTextContent(ELEMENT_ICONS[type]);
        expect(icon).toHaveAttribute('aria-label', `${type} icon`);
        unmount();
      });
    });

    it('should apply custom className', () => {
      render(<ElementIcon type="chapter" className="custom-icon" />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveClass('element-icon');
      expect(icon).toHaveClass('custom-icon');
    });

    it('should have aria-hidden by default', () => {
      render(<ElementIcon type="chapter" />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should allow overriding aria-hidden', () => {
      render(<ElementIcon type="chapter" aria-hidden={false} />);
      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('aria-hidden', 'false');
    });

    it('should render with element-icon class', () => {
      render(<ElementIcon type="chapter" />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveClass('element-icon');
    });
  });

  describe('All Element Types', () => {
    const allTypes: IconType[] = [
      'chapter',
      'title-page',
      'copyright',
      'dedication',
      'epigraph',
      'foreword',
      'preface',
      'acknowledgments',
      'introduction',
      'prologue',
      'epilogue',
      'afterword',
      'appendix',
      'glossary',
      'bibliography',
      'index',
      'about-author',
      'also-by',
      'other',
    ];

    it.each(allTypes)('should render icon for %s', (type) => {
      const { unmount } = render(<ElementIcon type={type} />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveTextContent(ELEMENT_ICONS[type]);
      expect(icon).toHaveAttribute('aria-label', `${type} icon`);
      unmount();
    });
  });
});
