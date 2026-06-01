# 🏢 Simulasi Optimasi Jalur Evakuasi Gedung — Hill Climbing Simulator

Aplikasi web simulasi interaktif untuk memvisualisasikan dan menganalisis pencarian jalur evakuasi gedung menggunakan algoritma pencarian lokal (Local Search) **Hill Climbing**. Aplikasi ini mempermudah pemahaman konsep kecerdasan buatan, khususnya perilaku pencarian heuristik terhadap rintangan gedung, zona bahaya, serta tantangan optimum lokal (*local optima*), wilayah datar (*plateau*), dan punggungan (*ridge*).

---

## 📌 Deskripsi Proyek

Proyek ini mensimulasikan bagaimana agen (manusia/evakuator) mencari jalan keluar terpendek dari posisi **Start (🚶)** ke pintu **Exit (🚪)** di dalam grid gedung berukuran 20×20. Pengguna dapat menggambar dinding penghalang, menempatkan titik api, serta memilih variasi algoritma Hill Climbing untuk melihat bagaimana rute evakuasi dioptimalkan secara dinamis.

Simulator ini mengimplementasikan tiga varian utama algoritma **Hill Climbing**:
1. **Simple Hill Climbing**: Agen mengevaluasi tetangga satu per satu secara sekuensial dan langsung berpindah ke tetangga pertama yang memiliki nilai heuristik lebih baik (jarak Manhattan lebih dekat ke Exit). Sangat cepat, tetapi sangat rentan terjebak di optimum lokal.
2. **Steepest-Ascent Hill Climbing**: Agen mengevaluasi seluruh tetangga yang valid secara komprehensif, kemudian memilih satu tetangga terbaik yang memberikan peningkatan nilai heuristik terbesar. Lebih presisi dibandingkan varian Simple.
3. **Stochastic Hill Climbing**: Agen memilih tetangga secara probabilistik (acak berbobot) dari kelompok tetangga yang memiliki nilai heuristik lebih baik. Pendekatan probabilistik ini memberikan peluang bagi agen untuk keluar dari jebakan optimum lokal (*local optima*).

### Fitur Utama:
* **Interactive Grid Painter**: Gambar dinding (**🧱**), tempatkan api (**🔥**), tentukan titik mulai (**🚶**), dan pintu keluar (**🚪**) dengan drag-and-paint yang mulus menggunakan mouse (desktop) maupun layar sentuh (mobile Android).
* **Multi-Device Responsive Layout**: Tampilan adaptif premium dengan 3-kolom pada desktop, 2-kolom pada tablet, serta **Tampilan Navigasi Tab** glassmorphic khusus untuk mobile agar nyaman digunakan di smartphone Android.
* **Real-time Charting & Metrics**: Visualisasi grafik penurunan nilai heuristik $h(n)$ secara interaktif menggunakan Chart.js seiring berjalannya animasi.
* **Condition Detection**: Deteksi otomatis secara real-time terhadap kondisi hambatan pencarian lokal search seperti *Local Optima*, *Plateau*, dan *Ridge*.
* **Step-by-step Log**: Riwayat log langkah pencarian lengkap dengan detail keputusan perpindahan arah koordinat agen.

---

## 🛠️ Teknologi yang Digunakan

Proyek ini dibangun menggunakan kombinasi teknologi modern yang ringan namun tangguh:

1. **Backend**:
   * **Python 3.x**
   * **Flask**: Framework mikro untuk menangani API perutean kalkulasi jalur (`/run` dan `/compare`).

2. **Frontend**:
   * **HTML5**: Struktur semantik beraksesibilitas tinggi.
   * **CSS3**: Sistem pewarnaan tema gelap premium (Glassmorphism, CSS Grid, Flexbox, & Custom CSS Variables) yang adaptif untuk berbagai ukuran layar.
   * **Javascript (ES6+)**: Logika kontrol grid interaktif, penanganan interaksi layar sentuh mobile, animasi langkah demi langkah, dan komunikasi AJAX Fetch API ke backend.
   * **Chart.js**: Grafik performa heuristik dinamis.
   * **Google Fonts**: Font *Inter* untuk UI premium dan *JetBrains Mono* untuk data numerik & log langkah.

---

## 🚀 Cara Instalasi & Menjalankan Program

Ikuti langkah-langkah di bawah ini untuk menjalankan simulator di komputer lokal Anda:

### Prasyarat
Pastikan komputer Anda sudah terinstal **Python 3.x** dan **pip** (Python package installer).

### Langkah-langkah
1. **Klon Repositori** atau salin seluruh folder proyek ini ke komputer Anda:
   ```bash
   git clone https://github.com/secronn20/jalur_evakuasi_gedung.git
   cd jalur_evakuasi_gedung
   ```

2. **Instal Dependensi** yang dibutuhkan:
   ```bash
   pip install -r requirements.txt
   ```

3. **Jalankan Aplikasi Flask**:
   ```bash
   python main.py
   ```

4. **Buka Browser Anda** dan kunjungi alamat berikut:
   ```text
   http://127.0.0.1:5000
   ```

5. **Penggunaan Mobile (Android)**:
   Untuk mencoba langsung pada ponsel Android Anda, pastikan HP dan komputer berada dalam satu jaringan Wi-Fi yang sama. Jalankan server Flask lokal Anda, lalu buka browser di Android Anda dengan memasukkan alamat IP komputer Anda diikuti oleh port `5000` (contoh: `http://192.168.1.10:5000`).

---

## 🌐 Link Demo & Repositori

Proyek ini dapat diakses dan di-klon secara publik melalui:
* **Link Repositori**: [GitHub - secronn20/jalur_evakuasi_gedung](https://github.com/secronn20/jalur_evakuasi_gedung)
* **Link Demo Lokal**: [http://127.0.0.1:5000](http://127.0.0.1:5000) (setelah server Flask dijalankan)
# jalur_evakuasi_gedung
