# Sign-to-Text Diagnosis: No Output & Slow Video

## Root Causes Found

### 🔴 Problem 1: TFLite Model is BROKEN (Critical — No Output)

The `.tflite` model **cannot run at all**. It crashes with:

```
Select TensorFlow op(s), included in the given model, is(are) not supported by this interpreter.
Node number 0 (FlexTensorListReserve) failed to prepare.
```

This means the TFLite conversion used **Flex ops** (like `TensorListReserve` from the Bi-LSTM) that require the **Flex delegate** — which is NOT available in standard `tf.lite.Interpreter`.

**What happens in your backend:**
- [medium_gateway.py](file:///d:/mini%20project/final/truesign-backend/medium_gateway.py#L37-L59): It checks `os.path.exists(TFLITE_PATH)` → **True** (the file exists)
- It tries to load the TFLite interpreter → **crashes on `allocate_tensors()`** → the backend **never starts**
- The WebSocket `/ws/predict` **never becomes available**
- Frontend sends landmarks but there's **nobody listening** → No output

> [!CAUTION]
> The backend is crashing at startup because the TFLite model uses unsupported Flex ops. **This is why you get zero output** — the entire backend is dead.

---

### 🟡 Problem 2: Slow / Frame-wise Video (MediaPipe Holistic is Heavy)

MediaPipe **Holistic** (hands + pose + face) running in the browser is significantly heavier than just Hands:
- It downloads and runs **3 ML models** simultaneously (pose, face mesh, hand)
- `modelComplexity: 1` is the medium setting — camera processes at ~8-15 FPS in-browser
- The `@mediapipe/camera_utils` Camera class sends frames sequentially with `await holistic.send()`, so each frame must finish processing before the next one starts

This is **normal behavior** for Holistic in-browser — it's compute-intensive. The "frame-wise" feel is expected.

---

## Fixes

### Fix 1: Make the backend use Keras (not broken TFLite)

In [medium_gateway.py](file:///d:/mini%20project/final/truesign-backend/medium_gateway.py#L37), the TFLite check needs to actually **test** the model, not just check if the file exists. The simplest fix: **skip TFLite and use Keras directly**.

```diff
- use_tflite = os.path.exists(TFLITE_PATH)
+ use_tflite = False  # TFLite model has unsupported Flex ops, use Keras
```

Or properly rebuild the TFLite model without Flex ops (requires changing the model architecture to avoid `TensorListReserve`).

### Fix 2: Improve video smoothness

Options (from easiest to hardest):
1. **Lower `modelComplexity` to `0`** — faster but less accurate
2. **Lower camera resolution** to 320×240 — less pixels to process
3. **Use `@mediapipe/hands` instead of Holistic** for frontend extraction — much lighter, extract pose/face server-side
4. **Send every 2nd frame** to Holistic — show raw video on odd frames

---

## Recommended Action

> [!IMPORTANT]
> **Step 1:** Fix the backend by falling back to Keras. This will restore prediction output immediately.
> **Step 2:** Optionally improve video FPS with the suggestions above.

Should I apply these fixes now?
