import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth";
import CreateChatModal from "./CreateChatModal";
import { useSettings } from "../context/SettingsContext";

function getLastMessagePreview(chat) {
  const value = chat?.last_message;

  if (!value) return "Нет сообщений";

  try {
    const parsed = JSON.parse(value);

    if (parsed?.fileType?.startsWith("image/")) {
      return parsed.caption ? `📷 ${parsed.caption}` : "📷 Фотография";
    }

    if (parsed?.fileName) {
      return `📎 ${parsed.fileName}`;
    }
  } catch {
    // обычный текст
  }

  if (String(value).length > 34) {
    return `${String(value).slice(0, 34)}...`;
  }

  return value;
}

export default function Sidebar({
  chats = [],
  activeChatId,
  onSelectChat,
  onChatCreated,
}) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <aside
      style={{
        width: 260,
        height: "100vh",
        minHeight: "100vh",
        background: "#3C4768",
        color: "#FFFFFF",
        padding: 20,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "6px 2px 14px",
          }}
        >
          <div
            style={{
              fontSize: 38,
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "-1px",
              userSelect: "none",
            }}
          >
            ТЧК
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            width: "100%",
            padding: "12px",
            background: "#536186",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: 700,
            boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
          }}
        >
          + Новый чат
        </button>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginTop: 18,
          paddingRight: 4,
          scrollbarWidth: "thin",
        }}
      >
        {chats.length === 0 ? (
          <div
            style={{
              color: "#B0C4DE",
              fontSize: 14,
              textAlign: "center",
              marginTop: 20,
            }}
          >
            Пока нет чатов
          </div>
        ) : (
          chats.map((chat) => {
            const chatId = chat.chat_id;
            const isActive = Number(chatId) === Number(activeChatId);
            const title = chat.display_name || chat.nazvanie || "Чат";
            const preview = getLastMessagePreview(chat);

            return (
              <div
                key={chatId}
                onClick={() => onSelectChat(chatId)}
                style={{
                  background: isActive ? "#46527A" : "transparent",
                  borderRadius: 14,
                  padding: 14,
                  position: "relative",
                  cursor: "pointer",
                  overflow: "hidden",
                  flexShrink: 0,
                  transition: "0.2s ease",
                }}
              >
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      left: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 4,
                      height: 28,
                      borderRadius: 4,
                      background: "#B0C4DE",
                    }}
                  />
                )}

                <div style={{ marginLeft: isActive ? 12 : 0 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#FFFFFF",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {title}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#B0C4DE",
                      marginTop: 4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {preview}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div
        style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          paddingTop: 16,
          marginTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div
          onClick={() => navigate("/users")}
          style={{
            color: "#DCE3F2",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Пользователи
        </div>

        <div
          onClick={() => navigate("/settings")}
          style={{
            color: "#DCE3F2",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Настройки
        </div>

        <div
          onClick={handleLogout}
          style={{
            color: "#DCE3F2",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Выйти
        </div>
      </div>

      {showCreateModal && (
        <CreateChatModal
          onClose={() => setShowCreateModal(false)}
          onChatCreated={onChatCreated}
        />
      )}
    </aside>
  );
}