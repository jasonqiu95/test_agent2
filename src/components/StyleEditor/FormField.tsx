import React from 'react';
import './FormField.css';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  children,
  error,
  helperText,
  required = false,
}) => {
  return (
    <div className={`form-field ${error ? 'form-field--error' : ''}`}>
      <label htmlFor={htmlFor} className="form-field__label">
        {label}
        {required && <span className="form-field__required">*</span>}
      </label>
      <div className="form-field__input-wrapper">{children}</div>
      {error && <div className="form-field__error">{error}</div>}
      {helperText && !error && (
        <div className="form-field__helper-text">{helperText}</div>
      )}
    </div>
  );
};

export interface SelectFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  error?: string;
  helperText?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  id,
  value,
  onChange,
  options,
  required,
  error,
  helperText,
}) => {
  return (
    <FormField
      label={label}
      htmlFor={id}
      error={error}
      helperText={helperText}
      required={required}
    >
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-field__select"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};

export interface InputFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  error,
  helperText,
  min,
  max,
  step,
}) => {
  return (
    <FormField
      label={label}
      htmlFor={id}
      error={error}
      helperText={helperText}
      required={required}
    >
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-field__input"
        min={min}
        max={max}
        step={step}
      />
    </FormField>
  );
};

export interface InputWithUnitFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  units?: string[];
  required?: boolean;
  error?: string;
  helperText?: string;
}

export const InputWithUnitField: React.FC<InputWithUnitFieldProps> = ({
  label,
  id,
  value,
  onChange,
  units = ['px', 'em', 'rem', '%'],
  required,
  error,
  helperText,
}) => {
  // Extract numeric value and unit from the input
  const numericMatch = value.match(/^(\d*\.?\d*)(.*)$/);
  const numericValue = numericMatch?.[1] || '';
  const unit = numericMatch?.[2]?.trim() || units[0];

  const handleNumericChange = (newValue: string) => {
    onChange(`${newValue}${unit}`);
  };

  const handleUnitChange = (newUnit: string) => {
    onChange(`${numericValue}${newUnit}`);
  };

  return (
    <FormField
      label={label}
      htmlFor={id}
      error={error}
      helperText={helperText}
      required={required}
    >
      <div className="form-field__input-group">
        <input
          id={id}
          type="text"
          value={numericValue}
          onChange={(e) => handleNumericChange(e.target.value)}
          className="form-field__input form-field__input--with-unit"
        />
        <select
          value={unit}
          onChange={(e) => handleUnitChange(e.target.value)}
          className="form-field__unit-select"
        >
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
    </FormField>
  );
};

export interface AutocompleteFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
  error?: string;
  helperText?: string;
  placeholder?: string;
}

export const AutocompleteField: React.FC<AutocompleteFieldProps> = ({
  label,
  id,
  value,
  onChange,
  options,
  required,
  error,
  helperText,
  placeholder,
}) => {
  return (
    <FormField
      label={label}
      htmlFor={id}
      error={error}
      helperText={helperText}
      required={required}
    >
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={`${id}-datalist`}
        placeholder={placeholder}
        className="form-field__input"
      />
      <datalist id={`${id}-datalist`}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </FormField>
  );
};
