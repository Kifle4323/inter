import { render, screen } from '@testing-library/react';
import App from './App';

test('renders hero component with "John Doe"', () => {
  render(<App />);
  const linkElement = screen.getByText(/John Doe/i);
  expect(linkElement).toBeInTheDocument();
});
