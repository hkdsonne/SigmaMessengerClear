import { useEffect, useMemo, useState } from "react";
import chatService from "../services/chatService";
import { getCurrentUser } from "../services/auth";
import Avatar from "./Avatar";
import { apiFetch } from "../services/apiFetch";

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_IP + "/api/User";

function getUserId(user) {
  return String(user?.user_id || user?.id || user?.userId || "");
}

export default function CreateChatModal({ onClose, onChatCreated }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [groupName, setGroupName] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const me = await getCurrentUser();
      const meData = me?.data || me;
      setCurrentUser(meData);

      const res = await apiFetch(`${USER_SERVICE_URL}/list`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Не удалось загрузить список пользователей");
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.data || [];

      const myId = getUserId(meData);

      const filtered = list.filter((user) => {
        const userId = getUserId(user);
        return userId && userId !== myId;
      });

      setUsers(filtered);
    } catch (err) {
      console.error("CreateChatModal users error:", err);
      setError("Не удалось загрузить список пользователей");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return users;

    return users.filter((user) => {
      const username = String(user.username || "").toLowerCase();
      const fullName = String(user.full_name || "").toLowerCase();
      const bio = String(user.bio || "").toLowerCase();

      return username.includes(q) || fullName.includes(q) || bio.includes(q);
    });
  }, [users, search]);

  function toggleUser(user) {
    const userId = getUserId(user);

    if (!userId) return;

    setSelectedUsers((prev) => {
      const exists = prev.some((item) => getUserId(item) === userId);

      if (exists) {
        return prev.filter((item) => getUserId(item) !== userId);
      }

      return [...prev, user];
    });
  }

  async function handleCreate() {
    if (selectedUsers.length === 0 || creating) return;

    setCreating(true);
    setError("");

    try {
      let result;

      if (selectedUsers.length === 1) {
        const otherUserId = getUserId(selectedUsers[0]);

        result = await chatService.createPrivateChat(otherUserId);
      } else {
        const selectedUserIds = selectedUsers.map((user) => getUserId(user));

        result = await chatService.createGroupChat({
          nazvanie:
            groupName.trim() ||
            selectedUsers
              .map((user) => user.username || user.full_name || "Пользователь")
              .join(", "),
          opisanie: "",
          userIds: selectedUserIds,
        });
      }

      const chatId =
        result?.chatId ||
        result?.chat_id ||
        result?.data?.chatId ||
        result?.data?.chat_id;

      if (chatId && onChatCreated) {
        await onChatCreated(chatId);
      }

      onClose();
    } catch (err) {
      console.error("Create chat error:", err);
      setError(err?.message || "Не удалось создать чат");
    } finally {
      setCreating(false);
    }
  }

  const isGroup = selectedUsers.length > 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(31,39,64,0.28)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: 560,
          maxWidth: "92vw",
          background: "#FFFFFF",
          borderRadius: 26,
          padding: 28,
          boxShadow: "0 24px 80px rgba(31,39,64,0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 22, color: "#1F2740" }}>
            Новый чат
          </h3>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 24,
              cursor: "pointer",
              color: "#1F2740",
            }}
          >
            ×
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Найти пользователя по имени"
          style={inputStyle}
        />

        {isGroup && (
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Название группового чата"
            style={{ ...inputStyle, marginTop: 12 }}
          />
        )}

        {error && (
          <div style={{ color: "#D94A4A", marginTop: 14, fontSize: 14 }}>
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            maxHeight: 330,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            paddingRight: 4,
          }}
        >
          {loading ? (
            <div style={emptyStyle}>Галчонок ищет с кем вам поговорить</div>
          ) : filteredUsers.length === 0 ? (
            <div style={emptyStyle}>Пользователи не найдены</div>
          ) : (
            filteredUsers.map((user) => {
              const userId = getUserId(user);
              const selected = selectedUsers.some(
                (item) => getUserId(item) === userId
              );

              const name = user.username || user.full_name || "Пользователь";

              return (
                <div
                  key={userId}
                  onClick={() => toggleUser(user)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    borderRadius: 16,
                    border: selected
                      ? "2px solid #536186"
                      : "1px solid #E0E4EE",
                    background: selected ? "#F1F4FA" : "#FFFFFF",
                    cursor: "pointer",
                    transition: "0.18s ease",
                    boxShadow: selected
                      ? "0 10px 24px rgba(83,97,134,0.14)"
                      : "none",
                  }}
                >
                  <Avatar src={user.avatar_url} size={46} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        color: "#1F2740",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {name}
                    </div>

                    <div
                      style={{
                        color: "#8C94A8",
                        fontSize: 13,
                        marginTop: 3,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {user.bio || "Нет описания"}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 26,
                      height: 26,
                      minWidth: 26,
                      borderRadius: "50%",
                      background: selected ? "#536186" : "#FFFFFF",
                      border: selected ? "none" : "1px solid #D6DDEC",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: 15,
                    }}
                  >
                    {selected ? "✓" : ""}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={creating || selectedUsers.length === 0}
          style={{
            width: "100%",
            height: 48,
            marginTop: 18,
            borderRadius: 14,
            border: "none",
            background:
              creating || selectedUsers.length === 0 ? "#B0C4DE" : "#536186",
            color: "#FFFFFF",
            fontWeight: 800,
            fontSize: 16,
            cursor:
              creating || selectedUsers.length === 0
                ? "not-allowed"
                : "pointer",
          }}
        >
          {creating
            ? "Создание..."
            : selectedUsers.length > 1
            ? "Создать групповой чат"
            : "Создать чат"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  height: 46,
  borderRadius: 14,
  border: "1px solid #E0E4EE",
  padding: "0 14px",
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
};

const emptyStyle = {
  textAlign: "center",
  padding: 24,
  color: "#8C94A8",
};