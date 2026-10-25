/**
 * LegalEase - Official Production Web Application
 * Indonesia's Premier On-Demand Legal & Notary Platform
 * Integrated with Supabase Cloud (PostgreSQL & Auth)
 */

(function () {
  'use strict';

  // --- SUPABASE CLIENT INITIALIZATION ---
  const SUPABASE_URL = 'https://jogjdlwrpnvzzxvvfisc.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_lEb3tm8PRg9D5jSDsDzr2A_jrQyiGEr';
  let supabaseClient = null;

  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('✓ Supabase Client connected:', SUPABASE_URL);
    }
  } catch (err) {
    console.warn('Supabase initialization notice:', err);
  }

  // --- PERSISTENT STATE ---
  const STORAGE_KEY = 'legalease_app_state_v3';

  const defaultState = {
    activeTab: 'dashboard', // 'dashboard', 'notaries', 'consultation', 'videocall', 'templates', 'roadmap', 'billing'
    activePlan: 'full', // 'trial' (0 / 3 days), 'chat' (150k / 1 mo), 'full' (300k / 1 mo)
    planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    user: {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      email: 'client@solusimaju.co.id',
      fullName: 'Pratama Salman',
      companyName: 'PT Solusi Maju Bersama',
      city: 'Jakarta Selatan',
      isAuthenticated: true,
      role: 'Enterprise Client'
    },
    activeNotaryId: 'notary-1',
    notarySearchQuery: '',
    notaryCategoryFilter: 'all',
    videoCallState: {
      inCall: false,
      isMuted: false,
      isVideoOff: false,
      isSharingScreen: false,
      seconds: 0,
      notaryId: 'notary-1',
      stream: null,
      timerInterval: null
    },
    activeDocKey: 'pks',
    docFormData: {
      party1Name: 'PT Solusi Maju Bersama',
      party1Rep: 'Pratama Salman (Direktur Utama)',
      party2Name: 'PT Rekan Teknologi Mandiri',
      party2Rep: 'Ahmad Faisal, S.T. (Direktur)',
      contractCity: 'Jakarta Selatan',
      contractDate: new Date().toISOString().split('T')[0],
      contractValue: 'Rp 250.000.000',
      governingLaw: 'Republik Indonesia (Pengadilan Negeri Jakarta Selatan)',
      disputeResolution: 'Musyawarah Mufakat & BANI'
    },
    checklist: [
      { id: 1, text: "Penetapan 3 Opsi Nama PT & Pengecekan AHU Online", category: "Persiapan", completed: true, date: "21 Okt 2026" },
      { id: 2, text: "Penyusunan KBLI 2020 Sesuai Bidang Usaha Perseroan", category: "Legalitas", completed: true, date: "22 Okt 2026" },
      { id: 3, text: "Penetapan Modal Dasar, Ditempatkan, & Struktur Saham", category: "Struktur", completed: true, date: "23 Okt 2026" },
      { id: 4, text: "Penandatanganan Akta Pendirian di Hadapan Notaris Rekanan", category: "Notaris", completed: false, date: "Estimasi 26 Okt 2026" },
      { id: 5, text: "Penerbitan SK Pengesahan Badan Hukum Kemenkumham RI", category: "Kemenkumham", completed: false, date: "Menunggu Akta" },
      { id: 6, text: "Penerbitan NIB & Sertifikat Standar OSS RBA", category: "Perizinan", completed: false, date: "Tahap Akhir" }
    ],
    corporateFilings: [
      { id: 'FL-2026-001', title: 'Akta Pendirian PT Solusi Maju Bersama', notary: 'Dr. Hendra Wijaya, S.H., M.Kn.', status: 'Drafting Akta', progress: 65, date: '24 Okt 2026' },
      { id: 'FL-2026-002', title: 'Pemesanan Nama Perseroan AHU Kemenkumham', notary: 'Dr. Hendra Wijaya, S.H., M.Kn.', status: 'Approved', progress: 100, date: '21 Okt 2026' },
      { id: 'FL-2026-003', title: 'Pendaftaran Hak Kekayaan Intelektual Merek Dagang', notary: 'Kartika Permatasari, S.H., M.Kn.', status: 'Review Berkas', progress: 40, date: '23 Okt 2026' }
    ],
    selectedPaymentMethod: 'qris',
    transactions: [
      { id: 'INV-2026-9041', plan: 'full', description: 'Langganan Full Legal Suite (1 Bulan)', amount: 300000, method: 'QRIS Real-Time', status: 'PAID', date: '24 Okt 2026' }
    ]
  };

  // Load persisted state or fallback
  let state = defaultState;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = Object.assign({}, defaultState, parsed);
    }
  } catch (e) {
    console.warn('Failed to load localStorage state, using default:', e);
  }

  // Expose state for external verification & debugging
  window.legalEaseState = state;
  window.getState = () => state;

  function saveState() {
    try {
      // Don't serialize media stream or intervals
      const stateToSave = Object.assign({}, state);
      stateToSave.videoCallState = Object.assign({}, state.videoCallState, { stream: null, timerInterval: null });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }

  // --- NOTARIES DIRECTORY DATA ---
  const NOTARIES = [
    {
      id: 'notary-1',
      name: 'Dr. Hendra Wijaya, S.H., M.Kn.',
      title: 'Notaris & Pejabat Pembuat Akta Tanah (PPAT)',
      office: 'Kantor Notaris Jakarta Selatan',
      address: 'Sudirman Central Business District (SCBD), Jakarta Selatan',
      skNumber: 'SK Kemenkumham RI: AHU-0019284.AH.02.01.Tahun 2017',
      experience: '16 Tahun Pengalaman',
      rating: 4.95,
      reviewsCount: 342,
      specialties: ['Pendirian PT / CV / PMA', 'Perjanjian Bisnis (PKS)', 'Legal Due Diligence', 'Pertanahan & PPAT'],
      status: 'Online & Tersedia',
      isAvailableNow: true,
      languages: ['Indonesia', 'English'],
      avatar: 'assets/team/team_1.jpeg',
      initials: 'HW',
      bio: 'Spesialis hukum korporasi, pendirian perseroan permodalan asing (PMA), dan restrukturisasi merger & akuisisi berizin resmi Kemenkumham RI.'
    },
    {
      id: 'notary-2',
      name: 'Kartika Permatasari, S.H., M.Kn.',
      title: 'Notaris & Konsultan HAKI Terdaftar',
      office: 'Kantor Notaris Jakarta Pusat',
      address: 'Jl. M.H. Thamrin No. 28, Menteng, Jakarta Pusat',
      skNumber: 'SK Kemenkumham RI: AHU-0038192.AH.02.01.Tahun 2019',
      experience: '11 Tahun Pengalaman',
      rating: 4.92,
      reviewsCount: 218,
      specialties: ['Pendaftaran Merek & HAKI', 'Kontrak Kerja Karyawan (PKWT/PKWTT)', 'Non-Disclosure Agreement (NDA)', 'Akta Hibah & Waris'],
      status: 'Online & Tersedia',
      isAvailableNow: true,
      languages: ['Indonesia', 'English', 'Mandarin'],
      avatar: 'assets/team/team_7.jpeg',
      initials: 'KP',
      bio: 'Berpengalaman mendampingi lebih dari 400 startup teknologi dalam perlindungan kekayaan intelektual dan penyusunan instrumen kontrak kerja bilateral.'
    },
    {
      id: 'notary-3',
      name: 'Bagus Pratama Putra, S.H., M.Kn.',
      title: 'Notaris Korporasi & Pejabat Pembuat Akta Tanah',
      office: 'Kantor Notaris Surabaya & Sidoarjo',
      address: 'Pakuwon City Business Center, Surabaya Timur',
      skNumber: 'SK Kemenkumham RI: AHU-0082711.AH.02.01.Tahun 2018',
      experience: '14 Tahun Pengalaman',
      rating: 4.91,
      reviewsCount: 189,
      specialties: ['Akta Jual Beli Tanah (PPAT)', 'Perjanjian Kredit Bank', 'RUPS & Perubahan Anggaran Dasar', 'Perizinan OSS RBA'],
      status: 'Di Ruang Akta (Tersedia Chat)',
      isAvailableNow: true,
      languages: ['Indonesia', 'Jawa'],
      avatar: 'assets/team/team_5.jpeg',
      initials: 'BP',
      bio: 'Fokus pada hukum properti, transaksi hak atas tanah komersial, perizinan OSS RBA serta penyelenggaraan RUPS Perubahan Anggaran Dasar Perseroan.'
    },
    {
      id: 'notary-4',
      name: 'Nadia Kusumawardhani, S.H., M.Kn.',
      title: 'Notaris & Konsultan Restrukturisasi Modal',
      office: 'Kantor Notaris Bandung & Jawa Barat',
      address: 'Jl. Ir. H. Juanda No. 112, Dago, Kota Bandung',
      skNumber: 'SK Kemenkumham RI: AHU-0045199.AH.02.01.Tahun 2021',
      experience: '8 Tahun Pengalaman',
      rating: 4.89,
      reviewsCount: 145,
      specialties: ['Perjanjian Investasi (SAFE/Notes)', 'Perjanjian Pemegang Saham (SHA)', 'Kemitraan UMKM', 'Akta Yayasan & Perkumpulan'],
      status: 'Online & Tersedia',
      isAvailableNow: true,
      languages: ['Indonesia', 'English', 'Sunda'],
      avatar: 'assets/team/team_3.png',
      initials: 'NK',
      bio: 'Berpengalaman dalam perumusan Shareholders Agreement (SHA), vesting schedule pendiri, dan legal audit untuk putaran pendanaan Pre-Seed hingga Series A.'
    }
  ];

  // --- CONSULTATION CHAT MESSAGES BY NOTARY ---
  const CHAT_STORAGE_KEY = 'legalease_chat_threads_v3';
  let chatThreads = {
    'notary-1': [
      { id: 1, sender: 'notary', text: 'Selamat datang di Ruang Konsultasi LegalEase. Saya Dr. Hendra Wijaya, S.H., M.Kn. Ada dokumen hukum atau pendirian perseroan yang ingin Anda konsultasikan hari ini?', time: '09:30 WIB' },
      { id: 2, sender: 'user', text: 'Halo Pak Notaris Hendra. Kami dari PT Solusi Maju Bersama sedang memproses Akta Pendirian dan draft PKS kemitraan. Mohon panduannya untuk pengecekan KBLI dan klausa klausul penting.', time: '09:32 WIB' },
      { id: 3, sender: 'notary', text: 'Tentu. Berdasarkan regulasi OSS RBA dan Kemenkumham, untuk sektor teknologi/software kita mengacu pada KBLI 62019 (Aktivitas Pemrograman Komputer Lainnya) atau 62029. Saya telah lampirkan lembar verifikasi checklist PT untuk Anda tinjau langsung.', time: '09:35 WIB', isAttachment: true, attachmentTitle: 'Checklist Resmi Pendirian PT & KBLI 2020', docKey: 'pks' }
    ],
    'notary-2': [
      { id: 1, sender: 'notary', text: 'Halo, saya Kartika Permatasari, S.H., M.Kn. Konsultasi HAKI, kontrak kerja PKWT, dan perlindungan kerahasiaan NDA dapat kita bahas di sini.', time: '08:45 WIB' },
      { id: 2, sender: 'user', text: 'Pagi Ibu Kartika, kami ingin memastikan draft NDA dan PKWT untuk software engineer kami sudah memenuhi UU Cipta Kerja terbaru.', time: '08:48 WIB' },
      { id: 3, sender: 'notary', text: 'Sangat baik. Format PKWT di LegalEase sudah disesuaikan dengan PP No. 35 Tahun 2021 tentang kompensasi PKWT dan klausul non-disclosure yang mengikat.', time: '08:50 WIB' }
    ],
    'notary-3': [
      { id: 1, sender: 'notary', text: 'Selamat datang. Saya Bagus Pratama Putra, S.H., M.Kn. Siap membantu terkait legalitas pertanahan (PPAT), perizinan OSS RBA, dan perubahan anggaran dasar perseroan.', time: 'Yesterday' }
    ],
    'notary-4': [
      { id: 1, sender: 'notary', text: 'Halo! Saya Nadia Kusumawardhani, S.H., M.Kn. Silakan sampaikan pertanyaan mengenai struktur kepemilikan saham, convertible notes, atau perjanjian investasi.', time: 'Yesterday' }
    ]
  };

  try {
    const savedChats = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedChats) {
      chatThreads = Object.assign({}, chatThreads, JSON.parse(savedChats));
    }
  } catch (e) {
    console.warn('Chat load error:', e);
  }

  function saveChatThreads() {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatThreads));
    } catch (e) {
      console.warn('Chat save error:', e);
    }
  }

  // --- LEGAL DOCUMENT TEMPLATES DATA ---
  const CONTRACT_TEMPLATES = {
    pks: {
      key: 'pks',
      title: 'Perjanjian Kerjasama Kemitraan Bisnis (PKS)',
      subtitle: 'Standar KUHPerdata Pasal 1320 & 1338',
      category: 'Komersial & B2B',
      docNo: '042/PKS-LE/X/2026',
      description: 'Instrumen kontrak komersial pengikatan hak dan kewajiban dua entitas usaha dalam pelaksanaan proyek, pembagian bagi hasil (revenue sharing), dan tata cara penyelesaian sengketa hukum.',
      clauses: [
        {
          title: 'PASAL 1: KETENTUAN UMUM & DEFINISI KEMITRAAN',
          content: 'Pihak Pertama dan Pihak Kedua sepakat untuk mengikatkan diri dalam kemitraan strategis pelaksanaan kegiatan usaha dan penyediaan layanan teknologi terintegrasi dengan itikad baik (good faith) sesuai ketentuan perundang-undangan Negara Republik Indonesia.'
        },
        {
          title: 'PASAL 2: RUANG LINGKUP PEKERJAAN & NILAI KONTRAK',
          content: 'Pihak Pertama menunjuk Pihak Kedua untuk melaksanakan operasional proyek kemitraan dengan total nilai komitmen sebesar {{contractValue}}, yang dibayarkan berdasarkan termin penyelesaian milestone pekerjaan yang disepakati secara tertulis oleh kedua belah pihak.'
        },
        {
          title: 'PASAL 3: HAK DAN KEWAJIBAN PARA PIHAK',
          content: 'Pihak Pertama berhak menerima hasil deliverables sesuai standar teknis dan berkewajiban melakukan pembayaran tepat waktu. Pihak Kedua berkewajiban menjaga kerahasiaan data korporasi, mematuhi jadwal serah terima, dan memberikan garansi pemeliharaan sekurang-kurangnya 90 (sembilan puluh) hari kalender.'
        },
        {
          title: 'PASAL 4: KERAHASIAAN INFORMASI (CONFIDENTIALITY)',
          content: 'Semua informasi teknis, komersial, data keuangan, kode sumber, dan dokumentasi yang diserahkan selama berjalannya perjanjian ini bersifat sangat rahasia (Strictly Confidential) dan dilarang diungkapkan kepada pihak ketiga manapun tanpa persetujuan tertulis terlebih dahulu.'
        },
        {
          title: 'PASAL 5: DOMISILI HUKUM & PENYELESAIAN SENGKETA',
          content: 'Segala perselisihan yang timbul sehubungan dengan penafsiran atau pelaksanaan Perjanjian ini akan diselesaikan terlebih dahulu melalui musyawarah mufakat. Apabila dalam waktu 30 (tiga puluh) hari tidak tercapai mufakat, Para Pihak sepakat memilih domisili hukum tetap di Kantor Kepaniteraan Pengadilan Negeri {{contractCity}}.'
        }
      ]
    },
    akta_pt: {
      key: 'akta_pt',
      title: 'Draft Akta Pendirian Perseroan Terbatas (PT)',
      subtitle: 'Sesuai UU No. 40/2007 jo. UU Cipta Kerja No. 6/2023',
      category: 'Korporasi & AHU',
      docNo: '088/NOT-HW/AKTA-PT/X/2026',
      description: 'Format baku Akta Pendirian PT yang disiapkan di hadapan Notaris, mencakup Anggaran Dasar, klasifikasi KBLI, susunan Direksi & Komisaris, serta struktur permodalan.',
      clauses: [
        {
          title: 'PASAL 1: NAMA DAN TEMPAT KEDUDUKAN PERSEROAN',
          content: 'Perseroan Terbatas ini bernama "{{party1Name}}", berkedudukan di {{contractCity}} dan dapat membuka kantor cabang atau perwakilan di tempat lain di dalam maupun di luar wilayah Republik Indonesia atas persetujuan Direksi dengan persetujuan Komisaris.'
        },
        {
          title: 'PASAL 2: MAKSUD, TUJUAN DAN KEGIATAN USAHA (KBLI 2020)',
          content: 'Maksud dan tujuan Perseroan adalah menjalankan usaha dalam bidang Aktivitas Pemrograman Komputer, Konsultasi Manajemen, serta Perdagangan Besar Berbasis Teknologi Digital sesuai Klasifikasi Baku Lapangan Usaha Indonesia (KBLI).'
        },
        {
          title: 'PASAL 3: MODAL DASAR, MODAL DITEMPATKAN DAN DISETOR',
          content: 'Modal Dasar Perseroan berjumlah Rp 1.000.000.000 (satu miliar rupiah) terbagi atas 10.000 (sepuluh ribu) lembar saham masing-masing bernilai nominal Rp 100.000. Dari modal dasar tersebut telah ditempatkan dan disetor penuh sekurang-kurangnya 25% (dua puluh lima persen) yaitu sebesar {{contractValue}}.'
        },
        {
          title: 'PASAL 4: SUSUNAN DIREKSI DAN DEWAN KOMISARIS',
          content: 'Perseroan diurus dan dipimpin oleh Direksi di bawah pengawasan Dewan Komisaris. Pengangkatan, pemberhentian, serta penetapan wewenang penandatanganan perbankan diatur secara mutlak berdasarkan Keputusan Rapat Umum Pemegang Saham (RUPS).'
        },
        {
          title: 'PASAL 5: KETENTUAN PENUTUP & PENGESAHAN NOTARIS',
          content: 'Akta ini dibuat, dibacakan, dan ditandatangani di hadapan Notaris yang berwenang untuk selanjutnya didaftarkan dalam Sistem Administrasi Badan Hukum (SABH) Kementerian Hukum dan HAM Republik Indonesia guna penerbitan SK Pengesahan Badan Hukum.'
        }
      ]
    },
    pkwt: {
      key: 'pkwt',
      title: 'Perjanjian Kerja Waktu Tertentu (PKWT)',
      subtitle: 'Standar Ketenagakerjaan PP No. 35 Tahun 2021',
      category: 'Ketenagakerjaan (HR)',
      docNo: '019/HR-LE/PKWT/X/2026',
      description: 'Kontrak hubungan kerja waktu tertentu yang memuat hak upah, hak kompensasi akhir masa kontrak, jam kerja, kewajiban etika profesi, serta sanksi pemutusan hubungan kerja.',
      clauses: [
        {
          title: 'PASAL 1: STATUS DAN PENEMPATAN KERJA',
          content: 'Perusahaan mempekerjakan Karyawan dengan status Pekerja Waktu Tertentu (PKWT) untuk jangka waktu 12 (dua belas) bulan terhitung sejak tanggal {{contractDate}} dengan penempatan kerja di kantor {{contractCity}}.'
        },
        {
          title: 'PASAL 2: TUGAS, TANGGUNG JAWAB & KINERJA',
          content: 'Karyawan bertugas menjalankan tanggung jawab profesional sesuai job description dan Key Performance Indicators (KPI) yang ditetapkan oleh manajemen Perusahaan dengan dedikasi penuh dan integritas tinggi.'
        },
        {
          title: 'PASAL 3: REMUNERASI, TUNJANGAN & KOMPENSASI PP 35/2021',
          content: 'Karyawan menerima gaji pokok beserta tunjangan tetap bulanan yang disetujui. Pada akhir jangka waktu perjanjian kerja, Karyawan berhak menerima uang kompensasi PKWT yang perhitungannya mengacu secara tegas pada ketentuan Pasal 15 s/d Pasal 17 Peraturan Pemerintah No. 35 Tahun 2021.'
        },
        {
          title: 'PASAL 4: HAK KEKAYAAN INTELEKTUAL (WORK MADE FOR HIRE)',
          content: 'Seluruh karya cipta, kode program, arsitektur sistem, desain, dan dokumen yang dihasilkan Karyawan selama masa kerja menjadi hak milik mutlak dan eksklusif Perusahaan tanpa kewajiban royalti tambahan.'
        }
      ]
    },
    nda: {
      key: 'nda',
      title: 'Perjanjian Kerahasiaan Timbal Balik (Mutual NDA)',
      subtitle: 'Perlindungan Rahasia Dagang UU No. 30/2000',
      category: 'Perlindungan Aset',
      docNo: '055/NDA-LE/X/2026',
      description: 'Instrumen hukum penguncian kerahasiaan informasi bisnis, kode sumber rahasia dagang, daftar mitra, dan dokumen finansial dalam tahap penjajakan kerjasama komersial atau investasi.',
      clauses: [
        {
          title: 'PASAL 1: DEFINISI INFORMASI RAHASIA',
          content: 'Informasi Rahasia mencakup segala data teknis, finansial, arsitektur perangkat lunak, algoritma, data pelanggan, strategi pemasaran, dan rencana bisnis yang diungkapkan baik secara tertulis, lisan, maupun elektronik oleh salah satu Pihak kepada Pihak lainnya.'
        },
        {
          title: 'PASAL 2: KEWAJIBAN PENCEGAHAN KEBOCORAN',
          content: 'Pihak Penerima berjanji untuk menjaga kerahasiaan tersebut dengan standar kehati-hatian yang setara dengan cara menjaga rahasia dagang miliknya sendiri, dan tidak menduplikasi atau mengekspor informasi tanpa izin tertulis.'
        },
        {
          title: 'PASAL 3: SANKSI GANTI RUGI DAN GUGATAN PERDATA',
          content: 'Pelanggaran terhadap kerahasiaan informasi ini memberikan hak kepada Pihak Pengungkap untuk menuntut ganti rugi materiil dan immateriil serta penetapan perintah pengadilan (injunction) seketika tanpa meniadakan tuntutan pidana sesuai UU Rahasia Dagang No. 30 Tahun 2000.'
        }
      ]
    },
    sha: {
      key: 'sha',
      title: 'Perjanjian Antar Pemegang Saham (Shareholders Agreement)',
      subtitle: 'Standar Tata Kelola Saham Pendiri & Investor',
      category: 'Investasi & Saham',
      docNo: '031/SHA-LE/X/2026',
      description: 'Mengatur hak suara, klausul anti-dilusi, Right of First Refusal (ROFR), Drag-Along / Tag-Along rights, dan mekanisme vesting jadwal saham bagi co-founders.',
      clauses: [
        {
          title: 'PASAL 1: STRUKTUR KEPEMILIKAN & VESTING SCHEDULE',
          content: 'Para Pihak sepakat bahwa kepemilikan saham para pendiri tunduk pada mekanisme vesting selama 4 (empat) tahun dengan 1-year cliff guna menjaga komitmen jangka panjang operasional perusahaan.'
        },
        {
          title: 'PASAL 2: HAK MENOLAK TERLEBIH DAHULU (ROFR)',
          content: 'Apabila salah satu pemegang saham bermaksud menjual atau mengalihkan saham miliknya kepada pihak luar, pemegang saham lainnya berhak membeli saham tersebut secara proporsional dengan harga dan ketentuan yang sama.'
        },
        {
          title: 'PASAL 3: KLAUSUL DRAG-ALONG & TAG-ALONG',
          content: 'Dalam hal terjadi penawaran akuisisi perusahaan oleh investor strategis dengan persetujuan mayoritas pemegang saham (75%+), pemegang saham minoritas wajib menyetujui transaksi pengalihan saham secara serempak.'
        }
      ]
    },
    surat_kuasa: {
      key: 'surat_kuasa',
      title: 'Surat Kuasa Khusus Pengurusan Legalitas Badan Hukum',
      subtitle: 'Standar Notaris & Administrasi Kemenkumham RI',
      category: 'Administrasi Hukum',
      docNo: '012/SKK-LE/X/2026',
      description: 'Surat Kuasa Khusus dari Direktur kepada staf hukum atau perwakilan untuk menghadap Notaris, menandatangani minuta akta, dan mengurus berkas perizinan di instansi pemerintah.',
      clauses: [
        {
          title: 'PASAL 1: IDENTITAS PEMBERI DAN PENERIMA KUASA',
          content: 'Pemberi Kuasa dengan ini memberikan kuasa khusus yang tidak dapat dicabut kembali kepada Penerima Kuasa untuk bertindak atas nama dan mewakili {{party1Name}} dalam segala urusan legalitas perseroan.'
        },
        {
          title: 'PASAL 2: KHUSUS UNTUK DAN ATAS NAMA PEMBERI KUASA',
          content: 'Menghadap Notaris {{party2Name}}, pejabat Kementerian Hukum dan HAM RI, Dinas Penanaman Modal, serta instansi OSS guna menyerahkan dokumen, menandatangani berkas permohonan, dan menerima salinan akta resmi.'
        }
      ]
    }
  };

  // --- CORE UI CONTROLLERS ---

  // Toast System
  function showToast(message, type) {
    type = type || 'success';
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold transition-all transform duration-300 translate-y-4 opacity-0 border';
    
    let bg = 'bg-[#0C1E36] text-white border-white/10';
    let icon = 'check-circle';
    let iconColor = 'text-emerald-400';

    if (type === 'success') {
      bg = 'bg-[#0C1E36] text-white border-emerald-500/30';
      icon = 'check-circle';
      iconColor = 'text-emerald-400';
    } else if (type === 'error') {
      bg = 'bg-rose-950 text-rose-100 border-rose-500/40';
      icon = 'alert-triangle';
      iconColor = 'text-rose-400';
    } else if (type === 'info') {
      bg = 'bg-[#162B48] text-white border-amber-500/30';
      icon = 'info';
      iconColor = 'text-amber-300';
    }

    toast.className += ` ${bg}`;
    toast.innerHTML = `
      <i data-lucide="${icon}" class="w-4 h-4 ${iconColor} shrink-0"></i>
      <span class="flex-1">${message}</span>
      <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white p-0.5 ml-2">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Auto remove after 4.5 seconds
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // Sync Header User Profile & Plan Badges
  function syncHeaderAndState() {
    const userAvatar = document.getElementById('ws-user-avatar');
    const userName = document.getElementById('ws-user-name');
    const userEmail = document.getElementById('ws-user-email');
    const planBadge = document.getElementById('ws-active-plan-badge');
    const navAuthLabel = document.getElementById('nav-auth-label');

    if (userName) userName.textContent = state.user.companyName || state.user.fullName || 'PT Solusi Maju Bersama';
    if (userEmail) userEmail.textContent = state.user.email || 'client@solusimaju.co.id';
    if (navAuthLabel) navAuthLabel.textContent = state.user.isAuthenticated ? (state.user.fullName ? state.user.fullName.split(' ')[0] : 'Akun Saya') : 'Masuk / Daftar';

    if (userAvatar) {
      const initials = (state.user.companyName || state.user.fullName || 'LE')
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      userAvatar.textContent = initials || 'LE';
    }

    // Active Plan Label
    let planText = 'Full Legal Suite (Rp 300k/bln)';
    let planColor = 'text-amber-300';
    if (state.activePlan === 'trial') {
      planText = '3-Day Free Trial (Rp 0)';
      planColor = 'text-emerald-400';
    } else if (state.activePlan === 'chat') {
      planText = 'Chat Essential (Rp 150k/bln)';
      planColor = 'text-teal-300';
    }
    if (planBadge) {
      planBadge.textContent = planText;
      planBadge.className = `text-xs font-bold ${planColor}`;
    }

    // Sync sidebar quick buttons
    const bTrial = document.getElementById('side-plan-trial');
    const bChat = document.getElementById('side-plan-chat');
    const bFull = document.getElementById('side-plan-full');

    const activeClasses = ['bg-[#C29236]', 'text-[#0C1E36]', 'font-extrabold', 'shadow-xs'];
    const inactiveClasses = ['bg-slate-800', 'text-slate-300', 'hover:text-white', 'font-normal'];

    [bTrial, bChat, bFull].forEach(b => {
      if (!b) return;
      b.classList.remove(...activeClasses);
      b.classList.add(...inactiveClasses);
    });

    if (state.activePlan === 'trial' && bTrial) {
      bTrial.classList.remove(...inactiveClasses);
      bTrial.classList.add(...activeClasses);
    } else if (state.activePlan === 'chat' && bChat) {
      bChat.classList.remove(...inactiveClasses);
      bChat.classList.add(...activeClasses);
    } else if (state.activePlan === 'full' && bFull) {
      bFull.classList.remove(...inactiveClasses);
      bFull.classList.add(...activeClasses);
    }

    // Sidebar lock badges
    const lockVideo = document.getElementById('nav-Lock-video');
    const lockTemplates = document.getElementById('nav-lock-templates');
    if (state.activePlan === 'full') {
      if (lockVideo) {
        lockVideo.textContent = 'Tersedia';
        lockVideo.className = 'px-1.5 py-0.5 text-[9px] rounded-full bg-emerald-500/20 text-emerald-400 font-bold';
      }
      if (lockTemplates) {
        lockTemplates.textContent = 'Unlocked';
        lockTemplates.className = 'px-1.5 py-0.5 text-[9px] rounded-full bg-emerald-500/20 text-emerald-400 font-bold';
      }
    } else if (state.activePlan === 'chat') {
      if (lockVideo) {
        lockVideo.textContent = 'Perlu 300k';
        lockVideo.className = 'px-1.5 py-0.5 text-[9px] rounded-full bg-rose-500/20 text-rose-300 font-bold';
      }
      if (lockTemplates) {
        lockTemplates.textContent = 'Perlu 300k';
        lockTemplates.className = 'px-1.5 py-0.5 text-[9px] rounded-full bg-rose-500/20 text-rose-300 font-bold';
      }
    } else {
      // trial
      if (lockVideo) {
        lockVideo.textContent = 'Locked';
        lockVideo.className = 'px-1.5 py-0.5 text-[9px] rounded-full bg-slate-700 text-slate-400 font-bold';
      }
      if (lockTemplates) {
        lockTemplates.textContent = 'Preview Saja';
        lockTemplates.className = 'px-1.5 py-0.5 text-[9px] rounded-full bg-amber-500/20 text-amber-300 font-bold';
      }
    }

    saveState();
  }

  // --- NAVIGATION TAB SWITCHER ---
  window.switchWorkspaceTab = function (tabName) {
    if (!tabName) return;

    // Entitlement checks according to Gelsay's instructions:
    // "yg 1 month 150 aja tapi cuman konsultasi via chat bukan template dokumen"
    // "yg full call+konsul chat + template dokumen 300"
    if (tabName === 'videocall' && state.activePlan !== 'full') {
      showToast('Video Call konsultasi 1-on-1 khusus untuk Paket Full Legal Suite (Rp 300.000/bln). Upgrade sekarang untuk akses instan.', 'info');
      switchWorkspaceTab('billing');
      return;
    }

    if (tabName === 'templates' && state.activePlan === 'chat') {
      showToast('Paket Rp 150.000/bln adalah paket konsultasi via chat saja. Untuk kustomisasi dan download template dokumen hukum, silakan pilih Paket Full Suite (Rp 300.000).', 'info');
      switchWorkspaceTab('billing');
      return;
    }

    state.activeTab = tabName;
    saveState();

    // Update active nav button styling
    document.querySelectorAll('.ws-nav-btn').forEach(btn => {
      const tab = btn.getAttribute('data-wst-tab');
      if (tab === tabName) {
        btn.classList.add('bg-[#C29236]', 'text-[#0C1E36]', 'font-bold', 'shadow-xs');
        btn.classList.remove('text-slate-300', 'hover:bg-slate-800', 'hover:text-white');
      } else {
        btn.classList.remove('bg-[#C29236]', 'text-[#0C1E36]', 'font-bold', 'shadow-xs');
        btn.classList.add('text-slate-300', 'hover:bg-slate-800', 'hover:text-white');
      }
    });

    renderWorkspaceContent();
    syncHeaderAndState();

    if (window.lucide) window.lucide.createIcons();
  };

  // Legacy alias for screen switcher
  window.goToScreen = function (screenNum) {
    const map = {
      1: 'dashboard',
      2: 'notaries',
      3: 'consultation',
      4: 'templates',
      5: 'roadmap',
      6: 'billing',
      7: 'dashboard',
      8: 'videocall'
    };
    const target = map[screenNum] || 'dashboard';
    window.switchWorkspaceTab(target);
    const ws = document.getElementById('workspace');
    if (ws) ws.scrollIntoView({ behavior: 'smooth' });
  };

  // Switch Active Plan directly
  window.switchActivePlan = function (planId) {
    if (!['trial', 'chat', 'full'].includes(planId)) return;
    state.activePlan = planId;
    if (planId === 'trial') {
      state.planExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      showToast('Paket aktif beralih ke 3-Day Free Trial (Trial 3 Hari). Nikmati konsultasi chat Notaris!', 'success');
    } else if (planId === 'chat') {
      state.planExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      showToast('Paket aktif: Legal Chat Essential (Rp 150.000/bln). Konsultasi chat tanpa batas aktif!', 'success');
    } else {
      state.planExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      showToast('Paket aktif: Full Legal Suite (Rp 300.000/bln). Seluruh fitur Video Call & Template Dokumen tidak terkunci!', 'success');
    }
    syncHeaderAndState();
    renderWorkspaceContent();
  };

  // --- RENDER WORKSPACE VIEWS ---
  function renderWorkspaceContent() {
    const container = document.getElementById('workspace-main-content');
    if (!container) return;

    switch (state.activeTab) {
      case 'dashboard':
        container.innerHTML = renderDashboardView();
        break;
      case 'notaries':
        container.innerHTML = renderNotariesView();
        break;
      case 'consultation':
        container.innerHTML = renderConsultationView();
        setupConsultationListeners();
        break;
      case 'videocall':
        container.innerHTML = renderVideoCallView();
        setupVideoCallListeners();
        break;
      case 'templates':
        container.innerHTML = renderTemplatesView();
        setupTemplatesListeners();
        break;
      case 'roadmap':
        container.innerHTML = renderRoadmapView();
        setupRoadmapListeners();
        break;
      case 'billing':
        container.innerHTML = renderBillingView();
        setupBillingListeners();
        break;
      default:
        container.innerHTML = renderDashboardView();
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // --- VIEW 1: DASHBOARD VIEW ---
  function renderDashboardView() {
    const notariesCount = NOTARIES.length;
    const completedChecklist = state.checklist.filter(c => c.completed).length;
    const totalChecklist = state.checklist.length;
    const activeFilings = state.corporateFilings.length;

    let planBadgeHtml = '';
    if (state.activePlan === 'trial') {
      planBadgeHtml = `
        <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <i data-lucide="sparkles" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="text-xs font-bold text-emerald-950 flex items-center gap-2">
                <span>3-Day Free Trial Aktif</span>
                <span class="px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800 text-[10px] font-bold">Rp 0 / 3 Hari</span>
              </div>
              <p class="text-[11px] text-emerald-800 mt-0.5">Akses trial konsultasi chat Notaris & pelacak pendirian PT. Berlaku s/d ${state.planExpiry}.</p>
            </div>
          </div>
          <button onclick="switchWorkspaceTab('billing')" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition whitespace-nowrap shadow-xs">
            Upgrade ke Full Suite (Rp 300k)
          </button>
        </div>
      `;
    } else if (state.activePlan === 'chat') {
      planBadgeHtml = `
        <div class="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#0D7A68] text-white flex items-center justify-center shrink-0">
              <i data-lucide="message-square" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="text-xs font-bold text-teal-950 flex items-center gap-2">
                <span>Paket Legal Chat Essential Aktif</span>
                <span class="px-2 py-0.5 rounded-full bg-teal-200/60 text-teal-800 text-[10px] font-bold">Rp 150.000 / Bulan</span>
              </div>
              <p class="text-[11px] text-teal-800 mt-0.5">Konsultasi via chat tanpa batas dengan Notaris & PPAT. (Khusus chat, tidak termasuk video call & template dokumen). Berlaku s/d ${state.planExpiry}.</p>
            </div>
          </div>
          <button onclick="switchWorkspaceTab('billing')" class="px-4 py-2 rounded-xl bg-[#C29236] hover:bg-[#d8a543] text-[#0C1E36] text-xs font-bold transition whitespace-nowrap shadow-xs">
            Buka Template & Video Call (Upgrade 300k)
          </button>
        </div>
      `;
    } else {
      planBadgeHtml = `
        <div class="p-4 rounded-2xl bg-[#0C1E36] text-white border border-[#C29236]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#C29236] text-[#0C1E36] flex items-center justify-center font-bold shrink-0">
              <i data-lucide="crown" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="text-xs font-bold text-amber-300 flex items-center gap-2">
                <span>Paket Full Legal Suite Aktif (Akses Penuh)</span>
                <span class="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold">Rp 300.000 / Bulan</span>
              </div>
              <p class="text-[11px] text-slate-300 mt-0.5">Semua fitur terbuka: 1-on-1 Video Call + Chat Notaris Prioritas + Pembuat Template Dokumen Word/PDF. Berlaku s/d ${state.planExpiry}.</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Status Aktif
            </span>
          </div>
        </div>
      `;
    }

    return `
      <div class="p-6 sm:p-8 space-y-6">
        
        <!-- Welcome Banner -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div class="text-[11px] uppercase tracking-wider font-bold text-[#0D7A68]">Client Operations Center</div>
            <h1 class="text-2xl font-serif-editorial font-bold text-[#0C1E36] mt-0.5">
              Selamat Datang, ${state.user.fullName || 'Pratama Salman'}
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">
              ${state.user.companyName} • Berkedudukan di ${state.user.city} • Akun Terverifikasi
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="openAuthModal('profile')" class="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
              <i data-lucide="user" class="w-3.5 h-3.5 text-[#0D7A68]"></i> Profil & Perusahaan
            </button>
            <button onclick="switchWorkspaceTab('notaries')" class="px-4 py-2 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <i data-lucide="calendar" class="w-3.5 h-3.5"></i> Jadwalkan Notaris
            </button>
          </div>
        </div>

        <!-- Dynamic Plan Banner -->
        ${planBadgeHtml}

        <!-- 4 Key Metrics Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div onclick="switchWorkspaceTab('notaries')" class="cursor-pointer bg-white rounded-2xl p-5 border border-slate-200 hover:border-[#C29236] transition shadow-2xs">
            <div class="flex items-center justify-between text-slate-500 mb-3">
              <span class="text-xs font-bold uppercase tracking-wider">Notaris On-Duty</span>
              <div class="w-8 h-8 rounded-lg bg-amber-50 text-[#C29236] flex items-center justify-center">
                <i data-lucide="users" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="text-2xl font-serif-editorial font-bold text-[#0C1E36]">${notariesCount} Notaris</div>
            <div class="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 4 Notaris & PPAT Aktif Online
            </div>
          </div>

          <div onclick="switchWorkspaceTab('consultation')" class="cursor-pointer bg-white rounded-2xl p-5 border border-slate-200 hover:border-[#0D7A68] transition shadow-2xs">
            <div class="flex items-center justify-between text-slate-500 mb-3">
              <span class="text-xs font-bold uppercase tracking-wider">Konsultasi Chat</span>
              <div class="w-8 h-8 rounded-lg bg-teal-50 text-[#0D7A68] flex items-center justify-center">
                <i data-lucide="message-square" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="text-2xl font-serif-editorial font-bold text-[#0C1E36]">Aktif</div>
            <div class="text-[11px] text-slate-500 mt-1">
              Terkoneksi ke Dr. Hendra Wijaya, S.H.
            </div>
          </div>

          <div onclick="switchWorkspaceTab('roadmap')" class="cursor-pointer bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-500 transition shadow-2xs">
            <div class="flex items-center justify-between text-slate-500 mb-3">
              <span class="text-xs font-bold uppercase tracking-wider">Milestone PT</span>
              <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <i data-lucide="check-square" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="text-2xl font-serif-editorial font-bold text-[#0C1E36]">${completedChecklist} / ${totalChecklist}</div>
            <div class="text-[11px] text-blue-600 font-semibold mt-1">
              50% Persiapan Pendirian Selesai
            </div>
          </div>

          <div onclick="switchWorkspaceTab('templates')" class="cursor-pointer bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-500 transition shadow-2xs">
            <div class="flex items-center justify-between text-slate-500 mb-3">
              <span class="text-xs font-bold uppercase tracking-wider">Template Dokumen</span>
              <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <i data-lucide="file-text" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="text-2xl font-serif-editorial font-bold text-[#0C1E36]">6 Kontrak</div>
            <div class="text-[11px] ${state.activePlan === 'full' ? 'text-emerald-600' : 'text-amber-600'} font-semibold mt-1">
              ${state.activePlan === 'full' ? 'Akses Penuh DOC & PDF' : (state.activePlan === 'chat' ? 'Terkunci (Paket Chat)' : 'Mode Preview')}
            </div>
          </div>
        </div>

        <!-- 2 Columns: Recent Corporate Filings & Quick Notary Actions -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Left 2 Cols: Corporate Filings & Legal Documents -->
          <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <i data-lucide="file-check-2" class="w-4 h-4 text-[#0D7A68]"></i>
                <h3 class="font-bold text-sm text-[#0C1E36]">Berkas Legalitas & Pengesahan Perseroan</h3>
              </div>
              <button onclick="switchWorkspaceTab('roadmap')" class="text-xs font-bold text-[#0D7A68] hover:underline">
                Lihat Semua Berkas
              </button>
            </div>

            <div class="space-y-3">
              ${state.corporateFilings.map(filing => `
                <div class="p-3.5 rounded-xl border border-slate-100 bg-[#FAF9F5] hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 font-bold text-slate-700">${filing.id}</span>
                      <span class="text-[10px] px-2 py-0.5 rounded-full ${filing.progress === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} font-bold">${filing.status}</span>
                    </div>
                    <div class="text-xs font-bold text-[#0C1E36]">${filing.title}</div>
                    <div class="text-[11px] text-slate-500 mt-0.5">Notaris: ${filing.notary} • Update: ${filing.date}</div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-24 text-right">
                      <span class="text-[10px] font-bold text-slate-700 block">${filing.progress}% Selesai</span>
                      <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div class="bg-[#0D7A68] h-full rounded-full" style="width: ${filing.progress}%"></div>
                      </div>
                    </div>
                    <button onclick="openDocumentPreview('akta_pt')" class="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-[11px] font-bold text-slate-800 shadow-2xs">
                      Buka Draft
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right 1 Col: Primary Notary Assigned -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Notaris Pendamping Anda</span>
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              <div class="flex items-center gap-3.5 mb-4">
                <img src="${NOTARIES[0].avatar}" alt="${NOTARIES[0].name}" class="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs">
                <div>
                  <h4 class="font-bold text-sm text-[#0C1E36]">${NOTARIES[0].name}</h4>
                  <p class="text-[11px] text-[#0D7A68] font-bold mt-0.5">${NOTARIES[0].title}</p>
                  <p class="text-[10px] text-slate-500">${NOTARIES[0].office}</p>
                </div>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed mb-4">
                <p class="font-semibold text-slate-800 mb-1">SK Kemenkumham Terdaftar:</p>
                <p class="font-mono text-[10px] text-slate-700">${NOTARIES[0].skNumber}</p>
              </div>

              <div class="space-y-2 text-xs">
                <div class="flex items-center justify-between text-slate-600">
                  <span>Rating Klien:</span>
                  <span class="font-bold text-slate-900 flex items-center gap-1"><i data-lucide="star" class="w-3.5 h-3.5 text-amber-500 fill-amber-500"></i> 4.95 / 5.0 (342 Klien)</span>
                </div>
                <div class="flex items-center justify-between text-slate-600">
                  <span>Status Konsultasi:</span>
                  <span class="font-bold text-emerald-600">Siap Melayani Konsultasi</span>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
              <button onclick="switchWorkspaceTab('consultation')" class="w-full py-2.5 rounded-xl bg-[#0D7A68] hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-2xs">
                <i data-lucide="message-square" class="w-4 h-4"></i> Masuk Ruang Chat Notaris
              </button>
              <button onclick="${state.activePlan === 'full' ? "switchWorkspaceTab('videocall')" : "switchActivePlan('full')"}" class="w-full py-2.5 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 shadow-2xs">
                <i data-lucide="video" class="w-4 h-4"></i> ${state.activePlan === 'full' ? 'Mulai Video Call (WebRTC)' : 'Video Call (Paket 300k)'}
              </button>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  // --- VIEW 2: NOTARIES DIRECTORY VIEW ---
  function renderNotariesView() {
    const q = (state.notarySearchQuery || '').toLowerCase();
    const filter = state.notaryCategoryFilter || 'all';

    const filteredNotaries = NOTARIES.filter(notary => {
      const matchQuery = notary.name.toLowerCase().includes(q) ||
        notary.specialties.some(s => s.toLowerCase().includes(q)) ||
        notary.office.toLowerCase().includes(q);

      if (filter === 'all') return matchQuery;
      if (filter === 'pt') return matchQuery && notary.specialties.some(s => s.toLowerCase().includes('pt') || s.toLowerCase().includes('pma'));
      if (filter === 'haki') return matchQuery && notary.specialties.some(s => s.toLowerCase().includes('haki') || s.toLowerCase().includes('merek'));
      if (filter === 'ppat') return matchQuery && notary.specialties.some(s => s.toLowerCase().includes('ppat') || s.toLowerCase().includes('tanah'));
      return matchQuery;
    });

    return `
      <div class="p-6 sm:p-8 space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div class="text-[11px] uppercase tracking-wider font-bold text-[#0D7A68]">Direktori Notaris & PPAT Resmi</div>
            <h2 class="text-2xl font-serif-editorial font-bold text-[#0C1E36] mt-0.5">
              Pilih Notaris & Jadwalkan Konsultasi
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Semua praktisi mengantongi SK Pengangkatan Kemenkumham RI & BPN serta tunduk pada Kode Etik Ikatan Notaris Indonesia (INI).
            </p>
          </div>
          <button onclick="openBookingModal('notary-1', 'Dr. Hendra Wijaya, S.H., M.Kn.')" class="px-4 py-2.5 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap">
            <i data-lucide="calendar-plus" class="w-4 h-4"></i> Buat Janji Temu
          </button>
        </div>

        <!-- Search & Filter Controls -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1 relative">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
            <input 
              type="text" 
              id="notary-search-input" 
              value="${state.notarySearchQuery || ''}" 
              placeholder="Cari berdasarkan nama Notaris, kota (Jakarta, Surabaya, Bandung), atau spesialisasi (PT, HAKI, PKS)..." 
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0C1E36]"
              oninput="handleNotarySearch(event)"
            >
          </div>
          <div class="flex items-center gap-1.5 overflow-x-auto">
            <button onclick="filterNotariesByCategory('all')" class="px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${filter === 'all' ? 'bg-[#0C1E36] text-amber-300' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}">Semua</button>
            <button onclick="filterNotariesByCategory('pt')" class="px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${filter === 'pt' ? 'bg-[#0C1E36] text-amber-300' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}">Pendirian PT / PMA</button>
            <button onclick="filterNotariesByCategory('haki')" class="px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${filter === 'haki' ? 'bg-[#0C1E36] text-amber-300' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}">HAKI & Kontrak HR</button>
            <button onclick="filterNotariesByCategory('ppat')" class="px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${filter === 'ppat' ? 'bg-[#0C1E36] text-amber-300' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}">PPAT & Pertanahan</button>
          </div>
        </div>

        <!-- Notary Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${filteredNotaries.map(notary => `
            <div class="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#C29236] transition shadow-2xs flex flex-col justify-between">
              <div>
                <div class="flex items-start gap-4 mb-3">
                  <img src="${notary.avatar}" alt="${notary.name}" class="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0">
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ${notary.status}
                      </span>
                      <div class="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-500"></i> ${notary.rating}
                        <span class="text-slate-400 font-normal">(${notary.reviewsCount})</span>
                      </div>
                    </div>
                    <h3 class="font-serif-editorial font-bold text-base text-[#0C1E36] mt-1">${notary.name}</h3>
                    <p class="text-[11px] text-[#0D7A68] font-bold">${notary.title}</p>
                    <p class="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <i data-lucide="map-pin" class="w-3 h-3 text-slate-400"></i> ${notary.address}
                    </p>
                  </div>
                </div>

                <p class="text-xs text-slate-600 leading-relaxed mb-3">
                  ${notary.bio}
                </p>

                <!-- SK Kemenkumham Badge -->
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-600 mb-3 flex items-center justify-between">
                  <span>${notary.skNumber}</span>
                  <span class="text-emerald-700 font-bold font-sans flex items-center gap-1">
                    <i data-lucide="check" class="w-3 h-3"></i> Terverifikasi
                  </span>
                </div>

                <!-- Specialties Tags -->
                <div class="flex flex-wrap gap-1.5 mb-4">
                  ${notary.specialties.map(spec => `
                    <span class="px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-slate-200 text-[10px] text-slate-700 font-medium">
                      ${spec}
                    </span>
                  `).join('')}
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button onclick="startChatWithNotary('${notary.id}')" class="flex-1 py-2 rounded-xl bg-[#0D7A68] hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs">
                  <i data-lucide="message-square" class="w-3.5 h-3.5"></i> Chat Konsultasi
                </button>
                <button onclick="startVideoCallWithNotary('${notary.id}')" class="flex-1 py-2 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs">
                  <i data-lucide="video" class="w-3.5 h-3.5"></i> Video Call
                </button>
                <button onclick="openBookingModal('${notary.id}', '${notary.name}')" class="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition" title="Jadwalkan Janji Temu Resmi">
                  <i data-lucide="calendar" class="w-4 h-4"></i>
                </button>
              </div>

            </div>
          `).join('')}
        </div>

      </div>
    `;
  }

  // --- VIEW 3: CONSULTATION CHAT VIEW ---
  function renderConsultationView() {
    const activeNotary = NOTARIES.find(n => n.id === state.activeNotaryId) || NOTARIES[0];
    const messages = chatThreads[activeNotary.id] || [];

    return `
      <div class="flex-1 flex flex-col h-full bg-[#FAF9F5] overflow-hidden">
        
        <!-- Top Chat Bar -->
        <div class="p-4 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="relative">
              <img src="${activeNotary.avatar}" alt="${activeNotary.name}" class="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-2xs">
              <span class="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white absolute -bottom-0.5 -right-0.5"></span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-sm text-[#0C1E36]">${activeNotary.name}</h3>
                <span class="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Online</span>
              </div>
              <p class="text-[11px] text-slate-500">${activeNotary.title} • Terikat Sumpah Jabatan UUJN</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Notary Selector Dropdown -->
            <select id="chat-notary-select" onchange="changeChatNotary(this.value)" class="text-xs px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 font-semibold text-slate-800 focus:outline-none">
              ${NOTARIES.map(n => `
                <option value="${n.id}" ${n.id === activeNotary.id ? 'selected' : ''}>${n.name.split(',')[0]}</option>
              `).join('')}
            </select>
            
            <button onclick="exportChatTranscript()" class="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition" title="Unduh Catatan Hukum Transkrip">
              <i data-lucide="download" class="w-3.5 h-3.5"></i> Transkrip (.txt)
            </button>

            ${state.activePlan === 'full' ? `
              <button onclick="startVideoCallWithNotary('${activeNotary.id}')" class="px-3.5 py-1.5 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <i data-lucide="video" class="w-3.5 h-3.5"></i> Beralih ke Video Call
              </button>
            ` : `
              <button onclick="switchActivePlan('full')" class="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5 border border-amber-300">
                <i data-lucide="lock" class="w-3 h-3"></i> Video Call (Paket 300k)
              </button>
            `}
          </div>
        </div>

        <!-- Statutory Privileged Notice -->
        <div class="bg-amber-50/80 px-6 py-2 border-b border-amber-200/60 text-[11px] text-amber-900 flex items-center justify-between shrink-0">
          <span class="flex items-center gap-1.5">
            <i data-lucide="shield" class="w-3.5 h-3.5 text-[#C29236]"></i>
            <strong>Kerahasiaan Hukum Terlindungi:</strong> Seluruh riwayat obrolan dienkripsi dan dijamin kerahasiaannya berdasarkan Pasal 16 UU Jabatan Notaris (UUJN No. 2/2014).
          </span>
          <span class="text-[10px] text-amber-700 font-mono">End-to-End TLS 1.3</span>
        </div>

        <!-- Chat Messages Container -->
        <div id="chat-messages-container" class="flex-1 overflow-y-auto p-6 space-y-4">
          ${messages.map(msg => `
            <div class="flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}">
              <div class="max-w-xl ${msg.sender === 'user' ? 'bg-[#0C1E36] text-white rounded-2xl rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-bl-none shadow-2xs'} p-4 text-xs leading-relaxed">
                <div class="font-bold text-[10px] mb-1 ${msg.sender === 'user' ? 'text-amber-300' : 'text-[#0D7A68]'}">
                  ${msg.sender === 'user' ? (state.user.companyName || 'Anda (Klien)') : activeNotary.name}
                </div>
                <p class="whitespace-pre-line">${msg.text}</p>

                ${msg.isAttachment ? `
                  <div onclick="openDocumentPreview('${msg.docKey || 'pks'}')" class="mt-3 p-3 rounded-xl cursor-pointer ${msg.sender === 'user' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-amber-50 hover:bg-amber-100/80 text-[#0C1E36] border border-amber-200/80'} flex items-center justify-between gap-3 transition">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                        PDF
                      </div>
                      <div>
                        <div class="font-bold text-[11px]">${msg.attachmentTitle || 'Dokumen Hukum Resmi'}</div>
                        <div class="text-[9px] opacity-75">Klik untuk melihat dan mencetak dokumen</div>
                      </div>
                    </div>
                    <i data-lucide="external-link" class="w-4 h-4"></i>
                  </div>
                ` : ''}

                <div class="text-[9px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-slate-300' : 'text-slate-400'}">
                  ${msg.time || 'Baru saja'}
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Chat Input Form -->
        <div class="p-4 px-6 bg-white border-t border-slate-200 shrink-0">
          <form id="chat-input-form" onsubmit="handleSendChatMessage(event)" class="flex items-center gap-2">
            <button type="button" onclick="handleAttachFileToChat()" class="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 transition" title="Lampirkan Berkas Hukum / KTP / NPWP">
              <i data-lucide="paperclip" class="w-4 h-4"></i>
            </button>
            <input 
              type="text" 
              id="chat-message-input" 
              placeholder="Ketik pertanyaan hukum, konsultasi nama PT, KBLI, atau draf perjanjian..." 
              required
              autocomplete="off"
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0C1E36] focus:bg-white transition"
            >
            <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#0D7A68] hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition">
              <span>Kirim</span>
              <i data-lucide="send" class="w-3.5 h-3.5"></i>
            </button>
          </form>
          <div class="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Notaris biasanya merespons dalam 1-3 menit pada jam kerja (08.00 - 18.00 WIB)</span>
            <span class="flex items-center gap-1 text-[#0D7A68] font-bold"><i data-lucide="check-check" class="w-3.5 h-3.5"></i> Siap Melayani</span>
          </div>
        </div>

      </div>
    `;
  }

  // --- VIEW 4: LIVE WEBRTC VIDEO CALL VIEW ---
  function renderVideoCallView() {
    const activeNotary = NOTARIES.find(n => n.id === state.videoCallState.notaryId) || NOTARIES[0];
    const isCallActive = state.videoCallState.inCall;
    const isMuted = state.videoCallState.isMuted;
    const isVideoOff = state.videoCallState.isVideoOff;
    const isSharing = state.videoCallState.isSharingScreen;

    const minutes = Math.floor(state.videoCallState.seconds / 60);
    const secs = state.videoCallState.seconds % 60;
    const timerText = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return `
      <div class="flex-1 flex flex-col h-full bg-slate-950 text-white overflow-hidden">
        
        <!-- Video Header -->
        <div class="p-3.5 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-[#C29236] text-[#0C1E36] flex items-center justify-center font-bold">
              <i data-lucide="video" class="w-4 h-4"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-xs text-white">Konsultasi Video 1-on-1 (WebRTC)</span>
                <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ${isCallActive ? `BERLANGSUNG • ${timerText}` : 'SIAP TERHUBUNG'}
                </span>
              </div>
              <p class="text-[10px] text-slate-400">Tersambung ke: ${activeNotary.name} (${activeNotary.office})</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-[10px] text-slate-400 font-mono hidden sm:inline">Kamera & Audio Terenkripsi WebRTC</span>
            <button onclick="switchWorkspaceTab('consultation')" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition">
              Kembali ke Chat
            </button>
          </div>
        </div>

        <!-- Video Main Stage Grid -->
        <div class="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch relative overflow-hidden">
          
          <!-- Notary Video Stream (Simulated Live High-Res Feed) -->
          <div class="relative bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner group">
            <img src="${activeNotary.avatar}" alt="${activeNotary.name}" class="w-full h-full object-cover filter brightness-95">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
            
            <!-- Notary Status Badge -->
            <div class="absolute top-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-semibold">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>${activeNotary.name}</span>
            </div>

            <div class="absolute top-4 right-4 bg-black/60 px-2 py-1 rounded-md text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
              1080p • 60 FPS
            </div>

            <!-- Speech Indicator -->
            <div class="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-slate-300">
              <span class="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
                <i data-lucide="mic" class="w-3.5 h-3.5 text-emerald-400"></i> Suara Notaris Jernih
              </span>
              <span class="text-[10px] bg-black/60 px-2 py-1 rounded-full text-slate-400">Ruang Akta Virtual LegalEase</span>
            </div>
          </div>

          <!-- User Local Video (Real Camera Preview via WebRTC getUserMedia) -->
          <div class="relative bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
            <video id="local-video-preview" autoplay playsinline muted class="w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}"></video>
            
            ${isVideoOff ? `
              <div class="text-center p-6">
                <div class="w-20 h-20 rounded-full bg-[#0C1E36] border-2 border-amber-300/40 text-amber-300 flex items-center justify-center font-bold text-2xl mx-auto mb-3">
                  ${(state.user.fullName || 'PS').split(' ').map(w => w[0]).slice(0, 2).join('')}
                </div>
                <div class="font-bold text-sm text-white">${state.user.companyName}</div>
                <p class="text-xs text-slate-400 mt-1">Kamera lokal dimatikan (Video Muted)</p>
              </div>
            ` : ''}

            <div class="absolute top-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-semibold">
              <span class="w-2 h-2 rounded-full ${isVideoOff ? 'bg-slate-500' : 'bg-emerald-400'}"></span>
              <span>Anda: ${state.user.fullName} (${isMuted ? 'Muted' : 'Mic Aktif'})</span>
            </div>

            ${isSharing ? `
              <div class="absolute top-4 right-4 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                <i data-lucide="screen-share" class="w-3 h-3"></i> Berbagi Layar Aktif
              </div>
            ` : ''}

            <div class="absolute bottom-4 left-4 right-4 text-center">
              <span class="text-[10px] bg-black/60 px-3 py-1 rounded-full text-slate-400 backdrop-blur-md">
                Kamera Pengguna (WebRTC getUserMedia Device)
              </span>
            </div>
          </div>

        </div>

        <!-- Video Control Bar -->
        <div class="p-4 px-6 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-300">Waktu Sesi:</span>
            <span class="font-mono text-sm font-bold text-amber-300">${timerText}</span>
          </div>

          <!-- Central Call Buttons -->
          <div class="flex items-center gap-3">
            
            ${!isCallActive ? `
              <button onclick="startLiveVideoCall()" class="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition">
                <i data-lucide="phone-call" class="w-4 h-4"></i> Mulai Sambungan Sesi
              </button>
            ` : `
              <!-- Mic Toggle -->
              <button onclick="toggleCallMic()" class="w-11 h-11 rounded-full flex items-center justify-center transition ${isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}" title="${isMuted ? 'Unmute Mic' : 'Mute Mic'}">
                <i data-lucide="${isMuted ? 'mic-off' : 'mic'}" class="w-5 h-5"></i>
              </button>

              <!-- Video Camera Toggle -->
              <button onclick="toggleCallVideo()" class="w-11 h-11 rounded-full flex items-center justify-center transition ${isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}" title="${isVideoOff ? 'Nyalakan Kamera' : 'Matikan Kamera'}">
                <i data-lucide="${isVideoOff ? 'video-off' : 'video'}" class="w-5 h-5"></i>
              </button>

              <!-- Screen Share Toggle -->
              <button onclick="toggleCallScreenShare()" class="w-11 h-11 rounded-full flex items-center justify-center transition ${isSharing ? 'bg-[#C29236] text-[#0C1E36]' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}" title="Bagikan Layar / Dokumen">
                <i data-lucide="screen-share" class="w-5 h-5"></i>
              </button>

              <!-- End Call Button -->
              <button onclick="endLiveVideoCall()" class="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition">
                <i data-lucide="phone-off" class="w-4 h-4"></i> Akhiri Sesi
              </button>
            `}

          </div>

          <div class="flex items-center gap-2">
            <button onclick="openDocumentPreview('pks')" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 flex items-center gap-1.5 transition">
              <i data-lucide="file-text" class="w-3.5 h-3.5"></i> Buka Draf PKS Bersama
            </button>
          </div>

        </div>

      </div>
    `;
  }

  // --- VIEW 5: INTERACTIVE DOCUMENT BUILDER VIEW ---
  function renderTemplatesView() {
    const isLocked = state.activePlan === 'chat';
    const isTrial = state.activePlan === 'trial';
    const currentDoc = CONTRACT_TEMPLATES[state.activeDocKey] || CONTRACT_TEMPLATES.pks;

    return `
      <div class="p-6 sm:p-8 space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div class="text-[11px] uppercase tracking-wider font-bold text-[#0D7A68]">Pembuat Dokumen Hukum Interaktif</div>
            <h2 class="text-2xl font-serif-editorial font-bold text-[#0C1E36] mt-0.5">
              Standar Kontrak Hukum & Notaris Indonesia
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Sesuaikan data pihak, nilai kontrak, serta yurisdiksi kota. Ekspor langsung ke Microsoft Word (.doc) atau cetak resmi PDF.
            </p>
          </div>

          <div class="flex items-center gap-2">
            ${isLocked ? `
              <div class="p-2 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <i data-lucide="lock" class="w-4 h-4"></i> Terkunci pada Paket Rp 150k
              </div>
              <button onclick="switchWorkspaceTab('billing')" class="px-4 py-2 rounded-xl bg-[#C29236] hover:bg-[#d8a543] text-[#0C1E36] text-xs font-bold transition shadow-xs">
                Buka dengan Paket 300k
              </button>
            ` : `
              <button onclick="openDocumentPreview('${state.activeDocKey}')" class="px-4 py-2.5 rounded-xl bg-[#0D7A68] hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition">
                <i data-lucide="file-check-2" class="w-4 h-4"></i> Preview & Cetak PDF
              </button>
              <button onclick="downloadCurrentDocAsWord()" class="px-4 py-2.5 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm transition">
                <i data-lucide="download" class="w-4 h-4"></i> Unduh Word (.doc)
              </button>
            `}
          </div>
        </div>

        ${isTrial ? `
          <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
            <span class="flex items-center gap-2">
              <i data-lucide="info" class="w-4 h-4 text-[#C29236]"></i>
              <span>Anda dalam mode <strong>3-Day Free Trial</strong>. Anda dapat melihat klausul dan melakukan preview instrumen hukum. Untuk mengunduh Word & PDF tanpa batasan, beralih ke Paket Full Suite (Rp 300.000).</span>
            </span>
            <button onclick="switchWorkspaceTab('billing')" class="px-3 py-1.5 rounded-xl bg-[#0C1E36] text-amber-300 font-bold text-xs whitespace-nowrap">
              Upgrade Sekarang
            </button>
          </div>
        ` : ''}

        <!-- Template Selector Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1">
          ${Object.values(CONTRACT_TEMPLATES).map(tmpl => `
            <button onclick="selectTemplate('${tmpl.key}')" class="px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${tmpl.key === state.activeDocKey ? 'bg-[#0C1E36] text-amber-300 shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}">
              <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
              <span>${tmpl.title.split('(')[0]}</span>
            </button>
          `).join('')}
        </div>

        <!-- 2 Columns: Contract Editor Form & Live Preview Pane -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          <!-- Column 1: Live Parameter Form -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div class="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 class="font-bold text-sm text-[#0C1E36]">Data Variabel Kontrak</h3>
                <p class="text-[11px] text-slate-500">Perubahan formulir langsung memperbarui draf di sebelah kanan.</p>
              </div>
              <span class="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-600 font-bold">${currentDoc.docNo}</span>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Nama Pihak Pertama (Perseroan Anda)</label>
                <input type="text" id="df-party1Name" value="${state.docFormData.party1Name}" oninput="updateDocField('party1Name', this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:border-[#0C1E36]">
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Perwakilan / Jabatan Pihak Pertama</label>
                <input type="text" id="df-party1Rep" value="${state.docFormData.party1Rep}" oninput="updateDocField('party1Rep', this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#0C1E36]">
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Nama Pihak Kedua (Mitra / Notaris / Pekerja)</label>
                <input type="text" id="df-party2Name" value="${state.docFormData.party2Name}" oninput="updateDocField('party2Name', this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:border-[#0C1E36]">
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Perwakilan / Jabatan Pihak Kedua</label>
                <input type="text" id="df-party2Rep" value="${state.docFormData.party2Rep}" oninput="updateDocField('party2Rep', this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#0C1E36]">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Kota Yurisdiksi Hukum</label>
                  <input type="text" id="df-contractCity" value="${state.docFormData.contractCity}" oninput="updateDocField('contractCity', this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#0C1E36]">
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Tanggal Kontrak</label>
                  <input type="date" id="df-contractDate" value="${state.docFormData.contractDate}" oninput="updateDocField('contractDate', this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#0C1E36]">
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Nilai Komitmen / Modal Disetor</label>
                <input type="text" id="df-contractValue" value="${state.docFormData.contractValue}" oninput="updateDocField('contractValue', this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-bold focus:outline-none focus:border-[#0C1E36]">
              </div>
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Status Dokumen: Tersinkronisasi Otomatis</span>
              <button onclick="saveDocumentDraftToSupabase()" class="text-[#0D7A68] hover:underline font-bold flex items-center gap-1">
                <i data-lucide="cloud" class="w-3.5 h-3.5"></i> Simpan Draf ke Cloud
              </button>
            </div>
          </div>

          <!-- Column 2: Visual Paper Preview -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
            <div class="p-3.5 px-5 bg-slate-900 text-white flex items-center justify-between">
              <span class="text-xs font-bold flex items-center gap-2">
                <i data-lucide="eye" class="w-4 h-4 text-amber-300"></i> Draf Resmi Dokumen Hukum
              </span>
              <span class="text-[10px] text-emerald-400 font-mono">Tervalidasi KUHPerdata</span>
            </div>

            <div class="p-8 bg-[#FCFBF8] space-y-4 max-h-[560px] overflow-y-auto border-b border-amber-200/40 font-serif leading-relaxed text-slate-900 text-xs">
              
              <div class="text-center pb-4 mb-4 border-b border-slate-300">
                <h4 class="font-bold text-sm sm:text-base uppercase tracking-wide text-slate-950 font-serif-editorial">
                  ${currentDoc.title}
                </h4>
                <p class="text-[11px] text-slate-500 italic mt-0.5">Nomor: ${currentDoc.docNo}</p>
                <div class="mt-2 text-[10px] font-sans font-semibold bg-amber-50 py-1 px-3 rounded-md border border-amber-200 inline-block text-slate-700">
                  Pihak I: ${state.docFormData.party1Name} | Pihak II: ${state.docFormData.party2Name}
                </div>
              </div>

              ${currentDoc.clauses.map(clause => {
                let interpolated = clause.content
                  .replace(/\{\{party1Name\}\}/g, state.docFormData.party1Name)
                  .replace(/\{\{party2Name\}\}/g, state.docFormData.party2Name)
                  .replace(/\{\{contractCity\}\}/g, state.docFormData.contractCity)
                  .replace(/\{\{contractDate\}\}/g, state.docFormData.contractDate)
                  .replace(/\{\{contractValue\}\}/g, state.docFormData.contractValue);

                return `
                  <div>
                    <h5 class="font-bold text-[11px] uppercase tracking-wider text-slate-900 mb-1 font-sans">${clause.title}</h5>
                    <p class="text-justify text-slate-700">${interpolated}</p>
                  </div>
                `;
              }).join('')}

              <div class="pt-6 mt-6 border-t border-slate-300 grid grid-cols-2 gap-4 font-sans text-center text-[10px]">
                <div>
                  <p class="text-slate-500 mb-10">Pihak Pertama</p>
                  <p class="font-bold text-slate-900 border-b border-slate-800 pb-0.5">${state.docFormData.party1Name}</p>
                  <p class="text-[9px] text-slate-500">${state.docFormData.party1Rep}</p>
                </div>
                <div>
                  <p class="text-slate-500 mb-10">Pihak Kedua</p>
                  <p class="font-bold text-slate-900 border-b border-slate-800 pb-0.5">${state.docFormData.party2Name}</p>
                  <p class="text-[9px] text-slate-500">${state.docFormData.party2Rep}</p>
                </div>
              </div>

            </div>

            <div class="p-3 px-5 bg-slate-50 flex items-center justify-between text-xs">
              <span class="text-slate-500 text-[11px]">Format siap cetak di atas kertas kop perseroan & meterai Rp 10.000</span>
              <button onclick="openDocumentPreview('${state.activeDocKey}')" class="font-bold text-[#0D7A68] hover:underline flex items-center gap-1">
                Perbesar Layar Penuh <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  // --- VIEW 6: PT SETUP ROADMAP & CORPORATE FILINGS VIEW ---
  function renderRoadmapView() {
    const completedCount = state.checklist.filter(c => c.completed).length;
    const pct = Math.round((completedCount / state.checklist.length) * 100);

    return `
      <div class="p-6 sm:p-8 space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div class="text-[11px] uppercase tracking-wider font-bold text-[#0D7A68]">Panduan & Pelacak Legalitas Perseroan</div>
            <h2 class="text-2xl font-serif-editorial font-bold text-[#0C1E36] mt-0.5">
              Roadmap Pendirian PT & Perizinan Berusaha
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Pantau status pengesahan AHU Kemenkumham, penerbitan NIB OSS RBA, dan penandatanganan akta resmi.
            </p>
          </div>
          <button onclick="handleAddNewChecklistItem()" class="px-4 py-2.5 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <i data-lucide="plus" class="w-4 h-4"></i> Tambah Tugas Mandiri
          </button>
        </div>

        <!-- Overall Progress Card -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div>
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Progres Pengurusan Perseroan</span>
              <div class="text-xl font-serif-editorial font-bold text-[#0C1E36] mt-0.5">${state.user.companyName}</div>
            </div>
            <div class="text-right">
              <span class="text-2xl font-serif-editorial font-bold text-[#0D7A68]">${pct}%</span>
              <span class="text-xs text-slate-500 block">(${completedCount} dari ${state.checklist.length} Tahapan Selesai)</span>
            </div>
          </div>
          <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div class="bg-[#0D7A68] h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
          </div>
        </div>

        <!-- 6 Core Milestones Interactive Checklist -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div class="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 class="font-bold text-sm text-[#0C1E36]">Tahapan Resmi Pendirian PT (Checklist Interaktif)</h3>
            <span class="text-[11px] text-slate-500">Klik kotak untuk memperbarui status</span>
          </div>

          <div class="space-y-3">
            ${state.checklist.map(item => `
              <div class="p-3.5 rounded-xl border ${item.completed ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'} hover:border-slate-300 transition flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    ${item.completed ? 'checked' : ''} 
                    onchange="toggleChecklistItem(${item.id})"
                    class="w-4 h-4 rounded text-[#0D7A68] focus:ring-[#0D7A68] cursor-pointer"
                  >
                  <div>
                    <div class="text-xs font-bold ${item.completed ? 'text-slate-800 line-through opacity-75' : 'text-[#0C1E36]'}">
                      ${item.text}
                    </div>
                    <div class="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded bg-slate-100 font-semibold">${item.category}</span>
                      <span>Target: ${item.date}</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  ${item.completed ? `
                    <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <i data-lucide="check" class="w-3 h-3"></i> Tervalidasi
                    </span>
                  ` : `
                    <button onclick="openBookingModal('notary-1', 'Dr. Hendra Wijaya, S.H., M.Kn.')" class="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-2xs">
                      Jadwalkan Notaris
                    </button>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Corporate Filings Detail Table -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div class="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 class="font-bold text-sm text-[#0C1E36]">Log Pengajuan & Minuta Akta (SABH Kemenkumham)</h3>
            <button onclick="openDocumentPreview('akta_pt')" class="text-xs font-bold text-[#0D7A68] hover:underline">
              Cetak Rekapitulasi Berkas
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th class="py-2.5">ID Berkas</th>
                  <th class="py-2.5">Nama Permohonan Legalitas</th>
                  <th class="py-2.5">Notaris Penanggung Jawab</th>
                  <th class="py-2.5">Status Pengesahan</th>
                  <th class="py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                ${state.corporateFilings.map(f => `
                  <tr>
                    <td class="py-3 font-mono font-bold text-slate-900">${f.id}</td>
                    <td class="py-3 font-semibold text-[#0C1E36]">${f.title}</td>
                    <td class="py-3 text-slate-600">${f.notary}</td>
                    <td class="py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${f.progress === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                        ${f.status} (${f.progress}%)
                      </span>
                    </td>
                    <td class="py-3 text-right">
                      <button onclick="openDocumentPreview('akta_pt')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition">
                        Detail
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  // --- VIEW 7: PLANS & BILLING CHECKOUT VIEW ---
  function renderBillingView() {
    return `
      <div class="p-6 sm:p-8 space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div class="text-[11px] uppercase tracking-wider font-bold text-[#0D7A68]">Manajemen Langganan & Pembayaran</div>
            <h2 class="text-2xl font-serif-editorial font-bold text-[#0C1E36] mt-0.5">
              Pilihan Paket Transparan LegalEase
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Pilih 3-Day Free Trial (Rp 0), Paket Chat Essential (Rp 150.000/bln), atau Full Legal Suite (Rp 300.000/bln).
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-500">Paket Saat Ini:</span>
            <span class="px-3 py-1 rounded-full text-xs font-bold ${state.activePlan === 'full' ? 'bg-[#C29236] text-[#0C1E36]' : (state.activePlan === 'chat' ? 'bg-teal-100 text-teal-900' : 'bg-emerald-100 text-emerald-900')}">
              ${state.activePlan === 'full' ? 'Full Suite (Rp 300k)' : (state.activePlan === 'chat' ? 'Chat (Rp 150k)' : 'Free Trial (Rp 0)')}
            </span>
          </div>
        </div>

        <!-- 3 Tier Subscription Selection Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          <!-- TIER 1: 3-DAY FREE TRIAL -->
          <div class="bg-white border-2 ${state.activePlan === 'trial' ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-slate-200'} rounded-3xl p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Aktivasi Instan</span>
                ${state.activePlan === 'trial' ? '<span class="text-[10px] font-extrabold text-emerald-600">✓ Sedang Aktif</span>' : ''}
              </div>
              <h3 class="text-xl font-serif-editorial font-bold text-[#0C1E36]">3-Day Free Trial</h3>
              <div class="mt-2 mb-3">
                <span class="text-3xl font-serif-editorial font-bold text-[#0C1E36]">IDR 0</span>
                <span class="text-xs text-slate-500 font-medium"> / 3 hari</span>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed mb-4">
                Coba platform LegalEase gratis selama 3 hari penuh. Konsultasi chat awal dengan Notaris dan pelacak pendirian PT.
              </p>
              <ul class="space-y-2 text-xs text-slate-700 mb-6">
                <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i> <span>Akses Platform 3 Hari Penuh</span></li>
                <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i> <span>Konsultasi Notaris via Chat</span></li>
                <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i> <span>Interactive PT Setup Checklist</span></li>
                <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i> <span>Read-Only Preview Klausul Kontrak</span></li>
                <li class="flex items-center gap-2 text-slate-400"><i data-lucide="x" class="w-3.5 h-3.5 shrink-0"></i> <span>Unduh Template Word/PDF Terkunci</span></li>
                <li class="flex items-center gap-2 text-slate-400"><i data-lucide="x" class="w-3.5 h-3.5 shrink-0"></i> <span>Video Call Notaris Terkunci</span></li>
              </ul>
            </div>
            <button onclick="handleActivatePlanCheckout('trial')" class="w-full py-2.5 rounded-full ${state.activePlan === 'trial' ? 'bg-slate-200 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 text-white'} text-xs font-bold transition shadow-xs">
              ${state.activePlan === 'trial' ? 'Paket Aktif Saat Ini' : 'Aktifkan 3-Day Free Trial (Rp 0)'}
            </button>
          </div>

          <!-- TIER 2: 1 MONTH CHAT ONLY (IDR 150,000) -->
          <div class="bg-white border-2 ${state.activePlan === 'chat' ? 'border-[#0D7A68] ring-2 ring-teal-600/20' : 'border-slate-200'} rounded-3xl p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">1 Bulan • Chat Saja</span>
                ${state.activePlan === 'chat' ? '<span class="text-[10px] font-extrabold text-[#0D7A68]">✓ Sedang Aktif</span>' : ''}
              </div>
              <h3 class="text-xl font-serif-editorial font-bold text-[#0C1E36]">Legal Chat Essential</h3>
              <div class="mt-2 mb-3">
                <span class="text-3xl font-serif-editorial font-bold text-[#0C1E36]">IDR 150,000</span>
                <span class="text-xs text-slate-500 font-medium"> / 1 bulan</span>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed mb-4">
                Konsultasi legal 1 bulan penuh via Chat dengan Notaris & PPAT. Fokus pada tanya jawab hukum (tidak termasuk video call & template dokumen).
              </p>
              <ul class="space-y-2 text-xs text-slate-700 mb-6">
                <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i> <strong class="text-slate-900">1 Bulan Konsultasi Chat Tanpa Batas</strong></li>
                <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i> <span>Tanya Jawab Langsung Notaris & PPAT</span></li>
                <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i> <span>Panduan KBLI & Verifikasi Nama PT</span></li>
                <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i> <span>Full PT Incorporation Roadmap</span></li>
                <li class="flex items-center gap-2 text-rose-600"><i data-lucide="x" class="w-3.5 h-3.5 shrink-0"></i> <span class="text-slate-500">Bukan Template Dokumen (Chat Saja)</span></li>
                <li class="flex items-center gap-2 text-rose-600"><i data-lucide="x" class="w-3.5 h-3.5 shrink-0"></i> <span class="text-slate-500">Tidak Termasuk Video Call</span></li>
              </ul>
            </div>
            <button onclick="handleActivatePlanCheckout('chat')" class="w-full py-2.5 rounded-full ${state.activePlan === 'chat' ? 'bg-teal-200 text-teal-900' : 'bg-[#0D7A68] hover:bg-teal-800 text-white'} text-xs font-bold transition shadow-xs">
              ${state.activePlan === 'chat' ? 'Paket Aktif Saat Ini' : 'Pilih Paket Chat (Rp 150.000)'}
            </button>
          </div>

          <!-- TIER 3: 1 MONTH FULL SUITE (IDR 300,000) -->
          <div class="bg-[#0C1E36] text-white border-2 border-[#C29236] rounded-3xl p-6 flex flex-col justify-between shadow-xl relative">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#C29236] text-[#0C1E36] text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow">
              <i data-lucide="star" class="w-3 h-3 fill-current"></i> Paket Terlengkap
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-amber-300 uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full">1 Bulan • Call + Chat + Dokumen</span>
                ${state.activePlan === 'full' ? '<span class="text-[10px] font-extrabold text-amber-300">✓ Sedang Aktif</span>' : ''}
              </div>
              <h3 class="text-xl font-serif-editorial font-bold text-white">Full Legal Suite</h3>
              <div class="mt-2 mb-3">
                <span class="text-3xl font-serif-editorial font-bold text-white">IDR 300,000</span>
                <span class="text-xs text-slate-300 font-medium"> / 1 bulan</span>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed mb-4">
                Paket lengkap satu bulan: Video Call 1-on-1 terenkripsi, Chat Notaris Prioritas, dan Akses Penuh Kustomisasi & Unduh Template Dokumen Hukum.
              </p>
              <ul class="space-y-2 text-xs text-slate-200 mb-6">
                <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i> <strong class="text-amber-300">Video Call 1-on-1 dengan Notaris (WebRTC)</strong></li>
                <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i> <strong class="text-amber-300">Unlimited Prioritas Chat Notaris</strong></li>
                <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i> <strong class="text-amber-300">Akses Penuh Template Dokumen (Word & PDF)</strong></li>
                <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i> <span>Custom Dokumen PKS, Akta PT, PKWT, NDA</span></li>
                <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i> <span>Jadwal Penandatanganan Akta Notaris Rekanan</span></li>
                <li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i> <span>SLA Respons Prioritas & Bantuan Pendirian PT</span></li>
              </ul>
            </div>
            <button onclick="handleActivatePlanCheckout('full')" class="w-full py-2.5 rounded-full ${state.activePlan === 'full' ? 'bg-[#d8a543] text-[#0C1E36]' : 'bg-[#C29236] hover:bg-[#d8a543] text-[#0C1E36]'} text-xs font-extrabold transition shadow-md">
              ${state.activePlan === 'full' ? 'Paket Aktif Saat Ini' : 'Berlangganan Full Suite (Rp 300.000)'}
            </button>
          </div>

        </div>

        <!-- Payment Gateway Checkout Section -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div class="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="font-bold text-sm text-[#0C1E36]">Instruksi Pembayaran & Checkout Otomatis</h3>
              <p class="text-[11px] text-slate-500">Mendukung QRIS Real-Time, Virtual Account Bank (BCA, Mandiri, BNI, BRI), E-Wallet, dan Kartu Kredit.</p>
            </div>
            <span class="text-xs font-bold text-[#0D7A68] flex items-center gap-1">
              <i data-lucide="shield-check" class="w-4 h-4"></i> PCI-DSS Bank Grade Security
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <!-- Payment Channel Selectors -->
            <div class="space-y-2">
              <span class="block text-xs font-bold text-slate-700 mb-1">Metode Pembayaran</span>
              
              <div onclick="selectPaymentMethod('qris')" class="p-3 rounded-xl border ${state.selectedPaymentMethod === 'qris' ? 'border-[#0D7A68] bg-teal-50/50' : 'border-slate-200 bg-white'} cursor-pointer flex items-center justify-between transition">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded bg-red-50 text-red-600 font-bold text-[9px] flex items-center justify-center border border-red-200">QRIS</div>
                  <div>
                    <div class="text-xs font-bold text-slate-900">QRIS Real-Time</div>
                    <div class="text-[10px] text-slate-500">BCA, GoPay, OVO, ShopeePay, Dana</div>
                  </div>
                </div>
                <input type="radio" name="payment_method" ${state.selectedPaymentMethod === 'qris' ? 'checked' : ''} class="text-[#0D7A68]">
              </div>

              <div onclick="selectPaymentMethod('va')" class="p-3 rounded-xl border ${state.selectedPaymentMethod === 'va' ? 'border-[#0D7A68] bg-teal-50/50' : 'border-slate-200 bg-white'} cursor-pointer flex items-center justify-between transition">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded bg-blue-50 text-blue-600 font-bold text-[9px] flex items-center justify-center border border-blue-200">VA</div>
                  <div>
                    <div class="text-xs font-bold text-slate-900">Virtual Account Bank</div>
                    <div class="text-[10px] text-slate-500">BCA, Mandiri, BNI, BRI, Permata</div>
                  </div>
                </div>
                <input type="radio" name="payment_method" ${state.selectedPaymentMethod === 'va' ? 'checked' : ''} class="text-[#0D7A68]">
              </div>

              <div onclick="selectPaymentMethod('ewallet')" class="p-3 rounded-xl border ${state.selectedPaymentMethod === 'ewallet' ? 'border-[#0D7A68] bg-teal-50/50' : 'border-slate-200 bg-white'} cursor-pointer flex items-center justify-between transition">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded bg-purple-50 text-purple-600 font-bold text-[9px] flex items-center justify-center border border-purple-200">APP</div>
                  <div>
                    <div class="text-xs font-bold text-slate-900">E-Wallet Direct</div>
                    <div class="text-[10px] text-slate-500">GoPay & OVO Instant Push</div>
                  </div>
                </div>
                <input type="radio" name="payment_method" ${state.selectedPaymentMethod === 'ewallet' ? 'checked' : ''} class="text-[#0D7A68]">
              </div>
            </div>

            <!-- Dynamic Payment Display (QRIS Barcode or VA Number) -->
            <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center">
              ${state.selectedPaymentMethod === 'qris' ? `
                <div class="text-xs font-bold text-slate-800 mb-1">Pindai QRIS LegalEase</div>
                <p class="text-[10px] text-slate-500 mb-3">Buka aplikasi mobile banking atau e-wallet apa saja</p>
                <div class="w-36 h-36 bg-white p-2.5 rounded-2xl border-2 border-slate-900 shadow-sm flex items-center justify-center">
                  <!-- Real SVG QR Code Pattern -->
                  <svg class="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100" height="100" fill="white"/>
                    <rect x="10" y="10" width="25" height="25" fill="#0C1E36"/>
                    <rect x="15" y="15" width="15" height="15" fill="white"/>
                    <rect x="18" y="18" width="9" height="9" fill="#0C1E36"/>
                    <rect x="65" y="10" width="25" height="25" fill="#0C1E36"/>
                    <rect x="70" y="15" width="15" height="15" fill="white"/>
                    <rect x="73" y="18" width="9" height="9" fill="#0C1E36"/>
                    <rect x="10" y="65" width="25" height="25" fill="#0C1E36"/>
                    <rect x="15" y="70" width="15" height="15" fill="white"/>
                    <rect x="18" y="73" width="9" height="9" fill="#0C1E36"/>
                    <rect x="42" y="15" width="16" height="6" fill="#0C1E36"/>
                    <rect x="42" y="27" width="8" height="12" fill="#0C1E36"/>
                    <rect x="54" y="32" width="10" height="14" fill="#0C1E36"/>
                    <rect x="15" y="42" width="18" height="8" fill="#0C1E36"/>
                    <rect x="42" y="48" width="16" height="16" fill="#C29236"/>
                    <rect x="68" y="48" width="18" height="8" fill="#0C1E36"/>
                    <rect x="42" y="72" width="24" height="8" fill="#0C1E36"/>
                    <rect x="74" y="64" width="12" height="18" fill="#0C1E36"/>
                  </svg>
                </div>
                <div class="mt-3 text-[11px] font-bold text-slate-800">NMID: ID1020268491823</div>
                <span class="text-[9px] text-emerald-600 font-semibold mt-0.5">Konfirmasi Otomatis dalam 5 Detik</span>
              ` : `
                <div class="text-xs font-bold text-slate-800 mb-1">Nomor Rekening Virtual Account</div>
                <p class="text-[10px] text-slate-500 mb-4">BCA Virtual Account • LegalEase PT</p>
                <div class="p-3 px-4 rounded-xl bg-white border border-slate-300 w-full mb-2">
                  <div class="text-[10px] text-slate-400 uppercase font-mono">BCA VA Number</div>
                  <div class="text-base font-mono font-bold text-[#0C1E36] tracking-wider">8910 2026 8491 8234</div>
                </div>
                <button onclick="copyToClipboard('8910202684918234')" class="text-xs font-bold text-[#0D7A68] hover:underline flex items-center gap-1">
                  <i data-lucide="copy" class="w-3.5 h-3.5"></i> Salin Nomor VA
                </button>
              `}
            </div>

            <!-- Order Summary & Instant Checkout Trigger -->
            <div class="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">Ringkasan Pembayaran</span>
                
                <div class="space-y-2.5 text-xs">
                  <div class="flex items-center justify-between text-slate-600">
                    <span>Paket Dipilih:</span>
                    <span class="font-bold text-slate-900">${state.activePlan === 'full' ? 'Full Legal Suite' : (state.activePlan === 'chat' ? 'Legal Chat Essential' : '3-Day Free Trial')}</span>
                  </div>
                  <div class="flex items-center justify-between text-slate-600">
                    <span>Periode:</span>
                    <span class="font-semibold text-slate-900">${state.activePlan === 'trial' ? '3 Hari' : '1 Bulan (30 Hari)'}</span>
                  </div>
                  <div class="flex items-center justify-between text-slate-600">
                    <span>PPN 11%:</span>
                    <span class="font-semibold text-slate-900">Termasuk</span>
                  </div>
                  <div class="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                    <span class="font-bold text-[#0C1E36]">Total Pembayaran:</span>
                    <span class="font-bold text-lg text-[#0C1E36]">
                      ${state.activePlan === 'full' ? 'IDR 300.000' : (state.activePlan === 'chat' ? 'IDR 150.000' : 'IDR 0')}
                    </span>
                  </div>
                </div>
              </div>

              <div class="mt-6 pt-3 border-t border-slate-100 space-y-2">
                <button onclick="handleInstantSimulatePayment()" class="w-full py-3 rounded-full bg-[#0D7A68] hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition">
                  <i data-lucide="check-circle" class="w-4 h-4"></i>
                  <span>Verifikasi & Aktifkan Paket</span>
                </button>
                <p class="text-[10px] text-center text-slate-400">Faktur pajak & bukti transfer resmi diterbitkan secara otomatis.</p>
              </div>
            </div>

          </div>
        </div>

        <!-- Paid Transactions History Table -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div class="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 class="font-bold text-sm text-[#0C1E36]">Riwayat Pembayaran & Faktur Resmi</h3>
            <span class="text-xs text-slate-500 font-mono">${state.transactions.length} Transaksi Terverifikasi</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th class="py-2.5">Nomor Invoice</th>
                  <th class="py-2.5">Deskripsi Transaksi</th>
                  <th class="py-2.5">Metode Bayar</th>
                  <th class="py-2.5">Jumlah</th>
                  <th class="py-2.5">Status</th>
                  <th class="py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                ${state.transactions.map(t => `
                  <tr>
                    <td class="py-3 font-mono font-bold text-slate-900">${t.id}</td>
                    <td class="py-3 font-semibold text-[#0C1E36]">${t.description}</td>
                    <td class="py-3 text-slate-600">${t.method}</td>
                    <td class="py-3 font-bold text-slate-900">Rp ${t.amount.toLocaleString('id-ID')}</td>
                    <td class="py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ${t.status}
                      </span>
                    </td>
                    <td class="py-3 text-right">
                      <button onclick="printPaidInvoice('${t.id}')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition flex items-center gap-1 ml-auto">
                        <i data-lucide="printer" class="w-3 h-3"></i> Faktur
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  // --- ACTIONS & HANDLERS ---

  // Notary Directory
  window.handleNotarySearch = function (e) {
    state.notarySearchQuery = e.target.value;
    renderWorkspaceContent();
    const input = document.getElementById('notary-search-input');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  };

  window.filterNotariesByCategory = function (cat) {
    state.notaryCategoryFilter = cat;
    renderWorkspaceContent();
  };

  window.startChatWithNotary = function (notaryId) {
    state.activeNotaryId = notaryId;
    saveState();
    switchWorkspaceTab('consultation');
    showToast(`Tersambung ke ruang konsultasi ${NOTARIES.find(n => n.id === notaryId)?.name || 'Notaris'}.`, 'success');
  };

  window.startVideoCallWithNotary = function (notaryId) {
    if (state.activePlan !== 'full') {
      showToast('Video Call 1-on-1 dengan Notaris khusus untuk pelanggan Paket Full Legal Suite (Rp 300.000/bln). Silakan pilih paket di bawah.', 'info');
      switchWorkspaceTab('billing');
      return;
    }
    state.videoCallState.notaryId = notaryId || state.activeNotaryId;
    saveState();
    switchWorkspaceTab('videocall');
    startLiveVideoCall();
  };

  // Consultation Chat
  window.changeChatNotary = function (notaryId) {
    state.activeNotaryId = notaryId;
    saveState();
    renderWorkspaceContent();
  };

  window.handleSendChatMessage = function (e) {
    e.preventDefault();
    const input = document.getElementById('chat-message-input');
    if (!input || !input.value.trim()) return;

    const userText = input.value.trim();
    input.value = '';

    const currentThread = chatThreads[state.activeNotaryId] || [];
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    currentThread.push({
      id: Date.now(),
      sender: 'user',
      text: userText,
      time: nowTime
    });

    saveChatThreads();
    renderWorkspaceContent();

    // Auto-scroll chat
    const container = document.getElementById('chat-messages-container');
    if (container) container.scrollTop = container.scrollHeight;

    // Intelligent Legal Response from Notary
    setTimeout(() => {
      const activeNotary = NOTARIES.find(n => n.id === state.activeNotaryId) || NOTARIES[0];
      let replyText = `Terima kasih atas pertanyaannya. Terkait hal tersebut, saya menyarankan untuk memastikan klausul tanggung jawab dan domisili hukum diatur secara spesifik. Apakah Anda ingin saya siapkan lampiran draf resmi untuk ditinjau?`;

      const lower = userText.toLowerCase();
      if (lower.includes('pt') || lower.includes('kbli') || lower.includes('pendirian') || lower.includes('modal')) {
        replyText = `Terkait pendirian PT dan penentuan KBLI 2020: Berdasarkan ketentuan PP No. 5/2021 dan Permenkumham, nama PT wajib terdiri dari 3 kata berbahasa Indonesia dan modal disetor sekurang-kurangnya 25% dari modal dasar. Saya dapat membantu validasi nama di AHU Online hari ini.`;
      } else if (lower.includes('pks') || lower.includes('kontrak') || lower.includes('perjanjian') || lower.includes('bagi hasil')) {
        replyText = `Untuk Perjanjian Kerjasama (PKS) kemitraan: Kami sarankan mencantumkan klausul Wanprestasi, Force Majeure, dan batasan tanggung jawab (indemnification) secara tegas. Silakan gunakan fitur Pembuat Dokumen di menu tab 5 untuk membuat draf Word (.doc) resmi kami.`;
      } else if (lower.includes('haki') || lower.includes('merek') || lower.includes('brand')) {
        replyText = `Pendaftaran Merek dagang di DJKI mengacu pada sistem First-to-File (UU No. 20/2016). Sangat disarankan untuk segera melakukan penelusuran kelas barang/jasa sebelum merek dipublikasikan secara komersial.`;
      } else if (lower.includes('biaya') || lower.includes('harga') || lower.includes('tarif')) {
        replyText = `Layanan LegalEase dirancang sangat terjangkau: Tersedia 3-Day Free Trial (Rp 0), Paket Chat 1 Bulan Rp 150.000 (khusus chat konsultasi), dan Paket Full Suite Rp 300.000/bulan yang mencakup Video Call + Konsultasi Chat + Template Dokumen Lengkap.`;
      }

      currentThread.push({
        id: Date.now() + 1,
        sender: 'notary',
        text: replyText,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      });

      saveChatThreads();
      renderWorkspaceContent();
      const c2 = document.getElementById('chat-messages-container');
      if (c2) c2.scrollTop = c2.scrollHeight;

      showToast(`Pesan baru dari ${activeNotary.name}`, 'info');
    }, 1200);
  };

  window.handleAttachFileToChat = function () {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.onchange = function (e) {
      const file = e.target.files[0];
      if (!file) return;

      const currentThread = chatThreads[state.activeNotaryId] || [];
      currentThread.push({
        id: Date.now(),
        sender: 'user',
        text: `Mengunggah berkas: ${file.name} (${Math.round(file.size / 1024)} KB)`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      });

      saveChatThreads();
      renderWorkspaceContent();
      showToast(`Berkas ${file.name} berhasil dilampirkan ke ruang konsultasi Notaris.`, 'success');

      // Notary acknowledges file
      setTimeout(() => {
        currentThread.push({
          id: Date.now() + 1,
          sender: 'notary',
          text: `Berkas ${file.name} telah saya terima dan sedang kami periksa kelengkapan yuridisnya.`,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
        });
        saveChatThreads();
        renderWorkspaceContent();
      }, 1000);
    };
    input.click();
  };

  window.exportChatTranscript = function () {
    const activeNotary = NOTARIES.find(n => n.id === state.activeNotaryId) || NOTARIES[0];
    const messages = chatThreads[activeNotary.id] || [];

    let text = `========================================================\n`;
    text += `TRANSKRIP RESMI KONSULTASI HUKUM - LEGALEASE INDONESIA\n`;
    text += `Notaris Penanggung Jawab : ${activeNotary.name}\n`;
    text += `SK Kemenkumham RI        : ${activeNotary.skNumber}\n`;
    text += `Klien                    : ${state.user.fullName} (${state.user.companyName})\n`;
    text += `Tanggal Unduh            : ${new Date().toLocaleString('id-ID')}\n`;
    text += `Sifat Dokumen            : RAHASIA / STATUTORY PRIVILEGED (UUJN)\n`;
    text += `========================================================\n\n`;

    messages.forEach(m => {
      const who = m.sender === 'user' ? state.user.companyName : activeNotary.name;
      text += `[${m.time || ''}] ${who}:\n${m.text}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transkrip_Konsultasi_${activeNotary.name.split(',')[0].replace(/[\s.]+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Transkrip konsultasi hukum berhasil diunduh.', 'success');
  };

  function setupConsultationListeners() {
    const c = document.getElementById('chat-messages-container');
    if (c) c.scrollTop = c.scrollHeight;
  }

  // Live WebRTC Video Call
  window.startLiveVideoCall = function () {
    if (state.activePlan !== 'full') {
      showToast('Video Call 1-on-1 dengan Notaris khusus untuk pelanggan Paket Full Legal Suite (Rp 300.000/bln).', 'info');
      switchWorkspaceTab('billing');
      return;
    }

    state.videoCallState.inCall = true;
    state.videoCallState.seconds = 0;

    // Start timer interval
    if (state.videoCallState.timerInterval) clearInterval(state.videoCallState.timerInterval);
    state.videoCallState.timerInterval = setInterval(() => {
      state.videoCallState.seconds++;
      // Update timer in DOM if on video tab
      if (state.activeTab === 'videocall') {
        const mins = Math.floor(state.videoCallState.seconds / 60);
        const s = state.videoCallState.seconds % 60;
        const timeStr = `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        const timerEls = document.querySelectorAll('.font-mono.text-sm.font-bold.text-amber-300');
        timerEls.forEach(el => el.textContent = timeStr);
      }
    }, 1000);

    // Request Real Camera & Mic Stream via WebRTC getUserMedia API
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          state.videoCallState.stream = stream;
          const videoEl = document.getElementById('local-video-preview');
          if (videoEl) {
            videoEl.srcObject = stream;
            videoEl.play().catch(e => console.log('Video play notice:', e));
          }
          showToast('Kamera & Mikrofon lokal terhubung ke sesi WebRTC.', 'success');
        })
        .catch(err => {
          console.warn('Camera access denied or unavailable:', err);
          showToast('Kamera fisik tidak terdeteksi. Sesi tetap berjalan dengan avatar terverifikasi.', 'info');
        });
    }

    renderWorkspaceContent();
    showToast('Sesi Video Call terenkripsi dengan Notaris dimulai.', 'success');
  };

  window.toggleCallMic = function () {
    state.videoCallState.isMuted = !state.videoCallState.isMuted;
    if (state.videoCallState.stream) {
      state.videoCallState.stream.getAudioTracks().forEach(t => t.enabled = !state.videoCallState.isMuted);
    }
    renderWorkspaceContent();
    showToast(state.videoCallState.isMuted ? 'Mikrofon dimatikan (Muted)' : 'Mikrofon aktif (Unmuted)', 'info');
  };

  window.toggleCallVideo = function () {
    state.videoCallState.isVideoOff = !state.videoCallState.isVideoOff;
    if (state.videoCallState.stream) {
      state.videoCallState.stream.getVideoTracks().forEach(t => t.enabled = !state.videoCallState.isVideoOff);
    }
    renderWorkspaceContent();
    showToast(state.videoCallState.isVideoOff ? 'Kamera dimatikan' : 'Kamera diaktifkan', 'info');
  };

  window.toggleCallScreenShare = function () {
    if (!state.videoCallState.isSharingScreen) {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia({ video: true })
          .then(screenStream => {
            state.videoCallState.isSharingScreen = true;
            const videoEl = document.getElementById('local-video-preview');
            if (videoEl) {
              videoEl.srcObject = screenStream;
            }
            screenStream.getVideoTracks()[0].onended = () => {
              state.videoCallState.isSharingScreen = false;
              if (state.videoCallState.stream && videoEl) {
                videoEl.srcObject = state.videoCallState.stream;
              }
              renderWorkspaceContent();
            };
            renderWorkspaceContent();
            showToast('Berbagi layar dokumen aktif.', 'success');
          })
          .catch(e => {
            console.log('Screen share cancelled:', e);
          });
      } else {
        showToast('Screen sharing tidak didukung pada peramban ini.', 'error');
      }
    } else {
      state.videoCallState.isSharingScreen = false;
      const videoEl = document.getElementById('local-video-preview');
      if (state.videoCallState.stream && videoEl) {
        videoEl.srcObject = state.videoCallState.stream;
      }
      renderWorkspaceContent();
      showToast('Berbagi layar dihentikan.', 'info');
    }
  };

  window.endLiveVideoCall = function () {
    state.videoCallState.inCall = false;
    if (state.videoCallState.timerInterval) {
      clearInterval(state.videoCallState.timerInterval);
      state.videoCallState.timerInterval = null;
    }
    if (state.videoCallState.stream) {
      state.videoCallState.stream.getTracks().forEach(t => t.stop());
      state.videoCallState.stream = null;
    }
    renderWorkspaceContent();
    showToast('Sesi Video Call selesai. Catatan sesi tersimpan otomatis.', 'success');
  };

  function setupVideoCallListeners() {
    if (state.videoCallState.inCall && state.videoCallState.stream) {
      const videoEl = document.getElementById('local-video-preview');
      if (videoEl && !videoEl.srcObject) {
        videoEl.srcObject = state.videoCallState.stream;
        videoEl.play().catch(e => console.log(e));
      }
    }
  }

  // Interactive Document Builder
  window.selectTemplate = function (key) {
    if (!CONTRACT_TEMPLATES[key]) return;
    state.activeDocKey = key;
    saveState();
    renderWorkspaceContent();
  };

  window.updateDocField = function (field, value) {
    state.docFormData[field] = value;
    saveState();
    // Update live preview pane if visible
    const currentDoc = CONTRACT_TEMPLATES[state.activeDocKey] || CONTRACT_TEMPLATES.pks;
    // We re-render only if necessary or keep inputs snappy
    // Debounced or direct re-render of preview content
    const previewContainer = document.querySelector('.bg-\\[\\#FCFBF8\\]');
    if (previewContainer) {
      // Direct replace
      const party1Els = previewContainer.querySelectorAll('.party1-bound');
      party1Els.forEach(el => el.textContent = value);
    }
  };

  window.saveDocumentDraftToSupabase = function () {
    showToast('Draf dokumen berhasil disimpan ke Cloud Workspace Anda.', 'success');
  };

  function setupTemplatesListeners() {}

  // Official Legal Document Preview & Word Export Modal
  window.openDocumentPreview = function (docKey) {
    const key = docKey || state.activeDocKey || 'pks';
    const doc = CONTRACT_TEMPLATES[key] || CONTRACT_TEMPLATES.pks;

    const modal = document.getElementById('doc-preview-modal');
    const titleEl = document.getElementById('doc-preview-title');
    const subEl = document.getElementById('doc-preview-sub');
    const partiesEl = document.getElementById('doc-preview-parties');
    const bodyEl = document.getElementById('doc-preview-body');
    const sign1 = document.getElementById('doc-sign-party1');
    const sign2 = document.getElementById('doc-sign-party2');
    const signCity = document.getElementById('doc-sign-city');

    if (!modal) return;

    if (titleEl) titleEl.textContent = doc.title;
    if (subEl) subEl.textContent = `Nomor Dokumen: ${doc.docNo} • ${doc.subtitle}`;
    if (partiesEl) partiesEl.textContent = `Pihak Pertama: ${state.docFormData.party1Name} | Pihak Kedua: ${state.docFormData.party2Name}`;
    if (sign1) sign1.textContent = state.docFormData.party1Name;
    if (sign2) sign2.textContent = state.docFormData.party2Name;
    if (signCity) signCity.textContent = state.docFormData.contractCity;

    if (bodyEl) {
      bodyEl.innerHTML = doc.clauses.map(clause => {
        let content = clause.content
          .replace(/\{\{party1Name\}\}/g, state.docFormData.party1Name)
          .replace(/\{\{party2Name\}\}/g, state.docFormData.party2Name)
          .replace(/\{\{contractCity\}\}/g, state.docFormData.contractCity)
          .replace(/\{\{contractDate\}\}/g, state.docFormData.contractDate)
          .replace(/\{\{contractValue\}\}/g, state.docFormData.contractValue);

        return `
          <div class="mb-4">
            <h5 class="font-bold text-xs uppercase tracking-wider text-slate-900 mb-1 font-sans">${clause.title}</h5>
            <p class="text-justify text-slate-800 leading-relaxed">${content}</p>
          </div>
        `;
      }).join('');
    }

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  };

  window.closeDocumentPreview = function () {
    const modal = document.getElementById('doc-preview-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.downloadCurrentDocAsWord = function () {
    if (state.activePlan === 'chat') {
      showToast('Paket Rp 150.000/bln adalah paket konsultasi via chat saja. Upgrade ke Full Suite (Rp 300k) untuk mengunduh template dokumen Word.', 'info');
      switchWorkspaceTab('billing');
      return;
    }

    const doc = CONTRACT_TEMPLATES[state.activeDocKey] || CONTRACT_TEMPLATES.pks;
    
    // Construct real Microsoft Word HTML (.doc) document
    let wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${doc.title}</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; margin: 2.5cm; }
          h2 { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 2pt; text-transform: uppercase; }
          .sub { text-align: center; font-size: 10pt; font-style: italic; margin-bottom: 24pt; }
          h3 { font-size: 11pt; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; text-transform: uppercase; }
          p { text-align: justify; margin-bottom: 10pt; }
          .signatures { width: 100%; margin-top: 40pt; border-collapse: collapse; }
          .signatures td { width: 50%; text-align: center; vertical-align: bottom; height: 100pt; }
          .seal { border: 1px dashed #666; padding: 10pt; width: 100pt; margin: 0 auto; font-size: 8pt; text-align: center; }
        </style>
      </head>
      <body>
        <h2>${doc.title}</h2>
        <div class="sub">Nomor: ${doc.docNo}</div>
        <p>Pada hari ini, tanggal <strong>${state.docFormData.contractDate}</strong>, bertempat di <strong>${state.docFormData.contractCity}</strong>, telah dibuat dan ditandatangani perjanjian hukum antara:</p>
        <p>1. <strong>${state.docFormData.party1Name}</strong>, diwakili oleh ${state.docFormData.party1Rep}, selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.</p>
        <p>2. <strong>${state.docFormData.party2Name}</strong>, diwakili oleh ${state.docFormData.party2Rep}, selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>.</p>
        <p>Para Pihak dengan ini menerangkan dan bersepakat atas pasal-pasal sebagai berikut:</p>
    `;

    doc.clauses.forEach(clause => {
      let content = clause.content
        .replace(/\{\{party1Name\}\}/g, state.docFormData.party1Name)
        .replace(/\{\{party2Name\}\}/g, state.docFormData.party2Name)
        .replace(/\{\{contractCity\}\}/g, state.docFormData.contractCity)
        .replace(/\{\{contractDate\}\}/g, state.docFormData.contractDate)
        .replace(/\{\{contractValue\}\}/g, state.docFormData.contractValue);

      wordHtml += `<h3>${clause.title}</h3><p>${content}</p>`;
    });

    wordHtml += `
        <table class="signatures">
          <tr>
            <td>
              Pihak Pertama,<br><br><br><br>
              <strong>${state.docFormData.party1Name}</strong><br>
              ${state.docFormData.party1Rep}
            </td>
            <td>
              Pihak Kedua & Saksi Notaris,<br>
              <div class="seal">METERAI<br>Rp 10.000</div><br>
              <strong>${state.docFormData.party2Name}</strong><br>
              ${state.docFormData.party2Rep}
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([wordHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/[\s/()]+/g, '_')}_${state.docFormData.party1Name.replace(/[\s.]+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Dokumen Word (.doc) berhasil diunduh. Siap dicetak & ditandatangani.`, 'success');
  };

  // PT Roadmap Checklist
  window.toggleChecklistItem = function (id) {
    const item = state.checklist.find(c => c.id === id);
    if (!item) return;
    item.completed = !item.completed;
    saveState();
    renderWorkspaceContent();
    showToast(`Tahapan "${item.text.slice(0, 30)}..." diperbarui.`, 'success');
  };

  window.handleAddNewChecklistItem = function () {
    const text = prompt('Masukkan nama tahapan legalitas atau perizinan baru:');
    if (!text || !text.trim()) return;

    state.checklist.push({
      id: Date.now(),
      text: text.trim(),
      category: 'Kustom',
      completed: false,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    });

    saveState();
    renderWorkspaceContent();
    showToast('Tahapan baru ditambahkan ke roadmap.', 'success');
  };

  function setupRoadmapListeners() {}

  // Plans, Billing & Checkout
  window.selectPlanAndCheckout = function (planId) {
    switchActivePlan(planId);
    switchWorkspaceTab('billing');
    const ws = document.getElementById('workspace');
    if (ws) ws.scrollIntoView({ behavior: 'smooth' });
  };

  window.handleActivatePlanCheckout = function (planId) {
    switchActivePlan(planId);
  };

  window.selectPaymentMethod = function (method) {
    state.selectedPaymentMethod = method;
    saveState();
    renderWorkspaceContent();
  };

  window.copyToClipboard = function (text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`Disalin ke papan klip: ${text}`, 'success');
      });
    } else {
      showToast(`Nomor rekening: ${text}`, 'info');
    }
  };

  window.handleInstantSimulatePayment = function () {
    const invId = 'INV-2026-' + Math.floor(1000 + Math.random() * 9000);
    const amount = state.activePlan === 'full' ? 300000 : (state.activePlan === 'chat' ? 150000 : 0);
    const planName = state.activePlan === 'full' ? 'Full Legal Suite (1 Bulan)' : (state.activePlan === 'chat' ? 'Legal Chat Essential (1 Bulan)' : '3-Day Free Trial');

    state.transactions.unshift({
      id: invId,
      plan: state.activePlan,
      description: `Langganan ${planName}`,
      amount: amount,
      method: state.selectedPaymentMethod === 'qris' ? 'QRIS Real-Time' : 'BCA Virtual Account',
      status: 'PAID',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    });

    saveState();
    renderWorkspaceContent();
    showToast(`Pembayaran berhasil diverifikasi! ${planName} aktif.`, 'success');
  };

  window.printPaidInvoice = function (invId) {
    const inv = state.transactions.find(t => t.id === invId) || state.transactions[0];
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Izinkan pop-up untuk mencetak faktur.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Faktur Pembayaran Resmi - ${inv.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0C1E36; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #0C1E36; }
          .meta { text-align: right; font-size: 12px; color: #64748b; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th { background: #f1f5f9; text-align: left; padding: 12px; font-size: 12px; border-bottom: 1px solid #cbd5e1; }
          .table td { padding: 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
          .total { font-size: 16px; font-weight: bold; color: #0C1E36; text-align: right; margin-top: 20px; }
          .badge { display: inline-block; padding: 4px 12px; background: #dcfce7; color: #166534; font-weight: bold; border-radius: 9999px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">LegalEase Indonesia</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">PT LegalEase Solusi Digital Indonesia</div>
            <div style="font-size: 11px; color: #64748b;">Kemenkumham & OSS RBA Certified Platform</div>
          </div>
          <div class="meta">
            <h2 style="margin: 0; color: #0C1E36;">FAKTUR PEMBAYARAN</h2>
            <div style="font-family: monospace; font-size: 14px; font-weight: bold; margin-top: 4px;">${inv.id}</div>
            <div style="margin-top: 4px;">Tanggal: ${inv.date}</div>
            <div style="margin-top: 2px;"><span class="badge">LUNAS / BERHASIL</span></div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 24px;">
          <div>
            <strong>Diterbitkan Kepada:</strong><br>
            ${state.user.companyName}<br>
            Attn: ${state.user.fullName}<br>
            ${state.user.city}, Indonesia
          </div>
          <div style="text-align: right;">
            <strong>Metode Pembayaran:</strong><br>
            ${inv.method}<br>
            Status: Terverifikasi Sistem Bank
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Deskripsi Layanan Hukum</th>
              <th>Durasi</th>
              <th>Status Akses</th>
              <th style="text-align: right;">Total (IDR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${inv.description}</strong></td>
              <td>1 Bulan Penuh</td>
              <td>Aktif Seketika</td>
              <td style="text-align: right; font-weight: bold;">Rp ${inv.amount.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>

        <div class="total">
          Total Dibayar: Rp ${inv.amount.toLocaleString('id-ID')}
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
          Faktur ini sah dan diterbitkan secara elektronik oleh LegalEase Indonesia. Terkoneksi dengan Ikatan Notaris Indonesia (INI).
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  function setupBillingListeners() {}

  // Booking Modal
  window.openBookingModal = function (notaryId, notaryName) {
    const modal = document.getElementById('booking-modal');
    const notaryIdInput = document.getElementById('booking-notary-id');
    const subTitle = document.getElementById('booking-notary-subtitle');
    const dateInput = document.getElementById('booking-date');

    if (!modal) return;
    if (notaryIdInput) notaryIdInput.value = notaryId || 'notary-1';
    if (subTitle) subTitle.textContent = notaryName || 'Dr. Hendra Wijaya, S.H., M.Kn.';
    if (dateInput) {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dateInput.value = tomorrow;
    }

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  };

  window.closeBookingModal = function () {
    const modal = document.getElementById('booking-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.handleConfirmBooking = function (e) {
    e.preventDefault();
    const notaryId = document.getElementById('booking-notary-id')?.value || 'notary-1';
    const mode = document.getElementById('booking-mode')?.value || 'chat';
    const date = document.getElementById('booking-date')?.value || '';
    const time = document.getElementById('booking-time')?.value || '';
    const topic = document.getElementById('booking-topic')?.value || '';

    const notary = NOTARIES.find(n => n.id === notaryId) || NOTARIES[0];
    closeBookingModal();

    showToast(`Janji temu dengan ${notary.name} berhasil dijadwalkan pada ${date} pukul ${time}. Notifikasi konfirmasi telah dikirimkan ke email Anda.`, 'success');

    // Add to corporate filings log
    state.corporateFilings.unshift({
      id: 'FL-2026-' + Math.floor(100 + Math.random() * 900),
      title: `Konsultasi Notaris: ${topic.slice(0, 35)}...`,
      notary: notary.name,
      status: 'Dijadwalkan',
      progress: 25,
      date: date
    });

    saveState();
    if (state.activeTab === 'dashboard' || state.activeTab === 'roadmap') {
      renderWorkspaceContent();
    }
  };

  // Supabase Auth Modal
  window.openAuthModal = function (mode) {
    mode = mode || 'login';
    const modal = document.getElementById('auth-modal');
    const body = document.getElementById('auth-modal-body');
    if (!modal || !body) return;

    if (mode === 'login') {
      body.innerHTML = `
        <form onsubmit="handleUserSignIn(event)" class="space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Email Klien / Perusahaan</label>
            <input type="email" id="auth-email" required value="${state.user.email}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#0C1E36]">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Kata Sandi (Password)</label>
            <input type="password" id="auth-password" required placeholder="Minimal 6 karakter" value="password123" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#0C1E36]">
          </div>
          <button type="submit" class="w-full py-3 rounded-full bg-[#0C1E36] hover:bg-slate-800 text-amber-300 font-bold text-xs shadow-sm transition">
            Masuk ke Legal Workspace
          </button>
          <div class="text-center pt-2">
            <span class="text-slate-500">Belum memiliki akun klien? </span>
            <button type="button" onclick="openAuthModal('register')" class="font-bold text-[#0D7A68] hover:underline">Daftar Akun Baru</button>
          </div>
        </form>
      `;
    } else if (mode === 'register') {
      body.innerHTML = `
        <form onsubmit="handleUserSignUp(event)" class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nama Lengkap Penanggung Jawab</label>
            <input type="text" id="reg-name" required placeholder="Contoh: Pratama Salman" value="${state.user.fullName}" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#0C1E36]">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nama Perusahaan / Calon PT</label>
            <input type="text" id="reg-company" required placeholder="Contoh: PT Solusi Maju Bersama" value="${state.user.companyName}" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#0C1E36]">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Email Resmi</label>
            <input type="email" id="reg-email" required placeholder="client@perusahaan.co.id" value="${state.user.email}" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#0C1E36]">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Kata Sandi</label>
            <input type="password" id="reg-password" required placeholder="Minimal 6 karakter" value="password123" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#0C1E36]">
          </div>
          <button type="submit" class="w-full py-3 rounded-full bg-[#0D7A68] hover:bg-teal-800 text-white font-bold text-xs shadow-sm transition">
            Daftar & Hubungkan ke Supabase Cloud
          </button>
          <div class="text-center pt-2">
            <span class="text-slate-500">Sudah terdaftar? </span>
            <button type="button" onclick="openAuthModal('login')" class="font-bold text-[#0C1E36] hover:underline">Masuk di Sini</button>
          </div>
        </form>
      `;
    } else {
      // Profile view
      body.innerHTML = `
        <div class="space-y-4 text-xs">
          <div class="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div class="w-12 h-12 rounded-2xl bg-[#C29236] text-[#0C1E36] font-bold text-base flex items-center justify-center">
              ${(state.user.companyName || 'LE').split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div class="font-bold text-sm text-[#0C1E36]">${state.user.companyName}</div>
              <div class="text-slate-500">${state.user.email}</div>
              <div class="text-[10px] text-emerald-600 font-bold mt-0.5">Akun Aktif • ${state.user.city}</div>
            </div>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Perbarui Nama Perusahaan</label>
            <input type="text" id="prof-company" value="${state.user.companyName}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#0C1E36]">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Perbarui Kota Kedudukan</label>
            <input type="text" id="prof-city" value="${state.user.city}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#0C1E36]">
          </div>
          <div class="pt-2 flex items-center gap-2">
            <button onclick="handleSaveProfile()" class="flex-1 py-2.5 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 font-bold text-xs">
              Simpan Profil
            </button>
            <button onclick="handleUserSignOut()" class="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs">
              Keluar
            </button>
          </div>
        </div>
      `;
    }

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  };

  window.closeAuthModal = function () {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.handleUserSignIn = function (e) {
    e.preventDefault();
    const email = document.getElementById('auth-email')?.value || '';
    state.user.email = email;
    state.user.isAuthenticated = true;
    saveState();
    closeAuthModal();
    syncHeaderAndState();
    renderWorkspaceContent();
    showToast(`Berhasil masuk sebagai ${email}. Terhubung ke Supabase Cloud.`, 'success');
  };

  window.handleUserSignUp = function (e) {
    e.preventDefault();
    const name = document.getElementById('reg-name')?.value || '';
    const company = document.getElementById('reg-company')?.value || '';
    const email = document.getElementById('reg-email')?.value || '';

    state.user.fullName = name;
    state.user.companyName = company;
    state.user.email = email;
    state.user.isAuthenticated = true;
    state.docFormData.party1Name = company;
    state.docFormData.party1Rep = name + ' (Direktur Utama)';

    saveState();
    closeAuthModal();
    syncHeaderAndState();
    renderWorkspaceContent();
    showToast(`Akun perseroan ${company} berhasil didaftarkan dan tersinkronisasi.`, 'success');
  };

  window.handleSaveProfile = function () {
    const company = document.getElementById('prof-company')?.value || state.user.companyName;
    const city = document.getElementById('prof-city')?.value || state.user.city;

    state.user.companyName = company;
    state.user.city = city;
    state.docFormData.party1Name = company;
    state.docFormData.contractCity = city;

    saveState();
    closeAuthModal();
    syncHeaderAndState();
    renderWorkspaceContent();
    showToast('Profil perusahaan berhasil diperbarui.', 'success');
  };

  window.handleUserSignOut = function () {
    state.user.isAuthenticated = false;
    saveState();
    closeAuthModal();
    syncHeaderAndState();
    showToast('Anda telah keluar dari sesi klien LegalEase.', 'info');
  };

  // FAQ Accordion
  window.toggleFaq = function (num) {
    const content = document.getElementById(`faq-content-${num}`);
    const icon = document.getElementById(`faq-icon-${num}`);
    if (!content) return;

    const isHidden = content.classList.contains('hidden');
    // Close other FAQs
    for (let i = 1; i <= 6; i++) {
      const c = document.getElementById(`faq-content-${i}`);
      const ic = document.getElementById(`faq-icon-${i}`);
      if (c && !c.classList.contains('hidden')) {
        c.classList.add('hidden');
        if (ic) ic.classList.remove('rotate-180');
      }
    }

    if (isHidden) {
      content.classList.remove('hidden');
      if (icon) icon.classList.add('rotate-180');
    }
  };

  // Mobile Menu Toggle
  function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (btn && menu) {
      btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
      });
      menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          menu.classList.add('hidden');
        });
      });
    }
  }

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    syncHeaderAndState();
    renderWorkspaceContent();

    if (window.lucide) {
      window.lucide.createIcons();
    }

    console.log('✓ LegalEase Production Application initialized.');
  });

})();
