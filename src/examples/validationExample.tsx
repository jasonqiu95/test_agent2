import React, { useState } from 'react';
import { ValidationDialog } from '../components/ValidationDialog';
import { validateBook } from '../services/validator';
import type { Book } from '../types/book';
import type { ValidationResult } from '../services/validator';

/**
 * Example component showing how to use the ValidationDialog
 * with the book validation service
 */
export const ValidationExample: React.FC = () => {
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Example book data with some intentional issues for demonstration
  const exampleBook: Book = {
    id: 'book-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    title: 'My Book Title',
    authors: [
      {
        id: 'author-1',
        name: 'John Doe',
        role: 'author',
      },
    ],
    frontMatter: [],
    chapters: [
      {
        id: 'chapter-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        title: 'Chapter 1',
        content: [
          {
            id: 'block-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            content: 'This is the content of chapter 1.',
            blockType: 'paragraph',
          },
        ],
      },
      {
        id: 'chapter-2',
        createdAt: new Date(),
        updatedAt: new Date(),
        title: 'Chapter 2',
        content: [], // Empty chapter - will trigger an error
      },
    ],
    backMatter: [],
    styles: [
      {
        id: 'style-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Body Text',
        fontFamily: 'Georgia',
        fontSize: 12,
      },
    ],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      isbn: '978-0-123456-78-9', // Valid ISBN-13
      description: 'A sample book for validation testing',
      language: 'en',
    },
  };

  const handleValidateBook = () => {
    const result = validateBook(exampleBook, {
      validateMetadata: true,
      validateChapters: true,
      validateISBN: true,
      validateImages: true,
      validateLinks: true,
      validateStyles: true,
      minImageWidth: 300,
      minImageHeight: 300,
      exportFormat: 'pdf',
    });

    setValidationResult(result);
    setIsValidationOpen(true);
  };

  const handleProceedWithExport = () => {
    console.log('Proceeding with export...');
    alert('Export would proceed here!');
    setIsValidationOpen(false);
  };

  const handleCloseValidation = () => {
    setIsValidationOpen(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Book Validation Example</h1>
      <p>
        This example demonstrates the book validation system. Click the button below to
        validate the example book and see the validation results.
      </p>

      <button
        onClick={handleValidateBook}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Validate Book
      </button>

      {validationResult && (
        <ValidationDialog
          isOpen={isValidationOpen}
          onClose={handleCloseValidation}
          onProceed={handleProceedWithExport}
          validationResult={validationResult}
          title="Book Validation Results"
          canProceedWithWarnings={true}
        />
      )}

      <div style={{ marginTop: '40px' }}>
        <h2>Validation Checks</h2>
        <ul>
          <li>
            <strong>Required Metadata:</strong> Validates that title and author are present
          </li>
          <li>
            <strong>Empty Chapters:</strong> Checks for chapters without content
          </li>
          <li>
            <strong>ISBN Format:</strong> Validates ISBN-10 and ISBN-13 format (if provided)
          </li>
          <li>
            <strong>Image Resolution:</strong> Checks image dimensions for PDF export quality
          </li>
          <li>
            <strong>Broken Links:</strong> Detects invalid URLs and localhost references
          </li>
          <li>
            <strong>Style Completeness:</strong> Validates style definitions and references
          </li>
        </ul>
      </div>
    </div>
  );
};
