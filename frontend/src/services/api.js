const API_URL = import.meta.env.VITE_AUTH_SERVICE_IP;

export async function apiRequest(path, options = {}, retry = true) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 401 && retry && path !== "/api/Auth/login") {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      return apiRequest(path, options, false);
    }
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message: data?.message || "Ошибка запроса",
      data,
    };
  }

  return data;
}

async function refreshAccessToken() {
  try {
    const response = await fetch(`${API_URL}/api/Auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}