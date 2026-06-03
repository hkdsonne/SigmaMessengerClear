import * as userService from '../userService';

describe('userService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetch(data, ok = true) {
    return vi.spyOn(global, 'fetch').mockResolvedValue({
      ok,
      json: vi.fn().mockResolvedValue(data),
    });
  }

  it('getMyProfile отправляет GET /api/User/me', async () => {
    const mockData = { data: { full_name: 'Alice' } };
    const fetchSpy = mockFetch(mockData);
    const result = await userService.getMyProfile();
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringMatching(/\/api\/User\/me$/), expect.objectContaining({
      credentials: 'include',
    }));
    expect(result).toEqual(mockData.data);
  });

  it('getMySettings отправляет GET /api/User/me/settings', async () => {
    const mockData = { data: { notifications_enabled: true } };
    const fetchSpy = mockFetch(mockData);
    const result = await userService.getMySettings();
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringMatching(/\/api\/User\/me\/settings$/), expect.any(Object));
    expect(result).toEqual(mockData.data);
  });

  it('updateMyProfile отправляет PUT с телом', async () => {
    const payload = { full_name: 'New Name' };
    const fetchSpy = mockFetch({ data: {} });
    await userService.updateMyProfile(payload);
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringMatching(/\/api\/User\/me\/info$/), {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  });

  it('updateMySettings отправляет PUT с телом', async () => {
    const payload = { notifications_enabled: false };
    const fetchSpy = mockFetch({ data: {} });
    await userService.updateMySettings(payload);
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringMatching(/\/api\/User\/me\/settings$/), {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  });

  it('getUsersList отправляет GET /api/User/list', async () => {
    const mockList = { data: [{ user_id: 1, username: 'alice' }] };
    const fetchSpy = mockFetch(mockList);
    const result = await userService.getUsersList();
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringMatching(/\/api\/User\/list$/), expect.any(Object));
    expect(result).toEqual(mockList.data);
  });

  it('getUserByUsername отправляет GET с username в URL', async () => {
    const username = 'alice';
    const mockUser = { data: { user_id: 1, username } };
    const fetchSpy = mockFetch(mockUser);
    const result = await userService.getUserByUsername(username);
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`/api/User/by-username/${username}$`)), expect.any(Object));
    expect(result).toEqual(mockUser.data);
  });
});