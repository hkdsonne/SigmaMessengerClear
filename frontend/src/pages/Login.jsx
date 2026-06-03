import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, isAuthenticated } from "../services/auth";
import Input from "../components/Input";
import Button from "../components/Button";
import AuthCard from "../layout/AuthCard";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Заполните все поля");
      return;
    }

    setLoading(true);
    try {
      await loginUser(username.trim(), password);

      const auth = await isAuthenticated();

      if (!auth) {
        setError("Вход выполнен, но сессия не подтвердилась");
        return;
      }

      navigate("/chat", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(err?.message || "Не удалось войти");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard subtitle="Войдите, чтобы продолжить">
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
          />

          <Input
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          {error && (
            <div style={{ color: "#ff4444", fontSize: 14, textAlign: "center" }}>
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </Button>
        </div>
      </form>

      <div style={{ marginTop: 18, fontSize: 14 }}>
        Нет аккаунта?{" "}
        <Link
          to="/register"
          style={{
            color: "#536186",
            textDecoration: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Регистрация
        </Link>
      </div>
    </AuthCard>
  );
}