import { 
  sendVerification, 
  verifyCode, 
  loginUser, 
  logoutUser, 
  getCurrentUser, 
  isAuthenticated 
} from '../auth';
import { apiRequest } from '../api';

vi.mock('../api', () => ({
  apiRequest: vi.fn(),
}));

describe('auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sendVerification отправляет правильный запрос', async () => {
    apiRequest.mockResolvedValue({ success: true });
    const result = await sendVerification('alice', 'alice@ex.com', 'pass123');
    expect(apiRequest).toHaveBeenCalledWith('/api/Auth/send-verification', {
      method: 'POST',
      body: JSON.stringify({
        username: 'alice',
        email: 'alice@ex.com',
        password: 'pass123',
        device_info: 'web',
      }),
    });
    expect(result).toEqual({ success: true });
  });

  it('verifyCode отправляет правильный запрос', async () => {
    apiRequest.mockResolvedValue({ success: true });
    const result = await verifyCode('alice@ex.com', '123456', 'alice', 'pass123');
    expect(apiRequest).toHaveBeenCalledWith('/api/Auth/verify', {
      method: 'POST',
      body: JSON.stringify({
        email: 'alice@ex.com',
        code: '123456',
        username: 'alice',
        password: 'pass123',
        device_info: 'web',
      }),
    });
    expect(result).toEqual({ success: true });
  });

  it('loginUser отправляет правильный запрос', async () => {
    apiRequest.mockResolvedValue({ data: { token: 'abc' } });
    const result = await loginUser('alice', 'pass123');
    expect(apiRequest).toHaveBeenCalledWith('/api/Auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'alice',
        password: 'pass123',
        device_info: 'web',
      }),
    });
    expect(result).toEqual({ data: { token: 'abc' } });
  });

  it('logoutUser отправляет POST запрос', async () => {
    apiRequest.mockResolvedValue({ success: true });
    await logoutUser();
    expect(apiRequest).toHaveBeenCalledWith('/api/Auth/logout', { method: 'POST' });
  });

  it('getCurrentUser отправляет GET запрос', async () => {
    apiRequest.mockResolvedValue({ data: { user_id: 1 } });
    const result = await getCurrentUser();
    expect(apiRequest).toHaveBeenCalledWith('/api/Auth/me', { method: 'GET' });
    expect(result).toEqual({ data: { user_id: 1 } });
  });

  it('isAuthenticated возвращает true при успешном getCurrentUser', async () => {
    apiRequest.mockResolvedValue({ data: { user_id: 1 } });
    const result = await isAuthenticated();
    expect(result).toBe(true);
  });

  it('isAuthenticated возвращает false при ошибке getCurrentUser', async () => {
    apiRequest.mockRejectedValue(new Error('Unauthorized'));
    const result = await isAuthenticated();
    expect(result).toBe(false);
  });
});