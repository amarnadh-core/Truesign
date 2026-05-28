import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function LoginModal() {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={styles.overlay}
    >
      <div style={styles.box}>
        <h2 style={styles.heading}>Welcome to TrueSign</h2>
        <p style={styles.subtext}>Enter your details to continue</p>
        
        <input placeholder="Username or Email" style={styles.input} />
        <input type="password" placeholder="Password" style={styles.input} />
        
        <div style={styles.buttonContainer}>
          <button onClick={() => navigate("/dashboard")} style={styles.buttonPrimary}>
            Sign In
          </button>
          <button onClick={() => navigate("/dashboard")} style={styles.buttonSecondary}>
            Sign Up
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const styles = {
  overlay: {
    position: "absolute",
    top: 0, left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.5)", /* Fades the Aurora background slightly */
    backdropFilter: "blur(6px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  box: {
    background: "rgba(255, 255, 255, 0.08)",
    padding: "40px",
    borderRadius: "20px",
    textAlign: "center",
    color: "white",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    width: "320px",
  },
  heading: {
    margin: "0 0 10px 0",
    fontSize: "1.5rem",
    fontWeight: "600",
  },
  subtext: {
    margin: "0 0 20px 0",
    fontSize: "0.9rem",
    opacity: 0.7,
  },
  input: {
    display: "block",
    margin: "15px auto",
    padding: "12px 15px",
    width: "100%",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    outline: "none",
    background: "rgba(0, 0, 0, 0.2)",
    color: "white",
    fontSize: "1rem",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "25px",
    gap: "15px",
  },
  buttonPrimary: {
    flex: 1,
    padding: "12px",
    background: "#7cff67", /* Accent color from your Aurora */
    color: "#000",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "0.2s",
  },
  buttonSecondary: {
    flex: 1,
    padding: "12px",
    background: "transparent",
    color: "white",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "0.2s",
  },
};