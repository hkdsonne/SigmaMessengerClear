import logoGif from "../assets/logo.gif";

export default function AuthCard({ title = "ТЧК", subtitle, children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #F5F7FB 0%, #E3E8F5 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: 440,
          maxWidth: "100%",
          background: "#FFFFFF",
          borderRadius: 20,
          padding: "28px 40px 30px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
          textAlign: "center",
        }}
      >
        {/* Logo block */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img
            // src={logoGif}
            // alt="ТЧК"
            // style={{
            //   width: 72,
            //   height: 72,
            //   objectFit: "contain",
            //   marginBottom: 10,
            //}}
            src={logoGif}
            alt="ТЧК"
            style={{
                width: 300,
                height: 120,
                transform: "scale(1.05)",
                objectFit: "contain",
                marginBottom: 20,
                filter: "drop-shadow(0 12px 30px rgba(83,97,134,0.35))"
            }}

          />

          <div style={{ fontSize: 32, fontWeight: 700, color: "#536186", lineHeight: 1 }}>
            {title}
          </div>

          {subtitle ? (
            <div style={{ marginTop: 10, fontSize: 14, color: "#5F6B85" }}>
              {subtitle}
            </div>
          ) : null}
        </div>

        {/* content */}
        <div style={{ marginTop: 24 }}>{children}</div>
      </div>
    </div>
  );
}
