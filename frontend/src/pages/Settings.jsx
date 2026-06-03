import { useEffect, useState } from "react";
import Avatar from "../components/Avatar";
import { useSettings } from "../context/SettingsContext";
import chatService from "../services/chatService";

import { apiFetch } from "../services/apiFetch";

import LoadingCard from "../components/LoadingCard";

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_IP + "/api/User";

export default function Settings() {
  const { settings, updateSetting } = useSettings();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [avatar, setAvatar] = useState(settings.avatar || null);
  const [fullName, setFullName] = useState(settings.userName || "");
  const [bio, setBio] = useState("");

  const [notifications, setNotifications] = useState(
    settings.notifications ?? true
  );

  const [chatBackground, setChatBackground] = useState(
    settings.chatBackground || "light"
  );

  const [textSize, setTextSize] = useState(settings.textSize || "medium");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const profileRes = await fetch(`${USER_SERVICE_URL}/me`, {
        credentials: "include",
      });

      if (profileRes.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const profile = profileData?.data || profileData;

        setFullName(profile.full_name || profile.username || "");
        setBio(profile.bio || "");
        setAvatar(profile.avatar_url || null);

        updateSetting("userName", profile.full_name || profile.username || "Пользователь");
        updateSetting("avatar", profile.avatar_url || null);
      }

      const settingsRes = await fetch(`${USER_SERVICE_URL}/me/settings`, {
        credentials: "include",
      });

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const serverSettings = settingsData?.data || settingsData;

        const notificationsValue =
          serverSettings.notifications_enabled ??
          serverSettings.notification_enabled ??
          true;

        setNotifications(notificationsValue);
        updateSetting("notifications", notificationsValue);
      }

      const savedBackground = localStorage.getItem("settings_chatBackground");
      const savedTextSize = localStorage.getItem("settings_textSize");

      if (savedBackground) {
        setChatBackground(savedBackground);
        updateSetting("chatBackground", savedBackground);
      }

      if (savedTextSize) {
        setTextSize(savedTextSize);
        updateSetting("textSize", savedTextSize);
      }
    } catch (err) {
      console.error("Settings load error:", err);
      setError("Не удалось загрузить настройки");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await apiFetch(`${USER_SERVICE_URL}/me/info`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          bio,
          avatar_url: avatar,
        }),
      });

      if (!res.ok) throw new Error("Не удалось сохранить профиль");

      updateSetting("userName", fullName || "Пользователь");
      updateSetting("avatar", avatar || null);

      setSuccess("Профиль сохранён");
      setTimeout(() => setSuccess(""), 1800);
    } catch (err) {
      console.error("Save profile error:", err);
      setError("Не удалось сохранить профиль");
    } finally {
      setSaving(false);
    }
  }

  async function saveNotifications(value) {
    setNotifications(value);
    updateSetting("notifications", value);
    setSuccess("");

    try {
      const res = await apiFetch(`${USER_SERVICE_URL}/me/settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification_enabled: value,
          notifications_enabled: value,
        }),
      });

      if (!res.ok) throw new Error("Не удалось сохранить уведомления");

      setSuccess("Настройки уведомлений сохранены");
      setTimeout(() => setSuccess(""), 1600);
    } catch (err) {
      console.error("Save notifications error:", err);
      setError("Не удалось сохранить уведомления");
    }
  }

  function saveLocalSetting(key, value) {
    if (key === "chatBackground") {
      setChatBackground(value);
      updateSetting("chatBackground", value);
      localStorage.setItem("settings_chatBackground", value);
    }

    if (key === "textSize") {
      setTextSize(value);
      updateSetting("textSize", value);
      localStorage.setItem("settings_textSize", value);
    }

    setSuccess("Настройки чата применены");
    setTimeout(() => setSuccess(""), 1600);
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Можно загрузить только изображение");
      return;
    }
    

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = await chatService.uploadAvatar(file);

      const avatarUrl = data.fileId
        ? `${import.meta.env.VITE_FILE_SERVICE_IP}/api/File/thumbnail/${data.fileId}`
        : data.avatarUrl;

      if (!avatarUrl) throw new Error("FileService не вернул avatarUrl");

      setAvatar(avatarUrl);
      updateSetting("avatar", avatarUrl);

      const res = await apiFetch(`${USER_SERVICE_URL}/me/info`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          bio,
          avatar_url: avatarUrl,
        }),
      });

      if (!res.ok) throw new Error("Не удалось сохранить аватар в профиле");

      setSuccess("Аватарка обновлена");
      setTimeout(() => setSuccess(""), 1800);
    } catch (err) {
      console.error("Avatar upload error:", err);
      setError("Не удалось обновить аватарку");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAvatar() {
    setAvatar(null);
    updateSetting("avatar", null);

    try {
      await apiFetch(`${USER_SERVICE_URL}/me/info`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          bio,
          avatar_url: null,
        }),
      });

      setSuccess("Аватарка удалена");
      setTimeout(() => setSuccess(""), 1600);
    } catch (err) {
      console.error("Delete avatar error:", err);
      setError("Не удалось удалить аватарку");
    }
  }

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={loaderCardStyle}>Галчонок ищет ваше досье</div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <button onClick={() => (window.location.href = "/chat")} style={backButtonStyle}>
        ← Вернуться в чат
      </button>

      <div style={heroStyle}>
        <div>
          <div style={badgeStyle}>ТЧК</div>
          <h1 style={h1Style}>Настройки</h1>
          <p style={subtitleStyle}>
            Управляйте профилем, уведомлениями и внешним видом чата.
          </p>
        </div>

        <div style={heroProfileStyle}>
          <Avatar src={avatar} name={fullName} size={62} />
          <div>
            <div style={heroNameStyle}>{fullName || "Пользователь"}</div>
            <div style={heroHintStyle}>Ваш аккаунт</div>
          </div>
        </div>
      </div>

      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      <div style={layoutStyle}>
        <section style={profileCardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Профиль</h2>
              <p style={sectionHintStyle}>Аватарка, имя и описание</p>
            </div>
          </div>

          <div style={avatarBlockStyle}>
            <div style={avatarFrameStyle}>
              <Avatar src={avatar} name={fullName} size={104} />
            </div>

            <div style={avatarButtonsStyle}>
              <label style={uploadButtonStyle}>
                Загрузить аватарку
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </label>

              <button type="button" onClick={deleteAvatar} style={deleteAvatarButtonStyle}>
                Удалить
              </button>
            </div>
          </div>

          <label style={labelStyle}>Имя пользователя</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Введите имя"
            style={inputStyle}
          />

          <label style={{ ...labelStyle, marginTop: 16 }}>О себе</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Расскажите немного о себе"
            maxLength={300}
            style={textareaStyle}
          />

          <button onClick={saveProfile} disabled={saving} style={saveButtonStyle}>
            {saving ? "Сохраняем..." : "Сохранить профиль"}
          </button>
        </section>

        <div style={rightColumnStyle}>
          <section style={notificationCardStyle}>
            <div style={iconBoxStyle}>🔔</div>

            <div style={{ flex: 1 }}>
              <h2 style={smallTitleStyle}>Уведомления</h2>
              <p style={smallHintStyle}>
                Получать уведомления о новых сообщениях.
              </p>
            </div>

            <label style={switchStyle}>
              <input
                type="checkbox"
                checked={notifications}
                onChange={() => saveNotifications(!notifications)}
                style={{ display: "none" }}
              />
              <span
                style={{
                  ...switchTrackStyle,
                  background: notifications ? "#536186" : "#D6DDEC",
                }}
              >
                <span
                  style={{
                    ...switchThumbStyle,
                    transform: notifications ? "translateX(22px)" : "translateX(0)",
                  }}
                />
              </span>
            </label>
          </section>

          <section style={chatCardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Чаты</h2>
                <p style={sectionHintStyle}>Фон и размер текста сообщений</p>
              </div>
            </div>

            <div style={settingRowStyle}>
              <div>
                <div style={settingNameStyle}>Фон чата</div>
                <div style={settingHintStyle}>Меняет фон области сообщений</div>
              </div>

              <select
                value={chatBackground}
                onChange={(e) => saveLocalSetting("chatBackground", e.target.value)}
                style={selectStyle}
              >
                <option value="light">Светлый</option>
                <option value="dark">Тёмный</option>
                <option value="gradient">Градиент</option>
              </select>
            </div>

            <div style={settingRowStyle}>
              <div>
                <div style={settingNameStyle}>Размер текста</div>
                <div style={settingHintStyle}>Меняет размер сообщений</div>
              </div>

              <select
                value={textSize}
                onChange={(e) => saveLocalSetting("textSize", e.target.value)}
                style={selectStyle}
              >
                <option value="small">Маленький</option>
                <option value="medium">Средний</option>
                <option value="large">Большой</option>
              </select>
            </div>

            <div style={previewStyle}>
              <div style={previewBubbleStyle}>
                Пример сообщения
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: "32px 40px 50px",
  boxSizing: "border-box",
  background:
    "radial-gradient(circle at top left, #EAF0FF 0, transparent 30%), linear-gradient(180deg, #F7F9FD 0%, #EEF2F8 100%)",
};

const loadingStyle = {
  minHeight: "100vh",
  background: "#F5F7FB",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const loaderCardStyle = {
  padding: "22px 28px",
  background: "#FFFFFF",
  border: "1px solid #E0E4EE",
  borderRadius: 20,
  color: "#536186",
  fontWeight: 800,
  boxShadow: "0 18px 45px rgba(31,39,64,0.08)",
};

const backButtonStyle = {
  height: 42,
  padding: "0 18px",
  borderRadius: 14,
  border: "1px solid #E0E4EE",
  background: "#FFFFFF",
  color: "#536186",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(31,39,64,0.06)",
  marginBottom: 22,
};

const heroStyle = {
  minHeight: 120,
  padding: 30,
  borderRadius: 32,
  background: "linear-gradient(135deg, #FFFFFF 0%, #F3F6FC 100%)",
  border: "1px solid #E0E4EE",
  boxShadow: "0 24px 70px rgba(31,39,64,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 24,
  marginBottom: 24,
};

const badgeStyle = {
  display: "inline-flex",
  padding: "6px 12px",
  borderRadius: 999,
  background: "#EEF2FA",
  color: "#536186",
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 10,
};

const h1Style = {
  margin: 0,
  fontSize: 36,
  color: "#1F2740",
  letterSpacing: "-0.7px",
};

const subtitleStyle = {
  margin: "8px 0 0",
  color: "#8C94A8",
  fontSize: 16,
};

const heroProfileStyle = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "13px 16px",
  background: "#FFFFFF",
  border: "1px solid #E0E4EE",
  borderRadius: 24,
  boxShadow: "0 14px 34px rgba(31,39,64,0.07)",
};

const heroNameStyle = {
  fontSize: 16,
  fontWeight: 900,
  color: "#1F2740",
};

const heroHintStyle = {
  marginTop: 3,
  fontSize: 13,
  color: "#8C94A8",
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "430px 1fr",
  gap: 24,
  alignItems: "start",
};

const profileCardStyle = {
  background: "#FFFFFF",
  border: "1px solid #E0E4EE",
  borderRadius: 30,
  padding: 28,
  boxShadow: "0 20px 55px rgba(31,39,64,0.08)",
};

const rightColumnStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 22,
};

const notificationCardStyle = {
  minHeight: 112,
  background: "#FFFFFF",
  border: "1px solid #E0E4EE",
  borderRadius: 28,
  padding: 24,
  display: "flex",
  alignItems: "center",
  gap: 18,
  boxShadow: "0 20px 55px rgba(31,39,64,0.07)",
};

const chatCardStyle = {
  background: "#FFFFFF",
  border: "1px solid #E0E4EE",
  borderRadius: 30,
  padding: 28,
  boxShadow: "0 20px 55px rgba(31,39,64,0.07)",
};

const sectionHeaderStyle = {
  marginBottom: 22,
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: 22,
  color: "#1F2740",
};

const sectionHintStyle = {
  margin: "5px 0 0",
  color: "#8C94A8",
  fontSize: 14,
};

const avatarBlockStyle = {
  display: "flex",
  alignItems: "center",
  gap: 22,
  marginBottom: 24,
};

const avatarFrameStyle = {
  padding: 7,
  borderRadius: 32,
  background: "#F5F7FB",
  border: "1px solid #E0E4EE",
};

const avatarButtonsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const uploadButtonStyle = {
  height: 44,
  padding: "0 18px",
  borderRadius: 14,
  background: "#536186",
  color: "#FFFFFF",
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 12px 26px rgba(83,97,134,0.25)",
};

const deleteAvatarButtonStyle = {
  height: 44,
  padding: "0 18px",
  borderRadius: 14,
  border: "1px solid #E0E4EE",
  background: "#FFFFFF",
  color: "#536186",
  fontWeight: 900,
  cursor: "pointer",
};

const labelStyle = {
  display: "block",
  marginBottom: 8,
  fontSize: 13,
  color: "#8C94A8",
  fontWeight: 800,
};

const inputStyle = {
  width: "100%",
  height: 48,
  borderRadius: 15,
  border: "1px solid #E0E4EE",
  padding: "0 15px",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyle = {
  width: "100%",
  minHeight: 112,
  borderRadius: 15,
  border: "1px solid #E0E4EE",
  padding: 15,
  fontSize: 15,
  outline: "none",
  resize: "vertical",
  boxSizing: "border-box",
};

const saveButtonStyle = {
  width: "100%",
  height: 50,
  marginTop: 20,
  borderRadius: 15,
  border: "none",
  background: "#536186",
  color: "#FFFFFF",
  fontSize: 15,
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 12px 28px rgba(83,97,134,0.25)",
};

const iconBoxStyle = {
  width: 52,
  height: 52,
  borderRadius: 18,
  background: "#EEF2FA",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
};

const smallTitleStyle = {
  margin: 0,
  color: "#1F2740",
  fontSize: 18,
};

const smallHintStyle = {
  margin: "5px 0 0",
  color: "#8C94A8",
  fontSize: 13,
};

const switchStyle = {
  cursor: "pointer",
};

const switchTrackStyle = {
  width: 48,
  height: 26,
  borderRadius: 999,
  padding: 3,
  display: "flex",
  alignItems: "center",
  transition: "0.2s",
};

const switchThumbStyle = {
  width: 20,
  height: 20,
  borderRadius: "50%",
  background: "#FFFFFF",
  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
  transition: "0.2s",
};

const settingRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  padding: "18px 0",
  borderTop: "1px solid #EEF2F8",
};

const settingNameStyle = {
  color: "#1F2740",
  fontWeight: 900,
  fontSize: 16,
};

const settingHintStyle = {
  marginTop: 4,
  color: "#8C94A8",
  fontSize: 13,
};

const selectStyle = {
  minWidth: 160,
  height: 44,
  borderRadius: 14,
  border: "1px solid #E0E4EE",
  background: "#FFFFFF",
  padding: "0 12px",
  outline: "none",
  cursor: "pointer",
  fontSize: 14,
};

const previewStyle = {
  marginTop: 18,
  padding: 18,
  borderRadius: 20,
  background: "#F5F7FB",
  border: "1px solid #E0E4EE",
  display: "flex",
  justifyContent: "flex-end",
};

const previewBubbleStyle = {
  padding: "10px 14px",
  borderRadius: "18px 18px 4px 18px",
  background: "#536186",
  color: "#FFFFFF",
  fontWeight: 700,
};

const errorStyle = {
  marginBottom: 18,
  padding: "13px 16px",
  borderRadius: 15,
  background: "#FFF1F1",
  color: "#D94A4A",
  border: "1px solid #FFD6D6",
  fontWeight: 700,
};

const successStyle = {
  marginBottom: 18,
  padding: "13px 16px",
  borderRadius: 15,
  background: "#F0FFF5",
  color: "#2E8B57",
  border: "1px solid #CBEFD8",
  fontWeight: 700,
};