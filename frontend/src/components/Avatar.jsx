import { useEffect, useState } from "react";

import { apiFetch } from "../services/apiFetch";

export default function Avatar({
  src,
  size = 42,
  alt = "Avatar",
  name = "",
}) {
  const [imageSrc, setImageSrc] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    async function loadAvatar() {
      setFailed(false);
      setImageSrc("");

      if (!src) return;

      try {
        const res = await apiFetch(src, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Avatar load failed: ${res.status}`);
        }

        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setImageSrc(objectUrl);
        }
      } catch (err) {
        console.error("Avatar load error:", err);

        if (!cancelled) {
          setFailed(true);
        }
      }
    }

    loadAvatar();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  const firstLetter = name?.trim()?.[0]?.toUpperCase() || "U";

  if (!src || failed || !imageSrc) {
    return (
      <div
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          borderRadius: "50%",
          background: "#536186",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: Math.max(14, size * 0.42),
          fontWeight: 700,
          overflow: "hidden",
        }}
      >
        {firstLetter}
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: "50%",
        objectFit: "cover",
        display: "block",
        background: "#EEF2FA",
      }}
    />
  );
}