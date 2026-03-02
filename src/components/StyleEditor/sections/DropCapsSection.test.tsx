import { render, screen, fireEvent } from '@testing-library/react';
import { DropCapsSection } from './DropCapsSection';
import { DropCapStyle } from '../../../types/style';

describe('DropCapsSection', () => {
  const mockOnChange = jest.fn();

  const defaultDropCapStyle: DropCapStyle = {
    enabled: false,
    lines: 3,
    fontSize: '3em',
    fontFamily: 'inherit-heading',
    fontWeight: 'bold',
    color: '#000000',
    marginRight: '0.1em',
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders the section title', () => {
    render(
      <DropCapsSection
        dropCapStyle={defaultDropCapStyle}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Drop Caps')).toBeInTheDocument();
  });

  it('renders enable checkbox', () => {
    render(
      <DropCapsSection
        dropCapStyle={defaultDropCapStyle}
        onChange={mockOnChange}
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: /enable drop caps/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('calls onChange when toggle is clicked', () => {
    render(
      <DropCapsSection
        dropCapStyle={defaultDropCapStyle}
        onChange={mockOnChange}
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: /enable drop caps/i });
    fireEvent.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledWith({ enabled: true });
  });

  it('disables all controls when drop caps are disabled', () => {
    render(
      <DropCapsSection
        dropCapStyle={defaultDropCapStyle}
        onChange={mockOnChange}
      />
    );

    const linesInput = screen.getByLabelText(/number of lines/i);
    const fontSizeSelect = screen.getByLabelText(/font size/i);
    const fontFamilySelect = screen.getByLabelText(/font family/i);
    const fontWeightSelect = screen.getByLabelText(/font weight/i);

    expect(linesInput).toBeDisabled();
    expect(fontSizeSelect).toBeDisabled();
    expect(fontFamilySelect).toBeDisabled();
    expect(fontWeightSelect).toBeDisabled();
  });

  it('enables all controls when drop caps are enabled', () => {
    const enabledDropCapStyle: DropCapStyle = {
      ...defaultDropCapStyle,
      enabled: true,
    };

    render(
      <DropCapsSection
        dropCapStyle={enabledDropCapStyle}
        onChange={mockOnChange}
      />
    );

    const linesInput = screen.getByLabelText(/number of lines/i);
    const fontSizeSelect = screen.getByLabelText(/font size/i);
    const fontFamilySelect = screen.getByLabelText(/font family/i);
    const fontWeightSelect = screen.getByLabelText(/font weight/i);

    expect(linesInput).not.toBeDisabled();
    expect(fontSizeSelect).not.toBeDisabled();
    expect(fontFamilySelect).not.toBeDisabled();
    expect(fontWeightSelect).not.toBeDisabled();
  });

  it('updates lines when input changes', () => {
    const enabledDropCapStyle: DropCapStyle = {
      ...defaultDropCapStyle,
      enabled: true,
    };

    render(
      <DropCapsSection
        dropCapStyle={enabledDropCapStyle}
        onChange={mockOnChange}
      />
    );

    const linesInput = screen.getByLabelText(/number of lines/i) as HTMLInputElement;
    fireEvent.change(linesInput, { target: { value: '5' } });

    expect(mockOnChange).toHaveBeenCalledWith({ lines: 5 });
  });

  it('updates font size when select changes', () => {
    const enabledDropCapStyle: DropCapStyle = {
      ...defaultDropCapStyle,
      enabled: true,
    };

    render(
      <DropCapsSection
        dropCapStyle={enabledDropCapStyle}
        onChange={mockOnChange}
      />
    );

    const fontSizeSelect = screen.getByLabelText(/font size/i);
    fireEvent.change(fontSizeSelect, { target: { value: '4em' } });

    expect(mockOnChange).toHaveBeenCalledWith({ fontSize: '4em' });
  });

  it('updates font family when select changes', () => {
    const enabledDropCapStyle: DropCapStyle = {
      ...defaultDropCapStyle,
      enabled: true,
    };

    render(
      <DropCapsSection
        dropCapStyle={enabledDropCapStyle}
        onChange={mockOnChange}
      />
    );

    const fontFamilySelect = screen.getByLabelText(/font family/i);
    fireEvent.change(fontFamilySelect, { target: { value: 'serif' } });

    expect(mockOnChange).toHaveBeenCalledWith({ fontFamily: 'serif' });
  });

  it('updates font weight when select changes', () => {
    const enabledDropCapStyle: DropCapStyle = {
      ...defaultDropCapStyle,
      enabled: true,
    };

    render(
      <DropCapsSection
        dropCapStyle={enabledDropCapStyle}
        onChange={mockOnChange}
      />
    );

    const fontWeightSelect = screen.getByLabelText(/font weight/i);
    fireEvent.change(fontWeightSelect, { target: { value: '900' } });

    expect(mockOnChange).toHaveBeenCalledWith({ fontWeight: '900' });
  });

  it('updates color when color input changes', () => {
    const enabledDropCapStyle: DropCapStyle = {
      ...defaultDropCapStyle,
      enabled: true,
    };

    render(
      <DropCapsSection
        dropCapStyle={enabledDropCapStyle}
        onChange={mockOnChange}
      />
    );

    const colorInputs = screen.getAllByDisplayValue('#000000');
    const colorInput = colorInputs[0]; // Color picker input
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });

    expect(mockOnChange).toHaveBeenCalledWith({ color: '#ff0000' });
  });

  it('updates margin right when select changes', () => {
    const enabledDropCapStyle: DropCapStyle = {
      ...defaultDropCapStyle,
      enabled: true,
    };

    render(
      <DropCapsSection
        dropCapStyle={enabledDropCapStyle}
        onChange={mockOnChange}
      />
    );

    const marginRightSelect = screen.getByLabelText(/margin right spacing/i);
    fireEvent.change(marginRightSelect, { target: { value: '0.2em' } });

    expect(mockOnChange).toHaveBeenCalledWith({ marginRight: '0.2em' });
  });

  it('displays heading font family hint when provided', () => {
    render(
      <DropCapsSection
        dropCapStyle={defaultDropCapStyle}
        headingFontFamily="Georgia"
        onChange={mockOnChange}
      />
    );

    const fontFamilySelect = screen.getByLabelText(/font family/i);
    const option = fontFamilySelect.querySelector('option[value="inherit-heading"]');
    expect(option?.textContent).toContain('Georgia');
  });

  it('enforces min and max values for lines input', () => {
    const enabledDropCapStyle: DropCapStyle = {
      ...defaultDropCapStyle,
      enabled: true,
    };

    render(
      <DropCapsSection
        dropCapStyle={enabledDropCapStyle}
        onChange={mockOnChange}
      />
    );

    const linesInput = screen.getByLabelText(/number of lines/i) as HTMLInputElement;
    expect(linesInput.min).toBe('1');
    expect(linesInput.max).toBe('5');
  });
});
