import * as signalR from "@microsoft/signalr";
import { apiFetch } from "./apiFetch";

const CHAT_BASE_URL = import.meta.env.VITE_CHATS_SERVICE_IP;
const FILE_BASE_URL = import.meta.env.VITE_FILE_SERVICE_IP;

const API_BASE = `${CHAT_BASE_URL}/api/Chat`;
const WS_URL = `${CHAT_BASE_URL}/chatHub`;
const FILE_API_BASE = `${FILE_BASE_URL}/api/File`;

function getUploadErrorMessage(data, fallback = "Ошибка загрузки файла") {
  const serverError = data?.error || data?.message || "";

  if (
    serverError.includes("тип файла") ||
    serverError.includes("расширение") ||
    serverError.includes("Недопустимое имя")
  ) {
    return "Упс, такой формат нельзя отправить 😢";
  }

  if (serverError.includes("слишком большой")) {
    return "Файл слишком большой 😥";
  }

  if (serverError.includes("ZIP-бомба") || serverError.includes("подозрительное")) {
    return "Подозрительный архив заблокирован ⚠️";
  }

  if (serverError.includes("лимит")) {
    return serverError;
  }

  return serverError || fallback;
}

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

class ChatService {
  constructor() {
    this.connection = null;
  }

  async connect(
    onMessage,
    onHistory,
    onReactionAdded,
    onReactionRemoved,
    onRoleChanged,
    onMessageDeleted
  ) {
    if (
      this.connection &&
      this.connection.state === signalR.HubConnectionState.Connected
    ) {
      return true;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(WS_URL, { withCredentials: true })
      .withAutomaticReconnect()
      .build();

    this.connection.on("ReceiveMessage", onMessage);
    this.connection.on("ReceiveHistory", onHistory);
    this.connection.on("ReactionAdded", onReactionAdded);
    this.connection.on("ReactionRemoved", onReactionRemoved);
    this.connection.on("ParticipantRoleChanged", onRoleChanged);
    this.connection.on("MessageDeleted", onMessageDeleted);

    try {
      await this.connection.start();
      return true;
    } catch (err) {
      console.error("SignalR connection failed:", err);
      return false;
    }
  }

  async joinChat(chatId) {
    if (
      !this.connection ||
      this.connection.state !== signalR.HubConnectionState.Connected
    ) {
      return;
    }

    await this.connection.invoke("JoinChat", chatId);
  }

  async sendMessage(chatId, content, replyToId = null, contentType = "text") {
    if (
      !this.connection ||
      this.connection.state !== signalR.HubConnectionState.Connected
    ) {
      throw new Error("SignalR is not connected");
    }

    await this.connection.invoke("SendMessage", {
      ChatId: chatId,
      Content: content,
      ReplyToId: replyToId,
      ContentType: contentType,
    });
  }

  async fetchMyChats() {
    const res = await apiFetch(`${API_BASE}/my`);

    if (!res.ok) {
      throw new Error("Failed to fetch chats");
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.data || [];
  }

  async fetchMessages(chatId, offset = 0, limit = 50) {
    const res = await apiFetch(
      `${API_BASE}/${chatId}/messages?offset=${offset}&limit=${limit}`
    );

    if (!res.ok) {
      throw new Error("Failed to fetch messages");
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.data || [];
  }

  async getParticipants(chatId) {
    const res = await apiFetch(`${API_BASE}/${chatId}/participants`);

    if (!res.ok) {
      throw new Error("Failed to fetch participants");
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.data || [];
  }

  async createPrivateChat(otherUserId) {
  const res = await apiFetch(`${API_BASE}/private`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      otherUserId: String(otherUserId),
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    console.error("Create private chat failed:", res.status, errorText);
    throw new Error("Не удалось создать личный чат");
  }

  return res.json();
}

  async createGroupChat({ nazvanie, opisanie, userIds }) {
    const res = await apiFetch(`${API_BASE}/group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nazvanie, opisanie, userIds }),
    });

    if (!res.ok) {
      throw new Error("Failed to create group chat");
    }

    return res.json();
  }

  async deleteMessage(messageId) {
    const res = await apiFetch(`${API_BASE}/messages/${messageId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete message");
    }

    return res.json();
  }

async addReaction(messageId, emoji) {
  if (
    !this.connection ||
    this.connection.state !== signalR.HubConnectionState.Connected
  ) {
    return;
  }

  await this.connection.invoke("AddReaction", String(messageId), emoji);
}

async removeReaction(messageId, emoji) {
  if (
    !this.connection ||
    this.connection.state !== signalR.HubConnectionState.Connected
  ) {
    return;
  }

  await this.connection.invoke("RemoveReaction", String(messageId), emoji);
}

  async uploadFile(file, postId = 0) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("postId", postId);

    const res = await apiFetch(`${FILE_API_BASE}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
      throw new Error(getUploadErrorMessage(data, "Ошибка загрузки файла"));
    }

    if (data?.success === false) {
      throw new Error(getUploadErrorMessage(data, "Ошибка загрузки файла"));
    }

    if (!data?.fileId) {
      throw new Error("FileService не вернул fileId");
    }

    return data;
  }

  async uploadChatPhoto(chatId, file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", chatId);

    const res = await apiFetch(`${FILE_API_BASE}/chat-photo`, {
      method: "POST",
      body: formData,
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
      throw new Error(getUploadErrorMessage(data, "Ошибка загрузки фото"));
    }

    if (data?.success === false) {
      throw new Error(getUploadErrorMessage(data, "Ошибка загрузки фото"));
    }

    if (!data?.fileId) {
      throw new Error("FileService не вернул fileId");
    }

    return data;
  }

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiFetch(`${FILE_API_BASE}/avatar`, {
      method: "POST",
      body: formData,
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
      throw new Error(getUploadErrorMessage(data, "Не удалось загрузить аватарку"));
    }

    if (data?.success === false) {
      throw new Error(getUploadErrorMessage(data, "Не удалось загрузить аватарку"));
    }

    if (!data?.fileId && !data?.avatarUrl) {
      throw new Error("FileService не вернул аватарку");
    }

    return data;
  }
}

export default new ChatService();
