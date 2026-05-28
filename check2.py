import os, sys, traceback
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

outf = open(os.path.join(os.path.dirname(__file__), 'check2_out.txt'), 'w', encoding='ascii', errors='replace')

try:
    import tensorflow as tf
    import numpy as np
    
    # First try loading the tflite model
    tflite_path = os.path.join(os.path.dirname(__file__), 'ai_model', 'truesign_words.tflite')
    outf.write(f"TFLITE_EXISTS: {os.path.exists(tflite_path)}\n")
    outf.write(f"TFLITE_SIZE: {os.path.getsize(tflite_path)} bytes\n")
    
    try:
        interpreter = tf.lite.Interpreter(model_path=tflite_path)
        interpreter.allocate_tensors()
        inp = interpreter.get_input_details()
        outp = interpreter.get_output_details()
        outf.write(f"TFLITE_INPUT_SHAPE: {list(inp[0]['shape'])}\n")
        outf.write(f"TFLITE_OUTPUT_SHAPE: {list(outp[0]['shape'])}\n")
        outf.write("TFLITE_STATUS: OK\n")
    except Exception as e:
        outf.write(f"TFLITE_ERROR: {str(e)}\n")
        outf.write("TFLITE_STATUS: FAILED\n")
    
    # Try Keras model
    keras_path = os.path.join(os.path.dirname(__file__), 'ai_model', 'truesign_words.keras')
    outf.write(f"KERAS_EXISTS: {os.path.exists(keras_path)}\n")
    
    # Check labels
    labels_path = os.path.join(os.path.dirname(__file__), 'ai_model', 'labels_seq.npy')
    labels = np.load(labels_path, allow_pickle=True)
    outf.write(f"LABELS_COUNT: {len(labels)}\n")
    outf.write(f"LABELS: {list(labels)}\n")
    
except Exception as e:
    outf.write(f"FATAL_ERROR: {str(e)}\n")
    outf.write(traceback.format_exc())

outf.write("SCRIPT_DONE\n")
outf.close()
print("Script complete")
