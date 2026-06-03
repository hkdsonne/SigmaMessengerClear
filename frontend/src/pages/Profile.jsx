import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import { getCurrentUser } from "../services/auth";
import { getMyProfile, getUserByUsername } from "../services/userService";

import LoadingCard from "../components/LoadingCard";

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const me = await getCurrentUser();
        const meData = me?.data || me;
        setCurrentUser(meData);

        let loadedProfile;

        if (!username || username === "me") {
          loadedProfile = await getMyProfile();
        } else {
          loadedProfile = await getUserByUsername(username);
        }

        setProfile(loadedProfile);
      } catch (err) {
        console.error("Profile load error:", err);
        setError("Не удалось загрузить профиль");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [username]);

  if (loading) return <LoadingCard text="Галчонок сканирует ваши госуслуги" />;

  if (error) {
    return (
      <div style={{ padding: 40, background: "#F5F7FB", minHeight: "100vh" }}>
        <button onClick={() => navigate("/chat")} style={backButtonStyle}>
          ← Вернуться в чат
        </button>

        <div style={errorCardStyle}>
          <h2 style={{ marginTop: 0 }}>Профиль не найден</h2>
          <p>{error}</p>

          <button onClick={() => navigate("/chat")} style={primaryButtonStyle}>
            Вернуться в чат
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: 40, background: "#F5F7FB", minHeight: "100vh" }}>
        <button onClick={() => navigate("/chat")} style={backButtonStyle}>
          ← Вернуться в чат
        </button>
        Пользователь не найден
      </div>
    );
  }

  const profileName =
    profile.full_name || profile.username || username || "Пользователь";

  const isMe =
    username === "me" ||
    Number(profile.user_id) === Number(currentUser?.user_id) ||
    profileName === currentUser?.username;

  return (
    <div style={{ padding: 40, background: "#F5F7FB", minHeight: "100vh" }}>
      <button onClick={() => navigate("/chat")} style={backButtonStyle}>
        ← Вернуться в чат
      </button>

      <h2 style={{ marginBottom: 24 }}>Профиль</h2>

      <div style={cardStyle}>
        <div style={topStyle}>
          <Avatar src={profile.avatar_url} size={96} />

          <div>
            <h3 style={{ margin: 0, fontSize: 26, color: "#1F2740" }}>
              {profileName}
            </h3>

            <div style={{ marginTop: 6, color: "#8C94A8", fontSize: 14 }}>
              {isMe ? "Это ваш профиль" : "Пользователь ТЧК"}
            </div>
          </div>
        </div>

        <div style={infoGridStyle}>
          

          <div style={infoItemStyle}>
            <span style={labelStyle}>О себе</span>
            <strong>{profile.bio || "Нет информации"}</strong>
          </div>

          {profile.last_activity_at && (
            <div style={infoItemStyle}>
              <span style={labelStyle}>Последняя активность</span>
              <strong>{new Date(profile.last_activity_at).toLocaleString()}</strong>
            </div>
          )}

          {isMe && profile.settings && (
            <>
              <div style={infoItemStyle}>
                <span style={labelStyle}>Уведомления</span>
                <strong>
                  {profile.settings.notifications_enabled ? "Включены" : "Выключены"}
                </strong>
              </div>

              <div style={infoItemStyle}>
                <span style={labelStyle}>Тема</span>
                <strong>{profile.settings.theme || "light"}</strong>
              </div>
            </>
          )}
        </div>

        {isMe && (
          <button
            onClick={() => navigate("/settings")}
            style={{ ...primaryButtonStyle, marginTop: 24 }}
          >
            Редактировать профиль
          </button>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  padding: 30,
  background: "#FFFFFF",
  borderRadius: 24,
  border: "1px solid #E0E4EE",
  maxWidth: 720,
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
};

const topStyle = {
  display: "flex",
  alignItems: "center",
  gap: 22,
  marginBottom: 28,
};

const infoGridStyle = {
  display: "grid",
  gap: 14,
};

const infoItemStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: 16,
  borderRadius: 16,
  background: "#F5F7FB",
  border: "1px solid #E0E4EE",
};

const labelStyle = {
  color: "#8C94A8",
  fontSize: 13,
};

const primaryButtonStyle = {
  height: 44,
  padding: "0 18px",
  borderRadius: 12,
  border: "none",
  background: "#536186",
  color: "#FFFFFF",
  fontWeight: 700,
  cursor: "pointer",
};

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

const errorCardStyle = {
  background: "#FFFFFF",
  borderRadius: 20,
  border: "1px solid #E0E4EE",
  padding: 28,
  maxWidth: 520,
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
};