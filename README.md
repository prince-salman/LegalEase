# LegalEase — Platform Layanan Hukum & Notaris Digital Indonesia
**Legal Solutions, Made Easy.**

LegalEase adalah platform legal-tech terpadu di Indonesia yang menghubungkan pelaku usaha, startup, UMKM, dan perorangan secara langsung dengan Notaris & PPAT berlisensi resmi dari Kementerian Hukum dan Hak Asasi Manusia (Kemenkumham) serta BPN.

---

## 🌟 Fitur Utama Platform

1. **Paket Layanan & Model Berlangganan Fleksibel**:
   - **3-Day Free Trial (Gratis / 3 Hari)**: Akses eksplorasi platform tanpa komitmen dan tanpa kartu kredit, uji coba chat konsultasi notaris, panduan pendirian PT, dan pratinjau template dokumen.
   - **Legal Chat Essential (Rp 150.000 / bulan)**: Konsultasi hukum langsung tanpa batas via Chat dengan Notaris & PPAT rekanan. Panduan perizinan OSS RBA & NIB (tidak termasuk template dokumen & video call).
   - **Full Legal Suite (Rp 300.000 / bulan)**: Paket lengkap all-in-one mencakup Panggilan Video (Video Call) terenkripsi, Chat konsultasi prioritas, serta akses penuh unduh & kustomisasi seluruh Template Dokumen Hukum (PKS, Akta PT, PKWT/PKWTT, Perjanjian Pemegang Saham) format DOCX & PDF.

2. **Client Portal & Live Web Application (8 Layar)**:
   - **Layar 1: Home Dashboard** — Akses cepat layanan hukum, notaris online yang sedang bertugas, dan pencarian cepat.
   - **Layar 2: Choose a Notary** — Direktori Notaris & PPAT resmi terakreditasi Kemenkumham dengan filter spesialisasi (PT/CV, Properti, Kontrak) dan tarif transparan per sesi.
   - **Layar 3: Consultation Room** — Ruang chat terenkripsi dengan jaminan kerahasiaan jabatan notaris (UUJN No. 2/2014) dan pengiriman checklist otomatis.
   - **Layar 4: Document Templates Store** — Katalog template dokumen resmi siap pakai (PKS, Akta PT, PKWT, Perjanjian Pemegang Saham) dengan verifikasi notaris.
   - **Layar 5: Guides & Checklists (PT Setup)** — Roadmap pendirian PT interaktif dengan pelacak kemajuan realtime dan reminder jadwal penandatanganan akta.
   - **Layar 6: Payment Gateway** — Checkout multi-channel terintegrasi (Virtual Account Bank, E-Wallet GoPay/OVO/Dana, QRIS instan, dan Kartu Kredit/Debit).
   - **Layar 7: Client Account & Retainer** — Manajemen langganan retainer (Trial, Chat Rp 150k, Full Suite Rp 300k) dan pemantauan permohonan dokumen korporat aktif.
   - **Layar 8: Video Consultation** — Panggilan tatap muka terenkripsi dengan notaris berlisensi, kontrol mute, flip kamera, dan timer sesi.

3. **Landing Page Komprehensif**:
   - **Hero Section**: Solusi hukum semudah konsultasi dokter online.
   - **4 Pilar Solusi**: Instant Notary Consultations, Verified Document Templates, Step-by-Step Incorporation Guides, Flexible Retainer Plans.
   - **Alur 6 Langkah Layanan**: Discovery, Pemilihan Notaris, Konsultasi, Kustomisasi Dokumen, Eksekusi Akta, dan Pembayaran Transparan.
   - **Tabel Perbandingan Paket**: Matriks komparasi jelas antara Free Trial, Chat Plan (150k), dan Full Suite (300k).
   - **Jaminan Legalitas & FAQ Interaktif**: Landasan hukum UUJN, akreditasi Kemenkumham/INI, enkripsi bank-grade 256-bit, dan accordion tanya-jawab komprehensif.
   - **Dewan Pimpinan & Legal Advisory Board**: Profil para praktisi hukum dan pendiri platform.

---

## 🚀 Cara Menjalankan Website

Platform ini dibuat mandiri (*zero dependencies / self-contained*), sehingga dapat dijalankan dengan cepat:

### Cara 1: Buka Langsung di Browser
Cukup buka berkas `index.html` langsung di browser favorit Anda.

### Cara 2: Jalankan Local Server (Python)
```bash
python -m http.server 8000
```
Buka di browser: `http://localhost:8000`

---

## 📁 Struktur Berkas Proyek

```
legalease/
├── index.html              # Halaman web utama produksi
├── app.js                  # Logika aplikasi portal, chat, checklist & pembayaran
├── styles.css              # Styling chassis smartphone, animasi, glassmorphism
├── README.md               # Dokumentasi resmi platform
├── assets/
│   ├── logo.png            # Logo resmi LegalEase
│   ├── favicon.png         # Favicon platform
│   ├── team/               # Foto dewan pimpinan & legal counsel
│   └── slides/             # Aset visual pendukung
```
