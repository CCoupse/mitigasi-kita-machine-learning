const { useState, useEffect, useRef } = React;

const App = () => {
  const [tab, setTab] = useState('beranda');
  const [locationInput, setLocationInput] = useState('');
  const [magnitudeInput, setMagnitudeInput] = useState('');
  const [depthInput, setDepthInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [geoError, setGeoError] = useState('');
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const API_URL = 'http://127.0.0.1:5000/predict';
  const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search';

  useEffect(() => {
    console.log('useEffect triggered for tab:', tab);
    if (tab === 'beranda') {
      getCurrentLocation();
    }
    if (mapRef.current && !mapRef.current._leaflet_id) {
      try {
        mapRef.current = L.map(mapRef.current).setView([-6.2088, 106.8456], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapRef.current);
      } catch (err) {
        console.error('Failed to initialize map:', err);
      }
    }
  }, [tab]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setGeoError('');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            console.log('Fetching location data for:', latitude, longitude);
            const response = await axios.get(
              `${NOMINATIM_API_URL}?lat=${latitude}&lon=${longitude}&format=json&zoom=10`
            );
            const lokasi_detail = response.data[0]?.display_name || `Lat: ${latitude}, Lon: ${longitude}`;
            const predictionData = await axios.post(API_URL, {
              latitude,
              longitude,
              lokasi_detail,
              input_lokasi_input: 'Lokasi Anda Saat Ini'
            }, { withCredentials: false });
            console.log('Prediction data received:', predictionData.data);
            setCurrentLocation({
              prediksi_risiko: predictionData.data.prediksi_risiko,
              tingkat_keyakinan: predictionData.data.tingkat_keyakinan,
              data_pendukung: {
                lokasi_analisis: lokasi_detail,
                timestamp_analisis: new Date().toISOString(),
                input_magnitude: '-',
                input_kedalaman: '-'
              },
              saran_keselamatan: ['Tetap tenang.', 'Ikuti instruksi lokal.']
            });
            updateMap(latitude, longitude, lokasi_detail);
          } catch (err) {
            console.error('Error in getCurrentLocation:', err);
            setGeoError('Gagal menganalisis lokasi: ' + err.message);
          }
        },
        (err) => {
          let msg = 'Gagal mendapatkan lokasi: ';
          switch (err.code) {
            case err.PERMISSION_DENIED: msg += 'Akses ditolak.'; break;
            case err.POSITION_UNAVAILABLE: msg += 'Lokasi tidak tersedia.'; break;
            case err.TIMEOUT: msg += 'Waktu habis.'; break;
            default: msg += 'Kesalahan tidak diketahui.'; break;
          }
          setGeoError(msg);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGeoError('Geolokasi tidak didukung browser.');
    }
  };

  const handleLocationInput = async (e) => {
    const value = e.target.value;
    setLocationInput(value);
    setError('');
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      console.log('Searching suggestions for:', value);
      const response = await axios.get(
        `${NOMINATIM_API_URL}?q=${encodeURIComponent(value)}&format=json&limit=5&countrycodes=id`
      );
      setSuggestions(response.data);
    } catch (err) {
      console.error('Error in handleLocationInput:', err);
      setError('Gagal mencari saran lokasi.');
    }
  };

  const selectSuggestion = (suggestion) => {
    setLocationInput(suggestion.display_name);
    setSuggestions([]);
  };

  const validateInputs = () => {
    if (!locationInput.trim()) {
      setError('Masukkan lokasi terlebih dahulu.');
      return false;
    }
    if (magnitudeInput && (isNaN(magnitudeInput) || magnitudeInput < 0)) {
      setError('Magnitude harus angka positif.');
      return false;
    }
    if (depthInput && (isNaN(depthInput) || depthInput < 0)) {
      setError('Kedalaman harus angka positif.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setLoading(true);
    try {
      console.log('Submitting form with location:', locationInput);
      const geocode = await axios.get(
        `${NOMINATIM_API_URL}?q=${encodeURIComponent(locationInput)}&format=json&limit=1&countrycodes=id`
      );
      if (!geocode.data.length) {
        setError('Lokasi tidak ditemukan.');
        setLoading(false);
        return;
      }
      const { lat, lon, display_name } = geocode.data[0];
      const postData = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        lokasi_detail: display_name,
        input_lokasi_input: locationInput,
        magnitude_aktual: magnitudeInput ? parseFloat(magnitudeInput) : undefined,
        kedalaman_aktual: depthInput ? parseFloat(depthInput) : undefined
      };
      console.log('Sending POST request to API:', postData);
      const response = await axios.post(API_URL, postData, { withCredentials: false });
      console.log('API response:', response.data);
      setPrediction({
        prediksi_risiko: response.data.prediksi_risiko,
        tingkat_keyakinan: response.data.tingkat_keyakinan,
        data_pendukung: {
          lokasi_analisis: display_name,
          timestamp_analisis: new Date().toISOString(),
          input_magnitude: postData.magnitude_aktual || '-',
          input_kedalaman: postData.kedalaman_aktual || '-'
        },
        saran_keselamatan: ['Tetap tenang.', 'Ikuti instruksi lokal.']
      });
      updateMap(lat, lon, display_name);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError('Gagal melakukan prediksi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateMap = (lat, lon, name) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 10);
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = L.marker([lat, lon])
        .addTo(mapRef.current)
        .bindPopup(name)
        .openPopup();
    }
  };

  const renderPrediction = (data) => {
    if (!data) return null;
    const { prediksi_risiko, tingkat_keyakinan, data_pendukung, saran_keselamatan = ['Tetap tenang.', 'Ikuti instruksi lokal.'] } = data;
    const statusClass = {
      AMAN: 'status-safe-text',
      WASPADA: 'status-warning-text',
      BAHAYA: 'status-danger-text'
    }[prediksi_risiko] || '';
    return (
      <div className="mt-6">
        <h3 className="text-xl font-bold">Hasil Analisis</h3>
        <div className="app-card p-4 mt-4">
          <p><strong>Status Risiko:</strong> <span className={statusClass}>{prediksi_risiko}</span></p>
          <p><strong>Lokasi:</strong> {data_pendukung.lokasi_analisis}</p>
          <p><strong>Waktu:</strong> {new Date(data_pendukung.timestamp_analisis).toLocaleString('id-ID')}</p>
          <p><strong>Kepercayaan:</strong> {(tingkat_keyakinan * 100).toFixed(2)}%</p>
          <p><strong>Magnitude:</strong> {data_pendukung.input_magnitude}</p>
          <p><strong>Kedalaman:</strong> {data_pendukung.input_kedalaman}</p>
          <div className="mt-4">
            <h4 className="font-semibold">Saran Keselamatan:</h4>
            <ul className="list-disc pl-5">
              {saran_keselamatan.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="app-header p-4 text-white">
        <h1 className="text-2xl font-bold text-center">MitigasiKita</h1>
      </header>
      <nav className="flex justify-center space-x-4 p-4 bg-white shadow">
        {['beranda', 'keselamatan', 'tentang'].map(t => (
          <button
            key={t}
            className={`nav-item ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
            aria-label={`Tab ${t}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>
      <main className="p-4">
        {tab === 'beranda' && (
          <div>
            <div className="app-card p-4 mb-4">
              <h2 className="text-lg font-semibold">Lokasi Anda Saat Ini</h2>
              {geoError && <p className="text-red-500">{geoError} <button onClick={getCurrentLocation} className="text-blue-500 underline">Coba lagi</button></p>}
              {currentLocation && renderPrediction(currentLocation)}
              {!currentLocation && !geoError && <p className="text-gray-500">Mendapatkan lokasi...</p>}
            </div>
            <div className="app-card p-4">
              <h2 className="text-lg font-semibold">Cek Risiko Lokasi Lain</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="location-input-container">
                  <div className="location-input-group">
                    <input
                      type="text"
                      id="location-input"
                      className="location-input"
                      value={locationInput}
                      onChange={handleLocationInput}
                      placeholder="Masukkan kota atau alamat"
                      aria-label="Masukkan lokasi"
                    />
                    <button type="button" className="location-icon-button" aria-label="Pilih lokasi">
                      <span className="icon-map-marker-alt"></span>
                    </button>
                    <button type="submit" className="check-risk-button" disabled={loading} aria-label="Cek risiko">
                      {loading ? <span className="loading-spinner"></span> : <span className="icon-search"></span>}
                    </button>
                  </div>
                  {suggestions.length > 0 && (
                    <div id="locationDropdown">
                      {suggestions.map((s, i) => (
                        <div key={i} className="suggestion-item" onClick={() => selectSuggestion(s)}>
                          {s.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                  {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="magnitude-input" className="block text-sm font-medium">Magnitude (opsional)</label>
                    <input
                      type="number"
                      id="magnitude-input"
                      className="mt-1 block w-full border rounded p-2"
                      value={magnitudeInput}
                      onChange={(e) => setMagnitudeInput(e.target.value)}
                      min="0"
                      step="0.1"
                      aria-label="Magnitude gempa"
                    />
                  </div>
                  <div>
                    <label htmlFor="depth-input" className="block text-sm font-medium">Kedalaman (opsional)</label>
                    <input
                      type="number"
                      id="depth-input"
                      className="mt-1 block w-full border rounded p-2"
                      value={depthInput}
                      onChange={(e) => setDepthInput(e.target.value)}
                      min="0"
                      step="0.1"
                      aria-label="Kedalaman gempa"
                    />
                  </div>
                </div>
              </form>
              {prediction && renderPrediction(prediction)}
            </div>
            <div id="map-container" ref={mapRef} className="mt-4 h-64"></div>
          </div>
        )}
        {tab === 'keselamatan' && (
          <div className="app-card p-4">
            <h2 className="text-lg font-semibold">Panduan Keselamatan</h2>
            <p>Konten panduan keselamatan akan ditambahkan di sini.</p>
          </div>
        )}
        {tab === 'tentang' && (
          <div className="app-card p-4">
            <h2 className="text-lg font-semibold">Tentang MitigasiKita</h2>
            <p>Platform edukasi dan informasi untuk kesiapsiagaan gempa bumi.</p>
            <p>Tim: Dearmawan, Julianti, Zainal Saputra, Puput Purwaningsih, Muhammad Rafly</p>
          </div>
        )}
      </main>
      <footer className="p-4 text-center text-gray-500">
        © 2025 MitigasiKita. Semua hak dilindungi.
      </footer>
    </div>
  );
};

try {
  console.log('Attempting to render App');
  ReactDOM.render(<App />, document.getElementById('root'));
} catch (err) {
  console.error('Failed to render app:', err);
  document.getElementById('root').innerHTML = '<div class="p-4 text-red-500">Gagal memuat aplikasi. Silakan periksa konsol untuk detail error.</div>';
}