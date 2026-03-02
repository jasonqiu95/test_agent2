import React from 'react';
import './FormField.css';

export interface FormFieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, hint, children }) => {
  return (
    <div className="form-field">
      <label className="form-field__label">{label}</label>
      <div className="form-field__control">{children}</div>
      {hint && <p className="form-field__hint">{hint}</p>}
    </div>
  );
};

export interface SelectFieldProps {
  label: string;
  value: string | number;
  options: Array<{ value: string | number; label: string }>;
  onChange: (value: string) => void;
  hint?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  options,
  onChange,
  hint,
}) => {
  return (
    <FormField label={label} hint={hint}>
      <select
        className="form-field__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  hint?: string;
  unit?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  unit,
}) => {
  return (
    <FormField label={label} hint={hint}>
      <div className="form-field__input-group">
        <input
          type={type}
          className="form-field__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {unit && <span className="form-field__unit">{unit}</span>}
      </div>
    </FormField>
  );
};

export interface RadioGroupProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  hint?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  value,
  options,
  onChange,
  hint,
}) => {
  return (
    <FormField label={label} hint={hint}>
      <div className="form-field__radio-group">
        {options.map((option) => (
          <label key={option.value} className="form-field__radio-label">
            <input
              type="radio"
              name={label}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="form-field__radio"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </FormField>
  );
};
