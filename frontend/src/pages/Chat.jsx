import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import MessageBubble from "../components/MessageBubble";
import ChatInput from "../components/ChatInput";
import ParticipantList from "../components/ParticipantList";

import { useSettings } from "../context/SettingsContext";
import chatService from "../services/chatService";
import { getCurrentUser } from "../services/auth";
import { apiFetch } from "../services/apiFetch";
import LoadingCard from "../components/LoadingCard";

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_IP + "/api/User";

function normalizeId(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function sameId(a, b) {
  return normalizeId(a) === normalizeId(b);
}

function getMessageTextForReply(message) {
  if (!message) return "";

  if (message.content_type === "image") return "Изображение";

  if (message.content_type === "file") {
    try {
      const file = JSON.parse(message.content);
      return file.fileName || "Файл";
    } catch {
      return "Файл";
    }
  }

  return message.content || "";
}

export default function Chat() {
  const { settings, updateSetting } = useSettings();
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [isConnected, setIsConnected] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("member");

  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesEndRef = useRef(null);
  const activeChatIdRef = useRef(null);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  async function loadMyProfile() {
    try {
      const res = await apiFetch(`${USER_SERVICE_URL}/me`, {
        credentials: "include",
      });

      if (!res.ok) return;

      const data = await res.json();
      const profile = data?.data || data;

      const avatarUrl = profile.avatar_url
        ? `${profile.avatar_url}${profile.avatar_url.includes("?") ? "&" : "?"}v=${Date.now()}`
        : null;

      updateSetting("userName", profile.full_name || profile.username || "Пользователь");
      updateSetting("avatar", avatarUrl);
      updateSetting("email", profile.email || "");
    } catch (err) {
      console.error("loadMyProfile error:", err);
    }
  }

  async function normalizeChats(rawChats) {
    return rawChats.map((chat) => {
      let displayName = chat.nazvanie || "Чат";

      if (chat.tip === "global") displayName = chat.nazvanie || "Общий чат";
      if (chat.tip === "private") displayName = chat.nazvanie || "Личный чат";
      if (chat.tip === "group") displayName = chat.nazvanie || "Групповой чат";

      return {
        ...chat,
        display_name: displayName,
      };
    });
  }

  async function loadChats() {
    try {
      const rawChats = await chatService.fetchMyChats();
      const normalized = await normalizeChats(rawChats);
      setChats(normalized);
    } catch (err) {
      console.error("loadChats error:", err);
      setError("Не удалось загрузить список чатов");
    }
  }

  function selectChat(chatId) {
    if (!chatId || chatId === "00000000-0000-0000-0000-000000000000") return;
    setError("");
    setActiveChatId(chatId);
  }

  async function loadMessages(chatId) {
    if (!chatId || chatId === "00000000-0000-0000-0000-000000000000") return;

    setMessagesLoading(true);
    setError("");

    try {
      const data = await chatService.fetchMessages(chatId, 0, 50);
      const sorted = [...data].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );

      setMessages(sorted);
      setHasMore(data.length === 50);
    } catch (err) {
      console.error("loadMessages error:", err);
      setError("Галчонку не удалось найти ваши письма");
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }

  async function loadCurrentUserRole(chatId) {
    if (!chatId || !currentUser || chatId === "00000000-0000-0000-0000-000000000000") return;

    try {
      const participants = await chatService.getParticipants(chatId);
      const me = participants.find((participant) =>
  sameId(participant.user_id, currentUser.user_id || currentUser.id)
);

      if (me) setCurrentUserRole(me.rol || "member");
    } catch (err) {
      console.error("Failed to load user role:", err);
    }
  }

  async function loadMoreMessages() {
    if (loadingMore || !hasMore || !activeChatId) return;

    setLoadingMore(true);

    try {
      const offset = messages.length;
      const data = await chatService.fetchMessages(activeChatId, offset, 20);

      if (data.length === 0) {
        setHasMore(false);
      } else {
        const sortedNew = [...data].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );

        setMessages((prev) => [...sortedNew, ...prev]);

        if (data.length < 20) setHasMore(false);
      }
    } catch (err) {
      console.error("loadMore error:", err);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleScroll(e) {
    if (e.currentTarget.scrollTop === 0 && !loadingMore && hasMore && !messagesLoading) {
      loadMoreMessages();
    }
  }

  const handleReceiveMessage = (message) => {
    if (!message) return;

    const msgChatId = message.chat_id ?? message.chatId ?? message.ChatId;
    const msgId = message.id ?? message.message_id ?? message.messageId;

    if (sameId(msgChatId, activeChatIdRef.current)) {
  setMessages((prev) => {
    const msgId = message.id ?? message.message_id ?? message.messageId;

    if (prev.some((m) => sameId(m.id, msgId))) return prev;

    return [
      ...prev,
      {
        ...message,
        id: msgId,
        chat_id: msgChatId,
        content_type: message.content_type || message.contentType || "text",
      },
    ];
  });
}

    loadChats();
  };

  function handleReceiveHistory(history) {
    const sorted = [...history].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    setMessages(sorted);
  }

  function handleReactionAdded(data) {
  setMessages((prev) =>
    prev.map((msg) =>
      sameId(msg.id, data.messageId)
        ? {
            ...msg,
            reactions: [
              ...(msg.reactions || []).filter(
                (r) => !sameId(r.user_id, data.userId)
              ),
              { user_id: data.userId, tip: data.tip },
            ],
          }
        : msg
    )
  );
}

  function handleReactionRemoved(data) {
  setMessages((prev) =>
    prev.map((msg) =>
      sameId(msg.id, data.messageId)
        ? {
            ...msg,
            reactions: (msg.reactions || []).filter(
              (r) => !(sameId(r.user_id, data.userId) && r.tip === data.tip)
            ),
          }
        : msg
    )
  );
}

  function handleRoleChanged(data) {
    if (
      String(activeChatIdRef.current) === String(data.chatId) &&
      String(data.user_id) === String(currentUser?.user_id)
    ) {
      setCurrentUserRole(data.rol);
    }
  }

  function handleMessageDeleted(data) {
    setMessages((prev) =>
      prev.map((msg) =>
        String(msg.id) === String(data.messageId)
          ? { ...msg, is_deleted: true, content: "[Сообщение удалено]" }
          : msg
      )
    );
  }

  async function handleDeleteMessage(messageId) {
    await chatService.deleteMessage(messageId);

    setMessages((prev) =>
      prev.map((msg) =>
        String(msg.id) === String(messageId)
          ? { ...msg, is_deleted: true, content: "[Сообщение удалено]" }
          : msg
      )
    );
  }

  async function handleSendMessage(text, replyToId = null, file = null) {
    const messageText = text?.trim() || "";

    if ((!messageText && !file) || !activeChatId || sending) return;

    setSending(true);
    setError("");
    setUploadError("");

    try {
      if (file) {
        const isImage = file.type.startsWith("image/");
        let uploadResult = null;

        if (isImage) {
          uploadResult = await chatService.uploadChatPhoto(activeChatId, file);
        } else {
          uploadResult = await chatService.uploadFile(file, activeChatId);
        }

        const fileId = uploadResult?.fileId || uploadResult?.id;

        if (!fileId) {
          throw new Error("FileService не вернул fileId");
        }

        const attachment = {
          fileId,
          fileName: uploadResult.fileName || file.name,
          fileSize: uploadResult.fileSize || String(file.size),
          fileType: uploadResult.fileType || file.type,
          embedUrl: `${import.meta.env.VITE_FILE_SERVICE_IP}/api/File/thumbnail/${fileId}`,
          originalUrl: `${import.meta.env.VITE_FILE_SERVICE_IP}/api/File/download/${fileId}`,
          downloadUrl: `${import.meta.env.VITE_FILE_SERVICE_IP}/api/File/download/${fileId}`,
          caption: messageText,
        };

        await chatService.sendMessage(
          activeChatId,
          JSON.stringify(attachment),
          replyToId,
          isImage ? "image" : "file"
        );
      } else {
        await chatService.sendMessage(activeChatId, messageText, replyToId, "text");
      }

      setReplyTo(null);

      setTimeout(async () => {
        await loadMessages(activeChatId);
        await loadChats();
      }, 400);
    } catch (err) {
      console.error("Send error:", err);

      const message = err?.message || "Не удалось отправить сообщение";

      setError("");
      setUploadError(message);

      setTimeout(() => {
        setUploadError("");
      }, 3500);
    } finally {
      setSending(false);
    }
  }

  function isOwnMessage(msg) {
  const myId = currentUser?.user_id || currentUser?.id;
  return sameId(msg.sender_id, myId);
}

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError("");

      try {
        const user = await getCurrentUser();
        const userData = user?.data || user;

        if (!cancelled) setCurrentUser(userData);

        await loadMyProfile();
        await loadChats();

        const connected = await chatService.connect(
          handleReceiveMessage,
          handleReceiveHistory,
          handleReactionAdded,
          handleReactionRemoved,
          handleRoleChanged,
          handleMessageDeleted
        );

        if (!cancelled) setIsConnected(connected);
      } catch (err) {
        console.error("Chat init error:", err);

        if (!cancelled) setError("Не удалось загрузить чат");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  // Исправленный useEffect для загрузки сообщений при смене чата
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      setCurrentUserRole("member");
      return;
    }

    if (activeChatId === "00000000-0000-0000-0000-000000000000") {
      setMessages([]);
      setCurrentUserRole("member");
      return;
    }

    // Сначала очищаем сообщения
    setMessages([]);
    
    // Загружаем новые
    loadMessages(activeChatId);
    loadCurrentUserRole(activeChatId);

    // Присоединяемся к чату через SignalR только если соединение установлено
    if (isConnected && activeChatId) {
      chatService.joinChat(activeChatId);
    }
  }, [activeChatId, isConnected, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const messagesMap = messages.reduce((map, msg) => {
    map[msg.id] = msg;
    return map;
  }, {});

  const activeChat = chats.find(
  (chat) => sameId(chat.chat_id, activeChatId)
);

  const chatBackground =
    settings.chatBackground === "dark"
      ? "#DDE2EB"
      : settings.chatBackground === "gradient"
      ? "linear-gradient(180deg, #F5F7FB 0%, #E3E8F5 100%)"
      : "#F5F7FB";

  const messageFontSize =
    settings.textSize === "small" ? 14 : settings.textSize === "large" ? 18 : 16;

  if (loading) return <LoadingCard text="Галчонок летит в ваш почтовый ящик" />;

  return (
    <div
      style={{
        height: "100vh",
        background: chatBackground,
        display: "flex",
        position: "relative",
      }}
    >
      {uploadError && (
        <div
          style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "#FFF1F1",
            color: "#D94A4A",
            border: "1px solid #FFD6D6",
            borderRadius: 18,
            padding: "14px 22px",
            fontWeight: 800,
            boxShadow: "0 16px 40px rgba(217,74,74,0.18)",
          }}
        >
          {uploadError}
        </div>
      )}

      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={selectChat}
        onChatCreated={async (createdChatId) => {
          const rawChats = await chatService.fetchMyChats();
          const normalized = await normalizeChats(rawChats);

          setChats(normalized);
          setActiveChatId(createdChatId);
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 78,
            minHeight: 78,
            background: "#FFFFFF",
            borderBottom: "1px solid #E8ECF4",
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 24px",
            flexShrink: 0,
          }}
        >
          {activeChatId && activeChatId !== "00000000-0000-0000-0000-000000000000" && (
            <button
              type="button"
              onClick={() => setActiveChatId(null)}
              style={{
                border: "none",
                background: "#EEF2FA",
                color: "#536186",
                width: 40,
                height: 40,
                borderRadius: 12,
                cursor: "pointer",
                fontSize: 20,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ←
            </button>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#1F2740",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {activeChat?.display_name || "Чат"}
            </div>

            {activeChat?.tip === "private" && (
              <div
                style={{
                  fontSize: 13,
                  color: "#8C94A8",
                  marginTop: 2,
                }}
              >
                Личный диалог
              </div>
            )}

            {activeChat?.tip === "global" && (
              <div
                style={{
                  fontSize: 13,
                  color: "#8C94A8",
                  marginTop: 2,
                }}
              >
                Общий чат
              </div>
            )}
          </div>

          {(activeChat?.tip === "group" || activeChat?.tip === "global") && (
            <button
              type="button"
              onClick={() => setShowParticipants(true)}
              style={{
                border: "1px solid #E0E4EE",
                background: "#F7F9FD",
                color: "#536186",
                borderRadius: 12,
                width: 42,
                height: 42,
                cursor: "pointer",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Участники"
            >
              👥
            </button>
          )}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 24,
            position: "relative",
          }}
          onScroll={handleScroll}
        >
          {error && (
            <div
              style={{
                color: "#ff4444",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          {!activeChatId && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "42%",
                transform: "translate(-50%, -50%)",
                width: 420,
                maxWidth: "90%",
                background: "#FFFFFF",
                border: "1px solid #E0E4EE",
                borderRadius: 22,
                padding: "32px 28px",
                textAlign: "center",
                boxShadow: "0 18px 50px rgba(31,39,64,0.08)",
              }}
            >
              <div style={{ fontSize: 34, marginBottom: 14 }}>💬</div>

              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#1F2740",
                }}
              >
                Выберите чат
              </div>

              <div
                style={{
                  marginTop: 10,
                  color: "#8C94A8",
                  fontSize: 15,
                }}
              >
                Откройте существующий чат слева или создайте новый.
              </div>
            </div>
          )}

          {messagesLoading && activeChatId && (
            <div
              style={{
                color: "#8C94A8",
                textAlign: "center",
              }}
            >
              Галчонок ищет ваши письма
            </div>
          )}

          {!messagesLoading &&
            messages.map((msg, index) => (
              <MessageBubble
                key={`${msg.id}-${msg.created_at}-${index}`}
                message={msg}
                isOwn={isOwnMessage(msg)}
                currentUserId={currentUser?.user_id}
                onReply={(message) =>
                  setReplyTo({
                    ...message,
                    content: getMessageTextForReply(message),
                  })
                }
                onDelete={handleDeleteMessage}
                reactions={msg.reactions || []}
                replyContent={
                  msg.reply_to_id
                    ? getMessageTextForReply(messagesMap[msg.reply_to_id])
                    : null
                }
                fontSize={messageFontSize}
              />
            ))}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          onSend={handleSendMessage}
          disabled={!activeChatId || sending}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          sending={sending}
        />
      </div>

      {showParticipants && activeChatId && (
        <ParticipantList
          chatId={activeChatId}
          currentUserId={currentUser?.user_id}
          currentUserRole={currentUserRole}
          onClose={() => setShowParticipants(false)}
          onRoleChange={() => loadCurrentUserRole(activeChatId)}
        />
      )}
    </div>
  );
}