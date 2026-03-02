/**
 * Template service for managing and applying front/back matter templates
 */

import {
  ElementTemplate,
  TemplateCategory,
  TemplateField,
} from '../types/template';
import { Element, ElementType, MatterType } from '../types/element';
import { TextBlock } from '../types/textBlock';
import { createElement } from '../models/factories';
import {
  allTemplates,
  templateCategories,
  templateMap,
} from '../data/templates';

export class TemplateService {
  /**
   * Get all available template categories
   */
  getTemplateCategories(): TemplateCategory[] {
    return templateCategories;
  }

  /**
   * Get all templates
   */
  getAllTemplates(): ElementTemplate[] {
    return allTemplates;
  }

  /**
   * Get templates by matter type (front or back)
   */
  getTemplatesByMatter(matter: MatterType): ElementTemplate[] {
    return allTemplates.filter(template => template.matter === matter);
  }

  /**
   * Get template by ID
   */
  getTemplateById(id: string): ElementTemplate | undefined {
    return templateMap.get(id);
  }

  /**
   * Get templates by element type
   */
  getTemplatesByType(type: ElementType): ElementTemplate[] {
    return allTemplates.filter(template => template.type === type);
  }

  /**
   * Apply template field values to content
   */
  private applyFieldValues(
    content: TextBlock[],
    values: Record<string, string | number>
  ): TextBlock[] {
    return content.map(block => {
      let processedContent = block.content;

      // Replace all placeholders in the content
      Object.entries(values).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        processedContent = processedContent.replace(
          new RegExp(placeholder, 'g'),
          String(value)
        );
      });

      return {
        ...block,
        content: processedContent,
      };
    });
  }

  /**
   * Create an Element from a template with field values
   */
  createElementFromTemplate(
    templateId: string,
    fieldValues: Record<string, string | number>,
    overrides?: Partial<Element>
  ): Element | null {
    const template = this.getTemplateById(templateId);
    if (!template) {
      return null;
    }

    // Validate required fields
    const missingFields = template.fields
      .filter(field => field.required && !fieldValues[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required fields: ${missingFields.join(', ')}`
      );
    }

    // Merge default values with provided values
    const values: Record<string, string | number> = {};
    template.fields.forEach(field => {
      if (fieldValues[field.name] !== undefined) {
        values[field.name] = fieldValues[field.name];
      } else if (field.defaultValue !== undefined) {
        values[field.name] = field.defaultValue;
      }
    });

    // Apply field values to template content
    const processedContent = this.applyFieldValues(template.content, values);

    // Create the element
    return createElement(
      template.type,
      template.matter,
      template.name,
      {
        content: processedContent,
        includeInToc: template.includeInToc,
        ...overrides,
      }
    );
  }

  /**
   * Get default field values for a template
   */
  getDefaultFieldValues(templateId: string): Record<string, string | number> {
    const template = this.getTemplateById(templateId);
    if (!template) {
      return {};
    }

    const defaults: Record<string, string | number> = {};
    template.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      }
    });

    return defaults;
  }

  /**
   * Validate field values against template requirements
   */
  validateFieldValues(
    templateId: string,
    fieldValues: Record<string, string | number>
  ): { valid: boolean; errors: string[] } {
    const template = this.getTemplateById(templateId);
    if (!template) {
      return { valid: false, errors: ['Template not found'] };
    }

    const errors: string[] = [];

    template.fields.forEach(field => {
      const value = fieldValues[field.name];

      // Check required fields
      if (field.required && (value === undefined || value === '')) {
        errors.push(`${field.label} is required`);
      }

      // Type validation
      if (value !== undefined && value !== '') {
        switch (field.type) {
          case 'number':
          case 'year':
            if (typeof value !== 'number' && isNaN(Number(value))) {
              errors.push(`${field.label} must be a number`);
            }
            break;
          case 'text':
          case 'multiline':
          case 'image':
            if (typeof value !== 'string') {
              errors.push(`${field.label} must be text`);
            }
            break;
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Search templates by name or description
   */
  searchTemplates(query: string): ElementTemplate[] {
    const lowerQuery = query.toLowerCase();
    return allTemplates.filter(
      template =>
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery)
    );
  }
}

// Export a singleton instance
export const templateService = new TemplateService();
