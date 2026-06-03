export default function Button({ children, styleType = "primary", ...props }) {
  const base = {
    height: "48px",
    borderRadius: "12px",
    border: "none",
    padding: "0 16px",
    fontWeight: 600,
    fontSize: "16px",
    cursor: "pointer",
    width: "100%",
  };

  const primary = {
    background: "#536186",
    color: "#fff",
  };

  const hover = {
    background: "#46527A",
    color: "#fff",
  };

  const disabled = {
    background: "#B0C4DE",
    color: "#5F6B85",
    cursor: "not-allowed",
  };

  let style = base;

  if (styleType === "primary") {
    style = { ...base, ...primary };
  } else if (styleType === "hover") {
    style = { ...base, ...hover };
  } else {
    style = { ...base, ...disabled };
  }

  return (
    <button style={style} {...props}>
      {children}
    </button>
  );
}