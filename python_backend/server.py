from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import pandas as pd
import pickle
import os
import traceback
import sys
import io

# Ensure the default encoding is set to UTF-8 for stdout and stderr
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# For PyInstaller, set the path to _MEIPASS when frozen
if getattr(sys, 'frozen', False):  # If running as a PyInstaller bundle
    script_dir = sys._MEIPASS
else:
    script_dir = os.path.dirname(os.path.realpath(__file__))

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow warnings
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN optimizations

app = Flask(__name__)

# Load your trained models using absolute paths based on the current script location
max_rising_slope_model_path = os.path.join(script_dir, 'Trained Models', 'Max Rising Slope.h5')
soak_time_model_path = os.path.join(script_dir, 'Trained Models', 'Soak Time.h5')
reflow_time_model_path = os.path.join(script_dir, 'Trained Models', 'Reflow Time.h5')
peak_temp_model_path = os.path.join(script_dir, 'Trained Models', 'Peak Temp.h5')

# Load the models
try:
    max_rising_slope_model = tf.keras.models.load_model(max_rising_slope_model_path)
    soak_time_model = tf.keras.models.load_model(soak_time_model_path)
    reflow_time_model = tf.keras.models.load_model(reflow_time_model_path)
    peak_temp_model = tf.keras.models.load_model(peak_temp_model_path)
except Exception as e:
    print(f"Error loading models: {e}")
    traceback.print_exc()

# Load scalers at the global level
scaler_X, scaler_max_rising_slope, scaler_soak_time, scaler_reflow_time, scaler_peak_temp = None, None, None, None, None

# Load pre-fitted scalers from the 'Scaled data' folder using absolute paths
try:
    # Load pre-fitted scalers from the 'Scaled data' folder using absolute paths
    with open(os.path.join(script_dir, 'Scaled data', 'features.pkl'), 'rb') as f:
        scaler_X = pickle.load(f)

    with open(os.path.join(script_dir, 'Scaled data', 'max rising slope.pkl'), 'rb') as f:
        scaler_max_rising_slope = pickle.load(f)

    with open(os.path.join(script_dir, 'Scaled data', 'soak time.pkl'), 'rb') as f:
        scaler_soak_time = pickle.load(f)

    with open(os.path.join(script_dir, 'Scaled data', 'reflow time.pkl'), 'rb') as f:
        scaler_reflow_time = pickle.load(f)

    with open(os.path.join(script_dir, 'Scaled data', 'peak_temp.pkl'), 'rb') as f:
        scaler_peak_temp = pickle.load(f)

    print("Scalers loaded successfully")

except Exception as e:
    print(f"Error loading scalers: {e}")
    traceback.print_exc()

# Preprocessing function
def preprocess_data(data):
    renamed_data = {
        'Area': data['width'] * data['length'],  # Calculate the area as width * length
        'Cu_Thickness_Outer_Modified': data['cuOuter'] * 10**-6 if data['layers'] == 1 else data['cuOuter'] * 2 * 10**-6,
        'Cu_Thickness_Inner_Modified': (data['layers'] - 2) * data['cuInner'] * 10**-6 if data['layers'] > 2 else 0,
        'Thickness (mm)': data['thickness'],
        'Layers': data['layers'],
        'T1(Degree Celsius)': data['t1'],
        'T2(Degree Celsius)': data['t2'],
        'T3(Degree Celsius)': data['t3'],
        'T4(Degree Celsius)': data['t4'],
        'T5(Degree Celsius)': data['t5'],
        'T6(Degree Celsius)': data['t6'],
        'T7(Degree Celsius)': data['t7'],
        'T8(Degree Celsius)': data['t8'],
        'T9(Degree Celsius)': data['t9'],
        'T10(Degree Celsius)': data['t10'],
        'Conveyar Speed(mm/min)': data['conveyorSpeed']
    }

    # One-hot encode 'Solder Paste Type'
    if data['solderPasteType'] == 'Koki S3X58-M406-3':
        renamed_data['Koki S3X58-M406-3'] = 1
        renamed_data['QUALITEK 6701 NC SnPb'] = 0
    else:
        renamed_data['Koki S3X58-M406-3'] = 0
        renamed_data['QUALITEK 6701 NC SnPb'] = 1

    # Convert to DataFrame
    df = pd.DataFrame([renamed_data])

    # Order the columns based on the original order used during model training
    correct_order = [
        'Area',
        'Cu_Thickness_Outer_Modified',
        'Cu_Thickness_Inner_Modified',
        'Koki S3X58-M406-3',
        'QUALITEK 6701 NC SnPb',
        'Thickness (mm)',
        'Layers',
        'T1(Degree Celsius)',
        'T2(Degree Celsius)',
        'T3(Degree Celsius)',
        'T4(Degree Celsius)',
        'T5(Degree Celsius)',
        'T6(Degree Celsius)',
        'T7(Degree Celsius)',
        'T8(Degree Celsius)',
        'T9(Degree Celsius)',
        'T10(Degree Celsius)',
        'Conveyar Speed(mm/min)'
    ]

    # Reorder the dataframe to match the correct order
    df = df[correct_order]
    return df

# API route for predictions
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Check if scalers were loaded correctly
        if scaler_X is None or scaler_max_rising_slope is None:
            raise ValueError("Scalers were not loaded correctly.")
        
        # Get the input data from the request
        data = request.json
        print("Received data:", data)  # Log the data for debugging

        # Preprocess the data
        processed_data = preprocess_data(data)

        # Scale the input features
        input_features_scaled = scaler_X.transform(processed_data)

        # Make predictions using the loaded models
        max_rising_slope_scaled = max_rising_slope_model.predict(input_features_scaled)[0][0]
        soak_time_scaled = soak_time_model.predict(input_features_scaled)[0][0]
        reflow_time_scaled = reflow_time_model.predict(input_features_scaled)[0][0]
        peak_temp_scaled = peak_temp_model.predict(input_features_scaled)[0][0]

        # Inverse transform the predictions to their original scale
        max_rising_slope = scaler_max_rising_slope.inverse_transform([[max_rising_slope_scaled]])[0][0]
        soak_time = scaler_soak_time.inverse_transform([[soak_time_scaled]])[0][0]
        reflow_time = scaler_reflow_time.inverse_transform([[reflow_time_scaled]])[0][0]
        peak_temp = scaler_peak_temp.inverse_transform([[peak_temp_scaled]])[0][0]

        # Return the predictions in a JSON response
        return jsonify({
            'max_rising_slope': max_rising_slope,
            'soak_time': soak_time,
            'reflow_time': reflow_time,
            'peak_temp': peak_temp
        })

    except Exception as e:
        print(f"Error during prediction: {e}")  # Log the error
        traceback.print_exc()  # Print the full traceback
        return jsonify({'error': 'Prediction failed!'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, use_reloader=False)
