import { useNavigate } from "react-router-dom";

export default function FeatureLayout({ title, children }) {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{title}</h1>

      <div style={styles.content}>
        {children}
      </div>

      <button style={styles.button} onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    zIndex: 2,
    height: "100vh",
    color: "white",
    textAlign: "center",
    paddingTop: "80px",
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: "30px",
  },
  content: {
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(15px)",
    borderRadius: "20px",
    width: "500px",
    margin: "auto",
    padding: "40px",
  },
  button: {
    marginTop: "30px",
    padding: "10px 20px",
  },
};