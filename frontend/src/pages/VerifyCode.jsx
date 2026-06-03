import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendVerification, verifyCode } from "../services/auth";
import AuthCard from "../layout/AuthCard";
import Button from "../components/Button";

import LoadingCard from "../components/LoadingCard";

export default function VerifyCode() {
  const CODE_LEN = 6;
  const navigate = useNavigate();

  const [code, setCode] = useState(Array(CODE_LEN).fill(""));
  const inputsRef = useRef([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const email = localStorage.getItem("registerEmail");
  const username = localStorage.getItem("registerUsername");
  const password = localStorage.getItem("registerPassword");

  useEffect(() => {
    if (!email || !username || !password) {
      navigate("/login", { replace: true });
      return;
    }

    inputsRef.current[0]?.focus();
  }, [email, username, password, navigate]);

  function onChangeDigit(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];

    next[index] = digit;
    setCode(next);

    if (digit && index < CODE_LEN - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function onKeyDown(index, e) {
    if (e.key === "Backspace") {
      if (code[index]) {
        const next = [...code];
        next[index] = "";
        setCode(next);
        return;
      }

      if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < CODE_LEN - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function onPaste(e) {
    e.preventDefault();

    const text = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LEN);

    if (!text) return;

    const next = Array(CODE_LEN).fill("");

    for (let i = 0; i < text.length; i++) {
      next[i] = text[i];
    }

    setCode(next);

    const focusIndex = Math.min(text.length, CODE_LEN) - 1;
    inputsRef.current[Math.max(focusIndex, 0)]?.focus();
  }

  const isComplete = code.every((digit) => digit !== "");

  async function handleVerify(e) {
    e.preventDefault();

    if (!isComplete || loading) return;

    setError("");
    setLoading(true);

    try {
      const userCode = code.join("");

      await verifyCode(email, userCode, username, password);

      localStorage.removeItem("registerEmail");
      localStorage.removeItem("registerUsername");
      localStorage.removeItem("registerPassword");

      navigate("/chat", { replace: true });
    } catch (err) {
      console.error("Verify error:", err);
      setError(err?.message || "Неверный код");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendLoading) return;

    setError("");
    setResendLoading(true);

    try {
      await sendVerification(username, email, password);
      alert("Код отправлен повторно. Проверьте почту или спам.");
    } catch (err) {
      console.error("Resend error:", err);
      setError(err?.message || "Ошибка сети. Попробуйте позже.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <AuthCard subtitle="Введите код из письма">
      <form onSubmit={handleVerify}>
        <div
          onPaste={onPaste}
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginBottom: 20,
            marginTop: 6,
          }}
        >
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              value={digit}
              onChange={(e) => onChangeDigit(index, e.target.value)}
              onKeyDown={(e) => onKeyDown(index, e)}
              inputMode="numeric"
              maxLength={1}
              disabled={loading}
              style={{
                width: 48,
                height: 58,
                borderRadius: 12,
                border: digit ? "1px solid #536186" : "1px solid #E0E4EE",
                textAlign: "center",
                fontSize: 22,
                fontWeight: 700,
                outline: "none",
                background: "#FFFFFF",
              }}
            />
          ))}
        </div>

        {error && (
          <div
            style={{
              color: "#ff4444",
              fontSize: 14,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <Button disabled={!isComplete || loading} type="submit">
          {loading ? "Проверка..." : "Подтвердить"}
        </Button>
      </form>

      <div style={{ marginTop: 16, fontSize: 12, color: "#8C94A8" }}>
        Если письмо не пришло — проверь «Спам»
      </div>

      <button
        type="button"
        onClick={handleResend}
        disabled={resendLoading}
        style={{
          marginTop: 10,
          background: "transparent",
          border: "none",
          color: "#536186",
          cursor: resendLoading ? "not-allowed" : "pointer",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {resendLoading ? "Отправка..." : "Отправить код ещё раз"}
      </button>
    </AuthCard>
  );
}