import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations, OrbitControls, Environment, ContactShadows } from "@react-three/drei";

function HandModel({ currentWord }) {
  const group = useRef();
  const { scene, animations } = useGLTF("/hand25.glb");
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (!names || names.length === 0 || !actions) return;

    // ── Step 1: Stop ALL currently playing animations ──
    Object.values(actions).forEach((action) => {
      if (action) {
        action.fadeOut(0.3);
      }
    });

    if (!currentWord) return;

    // ── Step 2: Build a set of known base-names from the GLB ──
    // e.g. "GOOD_NIGHT_Right" → base = "GOOD_NIGHT"
    const baseNames = new Set();
    names.forEach((n) => {
      const base = n.replace(/_(Left|Right)$/i, "");
      baseNames.add(base.toUpperCase());
    });

    // ── Step 3: Normalize user input to match a base-name ──
    // "goodnight" → "GOODNIGHT", "good night" → "GOOD NIGHT"
    const rawInput = currentWord.trim().toUpperCase().replace(/\s+/g, "_");

    let matchedBase = null;

    // Try exact match first (e.g. "GOOD_NIGHT")
    if (baseNames.has(rawInput)) {
      matchedBase = rawInput;
    } else {
      // Fuzzy: strip all underscores and compare
      const inputCompact = rawInput.replace(/_/g, "");
      for (const base of baseNames) {
        if (base.replace(/_/g, "") === inputCompact) {
          matchedBase = base;
          break;
        }
      }
    }

    if (!matchedBase) {
      console.warn(`No animation found for "${currentWord}". Available:`, [...baseNames]);
      return;
    }

    // ── Step 4: Find the actual animation names (preserving original case) ──
    const realLeft = names.find(
      (n) => n.toUpperCase() === `${matchedBase}_LEFT`
    );
    const realRight = names.find(
      (n) => n.toUpperCase() === `${matchedBase}_RIGHT`
    );

    console.log(`Playing animations: Left=${realLeft}, Right=${realRight}`);

    // ── Step 5: Play both hands simultaneously ──
    const activeActions = [];

    if (realLeft && actions[realLeft]) {
      const a = actions[realLeft];
      a.reset().fadeIn(0.2).play();
      activeActions.push(a);
    }
    if (realRight && actions[realRight]) {
      const a = actions[realRight];
      a.reset().fadeIn(0.2).play();
      activeActions.push(a);
    }

    return () => {
      activeActions.forEach((a) => a.fadeOut(0.3));
    };
  }, [currentWord, actions, names]);

  return (
    <group ref={group} dispose={null} position={[0, -1, 0]} scale={2}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/hand25.glb");

export default function TextToSign() {
  const [text, setText] = useState("");
  const [activeWord, setActiveWord] = useState("");

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
    <div style={styles.pageContainer} className="animate-fadeY responsive-grid">
      
      {/* Minimalist Input Layer */}
      <div style={styles.inputArea}>
        <p style={styles.inputLabel}>COMMAND PUPPET</p>
        <div style={styles.inputWrapper}>
          <input
            style={styles.hugeInput}
            placeholder="Type a query..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") playSign();
            }}
          />
        </div>
        
        <div style={styles.actionRow}>
          <button style={styles.primaryBtn} onClick={playSign}>Animate</button>
          <button style={styles.secondaryBtn} onClick={speakText}>Vocalize</button>
        </div>
      </div>

      {/* Floating Canvas */}
      <div style={styles.canvasContainer}>
         <div style={styles.canvasGlaze}></div> 
          <Canvas camera={{ position: [0, 1.5, 4], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} color={"#ffffff"} castShadow />
            <directionalLight position={[-10, 10, -5]} intensity={0.5} color={"#aaaaaa"} />
            <Environment preset="studio" />
            <HandModel currentWord={activeWord} />
            <ContactShadows position={[0, -1.2, 0]} opacity={0.3} scale={15} blur={3} />
            <OrbitControls enableZoom={true} enablePan={true} autoRotate={false} />
          </Canvas>
      </div>

    </div>
  );
}

const styles = {
  pageContainer: {
    width: "100%",
    maxWidth: "1400px",
    alignItems: "center",
    padding: "0 40px",
  },
  inputArea: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputLabel: {
    fontSize: "0.9rem",
    fontWeight: "500",
    letterSpacing: "0.2em",
    color: "var(--text-dim)",
    margin: 0,
  },
  inputWrapper: {
    borderBottom: "2px solid var(--border-light)",
    paddingBottom: "10px",
  },
  hugeInput: {
    width: "100%",
    background: "transparent",
    border: "none",
    color: "var(--text-main)",
    fontSize: "clamp(2rem, 4vw, 4rem)",
    fontWeight: "800",
    outline: "none",
    letterSpacing: "-0.04em",
  },
  actionRow: {
    display: "flex",
    gap: "15px",
    marginTop: "20px",
  },
  primaryBtn: {
    padding: "16px 32px",
    background: "var(--text-main)",
    color: "var(--bg-dark)",
    border: "none",
    borderRadius: "4px",
    fontSize: "1.1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  secondaryBtn: {
    padding: "16px 32px",
    background: "transparent",
    color: "var(--text-main)",
    border: "1px solid var(--border-light)",
    borderRadius: "4px",
    fontSize: "1.1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  canvasContainer: {
    width: "100%",
    height: "60vh",
    minHeight: "400px",
    position: "relative",
    overflow: "hidden",
    cursor: "grab",
  },
  canvasGlaze: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle, transparent 20%, var(--bg-dark) 120%)",
    pointerEvents: "none",
    zIndex: 1,
  }
};