# MitigasiKita: Machine Learning untuk Sistem Peringatan Dini Gempa & Tsunami

![MitigasiKita Logo](assets/logo-app.png)

**MitigasiKita** adalah modul machine learning untuk sistem peringatan dini berbasis web yang bertujuan memitigasi risiko gempa bumi dan tsunami di Indonesia, sekaligus menyediakan panduan evakuasi. Modul ini menggunakan **Deep Neural Network (DNN)** dan **Convolutional Neural Network (CNN)** dengan TensorFlow dan Keras untuk memprediksi tingkat risiko (Aman, Waspada, Berbahaya) berdasarkan data geologi dari BMKG dan data cuaca dari Open-Meteo.

## Daftar Isi
- [Latar Belakang](#latar-belakang)
- [Tech Stack](#tech-stack)
- [Struktur Direktori](#struktur-direktori)
- [Instalasi](#instalasi)
- [Cara Menjalankan](#cara-menjalankan)
- [Dataset](#dataset)
- [Pipeline Machine Learning](#pipeline-machine-learning)
- [Kontribusi](#kontribusi)
- [Tim](#tim)
- [Lisensi](#lisensi)

## Latar Belakang
Modul machine learning ini dikembangkan untuk mendukung aplikasi web MitigasiKita, yang memberikan prediksi risiko gempa dan tsunami secara real-time serta panduan evakuasi berbasis data. Model dilatih menggunakan data geologi (magnitudo, kedalaman, koordinat) dan cuaca (suhu, curah hujan, kecepatan angin), dengan pipeline preprocessing seperti pembersihan data, imputasi nilai hilang, dan normalisasi. Hasil prediksi diintegrasikan ke backend melalui fungsi inferensi untuk mendukung keputusan evakuasi cepat.

## Tech Stack
- **Python**: 3.9+ (diuji pada 3.11.9)
- **TensorFlow**: 2.15.0
- **Keras**: 2.15.0
- **Pandas**: 2.2.2
- **Scikit-learn**: 1.5.0
- **NumPy**: 1.26.4
- **Matplotlib**: 3.8.4
- **Seaborn**: 0.13.2
- **Plotly**: 5.22.0
- **Imbalanced-learn**: 0.12.3
- **Geopy**: 2.4.1
- **Requests**: 2.32.3
- **Jupyter**: 1.0.0

## Struktur Direktori
```
mitigasi-kita-machine-learning/
├── assets/
│   └── logo-app.png
├── data/
│   └── gempa_dan_cuaca_dengan_prediksi_v2.csv
├── models/
│   ├── model_dnn.h5
│   ├── preprocessor.pkl
│   ├── label_encoder.pkl
├── Notebook.ipynb
├── requirements.txt
├── README.md
├── .gitignore
├── LICENSE
```

## Instalasi
1. Clone repositori ini:
   ```bash
   git clone https://github.com/CCoupse/mitigasi-kita-machine-learning.git
   cd mitigasi-kita-machine-learning
   ```
2. Buat virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```
3. Install dependensi:
   ```bash
   pip install -r requirements.txt
   ```

## Cara Menjalankan
1. Buka `Notebook.ipynb` menggunakan Jupyter Notebook atau JupyterLab:
   ```bash
   jupyter notebook Notebook.ipynb
   ```
2. Jalankan sel-sel kode untuk melihat proses EDA, preprocessing, pelatihan model, dan evaluasi.
3. Untuk inferensi, model (`model_dnn.h5`) dan pipeline preprocessing (`preprocessor.pkl`, `label_encoder.pkl`) diintegrasikan ke backend (lihat [repositori backend](https://github.com/zainalsaputra/mitigasi-kita-app-backend)).

## Dataset
- **File**: `data/gempa_dan_cuaca_dengan_prediksi_v2.csv`
- **Sumber**: BMKG (data gempa), Open-Meteo (data cuaca)
- **Deskripsi**: Berisi 54.901 baris dan 22 kolom, dengan fitur seperti magnitudo, kedalaman, koordinat (latitude, longitude), dan kondisi cuaca (suhu, curah hujan, kecepatan angin, dll.) untuk memprediksi tingkat risiko.
- **Distribusi Kelas**: 
  - Aman: 37.727 (68.8%)
  - Waspada: 17.100 (31.2%)
  - Berbahaya: 9 (0.02%)

## Pipeline Machine Learning
1. **Exploratory Data Analysis (EDA)**: Visualisasi distribusi kelas risiko, histogram magnitudo, dan korelasi fitur menggunakan heatmap.
2. **Preprocessing**:
   - Cleaning: Menghapus data duplikat dan nilai hilang (65 baris).
   - Imputasi: Mengisi nilai hilang dengan median atau modus.
   - Balancing: Menggunakan SMOTE untuk menangani ketidakseimbangan kelas.
   - Normalisasi: Menggunakan StandardScaler untuk fitur numerik.
   - Encoding: Menggunakan LabelEncoder untuk kelas risiko (Aman, Waspada, Berbahaya) dan OneHotEncoder untuk fitur kategorikal (misalnya, mag_type, location).
3. **Pelatihan Model**:
   - Arsitektur: Deep Neural Network (DNN) dan Convolutional Neural Network (CNN) dengan TensorFlow/Keras.
   - Pembagian Dataset: 70% train, 15% validation, 15% test (22.637 sampel uji).
   - Metrik Evaluasi: 
     - DNN: Akurasi 99.95%, precision/recall/F1-score 1.00 untuk semua kelas.
     - CNN: Akurasi 99.97%, precision/recall/F1-score 1.00 untuk semua kelas.
4. **Inferensi**: Model disimpan sebagai `model_dnn.h5`, digunakan untuk prediksi real-time via API dengan data cuaca dari Open-Meteo dan lokasi dari Nominatim.

## Kontribusi
Kami menyambut kontribusi! Silakan fork repositori ini, buat branch baru, dan ajukan pull request. Pastikan untuk mengikuti pedoman kode dan menguji perubahan Anda.

## Tim
**ID Tim**: CC25-CF278
- Dearmawan (ML, Universitas Mikroskil, MC172D5Y1422)
- Julianti (ML, Universitas Mikroskil, MC172D5X1418)
- Zainal Saputra (ML, ITSK RS dr Soepraoen, MC634D5Y1076)
- Puput Purwaningsih (FEBE, Universitas Nurdin Hamzah, FC614D5X1635)
- Aprilia Nurhaliza (FEBE, Universitas Pendidikan Indonesia, FC299D5X2118)
- Andres Junika Putra (FEBE, Universitas Mercu Buana Yogyakarta, FC613D5Y1033)

## Lisensi
[MIT License](LICENSE)
