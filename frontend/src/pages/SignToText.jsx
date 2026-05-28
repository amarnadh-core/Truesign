import { useRef, useEffect, useState } from "react";
import FeatureLayout from "../components/FeatureLayout";
import { Holistic, HAND_CONNECTIONS, POSE_CONNECTIONS } from "@mediapipe/holistic";
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

const FRAME_SKIP_THRESHOLD = 0.01;

export default function SignToText() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null); 
  const prevFrameRef = useRef(null);  // Tracker for motion detection
  const [text, setText] = useState("");
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");

    // 1. Initialize WebSocket
    const wsUrl = `ws://${window.location.hostname}:8000/ws/predict`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.word) {
        setText(data.word); 
      }
    };

    // 2. Initialize MediaPipe Holistic
    const holistic = new Holistic({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    });

    holistic.setOptions({
      modelComplexity: 0,            // ⭐ 0 = lite (faster), 1 = full (slower)
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      smoothLandmarks: true,
      selfieMode: true,              // ⭐ CRITICAL for accuracy: mirrors the frame to match Python's cv2.flip
    });

    // 3. Extraction & Transmission Loop
    let frameCounter = 0;
    holistic.onResults((results) => {
      setIsModelLoaded(true);
      frameCounter++;
      
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      // Draw left hand
      if (results.leftHandLandmarks) {
        drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, { color: "#7cff67", lineWidth: 3 });
        drawLandmarks(canvasCtx, results.leftHandLandmarks, { color: "#ffffff", lineWidth: 1, radius: 3 });
      }
      // Draw right hand
      if (results.rightHandLandmarks) {
        drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, { color: "#7cff67", lineWidth: 3 });
        drawLandmarks(canvasCtx, results.rightHandLandmarks, { color: "#ffffff", lineWidth: 1, radius: 3 });
      }
      // Draw pose
      if (results.poseLandmarks) {
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: "rgba(245, 117, 66, 0.5)", lineWidth: 2 });
      }

      const handsDetected = results.leftHandLandmarks || results.rightHandLandmarks;

      if (handsDetected) {
        const frameVec = new Array(TOTAL_FEATURES).fill(0);
        let offset = 0;

        // Left hand
        if (results.leftHandLandmarks) {
          const lh = extractHandLandmarks(results.leftHandLandmarks);
          for (let i = 0; i < HAND_FEATURES; i++) frameVec[offset + i] = lh[i];
        }
        offset += HAND_FEATURES;

        // Right hand
        if (results.rightHandLandmarks) {
          const rh = extractHandLandmarks(results.rightHandLandmarks);
          for (let i = 0; i < HAND_FEATURES; i++) frameVec[offset + i] = rh[i];
        }
        offset += HAND_FEATURES;

        // Pose anchors
        if (results.poseLandmarks) {
          for (let i = 0; i < POSE_INDICES.length; i++) {
            const lm = results.poseLandmarks[POSE_INDICES[i]];
            frameVec[offset + i * 3]     = lm.x;
            frameVec[offset + i * 3 + 1] = lm.y;
            frameVec[offset + i * 3 + 2] = lm.z;
          }
        }
        offset += POSE_FEATURES;

        // Face anchors
        if (results.faceLandmarks) {
          for (let i = 0; i < FACE_INDICES.length; i++) {
            const lm = results.faceLandmarks[FACE_INDICES[i]];
            frameVec[offset + i * 3]     = lm.x;
            frameVec[offset + i * 3 + 1] = lm.y;
            frameVec[offset + i * 3 + 2] = lm.z;
          }
        }

        // Motion detection / frame skip
        let shouldSend = true;
        if (prevFrameRef.current) {
          let motionSum = 0;
          for (let i = 0; i < TOTAL_FEATURES; i++) {
            const d = frameVec[i] - prevFrameRef.current[i];
            motionSum += d * d;
          }
          if (Math.sqrt(motionSum) < FRAME_SKIP_THRESHOLD) {
            shouldSend = false;
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
        width: 480,              // ⭐ Reduced from 640 for faster processing
        height: 360              // ⭐ Reduced from 480 for faster processing
      });
      camera.start();
    }

    return () => {
      if (camera) camera.stop();
      holistic.close();
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  const speakText = () => {
    if (!text) {
      alert("No sign translated to text yet!");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <FeatureLayout title="Sign to Text">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {!isModelLoaded && <p style={styles.loadingText}>Loading AI Model & Camera...</p>}
        
        <div style={styles.videoContainer}>
          <video ref={videoRef} autoPlay playsInline style={{ display: "none" }} />
          <canvas ref={canvasRef} width="640" height="480" style={styles.canvas} />
        </div>

        <div style={styles.outputBox}>
          <p style={{ margin: 0, opacity: 0.8 }}>Detected Text:</p>
          <p style={styles.textOutput}>{text || "Waiting for gestures..."}</p>
        </div>

        <button style={styles.button} onClick={speakText}>
          🔊 Convert to Speech
        </button>

      </div>
    </FeatureLayout>
  );
}

const styles = {
  loadingText: {
    color: "#7cff67",
    marginBottom: "15px",
    fontWeight: "bold",
  },
  videoContainer: {
    width: "100%",
    maxWidth: "500px",
    borderRadius: "15px",
    overflow: "hidden",
    border: "2px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    background: "black",
    marginBottom: "20px",
  },
  canvas: {
    width: "100%",
    display: "block",
  },
  outputBox: {
    width: "100%",
    maxWidth: "500px",
    background: "rgba(0,0,0,0.4)",
    padding: "15px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    marginBottom: "20px",
    textAlign: "left",
  },
  textOutput: {
    fontSize: "1.4rem",
    fontWeight: "bold",
    color: "#7cff67",
    margin: "10px 0 0 0",
  },
  button: {
    padding: "15px 30px",
    background: "#7cff67",
    color: "#000",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "1.1rem",
    transition: "0.2s",
    boxShadow: "0 4px 15px rgba(124, 255, 103, 0.3)",
  }
};