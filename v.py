import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import tensorflow as tf
import numpy as np

model = tf.keras.models.load_model(r'd:\mini project\final\ai_model\truesign_words.keras')
labels = np.load(r'E:\true\processed_seq\labels_seq.npy')

with open('v_clean.txt', 'w', encoding='utf-8') as f:
    f.write("=== VERIFICATION ===\n")
    f.write(f"LABELS LEN: {len(labels)}\n")
    f.write(f"OUTPUT SHAPE: {model.output_shape}\n")
    f.write(f"LABELS: {list(labels)}\n")
