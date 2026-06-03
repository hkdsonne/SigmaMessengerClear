import { useEffect, useMemo, useState } from "react";
import Avatar from "./Avatar";
import chatService from "../services/chatService";
import { apiFetch } from "../services/apiFetch";

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_IP + "/api/User";

function normalizeId(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
}

function sameId(a, b) {
  return normalizeId(a) === normalizeId(b);
}

function getUserId(user) {
  return user?.user_id || user?.id || user?.userId || "";
}

export default function ParticipantList({
  chatId,
  currentUserId,
  currentUserRole,
  onClose,
}) {
  const [participants, setParticipants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (chatId) loadData();
  }, [chatId]);

  async function loadData() {
    setLoading(true);

    try {
      const participantsData = await chatService.getParticipants(chatId);

      const usersRes = await apiFetch(`${USER_SERVICE_URL}/list`, {
        credentials: "include",
      });

      if (!usersRes.ok) {
        throw new Error("Не удалось загрузить пользователей");
      }

      const usersJson = await usersRes.json();
      const usersData = Array.isArray(usersJson)
        ? usersJson
        : usersJson?.data || [];

      setParticipants(Array.isArray(participantsData) ? participantsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error("Participants load error:", err);
      setParticipants([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  const usersMap = useMemo(() => {
    const map = new Map();

    users.forEach((user) => {
      const id = normalizeId(getUserId(user));
      if (id) map.set(id, user);
    });

    return map;
  }, [users]);

  const preparedParticipants = useMemo(() => {
    return participants
      .map((participant) => {
        const participantId = participant.user_id || participant.userId || participant.id;
        const user = usersMap.get(normalizeId(participantId));

        return {
          ...participant,
          user_id: participantId,
          username:
            user?.username ||
            user?.full_name ||
            participant.username ||
            `User ${participantId}`,
          avatar_url: user?.avatar_url || participant.avatar_url || null,
          bio: user?.bio || participant.bio || "Пользователь ТЧК",
          rol: participant.rol || participant.role || "member",
        };
      })
      .filter((participant) => participant.user_id);
  }, [participants, usersMap]);

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>Участники чата</h2>
            <div style={subtitleStyle}>
              Всего участников: {preparedParticipants.length}
            </div>
          </div>

          <button
            onClick={onClose}
            style={closeButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F5F7FB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#FFFFFF";
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={emptyStyle}>Галчонок ищет участников</div>
        ) : preparedParticipants.length === 0 ? (
          <div style={emptyStyle}>Участники не найдены</div>
        ) : (
          <div style={listStyle}>
            {preparedParticipants.map((user) => {
              const isMe = sameId(user.user_id, currentUserId);
              const role = user.rol || "member";

              return (
                <div key={user.user_id} style={itemStyle}>
                  <Avatar src={user.avatar_url} name={user.username} size={46} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={nameStyle}>
                      {user.username}
                      {isMe && <span style={meBadgeStyle}>вы</span>}
                    </div>

                    <div style={bioStyle}>{user.bio || "Пользователь ТЧК"}</div>
                  </div>

                  <div
                    style={{
                      ...roleBadgeStyle,
                      background: role === "owner" ? "#EEF2FA" : "#F7F9FD",
                      color: role === "owner" ? "#536186" : "#8C94A8",
                    }}
                  >
                    {role === "owner" ? "Админ" : "Участник"}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentUserRole === "owner" && (
          <div style={adminNoteStyle}>Вы администратор этого чата</div>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(31, 39, 64, 0.28)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
};

const modalStyle = {
  width: 520,
  maxWidth: "92vw",
  maxHeight: "82vh",
  background: "#FFFFFF",
  borderRadius: 26,
  padding: 24,
  boxShadow: "0 24px 80px rgba(31,39,64,0.22)",
  overflow: "hidden",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
  gap: 16,
};

const titleStyle = {
  margin: 0,
  fontSize: 24,
  color: "#1F2740",
};

const subtitleStyle = {
  marginTop: 6,
  color: "#8C94A8",
  fontSize: 14,
};

const closeButtonStyle = {
  width: 42,
  height: 42,
  minWidth: 42,
  borderRadius: 14,
  border: "1px solid #E0E4EE",
  background: "#FFFFFF",
  color: "#536186",
  fontSize: 28,
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  marginTop: -2,
  transition: "0.2s ease",
  boxShadow: "0 4px 12px rgba(31,39,64,0.06)",
};

const listStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  maxHeight: 480,
  overflowY: "auto",
  paddingRight: 4,
};

const itemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: 14,
  borderRadius: 18,
  border: "1px solid #E0E4EE",
  background: "#F9FBFF",
};

const nameStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 16,
  fontWeight: 800,
  color: "#1F2740",
};

const bioStyle = {
  marginTop: 4,
  fontSize: 13,
  color: "#8C94A8",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const meBadgeStyle = {
  padding: "3px 8px",
  borderRadius: 999,
  background: "#EEF2FA",
  color: "#536186",
  fontSize: 12,
  fontWeight: 800,
};

const roleBadgeStyle = {
  padding: "7px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const emptyStyle = {
  padding: 30,
  textAlign: "center",
  color: "#8C94A8",
};

const adminNoteStyle = {
  marginTop: 16,
  padding: 12,
  borderRadius: 14,
  background: "#EEF2FA",
  color: "#536186",
  fontWeight: 800,
  textAlign: "center",
};