import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import { getCurrentUser } from "../services/auth";
import chatService from "../services/chatService";
import { getUsersList } from "../services/userService";

import LoadingCard from "../components/LoadingCard";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [startingChatId, setStartingChatId] = useState(null);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const me = await getCurrentUser();
        const meData = me?.data || me;
        setCurrentUser(meData);

        const list = await getUsersList();
        setUsers(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error(err);
        setError("Не удалось загрузить пользователей");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users
      .filter((u) => Number(u.user_id) !== Number(currentUser?.user_id))
      .filter((u) => {
        if (!query) return true;

        const username = String(u.username || "").toLowerCase();
        const fullName = String(u.full_name || "").toLowerCase();
        const bio = String(u.bio || "").toLowerCase();

        return (
          username.includes(query) ||
          fullName.includes(query) ||
          bio.includes(query)
        );
      });
  }, [users, currentUser, search]);

  async function startChatWith(user) {
    setStartingChatId(user.user_id);
    setError("");

    try {
      const result = await chatService.createPrivateChat(user.user_id);
      const chatId = result?.chatId || result?.data?.chatId;

      if (chatId) {
        navigate("/chat");
      } else {
        setError("Чат создан, но сервер не вернул chatId");
      }
    } catch (err) {
      console.error(err);
      setError("Не удалось создать чат");
    } finally {
      setStartingChatId(null);
    }
  }

  if (loading) return <LoadingCard text="Галчонок ищет с кем вам поговорить" />;

  return (
    <div style={{ padding: 40, background: "#F5F7FB", minHeight: "100vh" }}>
      <button onClick={() => navigate("/chat")} style={backButtonStyle}>
        ← Вернуться в чат
      </button>

      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Пользователи</h2>
          <div style={{ color: "#8C94A8", marginTop: 6 }}>
            Выберите пользователя, чтобы открыть профиль или начать диалог.
          </div>
        </div>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск пользователя по имени"
        style={searchInputStyle}
      />

      <div style={{ display: "grid", gap: 16, maxWidth: 820 }}>
        {filteredUsers.length === 0 ? (
          <div style={emptyStyle}>Пользователи не найдены</div>
        ) : (
          filteredUsers.map((user) => {
            const username = user.username || user.full_name || "Пользователь";
            const encodedUsername = encodeURIComponent(username);

            return (
              <div key={user.user_id} style={cardStyle}>
                <Avatar src={user.avatar_url} size={58} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1F2740" }}>
                    {username}
                  </div>

                  <div style={{ marginTop: 4, color: "#5F6B85", fontSize: 14 }}>
                    {user.bio || "Нет описания"}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/profile/${encodedUsername}`)}
                  style={secondaryButtonStyle}
                >
                  Профиль
                </button>

                <button
                  onClick={() => startChatWith(user)}
                  disabled={startingChatId === user.user_id}
                  style={{
                    ...primaryButtonStyle,
                    opacity: startingChatId === user.user_id ? 0.7 : 1,
                    cursor:
                      startingChatId === user.user_id ? "not-allowed" : "pointer",
                  }}
                >
                  {startingChatId === user.user_id ? "Создание..." : "Написать"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const backButtonStyle = {
  marginBottom: 20,
  height: 42,
  padding: "0 18px",
  borderRadius: 12,
  border: "1px solid #E0E4EE",
  background: "#FFFFFF",
  color: "#536186",
  fontWeight: 700,
  cursor: "pointer",
};

const headerStyle = {
  marginBottom: 22,
};

const searchInputStyle = {
  width: "100%",
  maxWidth: 820,
  height: 48,
  borderRadius: 14,
  border: "1px solid #E0E4EE",
  background: "#FFFFFF",
  padding: "0 16px",
  fontSize: 14,
  outline: "none",
  marginBottom: 18,
};

const cardStyle = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  padding: 18,
  borderRadius: 18,
  background: "#FFFFFF",
  border: "1px solid #E0E4EE",
  boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
};

const primaryButtonStyle = {
  height: 42,
  padding: "0 18px",
  borderRadius: 12,
  border: "none",
  background: "#536186",
  color: "#FFFFFF",
  fontWeight: 700,
};

const secondaryButtonStyle = {
  height: 42,
  padding: "0 18px",
  borderRadius: 12,
  border: "1px solid #DCE3F2",
  background: "#FFFFFF",
  color: "#536186",
  fontWeight: 700,
  cursor: "pointer",
};

const errorStyle = {
  background: "#FFEAEA",
  color: "#D64545",
  padding: 12,
  borderRadius: 12,
  marginBottom: 16,
  maxWidth: 820,
};

const emptyStyle = {
  background: "#FFFFFF",
  border: "1px solid #E0E4EE",
  borderRadius: 18,
  padding: 24,
  color: "#8C94A8",
  textAlign: "center",
};