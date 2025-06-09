# MitigasiKita: Machine Learning untuk Sistem Peringatan Dini Gempa & Tsunami

![MitigasiKita Logo](assets/logo-app.png)

**MitigasiKita** adalah bagian machine learning dari sistem peringatan dini berbasis web untuk mitigasi risiko gempa bumi dan tsunami di Indonesia. Modul ini menggunakan **Deep Neural Network (DNN)** dengan TensorFlow dan Keras untuk memprediksi tingkat risiko (Aman, Waspada, Berbahaya) berdasarkan data geologi (BMKG) dan cuaca (Open-Meteo).

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
Modul machine learning ini dikembangkan untuk mendukung aplikasi web MitigasiKita, yang bertujuan memberikan prediksi risiko gempa dan tsunami secara real-time. Model dilatih menggunakan data geologi dan cuaca, dengan pipeline preprocessing seperti cleaning, imputasi nilai hilang, dan normalisasi. Hasil prediksi diintegrasikan ke backend melalui fungsi inferensi.

## Tech Stack
- **Python**: 3.9+
- **TensorFlow**: 2.15.0
- **Keras**: 2.15.0
- **Pandas**: 2.2.2
- **Scikit-learn**: 1.5.0
- **NumPy**: 1.26.4

## Struktur Direktori
```
mitigasi-kita-machine-learning/
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
- **File**: `gempa_dan_cuaca_dengan_prediksi_v2.csv`
- **Sumber**: BMKG (data gempa), Open-Meteo (data cuaca)
- **Deskripsi**: Berisi fitur seperti magnitudo, kedalaman, koordinat (latitude, longitude), dan kondisi cuaca (suhu, kelembapan, dll.) untuk memprediksi tingkat risiko.

## Pipeline Machine Learning
1. **Exploratory Data Analysis (EDA)**: Visualisasi distribusi kelas risiko, histogram magnitudo, dan korelasi fitur menggunakan heatmap.
2. **Preprocessing**:
   - Cleaning: Menghapus data duplikat dan nilai yang tidak valid.
   - Imputasi: Mengisi nilai hilang dengan median atau modus.
   - Normalisasi: Menggunakan StandardScaler untuk menstandarisasi fitur numerik.
   - Encoding: Menggunakan LabelEncoder untuk kelas risiko (Aman, Waspada, Berbahaya).
3. **Pelatihan Model**:
   - Arsitektur: Deep Neural Network (DNN) dengan TensorFlow/Keras.
   - Pembagian Dataset: 70% train, 15% validation, 15% test.
   - Metrik Evaluasi: Akurasi, precision, recall, F1-score.
4. **Inferensi**: Model disimpan sebagai `model_dnn.h5` dan digunakan untuk prediksi real-time via API.

## Kontribusi
Kami menyambut kontribusi! Silakan fork repositori ini, buat branch baru, dan ajukan pull request. Pastikan untuk mengikuti pedoman kode dan menguji perubahan Anda.

## Tim
- Dearmawan (ML, Universitas Mikroskil, MC172D5Y1422)
- Julianti (ML, Universitas Mikroskil, MC172D5X1418)
- Zainal Saputra (ML, ITSK RS dr Soepraoen, MC634D5Y1076)

## Lisensi
[MIT License](LICENSE)
