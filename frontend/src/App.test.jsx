import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './pages/Login';

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({ login: vi.fn() }),
}));

describe('Login page', () => {
  it('renders the login form', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /kyro/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
