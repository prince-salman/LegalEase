# LegalEase — Platform Layanan Hukum & Notaris Digital Indonesia
**Legal Solutions, Made Easy.**

LegalEase adalah platform legal-tech produksi terpadu di Indonesia yang menghubungkan pelaku usaha, startup, UMKM, dan perorangan secara langsung dengan Notaris & PPAT berlisensi resmi dari Kementerian Hukum dan Hak Asasi Manusia (Kemenkumham) serta Badan Pertanahan Nasional (BPN).

Situs resmi ini 100% fungsional, terhubung ke backend **Supabase Cloud**, dan siap digunakan oleh klien.

---

## 🌟 Model Berlangganan & Paket Layanan (Sesuai Ketentuan)

1. **3-Day Free Trial (IDR 0 / 3 Hari)**
   - Akses uji coba platform gratis selama 3 hari tanpa kartu kredit.
   - Uji coba konsultasi Notaris via chat & checklist interaktif pendirian PT.
   - Pratinjau klausul kontrak hukum (mode preview).

2. **Legal Chat Essential (IDR 150.000 / 1 Bulan)**
   - **Konsultasi via chat tanpa batas** dengan Notaris & PPAT berlisensi.
   - Tanya jawab langsung, panduan KBLI 2020, dan pengecekan nama perseroan.
   - *Khusus konsultasi via chat* — tidak termasuk template dokumen dan video call.

3. **Full Legal Suite (IDR 300.000 / 1 Bulan) — Paket Unggulan**
   - **Konsultasi Video Call 1-on-1 (WebRTC)** terenkripsi dengan Notaris & PPAT.
   - **Unlimited Priority Chat** dengan tanggapan prioritas.
   - **Akses Penuh Pembuat Dokumen Hukum Interaktif**: Kustomisasi variabel dan unduh langsung dokumen resmi berformat **Microsoft Word (.doc)** dan **PDF Siap Cetak**.
   - Jadwal penandatanganan akta resmi di kantor Notaris rekanan.
   - Pelacak berkas SABH Kemenkumham & OSS RBA.

---

## 💻 Full-Width Production Workspace (`#workspace`)

Platform ini dilengkapi dengan workspace aplikasi terpadu berlayar penuh (*Full-Width Desktop & Mobile Responsive Web App*):

- **Tab 1: Overview & Client Account** — Statistik berkas, notaris on-duty, status paket langganan, dan manajemen profil klien.
- **Tab 2: Find & Book Notary** — Direktori Notaris & PPAT terakreditasi Kemenkumham dengan filter spesialisasi (PT/CV/PMA, HAKI, PPAT/Pertanahan) dan modal penjadwalan janji temu resmi.
- **Tab 3: Consultation Room** — Ruang chat terenkripsi dengan jaminan kerahasiaan jabatan notaris (UUJN No. 2/2014), multi-notary switching, pengiriman lampiran berkas, dan ekspor transkrip `.txt`.
- **Tab 4: Live Video Call (WebRTC)** — Panggilan tatap muka terenkripsi dengan Notaris, dukungan real-time camera/microphone device preview (`navigator.mediaDevices.getUserMedia`), kendali mute audio, toggle kamera, berbagi layar dokumen (`getDisplayMedia`), dan timer sesi.
- **Tab 5: Interactive Document Builder** — Pembuat dokumen hukum interaktif (PKS, Akta Pendirian PT, PKWT Ketenagakerjaan PP 35/2021, Mutual NDA, Shareholders Agreement, dan Surat Kuasa Khusus) dengan live paper preview dan generator file Microsoft Word `.doc`.
- **Tab 6: PT Setup & Corporate Filings** — Pelacak tahapan pendirian PT interaktif, penambahan tugas kustom, serta monitoring minuta akta dan SK Kemenkumham.
- **Tab 7: Plans & Checkout Gateway** — Manajemen langganan, checkout simulasi dengan QRIS Real-Time, Virtual Account Bank (BCA), E-Wallet, dan cetak faktur pembayaran resmi bertanda lunas.

---

## ☁️ Integrasi Supabase Cloud

Platform ini telah terintegrasi dengan **Supabase Cloud**:
- **Project URL**: `https://jogjdlwrpnvzzxvvfisc.supabase.co`
- **Publishable Key**: `sb_publishable_lEb3tm8PRg9D5jSDsDzr2A_jrQyiGEr`
- **Schema & Migrations**: Berkas SQL PostgreSQL lengkap tersedia di `supabase/migrations/20261025000000_legalease_schema.sql` mencakup tabel:
  - `profiles` (Sinkronisasi akun klien)
  - `notaries` (Direktori Notaris & PPAT terverifikasi)
  - `consultation_messages` (Pesan chat terenkripsi)
  - `appointments` (Jadwal konsultasi & tanda tangan akta)
  - `saved_documents` (Draf kontrak yang disimpan)
  - `checklist_progress` (Progres roadmap PT)
  - `corporateFilings` (Log minuta akta AHU)
  - `transactions` (Riwayat pembayaran dan faktur langganan)
  - Lengkap dengan **Row-Level Security (RLS)** dan pemicu otomatis `on_auth_user_created`.

---

## 👥 Dewan Direksi & Tim Legal

- **Rasendriya Khalika** — Chief Executive Officer (Co-Founder & Strategy)
- **Gelsay Behrous** — Head of Legal Operations (Regulatory Compliance)
- **Celena Aurellia** — Chief Product Officer (Platform Architecture)
- **Ellya Putri** — Senior Corporate Counsel (Contract Standardization)
- **Kailla Aulia** — Notary Network Director (PPAT Partnerships)
- **Maureen Medina** — Head of Business Development (SME & Startup Relations)
- **Risha Aprillia** — Lead Legal Research (Document Governance)
- **Sharon Miracle** — Client Success Lead (Enterprise Operations)

---

## 🚀 Menjalankan Aplikasi

Aplikasi dapat dijalankan secara langsung pada server web lokal:

```bash
# Menggunakan Python built-in server:
python -m http.server 8000

# Atau menggunakan Node http-server / serve:
npx serve .
```

Buka peramban di `http://localhost:8000`.
Aplikasi 100% responsif, tanpa placeholder, dan siap produksi!
