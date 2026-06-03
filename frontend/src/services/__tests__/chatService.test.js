import chatService from '../chatService';
import { apiFetch } from '../apiFetch';

vi.mock('../apiFetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@microsoft/signalr', () => {
  const mockConnection = {
    start: vi.fn().mockResolvedValue(),
    stop: vi.fn().mockResolvedValue(),
    invoke: vi.fn().mockResolvedValue(),
    on: vi.fn(),
    off: vi.fn(),
    state: 'Connected',
  };
  class MockHubConnectionBuilder {
    withUrl() { return this; }
    withAutomaticReconnect() { return this; }
    build() { return mockConnection; }
  }
  const HubConnectionState = {
    Connected: 'Connected',
    Disconnected: 'Disconnected',
    Connecting: 'Connecting',
    Reconnecting: 'Reconnecting',
  };
  return {
    HubConnectionBuilder: MockHubConnectionBuilder,
    HubConnectionState,
  };
});

describe('chatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (chatService.connection) {
      chatService.connection = null;
    }
  });

  describe('HTTP методы', () => {
    it('fetchMyChats вызывает apiFetch и возвращает массив', async () => {
      const mockChats = [{ chat_id: 1, nazvanie: 'Test' }];
      apiFetch.mockResolvedValue({ ok: true, json: async () => mockChats });
      const result = await chatService.fetchMyChats();
      expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining('/my'));
      expect(result).toEqual(mockChats);
    });

    it('fetchMessages вызывает apiFetch с параметрами', async () => {
      const chatId = 123;
      const offset = 10;
      const limit = 20;
      const mockMessages = [{ id: 1 }];
      apiFetch.mockResolvedValue({ ok: true, json: async () => mockMessages });
      const result = await chatService.fetchMessages(chatId, offset, limit);
      expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining(`/${chatId}/messages?offset=${offset}&limit=${limit}`));
      expect(result).toEqual(mockMessages);
    });

    it('getParticipants вызывает apiFetch', async () => {
      const chatId = 123;
      const mockParticipants = [{ user_id: 1 }];
      apiFetch.mockResolvedValue({ ok: true, json: async () => mockParticipants });
      const result = await chatService.getParticipants(chatId);
      expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining(`/${chatId}/participants`));
      expect(result).toEqual(mockParticipants);
    });

    it('createPrivateChat отправляет POST', async () => {
      const otherUserId = 456;
      const mockResponse = { chatId: 789 };
      apiFetch.mockResolvedValue({ ok: true, json: async () => mockResponse });
      const result = await chatService.createPrivateChat(otherUserId);
      expect(apiFetch).toHaveBeenCalledWith(
        expect.stringContaining('/private'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otherUserId: String(otherUserId) }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('createGroupChat отправляет POST', async () => {
      const payload = { nazvanie: 'Group', opisanie: '', userIds: [1, 2] };
      apiFetch.mockResolvedValue({ ok: true, json: async () => ({ chatId: 999 }) });
      const result = await chatService.createGroupChat(payload);
      expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining('/group'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      expect(result.chatId).toBe(999);
    });

    it('deleteMessage отправляет DELETE', async () => {
      const messageId = 111;
      apiFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
      await chatService.deleteMessage(messageId);
      expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining(`/messages/${messageId}`), { method: 'DELETE' });
    });

    it('uploadFile отправляет FormData', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const postId = 123;
      const mockData = { fileId: 456, fileName: 'test.txt' };
      apiFetch.mockResolvedValue({ ok: true, json: async () => mockData });
      const result = await chatService.uploadFile(file, postId);
      expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining('/upload'), {
        method: 'POST',
        body: expect.any(FormData),
      });
      expect(result).toEqual(mockData);
    });

    it('uploadChatPhoto отправляет FormData', async () => {
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
      const chatId = 123;
      const mockData = { fileId: 789 };
      apiFetch.mockResolvedValue({ ok: true, json: async () => mockData });
      const result = await chatService.uploadChatPhoto(chatId, file);
      expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining('/chat-photo'), {
        method: 'POST',
        body: expect.any(FormData),
      });
      expect(result).toEqual(mockData);
    });

    it('uploadAvatar отправляет FormData', async () => {
      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockData = { fileId: 111, avatarUrl: '/api/File/avatar/111' };
      apiFetch.mockResolvedValue({ ok: true, json: async () => mockData });
      const result = await chatService.uploadAvatar(file);
      expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining('/avatar'), {
        method: 'POST',
        body: expect.any(FormData),
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('SignalR методы', () => {
    it('connect вызывает построение соединения', async () => {
      const onMessage = vi.fn();
      const onHistory = vi.fn();
      const result = await chatService.connect(onMessage, onHistory, vi.fn(), vi.fn(), vi.fn(), vi.fn());
      expect(result).toBe(true);
      expect(chatService.connection).toBeDefined();
      expect(chatService.connection.start).toHaveBeenCalled();
    });

    it('joinChat вызывает invoke если соединение активно', async () => {
      await chatService.connect(vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn());
      const chatId = 123;
      await chatService.joinChat(chatId);
      expect(chatService.connection.invoke).toHaveBeenCalledWith('JoinChat', chatId);
    });

    it('sendMessage вызывает invoke если соединение активно', async () => {
      await chatService.connect(vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn());
      const chatId = 123;
      const content = 'Hello';
      const replyToId = null;
      const contentType = 'text';
      await chatService.sendMessage(chatId, content, replyToId, contentType);
      expect(chatService.connection.invoke).toHaveBeenCalledWith('SendMessage', {
        ChatId: chatId,
        Content: content,
        ReplyToId: replyToId,
        ContentType: contentType,
      });
    });

    it('addReaction вызывает invoke', async () => {
      await chatService.connect(vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn());
      const messageId = 1;
      const emoji = '❤️';
      await chatService.addReaction(messageId, emoji);
      expect(chatService.connection.invoke).toHaveBeenCalledWith('AddReaction', String(messageId), emoji);
    });
  });
});