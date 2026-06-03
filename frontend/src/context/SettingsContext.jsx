import { createContext, useContext, useEffect, useState } from "react";
import { getMyProfile, getMySettings } from "../services/userService";

const SettingsContext = createContext();

const defaultSettings = {
  userName: "Пользователь",
  email: "",
  avatar: null,
  notifications: true,
  sound: true,
  privateAccount: false,
  chatBackground: "light",
  textSize: "medium",
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("tchk_settings");
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    async function loadServerSettings() {
      try {
        const profile = await getMyProfile();
        const serverSettings = await getMySettings();

        setSettings((prev) => ({
          ...prev,
          userName: profile?.full_name || prev.userName,
          email: profile?.email || prev.email,
          avatar: profile?.avatar_url || null,
          notifications:
            serverSettings?.notifications_enabled ??
            serverSettings?.notification_enabled ??
            prev.notifications,
        }));
      } catch (err) {
        console.warn("SettingsContext load error:", err);
      } finally {
        setLoadingSettings(false);
      }
    }

    loadServerSettings();
  }, []);

  useEffect(() => {
    localStorage.setItem("tchk_settings", JSON.stringify(settings));
  }, [settings]);

  function updateSetting(key, value) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateManySettings(values) {
    setSettings((prev) => ({
      ...prev,
      ...values,
    }));
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loadingSettings,
        updateSetting,
        updateManySettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}