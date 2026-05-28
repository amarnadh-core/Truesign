import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LoginModal from "../components/LoginModal";

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogin(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.container} onClick={() => setShowLogin(true)}>
      
      <motion.h1
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2 }}
        style={styles.title}
      >
        TrueSign
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        style={styles.caption}
      >
        Where every gesture finds its voice
      </motion.p>

      {showLogin && <LoginModal />}
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    zIndex: 2,
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    textAlign: "center",
  },
  title: {
    fontSize: "5rem",
    fontWeight: "bold",
    letterSpacing: "3px",
  },
  caption: {
    fontSize: "1rem",
    marginTop: "10px",
    opacity: 0.8,
  },
};