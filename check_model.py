import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import tensorflow as tf
import numpy as np

model = tf.keras.models.load_model(r'd:\mini project\final\ai_model\truesign_words.keras')
print(f"INPUT: {model.input_shape}")
print(f"OUTPUT: {model.output_shape}")

# Also check the labels
labels = np.load(r'd:\mini project\True_Sign\data\processed\labels_seq.npy')
print(f"LABELS: {labels}")
print(f"LABEL_COUNT: {len(labels)}")
