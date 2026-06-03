import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendVerification } from "../services/auth";
import Input from "../components/Input";
import Button from "../components/Button";
import AuthCard from "../layout/AuthCard";

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Заполните все поля");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (password.length < 8) {
      setError("Пароль должен содержать минимум 8 символов");
      return;
    }

    setLoading(true);

    try {
      await sendVerification(username.trim(), email.trim(), password);

      localStorage.setItem("registerEmail", email.trim());
      localStorage.setItem("registerUsername", username.trim());
      localStorage.setItem("registerPassword", password);

      navigate("/verify");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err?.message || "Не удалось соединиться с сервером, попробуйте позже");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard subtitle="Создайте аккаунт">
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
          />

          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <div style={{ textAlign: "left" }}>
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />

            <div style={{ marginTop: 8, fontSize: 12, color: "#8C94A8" }}>
              Минимум 8 символов
            </div>
          </div>

          <Input
            placeholder="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />

          {error && (
            <div style={{ color: "#ff4444", fontSize: 14, textAlign: "center" }}>
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Отправка..." : "Создать аккаунт"}
          </Button>
        </div>
      </form>

      <div style={{ marginTop: 18, fontSize: 14 }}>
        Уже есть аккаунт?{" "}
        <Link
          to="/login"
          style={{
            color: "#536186",
            textDecoration: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Войти
        </Link>
      </div>
    </AuthCard>
  );
}