import { useRef, useEffect, useState } from "react";
import { Holistic, HAND_CONNECTIONS, POSE_CONNECTIONS, FACEMESH_TESSELATION } from "@mediapipe/holistic";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

// ⭐ Holistic feature constants (must match model training)
const HAND_FEATURES = 63;   // 21 landmarks × 3 coords
const POSE_FEATURES = 12;   // 4 anchors × 3 coords
const FACE_FEATURES = 15;   // 5 anchors × 3 coords
const TOTAL_FEATURES = HAND_FEATURES * 2 + POSE_FEATURES + FACE_FEATURES; // 153

// Key landmark indices (must match data collector)
const POSE_INDICES = [11, 12, 23, 24];              // shoulders + hips
const FACE_INDICES = [1, 152, 10, 33, 263];          // eyes, nose, mouth edges

function extractHandLandmarks(handLandmarks) {
  // Extract 21 landmarks and wrist-normalize
  const coords = handLandmarks.map(lm => [lm.x, lm.y, lm.z]);
  const wrist = coords[0];
  const normalized = coords.map(c => [c[0] - wrist[0], c[1] - wrist[1], c[2] - wrist[2]]);
  return normalized.flat();
}

// ⭐ Frame-skip threshold: when motion is below this, skip sending to backend
const FRAME_SKIP_THRESHOLD = 0.01;

export default function SignToText() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null); 
  const prevFrameRef = useRef(null);  // ⭐ Track previous frame for motion detection
  const [text, setText] = useState("");
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const autoSpeakRef = useRef(false);  // ref so WebSocket callback sees latest value

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");

    // 1. Initialize WebSocket (Proxied through Vite to avoid HTTPS mixed content)
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/predict`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.word) {
        setText(data.word);
        // Auto-speak if toggle is on
        if (autoSpeakRef.current) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(data.word.replace(/_/g, " "));
          window.speechSynthesis.speak(utterance);
        }
      }
    };

    // 2. Initialize MediaPipe Holistic
    const holistic = new Holistic({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    });

    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // 3. Holistic Results → Extract 153 features → Send via WebSocket
    holistic.onResults((results) => {
      setIsModelLoaded(true);
      
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      // ⭐ Draw landmarks on canvas for visual feedback
      // Left hand
      if (results.leftHandLandmarks) {
        drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, 
          { color: "rgba(255, 255, 255, 0.4)", lineWidth: 2 });
        drawLandmarks(canvasCtx, results.leftHandLandmarks, 
          { color: "#ffffff", lineWidth: 2, radius: 3 });
      }
      // Right hand
      if (results.rightHandLandmarks) {
        drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, 
          { color: "rgba(255, 255, 255, 0.4)", lineWidth: 2 });
        drawLandmarks(canvasCtx, results.rightHandLandmarks, 
          { color: "#ffffff", lineWidth: 2, radius: 3 });
      }
      // Pose (upper body)
      if (results.poseLandmarks) {
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, 
          { color: "rgba(245, 117, 66, 0.5)", lineWidth: 2 });
        drawLandmarks(canvasCtx, results.poseLandmarks, 
          { color: "rgba(245, 117, 66, 0.8)", lineWidth: 1, radius: 2 });
      }

      // ⭐ Build 153-feature vector
      const handsDetected = results.leftHandLandmarks || results.rightHandLandmarks;

      if (handsDetected) {
        const frameVec = new Array(TOTAL_FEATURES).fill(0);
        let offset = 0;

        // Left hand (63 features)
        if (results.leftHandLandmarks) {
          const lh = extractHandLandmarks(results.leftHandLandmarks);
          for (let i = 0; i < HAND_FEATURES; i++) frameVec[offset + i] = lh[i];
        }
        offset += HAND_FEATURES;

        // Right hand (63 features)
        if (results.rightHandLandmarks) {
          const rh = extractHandLandmarks(results.rightHandLandmarks);
          for (let i = 0; i < HAND_FEATURES; i++) frameVec[offset + i] = rh[i];
        }
        offset += HAND_FEATURES;

        // Pose anchors: shoulders + hips (12 features)
        if (results.poseLandmarks) {
          for (let i = 0; i < POSE_INDICES.length; i++) {
            const lm = results.poseLandmarks[POSE_INDICES[i]];
            frameVec[offset + i * 3]     = lm.x;
            frameVec[offset + i * 3 + 1] = lm.y;
            frameVec[offset + i * 3 + 2] = lm.z;
          }
        }
        offset += POSE_FEATURES;

        // Face anchors: eyes, nose, mouth edges (15 features)
        if (results.faceLandmarks) {
          for (let i = 0; i < FACE_INDICES.length; i++) {
            const lm = results.faceLandmarks[FACE_INDICES[i]];
            frameVec[offset + i * 3]     = lm.x;
            frameVec[offset + i * 3 + 1] = lm.y;
            frameVec[offset + i * 3 + 2] = lm.z;
          }
        }

        // ⭐ Client-side frame skipping: compute motion magnitude
        let shouldSend = true;
        if (prevFrameRef.current) {
          let motionSum = 0;
          for (let i = 0; i < TOTAL_FEATURES; i++) {
            const d = frameVec[i] - prevFrameRef.current[i];
            motionSum += d * d;
          }
          const motion = Math.sqrt(motionSum);
          if (motion < FRAME_SKIP_THRESHOLD) {
            shouldSend = false; // ⭐ Skip: barely any movement
          }
        }
        prevFrameRef.current = [...frameVec];

        if (shouldSend && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ landmarks: frameVec }));
        }
      } else {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ landmarks: null }));
        }
      }
      canvasCtx.restore();
    });

    // 4. Initialize Camera
    let camera = null;
    if (videoElement) {
      camera = new Camera(videoElement, {
        onFrame: async () => {
          await holistic.send({ image: videoElement });
        },
        width: 640,
        height: 480
      });
      camera.start();
    }

    return () => {
      if (camera) camera.stop();
      holistic.close();
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  return (
    <div style={styles.pageContainer} className="animate-fadeY responsive-grid">
      
      {/* Visual Camera HUD Layout */}
      <div style={styles.hudWrapper}>
        <div style={styles.topBar}>
          <span style={styles.liveIndicator}>
            <span style={styles.redDot}></span> LIVE
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", letterSpacing: "1px" }}>HOLISTIC AI . 153 FEATURES</span>
        </div>

        <div style={styles.cameraBox}>
          {!isModelLoaded && <p style={{ position: "absolute", zIndex: 10 }}>Initializing MediaPipe Holistic...</p>}
          <video ref={videoRef} autoPlay playsInline style={{ display: "none" }} />
          <canvas ref={canvasRef} width="640" height="480" style={styles.canvas} />
          
          {/* Subtle vignette over the camera */}
          <div style={styles.vignette}></div>
        </div>
      </div>

      {/* Massive Typographic Output Area */}
      <div style={styles.outputArea}>
        <p style={styles.outputLabel}>DETECTED TRANSLATION</p>
        <h2 style={{...styles.textOutput, opacity: text ? 1 : 0.3}}>
          {text || "Waiting for user input..."}
        </h2>
        
        <div style={styles.controlsRow}>
          {/* Auto-Read Toggle */}
          <div style={styles.toggleWrapper}>
            <span style={styles.toggleLabel}>AUTO-READ</span>
            <button
              id="auto-read-toggle"
              style={{
                ...styles.toggleTrack,
                background: autoSpeak
                  ? "linear-gradient(135deg, #34c759, #30d158)"
                  : "rgba(255,255,255,0.1)",
              }}
              onClick={() => {
                const next = !autoSpeak;
                setAutoSpeak(next);
                autoSpeakRef.current = next;
              }}
              aria-label="Toggle auto-read"
            >
              <span
                style={{
                  ...styles.toggleThumb,
                  transform: autoSpeak ? "translateX(22px)" : "translateX(2px)",
                }}
              />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

const styles = {
  pageContainer: {
    width: "100%",
    maxWidth: "1200px",
    alignItems: "center",
    padding: "0 20px",
  },
  hudWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 5px",
  },
  liveIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.85rem",
    fontWeight: "600",
    letterSpacing: "1px",
    color: "#ff3b30",
  },
  redDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "#ff3b30",
    borderRadius: "50%",
    boxShadow: "0 0 8px #ff3b30",
    animation: "fadeIn 1s infinite alternate",
  },
  cameraBox: {
    position: "relative",
    width: "100%",
    aspectRatio: "4/3",
    backgroundColor: "#000",
    border: "1px solid var(--border-light)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)", // Mirror
    filter: "grayscale(30%) contrast(1.1)", // Gives it a more cinematic/HUD feel
  },
  vignette: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle, transparent 50%, rgba(0,0,0,0.8) 150%)",
    pointerEvents: "none",
  },
  outputArea: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    alignItems: "flex-start",
  },
  outputLabel: {
    fontSize: "0.9rem",
    fontWeight: "500",
    letterSpacing: "0.2em",
    color: "var(--text-dim)",
    margin: 0,
  },
  textOutput: {
    fontSize: "clamp(3rem, 6vw, 5rem)",
    fontWeight: "800",
    lineHeight: "1.1",
    letterSpacing: "-0.04em",
    color: "var(--text-main)",
    margin: 0,
  },
  controlsRow: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    marginTop: "20px",
    flexWrap: "wrap",
  },

  toggleWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  toggleLabel: {
    fontSize: "0.8rem",
    fontWeight: "600",
    letterSpacing: "0.15em",
    color: "var(--text-dim)",
  },
  toggleTrack: {
    width: "48px",
    height: "26px",
    borderRadius: "13px",
    border: "1px solid rgba(255,255,255,0.15)",
    cursor: "pointer",
    position: "relative",
    transition: "background 0.3s ease",
    padding: 0,
  },
  toggleThumb: {
    display: "block",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#fff",
    position: "absolute",
    top: "2px",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
  }
};