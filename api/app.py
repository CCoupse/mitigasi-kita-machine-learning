import os
import logging
import numpy as np
import pandas as pd
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import requests
from datetime import datetime

# Konfigurasi logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s: %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Inisialisasi Flask app
app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "http://localhost:8000"}})

# Path model dan data
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'model_dnn.h5')
PREPROCESSOR_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'preprocessor.pkl')
LABEL_ENCODER_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'label_encoder.pkl')

# API Key OpenWeatherMap
OPENWEATHERMAP_API_KEY = "78d579463368f92711d8f7f9be8a85d0"

# Load model, preprocessor, dan label encoder
logger.info(f'Loading model from {MODEL_PATH}')
model = tf.keras.models.load_model(MODEL_PATH)
logger.info(f'Loading preprocessor from {PREPROCESSOR_PATH}')
preprocessor = joblib.load(PREPROCESSOR_PATH)
logger.info(f'Loading label encoder from {LABEL_ENCODER_PATH}')
label_encoder = joblib.load(LABEL_ENCODER_PATH)
logger.info('Model, preprocessor, and label encoder loaded successfully.')

# Fungsi untuk mendapatkan data cuaca
def get_weather_data(latitude, longitude):
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={OPENWEATHERMAP_API_KEY}&units=metric"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        logger.info(f"Weather data retrieved: {data}")
        return {
            'temperature': data['main']['temp'],
            'humidity': data['main']['humidity'],
            'weather': data['weather'][0]['main']
        }
    except Exception as e:
        logger.error(f'Error fetching weather data: {e}')
        return {'temperature': 25.0, 'humidity': 70, 'weather': 'Clear'}

# Fungsi prediksi
def predict_risk(latitude, longitude, magnitude=None, depth=None):
    try:
        weather_data = get_weather_data(latitude, longitude)
        input_data = pd.DataFrame({
            'latitude': [latitude],
            'longitude': [longitude],
            'magnitude': [magnitude if magnitude else 0.0],
            'depth': [depth if depth else 0.0],
            'temperature': [weather_data['temperature']],
            'humidity': [weather_data['humidity']]
        })
        processed_data = preprocessor.transform(input_data)
        prediction = model.predict(processed_data)
        predicted_class = np.argmax(prediction, axis=1)[0]
        confidence = prediction[0][predicted_class]
        risk_level = label_encoder.inverse_transform([predicted_class])[0]
        return {
            'prediksi_risiko': risk_level,
            'tingkat_keyakinan': float(confidence)
        }
    except Exception as e:
        logger.error(f'Prediction error: {e}')
        return {'prediksi_risiko': 'ERROR', 'tingkat_keyakinan': 0.0}

# Endpoint home
@app.route('/')
def home():
    logger.info('Received request to home endpoint')
    return jsonify({'message': 'MitigasiKita API is running'})

# Endpoint prediksi
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        if not data or 'latitude' not in data or 'longitude' not in data:
            return jsonify({'error': 'Missing required fields (latitude, longitude)'}), 400
        latitude = float(data['latitude'])
        longitude = float(data['longitude'])
        magnitude = data.get('magnitude_aktual')
        depth = data.get('kedalaman_aktual')
        result = predict_risk(latitude, longitude, magnitude, depth)
        logger.info(f'Prediction result: {result}')
        return jsonify(result)
    except Exception as e:
        logger.error(f'Error in predict endpoint: {e}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info('Starting Flask server')
    app.run(debug=True, host='0.0.0.0', port=5000)