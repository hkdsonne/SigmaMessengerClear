import { useRef, useState } from "react";

const MAX_MESSAGE_LENGTH = 150;

export default function ChatInput({
  onSend,
  disabled,
  replyTo,
  setReplyTo,
  sending = false,
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [messageError, setMessageError] = useState("");

  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
  }

  function handleTextChange(e) {
    const value = e.target.value;

    // Ограничение длины
    if (value.length > MAX_MESSAGE_LENGTH) {
      setMessageError(
        `Максимальная длина сообщения — ${MAX_MESSAGE_LENGTH} символов`
      );
      return;
    }

    setMessageError("");
    setText(value);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (disabled || sending) return;

    const trimmedText = text.trim();

    // Пустое сообщение
    if (!trimmedText && !file) return;

    // Защита от длинных сообщений
    if (trimmedText.length > MAX_MESSAGE_LENGTH) {
      setMessageError(
        `Сообщение слишком длинное. Максимум ${MAX_MESSAGE_LENGTH} символов`
      );
      return;
    }

    try {
      await onSend(trimmedText, replyTo?.id || null, file);

      setText("");
      setFile(null);
      setMessageError("");
      setReplyTo?.(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Send message error:", err);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#FFFFFF",
        borderTop: "1px solid #E0E4EE",
        padding: "12px 16px",
      }}
    >
      {/* Ответ на сообщение */}
      {replyTo && (
        <div
          style={{
            marginBottom: 10,
            background: "#F5F7FB",
            border: "1px solid #E0E4EE",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#536186",
            fontSize: 13,
          }}
        >
          <span>
            Ответ на сообщение:{" "}
            <strong>
              {replyTo.content?.length > 60
                ? `${replyTo.content.slice(0, 60)}...`
                : replyTo.content}
            </strong>
          </span>

          <button
            type="button"
            onClick={() => setReplyTo(null)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 18,
              color: "#536186",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Прикреплённый файл */}
      {file && (
        <div
          style={{
            marginBottom: 10,
            background: "#F5F7FB",
            border: "1px solid #E0E4EE",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#536186",
            fontSize: 13,
          }}
        >
          <span>
            📎 <strong>{file.name}</strong>
          </span>

          <button
            type="button"
            onClick={() => {
              setFile(null);

              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 18,
              color: "#536186",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Ошибка длины сообщения */}
      {messageError && (
        <div
          style={{
            marginBottom: 10,
            background: "#FFF1F1",
            border: "1px solid #FFD6D6",
            borderRadius: 12,
            padding: "10px 14px",
            color: "#D94A4A",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {messageError}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {/* Кнопка файла */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending}
          title="Прикрепить файл"
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            border: "1px solid #E0E4EE",
            background: disabled ? "#F1F3F8" : "#FFFFFF",
            color: "#536186",
            cursor: disabled ? "not-allowed" : "pointer",
            fontSize: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(31,39,64,0.06)",
          }}
        >
          📎
        </button>

        {/* Поле сообщения */}
        <div style={{ flex: 1 }}>
          <input
            value={text}
            onChange={handleTextChange}
            disabled={disabled || sending}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={
              disabled ? "Выберите чат..." : "Сообщение..."
            }
            style={{
              width: "100%",
              height: 46,
              borderRadius: 14,
              border:
                text.length > MAX_MESSAGE_LENGTH * 0.9
                  ? "1px solid #D94A4A"
                  : "1px solid #E0E4EE",
              padding: "0 16px",
              outline: "none",
              fontSize: 14,
              background: disabled ? "#F5F7FB" : "#FFFFFF",
              boxSizing: "border-box",
            }}
          />

          {/* Счётчик */}
          <div
            style={{
              marginTop: 5,
              textAlign: "right",
              fontSize: 12,
              color:
                text.length > MAX_MESSAGE_LENGTH * 0.9
                  ? "#D94A4A"
                  : "#8C94A8",
            }}
          >
            {text.length}/{MAX_MESSAGE_LENGTH}
          </div>
        </div>

        {/* Отправка */}
        <button
          type="submit"
          disabled={
            disabled ||
            sending ||
            (!text.trim() && !file)
          }
          style={{
            height: 46,
            minWidth: 120,
            borderRadius: 14,
            border: "none",
            background:
              disabled ||
              sending ||
              (!text.trim() && !file)
                ? "#B0C4DE"
                : "#536186",
            color: "#FFFFFF",
            fontWeight: 700,
            cursor:
              disabled ||
              sending ||
              (!text.trim() && !file)
                ? "not-allowed"
                : "pointer",
          }}
        >
          {sending ? "Отправка..." : "Отправить"}
        </button>
      </div>
    </form>
  );
}