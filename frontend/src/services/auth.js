import { apiRequest } from "./api";

export function sendVerification(username, email, password) {
  return apiRequest("/api/Auth/send-verification", {
    method: "POST",
    body: JSON.stringify({
      username,
      email,
      password,
      device_info: "web",
    }),
  });
}

export function verifyCode(email, code, username, password) {
  return apiRequest("/api/Auth/verify", {
    method: "POST",
    body: JSON.stringify({
      email,
      code,
      username,
      password,
      device_info: "web",
    }),
  });
}

export function loginUser(username, password) {
  return apiRequest("/api/Auth/login", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
      device_info: "web",
    }),
  });
}

export function logoutUser() {
  return apiRequest("/api/Auth/logout", {
    method: "POST",
  });
}

export function getCurrentUser() {
  return apiRequest("/api/Auth/me", {
    method: "GET",
  });
}

export async function isAuthenticated() {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}