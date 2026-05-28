import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import traceback

try:
    import tensorflow as tf
    import numpy as np

    interpreter = tf.lite.Interpreter(model_path=r'd:\mini project\final\ai_model\truesign_words.tflite')
    interpreter.allocate_tensors()
    inp = interpreter.get_input_details()
    out = interpreter.get_output_details()

    with open(r'd:\mini project\final\model_check_output.txt', 'w') as f:
        f.write(f"INPUT_SHAPE: {inp[0]['shape']}\n")
        f.write(f"INPUT_DTYPE: {inp[0]['dtype']}\n")
        f.write(f"OUTPUT_SHAPE: {out[0]['shape']}\n")
        f.write(f"OUTPUT_DTYPE: {out[0]['dtype']}\n")
        
        labels = np.load(r'd:\mini project\final\ai_model\labels_seq.npy', allow_pickle=True)
        f.write(f"LABELS_COUNT: {len(labels)}\n")
        f.write(f"LABELS: {list(labels)}\n")
        f.write(f"OUTPUT_CLASSES: {out[0]['shape'][-1]}\n")
        f.write(f"MATCH: {len(labels) == out[0]['shape'][-1]}\n")
        
        # Test inference
        input_shape = inp[0]['shape']
        test_input = np.random.rand(*input_shape).astype(np.float32)
        interpreter.set_tensor(inp[0]['index'], test_input)
        interpreter.invoke()
        result = interpreter.get_tensor(out[0]['index'])
        f.write(f"TEST_OUTPUT_SHAPE: {result.shape}\n")
        f.write(f"TEST_OUTPUT_SUM: {result.sum():.4f}\n")
        f.write("STATUS: SUCCESS\n")
    print("DONE - check model_check_output.txt")
except Exception as e:
    with open(r'd:\mini project\final\model_check_output.txt', 'w') as f:
        f.write(f"ERROR: {str(e)}\n")
        f.write(traceback.format_exc())
    print(f"ERROR: {e}")
