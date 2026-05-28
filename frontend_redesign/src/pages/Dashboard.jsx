import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Dashboard() {
  const navigate = useNavigate();

  const cards = [
    { title: "Sign to Text", path: "/sign" },
    { title: "Text to Speech", path: "/speech" },
    { title: "Text to Sign", path: "/image" }, 
  ];

  return (
    <div style={styles.container}>
      {cards.map((card, index) => (
        <motion.div
          key={index}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(card.path)}
          style={styles.card}
        >
          {card.title}
        </motion.div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    zIndex: 2,
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "60px",
  },
  card: {
    width: "250px",
    height: "180px",
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(12px)",
    borderRadius: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontSize: "1.3rem",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 0 20px rgba(124,255,103,0.4)",
    transition: "0.3s",
  },
};