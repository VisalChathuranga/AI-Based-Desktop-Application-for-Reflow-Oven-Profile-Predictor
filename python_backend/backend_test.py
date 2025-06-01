import tensorflow as tf
import numpy as np
import pandas as pd
import pickle
from sklearn.preprocessing import MinMaxScaler

# Load your trained models (update paths if necessary)
max_rising_slope_model = tf.keras.models.load_model('D:/aaaaaa/Max Rising Slope.h5')
soak_time_model = tf.keras.models.load_model('D:/aaaaaa/Soak Time.h5')
reflow_time_model = tf.keras.models.load_model('D:/aaaaaa/Reflow Time.h5')
peak_temp_model = tf.keras.models.load_model('D:/aaaaaa/Peak Temp.h5')

# Load pre-fitted scalers from the 'Scaled data' folder
with open('Scaled data/features.pkl', 'rb') as f:
    scaler_X = pickle.load(f)

with open('Scaled data/max rising slope.pkl', 'rb') as f:
    scaler_max_rising_slope = pickle.load(f)

with open('Scaled data/soak time.pkl', 'rb') as f:
    scaler_soak_time = pickle.load(f)

with open('Scaled data/reflow time.pkl', 'rb') as f:
    scaler_reflow_time = pickle.load(f)

with open('Scaled data/peak_temp.pkl', 'rb') as f:
    scaler_peak_temp = pickle.load(f)

def preprocess_data(data):
    # Create a new dictionary with the correct feature names and order based on your provided features
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
    # Ensure all possible categories exist in the dictionary and are set to 0 if not applicable
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

def get_predictions(input_data):
    try:
        # Preprocess the data
        processed_data = preprocess_data(input_data)

        # Scale the input features using the pre-fitted scaler
        input_features_scaled = scaler_X.transform(processed_data)

        # Make predictions using the loaded models
        max_rising_slope_scaled = max_rising_slope_model.predict(input_features_scaled)[0][0]
        soak_time_scaled = soak_time_model.predict(input_features_scaled)[0][0]
        reflow_time_scaled = reflow_time_model.predict(input_features_scaled)[0][0]
        peak_temp_scaled = peak_temp_model.predict(input_features_scaled)[0][0]

        # Inverse transform the predictions using the respective scalers
        max_rising_slope = scaler_max_rising_slope.inverse_transform([[max_rising_slope_scaled]])[0][0]
        soak_time = scaler_soak_time.inverse_transform([[soak_time_scaled]])[0][0]
        reflow_time = scaler_reflow_time.inverse_transform([[reflow_time_scaled]])[0][0]
        peak_temp = scaler_peak_temp.inverse_transform([[peak_temp_scaled]])[0][0]

        # Print the predictions
        print(f'Max Rising Slope: {max_rising_slope}')
        print(f'Soak Time: {soak_time}')
        print(f'Reflow Time: {reflow_time}')
        print(f'Peak Temp: {peak_temp}')
    except Exception as e:
        # Log any exceptions for debugging
        print(f"Error during prediction: {e}")

if __name__ == '__main__':
    # Command-line input for testing
    try:
        length = float(input('Enter length: '))
        width = float(input('Enter width: '))
        thickness = float(input('Enter thickness: '))
        layers = int(input('Enter number of layers: '))
        cu_outer = float(input('Enter outer copper thickness: '))
        cu_inner = float(input('Enter inner copper thickness: '))
        solder_paste = input('Enter solder paste type: ')

        # T1 to T10 and Conveyor Speed inputs
        t_values = {f't{i}': float(input(f'Enter t{i} value: ')) for i in range(1, 11)}
        conveyor_speed = float(input('Enter conveyor speed: '))

        # Combine input data into a dictionary
        input_data = {
            'length': length,
            'width': width,
            'thickness': thickness,
            'layers': layers,
            'cuOuter': cu_outer,
            'cuInner': cu_inner,
            'solderPasteType': solder_paste,
            'conveyorSpeed': conveyor_speed,
            **t_values
        }

        # Get the predictions
        get_predictions(input_data)

    except ValueError:
        print("Invalid input. Please enter the correct data format.")
