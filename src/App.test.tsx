import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders the app header', () => {
    render(<App />);
    expect(screen.getByText(/Electron \+ React \+ TypeScript \+ Vite/i)).toBeInTheDocument();
  });

  it('displays initial count', () => {
    render(<App />);
    expect(screen.getByText(/Count is 0/i)).toBeInTheDocument();
  });

  it('increments count when button is clicked', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /Count is 0/i });
    fireEvent.click(button);
    expect(screen.getByText(/Count is 1/i)).toBeInTheDocument();
  });
});
