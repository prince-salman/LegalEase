# LegalEase — Solusi Layanan Hukum Digital
**App Prototype & Interactive Web Showcase**
**Group 4 - Economic Survival**

Proyek ini merupakan konversi lengkap dari dokumen presentasi dan prototipe aplikasi **LegalEase: Legal Solutions, Made Easy** (`economic_surv_revised.pdf`) menjadi sebuah website interaktif modern.

---

## 🌟 Fitur Utama Website

1. **Simulasi Prototipe Smartphone Interaktif (7 Layar)**:
   - **Layar 1: Home Dashboard** — Akses cepat 4 layanan utama (Templates, Notary Chat, Business, Video Call), banner panduan populer, dan pencarian direktori.
   - **Layar 2: Choose a Notary** — Direktori Notaris & PPAT berlisensi dengan filter spesialisasi (PT/CV, Properti, Kontrak) dan tarif transparan per sesi.
   - **Layar 3: Consultation Room** — Simulasi chat terenkripsi dengan Notaris A (S.H., M.Kn.), kartu attachment PDF checklist otomatis, dan input interaktif dengan auto-reply cerdas.
   - **Layar 4: Document Templates Store** — Katalog template dokumen resmi (PKS Kemitraan, Paket Pendirian PT/CV, Perjanjian Pemegang Saham, Kontrak Kerja PKWT/PKWTT) dengan tombol "Buy" langsung ke kasir pembayaran.
   - **Layar 5: Guides & Checklists (PT Setup)** — Checklist interaktif 6 tahap pendirian PT dengan progress bar realtime serta reminder jadwal tanda tangan akta fisik.
   - **Layar 6: Payment Gateway** — Checkout pembayaran terintegrasi dengan ringkasan pesanan dan metode pembayaran beragam (Virtual Account Bank, E-Wallet GoPay/OVO/Dana, QRIS instan, dan Kartu Kredit/Debit).
   - **Layar 7: Business Account Dashboard (B2B)** — Dashboard akun korporat PT Contoh Maju, status langganan retainer bulanan (Mulai Rp 1.500.000/bln), dan pelacak status permohonan akta/dokumen korporat.
   - **Toggle Mode**: Bisa beralih antara *Simulasi Interaktif (Live UI)* dan *Dokumen Mockup Asli (PDF)*.

2. **Landing Page Komprehensif**:
   - **Hero Section**: Penjelasan nilai proposisi utama: *"Konsultasi Hukum Semudah Konsultasi Dokter Online"*.
   - **Value Proposition**: Instant Access, All-in-one Solution, Save Time & Cost, Secure & Confidential.
   - **Alur 6 Langkah & 3 Ekosistem**: Panduan langkah demi langkah serta peran User, Mitra Notaris, dan Admin.
   - **Layanan B2B Retainer**: Model pendapatan korporat bulanan dan rincian manfaat bagi startup & UMKM.
   - **Galeri Slide Presentasi Asli**: Viewer modal untuk melihat 7 slide asli dalam resolusi tinggi beserta tombol unduh PDF.
   - **Tribute Tim Kelompok 4 (Economic Survival)**: Kolase foto asli dan profil 8 anggota tim:
     - Celena Aurellia
     - Ellya Putri
     - Gelsay Behrous
     - Kailla Aulia
     - Maureen Medina
     - Rasendriya Khalika
     - Risha Aprillia
     - Sharon Miracle

---

## 🚀 Cara Menjalankan Website

Website ini dibuat sepenuhnya mandiri (*zero dependencies / self-contained*), sehingga dapat dijalankan dengan sangat mudah:

### Cara 1: Buka Langsung di Browser
Cukup klik dua kali atau buka berkas `index.html` langsung di browser favorit Anda (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).

### Cara 2: Jalankan Local Server (Python)
Buka terminal pada direktori proyek, lalu jalankan:
```bash
python -m http.server 8000
```
Buka di browser: `http://localhost:8000`

### Cara 3: Jalankan Local Server (Node.js)
```bash
npx serve .
```

---

## 📁 Struktur Berkas Proyek

```
legalease/
├── index.html              # Halaman web utama
├── app.js                  # Logika interaktif simulator, chat, checklist & modal
├── styles.css              # Styling chassis smartphone, animasi, glassmorphism
├── README.md               # Dokumentasi proyek
├── assets/
│   ├── economic_surv_revised.pdf   # Berkas PDF asli
│   ├── slides/                     # 7 slide presentasi resolusi tinggi
│   ├── screens/                    # Mockup 7 layar prototipe asli
│   └── team/                       # Foto anggota tim
```
