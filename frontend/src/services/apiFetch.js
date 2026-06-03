const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_IP;

let refreshPromise = null;

async function refreshToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${AUTH_SERVICE_URL}/api/Auth/refresh`, {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch(url, options = {}) {
  const requestOptions = {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
    },
  };

  let response = await fetch(url, requestOptions);

  if (response.status !== 401) {
    return response;
  }

  try {
    const refreshResponse = await refreshToken();

    if (!refreshResponse.ok) {
      window.location.href = "/login";
      return response;
    }

    response = await fetch(url, requestOptions);

    if (response.status === 401) {
      window.location.href = "/login";
    }

    return response;
  } catch (err) {
    console.error("Token refresh error:", err);
    window.location.href = "/login";
    return response;
  }
}