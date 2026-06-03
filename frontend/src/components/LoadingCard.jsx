export default function LoadingCard({ text = "Загрузка..." }) {
  return (
    <div style={loadingPageStyle}>
      <div style={loadingCardStyle}>
        {text}
      </div>
    </div>
  );
}

const loadingPageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, #EAF0FF 0, transparent 30%), linear-gradient(180deg, #F7F9FD 0%, #EEF2F8 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const loadingCardStyle = {
  padding: "24px 34px",
  background: "#FFFFFF",
  border: "1px solid #E0E4EE",
  borderRadius: 24,
  color: "#536186",
  fontWeight: 900,
  fontSize: 18,
  boxShadow: "0 18px 45px rgba(31,39,64,0.10)",
};