import { useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import Avatar from "./Avatar";

export default function ChatHeader({ title, isGroup, onParticipantsClick }) {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const usernameForUrl = encodeURIComponent(settings.userName || "me");

  return (
    <div
      style={{
        height: 80,
        background: "#FFFFFF",
        borderBottom: "1px solid #E0E4EE",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#2C2C2C" }}>
          {title}
        </div>

        {isGroup && (
          <button
            onClick={onParticipantsClick}
            style={{
              background: "#F5F7FB",
              border: "1px solid #E0E4EE",
              cursor: "pointer",
              fontSize: 18,
              borderRadius: 12,
              padding: "8px 10px",
            }}
          >
            👥
          </button>
        )}
      </div>

      <div
        onClick={() => navigate(`/profile/${usernameForUrl}`)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
        }}
      >
        <Avatar src={settings.avatar} size={38} />
        <div style={{ fontSize: 16, fontWeight: 600, color: "#2C2C2C" }}>
          {settings.userName}
        </div>
      </div>
    </div>
  );
}