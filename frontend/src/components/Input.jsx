export default function Input({ ...props }) {
  return (
    <input
      style={{
        width: "100%",
        height: 48,
        borderRadius: 12,
        border: "1px solid #E0E4EE",
        padding: "12px 16px",
        fontSize: 14,
        outline: "none",
        background: "#fff",
      }}
      {...props}
    />
  );
}
