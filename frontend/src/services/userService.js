const USER_API = `${import.meta.env.VITE_USER_SERVICE_IP}/api/User`;

async function request(path, options = {}) {
  const res = await fetch(`${USER_API}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || data?.error || "Ошибка UserService");
  }

  return data?.data || data;
}

export function getMyProfile() {
  return request("/me");
}

export function getMySettings() {
  return request("/me/settings");
}

export function updateMyProfile(payload) {
  return request("/me/info", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function updateMySettings(payload) {
  return request("/me/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getUsersList() {
  return request("/list");
}

export function getUserByUsername(username) {
  return request(`/by-username/${encodeURIComponent(username)}`);
}