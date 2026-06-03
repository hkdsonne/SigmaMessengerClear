import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';

vi.mock('../../services/auth', () => ({
  loginUser: vi.fn(),
  isAuthenticated: vi.fn(),
}));

describe('Login page', () => {
  it('отображает форму входа', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText(/имя пользователя/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/пароль/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('не вызывает loginUser при пустых полях', async () => {
    const { loginUser } = await import('../../services/auth');
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    const button = screen.getByRole('button', { name: /войти/i });
    await userEvent.click(button);

    // Даём время на возможный вызов
    await waitFor(() => {
      expect(loginUser).not.toHaveBeenCalled();
    });
  });

  it('выполняет вход с правильными данными', async () => {
    const { loginUser } = await import('../../services/auth');
    loginUser.mockResolvedValue({});

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    await userEvent.type(screen.getByPlaceholderText(/имя пользователя/i), 'testuser');
    await userEvent.type(screen.getByPlaceholderText(/пароль/i), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith('testuser', 'pass123');
    });
  });
});