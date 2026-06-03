import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../services/auth";

import LoadingCard from "../components/LoadingCard";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    async function checkAuth() {
      const result = await isAuthenticated();

      if (result) {
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
      }
    }

    checkAuth();
  }, []);

  if (status === "loading") {
    return <div style={{ padding: 40 }}>Проверяем авторизацию...</div>;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return children;
}