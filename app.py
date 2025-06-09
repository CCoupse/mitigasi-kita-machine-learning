from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
import tensorflow as tf
import joblib
import os
import logging
import requests
from geopy.geocoders import Nominatim
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Konfigurasi logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Path model dan preprocessor
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'model_dnn.h5')
PREPROCESSOR_PATH = os.path.join(MODEL_DIR, 'preprocessor.pkl')
LABEL_ENCODER_PATH = os.path.join(MODEL_DIR, 'label_encoder.pkl')

# Verifikasi file ada
for path in [MODEL_PATH, PREPROCESSOR_PATH, LABEL_ENCODER_PATH]:
    if not os.path.exists(path):
        logger.error(f"File tidak ditemukan: {path}")
        raise FileNotFoundError(f"File tidak ditemukan: {path}")

# Muat model dan preprocessor
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    label_encoder = joblib.load(LABEL_ENCODER_PATH)
except Exception as e:
    logger.error(f"Gagal memuat model atau preprocessor: {e}")
    raise e

# Tidak perlu API key untuk Open-Meteo
geocoder = Nominatim(user_agent="mitigasi_kita", timeout=5)

# Fungsi utilitas dari notebook
def get_weather_data(latitude, longitude):
    """Mengambil data cuaca dari Open-Meteo API."""
    url = f'https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=auto'
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        daily = data['daily']
        return {
            'temperature_2m_max': daily['temperature_2m_max'][0],
            'temperature_2m_min': daily['temperature_2m_min'][0],
            'precipitation_sum': daily['precipitation_sum'][0],
            'windspeed_10m_max': daily['windspeed_10m_max'][0],
            'weathercode': 800  # Default
        }
    except (requests.RequestException, KeyError, IndexError) as e:
        logger.error(f"Gagal mengambil data cuaca: {e}. Menggunakan nilai default.")
        return {
            'temperature_2m_max': 29.5,
            'temperature_2m_min': 25.3,
            'precipitation_sum': 17.9,
            'windspeed_10m_max': 21.7,
            'weathercode': 800
        }

def get_location_data(latitude, longitude):
    """Mengambil nama lokasi dan kota."""
    try:
        location = geocoder.reverse((latitude, longitude), language="id")
        if location:
            address = location.raw.get("address", {})
            city = address.get("city", address.get("town", address.get("village", "Ambon")))
            location_name = address.get("state", "Banda Sea")
            return location_name, city
        return "Banda Sea", "Ambon"
    except Exception as e:
        logger.error(f"Gagal mengambil data lokasi: {e}")
        return "Banda Sea", "Ambon"

def determine_tsunami_potential(magnitude, depth):
    """Menentukan potensi tsunami."""
    if magnitude > 7 and depth < 30:
        return "Tinggi"
    elif magnitude > 6:
        return "Sedang"
    else:
        return "Rendah"

def prepare_input_data(latitude, longitude):
    """Menyiapkan fitur untuk inferensi."""
    if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
        logger.error("Nilai latitude atau longitude tidak valid")
        raise ValueError("Nilai latitude atau longitude tidak valid")
    
    weather_data = get_weather_data(latitude, longitude)
    location, city = get_location_data(latitude, longitude)
    
    earthquake_features = {
        'magnitude': 4.427889833,
        'mag_type': 'M',
        'depth': 28.0,
        'phasecount': 65,
        'azimuth_gap': 136.0,
        'potensi_tsunami': 'Rendah'
    }
    
    other_features = {
        'location': location,
        'agency': 'BMKG',
        'city': city,
        'potensi_gempa': 'Tidak Diketahui'  # Ditambahkan untuk preprocessor
    }
    
    input_data = {
        'latitude': float(latitude),
        'longitude': float(longitude),
        **weather_data,
        **earthquake_features,
        **other_features
    }
    
    # Pastikan kolom sesuai dengan yang diharapkan oleh preprocessor
    feature_columns = preprocessor.feature_names_in_
    logger.info(f"Kolom yang diharapkan oleh preprocessor: {feature_columns}")
    
    input_df = pd.DataFrame([input_data])
    
    # Sanitasi data: pastikan tipe data benar
    numeric_cols = ['latitude', 'longitude', 'temperature_2m_max', 'temperature_2m_min',
                    'precipitation_sum', 'windspeed_10m_max', 'weathercode', 'magnitude',
                    'depth', 'phasecount', 'azimuth_gap']
    categorical_cols = ['mag_type', 'location', 'agency', 'city', 'potensi_gempa', 'potensi_tsunami']
    
    # Sanitasi kolom numerik
    for col in numeric_cols:
        if col in input_df.columns:
            input_df[col] = pd.to_numeric(input_df[col], errors='coerce').fillna(0).astype(float)
    
    # Sanitasi kolom kategorikal
    for col in categorical_cols:
        if col in input_df.columns:
            input_df[col] = input_df[col].fillna('Tidak Diketahui').astype(str)
    
    # Tambahkan kolom yang hilang dengan nilai default
    for col in feature_columns:
        if col not in input_df.columns:
            if col in numeric_cols:
                input_df[col] = 0.0
            else:
                input_df[col] = 'Tidak Diketahui'
    
    # Hapus kolom yang tidak diharapkan
    input_df = input_df[feature_columns]
    
    logger.info(f"Input data setelah sanitasi (tipe): {input_df.dtypes}")
    logger.info(f"Input data setelah sanitasi (nilai): {input_df}")
    return input_df

@app.route('/predict', methods=['POST'])
def predict():
    """Endpoint untuk prediksi risiko bencana."""
    try:
        data = request.get_json()
        logger.info(f"Menerima data: {data}")
        latitude = float(data.get('latitude'))
        longitude = float(data.get('longitude'))
        if latitude is None or longitude is None:
            logger.error("Latitude atau longitude tidak ada")
            return jsonify({'error': 'Latitude dan longitude diperlukan'}), 400
        
        input_data = prepare_input_data(latitude, longitude)
        X = preprocessor.transform(input_data)
        logger.info(f"Bentuk data setelah preprocessing: {X.shape}")
        prediction = model.predict(X, verbose=0)
        predicted_class_idx = np.argmax(prediction, axis=1)[0]
        predicted_class = label_encoder.inverse_transform([predicted_class_idx])[0]
        
        # Hitung potensi tsunami
        potensi_tsunami = determine_tsunami_potential(4.427889833, 28.0)
        
        output = {
            'status': predicted_class,
            'potensi_tsunami': potensi_tsunami,
            'location': input_data['location'].iloc[0],
            'city': input_data['city'].iloc[0],
            'temperature_2m_min': float(input_data['temperature_2m_min'].iloc[0]),
            'temperature_2m_max': float(input_data['temperature_2m_max'].iloc[0]),
            'windspeed_10m_max': float(input_data['windspeed_10m_max'].iloc[0]),
            'precipitation_sum': float(input_data['precipitation_sum'].iloc[0])
        }
        
        logger.info(f"Prediksi: {predicted_class}, Output: {output}")
        return jsonify({'status': 'success', 'data': output})
    except ValueError as ve:
        logger.error(f"Error validasi: {str(ve)}")
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        logger.error(f"Error saat prediksi: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    """Endpoint untuk login sederhana."""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        if email == 'test@example.com' and password == 'password':
            return jsonify({'currentUser': email})
        return jsonify({'error': 'Email atau kata sandi salah'}), 401
    except Exception as e:
        logger.error(f"Error saat login: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)