import { http, HttpResponse } from 'msw';

export const handlers = [
  // Мок для проверки аутентификации (GET /api/Auth/me)
  http.get('*/api/Auth/me', () => {
    return HttpResponse.json({
      success: true,
      data: { user_id: 1, username: 'testuser' }
    });
  }),

  // Мок для логина (POST /api/Auth/login)
  http.post('*/api/Auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.username === 'testuser' && body.password === 'pass123') {
      return HttpResponse.json({ success: true });
    }
    return HttpResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  }),

  // Добавьте другие эндпоинты по мере необходимости
];