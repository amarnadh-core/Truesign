import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { useLocation } from "react-router-dom";
import { useGLTF, useAnimations, OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import FeatureLayout from "../components/FeatureLayout";

function HandModel({ currentWord }) {
  const group = useRef();
  const { scene, animations } = useGLTF("/hand25.glb");
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (!names || names.length === 0) return;

    let baseAnim = currentWord || "Idle";

    let leftAnim = `${baseAnim}_Left`;
    let rightAnim = `${baseAnim}_Right`;

    // Case-insensitive match from the GLB animation names
    let realLeft = names.find((n) => n.toUpperCase() === leftAnim.toUpperCase());
    let realRight = names.find((n) => n.toUpperCase() === rightAnim.toUpperCase());

    // Fallback to strictly "Idle" if not found
    if (!realLeft && !realRight) {
        realLeft = names.find((n) => n.toUpperCase() === "IDLE_LEFT");
        realRight = names.find((n) => n.toUpperCase() === "IDLE_RIGHT");
    }

    const actionLeft = realLeft ? actions[realLeft] : null;
    const actionRight = realRight ? actions[realRight] : null;

    if (actionLeft) actionLeft.reset().fadeIn(0.2).play();
    if (actionRight) actionRight.reset().fadeIn(0.2).play();

    return () => {
      if (actionLeft) actionLeft.fadeOut(0.2);
      if (actionRight) actionRight.fadeOut(0.2);
    };
  }, [currentWord, actions, names]);

  return (
    <group ref={group} dispose={null} position={[0, -1, 0]} scale={2}>
      <primitive object={scene} />
    </group>
  );
}

// Preload the model so that there's no delay when users navigate to this page
useGLTF.preload("/hand25.glb");


export default function TextToSign() {
  const location = useLocation();
  const [text, setText] = useState(location.state?.word || "");
  const [activeWord, setActiveWord] = useState(location.state?.word || "");

  const playSign = () => {
    if (!text.trim()) return;
    setActiveWord(text.trim());
  };

  const speakText = () => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <FeatureLayout title="Text to Sign">
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input
            style={styles.inputBox}
            placeholder="Type a word to sign (e.g. HELLO, A, B)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") playSign();
            }}
          />
        </div>

        {/* 🖼️ Display Area for the 3D Canvas */}
        <div style={styles.canvasBox}>
            <Canvas camera={{ position: [0, 1.5, 4], fov: 45 }}>
              <ambientLight intensity={1.5} />
              <directionalLight position={[10, 10, 5]} intensity={2.5} castShadow />
              <Environment preset="city" />
              <HandModel currentWord={activeWord} />
              <ContactShadows position={[0, -1.2, 0]} opacity={0.5} scale={10} blur={2} />
              <OrbitControls enableZoom={true} enablePan={true} />
            </Canvas>
        </div>

        <div style={styles.buttonContainer}>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(124, 255, 103, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            style={styles.primaryBtn}
            onClick={playSign}
          >
            ✨ Play Sign
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={styles.secondaryBtn}
            onClick={speakText}
          >
            🔊 Read Aloud
          </motion.button>
        </div>
      </motion.div>
    </FeatureLayout>
  );
}

const styles = {
  inputBox: {
    flex: 1,
    padding: "18px 20px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    background: "rgba(0, 0, 0, 0.4)",
    color: "white",
    fontSize: "1.1rem",
    outline: "none",
    boxShadow: "inset 0 4px 10px rgba(0, 0, 0, 0.5)",
  },
  canvasBox: {
    width: "100%",
    height: "350px",
    borderRadius: "15px",
    border: "2px solid rgba(124, 255, 103, 0.3)",
    background: "radial-gradient(circle at center, rgba(40,40,50,1) 0%, rgba(10,10,15,1) 100%)",
    marginBottom: "25px",
    overflow: "hidden",
    position: "relative",
    cursor: "grab",
  },
  buttonContainer: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
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
  }
};