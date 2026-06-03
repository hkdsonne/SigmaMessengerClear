import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ErrorPageLayout({
  code,
  subtitle,
  title,
  description,
  videoSrc = "/videos/error3.mp4",
}) {
  const navigate = useNavigate();

  const [isPrimaryHovered, setIsPrimaryHovered] = useState(false);
  const [isSecondaryHovered, setIsSecondaryHovered] = useState(false);

  return (
    <div style={pageStyle}>
      <div style={glowTopLeft}></div>
      <div style={glowBottomRight}></div>

      <div style={cardStyle}>
        <div style={leftStyle}>
          <div style={badgeStyle}>ТЧК</div>

          <h1 style={codeStyle}>{code}</h1>

          <p style={subtitleStyle}>{subtitle}</p>

          <h2 style={titleStyle}>{title}</h2>

          <p style={descriptionStyle}>{description}</p>

          <div style={actionsStyle}>
            <button
              style={{
                ...primaryButtonStyle,
                ...(isPrimaryHovered ? primaryButtonHoverStyle : {}),
              }}
              onMouseEnter={() => setIsPrimaryHovered(true)}
              onMouseLeave={() => setIsPrimaryHovered(false)}
              onClick={() => navigate("/chat")}
            >
              На главную
            </button>

          </div>
        </div>

        <div style={rightStyle}>
          <div style={videoCardStyle}>
            <video
              src={videoSrc}
              autoPlay
              muted
              loop
              playsInline
              style={videoStyle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #F8FAFF 0%, #EEF3FB 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 24px",
  position: "relative",
  overflow: "hidden",
};

const glowTopLeft = {
  position: "absolute",
  width: 320,
  height: 320,
  borderRadius: "50%",
  background: "rgba(83, 97, 134, 0.10)",
  filter: "blur(50px)",
  top: "-80px",
  left: "-60px",
};

const glowBottomRight = {
  position: "absolute",
  width: 380,
  height: 380,
  borderRadius: "50%",
  background: "rgba(176, 196, 222, 0.22)",
  filter: "blur(60px)",
  bottom: "-120px",
  right: "-80px",
};

const cardStyle = {
  width: "100%",
  maxWidth: "1220px",
  display: "grid",
  gridTemplateColumns: "1.05fr 0.95fr",
  gap: "40px",
  alignItems: "center",
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.55)",
  borderRadius: "32px",
  padding: "40px",
  boxShadow: "0 20px 60px rgba(45, 62, 101, 0.10)",
};

const leftStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const badgeStyle = {
  alignSelf: "flex-start",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "rgba(83, 97, 134, 0.08)",
  color: "#536186",
  fontSize: "14px",
  fontWeight: 700,
  marginBottom: "18px",
};

const codeStyle = {
  margin: 0,
  fontSize: "clamp(90px, 14vw, 170px)",
  fontWeight: 800,
  lineHeight: 0.95,
  letterSpacing: "-0.05em",
  color: "#2C3552",
};

const subtitleStyle = {
  margin: "20px 0 8px",
  fontSize: "18px",
  color: "#8C94A8",
  fontWeight: 500,
};

const titleStyle = {
  margin: 0,
  fontSize: "clamp(28px, 3vw, 42px)",
  lineHeight: 1.15,
  fontWeight: 800,
  color: "#1F2740",
  maxWidth: "560px",
};

const descriptionStyle = {
  marginTop: "16px",
  fontSize: "18px",
  lineHeight: 1.7,
  color: "#5F6B85",
  maxWidth: "560px",
};

const actionsStyle = {
  display: "flex",
  gap: "14px",
  marginTop: "30px",
  flexWrap: "wrap",
};

const primaryButtonStyle = {
  height: "50px",
  padding: "0 24px",
  borderRadius: "14px",
  border: "none",
  background: "#536186",
  color: "#FFFFFF",
  fontSize: "15px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(83, 97, 134, 0.18)",
  transition: "all 0.2s ease",
};

const primaryButtonHoverStyle = {
  background: "#46527A",
  transform: "translateY(-2px)",
  boxShadow: "0 16px 32px rgba(83, 97, 134, 0.24)",
};

const secondaryButtonStyle = {
  height: "50px",
  padding: "0 24px",
  borderRadius: "14px",
  border: "1px solid #D9E0EE",
  background: "#FFFFFF",
  color: "#2C3552",
  fontSize: "15px",
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const secondaryButtonHoverStyle = {
  background: "#F8FAFF",
  transform: "translateY(-2px)",
  boxShadow: "0 12px 26px rgba(31, 39, 64, 0.08)",
};

const rightStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const videoCardStyle = {
  width: "100%",
  maxWidth: "600px",
  borderRadius: "28px",
  overflow: "hidden",
  background: "#FFFFFF",
  boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
};

const videoStyle = {
  width: "100%",
  height: "auto",
  display: "block",
  objectFit: "cover",
};