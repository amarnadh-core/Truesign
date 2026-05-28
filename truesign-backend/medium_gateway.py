from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import os
import time
from collections import deque

app = FastAPI(title="TrueSign Medium Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 🧠 AI MODEL SETUP (Holistic 153 features)
# ==========================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KERAS_PATH = os.path.join(BASE_DIR, "ai_model", "truesign_words.keras")
LABELS_PATH = os.path.join(BASE_DIR, "ai_model", "labels_seq.npy")

# ⭐ Holistic feature layout (must match frontend + data collector)
HAND_FEATURES = 63          # 21 * 3
POSE_FEATURES = 12          # 4 * 3
FACE_FEATURES = 15          # 5 * 3
FEATURES = HAND_FEATURES * 2 + POSE_FEATURES + FACE_FEATURES  # 153

# ⭐ Latency optimizations
FRAME_SKIP_THRESHOLD = 0.01   # Skip frame processing when motion is very low
MOTION_THRESHOLD = 0.02       # Minimum motion to count as "active"

# ⭐ Load Keras model directly
import tensorflow as tf
from tensorflow.keras import layers

# ⭐ Custom attention layer (must match training code exactly)
class ScaledDotProductAttention(layers.Layer):
    def __init__(self, units, **kwargs):
        super().__init__(**kwargs)
        self.units = units
        self.query_dense = layers.Dense(units, use_bias=False)
        self.key_dense   = layers.Dense(units, use_bias=False)
        self.value_dense = layers.Dense(units, use_bias=False)
        self.scale = float(units) ** 0.5

    def call(self, x):
        Q = self.query_dense(x)
        K = self.key_dense(x)
        V = self.value_dense(x)
        scores = tf.matmul(Q, K, transpose_b=True) / self.scale
        weights = tf.nn.softmax(scores, axis=-1)
        return tf.matmul(weights, V)

    def get_config(self):
        config = super().get_config()
        config.update({"units": self.units})
        return config

print(f"🔄 Loading Keras model from {KERAS_PATH}...")

# Prevent TensorFlow from allocating all GPU memory
physical_devices = tf.config.list_physical_devices('GPU')
if physical_devices:
    try:
        for device in physical_devices:
            tf.config.experimental.set_memory_growth(device, True)
    except:
        pass

model = tf.keras.models.load_model(
    KERAS_PATH,
    custom_objects={"ScaledDotProductAttention": ScaledDotProductAttention}
)

def predict(input_seq):
    return model.predict(input_seq, verbose=0)[0]

print(f"✅ Keras model loaded from {KERAS_PATH}")

print("🔄 Loading labels...")
labels = np.load(LABELS_PATH)
print(f"✅ AI module ready! Loaded {len(labels)} labels: {list(labels)}")
print(f"📐 Model expects {FEATURES} features per frame (Holistic)")

SEQ_LEN = 60
CONF_THRESHOLD = 0.60
SMOOTHING_WINDOW = 5
IDLE_RESET_TIME = 2.0

# ==========================================
# 🚦 THE MEDIUM: SIGN TO TEXT (Holistic 153)
# ==========================================
@app.websocket("/ws/predict")
async def sign_to_text_medium(websocket: WebSocket):
    await websocket.accept()
    print("🟢 React Frontend Connected to Sign-to-Text Medium!")

    sequence = deque(maxlen=SEQ_LEN)
    pred_history = deque(maxlen=SMOOTHING_WINDOW)

    # ⭐ Pre-allocate buffers for efficiency (avoid per-frame allocations)
    prev_frame = np.zeros(FEATURES, dtype=np.float32)
    has_prev = False
    last_motion_time = time.time()
    skip_next = False            # ⭐ Frame skipping flag

    current_word = ""

    try:
        while True:
            # 1. Receive frame data from frontend
            data = await websocket.receive_json()
            landmarks = data.get("landmarks")

            if landmarks:
                # ⭐ landmarks is a list of 153 floats:
                #    [0:63]   = left hand  (wrist-normalized by frontend)
                #    [63:126] = right hand  (wrist-normalized by frontend)
                #    [126:138] = pose anchors (raw x,y,z)
                #    [138:153] = face anchors (raw x,y,z)

                if len(landmarks) != FEATURES:
                    continue

                frame_vec = np.array(landmarks, dtype=np.float32)

                # ⭐ Frame skipping: if flagged, just append but skip prediction
                if skip_next:
                    skip_next = False
                    sequence.append(frame_vec)
                    np.copyto(prev_frame, frame_vec)
                    has_prev = True
                    continue

                # Motion detection
                if has_prev:
                    motion = np.linalg.norm(frame_vec - prev_frame)
                    if motion > MOTION_THRESHOLD:
                        last_motion_time = time.time()
                    elif motion < FRAME_SKIP_THRESHOLD:
                        skip_next = True  # ⭐ Skip next frame if barely moving

                np.copyto(prev_frame, frame_vec)
                has_prev = True
                sequence.append(frame_vec)

                # Predict when buffer full
                if len(sequence) == SEQ_LEN:
                    input_seq = np.expand_dims(np.array(sequence), axis=0)  # shape (1, SEQ_LEN, 153)

                    try:
                        t0 = time.time()
                        res = predict(input_seq)
                        infer_ms = (time.time() - t0) * 1000
                        conf = float(np.max(res))
                        idx = int(np.argmax(res))

                        if conf > CONF_THRESHOLD:
                            pred_history.append(idx)

                            # Smoothing: require 3/5 consistent predictions
                            if pred_history.count(idx) >= 3:
                                if idx < len(labels):
                                    new_word = labels[idx]

                                    if new_word != current_word:
                                        current_word = new_word
                                        print(f"✨ AI Predicted: '{current_word}' (Conf: {conf:.2f}, Infer: {infer_ms:.0f}ms)")
                                        await websocket.send_json({"word": current_word})

                                        # Clear to prevent repeating
                                        sequence.clear()
                                        pred_history.clear()
                                else:
                                    print(f"⚠️ Model predicted class {idx}, but labels only has {len(labels)} items!")
                                    sequence.clear()
                                    pred_history.clear()
                    except Exception as e:
                        print(f"⚠️ Prediction error: {e}")

                # Idle reset
                if time.time() - last_motion_time > IDLE_RESET_TIME:
                    sequence.clear()
                    pred_history.clear()

            else:
                has_prev = False

    except WebSocketDisconnect:
        print("🔴 Frontend disconnected from Sign-to-Text.")