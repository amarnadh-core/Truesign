import { useNavigate } from "react-router-dom";

export default function FeatureLayout({ title, children }) {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate("/dashboard")}>
          &larr;
        </button>
        <h1 style={styles.title}>{title}</h1>
        <div style={{ width: 44 }}></div>
      </div>

      <div style={styles.content} className="glass-panel animate-fade">
        {children}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    zIndex: 2,
    minHeight: "100vh",
    color: "var(--text-main)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: "1000px",
    marginBottom: "40px",
  },
  backButton: {
    background: "var(--glass-bg)",
    border: "1px solid var(--glass-border)",
    color: "var(--text-main)",
    borderRadius: "50%",
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "1.2rem",
    transition: "transform 0.2s, background 0.2s",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-1px",
    background: "linear-gradient(90deg, #fff 0%, var(--text-dim) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  content: {
    width: "100%",
    maxWidth: "1000px",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
  },
};