import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { addFrontMatter, addBackMatter } from '../../store/bookSlice';
import { templateService } from '../../services/templateService';
import { ElementType, MatterType } from '../../types/element';
import { createElement } from '../../models/factories';
import './AddElementDropdown.css';

export interface AddElementDropdownProps {
  position: { x: number; y: number };
  onClose: () => void;
}

interface ElementOption {
  type: ElementType;
  matter: MatterType;
  label: string;
  templateId?: string;
}

const FRONT_MATTER_OPTIONS: ElementOption[] = [
  { type: 'title-page', matter: 'front', label: 'Title Page', templateId: 'title-page-standard' },
  { type: 'copyright', matter: 'front', label: 'Copyright', templateId: 'copyright-standard' },
  { type: 'dedication', matter: 'front', label: 'Dedication', templateId: 'dedication-standard' },
  { type: 'epigraph', matter: 'front', label: 'Epigraph', templateId: 'epigraph-standard' },
  { type: 'foreword', matter: 'front', label: 'Foreword', templateId: 'foreword-standard' },
  { type: 'preface', matter: 'front', label: 'Preface', templateId: 'preface-standard' },
  { type: 'acknowledgments', matter: 'front', label: 'Acknowledgments', templateId: 'acknowledgments-standard' },
  { type: 'introduction', matter: 'front', label: 'Introduction', templateId: 'introduction-standard' },
  { type: 'prologue', matter: 'front', label: 'Prologue', templateId: 'prologue-standard' },
];

const BACK_MATTER_OPTIONS: ElementOption[] = [
  { type: 'epilogue', matter: 'back', label: 'Epilogue', templateId: 'epilogue-standard' },
  { type: 'afterword', matter: 'back', label: 'Afterword', templateId: 'afterword-standard' },
  { type: 'about-author', matter: 'back', label: 'About the Author', templateId: 'about-author-standard' },
  { type: 'bibliography', matter: 'back', label: 'Bibliography', templateId: 'bibliography-standard' },
  { type: 'glossary', matter: 'back', label: 'Glossary', templateId: 'glossary-standard' },
  { type: 'index', matter: 'back', label: 'Index', templateId: 'index-standard' },
  { type: 'appendix', matter: 'back', label: 'Appendix', templateId: 'appendix-standard' },
];

export const AddElementDropdown: React.FC<AddElementDropdownProps> = ({
  position,
  onClose,
}) => {
  const dispatch = useDispatch();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleAddElement = (option: ElementOption) => {
    let element;

    if (option.templateId) {
      // Try to create from template
      const defaultValues = templateService.getDefaultFieldValues(option.templateId);
      element = templateService.createElementFromTemplate(option.templateId, defaultValues);
    }

    // Fallback: create basic element if template doesn't exist or fails
    if (!element) {
      element = createElement(option.type, option.matter, option.label);
    }

    // Dispatch appropriate action based on matter type
    if (option.matter === 'front') {
      dispatch(addFrontMatter(element));
    } else if (option.matter === 'back') {
      dispatch(addBackMatter(element));
    }

    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="add-element-dropdown"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
    >
      <div className="add-element-dropdown-header">
        Add Element
      </div>

      <div className="add-element-dropdown-content">
        <div className="add-element-category">
          <div className="add-element-category-header">Front Matter</div>
          <div className="add-element-options">
            {FRONT_MATTER_OPTIONS.map((option) => (
              <button
                key={option.type}
                className="add-element-option"
                onClick={() => handleAddElement(option)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="add-element-category">
          <div className="add-element-category-header">Back Matter</div>
          <div className="add-element-options">
            {BACK_MATTER_OPTIONS.map((option) => (
              <button
                key={option.type}
                className="add-element-option"
                onClick={() => handleAddElement(option)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
