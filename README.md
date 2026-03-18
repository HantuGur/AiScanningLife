# ◎ AI Life Scanner

> **Tunjukkan data hidupmu, dan AI akan membacanya.**

AI Life Scanner adalah web app yang membantu pengguna memahami kondisi hidup dan kerja mereka dengan cara menganalisis data sederhana — lalu mengubahnya menjadi diagnosis yang jelas, insight yang langsung terasa, dan tindakan konkret yang bisa dieksekusi.

Bukan chatbot. Bukan journaling biasa. Sistem diagnosis berbasis data nyata.

---

## Demo

🔗 **[hantugur.github.io/AiLifeScanner](https://hantugur.github.io/AiLifeScanner)**

---

## Tampilan

| Beranda | Input Form | Hasil Diagnosis |
|---------|------------|-----------------|
| Dashboard ringkas dengan status scan terakhir | 3-langkah input terstruktur (tidur, pekerjaan, keuangan) | Diagnosis AI dengan bottleneck, kebocoran energi, dan tindakan prioritas |

---

## Fitur

- **Weekly Scan** — input data 5 menit: tidur, task, deep work, drains, pengeluaran
- **AI Diagnosis** — LLM menganalisis semua data dan menghasilkan:
  - Status kondisi (`KRITIS` / `OVERLOADED` / `TERFRAGMENTASI` / `STABIL` / `OPTIMAL`)
  - Bottleneck utama yang spesifik ke data pengguna
  - Kebocoran energi/waktu yang terdeteksi
  - 3 tindakan prioritas bertahap (hari ini → 3 hari → minggu ini)
  - Insight mendalam yang tidak selalu disadari pengguna
- **Riwayat** — semua scan tersimpan di browser (localStorage)
- **Tren** — bar chart perbandingan tidur, completion rate, dan deep work lintas minggu
- **Dark UI** — desain bersih, cepat, mobile-friendly

---

## Tech Stack

| Layer      | Teknologi                          |
|------------|------------------------------------|
| Frontend   | React 18 (CDN), Babel Standalone   |
| Styling    | Vanilla CSS (Space Grotesk + Space Mono) |
| AI         | LiteLLM (OpenAI-compatible API)    |
| Storage    | `localStorage` browser             |
| Deploy     | GitHub Pages (static, no backend)  |

**No build step. No npm. No framework. Satu folder, tiga file, langsung jalan.**

---

## Struktur File

```
AiLifeScanner/
├── index.html          # HTML shell + semua CSS
├── app.js              # Semua React components + logic
├── config.example.js   # Template konfigurasi API
├── config.js           # API key (TIDAK di-push, ada di .gitignore)
├── .gitignore
└── README.md
```

---

## Cara Menjalankan Lokal

```bash
# 1. Clone repo
git clone https://github.com/hantugur/AiLifeScanner
cd AiLifeScanner

# 2. Buat file config dari template
cp config.example.js config.js

# 3. Edit config.js, isi API key kamu
#    API_KEY: "sk-xxxxxxxxxxxx"

# 4. Buka index.html di browser
#    (bisa double-click atau pakai Live Server di VS Code)
```

> **Catatan:** Karena menggunakan Babel Standalone, file harus dibuka via HTTP server (bukan `file://`). Gunakan ekstensi **Live Server** di VS Code, atau `python -m http.server 8000`.

---

## Deployment ke GitHub Pages

```bash
# Pastikan config.js TIDAK ikut di-push
# .gitignore sudah mengecualikan config.js

git add .
git commit -m "feat: initial deploy"
git push origin main

# Aktifkan GitHub Pages:
# Settings → Pages → Source: main branch → / (root)
```

---

## Kenapa Ini Bukan Sekadar ChatGPT?

| ChatGPT / AI Umum | AI Life Scanner |
|-------------------|-----------------|
| Kamu harus tahu apa yang ditanyakan | Sistem yang menginisiasi diagnosis sendiri |
| Jawaban sesaat, tidak ada memori | Data tersimpan, tren bisa dibandingkan |
| Output tergantung kualitas prompt | Output standar yang konsisten dan terstruktur |
| Tidak ada konteks historis | Perbandingan minggu ke minggu |
| Generik | Spesifik ke angka dan data pengguna |

---

## Konsep Produk

Proyek ini dibuat sebagai implementasi dari konsep **AI Life Scanner** — produk AI yang:

1. Mengumpulkan data hidup pengguna dengan **workflow input terstruktur**, bukan chat bebas
2. Menganalisis **pola lintas data** (tidur + produktivitas + energi secara bersamaan)
3. Menghasilkan **output yang langsung terasa nilainya** dalam 30 detik
4. Memiliki nilai yang **tumbuh seiring waktu** karena tren dan histori

---

## Roadmap (Ide Pengembangan)

- [ ] Input via screenshot kalender (OCR)
- [ ] Notifikasi pengingat weekly scan
- [ ] Ekspor laporan PDF
- [ ] Perbandingan bulan vs bulan
- [ ] Mode multi-user dengan auth

---

## Lisensi

MIT — bebas digunakan dan dimodifikasi.

---

*Dibuat dengan [Claude AI](https://claude.ai) · 2025*
