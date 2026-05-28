import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FeatureLayout from "../components/FeatureLayout";

export default function TextToSpeech() {
  const [input, setInput] = useState("");
  const [signImageUrl, setSignImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const speak = () => {
    if (!input.trim()) return;
    const utterance = new SpeechSynthesisUtterance(input);
    window.speechSynthesis.speak(utterance);
  };

  const navigate = useNavigate();

  // 🚀 Converts to Sign by redirecting to the 3D Viewer page
  const convertToSign = () => {
    if (!input.trim()) return;
    // We can pass state to the TextToSign component
    navigate("/image", { state: { word: input } });
  };

  return (
    <FeatureLayout title="Text to Speech">
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <textarea
          style={styles.textArea}
          placeholder="Type something here to hear it spoken aloud..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <div style={styles.buttonContainer}>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(124, 255, 103, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            style={styles.primaryBtn} 
            onClick={speak}
          >
            🔊 Speak Audio
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={styles.secondaryBtn}
            onClick={convertToSign}
            disabled={isGenerating}
          >
            {isGenerating ? "⚙️ Rendering..." : "🤟 Convert to Sign"}
          </motion.button>
        </div>

      </motion.div>
    </FeatureLayout>
  );
}

const styles = {
  textArea: {
    width: "100%",
    minHeight: "160px",
    padding: "20px",
    borderRadius: "15px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    background: "rgba(0, 0, 0, 0.4)",
    color: "white",
    fontSize: "1.2rem",
    resize: "none",
    outline: "none",
    boxShadow: "inset 0 4px 10px rgba(0, 0, 0, 0.5)",
    fontFamily: "inherit",
    lineHeight: "1.5",
  },
  buttonContainer: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
    marginTop: "25px",
  },
  primaryBtn: {
    flex: 1,
    padding: "15px",
    borderRadius: "12px",
    border: "none",
    background: "#7cff67",
    color: "#000",
    fontWeight: "bold",
    fontSize: "1.1rem",
    cursor: "pointer",
  },
  secondaryBtn: {
    flex: 1,
    padding: "15px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    background: "rgba(255, 255, 255, 0.05)",
    color: "white",
    fontWeight: "bold",
    fontSize: "1.1rem",
    cursor: "pointer",
  },
  imageResultBox: {
    marginTop: "20px",
    padding: "15px",
    background: "rgba(0,0,0,0.4)",
    borderRadius: "15px",
    border: "1px solid rgba(255,255,255,0.1)",
  }
};