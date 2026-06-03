import { useEffect, useMemo, useState } from "react";
import chatService from "../services/chatService";

import { apiFetch } from "../services/apiFetch";

const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "👎"];
const FILE_SERVICE_URL = import.meta.env.VITE_FILE_SERVICE_IP;

function normalizeId(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function sameId(a, b) {
  return normalizeId(a) === normalizeId(b);
}

function safeParseAttachment(content) {
  try {
    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    if (parsed && typeof parsed === "object" && parsed.fileId) return parsed;
    return null;
  } catch {
    return null;
  }
}

function formatFileSize(size) {
  const bytes = Number(size || 0);
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function getFileUrl(attachment, type = "download") {
  if (!attachment?.fileId) return "";

  if (type === "image") {
    return (
      attachment.embedUrl ||
      attachment.originalUrl ||
      attachment.downloadUrl ||
      `${FILE_SERVICE_URL}/api/File/thumbnail/${attachment.fileId}`
    );
  }

  return (
    attachment.downloadUrl ||
    attachment.originalUrl ||
    `${FILE_SERVICE_URL}/api/File/download/${attachment.fileId}`
  );
}

function AuthImage({ attachment }) {
  const [src, setSrc] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    async function loadImage() {
      setSrc("");
      setError("");

      try {
        const imageUrl = getFileUrl(attachment, "image");

        if (!imageUrl) {
          throw new Error("Нет ссылки на изображение");
        }

        const res = await apiFetch(imageUrl, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Image request failed: ${res.status}`);
        }

        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setSrc(objectUrl);
        }
      } catch (err) {
        console.error("Image load error:", err);

        if (!cancelled) {
          setError("Не удалось загрузить фото");
        }
      }
    }

    loadImage();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [
    attachment?.fileId,
    attachment?.embedUrl,
    attachment?.originalUrl,
    attachment?.downloadUrl,
  ]);

  if (error) {
    return (
      <div
        style={{
          width: 300,
          height: 190,
          borderRadius: 16,
          background: "#F1F3F8",
          color: "#8C94A8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          textAlign: "center",
        }}
      >
        📷 {error}
      </div>
    );
  }

  if (!src) {
    return (
      <div
        style={{
          width: 300,
          height: 190,
          borderRadius: 16,
          background: "#F1F3F8",
          color: "#8C94A8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
        }}
      >
        Галчонок ищет ваши фотографии
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={attachment.fileName || "Фото"}
      style={{
        maxWidth: 340,
        maxHeight: 300,
        borderRadius: 16,
        display: "block",
        objectFit: "cover",
      }}
    />
  );
}

export default function MessageBubble({
  message,
  isOwn,
  currentUserId,
  onReply,
  onDelete,
  reactions = [],
  replyContent = null,
  fontSize = 16,
}) {
  const [localReactions, setLocalReactions] = useState(reactions || []);
  const [showPicker, setShowPicker] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setLocalReactions(reactions || []);
  }, [reactions]);

  const contentType = message.content_type || message.contentType || "text";

  const senderName =
    message.username ||
    message.sender_username ||
    message.full_name ||
    `User ${message.sender_id}`;

  const attachment =
    contentType === "file" || contentType === "image"
      ? safeParseAttachment(message.content)
      : null;

  const reactionGroups = useMemo(() => {
  return localReactions.reduce((acc, reaction) => {
    if (!reaction?.tip) return acc;

    const emoji = reaction.tip;
    const userId = normalizeId(reaction.user_id);

    if (!acc[emoji]) {
      acc[emoji] = {
        emoji,
        users: [],
        count: 0,
        isMine: false,
      };
    }

    acc[emoji].users.push(userId);
    acc[emoji].count += 1;

    if (sameId(currentUserId, userId)) {
      acc[emoji].isMine = true;
    }

    return acc;
  }, {});
}, [localReactions, currentUserId]);

  async function handleReaction(emoji) {
  try {
    const myReaction = localReactions.find((r) =>
      sameId(r.user_id, currentUserId)
    );

    if (myReaction?.tip === emoji) {
      await chatService.removeReaction(message.id, emoji);

      setLocalReactions((prev) =>
        prev.filter((r) => !sameId(r.user_id, currentUserId))
      );

      setShowPicker(false);
      return;
    }

    await chatService.addReaction(message.id, emoji);

    setLocalReactions((prev) => [
      ...prev.filter((r) => !sameId(r.user_id, currentUserId)),
      { user_id: currentUserId, tip: emoji },
    ]);

    setShowPicker(false);
  } catch (err) {
    console.error("Reaction error:", err);
  }
}

  async function handleDeleteConfirmed() {
    if (!onDelete || deleting) return;

    setDeleting(true);

    try {
      await onDelete(message.id);
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  function formatTime(dateStr) {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (contentType === "system") {
    return (
      <div
        style={{
          textAlign: "center",
          margin: "10px 0",
          fontSize: 12,
          color: "#8C94A8",
          fontStyle: "italic",
        }}
      >
        {message.content}
      </div>
    );
  }

  if (message.is_deleted) {
    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: isOwn ? "flex-end" : "flex-start",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            maxWidth: "70%",
            padding: "10px 14px",
            borderRadius: 18,
            background: "#F1F3F8",
            color: "#8C94A8",
            fontSize: 14,
            fontStyle: "italic",
            border: "1px dashed #D0D6E3",
          }}
        >
          🗑 Сообщение удалено
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: isOwn ? "flex-end" : "flex-start",
        marginBottom: 18,
        position: "relative",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#5F6B85",
          marginBottom: 5,
          display: "flex",
          gap: 8,
        }}
      >
        <span>{senderName}</span>
        <span>{formatTime(message.created_at)}</span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: isOwn ? "row-reverse" : "row",
          alignItems: "center",
          gap: 8,
          maxWidth: "78%",
        }}
      >
        <div
          style={{
            background: isOwn ? "#536186" : "#FFFFFF",
            color: isOwn ? "#FFFFFF" : "#2C2C2C",
            padding: attachment ? 8 : "10px 14px",
            borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            fontSize,
            lineHeight: 1.4,
            wordBreak: "break-word",
            minWidth: attachment ? 260 : "auto",
          }}
        >
          {message.reply_to_id && (
            <div
              style={{
                fontSize: 12,
                opacity: 0.8,
                marginBottom: 7,
                borderLeft: "3px solid #B0C4DE",
                paddingLeft: 8,
                fontStyle: "italic",
              }}
            >
              Ответ:{" "}
              {replyContent
                ? replyContent.length > 55
                  ? `${replyContent.slice(0, 55)}…`
                  : replyContent
                : "сообщению"}
            </div>
          )}

          {attachment ? (
            <AttachmentView attachment={attachment} isOwn={isOwn} />
          ) : (
            <div>{message.content}</div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 4,
            alignItems: "center",
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={() => setShowPicker((prev) => !prev)}
            title="Добавить реакцию"
            style={iconButtonStyle}
          >
            😊
          </button>

          {isOwn && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              title="Удалить сообщение"
              style={iconButtonStyle}
            >
              🗑
            </button>
          )}

          {showPicker && (
            <div
              style={{
                position: "absolute",
                bottom: 34,
                right: isOwn ? 0 : "auto",
                left: isOwn ? "auto" : 0,
                background: "#FFFFFF",
                border: "1px solid #E0E4EE",
                borderRadius: 999,
                padding: "6px 8px",
                display: "flex",
                gap: 4,
                boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                zIndex: 10,
              }}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReaction(emoji)}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: 18,
                    cursor: "pointer",
                    padding: "4px 6px",
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: 6,
          flexWrap: "wrap",
          justifyContent: isOwn ? "flex-end" : "flex-start",
          maxWidth: "78%",
        }}
      >
        {Object.values(reactionGroups).map((group) => (
          <button
            key={group.emoji}
            type="button"
            onClick={() => handleReaction(group.emoji)}
            style={{
              border: group.isMine ? "1px solid #536186" : "1px solid #E0E4EE",
              background: group.isMine ? "#EEF2FA" : "#FFFFFF",
              color: "#2C2C2C",
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            {group.emoji} {group.count}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onReply && onReply(message)}
          style={{
            border: "none",
            background: "transparent",
            color: "#536186",
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Ответить
        </button>
      </div>

      {confirmDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(31,39,64,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              width: 380,
              background: "#FFFFFF",
              borderRadius: 22,
              padding: 24,
              boxShadow: "0 20px 70px rgba(0,0,0,0.18)",
            }}
          >
            <h3 style={{ margin: "0 0 8px", color: "#1F2740" }}>
              Удалить сообщение?
            </h3>

            <p style={{ margin: "0 0 22px", color: "#5F6B85", fontSize: 14 }}>
              Сообщение исчезнет из чата и будет заменено пометкой об удалении.
            </p>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                style={cancelButtonStyle}
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={handleDeleteConfirmed}
                disabled={deleting}
                style={deleteButtonStyle}
              >
                {deleting ? "Удаляем..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AttachmentView({ attachment, isOwn }) {
  const isImage = String(attachment.fileType || "").startsWith("image/");
  const downloadUrl = getFileUrl(attachment, "download");

  if (isImage) {
    return (
      <div>
        <div style={{ display: "block" }}>
          <AuthImage attachment={attachment} />
        </div>

        {attachment.caption && (
          <div
            style={{
              marginTop: 8,
              color: isOwn ? "#FFFFFF" : "#2C2C2C",
            }}
          >
            {attachment.caption}
          </div>
        )}

        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              marginTop: 8,
              fontSize: 12,
              color: isOwn ? "#DCE3F2" : "#536186",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Открыть фото
          </a>
        )}
      </div>
    );
  }

  return (
    <a
      href={downloadUrl}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        color: isOwn ? "#FFFFFF" : "#1F2740",
        textDecoration: "none",
        minWidth: 240,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: isOwn ? "rgba(255,255,255,0.18)" : "#EEF2FA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        📄
      </div>

      <div style={{ overflow: "hidden" }}>
        <div
          style={{
            fontWeight: 800,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 240,
          }}
        >
          {attachment.fileName || "Файл"}
        </div>

        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
          {formatFileSize(attachment.fileSize)}
        </div>

        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
          Скачать файл
        </div>

        {attachment.caption && (
          <div style={{ marginTop: 8, fontSize: 14 }}>{attachment.caption}</div>
        )}
      </div>
    </a>
  );
}

const iconButtonStyle = {
  width: 30,
  height: 30,
  borderRadius: 999,
  border: "1px solid #E0E4EE",
  background: "#FFFFFF",
  cursor: "pointer",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cancelButtonStyle = {
  height: 42,
  padding: "0 16px",
  borderRadius: 12,
  border: "1px solid #E0E4EE",
  background: "#FFFFFF",
  color: "#536186",
  fontWeight: 700,
  cursor: "pointer",
};

const deleteButtonStyle = {
  height: 42,
  padding: "0 16px",
  borderRadius: 12,
  border: "none",
  background: "#D94A4A",
  color: "#FFFFFF",
  fontWeight: 700,
  cursor: "pointer",
};