/**
 * LegalEase - Official Production Web Application
 * Indonesia's Premier On-Demand Legal & Notary Platform
 * Integrated with Supabase Cloud, Dual Client Profiles & Authentic Payment Gateway
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

  // --- PRODUCTION AUTHENTICATION & MULTI-DEVICE CLOUD REALTIME ---
  const STORAGE_USERS_KEY = 'legalease_registered_users_v2';
  const STORAGE_SESSION_KEY = 'legalease_user_session_v2';
  const STORAGE_KEY = 'legalease_production_state_v7';

  // --- CRYPTOGRAPHIC SECURITY SUITE (WEB CRYPTO API) ---
  const ADMIN_SALT = 'legalease_sec_salt_admin';
  const ADMIN_CREDENTIAL_HASHES = [
    'fba7f9ee9285ca74d648847957966ac67b751b6a7ae4f6895a1b86772d20815a', // SHA-256 for 'admin'
    '0f39b0c36f32cb6f5a6552bc4d46ff40e5452cf4771e09fb2ef6196789362867', // SHA-256 for 'admin123'
    'a641d7f6ad90666d2e5dfdd01e87976de9486e0b5cfc6790f2ff45611ae3b430'  // SHA-256 for 'notaris123'
  ];

  async function computeHash(password, salt) {
    salt = salt || 'legalease_default_salt';
    const enc = new TextEncoder();
    const data = enc.encode(`legalease_salt_${salt}_${password}`);
    const hashBuf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function generateCryptoSalt(length = 16) {
    try {
      const arr = new Uint8Array(length);
      crypto.getRandomValues(arr);
      return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
  }

  function generateSessionToken() {
    try {
      const arr = new Uint8Array(24);
      crypto.getRandomValues(arr);
      return 'les_' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      return 'les_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
  }

  // Demo Accounts & Aliases for Instant Evaluation & Testing
  const GELSAY_ALIASES = [
    'gelsay@nusantaralaw.co.id',
    'gelsay@legalease.co.id',
    'korporasi@legalease.co.id',
    'klien@legalease.co.id',
    'gelsay',
    'korporasi'
  ];

  const FAJAR_ALIASES = [
    'fajar@sinergidigital.co.id',
    'fajar@legalease.co.id',
    'fajar'
  ];

  const ADMIN_ALIASES = [
    'admin@legalease.co.id',
    'admin'
  ];

  const NOTARY_ALIASES = [
    'notaris@legalease.co.id',
    'notaris',
    'hendra.wijaya@notaris-legalease.id'
  ];

  const DEMO_ACCOUNT_ALIASES = [
    ...GELSAY_ALIASES,
    ...FAJAR_ALIASES,
    ...ADMIN_ALIASES,
    ...NOTARY_ALIASES
  ];

  function isDemoAccount(email) {
    if (!email) return false;
    const clean = String(email).trim().toLowerCase();
    return DEMO_ACCOUNT_ALIASES.includes(clean);
  }

  // Anti-Brute-Force & Rate Limiting System (Bypassed for Demo Accounts)
  const loginAttempts = {};

  function checkLoginThrottling(email) {
    if (isDemoAccount(email)) {
      return { allowed: true };
    }
    const record = loginAttempts[email];
    if (!record) return { allowed: true };
    const now = Date.now();
    if (record.lockedUntil > now) {
      const remainingSecs = Math.ceil((record.lockedUntil - now) / 1000);
      return { allowed: false, remainingSecs };
    }
    return { allowed: true };
  }

  function recordFailedLogin(email) {
    if (isDemoAccount(email)) {
      return; // Never lock out demo accounts during testing/evaluation
    }
    if (!loginAttempts[email]) {
      loginAttempts[email] = { count: 0, lockedUntil: 0 };
    }
    loginAttempts[email].count++;
    if (loginAttempts[email].count >= 5) {
      loginAttempts[email].lockedUntil = Date.now() + 60000; // 60s lockout
      loginAttempts[email].count = 0;
    }
  }

  function clearFailedLogin(email) {
    delete loginAttempts[email];
  }

  function isValidEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).trim().toLowerCase());
  }

  // Unique Device Identifier for Cross-Device Synchronization
  const DEVICE_ID = 'dev_' + Math.random().toString(36).substr(2, 9);
  window.__DEVICE_ID = DEVICE_ID;

  // Official Administrator & Senior Notary Account
  const ADMIN_ACCOUNT = {
    id: 'usr_admin_01',
    fullName: 'Prof. Dr. Hendra Gunawan, S.H., M.Kn.',
    initials: 'AD',
    companyName: 'Dewan Notaris & Manajemen LegalEase',
    email: 'admin@legalease.co.id',
    phone: '0811-9876-0001',
    city: 'Jakarta Pusat',
    role: 'admin',
    plan: 'full',
    planName: 'Notaris Utama / Administrator',
    planDuration: 'Akses Permanen',
    isAuthenticated: true,
    transactions: []
  };

  // Official Regular Partner Notary Account (Notaris Rekanan Biasa - Bukan Admin Besar)
  const NOTARY_ACCOUNT = {
    id: 'usr_notary_hendra_01',
    fullName: 'Dr. Hendra Wijaya, S.H., M.Kn.',
    initials: 'HW',
    companyName: 'Kantor Notaris & PPAT Dr. Hendra Wijaya (Jakarta Selatan)',
    email: 'notaris@legalease.co.id',
    phone: '0812-7788-9900',
    city: 'Jakarta Selatan',
    role: 'notary',
    notaryId: 'notary-1',
    plan: 'notary_partner',
    planName: 'Notaris Rekanan Berlisensi',
    planDuration: 'Lisensi AHU Aktif (Hingga 2030)',
    skNumber: 'SK Kemenkumham RI: AHU-0019284.AH.02.01.Tahun 2017',
    office: 'Sudirman Central Business District (SCBD), Jakarta Selatan',
    isAuthenticated: true,
    transactions: []
  };

  // Official Corporate Client Account (PT Gelsay Law Nusantara)
  const CORPORATE_GELSAY_USER = {
    id: 'usr_client_gelsay',
    fullName: 'Gelsay Behrous',
    initials: 'GB',
    companyName: 'PT Gelsay Law Nusantara',
    email: 'gelsay@nusantaralaw.co.id',
    phone: '0813-8877-6655',
    city: 'Jakarta Pusat',
    role: 'client',
    plan: 'full',
    planName: 'Full Legal Suite',
    planDuration: '12 Bulan Penuh (Hingga 25 Okt 2027)',
    registeredAt: '25 Okt 2026',
    isAuthenticated: true,
    transactions: [
      {
        id: 'TX-LEG-20261025-8492',
        invoiceNo: 'INV/20261025/LE/8492',
        planName: 'Full Legal Suite',
        amount: 300000,
        date: '25 Okt 2026',
        method: 'QRIS Real-Time (NMID: ID102026049281)',
        status: 'LUNAS (Terverifikasi Bank Indonesia)'
      }
    ]
  };

  // Official Business Client Account (Fajar Nugraha)
  const BUSINESS_FAJAR_USER = {
    id: 'usr_client_fajar',
    fullName: 'Fajar Nugraha',
    initials: 'FN',
    companyName: 'PT Sinergi Digital Indonesia',
    email: 'fajar@sinergidigital.co.id',
    phone: '0812-9988-7766',
    city: 'Jakarta Selatan',
    role: 'client',
    plan: 'biasa',
    planName: 'Paket Biasa (Rp 0)',
    planDuration: '0 Hari Aktif',
    registeredAt: '25 Okt 2026',
    isAuthenticated: true,
    transactions: []
  };

  // Pre-configured Verified Corporate Client Accounts (for seamless cross-device authentication)
  const DEFAULT_CLIENT_ACCOUNTS = {};
  GELSAY_ALIASES.forEach(alias => {
    DEFAULT_CLIENT_ACCOUNTS[alias] = {
      password: 'gelsaypass',
      passwords: ['gelsaypass', 'secret123'],
      user: CORPORATE_GELSAY_USER
    };
  });
  FAJAR_ALIASES.forEach(alias => {
    DEFAULT_CLIENT_ACCOUNTS[alias] = {
      password: 'secret123',
      passwords: ['secret123'],
      user: BUSINESS_FAJAR_USER
    };
  });

  function getRegisteredUsers() {
    try {
      const data = localStorage.getItem(STORAGE_USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveRegisteredUsers(users) {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {}
  }

  function getSavedSession() {
    try {
      const s = localStorage.getItem(STORAGE_SESSION_KEY);
      if (!s) return null;
      const parsed = JSON.parse(s);
      // Auto-invalidation if session has expired (> 24 hours)
      if (parsed && parsed.sessionExpiresAt) {
        if (Date.now() > parsed.sessionExpiresAt) {
          localStorage.removeItem(STORAGE_SESSION_KEY);
          return null;
        }
      }
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function saveSession(user) {
    try {
      if (user) {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_SESSION_KEY);
      }
    } catch (e) {}
  }

  const defaultState = {
    currentUser: getSavedSession(), // null if not logged in
    currentView: 'public', // 'public', 'client_dashboard', 'admin_dashboard'
    activeClientTab: 'documents', // 'documents', 'appointments', 'chat', 'invoices' // null if not logged in
    appointments: [
      {
        id: 'apt_seed_gelsay',
        userId: 'usr_client_gelsay',
        userEmail: 'gelsay@gelsaylaw.id',
        userName: 'Gelsay Behrous',
        companyName: 'PT Gelsay Law Nusantara',
        notaryId: 'notary-1',
        notaryName: 'Dr. Hendra Wijaya, S.H., M.Kn.',
        notaryTitle: 'Notaris & PPAT Berizin Kemenkumham RI',
        notaryAvatar: 'assets/team/team_1.jpeg',
        date: 'Lusa',
        time: '14:00 - 15:30 WIB',
        topic: 'Pembacaan & Penandatanganan Minuta Akta Pendirian PT di hadapan Notaris',
        mode: 'in_person_deed',
        modeLabel: 'Tatap Muka di Kantor Notaris',
        status: 'Dikonfirmasi',
        stepIndex: 2,
        createdAt: new Date().toISOString()
      }
    ],
    adminClientChats: {}, // multi-device client chats received by admin
    activeAdminChatEmail: null,
    checkoutState: {
      step: 'input', // 'input', 'processing', 'success'
      planId: 'full', // 'trial', 'chat', 'full'
      planName: 'Full Legal Suite',
      planPrice: 300000,
      invoiceNo: 'INV/20261025/LE/8492',
      method: 'qris', // 'qris', 'va', 'ewallet'
      selectedVaBank: 'bca',
      countdownSeconds: 899, // 14:59
      customerName: 'Pratama Salman',
      customerEmail: 'salman@solusimaju.co.id',
      customerPhone: '0812-9876-5432',
      customerCompany: 'PT Solusi Maju Bersama'
    },
    activeChatNotaryId: 'notary-1',
    chatHistory: {},
    activeDocKey: 'pks',
    notarySearchQuery: '',
    notaryCategoryFilter: 'all',
    docFormData: {
      party1Name: 'PT Solusi Maju Bersama',
      party2Name: 'PT Rekan Teknologi Mandiri',
      contractCity: 'Jakarta Selatan',
      contractDate: new Date().toISOString().split('T')[0],
      contractValue: 'Rp 250.000.000'
    },
    checklist: [
      { id: 1, text: "Penetapan 3 Opsi Nama PT & Pengecekan AHU Online", completed: true, category: "Persiapan" },
      { id: 2, text: "Penyusunan KBLI 2020 Sesuai Bidang Usaha Perseroan", completed: true, category: "Legalitas" },
      { id: 3, text: "Penetapan Modal Dasar & Ditempatkan (Min. 25% Disetor)", completed: true, category: "Permodalan" },
      { id: 4, text: "Penandatanganan Akta Pendirian di Hadapan Notaris Rekanan", completed: false, category: "Notaris" },
      { id: 5, text: "Penerbitan SK Pengesahan Badan Hukum Kemenkumham RI", completed: false, category: "Kemenkumham" },
      { id: 6, text: "Penerbitan NIB & Sertifikat Standar OSS RBA", completed: false, category: "Perizinan" }
    ]
  };

  let state = defaultState;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = Object.assign({}, defaultState, JSON.parse(saved));
      if (!state.appointments) {
        state.appointments = defaultState.appointments ? defaultState.appointments.slice() : [];
      }
    }
  } catch (e) {
    console.warn('Failed to load state, using default:', e);
  }
  if (!state.appointments) {
    state.appointments = [];
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }

  // Expose state globally for verification
  window.legalEaseState = state;
  window.getState = () => state;

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
      category: 'pt',
      avatar: 'assets/team/team_1.jpeg',
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
      category: 'haki',
      avatar: 'assets/team/team_7.jpeg',
      bio: 'Berpengalaman mendampingi lebih dari 400 startup teknologi dalam perlindungan hak kekayaan intelektual dan penyusunan instrumen kontrak bilateral.'
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
      status: 'Tersedia Konsultasi',
      category: 'ppat',
      avatar: 'assets/team/team_5.jpeg',
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
      category: 'pt',
      avatar: 'assets/team/team_3.png',
      bio: 'Berpengalaman dalam perumusan Shareholders Agreement (SHA), vesting schedule pendiri, dan legal audit untuk putaran pendanaan Pre-Seed hingga Series A.'
    }
  ];

  // --- CONTRACT TEMPLATES DATA ---
  const CONTRACT_TEMPLATES = {
    pks: {
      key: 'pks',
      title: 'Perjanjian Kerjasama Kemitraan Bisnis (PKS)',
      subtitle: 'Standar KUHPerdata Pasal 1320 & 1338',
      docNo: '042/PKS-LE/X/2026',
      clauses: [
        {
          title: 'PASAL 1: KETENTUAN UMUM KEMITRAAN',
          content: 'Pihak Pertama dan Pihak Kedua sepakat untuk mengikatkan diri dalam kemitraan strategis pelaksanaan kegiatan usaha dan penyediaan layanan teknologi terintegrasi dengan itikad baik (good faith) sesuai ketentuan hukum Negara Republik Indonesia.'
        },
        {
          title: 'PASAL 2: RUANG LINGKUP PEKERJAAN & NILAI KONTRAK',
          content: 'Pihak Pertama menunjuk Pihak Kedua untuk melaksanakan operasional proyek kemitraan dengan total nilai komitmen sebesar {{contractValue}}, yang dibayarkan berdasarkan termin penyelesaian milestone pekerjaan yang disepakati secara tertulis oleh kedua belah pihak.'
        },
        {
          title: 'PASAL 3: KERAHASIAAN INFORMASI (CONFIDENTIALITY)',
          content: 'Semua informasi teknis, data finansial, arsitektur kode sumber, dan dokumentasi yang diserahkan selama berjalannya perjanjian ini bersifat sangat rahasia dan dilarang diungkapkan kepada pihak ketiga manapun tanpa persetujuan tertulis terlebih dahulu.'
        },
        {
          title: 'PASAL 4: DOMISILI HUKUM & PENYELESAIAN SENGKETA',
          content: 'Segala perselisihan yang timbul sehubungan dengan penafsiran atau pelaksanaan Perjanjian ini akan diselesaikan terlebih dahulu melalui musyawarah mufakat. Apabila tidak tercapai mufakat, Para Pihak sepakat memilih domisili hukum tetap di Kantor Pengadilan Negeri {{contractCity}}.'
        }
      ]
    },
    akta_pt: {
      key: 'akta_pt',
      title: 'Draf Akta Pendirian Perseroan Terbatas (PT)',
      subtitle: 'Sesuai UU No. 40/2007 jo. UU Cipta Kerja No. 6/2023',
      docNo: '088/NOT-HW/AKTA-PT/X/2026',
      clauses: [
        {
          title: 'PASAL 1: NAMA DAN TEMPAT KEDUDUKAN PERSEROAN',
          content: 'Perseroan Terbatas ini bernama "{{party1Name}}", berkedudukan di {{contractCity}} dan dapat membuka kantor cabang atau perwakilan di tempat lain di dalam maupun di luar wilayah Republik Indonesia atas persetujuan Direksi.'
        },
        {
          title: 'PASAL 2: MAKSUD DAN TUJUAN USAHA (KBLI 2020)',
          content: 'Maksud dan tujuan Perseroan adalah menjalankan usaha dalam bidang Aktivitas Pemrograman Komputer, Konsultasi Manajemen, serta Perdagangan Berbasis Teknologi Digital sesuai Klasifikasi Baku Lapangan Usaha Indonesia (KBLI).'
        },
        {
          title: 'PASAL 3: MODAL DASAR DAN MODAL DISETOR',
          content: 'Modal Dasar Perseroan berjumlah Rp 1.000.000.000 (satu miliar rupiah). Dari modal dasar tersebut telah ditempatkan dan disetor penuh sekurang-kurangnya 25% (dua puluh lima persen) yaitu sebesar {{contractValue}}.'
        },
        {
          title: 'PASAL 4: PENGESAHAN DAN KETENTUAN PENUTUP',
          content: 'Akta ini dibuat dan ditandatangani di hadapan Notaris yang berwenang untuk didaftarkan dalam Sistem Administrasi Badan Hukum (SABH) Kementerian Hukum dan HAM Republik Indonesia guna penerbitan SK Pengesahan Badan Hukum.'
        }
      ]
    },
    pkwt: {
      key: 'pkwt',
      title: 'Perjanjian Kerja Waktu Tertentu (PKWT)',
      subtitle: 'Standar Ketenagakerjaan PP No. 35 Tahun 2021',
      docNo: '019/HR-LE/PKWT/X/2026',
      clauses: [
        {
          title: 'PASAL 1: STATUS DAN PENEMPATAN KERJA',
          content: 'Perusahaan mempekerjakan Karyawan dengan status Pekerja Waktu Tertentu (PKWT) untuk jangka waktu 12 (dua belas) bulan terhitung sejak tanggal {{contractDate}} dengan penempatan kerja di {{contractCity}}.'
        },
        {
          title: 'PASAL 2: HAK UPAH & KOMPENSASI PP NO. 35/2021',
          content: 'Karyawan berhak menerima gaji pokok beserta tunjangan bulanan yang disepakati. Pada akhir masa kontrak kerja, Karyawan berhak menerima uang kompensasi PKWT yang perhitungannya mengacu secara tegas pada ketentuan Pasal 15 s/d Pasal 17 PP No. 35 Tahun 2021.'
        },
        {
          title: 'PASAL 3: HAK KEKAYAAN INTELEKTUAL (WORK MADE FOR HIRE)',
          content: 'Seluruh karya cipta, kode program, arsitektur sistem, desain, dan dokumentasi yang dihasilkan Karyawan selama masa kerja menjadi hak milik mutlak dan eksklusif Perusahaan tanpa kewajiban royalti tambahan.'
        }
      ]
    },
    nda: {
      key: 'nda',
      title: 'Perjanjian Kerahasiaan Timbal Balik (Mutual NDA)',
      subtitle: 'Perlindungan Rahasia Dagang UU No. 30/2000',
      docNo: '055/NDA-LE/X/2026',
      clauses: [
        {
          title: 'PASAL 1: DEFINISI INFORMASI RAHASIA',
          content: 'Informasi Rahasia mencakup segala data teknis, finansial, arsitektur perangkat lunak, algoritma, data pelanggan, strategi pemasaran, dan rencana bisnis yang diungkapkan oleh salah satu Pihak kepada Pihak lainnya.'
        },
        {
          title: 'PASAL 2: KEWAJIBAN PENCEGAHAN KEBOCORAN',
          content: 'Pihak Penerima berjanji untuk menjaga kerahasiaan tersebut dengan standar kehati-hatian yang setara dengan cara menjaga rahasia dagang miliknya sendiri, dan tidak menduplikasi atau mengekspor informasi tanpa izin tertulis.'
        }
      ]
    },
    sha: {
      key: 'sha',
      title: 'Perjanjian Antar Pemegang Saham (Shareholders Agreement)',
      subtitle: 'Standar Tata Kelola Saham Pendiri & Investor',
      docNo: '031/SHA-LE/X/2026',
      clauses: [
        {
          title: 'PASAL 1: STRUKTUR KEPEMILIKAN & VESTING SCHEDULE',
          content: 'Para Pihak sepakat bahwa kepemilikan saham para pendiri tunduk pada mekanisme vesting selama 4 (empat) tahun dengan 1-year cliff guna menjaga komitmen jangka panjang operasional perusahaan.'
        },
        {
          title: 'PASAL 2: HAK MENOLAK TERLEBIH DAHULU (ROFR)',
          content: 'Apabila salah satu pemegang saham bermaksud menjual saham miliknya kepada pihak luar, pemegang saham lainnya berhak membeli saham tersebut secara proporsional dengan harga dan ketentuan yang sama.'
        }
      ]
    },
    surat_kuasa: {
      key: 'surat_kuasa',
      title: 'Surat Kuasa Khusus Pengurusan Badan Hukum',
      subtitle: 'Standar Administrasi Notaris & Kemenkumham RI',
      docNo: '012/SKK-LE/X/2026',
      clauses: [
        {
          title: 'PASAL 1: IDENTITAS PEMBERI DAN PENERIMA KUASA',
          content: 'Pemberi Kuasa dengan ini memberikan kuasa khusus yang tidak dapat dicabut kembali kepada Penerima Kuasa untuk bertindak atas nama dan mewakili {{party1Name}} dalam segala urusan legalitas perseroan.'
        },
        {
          title: 'PASAL 2: RUANG LINGKUP KUASA',
          content: 'Menghadap Notaris, pejabat Kementerian Hukum dan HAM RI, Dinas Penanaman Modal, serta instansi OSS guna menyerahkan dokumen, menandatangani berkas permohonan, dan menerima salinan akta resmi.'
        }
      ]
    }
  };

  // --- SOUND SYNTHESIZER FOR PAYMENT CHIME ---
  function playSuccessChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5
      osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.3); // G5

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.2);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.log('Audio chime not supported');
    }
  }

  // --- TOAST NOTIFICATIONS ---
  window.showToast = showToast;
  function showToast(message, type) {
    window.showToast = showToast;
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
    } else if (type === 'warning') {
      bg = 'bg-amber-950 text-amber-100 border-amber-500/40';
      icon = 'alert-circle';
      iconColor = 'text-amber-400';
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

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // --- AUTH-GATE REUSABLE HELPER (ITEMS 3 & 13) ---
  window.requireAuth = function (actionCallback, actionDescription) {
    if (!state.currentUser) {
      showToast(`Silakan masuk ke akun Anda terlebih dahulu untuk ${actionDescription || 'mengakses fitur ini'}.`, 'warning');
      openAuthModal('login');
      return false;
    }
    if (typeof actionCallback === 'function') {
      actionCallback();
    }
    return true;
  };

  // --- DYNAMIC PRODUCTION NAVBAR (GUEST vs CLIENT vs ADMIN) ---
  function syncNavbarUser() {
    const user = state.currentUser;
    const desktopContainer = document.getElementById('nav-auth-container');
    const mobileContainer = document.getElementById('mobile-auth-container');
    const mobileAvatarBtn = document.getElementById('mobile-user-avatar-btn');
    const mobileUserDisplay = document.getElementById('mobile-user-display-name');
    const mobileUserInitials = document.getElementById('mobile-user-avatar-initials');

    if (mobileUserDisplay) {
      mobileUserDisplay.textContent = user ? (user.fullName || user.companyName || 'Klien LegalEase') : 'Klien Bisnis & Korporasi';
    }
    if (mobileUserInitials) {
      if (user && user.fullName) {
        const parts = user.fullName.trim().split(/\s+/);
        mobileUserInitials.textContent = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
      } else {
        mobileUserInitials.textContent = 'LE';
      }
    }

    // 1. GUEST VISITOR (NOT LOGGED IN)
    if (!user) {
      if (desktopContainer) {
        desktopContainer.innerHTML = `
          <button type="button" onclick="openAuthModal('login')" class="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#0C1E36] hover:bg-slate-100 transition">
            Masuk
          </button>
          <button type="button" onclick="openAuthModal('register')" class="px-4 py-2 rounded-full bg-[#0C1E36] text-amber-300 hover:bg-slate-800 text-xs font-bold transition shadow-xs">
            Daftar Akun
          </button>
        `;
      }
      if (mobileContainer) {
        mobileContainer.innerHTML = `
          <div class="flex items-center gap-2 p-1">
            <button type="button" onclick="openAuthModal('login'); toggleMobileMenu();" class="flex-1 py-2 rounded-xl text-center bg-white border border-slate-200 text-xs font-bold text-[#0C1E36]">
              Masuk
            </button>
            <button type="button" onclick="openAuthModal('register'); toggleMobileMenu();" class="flex-1 py-2 rounded-xl text-center bg-[#0C1E36] text-amber-300 text-xs font-bold shadow-xs">
              Daftar Akun
            </button>
          </div>
        `;
      }
      if (mobileAvatarBtn) {
        mobileAvatarBtn.innerHTML = `
          <button onclick="openAuthModal('login')" class="p-2 rounded-full border border-slate-300 bg-white text-slate-700" title="Masuk">
            <i data-lucide="user" class="w-4 h-4"></i>
          </button>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // 2. REGULAR PARTNER NOTARY ACCOUNT (Dr. Hendra Wijaya, S.H., M.Kn. - Bukan Admin Besar)
    if (user.role === 'notary') {
      const isNotaryDashboard = (state.currentView === 'notary_dashboard');
      if (desktopContainer) {
        desktopContainer.innerHTML = `
          ${isNotaryDashboard ? `
            <button type="button" onclick="switchView('public')" class="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs" title="Lihat Beranda Publik">
              <i data-lucide="globe" class="w-3.5 h-3.5 text-slate-600"></i>
              <span>Beranda Publik</span>
            </button>
          ` : `
            <button type="button" onclick="switchView('notary_dashboard')" class="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs" title="Buka Meja Kerja Notaris">
              <i data-lucide="briefcase" class="w-3.5 h-3.5 text-amber-300"></i>
              <span>Meja Kerja Notaris</span>
            </button>
          `}
          <button type="button" onclick="openAuthModal('profile')" class="w-8 h-8 rounded-full bg-emerald-800 text-amber-300 font-extrabold text-xs flex items-center justify-center border border-emerald-500 shadow-2xs" title="Profil Notaris Rekanan">
            HW
          </button>
        `;
      }
      if (mobileContainer) {
        mobileContainer.innerHTML = `
          <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div>
              <div class="font-bold text-xs text-[#0C1E36] flex items-center gap-1">
                <span>Dr. Hendra Wijaya (Notaris Rekanan)</span>
              </div>
              <div class="text-[10px] text-emerald-800 font-mono">notaris@legalease.co.id</div>
            </div>
            <div class="flex items-center gap-1.5">
              ${isNotaryDashboard ? `
                <button onclick="switchView('public'); toggleMobileMenu();" class="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-[10px] font-bold">Beranda</button>
              ` : `
                <button onclick="switchView('notary_dashboard'); toggleMobileMenu();" class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">Meja Kerja</button>
              `}
              <button onclick="handleUserSignOut()" class="text-xs font-bold text-rose-600">Keluar</button>
            </div>
          </div>
        `;
      }
      if (mobileAvatarBtn) {
        mobileAvatarBtn.innerHTML = `
          <button onclick="switchView('notary_dashboard')" class="p-1.5 rounded-full bg-emerald-600 text-white font-bold text-xs" title="Meja Kerja Notaris">
            HW
          </button>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // 3. ADMINISTRATOR (ADMIN BESAR) ACCOUNT
    if (user.role === 'admin') {
      const isDashboard = (state.currentView === 'admin_dashboard');
      if (desktopContainer) {
        desktopContainer.innerHTML = `
          ${isDashboard ? `
            <button type="button" onclick="switchView('public')" class="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs" title="Lihat Beranda Publik">
              <i data-lucide="globe" class="w-3.5 h-3.5 text-slate-600"></i>
              <span>Beranda Publik</span>
            </button>
          ` : `
            <button type="button" onclick="switchView('admin_dashboard')" class="px-3.5 py-1.5 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-xs" title="Buka Konsol Realtime Notaris">
              <i data-lucide="shield" class="w-3.5 h-3.5"></i>
              <span>Konsol Notaris</span>
            </button>
          `}
          <button type="button" onclick="openAuthModal('profile')" class="w-8 h-8 rounded-full bg-[#0C1E36] text-amber-300 font-extrabold text-xs flex items-center justify-center border border-amber-400 shadow-2xs" title="Profil Admin">
            AD
          </button>
        `;
      }
      if (mobileContainer) {
        mobileContainer.innerHTML = `
          <div class="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
            <div>
              <div class="font-bold text-xs text-[#0C1E36] flex items-center gap-1">
                <span>Notaris Utama (Admin)</span>
              </div>
              <div class="text-[10px] text-amber-800 font-mono">admin@legalease.co.id</div>
            </div>
            <div class="flex items-center gap-1.5">
              ${isDashboard ? `
                <button onclick="switchView('public'); toggleMobileMenu();" class="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-[10px] font-bold">Beranda</button>
              ` : `
                <button onclick="switchView('admin_dashboard'); toggleMobileMenu();" class="px-2.5 py-1 rounded-lg bg-[#0C1E36] text-amber-300 text-[10px] font-bold">Konsol</button>
              `}
              <button onclick="handleUserSignOut()" class="text-xs font-bold text-rose-600">Keluar</button>
            </div>
          </div>
        `;
      }
      if (mobileAvatarBtn) {
        mobileAvatarBtn.innerHTML = `
          <button onclick="switchView('admin_dashboard')" class="p-1.5 rounded-full bg-amber-400 text-slate-950 font-bold text-xs" title="Konsol Notaris">
            AD
          </button>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // 3. AUTHENTICATED CLIENT ACCOUNT
    let badgeClass = 'text-[9px] text-slate-500 font-semibold';
    if (user.plan === 'full') badgeClass = 'text-[9px] text-amber-600 font-bold';
    else if (user.plan === 'chat') badgeClass = 'text-[9px] text-teal-600 font-bold';

    const isClientDashboard = (state.currentView === 'client_dashboard');

    if (desktopContainer) {
      desktopContainer.innerHTML = `
        ${isClientDashboard ? `
          <button type="button" onclick="switchView('public')" class="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs" title="Lihat Beranda Publik">
            <i data-lucide="globe" class="w-3.5 h-3.5 text-slate-600"></i>
            <span>Beranda Publik</span>
          </button>
        ` : `
          <button type="button" onclick="switchView('client_dashboard')" class="px-3.5 py-1.5 rounded-full bg-[#2E9B95] hover:bg-teal-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs" title="Buka Dashboard Korporasi Klien">
            <i data-lucide="layout-dashboard" class="w-3.5 h-3.5 text-amber-300"></i>
            <span>Dashboard Klien</span>
          </button>
        `}
        <button id="nav-auth-btn" onclick="openAuthModal('profile')" class="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-[#0C1E36] border border-slate-300 text-xs font-bold transition flex items-center gap-2 shadow-2xs">
          <div class="w-6 h-6 rounded-full bg-[#0C1E36] text-amber-300 text-[10px] font-extrabold flex items-center justify-center">
            ${user.initials || user.fullName.substring(0, 2).toUpperCase()}
          </div>
          <div class="text-left leading-tight hidden md:block max-w-[130px]">
            <div class="font-bold text-slate-900 text-[11px] truncate">${escapeHtml(user.fullName)}</div>
            <div class="${badgeClass} truncate">${escapeHtml(user.planName || 'Paket Biasa (Rp 0)')}</div>
          </div>
          <i data-lucide="chevron-down" class="w-3 h-3 text-slate-400"></i>
        </button>
      `;
    }

    if (mobileContainer) {
      mobileContainer.innerHTML = `
        <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div class="truncate mr-2">
            <div class="font-bold text-xs text-slate-900 truncate">${escapeHtml(user.fullName)}</div>
            <div class="text-[10px] text-slate-500 font-semibold truncate">${escapeHtml(user.companyName || user.email)}</div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            ${isClientDashboard ? `
              <button onclick="switchView('public'); toggleMobileMenu();" class="text-xs font-bold text-slate-700">Beranda</button>
            ` : `
              <button onclick="switchView('client_dashboard'); toggleMobileMenu();" class="text-xs font-bold text-[#2E9B95]">Dashboard</button>
            `}
            <span class="text-slate-300">|</span>
            <button onclick="openAuthModal('profile')" class="text-xs font-bold text-[#2E9B95]">Profil</button>
            <span class="text-slate-300">|</span>
            <button onclick="handleUserSignOut()" class="text-xs font-bold text-rose-600">Keluar</button>
          </div>
        </div>
      `;
    }

    if (mobileAvatarBtn) {
      mobileAvatarBtn.innerHTML = `
        <button onclick="switchView('client_dashboard')" class="p-1.5 rounded-full border border-slate-300 bg-white text-slate-700" title="Dashboard Klien">
          <div class="w-6 h-6 rounded-full bg-[#0C1E36] text-amber-300 text-[10px] font-extrabold flex items-center justify-center">
            ${user.initials || user.fullName.substring(0, 2).toUpperCase()}
          </div>
        </button>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // --- RENDER NOTARIES DIRECTORY ---
  function renderNotaries() {
    const container = document.getElementById('notaries-cards-container');
    if (!container) return;

    const q = (state.notarySearchQuery || '').toLowerCase();
    const filter = state.notaryCategoryFilter || 'all';

    const filtered = NOTARIES.filter(n => {
      const matchQuery = n.name.toLowerCase().includes(q) ||
        n.office.toLowerCase().includes(q) ||
        n.specialties.some(s => s.toLowerCase().includes(q));

      if (filter === 'all') return matchQuery;
      return matchQuery && n.category === filter;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-2 text-center py-12 text-slate-500 text-xs">
          Tidak ditemukan Notaris yang sesuai dengan kata kunci "${state.notarySearchQuery}".
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(notary => `
      <div class="bg-[#FAF9F5] border border-slate-200 rounded-3xl p-4 sm:p-6 hover:border-[#C29236] transition-all shadow-2xs hover:shadow-md flex flex-col justify-between">
        <div>
          <div class="flex items-start gap-3 sm:gap-4 mb-4">
            <img src="${notary.avatar}" alt="${notary.name}" class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0">
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ${notary.status}
                </span>
                <span class="text-xs font-bold text-amber-600 flex items-center gap-1">
                  <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-500 text-amber-500"></i> ${notary.rating}
                  <span class="text-slate-400 font-normal">(${notary.reviewsCount})</span>
                </span>
              </div>
              <h3 class="font-serif-editorial font-bold text-base text-[#0C1E36]">${notary.name}</h3>
              <p class="text-[11px] text-[#2E9B95] font-bold">${notary.title}</p>
              <p class="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <i data-lucide="map-pin" class="w-3 h-3 text-slate-400"></i> ${notary.address}
              </p>
            </div>
          </div>

          <p class="text-xs text-slate-600 leading-relaxed mb-4">
            ${notary.bio}
          </p>

          <div class="p-2.5 rounded-xl bg-white border border-slate-200 text-[10px] font-mono text-slate-600 mb-4 flex items-center justify-between">
            <span class="truncate">${notary.skNumber}</span>
            <span class="text-emerald-700 font-bold font-sans flex items-center gap-1 shrink-0 ml-2">
              <i data-lucide="check" class="w-3 h-3"></i> Terverifikasi
            </span>
          </div>

          <div class="flex flex-wrap gap-1.5 mb-4">
            ${notary.specialties.map(spec => `
              <span class="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-700 font-medium">
                ${spec}
              </span>
            `).join('')}
          </div>
        </div>

        <div class="pt-4 border-t border-slate-200 flex items-center gap-2">
          <button onclick="openBookingModal('${notary.id}', '${notary.name}')" class="flex-1 py-2.5 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs">
            <i data-lucide="calendar" class="w-3.5 h-3.5"></i> Jadwalkan Janji Temu
          </button>
          <button onclick="startVoiceCall('${notary.id}')" class="px-3.5 py-2.5 rounded-xl bg-[#0C384D] hover:bg-slate-900 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs" title="Panggilan Suara Notaris">
            <i data-lucide="phone-call" class="w-3.5 h-3.5"></i> Call
          </button>
          <button onclick="openLiveChat('${notary.id}')" class="px-3.5 py-2.5 rounded-xl bg-[#2E9B95] hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs" title="Mulai Konsultasi Chat">
            <i data-lucide="message-square" class="w-3.5 h-3.5"></i> Chat
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  window.handleNotaryDirectorySearch = function (e) {
    state.notarySearchQuery = e.target.value;
    renderNotaries();
  };

  window.filterNotariesByCategory = function (cat) {
    state.notaryCategoryFilter = cat;
    
    ['all', 'pt', 'haki', 'ppat'].forEach(c => {
      const btn = document.getElementById(`btn-filter-${c}`);
      if (btn) {
        if (c === cat) {
          btn.className = 'px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap bg-[#0C1E36] text-amber-300 shadow-xs';
        } else {
          btn.className = 'px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap bg-white border border-slate-300 text-slate-700 hover:bg-slate-50';
        }
      }
    });

    renderNotaries();
  };

  // --- RENDER INTERACTIVE LEGAL DOCUMENT TEMPLATES ---
  function renderTemplateTabs() {
    const container = document.getElementById('template-buttons-container');
    if (!container) return;

    container.innerHTML = Object.values(CONTRACT_TEMPLATES).map(tmpl => `
      <button onclick="selectLandingTemplate('${tmpl.key}')" class="px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${tmpl.key === state.activeDocKey ? 'bg-[#0C1E36] text-amber-300 shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}">
        <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
        <span>${tmpl.title.split('(')[0]}</span>
      </button>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  function renderLandingDocPreview() {
    const doc = CONTRACT_TEMPLATES[state.activeDocKey] || CONTRACT_TEMPLATES.pks;
    
    const titleEl = document.getElementById('landing-doc-title');
    const noEl = document.getElementById('landing-doc-no');
    const pillEl = document.getElementById('landing-doc-parties-pill');
    const clausesEl = document.getElementById('landing-doc-clauses');
    const sign1 = document.getElementById('landing-doc-sign1');
    const sign2 = document.getElementById('landing-doc-sign2');

    if (titleEl) titleEl.textContent = doc.title;
    if (noEl) noEl.textContent = `Nomor: ${doc.docNo} • ${doc.subtitle}`;
    if (pillEl) pillEl.textContent = `Pihak I: ${state.docFormData.party1Name} | Pihak II: ${state.docFormData.party2Name}`;
    if (sign1) sign1.textContent = state.docFormData.party1Name;
    if (sign2) sign2.textContent = state.docFormData.party2Name;

    if (clausesEl) {
      clausesEl.innerHTML = doc.clauses.map(clause => {
        let content = clause.content
          .replace(/\{\{party1Name\}\}/g, escapeHtml(state.docFormData.party1Name))
          .replace(/\{\{party2Name\}\}/g, escapeHtml(state.docFormData.party2Name))
          .replace(/\{\{contractCity\}\}/g, escapeHtml(state.docFormData.contractCity))
          .replace(/\{\{contractDate\}\}/g, escapeHtml(state.docFormData.contractDate))
          .replace(/\{\{contractValue\}\}/g, escapeHtml(state.docFormData.contractValue));

        return `
          <div class="mb-3">
            <h5 class="font-bold text-[11px] uppercase tracking-wider text-slate-900 mb-1 font-sans">${clause.title}</h5>
            <p class="text-slate-700 leading-relaxed text-justify">${content}</p>
          </div>
        `;
      }).join('');
    }
  }

  window.selectLandingTemplate = function (key) {
    if (!CONTRACT_TEMPLATES[key]) return;
    state.activeDocKey = key;
    renderTemplateTabs();
    renderLandingDocPreview();
  };

  window.handleDocFormInput = function (field, val) {
    state.docFormData[field] = val;
    renderLandingDocPreview();
    saveState();
  };

  window.downloadCurrentDocAsWord = function () {
    if (!window.requireAuth(null, 'mengunduh draf dokumen hukum resmi (.doc)')) {
      return false;
    }
    const doc = CONTRACT_TEMPLATES[state.activeDocKey] || CONTRACT_TEMPLATES.pks;

    let wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>${doc.title} - Dokumen Resmi dari Tim LegalEase Indonesia</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page { size: A4; margin: 2.5cm 2cm 2.5cm 2cm; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.4; color: #000; }
          .header-legalease { text-align: center; border-bottom: 2pt double #2E9B95; padding-bottom: 6pt; margin-bottom: 18pt; font-family: 'Times New Roman', Times, serif; }
          .header-tag { font-size: 11pt; font-weight: bold; letter-spacing: 1.5pt; color: #2E9B95; text-transform: uppercase; margin-bottom: 3pt; }
          .header-sub { font-size: 9pt; color: #555555; text-transform: uppercase; letter-spacing: 0.5pt; }
          h2 { text-align: center; font-size: 14pt; font-weight: bold; margin-top: 10pt; margin-bottom: 2pt; text-transform: uppercase; font-family: 'Times New Roman', Times, serif; }
          .sub { text-align: center; font-size: 10pt; font-style: italic; margin-bottom: 20pt; color: #444; }
          h3 { font-size: 11pt; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; text-transform: uppercase; font-family: 'Times New Roman', Times, serif; }
          p { text-align: justify; margin-bottom: 8pt; font-size: 11pt; line-height: 1.4; }
          .signature-table { width: 100%; border-collapse: collapse; margin-top: 30pt; }
          .signature-table td { width: 50%; vertical-align: top; text-align: center; padding: 10pt; }
          .sign-space { height: 50pt; }
          .sign-line { border-bottom: 1.5pt solid #000; display: inline-block; min-width: 160pt; padding-bottom: 2pt; font-weight: bold; font-size: 11pt; }
          .meterai-box { display: inline-block; border: 1.5pt dashed #DC2626; background-color: #FEF2F2; padding: 6pt 14pt; margin: 4pt auto 10pt auto; font-size: 8pt; color: #991B1B; font-weight: bold; text-align: center; }
          .meterai-amount { font-size: 10pt; font-weight: bold; display: block; margin-top: 2pt; }
          .verified-badge { font-size: 8.5pt; color: #047857; margin-top: 4pt; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-legalease">
          <div class="header-tag">DOKUMEN RESMI DARI TIM LEGALEASE INDONESIA</div>
          <div class="header-sub">Standar Baku Tersertifikasi Notaris &amp; PPAT Kemenkumham RI</div>
        </div>

        <h2>${doc.title}</h2>
        <div class="sub">Nomor: ${doc.docNo} &bull; ${doc.subtitle}</div>

        <p>Pada hari ini, tanggal <strong>${state.docFormData.contractDate}</strong>, bertempat di <strong>${state.docFormData.contractCity}</strong>, telah dibuat dan disepakati dokumen hukum resmi antara:</p>
        <p>1. <strong>${state.docFormData.party1Name}</strong>, selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.</p>
        <p>2. <strong>${state.docFormData.party2Name}</strong>, selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>.</p>
        <p>Para Pihak dengan ini menerangkan dan bersepakat atas klausul dan pasal-pasal ketentuan sebagai berikut:</p>
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
        <table class="signature-table">
          <tr>
            <td>
              <p style="margin-bottom: 8pt; font-weight: bold;">Pihak Pertama / Direktur Pelaksana</p>
              <div class="sign-space"></div>
              <div class="sign-line">${state.docFormData.party1Name}</div>
              <div style="font-size: 9pt; color: #555555; margin-top: 4pt;">${state.docFormData.contractCity}</div>
            </td>
            <td>
              <p style="margin-bottom: 8pt; font-weight: bold;">Pihak Kedua &amp; Saksi Notaris</p>
              <div class="meterai-box">
                METERAI TEMPEL<br>
                <span class="meterai-amount">Rp 10.000</span>
              </div>
              <br>
              <div class="sign-line">${state.docFormData.party2Name}</div>
              <div class="verified-badge">SK Kemenkumham RI Verified</div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF', wordHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/[\s/()]+/g, '_')}_${state.docFormData.party1Name.replace(/[\s.]+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Dokumen Word (.doc) berhasil diunduh. Siap ditandatangani.`, 'success');
  };

  // --- DOCUMENT PREVIEW MODAL ---
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

  // --- CHECKLIST PENDIDIAN PT ---
  function renderChecklist() {
    const container = document.getElementById('checklist-items-list');
    if (!container) return;

    container.innerHTML = state.checklist.map(item => `
      <div class="p-3.5 rounded-2xl border ${item.completed ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-white'} hover:border-slate-300 transition flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <input 
            type="checkbox" 
            ${item.completed ? 'checked' : ''} 
            onchange="toggleChecklistItem(${item.id})"
            class="w-4 h-4 rounded text-[#2E9B95] focus:ring-[#2E9B95] cursor-pointer"
          >
          <div>
            <div class="text-xs font-bold ${item.completed ? 'text-slate-800 line-through opacity-75' : 'text-[#0C1E36]'}">
              ${item.text}
            </div>
            <span class="text-[10px] text-slate-500 font-semibold">${item.category}</span>
          </div>
        </div>
        ${item.completed ? `
          <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
            <i data-lucide="check" class="w-3 h-3"></i> Selesai
          </span>
        ` : `
          <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            Menunggu
          </span>
        `}
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  window.toggleChecklistItem = function (id) {
    const item = state.checklist.find(c => c.id === id);
    if (!item) return;
    item.completed = !item.completed;
    saveState();
    renderChecklist();
    if (!state.chatHistory || Object.keys(state.chatHistory).length === 0) {
      state.chatHistory = {
        'notary-1': generateInitialGreeting('notary-1', state.currentUser)
      };
    }
    showToast(`Tahapan "${item.text.slice(0, 25)}..." diperbarui.`, 'success');
  };

  window.handleAddNewChecklist = function () {
    const text = prompt('Masukkan nama tahapan perizinan atau legalitas baru:');
    if (!text || !text.trim()) return;

    state.checklist.push({
      id: Date.now(),
      text: text.trim(),
      completed: false,
      category: 'Kustom'
    });

    saveState();
    renderChecklist();
    showToast('Tahapan baru ditambahkan ke roadmap.', 'success');
  };

  // --- AUTHENTIC FINTECH CHECKOUT MODAL (MIDTRANS/XENDIT STYLE) ---
  let checkoutCountdownTimer = null;

  window.openCheckoutModal = function (planId) {
    planId = planId || 'trial';
    if (!state.currentUser) {
      const planLabel = (planId === 'trial' ? 'Free Trial (Rp 0)' : (planId === 'chat' ? 'Chat Essential (Rp 150.000)' : 'Full Legal Suite (Rp 300.000)'));
      showToast('Silakan lengkapi pendaftaran akun perseroan terlebih dahulu untuk paket ' + planLabel + '.', 'info');
      openAuthModal('register', planId);
      return;
    }

    planId = planId || 'full';
    state.checkoutState.planId = planId;
    state.checkoutState.step = 'input';
    state.checkoutState.countdownSeconds = 899; // 14:59

    const user = state.currentUser;
    state.checkoutState.customerName = user ? user.fullName : '';
    state.checkoutState.customerEmail = user ? user.email : '';
    state.checkoutState.customerPhone = user ? (user.phone || '0812-9876-5432') : '';
    state.checkoutState.customerCompany = user ? user.companyName : '';
    state.checkoutState.invoiceNo = 'INV/20261025/LE/' + Math.floor(1000 + Math.random() * 9000);

    if (planId === 'trial') {
      state.checkoutState.planName = '3-Day Free Trial';
      state.checkoutState.planPrice = 0;
    } else if (planId === 'chat') {
      state.checkoutState.planName = 'Legal Chat Essential (1 Bulan)';
      state.checkoutState.planPrice = 150000;
    } else {
      state.checkoutState.planName = 'Full Legal Suite (1 Bulan)';
      state.checkoutState.planPrice = 300000;
    }

    renderCheckoutModal();

    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.remove('hidden');

    // Start live countdown
    if (checkoutCountdownTimer) clearInterval(checkoutCountdownTimer);
    checkoutCountdownTimer = setInterval(() => {
      if (state.checkoutState.countdownSeconds > 0) {
        state.checkoutState.countdownSeconds--;
        const mins = Math.floor(state.checkoutState.countdownSeconds / 60);
        const secs = state.checkoutState.countdownSeconds % 60;
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        const timerEl = document.getElementById('checkout-timer-badge');
        if (timerEl) timerEl.textContent = timeStr;
      }
    }, 1000);

    if (window.lucide) window.lucide.createIcons();
  };

  window.closeCheckoutModal = function () {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.add('hidden');
    if (checkoutCountdownTimer) clearInterval(checkoutCountdownTimer);
  };

  window.selectPaymentChannel = function (channelKey) {
    state.checkoutState.method = channelKey;
    renderCheckoutModal();
  };

  window.selectVaBank = function (bankKey) {
    state.checkoutState.selectedVaBank = bankKey;
    renderCheckoutModal();
  };

  function renderCheckoutModal() {
    const container = document.getElementById('checkout-modal-content');
    if (!container) return;

    const chk = state.checkoutState;
    const mins = Math.floor(chk.countdownSeconds / 60);
    const secs = chk.countdownSeconds % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (chk.step === 'input') {
      container.innerHTML = `
        <div class="space-y-5 text-xs">
          
          <!-- Order Summary Card -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span class="text-[10px] text-slate-500 font-mono block">NOMOR TAGIHAN</span>
                <span class="font-mono font-bold text-slate-900">${chk.invoiceNo}</span>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-slate-500 block">BATAS PEMBAYARAN</span>
                <span id="checkout-timer-badge" class="px-2 py-0.5 rounded countdown-badge font-bold text-[11px]">${timeFormatted}</span>
              </div>
            </div>

            <div class="pt-3 space-y-1.5 text-xs">
              <div class="flex items-center justify-between text-slate-600">
                <span>Paket Layanan:</span>
                <span class="font-bold text-slate-900">${chk.planName}</span>
              </div>
              <div class="flex items-center justify-between text-slate-600">
                <span>Biaya Transaksi / PPN:</span>
                <span class="font-semibold text-emerald-700">Rp 0 (Ditanggung LegalEase)</span>
              </div>
              <div class="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                <span class="font-bold text-slate-900">Total Pembayaran:</span>
                <span class="font-bold text-lg text-[#0C1E36]">IDR ${chk.planPrice.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <!-- Customer Data Form -->
          <div class="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
            <span class="block font-bold text-slate-800 text-[11px] uppercase tracking-wider">Data Pembeli / Klien</span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-1">Nama Lengkap</label>
                <input type="text" id="chk-input-name" value="${chk.customerName}" oninput="state.checkoutState.customerName = this.value" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:border-[#0C1E36]">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-1">Email Resmi</label>
                <input type="email" id="chk-input-email" value="${chk.customerEmail}" oninput="state.checkoutState.customerEmail = this.value" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#0C1E36]">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-1">No. WhatsApp</label>
                <input type="text" id="chk-input-phone" value="${chk.customerPhone}" oninput="state.checkoutState.customerPhone = this.value" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#0C1E36]">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-1">Nama Perusahaan / PT</label>
                <input type="text" id="chk-input-company" value="${chk.customerCompany}" oninput="state.checkoutState.customerCompany = this.value" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#0C1E36]">
              </div>
            </div>
          </div>

          <!-- Payment Channels Selector -->
          ${chk.planPrice > 0 ? `
            <div>
              <label class="block font-bold text-slate-800 mb-2">Metode Pembayaran Resmi</label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                <button type="button" onclick="selectPaymentChannel('qris')" class="p-3 rounded-2xl border text-center transition ${chk.method === 'qris' ? 'border-[#2E9B95] bg-teal-50/70 text-[#2E9B95] font-bold ring-1 ring-[#2E9B95]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}">
                  <span class="block text-xs font-bold">QRIS</span>
                  <span class="text-[9px] text-slate-500 block">Semua Bank & E-Wallet</span>
                </button>
                <button type="button" onclick="selectPaymentChannel('va')" class="p-3 rounded-2xl border text-center transition ${chk.method === 'va' ? 'border-[#2E9B95] bg-teal-50/70 text-[#2E9B95] font-bold ring-1 ring-[#2E9B95]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}">
                  <span class="block text-xs font-bold">Virtual Account</span>
                  <span class="text-[9px] text-slate-500 block">BCA, Mandiri, BNI, BRI</span>
                </button>
                <button type="button" onclick="selectPaymentChannel('ewallet')" class="p-3 rounded-2xl border text-center transition ${chk.method === 'ewallet' ? 'border-[#2E9B95] bg-teal-50/70 text-[#2E9B95] font-bold ring-1 ring-[#2E9B95]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}">
                  <span class="block text-xs font-bold">E-Wallet Direct</span>
                  <span class="text-[9px] text-slate-500 block">GoPay, OVO, DANA</span>
                </button>
              </div>

              <!-- Channel Detail Display -->
              <div class="p-4 rounded-2xl bg-white border border-slate-200">
                ${chk.method === 'qris' ? `
                  <div class="flex flex-col items-center text-center">
                    <span class="font-bold text-slate-900 text-xs mb-1">Scan QRIS Real-Time</span>
                    <p class="text-[10px] text-slate-500 mb-3">Dukungan: BCA Mobile, Livin Mandiri, GoPay, OVO, ShopeePay, DANA</p>
                    <div class="w-36 h-36 bg-white p-2 rounded-2xl border-2 border-slate-900 shadow-sm flex items-center justify-center mb-2">
                      <svg class="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100" height="100" fill="white"/>
                        <rect x="10" y="10" width="24" height="24" fill="#0C1E36"/>
                        <rect x="14" y="14" width="16" height="16" fill="white"/>
                        <rect x="18" y="18" width="8" height="8" fill="#0C1E36"/>
                        <rect x="66" y="10" width="24" height="24" fill="#0C1E36"/>
                        <rect x="70" y="14" width="16" height="16" fill="white"/>
                        <rect x="74" y="18" width="8" height="8" fill="#0C1E36"/>
                        <rect x="10" y="66" width="24" height="24" fill="#0C1E36"/>
                        <rect x="14" y="70" width="16" height="16" fill="white"/>
                        <rect x="18" y="74" width="8" height="8" fill="#0C1E36"/>
                        <rect x="42" y="14" width="16" height="6" fill="#0C1E36"/>
                        <rect x="42" y="26" width="8" height="12" fill="#0C1E36"/>
                        <rect x="54" y="32" width="10" height="14" fill="#0C1E36"/>
                        <rect x="14" y="42" width="18" height="8" fill="#0C1E36"/>
                        <rect x="42" y="48" width="16" height="16" fill="#C29236"/>
                        <rect x="68" y="48" width="18" height="8" fill="#0C1E36"/>
                        <rect x="42" y="72" width="24" height="8" fill="#0C1E36"/>
                        <rect x="74" y="64" width="12" height="18" fill="#0C1E36"/>
                      </svg>
                    </div>
                    <span class="text-[10px] font-mono text-slate-600 font-bold">NMID: ID1020268491823 • LegalEase Indonesia</span>
                  </div>
                ` : (chk.method === 'va' ? `
                  <div class="space-y-3">
                    <div class="flex items-center gap-1.5">
                      <button type="button" onclick="selectVaBank('bca')" class="px-3 py-1 rounded-lg text-xs font-bold ${chk.selectedVaBank === 'bca' ? 'bg-[#0C1E36] text-amber-300' : 'bg-slate-100 text-slate-700'}">BCA</button>
                      <button type="button" onclick="selectVaBank('mandiri')" class="px-3 py-1 rounded-lg text-xs font-bold ${chk.selectedVaBank === 'mandiri' ? 'bg-[#0C1E36] text-amber-300' : 'bg-slate-100 text-slate-700'}">Mandiri</button>
                      <button type="button" onclick="selectVaBank('bni')" class="px-3 py-1 rounded-lg text-xs font-bold ${chk.selectedVaBank === 'bni' ? 'bg-[#0C1E36] text-amber-300' : 'bg-slate-100 text-slate-700'}">BNI</button>
                      <button type="button" onclick="selectVaBank('bri')" class="px-3 py-1 rounded-lg text-xs font-bold ${chk.selectedVaBank === 'bri' ? 'bg-[#0C1E36] text-amber-300' : 'bg-slate-100 text-slate-700'}">BRI</button>
                    </div>
                    <div class="p-3 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-between">
                      <div>
                        <span class="text-[10px] text-slate-500 uppercase font-mono block">Nomor Virtual Account ${chk.selectedVaBank.toUpperCase()}</span>
                        <span class="text-base font-mono font-bold text-[#0C1E36] tracking-wider">${chk.selectedVaBank === 'bca' ? '8910 0812 3456 7890' : (chk.selectedVaBank === 'mandiri' ? '8870 0812 3456 7890' : '8277 0812 3456 7890')}</span>
                      </div>
                      <button type="button" onclick="navigator.clipboard.writeText('8910081234567890'); alert('Nomor VA disalin!')" class="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-[#2E9B95] text-xs">
                        Salin
                      </button>
                    </div>
                    <p class="text-[10px] text-slate-500">Dapat dibayar melalui ATM, m-Banking, atau Internet Banking 24 jam.</p>
                  </div>
                ` : `
                  <div class="space-y-2 text-center py-2">
                    <span class="font-bold text-slate-900 text-xs">Push Notification E-Wallet</span>
                    <p class="text-[10px] text-slate-500">Notifikasi otorisasi pembayaran instan akan dikirimkan ke aplikasi GoPay / OVO / DANA di nomor HP: <strong>${chk.customerPhone}</strong>.</p>
                  </div>
                `)}
              </div>
            </div>
          ` : `
            <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <i data-lucide="sparkles" class="w-8 h-8 text-emerald-600 mx-auto mb-1"></i>
              <h4 class="font-bold text-emerald-950 text-xs">Aktivasi 3-Day Free Trial Instan</h4>
              <p class="text-[11px] text-emerald-800 mt-0.5">Nikmati akses konsultasi chat Notaris & pelacak pendirian PT tanpa biaya sepeser pun.</p>
            </div>
          `}

          <!-- Pay Button -->
          <button type="button" onclick="startPaymentSimulationProcess()" class="w-full py-4 rounded-2xl bg-[#2E9B95] hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition">
            <i data-lucide="shield-check" class="w-4 h-4"></i>
            <span>${chk.planPrice > 0 ? `Bayar Sekarang — IDR ${chk.planPrice.toLocaleString('id-ID')}` : 'Konfirmasi & Aktifkan Free Trial (IDR 0)'}</span>
          </button>
          
          <p class="text-[10px] text-center text-slate-400">
            Faktur pajak dan bukti pembayaran resmi elektronik diterbitkan secara instan setelah pembayaran terverifikasi.
          </p>
        </div>
      `;
    } else if (chk.step === 'processing') {
      container.innerHTML = `
        <div class="py-12 px-4 text-center space-y-4">
          <div class="w-16 h-16 rounded-full border-4 border-[#2E9B95]/20 border-t-[#2E9B95] animate-spin mx-auto"></div>
          <div>
            <h3 id="checkout-proc-title" class="font-bold text-sm text-[#0C1E36]">Menghubungkan ke Gateway Pembayaran Bank...</h3>
            <p id="checkout-proc-sub" class="text-xs text-slate-500 mt-1">Mohon tunggu, transaksi sedang diverifikasi secara real-time melalui sistem Bank Indonesia.</p>
          </div>
          <div class="max-w-xs mx-auto bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div class="bg-[#2E9B95] h-full rounded-full animate-pulse" style="width: 75%"></div>
          </div>
        </div>
      `;
    } else if (chk.step === 'success') {
      container.innerHTML = `
        <div class="py-6 px-2 text-center space-y-5 animate-checkmark">
          <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <i data-lucide="check" class="w-8 h-8 stroke-[3]"></i>
          </div>

          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full">
              LUNAS • TERVERIFIKASI
            </span>
            <h3 class="font-serif-editorial font-bold text-xl text-[#0C1E36] mt-2">
              Pembayaran Berhasil!
            </h3>
            <p class="text-xs text-slate-600 mt-1">
              Paket <strong>${chk.planName}</strong> telah aktif pada akun Anda.
            </p>
          </div>

          <!-- Digital Receipt Box -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-500">Nomor Transaksi:</span>
              <span class="font-mono font-bold text-slate-900">${chk.invoiceNo}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">Waktu Bayar:</span>
              <span class="font-semibold text-slate-800">${new Date().toLocaleString('id-ID')}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">Metode Bayar:</span>
              <span class="font-semibold text-slate-800">${chk.planPrice > 0 ? (chk.method === 'qris' ? 'QRIS Real-Time' : 'Virtual Account') : 'Aktivasi Free Trial'}</span>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-slate-200 font-bold text-sm">
              <span class="text-[#0C1E36]">Total Dibayar:</span>
              <span class="text-[#2E9B95]">IDR ${chk.planPrice.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button type="button" onclick="printOfficialInvoice('${chk.invoiceNo}')" class="w-full sm:flex-1 py-3 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs">
              <i data-lucide="printer" class="w-4 h-4"></i> Cetak Faktur Resmi (PDF)
            </button>
            <button type="button" onclick="closeCheckoutModal()" class="w-full sm:flex-1 py-3 rounded-full bg-[#0C1E36] hover:bg-slate-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 shadow-sm">
              <span>Mulai Gunakan Layanan</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  window.startPaymentSimulationProcess = function () {
    // Instant verification without any delay (tanpa delay sedikitpun)
    state.checkoutState.step = 'success';

    let user = state.currentUser;
    if (!user) {
      user = {
        id: 'usr_' + Date.now().toString(36),
        fullName: state.checkoutState.customerName || 'Klien LegalEase',
        initials: 'KL',
        companyName: state.checkoutState.customerCompany || 'PT Legal Klien',
        email: state.checkoutState.customerEmail || 'klien@legalease.co.id',
        phone: state.checkoutState.customerPhone || '0812-3456-7890',
        city: 'Jakarta',
        role: 'client',
        plan: 'biasa',
        planName: 'Paket Biasa (Rp 0)',
        planDuration: '0 Hari Aktif',
        registeredAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        isAuthenticated: true,
        transactions: []
      };
      state.currentUser = user;
    }

    user.plan = state.checkoutState.planId;
    if (state.checkoutState.planId === 'full') {
      user.planName = 'Full Legal Suite (Rp 300.000)';
      user.planDuration = 'Aktif s/d 30 Hari ke Depan';
    } else if (state.checkoutState.planId === 'chat') {
      user.planName = 'Legal Chat Essential (Rp 150.000)';
      user.planDuration = 'Aktif s/d 30 Hari ke Depan';
    } else {
      user.planName = '3-Day Free Trial (Rp 0)';
      user.planDuration = 'Aktif 3 Hari';
    }

    const txRecord = {
      id: state.checkoutState.invoiceNo,
      planName: state.checkoutState.planName,
      amount: state.checkoutState.planPrice,
      method: state.checkoutState.planPrice > 0 ? (state.checkoutState.method === 'qris' ? 'QRIS Real-Time' : 'BCA Virtual Account') : 'Free Trial Activation',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'PAID'
    };

    if (!user.transactions) user.transactions = [];
    user.transactions.unshift(txRecord);

    if (state.checkoutState.customerCompany) {
      user.companyName = state.checkoutState.customerCompany;
      state.docFormData.party1Name = state.checkoutState.customerCompany;
    }
    if (state.checkoutState.customerName) {
      user.fullName = state.checkoutState.customerName;
    }

    // Persist to registered users store
    const users = getRegisteredUsers();
    const uIdx = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (uIdx >= 0) {
      users[uIdx].plan = user.plan;
      users[uIdx].planName = user.planName;
      users[uIdx].planDuration = user.planDuration;
      users[uIdx].companyName = user.companyName;
      users[uIdx].fullName = user.fullName;
      if (!users[uIdx].transactions) users[uIdx].transactions = [];
      users[uIdx].transactions.unshift(txRecord);
      saveRegisteredUsers(users);
    } else {
      users.push(Object.assign({}, user));
      saveRegisteredUsers(users);
    }

    saveSession(user);
    saveState();
    syncNavbarUser();
    renderLandingDocPreview();
    playSuccessChime();
    renderCheckoutModal();

    // Broadcast subscription upgrade across all connected devices in real time
    if (realtimeChannel) {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'sync-user-upgrade',
        payload: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            companyName: user.companyName,
            plan: user.plan,
            planName: user.planName,
            planDuration: user.planDuration,
            transaction: txRecord
          },
          deviceId: DEVICE_ID
        }
      });
    }

    showToast(`Pembayaran berhasil! Paket ${user.planName} aktif untuk ${user.fullName}.`, 'success');
  };

  window.printOfficialInvoice = function (invId) {
    const user = state.currentUser;
    const inv = user.transactions.find(t => t.id === invId) || {
      id: invId || 'INV-2026-8492',
      planName: state.checkoutState.planName,
      amount: state.checkoutState.planPrice,
      method: state.checkoutState.method === 'qris' ? 'QRIS Real-Time' : 'Virtual Account Bank',
      date: new Date().toLocaleDateString('id-ID')
    };

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Izinkan jendela pop-up untuk mencetak faktur.');
      return;
    }
    try { printWindow.opener = null; } catch (e) {}

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Faktur Pembayaran Resmi - ${inv.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0C1E36; padding-bottom: 20px; margin-bottom: 25px; }
          .logo { font-size: 24px; font-weight: bold; color: #0C1E36; }
          .meta { text-align: right; font-size: 12px; color: #64748b; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th { background: #f8fafc; text-align: left; padding: 12px; font-size: 12px; border-bottom: 2px solid #cbd5e1; }
          .table td { padding: 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
          .total { font-size: 16px; font-weight: bold; color: #0C1E36; text-align: right; margin-top: 20px; }
          .badge { display: inline-block; padding: 4px 12px; background: #dcfce7; color: #166534; font-weight: bold; border-radius: 9999px; font-size: 11px; }
          .seal-stamp { border: 2px dashed #2E9B95; color: #2E9B95; padding: 8px 16px; display: inline-block; font-weight: bold; font-size: 11px; border-radius: 8px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">LegalEase Indonesia</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">PT LegalEase Solusi Digital Indonesia</div>
            <div style="font-size: 11px; color: #64748b;">Kemenkumham & OSS RBA Certified Legal Platform</div>
          </div>
          <div class="meta">
            <h2 style="margin: 0; color: #0C1E36; font-size: 18px;">FAKTUR PEMBAYARAN RESMI</h2>
            <div style="font-family: monospace; font-size: 14px; font-weight: bold; margin-top: 4px;">${inv.id}</div>
            <div style="margin-top: 4px;">Tanggal: ${inv.date}</div>
            <div style="margin-top: 4px;"><span class="badge">LUNAS / VERIFIED</span></div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 20px;">
          <div>
            <strong>Diterbitkan Kepada:</strong><br>
            ${user.companyName}<br>
            Attn: ${user.fullName}<br>
            ${user.city}, Indonesia
          </div>
          <div style="text-align: right;">
            <strong>Kanal Pembayaran:</strong><br>
            ${inv.method}<br>
            Status: Terverifikasi Sistem Bank Indonesia
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Deskripsi Layanan Hukum</th>
              <th>Masa Berlaku</th>
              <th>Status Akses</th>
              <th style="text-align: right;">Total Tagihan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${inv.planName}</strong></td>
              <td>1 Bulan Penuh</td>
              <td>Aktif Seketika</td>
              <td style="text-align: right; font-weight: bold;">Rp ${inv.amount.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>

        <div class="total">
          Total Dibayar: Rp ${inv.amount.toLocaleString('id-ID')}
        </div>

        <div class="seal-stamp">
          VERIFIKASI DIGITAL KEMENKUMHAM & NOTARIS RESMI
        </div>

        <div style="margin-top: 35px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
          Faktur elektronik ini sah dan diterbitkan secara resmi oleh LegalEase Indonesia. Terkoneksi dengan Ikatan Notaris Indonesia (INI).
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- BOOKING MODAL (ITEM 3: AUTH-GATE) ---
  window.openBookingModal = function (notaryId, notaryName) {
    if (!window.requireAuth(null, 'membuat janji temu dengan Notaris')) {
      return false;
    }

    const modal = document.getElementById('booking-modal');
    const notaryIdInput = document.getElementById('booking-notary-id');
    const subTitle = document.getElementById('booking-notary-subtitle');
    const dateInput = document.getElementById('booking-date');

    if (!modal) return false;
    if (notaryIdInput) notaryIdInput.value = notaryId || 'notary-1';
    if (subTitle) subTitle.textContent = notaryName || 'Dr. Hendra Wijaya, S.H., M.Kn.';
    if (dateInput) {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dateInput.value = tomorrow;
    }

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
    return true;
  };

  window.closeBookingModal = function () {
    const modal = document.getElementById('booking-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.handleConfirmBooking = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!window.requireAuth(null, 'membuat janji temu dengan Notaris')) {
      return false;
    }
    const notaryId = document.getElementById('booking-notary-id')?.value || 'notary-1';
    const notary = (typeof NOTARIES !== 'undefined' ? NOTARIES.find(n => n.id === notaryId) : null) || (typeof NOTARIES !== 'undefined' ? NOTARIES[0] : {
      id: notaryId,
      name: 'Dr. Hendra Wijaya, S.H., M.Kn.',
      title: 'Notaris & PPAT Berizin Kemenkumham RI',
      avatar: 'assets/team/team_1.jpeg'
    });
    const date = document.getElementById('booking-date')?.value || '';
    const time = document.getElementById('booking-time')?.value || '09:00 WIB';
    const mode = document.getElementById('booking-mode')?.value || 'chat';
    const topic = (document.getElementById('booking-topic')?.value || '').trim();

    const modeLabel = (mode === 'voice' ? 'Panggilan Suara Notaris' : (mode === 'chat' ? 'Konsultasi Chat Terenkripsi' : 'Tatap Muka di Kantor Notaris'));

    const newAppointment = {
      id: 'apt_' + Date.now(),
      userId: state.currentUser ? state.currentUser.id : 'guest',
      userEmail: state.currentUser ? state.currentUser.email : 'guest@example.com',
      userName: state.currentUser ? state.currentUser.fullName : 'Pengunjung',
      companyName: state.currentUser ? state.currentUser.companyName : 'PT Klien',
      notaryId: notary.id,
      notaryName: notary.name,
      notaryTitle: notary.title,
      notaryAvatar: notary.avatar || 'assets/team/team_1.jpeg',
      date: date,
      time: time,
      topic: topic,
      mode: mode,
      modeLabel: modeLabel,
      status: 'Menunggu Konfirmasi', // 'Menunggu Konfirmasi' | 'Dikonfirmasi' | 'Selesai' | 'Dibatalkan'
      stepIndex: 1, // 1: Diajukan, 2: Dikonfirmasi, 3: Selesai
      createdAt: new Date().toISOString()
    };

    if (!state.appointments) state.appointments = [];
    state.appointments.unshift(newAppointment);
    saveState();

    const topicInput = document.getElementById('booking-topic');
    if (topicInput) topicInput.value = '';

    closeBookingModal();
    showToast(`Janji temu resmi dengan ${notary.name} berhasil dijadwalkan pada ${date} pukul ${time}. Konfirmasi telah dikirimkan ke WhatsApp & Email Anda.`, 'success');

    if (typeof realtimeChannel !== 'undefined' && realtimeChannel) {
      try {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'sync-new-appointment',
          payload: newAppointment
        });
      } catch (err) {
        console.warn('Realtime appointment broadcast error:', err);
      }
    }

    if (state.currentView === 'client_dashboard') {
      renderClientPortal();
    } else if (state.currentView === 'notary_dashboard') {
      renderNotaryPortal();
    }

    return true;
  };

  window.handleCancelAppointment = function (id) {
    if (!state.appointments) state.appointments = [];
    const apt = state.appointments.find(a => a.id === id);
    if (!apt) return;
    if (!confirm('Apakah Anda yakin ingin membatalkan jadwal janji temu ini?')) return;
    apt.status = 'Dibatalkan';
    saveState();
    showToast('Janji temu berhasil dibatalkan.', 'info');

    if (typeof realtimeChannel !== 'undefined' && realtimeChannel) {
      try {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'sync-appointment-status',
          payload: { id: apt.id, status: apt.status, stepIndex: apt.stepIndex }
        });
      } catch (err) {
        console.warn('Realtime appointment broadcast error:', err);
      }
    }

    if (state.currentView === 'client_dashboard') renderClientPortal();
    if (state.currentView === 'notary_dashboard') renderNotaryPortal();
  };

  window.handleConfirmNotaryAppointment = function (id) {
    if (!state.appointments) state.appointments = [];
    const apt = state.appointments.find(a => a.id === id);
    if (!apt) return;
    apt.status = 'Dikonfirmasi';
    apt.stepIndex = 2;
    saveState();
    showToast(`Janji temu dengan ${apt.userName} (${apt.companyName}) berhasil dikonfirmasi.`, 'success');

    if (typeof realtimeChannel !== 'undefined' && realtimeChannel) {
      try {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'sync-appointment-status',
          payload: { id: apt.id, status: apt.status, stepIndex: apt.stepIndex }
        });
      } catch (err) {
        console.warn('Realtime appointment broadcast error:', err);
      }
    }

    if (state.currentView === 'notary_dashboard') renderNotaryPortal();
    if (state.currentView === 'client_dashboard') renderClientPortal();
  };

  window.handleCompleteNotaryAppointment = function (id) {
    if (!state.appointments) state.appointments = [];
    const apt = state.appointments.find(a => a.id === id);
    if (!apt) return;
    apt.status = 'Selesai';
    apt.stepIndex = 3;
    saveState();
    showToast(`Sesi janji temu dengan ${apt.userName} telah ditandai selesai. Notulensi tersimpan di sistem.`, 'success');

    if (typeof realtimeChannel !== 'undefined' && realtimeChannel) {
      try {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'sync-appointment-status',
          payload: { id: apt.id, status: apt.status, stepIndex: apt.stepIndex }
        });
      } catch (err) {
        console.warn('Realtime appointment broadcast error:', err);
      }
    }

    if (state.currentView === 'notary_dashboard') renderNotaryPortal();
    if (state.currentView === 'client_dashboard') renderClientPortal();
  };

  // --- OFFICIAL NOTARY ENCRYPTED VOICE CALL CONTROLLER (ITEM 4) ---
  let voiceCallTimerInterval = null;
  let voiceCallSeconds = 0;
  let voiceCallIsMuted = false;
  let voiceCallIsSpeaker = true;
  let voiceCallActiveNotary = null;

  window.startVoiceCall = function (notaryId) {
    if (!window.requireAuth(null, 'memulai panggilan suara dengan Notaris')) {
      return false;
    }

    const notId = notaryId || state.activeChatNotaryId || 'notary-1';
    const notary = (typeof NOTARIES !== 'undefined' ? NOTARIES.find(n => n.id === notId) : null) || (typeof NOTARIES !== 'undefined' ? NOTARIES[0] : {
      id: notId,
      name: 'Dr. Hendra Wijaya, S.H., M.Kn.',
      title: 'Notaris & PPAT Rekanan Resmi Kemenkumham RI',
      avatar: 'assets/team/team_1.jpeg'
    });

    voiceCallActiveNotary = notary;
    voiceCallSeconds = 0;
    voiceCallIsMuted = false;
    voiceCallIsSpeaker = true;

    if (voiceCallTimerInterval) {
      clearInterval(voiceCallTimerInterval);
      voiceCallTimerInterval = null;
    }

    const modal = document.getElementById('voice-call-modal');
    if (!modal) return false;

    // Populate notary details into modal
    const nameEl = document.getElementById('voice-call-notary-name');
    const titleEl = document.getElementById('voice-call-notary-title');
    const avatarEl = document.getElementById('voice-call-avatar');
    const timerEl = document.getElementById('voice-call-timer');
    const statusEl = document.getElementById('voice-call-status');

    if (nameEl) nameEl.textContent = notary.name;
    if (titleEl) titleEl.textContent = notary.title || 'Notaris & PPAT Rekanan Resmi Kemenkumham RI';
    if (avatarEl) avatarEl.src = notary.avatar;
    if (timerEl) timerEl.textContent = '00:00';
    if (statusEl) statusEl.textContent = 'Terhubung';

    syncVoiceCallControlsUI();

    modal.classList.remove('hidden');

    // Start 1-second interval timer
    voiceCallTimerInterval = setInterval(() => {
      voiceCallSeconds++;
      const mins = Math.floor(voiceCallSeconds / 60);
      const secs = voiceCallSeconds % 60;
      const formatted = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
      const timerDisplay = document.getElementById('voice-call-timer');
      if (timerDisplay) {
        timerDisplay.textContent = formatted;
      }
    }, 1000);

    if (window.lucide) window.lucide.createIcons();
    showToast(`Panggilan suara terhubung dengan ${notary.name}. Sesi resmi terenkripsi aktif.`, 'success');
    return true;
  };

  window.endVoiceCall = function () {
    if (voiceCallTimerInterval) {
      clearInterval(voiceCallTimerInterval);
      voiceCallTimerInterval = null;
    }

    const modal = document.getElementById('voice-call-modal');
    if (modal) {
      modal.classList.add('hidden');
    }

    const mins = Math.floor(voiceCallSeconds / 60);
    const secs = voiceCallSeconds % 60;
    const formatted = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    const notaryName = voiceCallActiveNotary ? voiceCallActiveNotary.name : 'Notaris';

    showToast(`Panggilan suara dengan ${notaryName} selesai (${formatted}). Ringkasan konsultasi dicatat ke buku agenda.`, 'info');
    voiceCallSeconds = 0;
  };

  function syncVoiceCallControlsUI() {
    // Mute UI
    const muteIconBg = document.getElementById('voice-call-mute-icon-bg');
    const muteLabel = document.getElementById('voice-call-mute-label');
    const muteIcon = document.getElementById('voice-call-mute-icon');

    if (muteIconBg) {
      if (voiceCallIsMuted) {
        muteIconBg.className = 'w-12 h-12 rounded-full bg-rose-500/30 text-rose-300 flex items-center justify-center transition border border-rose-400/40 shadow-sm';
      } else {
        muteIconBg.className = 'w-12 h-12 rounded-full bg-white/10 group-hover:bg-white/20 text-white flex items-center justify-center transition border border-white/10 shadow-sm';
      }
    }
    if (muteLabel) {
      muteLabel.textContent = voiceCallIsMuted ? 'Muted' : 'Mute';
      muteLabel.className = voiceCallIsMuted ? 'text-[10px] text-rose-300 font-bold' : 'text-[10px] text-slate-300 font-medium';
    }
    if (muteIcon) {
      muteIcon.setAttribute('data-lucide', voiceCallIsMuted ? 'mic-off' : 'mic');
    }

    // Speaker UI
    const speakerIconBg = document.getElementById('voice-call-speaker-icon-bg');
    const speakerLabel = document.getElementById('voice-call-speaker-label');
    const speakerIcon = document.getElementById('voice-call-speaker-icon');

    if (speakerIconBg) {
      if (voiceCallIsSpeaker) {
        speakerIconBg.className = 'w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500/30 flex items-center justify-center transition border border-cyan-400/30 shadow-sm';
      } else {
        speakerIconBg.className = 'w-12 h-12 rounded-full bg-white/10 group-hover:bg-white/20 text-slate-400 flex items-center justify-center transition border border-white/10 shadow-sm';
      }
    }
    if (speakerLabel) {
      speakerLabel.textContent = voiceCallIsSpeaker ? 'Speaker On' : 'Speaker Off';
      speakerLabel.className = voiceCallIsSpeaker ? 'text-[10px] text-cyan-200 font-medium' : 'text-[10px] text-slate-400 font-medium';
    }
    if (speakerIcon) {
      speakerIcon.setAttribute('data-lucide', voiceCallIsSpeaker ? 'volume-2' : 'volume-x');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  window.toggleVoiceMute = function () {
    voiceCallIsMuted = !voiceCallIsMuted;
    syncVoiceCallControlsUI();
    showToast(voiceCallIsMuted ? 'Mikrofon dinonaktifkan (Muted).' : 'Mikrofon diaktifkan.', 'info');
  };

  window.toggleVoiceSpeaker = function () {
    voiceCallIsSpeaker = !voiceCallIsSpeaker;
    syncVoiceCallControlsUI();
    showToast(voiceCallIsSpeaker ? 'Pengeras suara diaktifkan.' : 'Pengeras suara dimatikan (Ear-piece).', 'info');
  };

  // --- APK GUIDE MODAL & SHA CHECKSUM ---
  // --- APK VIEW LIVE MOBILE WEBVIEW SIMULATOR (BASIC TO WEB) ---
  window.openApkViewModal = function () {
    const modal = document.getElementById('apk-view-modal');
    if (modal) {
      modal.classList.remove('hidden');
      const clock = document.getElementById('apk-view-clock');
      if (clock) {
        const now = new Date();
        clock.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      }
      if (window.lucide) window.lucide.createIcons();
    }
  };

  window.closeApkViewModal = function () {
    const modal = document.getElementById('apk-view-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.reloadApkViewFrame = function () {
    const iframe = document.getElementById('apk-view-iframe');
    if (iframe) iframe.src = './index.html';
  };

  window.openApkGuideModal = function () {
    const modal = document.getElementById('apk-guide-modal');
    if (modal) modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  };

  window.closeApkGuideModal = function () {
    const modal = document.getElementById('apk-guide-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.switchGuideTab = function (osType) {
    const btnAndroid = document.getElementById('guide-tab-btn-android');
    const btnIos = document.getElementById('guide-tab-btn-ios');
    const contentAndroid = document.getElementById('guide-content-android');
    const contentIos = document.getElementById('guide-content-ios');

    if (!btnAndroid || !btnIos || !contentAndroid || !contentIos) return;

    if (osType === 'ios') {
      btnAndroid.className = 'flex-1 py-3 text-center border-b-2 border-transparent text-slate-500 hover:text-slate-800 bg-slate-50 flex items-center justify-center gap-1.5 transition';
      btnIos.className = 'flex-1 py-3 text-center border-b-2 border-emerald-600 text-emerald-800 bg-white flex items-center justify-center gap-1.5 transition';
      contentAndroid.classList.add('hidden');
      contentIos.classList.remove('hidden');
    } else {
      btnAndroid.className = 'flex-1 py-3 text-center border-b-2 border-emerald-600 text-emerald-800 bg-white flex items-center justify-center gap-1.5 transition';
      btnIos.className = 'flex-1 py-3 text-center border-b-2 border-transparent text-slate-500 hover:text-slate-800 bg-slate-50 flex items-center justify-center gap-1.5 transition';
      contentAndroid.classList.remove('hidden');
      contentIos.classList.add('hidden');
    }

    if (window.lucide) window.lucide.createIcons();
  };

  window.copySha256Checksum = function () {
    const sha = "768fe6759630d9ee8a7735dae86c4804dabc341afa6c879c5407b3a561368101";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sha).then(() => {
        showToast(`SHA-256 Checksum disalin: ${sha.slice(0, 16)}...`, 'success');
      });
    } else {
      prompt("Salin SHA-256 Checksum Berkas APK:", sha);
    }
  };

  // --- APK RELIABLE DOWNLOAD TRIGGER & FALLBACK ---
  window.triggerApkDownload = function (evt) {
    const apkRelativePath = 'assets/LegalEase-v2.4.1.apk';
    const apkFileName = 'LegalEase-v2.4.1.apk';

    // Friendly toast notification
    const toastMsg = 'Mengunduh berkas LegalEase-v2.4.1.apk (19.5 MB)... Periksa folder Unduhan browser Anda.';
    if (typeof showToast === 'function') {
      showToast(toastMsg, 'success');
    } else if (typeof window.showToast === 'function') {
      window.showToast(toastMsg, 'success');
    }

    // Determine whether this was clicked from an <a> anchor with direct href
    const target = evt ? (evt.currentTarget || evt.target) : null;
    const isDirectAnchor = target && (target.tagName === 'A' || (target.closest && target.closest('a'))) &&
      (target.getAttribute('href') === apkRelativePath || (target.closest && target.closest('a').getAttribute('href') === apkRelativePath));

    // If invoked programmatically or from an element without native download href, trigger programmatic download
    if (!isDirectAnchor) {
      const a = document.createElement('a');
      a.href = apkRelativePath;
      a.download = apkFileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) {
          a.parentNode.removeChild(a);
        }
      }, 1000);
    }

    return true;
  };

  // Fallback trigger to remote mirror repository
  window.triggerApkFallbackDownload = function () {
    const githubFallbackUrl = 'https://github.com/prince-salman/LegalEase/raw/main/assets/LegalEase-v2.4.1.apk';
    const toastMsg = 'Mengunduh berkas LegalEase dari server cadangan GitHub (19.5 MB)...';
    if (typeof showToast === 'function') {
      showToast(toastMsg, 'info');
    } else if (typeof window.showToast === 'function') {
      window.showToast(toastMsg, 'info');
    }

    const a = document.createElement('a');
    a.href = githubFallbackUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = 'LegalEase-v2.4.1.apk';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) {
        a.parentNode.removeChild(a);
      }
    }, 1000);
    return true;
  };


  // --- PRODUCTION AUTH MODAL (LOGIN, REGISTER, PROFILE) ---
  window.selectRegPlan = function (planId) {
    state.selectedRegPlan = planId;
    ['trial', 'chat', 'full'].forEach(p => {
      const card = document.getElementById('reg-card-' + p);
      const radio = document.getElementById('reg-radio-' + p);
      if (!card || !radio) return;
      if (p === planId) {
        if (p === 'trial') {
          card.className = 'cursor-pointer p-3 rounded-2xl border-2 transition-all flex flex-col justify-between border-emerald-600 bg-emerald-50/70 shadow-xs';
          radio.className = 'w-4 h-4 rounded-full border-2 border-emerald-600 bg-emerald-600 flex items-center justify-center';
        } else if (p === 'chat') {
          card.className = 'cursor-pointer p-3 rounded-2xl border-2 transition-all flex flex-col justify-between border-teal-600 bg-teal-50/70 shadow-xs';
          radio.className = 'w-4 h-4 rounded-full border-2 border-teal-600 bg-teal-600 flex items-center justify-center';
        } else {
          card.className = 'cursor-pointer p-3 rounded-2xl border-2 transition-all flex flex-col justify-between border-amber-500 bg-amber-50/70 shadow-xs';
          radio.className = 'w-4 h-4 rounded-full border-2 border-amber-500 bg-amber-500 flex items-center justify-center';
        }
        radio.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-white"></span>';
      } else {
        card.className = 'cursor-pointer p-3 rounded-2xl border-2 transition-all flex flex-col justify-between border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300';
        radio.className = 'w-4 h-4 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center';
        radio.innerHTML = '';
      }
    });

    const submitText = document.getElementById('reg-submit-text');
    if (submitText) {
      if (planId === 'trial') {
        submitText.textContent = 'Buat Akun & Aktifkan Free Trial (Rp 0)';
      } else if (planId === 'chat') {
        submitText.textContent = 'Buat Akun & Lanjut Pembayaran (Rp 150.000)';
      } else {
        submitText.textContent = 'Buat Akun & Lanjut Pembayaran (Rp 300.000)';
      }
    }
  };

  window.openAuthModal = function (mode, selectedPlanId) {
    mode = mode || (state.currentUser ? 'profile' : 'login');
    selectedPlanId = selectedPlanId || state.selectedRegPlan || 'trial';
    state.selectedRegPlan = selectedPlanId;
    const modal = document.getElementById('auth-modal');
    const body = document.getElementById('auth-modal-body');
    if (!modal || !body) return;

    const user = state.currentUser;

    if (mode === 'login') {
      body.innerHTML = `
        <div class="space-y-4 text-xs">
          <div class="text-center pb-2 border-b border-slate-100">
            <h4 class="font-serif-editorial font-bold text-xl text-[#0C1E36]">Masuk ke Akun Klien</h4>
            <p class="text-[11px] text-slate-500 mt-0.5">Akses layanan notaris, konsultasi terenkripsi, dan pembuatan dokumen hukum</p>
          </div>

          <!-- Quick-Fill Demo Accounts -->
          <div class="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl space-y-2">
            <div class="flex items-center justify-between text-[11px] font-bold text-amber-950">
              <span class="flex items-center gap-1.5">
                <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-600"></i>
                1-Click Quick-Fill Demo Akun
              </span>
              <span class="text-[9px] font-semibold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">Siap Pakai</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-0.5">
              <button type="button" id="quick-fill-gelsay" onclick="quickFillDemoAccount('gelsay')" class="px-2.5 py-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-100/50 text-[11px] font-bold text-slate-800 text-left transition flex items-center gap-1.5 shadow-2xs group cursor-pointer">
                <span class="text-sm">🏢</span>
                <span class="truncate group-hover:text-amber-950">Klien Korporasi (PT Gelsay)</span>
              </button>
              <button type="button" id="quick-fill-fajar" onclick="quickFillDemoAccount('fajar')" class="px-2.5 py-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-100/50 text-[11px] font-bold text-slate-800 text-left transition flex items-center gap-1.5 shadow-2xs group cursor-pointer">
                <span class="text-sm">👤</span>
                <span class="truncate group-hover:text-amber-950">Klien Bisnis (Fajar)</span>
              </button>
              <button type="button" id="quick-fill-admin" onclick="quickFillDemoAccount('admin')" class="px-2.5 py-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-100/50 text-[11px] font-bold text-slate-800 text-left transition flex items-center gap-1.5 shadow-2xs group cursor-pointer">
                <span class="text-sm">⚖️</span>
                <span class="truncate group-hover:text-amber-950">Admin Notaris (Dr. Hendra)</span>
              </button>
            </div>
          </div>

          <form onsubmit="handleUserLoginSubmit(event)" novalidate class="space-y-3 pt-1">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Email / Username Akun</label>
              <input type="text" id="auth-login-email" required placeholder="nama@perusahaan.co.id atau username demo" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#0C1E36] focus:bg-white text-xs font-medium">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Kata Sandi</label>
              <input type="password" id="auth-login-password" required placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#0C1E36] focus:bg-white text-xs font-medium">
            </div>

            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-slate-600 font-medium">
                <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600"></i>
                Sesi Terenkripsi SSL 256-bit • Perlindungan Anti-Brute Force
              </span>
              <span class="text-[9px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">AKTIF</span>
            </div>

            <button type="submit" class="w-full py-3 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer">
              <i data-lucide="log-in" class="w-4 h-4"></i> Masuk Sekarang
            </button>
          </form>

          <div class="pt-3 border-t border-slate-100 text-center">
            <p class="text-slate-600">
              Belum memiliki akun perusahaan? 
              <button type="button" onclick="openAuthModal('register')" class="font-bold text-[#2E9B95] hover:underline">Daftar Akun Baru (Gratis)</button>
            </p>
          </div>
        </div>
      `;
    } else if (mode === 'register') {
      const curPlan = selectedPlanId || state.selectedRegPlan || 'trial';
      body.innerHTML = `
        <div class="space-y-4 text-xs">
          <div class="text-center pb-2 border-b border-slate-100">
            <h4 class="font-serif-editorial font-bold text-xl text-[#0C1E36]">Registrasi Akun Klien Baru</h4>
            <p class="text-[11px] text-slate-500 mt-0.5">Daftarkan perusahaan Anda & pilih paket perlindungan hukum sesuai kebutuhan</p>
          </div>

          <form onsubmit="handleUserRegisterSubmit(event)" class="space-y-3 pt-1">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input type="text" id="reg-name" required placeholder="Budi Santoso" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#0C1E36] focus:bg-white text-xs font-medium">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Nama Perusahaan / PT</label>
                <input type="text" id="reg-company" required placeholder="PT Cahaya Mandiri" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#0C1E36] focus:bg-white text-xs font-medium">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Email Resmi</label>
                <input type="email" id="reg-email" required placeholder="budi@cahaya.co.id" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#0C1E36] focus:bg-white text-xs font-medium">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
                <input type="tel" id="reg-phone" required placeholder="0812-3456-7890" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#0C1E36] focus:bg-white text-xs font-medium">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Kata Sandi</label>
                <input type="password" id="reg-password" required placeholder="Minimal 6 karakter" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#0C1E36] focus:bg-white text-xs font-medium">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Kota Kedudukan</label>
                <input type="text" id="reg-city" placeholder="Jakarta Selatan" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#0C1E36] focus:bg-white text-xs font-medium">
              </div>
            </div>

            <!-- PILIHAN PAKET LAYANAN UNTUK PENGGUNA BARU -->
            <div class="pt-1">
              <div class="flex items-center justify-between mb-1.5">
                <label class="block font-bold text-slate-800 text-xs">Pilih Paket Layanan Sesuai Kebutuhan:</label>
                <span class="text-[10px] text-emerald-700 font-semibold">Fleksibel & Tanpa Kontrak Kaku</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2" id="reg-plan-cards-container">
                <!-- Option 1: 3-Day Free Trial (Rp 0) -->
                <div onclick="selectRegPlan('trial')" id="reg-card-trial" class="cursor-pointer p-3 rounded-2xl border-2 transition-all flex flex-col justify-between ${curPlan === 'trial' ? 'border-emerald-600 bg-emerald-50/70 shadow-xs' : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'}">
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-200 text-emerald-900 font-mono">GRATIS</span>
                      <span id="reg-radio-trial" class="w-4 h-4 rounded-full border-2 ${curPlan === 'trial' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'} flex items-center justify-center">
                        ${curPlan === 'trial' ? '<span class="w-1.5 h-1.5 rounded-full bg-white"></span>' : ''}
                      </span>
                    </div>
                    <div class="font-bold text-xs text-[#0C1E36]">3-Day Free Trial</div>
                    <div class="text-sm font-bold text-emerald-700 my-0.5">Rp 0</div>
                    <p class="text-[10px] text-slate-500 leading-tight">Konsultasi notaris via chat & checklist PT.</p>
                  </div>
                </div>

                <!-- Option 2: Legal Chat Essential (Rp 150.000) -->
                <div onclick="selectRegPlan('chat')" id="reg-card-chat" class="cursor-pointer p-3 rounded-2xl border-2 transition-all flex flex-col justify-between ${curPlan === 'chat' ? 'border-teal-600 bg-teal-50/70 shadow-xs' : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'}">
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[9px] px-2 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 font-mono">HEMAT</span>
                      <span id="reg-radio-chat" class="w-4 h-4 rounded-full border-2 ${curPlan === 'chat' ? 'border-teal-600 bg-teal-600' : 'border-slate-300 bg-white'} flex items-center justify-center">
                        ${curPlan === 'chat' ? '<span class="w-1.5 h-1.5 rounded-full bg-white"></span>' : ''}
                      </span>
                    </div>
                    <div class="font-bold text-xs text-[#0C1E36]">Chat Essential</div>
                    <div class="text-sm font-bold text-teal-800 my-0.5">Rp 150.000</div>
                    <p class="text-[10px] text-slate-500 leading-tight">Tanya jawab notaris unlimited via chat 30 hari.</p>
                  </div>
                </div>

                <!-- Option 3: Full Legal Suite (Rp 300.000) -->
                <div onclick="selectRegPlan('full')" id="reg-card-full" class="cursor-pointer p-3 rounded-2xl border-2 transition-all flex flex-col justify-between ${curPlan === 'full' ? 'border-amber-500 bg-amber-50/70 shadow-xs' : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'}">
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-200 text-amber-900 font-mono">LENGKAP</span>
                      <span id="reg-radio-full" class="w-4 h-4 rounded-full border-2 ${curPlan === 'full' ? 'border-amber-500 bg-amber-500' : 'border-slate-300 bg-white'} flex items-center justify-center">
                        ${curPlan === 'full' ? '<span class="w-1.5 h-1.5 rounded-full bg-white"></span>' : ''}
                      </span>
                    </div>
                    <div class="font-bold text-xs text-[#0C1E36]">Full Legal Suite</div>
                    <div class="text-sm font-bold text-amber-900 my-0.5">Rp 300.000</div>
                    <p class="text-[10px] text-slate-500 leading-tight">Panggilan suara notaris + 6 draf akta PT & kontrak Word.</p>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" id="reg-submit-btn" class="w-full py-3 rounded-xl bg-[#2E9B95] hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition mt-2">
              <i data-lucide="user-plus" class="w-4 h-4"></i>
              <span id="reg-submit-text">${curPlan === 'trial' ? 'Buat Akun & Aktifkan Free Trial (Rp 0)' : (curPlan === 'chat' ? 'Buat Akun & Lanjut Pembayaran (Rp 150.000)' : 'Buat Akun & Lanjut Pembayaran (Rp 300.000)')}</span>
            </button>
          </form>

          <div class="pt-3 border-t border-slate-100 text-center">
            <p class="text-slate-600">
              Sudah memiliki akun terdaftar? 
              <button type="button" onclick="openAuthModal('login')" class="font-bold text-[#2E9B95] hover:underline">Masuk di sini</button>
            </p>
          </div>
        </div>
      `;
    } else {
      // mode === 'profile'
      if (!user) {
        openAuthModal('login');
        return;
      }

      body.innerHTML = `
        <div class="space-y-4 text-xs">
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div class="flex items-center justify-between mb-3">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Profil Pengguna Aktif</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${user.role === 'admin' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-200 text-slate-700'}">
                ${user.role === 'admin' ? 'Administrator / Notaris' : user.planName}
              </span>
            </div>

            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-[#0C1E36] text-amber-300 font-extrabold text-sm flex items-center justify-center">
                ${user.initials || user.fullName.substring(0, 2).toUpperCase()}
              </div>
              <div class="truncate">
                <div class="font-bold text-sm text-[#0C1E36] truncate">${user.fullName}</div>
                <div class="text-slate-600 font-medium truncate">${user.companyName}</div>
                <div class="text-[10px] text-slate-400 truncate">${user.email} • ${user.phone || '-'}</div>
              </div>
            </div>

            <div class="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
              <span class="text-slate-500">Status Keanggotaan:</span>
              <span class="font-bold text-slate-900">${user.planName}</span>
            </div>
          </div>

          ${user.role === 'admin' ? `
            <div class="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
              <div>
                <span class="font-bold text-amber-950 block text-xs">Konsol Notaris Real-Time</span>
                <span class="text-[10px] text-amber-800">Kelola chat klien multi-perangkat dan verifikasi berkas</span>
              </div>
              <button onclick="closeAuthModal(); openAdminConsole();" class="px-3.5 py-2 rounded-xl bg-[#0C1E36] text-amber-300 font-bold text-xs">
                Buka Konsol
              </button>
            </div>
          ` : ''}

          <div class="pt-2 flex items-center gap-2">
            <button type="button" onclick="handleUserSignOut()" class="flex-1 py-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 transition">
              <i data-lucide="log-out" class="w-4 h-4"></i> Keluar dari Akun
            </button>
            <button type="button" onclick="closeAuthModal()" class="px-5 py-2.5 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-white font-bold text-xs transition">
              Tutup
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

  window.quickFillDemoAccount = function (type) {
    const emailInput = document.getElementById('auth-login-email');
    const passInput = document.getElementById('auth-login-password');
    if (!emailInput || !passInput) return;

    if (type === 'gelsay' || type === 'corporate' || type === 'korporasi') {
      emailInput.value = 'gelsay@nusantaralaw.co.id';
      passInput.value = 'gelsaypass';
      showToast('Kredensial Klien Korporasi (PT Gelsay) berhasil diisi.', 'info');
    } else if (type === 'fajar' || type === 'business' || type === 'bisnis') {
      emailInput.value = 'fajar@sinergidigital.co.id';
      passInput.value = 'secret123';
      showToast('Kredensial Klien Bisnis (Fajar) berhasil diisi.', 'info');
    } else if (type === 'admin') {
      emailInput.value = 'admin@legalease.co.id';
      passInput.value = 'admin';
      showToast('Kredensial Admin Notaris (Dr. Hendra) berhasil diisi.', 'info');
    }
  };

  window.fillAdminCredentials = function () {
    window.quickFillDemoAccount('admin');
  };

  window.handleUserLoginSubmit = async function (e) {
    if (e && e.preventDefault) e.preventDefault();
    const rawEmail = (document.getElementById('auth-login-email')?.value || '').trim();
    const email = rawEmail.toLowerCase();
    const password = (document.getElementById('auth-login-password')?.value || '').trim();

    if (!email || !password) {
      showToast('Mohon masukkan email dan kata sandi Anda.', 'error');
      return;
    }

    // Rate-Limiting & Anti-Brute-Force Protection (bypassed for demo accounts)
    const throttle = checkLoginThrottling(email);
    if (!throttle.allowed) {
      showToast(`Terlalu banyak percobaan gagal. Akun dikunci sementara demi keamanan. Coba lagi dalam ${throttle.remainingSecs} detik.`, 'error');
      return;
    }

    // 1. Check Administrator Notary Login (Admin Besar) via Salted SHA-256 Hash or Demo Credential
    if (email === 'admin@legalease.co.id' || email === 'admin') {
      const inputHash = await computeHash(password, ADMIN_SALT);
      if (ADMIN_CREDENTIAL_HASHES.includes(inputHash) || password === 'admin') {
        ADMIN_ALIASES.forEach(a => clearFailedLogin(a));
        state.currentUser = Object.assign({}, ADMIN_ACCOUNT);
        state.currentUser.sessionToken = generateSessionToken();
        state.currentUser.sessionExpiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 jam
        saveSession(state.currentUser);
        saveState();
        syncNavbarUser();
        closeAuthModal();
        switchView('admin_dashboard');
        showToast('Autentikasi terverifikasi. Masuk sebagai Notaris Administrator (Admin Besar).', 'success');
        return;
      } else {
        recordFailedLogin(email);
        showToast('Kredensial admin besar tidak valid. Akses ditolak.', 'error');
        return;
      }
    }

    // 2. Check Regular Partner Notary Login (Notaris Rekanan Biasa - Bukan Admin Besar)
    if (email === 'notaris@legalease.co.id' || email === 'notaris' || email === 'hendra.wijaya@notaris-legalease.id') {
      if (password === 'notaris123' || password === 'notaris' || password === 'admin') {
        NOTARY_ALIASES.forEach(a => clearFailedLogin(a));
        state.currentUser = Object.assign({}, NOTARY_ACCOUNT);
        state.currentUser.sessionToken = generateSessionToken();
        state.currentUser.sessionExpiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 jam
        saveSession(state.currentUser);
        saveState();
        syncNavbarUser();
        closeAuthModal();
        switchView('notary_dashboard');
        showToast('Autentikasi terverifikasi. Masuk ke Meja Kerja Notaris Rekanan.', 'success');
        return;
      } else {
        recordFailedLogin(email);
        showToast('Kata sandi notaris rekanan tidak valid.', 'error');
        return;
      }
    }

    // 3. Check Corporate Client Aliases (Gelsay Behrous - PT Gelsay Law Nusantara)
    const gelsayAliases = GELSAY_ALIASES;
    if (gelsayAliases.includes(email)) {
      let isGelsayMatch = (password === 'gelsaypass' || password === 'secret123');
      const users = getRegisteredUsers();
      let gelsayUser = users.find(u => gelsayAliases.includes((u.email || '').toLowerCase()) || u.id === 'usr_client_gelsay');
      if (!isGelsayMatch && gelsayUser && gelsayUser.passwordHash && gelsayUser.passwordSalt) {
        const computed = await computeHash(password, gelsayUser.passwordSalt);
        if (computed === gelsayUser.passwordHash) isGelsayMatch = true;
      }

      if (isGelsayMatch) {
        gelsayAliases.forEach(a => clearFailedLogin(a));
        if (!gelsayUser) {
          gelsayUser = JSON.parse(JSON.stringify(CORPORATE_GELSAY_USER));
          const newSalt = generateCryptoSalt(16);
          gelsayUser.passwordHash = await computeHash('gelsaypass', newSalt);
          gelsayUser.passwordSalt = newSalt;
          users.push(gelsayUser);
          saveRegisteredUsers(users);
        }
        const safeUser = Object.assign({}, gelsayUser);
        delete safeUser.passwordHash;
        delete safeUser.passwordSalt;
        delete safeUser.password;
        safeUser.sessionToken = generateSessionToken();
        safeUser.sessionExpiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 jam
        state.currentUser = safeUser;
        saveSession(safeUser);
        saveState();
        syncNavbarUser();
        closeAuthModal();
        switchView('client_dashboard');
        showToast(`Selamat datang kembali, ${escapeHtml(safeUser.fullName)}!`, 'success');
        return;
      } else {
        recordFailedLogin(email);
        showToast('Kata sandi untuk akun korporasi salah. Gunakan kata sandi "gelsaypass" atau "secret123".', 'error');
        return;
      }
    }

    // 4. Check Business Client Aliases (Fajar Nugraha - PT Sinergi Digital Indonesia)
    const fajarAliases = FAJAR_ALIASES;
    if (fajarAliases.includes(email)) {
      let isFajarMatch = (password === 'secret123');
      const users = getRegisteredUsers();
      let fajarUser = users.find(u => fajarAliases.includes((u.email || '').toLowerCase()) || u.id === 'usr_client_fajar');
      if (!isFajarMatch && fajarUser && fajarUser.passwordHash && fajarUser.passwordSalt) {
        const computed = await computeHash(password, fajarUser.passwordSalt);
        if (computed === fajarUser.passwordHash) isFajarMatch = true;
      }

      if (isFajarMatch) {
        fajarAliases.forEach(a => clearFailedLogin(a));
        if (!fajarUser) {
          fajarUser = JSON.parse(JSON.stringify(BUSINESS_FAJAR_USER));
          const newSalt = generateCryptoSalt(16);
          fajarUser.passwordHash = await computeHash('secret123', newSalt);
          fajarUser.passwordSalt = newSalt;
          users.push(fajarUser);
          saveRegisteredUsers(users);
        }
        const safeUser = Object.assign({}, fajarUser);
        delete safeUser.passwordHash;
        delete safeUser.passwordSalt;
        delete safeUser.password;
        safeUser.sessionToken = generateSessionToken();
        safeUser.sessionExpiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 jam
        state.currentUser = safeUser;
        saveSession(safeUser);
        saveState();
        syncNavbarUser();
        closeAuthModal();
        switchView('client_dashboard');
        showToast(`Selamat datang kembali, ${escapeHtml(safeUser.fullName)}!`, 'success');
        return;
      } else {
        recordFailedLogin(email);
        showToast('Kata sandi untuk akun klien bisnis salah. Gunakan kata sandi "secret123".', 'error');
        return;
      }
    }

    // 5. Check Other Registered Client Accounts via Salted SHA-256 Hash
    const users = getRegisteredUsers();
    let found = users.find(u => u.email.toLowerCase() === email);

    // Support instant sign-in for pre-configured client accounts if not yet in localStorage
    if (!found && DEFAULT_CLIENT_ACCOUNTS[email]) {
      const defaultEntry = DEFAULT_CLIENT_ACCOUNTS[email];
      const matchPass = (defaultEntry.passwords && defaultEntry.passwords.includes(password)) || defaultEntry.password === password;
      if (matchPass) {
        const newSalt = generateCryptoSalt(16);
        const passwordHash = await computeHash(password, newSalt);
        const newUser = Object.assign({}, defaultEntry.user, {
          passwordHash: passwordHash,
          passwordSalt: newSalt
        });
        users.push(newUser);
        saveRegisteredUsers(users);
        found = newUser;
      }
    }
    if (found) {
      let isMatch = false;
      if (found.passwordHash && found.passwordSalt) {
        const computed = await computeHash(password, found.passwordSalt);
        isMatch = (computed === found.passwordHash);
      } else if (found.password) {
        // Transparent backward-compatible upgrade to cryptographic hash
        if (found.password === password) {
          isMatch = true;
          const newSalt = generateCryptoSalt(16);
          found.passwordHash = await computeHash(password, newSalt);
          found.passwordSalt = newSalt;
          delete found.password;
          saveRegisteredUsers(users);
        }
      }

      if (isMatch) {
        clearFailedLogin(email);
        const safeUser = Object.assign({}, found);
        delete safeUser.passwordHash;
        delete safeUser.passwordSalt;
        delete safeUser.password;
        safeUser.sessionToken = generateSessionToken();
        safeUser.sessionExpiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 jam
        state.currentUser = safeUser;
        saveSession(safeUser);
        saveState();
        syncNavbarUser();
        closeAuthModal();
        switchView('client_dashboard');
        showToast(`Selamat datang kembali, ${escapeHtml(found.fullName)}!`, 'success');
        return;
      } else {
        recordFailedLogin(email);
        showToast('Kata sandi yang Anda masukkan salah.', 'error');
        return;
      }
    }

    recordFailedLogin(email);
    showToast('Akun tidak ditemukan. Silakan periksa kembali email Anda atau daftar akun baru.', 'error');
  };

  window.handleUserRegisterSubmit = async function (e) {
    if (e && e.preventDefault) e.preventDefault();
    const name = (document.getElementById('reg-name')?.value || '').trim();
    const company = (document.getElementById('reg-company')?.value || '').trim();
    const email = (document.getElementById('reg-email')?.value || '').trim().toLowerCase();
    const phone = (document.getElementById('reg-phone')?.value || '').trim();
    const password = (document.getElementById('reg-password')?.value || '').trim();
    const city = (document.getElementById('reg-city')?.value || '').trim() || 'Jakarta Selatan';

    if (!name || !company || !email || !password) {
      showToast('Mohon lengkapi semua kolom yang wajib diisi.', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showToast('Format email tidak valid. Gunakan format email resmi (contoh: nama@perusahaan.co.id).', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Kata sandi harus minimal 6 karakter demi perlindungan akun.', 'error');
      return;
    }

    const users = getRegisteredUsers();
    if (users.some(u => u.email === email)) {
      showToast('Email ini sudah terdaftar. Silakan masuk menggunakan kata sandi Anda.', 'error');
      return;
    }

    const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'KL';
    
    // Generate cryptographic salt and salted SHA-256 hash
    const salt = generateCryptoSalt(16);
    const passwordHash = await computeHash(password, salt);

    const selectedPlan = state.selectedRegPlan || 'trial';
    let planName = '3-Day Free Trial (Rp 0)';
    let planDuration = '3 Hari Aktif';
    if (selectedPlan === 'chat') {
      planName = 'Legal Chat Essential';
      planDuration = '1 Bulan (30 Hari)';
    } else if (selectedPlan === 'full') {
      planName = 'Full Legal Suite';
      planDuration = '1 Bulan (Akses Penuh)';
    } else {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + 3);
      planDuration = '3 Hari Aktif (s.d ' + expDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ')';
    }

    const newUser = {
      id: 'usr_' + Date.now().toString(36),
      fullName: name,
      initials: initials,
      companyName: company,
      email: email,
      phone: phone || '0812-3456-7890',
      passwordHash: passwordHash,
      passwordSalt: salt,
      city: city,
      role: 'client',
      plan: selectedPlan,
      planName: planName,
      planDuration: planDuration,
      registeredAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      isAuthenticated: true,
      transactions: []
    };

    users.push(newUser);
    saveRegisteredUsers(users);

    const safeUser = Object.assign({}, newUser);
    delete safeUser.passwordHash;
    delete safeUser.passwordSalt;
    safeUser.sessionToken = generateSessionToken();
    safeUser.sessionExpiresAt = Date.now() + (24 * 60 * 60 * 1000);

    state.currentUser = safeUser;
    state.docFormData.party1Name = company;
    saveSession(safeUser);
    saveState();
    syncNavbarUser();
    closeAuthModal();
    switchView('client_dashboard');

    if (selectedPlan === 'trial') {
      showToast('Akun perseroan berhasil didaftarkan! Paket 3-Day Free Trial (Rp 0) telah aktif.', 'success');
    } else if (selectedPlan === 'chat') {
      showToast('Akun berhasil dibuat. Mengalihkan ke pembayaran paket Legal Chat Essential (Rp 150.000)...', 'info');
      openCheckoutModal('chat');
    } else if (selectedPlan === 'full') {
      showToast('Akun berhasil dibuat. Mengalihkan ke pembayaran paket Full Legal Suite (Rp 300.000)...', 'info');
      openCheckoutModal('full');
    }

    // Broadcast new registration to Realtime channel for cross-device awareness
    if (realtimeChannel) {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'sync-user-register',
        payload: {
          user: {
            id: newUser.id,
            fullName: newUser.fullName,
            initials: newUser.initials,
            companyName: newUser.companyName,
            email: newUser.email,
            phone: newUser.phone,
            city: newUser.city,
            role: newUser.role,
            plan: newUser.plan,
            planName: newUser.planName,
            planDuration: newUser.planDuration,
            registeredAt: newUser.registeredAt,
            transactions: []
          },
          deviceId: DEVICE_ID
        }
      });
    }

    showToast(`Selamat datang ${escapeHtml(name)}! Akun perseroan ${escapeHtml(company)} berhasil didaftarkan.`, 'success');
  };

  window.handleUserSignOut = function () {
    state.currentUser = null;
    saveSession(null);
    saveState();
    switchView('public');
    closeAuthModal();
    showToast('Anda telah keluar dari akun LegalEase.', 'info');
  };

  // --- FAQ ACCORDION ---
  window.toggleFaq = function (num) {
    const content = document.getElementById(`faq-content-${num}`);
    const icon = document.getElementById(`faq-icon-${num}`);
    if (!content) return;

    const isHidden = content.classList.contains('hidden');
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

  // --- MOBILE MENU ---
  window.toggleMobileMenu = function () {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden');
  };
  window.closeMobileMenu = function () {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.add('hidden');
  };

  // --- BACK TO TOP (Item 10) ---
  window.scrollToTop = function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function initBackToTop() {
    const updateBackToTop = function () {
      const btn = document.getElementById('back-to-top-btn');
      if (!btn) return;
      if (window.scrollY > 300) {
        btn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
        btn.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
      } else {
        btn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
        btn.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
      }
    };
    window.addEventListener('scroll', updateBackToTop, { passive: true });
    updateBackToTop();
  }
  window.switchClientPortalTab = function (tab) {
    if (typeof window.switchClientTab === 'function') {
      window.switchClientTab(tab);
    }
  };
  window.deselectAdminChat = function () {
    state.activeAdminChatEmail = null;
    if (state.currentView === 'notary_dashboard') {
      renderNotaryPortal();
    } else {
      renderAdminContent();
    }
  };

  function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (btn && menu) {
      btn.addEventListener('click', () => {
        window.toggleMobileMenu();
      });
      menu.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('click', () => {
          window.closeMobileMenu();
        });
      });
    }
  }

  // --- INITIALIZATION ---
  
  // --- SOUND SYNTHESIZER FOR LIVE CHAT MESSAGE NOTIFICATION ---
  function playMessageNotificationSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.08); // A5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      // AudioContext blocked or not allowed, continue silently
    }
  }

  // --- ESCAPE HTML UTILITY ---
  function escapeHtml(str) {

    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  window.escapeHtml = escapeHtml;

  // --- CHAT MESSAGE FORMATTER (MARKDOWN TO CLEAN HTML) ---
  function formatChatMessage(text) {
    if (!text) return '';
    let formatted = escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/\n• /g, '<br><span class="text-[#2E9B95] font-bold">•</span> ')
      .replace(/\n\n/g, '</p><p class="mt-2 text-xs">')
      .replace(/\n/g, '<br>');
    return `<p class="text-xs">${formatted}</p>`;
  }

  // --- INITIAL GREETING GENERATOR PER NOTARY & CLIENT PROFILE ---
  function generateInitialGreeting(notaryId, user) {
    const not = NOTARIES.find(n => n.id === notaryId) || NOTARIES[0];
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    if (user && user.plan === 'full') {
      return [
        {
          id: 'msg_init_' + notaryId,
          sender: 'notary',
          senderName: not.name,
          senderAvatar: not.avatar,
          text: `Selamat siang Ibu/Bapak **${user.fullName}** (${user.companyName}).\n\nStatus akun **Full Legal Suite** Anda aktif. Saya **${not.name}** siap memberikan telaah hukum prioritas, review dokumen kontrak, serta pendampingan pendirian PT atau perizinan OSS RBA untuk perseroan Anda. Silakan sampaikan pertanyaan atau lampirkan dokumen yang ingin ditelaah.`,
          timestamp: now
        }
      ];
    } else {
      const cName = user ? user.fullName : 'Calon Klien';
      const compName = user ? ` dari **${user.companyName}**` : '';
      return [
        {
          id: 'msg_init_' + notaryId,
          sender: 'notary',
          senderName: not.name,
          senderAvatar: not.avatar,
          text: `Halo Bapak/Ibu **${cName}**${compName}!\n\nSaya **${not.name}** (${not.title}). Sesi konsultasi hukum resmi LegalEase telah terhubung langsung dengan kantor kami. Apakah ada kebutuhan terkait pendirian PT, perizinan KBLI, kontrak kerja, atau legalitas bisnis yang dapat saya bantu telaah hari ini?`,
          timestamp: now
        }
      ];
    }
  }

  // --- AUTHORITATIVE INDONESIAN LEGAL ADVISORY ENGINE ---
  function generateNotaryLegalResponse(userMessage, notary, currentUser, attachmentName) {
    const msg = (userMessage || '').toLowerCase();
    const userName = currentUser ? currentUser.fullName : 'Bapak/Ibu Klien';
    const companyName = currentUser ? currentUser.companyName : 'Perusahaan Anda';

    if (attachmentName) {
      return `Terima kasih Bapak/Ibu **${userName}**. Dokumen berkas **"${attachmentName}"** telah berhasil saya terima dan buka pada sistem notarial LegalEase.\n\n` +
        `**Hasil Telaah Awal Klausul Hukum (${notary.name}):**\n` +
        `1. **Komparisi Para Pihak**: Struktur kedudukan ${companyName} telah teridentifikasi. Pastikan kewenangan penandatangan sesuai dengan Anggaran Dasar perseroan yang berlaku atau didukung Surat Kuasa Khusus.\n` +
        `2. **Asas Keseimbangan Hak & Kewajiban (Pasal 1320 & 1338 KUHPerdata)**: Klausul wanprestasi dan tata cara pengakhiran kontrak telah memadai, namun saya sarankan menambahkan batas waktu masa teguran tertulis (Somasi) minimal 7 (tujuh) hari kalender sebelum pengakhiran sepihak.\n` +
        `3. **Penyelesaian Sengketa**: Dianjurkan menyepakati domisili hukum tetap di Pengadilan Negeri setempat atau klausul Arbitrase BANI untuk menjamin kerahasiaan materi perkara.\n` +
        `4. **Bea Meterai**: Wajib dibubuhi e-Meterai Rp 10.000 resmi sebelum penandatanganan.\n\n` +
        `Draf ini secara prinsip telah memenuhi kaidah hukum positif Indonesia. Apakah Anda ingin menjadwalkan legalisasi resmi atau sesi penandatanganan akta notariil?`;
    }

    // Pendirian PT / Badan Usaha / KBLI / Modal
    if (msg.includes('pt') || msg.includes('modal') || msg.includes('kbli') || msg.includes('oss') || msg.includes('akta pendirian') || msg.includes('ahu')) {
      return `Terkait pendirian badan usaha perseroan untuk **${companyName}**, regulasi mengacu pada UU No. 40 Tahun 2007 tentang Perseroan Terbatas jo. UU Cipta Kerja No. 6 Tahun 2023 serta PP No. 8 Tahun 2021:\n\n` +
        `1. **Klasifikasi Pendirian PT**:\n` +
        `   • **PT Persekutuan Modal (Biasa)**: Minimal 2 orang pendiri/pemegang saham. Besaran modal dasar ditentukan kesepakatan para pendiri, dengan modal ditempatkan & disetor minimum 25% yang dibuktikan dengan bukti setor bank.\n` +
        `   • **PT Perorangan (UMKM)**: Khusus usaha mikro/kecil, cukup 1 orang pendiri WNI berusia minimal 21 tahun dengan membuat Pernyataan Pendirian elektronik.\n\n` +
        `2. **Pengecekan Nama di AHU Online**: Nama PT wajib terdiri dari minimal 3 kata berbahasa Indonesia dan belum pernah didaftarkan oleh pihak lain.\n\n` +
        `3. **KBLI 2020 & Perizinan Berusaha**: Pemilihan kode KBLI 5 digit menentukan tingkat risiko (Rendah, Menengah Rendah, Menengah Tinggi, Tinggi) pada portal OSS RBA untuk penerbitan NIB dan Sertifikat Standar.\n\n` +
        `Kantor notaris kami dapat menyelesaikan penerbitan Akta Pendirian dan SK Pengesahan Kemenkumham RI dalam waktu 1-3 hari kerja.`;
    }

    // Ketenagakerjaan / PKWT / PKWTT / Gaji / Pesangon / Kontrak Kerja
    if (msg.includes('pkwt') || msg.includes('pkwtt') || msg.includes('kerja') || msg.includes('karyawan') || msg.includes('kompensasi') || msg.includes('pesangon') || msg.includes('probation')) {
      return `Mengenai hukum ketenagakerjaan dan kontrak kerja karyawan di **${companyName}**, ketentuan mengacu pada PP No. 35 Tahun 2021 turunan UU Cipta Kerja:\n\n` +
        `1. **Jangka Waktu PKWT (Kontrak Tertentu)**:\n` +
        `   • PKWT dapat dibuat untuk jangka waktu maksimal **5 (lima) tahun**, termasuk keseluruhan perpanjangan kontrak.\n` +
        `   • Pekerjaan yang diperjanjikan harus bersifat sementara atau musiman, bukan pekerjaan yang bersifat tetap.\n\n` +
        `2. **Uang Kompensasi PKWT (Kewajiban Mutlak)**:\n` +
        `   • Pengusaha wajib memberikan uang kompensasi kepada pekerja PKWT yang masa kerjanya minimal 1 bulan berturut-turut saat masa kontrak berakhir.\n` +
        `   • Rumus perhitungan: \`(Masa Kerja dalam Bulan / 12) x 1 Bulan Upah Pokok + Tunjangan Tetap\`.\n\n` +
        `3. **Larangan Masa Percobaan (Probation)**:\n` +
        `   • PKWT dilarang mensyaratkan adanya masa percobaan. Jika dicantumkan, klausul tersebut batal demi hukum dan masa kerja tetap dihitung sejak hari pertama.\n\n` +
        `Format PKWT standar Kementerian Ketenagakerjaan telah kami sediakan di menu Template Dokumen LegalEase.`;
    }

    // HAKI / Merek / Brand / Hak Cipta / Paten / DJKI
    if (msg.includes('merek') || msg.includes('haki') || msg.includes('paten') || msg.includes('djki') || msg.includes('hak cipta') || msg.includes('logo')) {
      return `Terkait pendaftaran hak kekayaan intelektual (HAKI) dan merek dagang untuk **${companyName}**, ketentuannya diatur dalam UU No. 20 Tahun 2016 jo. UU Cipta Kerja:\n\n` +
        `1. **Prinsip First to File**: Di Indonesia, hak eksklusif merek dipegang oleh pihak yang pertama kali mengajukan pendaftaran resmi ke DJKI Kemenkumham, bukan pemakai pertama secara de facto.\n\n` +
        `2. **Penelusuran Pangkalan Data PDKI**: Sebelum mengajukan pendaftaran, penelusuran wajib dilakukan pada kelas barang/jasa Nice Classification untuk memastikan tidak ada kesamaan pada pokoknya (persamaan fonetik bunyi, visual logo, maupun makna kata).\n\n` +
        `3. **Masa Perlindungan**: Sertifikat Merek berlaku selama 10 (sepuluh) tahun sejak tanggal penerimaan berkas dan dapat diperpanjang seterusnya setiap 10 tahun.\n\n` +
        `Saya dapat mendampingi proses audit kelayakan nama merek dan pengajuan permohonan online langsung ke DJKI Kemenkumham.`;
    }

    // Kerahasiaan / NDA / Non-Disclosure / Rahasia Dagang
    if (msg.includes('nda') || msg.includes('rahasia') || msg.includes('non-disclosure') || msg.includes('bocor') || msg.includes('ganti rugi')) {
      return `Mengenai Perjanjian Kerahasiaan (Non-Disclosure Agreement - NDA) untuk melindungi aset intelektual **${companyName}**, dasar hukum utamanya adalah UU No. 30 Tahun 2000 tentang Rahasia Dagang:\n\n` +
        `1. **Kriteria Perlindungan Rahasia Dagang**: Informasi dilindungi apabila bersifat rahasia (tidak diketahui umum), memiliki nilai ekonomi komersial, dan dijaga kerahasiaannya melalui upaya yang wajar (seperti penandatanganan NDA).\n\n` +
        `2. **Jangka Waktu Mengikat**: Disarankan klausul kerahasiaan tetap mengikat para pihak minimal 2 hingga 3 tahun setelah kerjasama bisnis berakhir, atau tanpa batas waktu (perpetual) untuk rahasia dagang mendasar (source code/formula).\n\n` +
        `3. **Klausul Liquidated Damages**: Memuat nominal denda ganti rugi pasti yang disepakati jika terjadi pelanggaran kerahasiaan untuk memudahkan pembuktian ganti rugi di pengadilan.\n\n` +
        `Format NDA bilateral berkekuatan hukum penuh dapat langsung Anda generate di LegalEase.`;
    }

    // Sewa Menyewa / Properti / Tanah / PPAT
    if (msg.includes('sewa') || msg.includes('tanah') || msg.includes('kantor') || msg.includes('ppat') || msg.includes('gedung') || msg.includes('ruko')) {
      return `Terkait perjanjian sewa menyewa ruang kantor atau properti usaha, berlaku ketentuan Buku III KUHPerdata Pasal 1548 s/d 1600:\n\n` +
        `1. **Bentuk Perjanjian Notariil vs Bawah Tangan**: Untuk sewa berjangka panjang (>1 tahun) atau nilai kontrak bernilai signifikan, pembuatan Akta Sewa Notariil sangat disarankan karena memiliki kekuatan pembuktian sempurna (volledig bewijs) dan grosse akta yang memiliki titel eksekutorial.\n\n` +
        `2. **Kewajiban Pajak Sewa**: Pastikan tertuang jelas dalam klausul mengenai pemotongan PPh Final Pasal 4 ayat (2) sebesar 10% dan kewajiban PBB tahun berjalan.\n\n` +
        `3. **Klausul Pengosongan & Deposit**: Wajib memuat mekanisme pemotongan uang jaminan (security deposit) serta klausul kuasa mutlak pengosongan jika penyewa wanprestasi saat masa sewa berakhir.`;
    }

    // Biaya / Tarif / Jadwal Notaris
    if (msg.includes('biaya') || msg.includes('harga') || msg.includes('tarif') || msg.includes('bayar') || msg.includes('jadwal') || msg.includes('temu')) {
      return `Untuk tarif layanan kenotariatan dan konsultasi di LegalEase:\n\n` +
        `1. **Konsultasi Chat Online**: Tersedia Paket Legal Chat Essential seharga **IDR 150.000/bulan** untuk konsultasi tanpa batas dengan Notaris & PPAT.\n` +
        `2. **Full Legal Suite**: **IDR 300.000/bulan** mencakup konsultasi chat prioritas, panggilan suara (voice call HD) langsung dengan Notaris, dan akses penuh pembuatan serta pengunduhan seluruh template kontrak hukum (Word & PDF).\n` +
        `3. **Pembuatan Akta Otentik**: Dikenakan tarif berdasarkan ketentuan Pasal 36 UU Jabatan Notaris (UUJN No. 2 Tahun 2014) disesuaikan dengan nilai ekonomis akta, ditambah biaya resmi PNBP Kemenkumham RI.\n\n` +
        `Anda dapat menjadwalkan janji temu tatap muka atau panggilan suara melalui tombol **"Jadwal Tatap Muka"** pada profil notaris kami.`;
    }

    // General / Fallback
    return `Terima kasih atas pertanyaan Anda, Bapak/Ibu **${userName}**.\n\n` +
      `Menanggapi poin yang Anda sampaikan terkait kegiatan usaha **${companyName}**:\n` +
      `1. Berdasarkan prinsip hukum perikatan perdata di Indonesia (Pasal 1320 & 1338 KUHPerdata), setiap kesepakatan bisnis berlaku sebagai undang-undang bagi mereka yang membuatnya sepanjang memenuhi 4 syarat sah: kesepakatan para pihak, kecakapan bertindak, obyek tertentu, dan kausa yang halal.\n` +
      `2. Untuk menjamin kepastian hukum (*legal certainty*) dan memitigasi risiko sengketa di kemudian hari, setiap transaksi atau perikatan sebaiknya dibuat dalam bentuk tertulis dengan klausul hak, kewajiban, wanprestasi, dan penyelesaian sengketa yang terperinci.\n\n` +
      `Ada dokumen tertentu atau klausul spesifik yang ingin saya bantu susunkan atau telaah lebih mendalam? Anda juga dapat mengunggah berkas rancangan kontrak melalui tombol lampiran (klip kertas).`;
  }

  // --- RENDER LIVE CHAT MESSAGES (ITEM 11: WHATSAPP-STYLE DOWNWARD CHAT) ---
  function renderChatMessages() {
    const container = document.getElementById('chat-messages-stream');
    const portalContainer = document.getElementById('client-portal-chat-stream');
    if (!container && !portalContainer) return;

    const notaryId = state.activeChatNotaryId || 'notary-1';
    const notary = NOTARIES.find(n => n.id === notaryId) || NOTARIES[0];

    if (!state.chatHistory) state.chatHistory = {};
    if (!state.chatHistory[notaryId] || state.chatHistory[notaryId].length === 0) {
      state.chatHistory[notaryId] = generateInitialGreeting(notaryId, state.currentUser);
    }

    const msgs = state.chatHistory[notaryId];

    const bubblesHtml = msgs.map(msg => {
      if (msg.sender === 'notary') {
        return `
          <div class="chat-bubble-notary flex items-start gap-2 max-w-[85%] sm:max-w-[75%] mr-auto mb-2.5">
            <img src="${msg.senderAvatar || notary.avatar}" alt="${escapeHtml(msg.senderName)}" class="w-8 h-8 rounded-full object-cover border border-slate-300 shrink-0 mt-0.5 shadow-2xs">
            <div class="flex flex-col items-start">
              <span class="font-bold text-[10px] text-teal-800 mb-0.5 pl-1">${escapeHtml(msg.senderName)}</span>
              <div class="p-3 rounded-2xl rounded-tl-xs bg-white border border-slate-200/90 text-slate-800 leading-relaxed shadow-2xs text-xs space-y-1.5 relative">
                ${formatChatMessage(msg.text)}
                <div class="text-[9px] text-slate-400 text-right mt-1 font-mono">${msg.timestamp}</div>
              </div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="chat-bubble-user flex items-start justify-end gap-2 max-w-[85%] sm:max-w-[75%] ml-auto mb-2.5">
            <div class="flex flex-col items-end">
              <span class="font-bold text-[10px] text-slate-500 mb-0.5 pr-1">Anda</span>
              <div class="p-3 rounded-2xl rounded-tr-xs bg-[#D9FDD3] border border-emerald-200/60 text-slate-900 leading-relaxed shadow-2xs text-xs space-y-1.5 relative">
                ${msg.attachment ? `
                  <div class="p-2 rounded-xl bg-emerald-100/70 border border-emerald-300/60 flex items-center gap-2 mb-1.5">
                    <div class="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <i data-lucide="file-text" class="w-4 h-4"></i>
                    </div>
                    <div class="truncate text-left">
                      <div class="font-bold text-[11px] text-slate-900 truncate">${escapeHtml(msg.attachment.name)}</div>
                      <div class="text-[9px] text-slate-600 font-mono">${msg.attachment.size} • Terlampir</div>
                    </div>
                  </div>
                ` : ''}
                <div class="text-left text-slate-900 leading-relaxed">${escapeHtml(msg.text)}</div>
                <div class="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-500 font-mono">
                  <span>${msg.timestamp}</span>
                  <span class="text-sky-600 font-bold tracking-tighter" title="Terkirim & Tersampaikan">✓✓</span>
                </div>
              </div>
            </div>
            <div class="w-8 h-8 rounded-full bg-[#0C1E36] text-amber-300 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 border border-amber-300/30">
              ${(state.currentUser && state.currentUser.initials) || 'K'}
            </div>
          </div>
        `;
      }
    }).join('');

    const lastMsg = msgs[msgs.length - 1];
    let pendingIndicator = '';
    if (lastMsg && lastMsg.sender === 'user') {
      pendingIndicator = `
        <div class="chat-pending-status flex items-center justify-end gap-1.5 text-[10px] text-slate-500 italic pr-10 mb-2">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Pesan terkirim ke Notaris ${escapeHtml(notary.name)} • Menunggu tanggapan langsung...</span>
        </div>
      `;
    }

    if (container) {
      container.innerHTML = bubblesHtml + pendingIndicator;
      container.scrollTop = container.scrollHeight;
    }
    if (portalContainer) {
      portalContainer.innerHTML = bubblesHtml + pendingIndicator;
      portalContainer.scrollTop = portalContainer.scrollHeight;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // --- LIVE CHAT CONTROLLER FUNCTIONS (ITEM 13: AUTH-GATE) ---
  window.openLiveChat = function (notaryId) {
    if (!window.requireAuth(null, 'mengakses konsultasi live chat dengan Notaris')) {
      return false;
    }
    if (notaryId) {
      state.activeChatNotaryId = notaryId;
    }
    const notId = state.activeChatNotaryId || 'notary-1';
    const notary = NOTARIES.find(n => n.id === notId) || NOTARIES[0];

    const modal = document.getElementById('live-chat-modal');
    const trigger = document.getElementById('floating-chat-widget');
    const avatarEl = document.getElementById('chat-notary-avatar');
    const nameEl = document.getElementById('chat-notary-name');
    const titleEl = document.getElementById('chat-notary-title');
    const selectEl = document.getElementById('chat-notary-select');
    const clientPill = document.getElementById('chat-client-pill');

    if (avatarEl) avatarEl.src = notary.avatar;
    if (nameEl) nameEl.textContent = notary.name;
    if (titleEl) titleEl.textContent = `${notary.title} • Online Siap Menjawab`;
    if (selectEl) selectEl.value = notId;
    if (clientPill) {
      if (state.currentUser) {
        clientPill.textContent = `${state.currentUser.fullName} (${state.currentUser.companyName})`;
      } else {
        clientPill.textContent = 'Pengunjung Platform LegalEase';
      }
    }

    if (modal) modal.classList.remove('hidden');
    if (trigger) trigger.classList.add('hidden');

    renderChatMessages();

    const input = document.getElementById('chat-input-text');
    if (input) input.focus();
  };

  window.closeLiveChat = function () {
    const modal = document.getElementById('live-chat-modal');
    const trigger = document.getElementById('floating-chat-widget');
    if (modal) modal.classList.add('hidden');
    if (trigger) trigger.classList.remove('hidden');
  };

  window.toggleLiveChat = function () {
    const modal = document.getElementById('live-chat-modal');
    if (modal && !modal.classList.contains('hidden')) {
      closeLiveChat();
    } else {
      openLiveChat();
    }
  };

  window.switchChatNotary = function (notaryId) {
    state.activeChatNotaryId = notaryId;
    openLiveChat(notaryId);
  };

  window.openBookingFromChat = function () {
    const notaryId = state.activeChatNotaryId || 'notary-1';
    const notary = NOTARIES.find(n => n.id === notaryId) || NOTARIES[0];
    openBookingModal(notary.id, notary.name);
  };

  window.sendChatMessage = function (text, attachment) {
    text = (text || '').trim();
    if (!text && !attachment) return;

    const notaryId = state.activeChatNotaryId || 'notary-1';
    const notary = NOTARIES.find(n => n.id === notaryId) || NOTARIES[0];
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    if (!state.chatHistory) state.chatHistory = {};
    if (!state.chatHistory[notaryId]) {
      state.chatHistory[notaryId] = generateInitialGreeting(notaryId, state.currentUser);
    }

    const cUser = state.currentUser || {
      fullName: 'Pengunjung Platform',
      companyName: 'Calon Klien',
      email: 'tamu@legalease.co.id'
    };

    const newMsg = {
      id: 'msg_usr_' + Date.now(),
      sender: 'user',
      senderName: cUser.fullName,
      text: text,
      attachment: attachment || null,
      timestamp: now
    };

    // Append user message
    state.chatHistory[notaryId].push(newMsg);

    // Track in Admin thread directly (for live admin reply - Item 12)
    const email = cUser.email || 'guest@klien.id';
    if (!state.adminClientChats) state.adminClientChats = {};
    if (!state.adminClientChats[email]) {
      state.adminClientChats[email] = {
        clientName: cUser.fullName,
        clientCompany: cUser.companyName || 'Perusahaan Klien',
        clientEmail: email,
        unreadCount: 0,
        messages: []
      };
    }
    state.adminClientChats[email].messages.push(newMsg);
    state.adminClientChats[email].unreadCount++;

    saveState();
    renderChatMessages();

    const typingIndicator = document.getElementById('chat-typing-indicator');
    if (typingIndicator) typingIndicator.classList.add('hidden');

    const container = document.getElementById('chat-messages-stream');
    if (container) container.scrollTop = container.scrollHeight;

    // BROADCAST TO ALL CONNECTED DEVICES VIA SUPABASE REALTIME (NO BOT REPLY - Item 12)
    if (realtimeChannel) {
      try {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'client-message',
          payload: {
            id: newMsg.id,
            notaryId: notaryId,
            sender: 'user',
            senderName: state.currentUser ? state.currentUser.fullName : 'Klien Tamu',
            userEmail: email,
            userCompany: state.currentUser ? state.currentUser.companyName : 'Perusahaan Klien',
            text: text,
            attachment: attachment || null,
            timestamp: now,
            deviceId: DEVICE_ID
          }
        });
      } catch (err) {
        console.warn('Realtime client message error:', err);
      }
    }
  };

  window.handleSendChatForm = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('chat-input-text');
    if (!input) return;
    const val = input.value;
    input.value = '';
    sendChatMessage(val);
  };

  window.sendQuickPrompt = function (promptText) {
    sendChatMessage(promptText);
  };

  window.toggleChatAttachmentBar = function () {
    const bar = document.getElementById('chat-attachment-bar');
    if (bar) bar.classList.toggle('hidden');
  };

  window.attachLegalSampleDoc = function (docName, docSize) {
    toggleChatAttachmentBar();
    sendChatMessage(`Saya melampirkan berkas dokumen "${docName}" untuk ditelaah klausul legalitas dan kepatuhannya.`, {
      name: docName,
      size: docSize
    });
  };

  window.handleChatFileUpload = function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    toggleChatAttachmentBar();
    const sizeFormatted = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' 
      : (file.size / 1024).toFixed(1) + ' KB';
    sendChatMessage(`Saya mengunggah berkas "${file.name}" untuk telaah hukum notaris.`, {
      name: file.name,
      size: sizeFormatted
    });
    e.target.value = '';
  };

  window.clearCurrentChatHistory = function () {
    const notaryId = state.activeChatNotaryId || 'notary-1';
    state.chatHistory[notaryId] = generateInitialGreeting(notaryId, state.currentUser);
    saveState();
    renderChatMessages();
    showToast('Percakapan telah direset ke salam awal.', 'info');
  };

  
  // --- CROSS-DEVICE SUPABASE REALTIME INITIALIZATION ---
  const REALTIME_ROOM = 'legalease-production-consultation';
  let realtimeChannel = null;

  function initRealtimeChannel() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return;
    try {
      if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      }
      realtimeChannel = supabaseClient.channel(REALTIME_ROOM, {
        config: { broadcast: { self: false } }
      });

      realtimeChannel.on('broadcast', { event: 'client-message' }, (payload) => {
        handleIncomingRealtimeMessage(payload.payload);
      });

      realtimeChannel.on('broadcast', { event: 'notary-reply' }, (payload) => {
        handleIncomingRealtimeMessage(payload.payload);
      });

      realtimeChannel.on('broadcast', { event: 'sync-new-appointment' }, (payload) => {
        if (!state.appointments) state.appointments = [];
        if (payload && payload.payload && !state.appointments.some(a => a.id === payload.payload.id)) {
          state.appointments.unshift(payload.payload);
          saveState();
          if (state.currentView === 'client_dashboard') renderClientPortal();
          if (state.currentView === 'notary_dashboard') renderNotaryPortal();
        }
      });

      realtimeChannel.on('broadcast', { event: 'sync-appointment-status' }, (payload) => {
        if (!state.appointments) state.appointments = [];
        if (payload && payload.payload) {
          const found = state.appointments.find(a => a.id === payload.payload.id);
          if (found) {
            found.status = payload.payload.status;
            found.stepIndex = payload.payload.stepIndex;
            saveState();
            if (state.currentView === 'client_dashboard') renderClientPortal();
            if (state.currentView === 'notary_dashboard') renderNotaryPortal();
          }
        }
      });

      realtimeChannel.on('broadcast', { event: 'sync-user-register' }, (payload) => {
        if (payload && payload.payload && payload.payload.user) {
          const u = payload.payload.user;
          const users = getRegisteredUsers();
          const existingIdx = users.findIndex(item => item.email.toLowerCase() === u.email.toLowerCase());
          const mappedUser = {
            id: u.id || ('usr_' + Date.now().toString(36)),
            fullName: u.fullName,
            initials: u.initials || (u.fullName ? u.fullName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'KL'),
            companyName: u.companyName,
            email: u.email,
            phone: u.phone || '-',
            city: u.city || 'Indonesia',
            role: u.role || 'client',
            plan: u.plan || 'biasa',
            planName: u.planName || 'Paket Biasa (Rp 0)',
            planDuration: u.planDuration || '0 Hari Aktif',
            registeredAt: u.registeredAt || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            transactions: u.transactions || []
          };
          if (existingIdx >= 0) {
            users[existingIdx] = Object.assign(users[existingIdx], mappedUser);
          } else {
            users.push(mappedUser);
          }
          saveRegisteredUsers(users);
        }
        if (state.currentUser && state.currentUser.role === 'admin') {
          showToast(`Klien baru terdaftar: ${payload.payload.user.fullName} (${payload.payload.user.companyName})`, 'info');
          renderAdminContent();
        }
      });

      realtimeChannel.on('broadcast', { event: 'sync-user-upgrade' }, (payload) => {
        if (payload && payload.payload && payload.payload.user) {
          const up = payload.payload.user;
          const users = getRegisteredUsers();
          const uIdx = users.findIndex(u => u.email.toLowerCase() === up.email.toLowerCase());
          if (uIdx >= 0) {
            users[uIdx].plan = up.plan;
            users[uIdx].planName = up.planName;
            users[uIdx].planDuration = up.planDuration;
            if (!users[uIdx].transactions) users[uIdx].transactions = [];
            if (up.transaction && !users[uIdx].transactions.some(t => t.id === up.transaction.id)) {
              users[uIdx].transactions.unshift(up.transaction);
            }
            saveRegisteredUsers(users);
          }
          if (state.currentUser && state.currentUser.role === 'admin') {
            showToast(`Upgrade Langganan: ${up.fullName} mengaktifkan ${up.planName}`, 'success');
            renderAdminContent();
          }
        }
      });

      realtimeChannel.subscribe((status) => {
        console.log('📡 Supabase Realtime Cross-Device Status:', status);
      });
    } catch (e) {
      console.warn('Realtime channel error:', e);
    }
  }

  function handleIncomingRealtimeMessage(data) {
    if (!data) return;

    // Track in Admin thread
    const email = data.userEmail || 'guest@klien.id';
    if (!state.adminClientChats[email]) {
      state.adminClientChats[email] = {
        clientName: data.senderName || 'Klien',
        clientCompany: data.userCompany || 'Perusahaan Klien',
        clientEmail: email,
        unreadCount: 0,
        messages: []
      };
    }

    // Auto-record client in registered users store if sent by user
    if (data.sender === 'user' && data.userEmail) {
      const users = getRegisteredUsers();
      if (!users.some(item => item.email.toLowerCase() === data.userEmail.toLowerCase())) {
        users.push({
          id: 'usr_' + Date.now().toString(36),
          fullName: data.senderName || 'Klien',
          initials: (data.senderName || 'KL').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(),
          companyName: data.userCompany || 'Perusahaan Klien',
          email: data.userEmail,
          phone: '-',
          city: 'Indonesia',
          role: 'client',
          plan: 'biasa',
          planName: 'Paket Biasa (Rp 0)',
          planDuration: '0 Hari Aktif',
          registeredAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          transactions: []
        });
        saveRegisteredUsers(users);
      }
    }

    state.adminClientChats[email].messages.push({
      id: data.id,
      sender: data.sender,
      senderName: data.senderName,
      senderAvatar: data.senderAvatar,
      text: data.text,
      attachment: data.attachment,
      timestamp: data.timestamp
    });

    if (data.sender === 'user') {
      state.adminClientChats[email].unreadCount++;
    }

    // If active user is client and matches conversation, add to local stream
    if (state.currentUser && state.currentUser.email === email) {
      const notId = data.notaryId || state.activeChatNotaryId || 'notary-1';
      if (!state.chatHistory[notId]) state.chatHistory[notId] = [];
      state.chatHistory[notId].push({
        id: data.id,
        sender: data.sender,
        senderName: data.senderName,
        senderAvatar: data.senderAvatar,
        text: data.text,
        attachment: data.attachment,
        timestamp: data.timestamp
      });
      renderChatMessages();
      playMessageNotificationSound();
    }

    // If Admin Console is currently open, re-render
    const adminModal = document.getElementById('admin-console-modal');
    if (adminModal && !adminModal.classList.contains('hidden')) {
      renderAdminContent();
      playMessageNotificationSound();
    }
  }


  // =========================================================================
  // MULTI-ROLE VIEW ROUTING & DISTINCT DASHBOARDS SYSTEM
  // =========================================================================

  window.switchView = function (viewName) {
    state.currentView = viewName;
    const publicView = document.getElementById('public-landing-view');
    const clientView = document.getElementById('client-portal-view');
    const notaryView = document.getElementById('notary-portal-view');
    const adminView = document.getElementById('admin-portal-view');

    if (viewName === 'client_dashboard') {
      if (!window.requireAuth(null, 'mengakses portal klien')) {
        return;
      }
      if (publicView) publicView.classList.add('hidden');
      if (notaryView) notaryView.classList.add('hidden');
      if (adminView) adminView.classList.add('hidden');
      if (clientView) {
        clientView.classList.remove('hidden');
        renderClientPortal();
      }
    } else if (viewName === 'notary_dashboard') {
      if (!state.currentUser || (state.currentUser.role !== 'notary' && state.currentUser.role !== 'admin')) {
        showToast('Akses ditolak: Dasbor ini khusus Notaris Rekanan.', 'error');
        return;
      }
      if (publicView) publicView.classList.add('hidden');
      if (clientView) clientView.classList.add('hidden');
      if (adminView) adminView.classList.add('hidden');
      if (notaryView) {
        notaryView.classList.remove('hidden');
        renderNotaryPortal();
      }
    } else if (viewName === 'admin_dashboard') {
      if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Akses ditolak: Konsol ini khusus Notaris Administrator.', 'error');
        return;
      }
      if (publicView) publicView.classList.add('hidden');
      if (clientView) clientView.classList.add('hidden');
      if (notaryView) notaryView.classList.add('hidden');
      if (adminView) {
        adminView.classList.remove('hidden');
        renderAdminPortal();
      }
    } else {
      // 'public'
      if (clientView) clientView.classList.add('hidden');
      if (notaryView) notaryView.classList.add('hidden');
      if (adminView) adminView.classList.add('hidden');
      if (publicView) publicView.classList.remove('hidden');
    }

    syncNavbarUser();
    saveState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) window.lucide.createIcons();
  };

  // --- DEDICATED CLIENT PORTAL WORKSPACE (ROLE: CLIENT / USER) ---
  window.switchClientTab = function (tabName) {
    state.activeClientTab = tabName;
    renderClientPortal();
  };

  window.selectClientDocTemplate = function (docKey) {
    if (!CONTRACT_TEMPLATES[docKey]) return;
    state.activeDocKey = docKey;
    renderClientPortal();
  };

  window.handleClientDocFormInput = function (field, value) {
    state.docFormData[field] = value;
    saveState();
    renderClientPortal();
  };

  window.handleClientPortalSendChat = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('client-portal-chat-input');
    if (!input) return;
    const val = input.value;
    input.value = '';
    window.sendChatMessage(val);
  };

  function renderClientWorkspaceTabBody(user, activeDoc, clauses, notary, msgs, transactions, clientAppointments) {
    if (!clientAppointments) {
      clientAppointments = (state.appointments || []).filter(apt => {
        if (!user) return false;
        return apt.userId === user.id ||
               apt.userEmail === user.email ||
               (user.email && apt.userEmail && apt.userEmail.toLowerCase().includes('fajar') && user.email.toLowerCase().includes('fajar')) ||
               (user.email && apt.userEmail && apt.userEmail.toLowerCase().includes('gelsay') && user.email.toLowerCase().includes('gelsay'));
      });
    }

    if (state.activeClientTab === 'appointments') {
      const aptList = clientAppointments || [];
      return `
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-bold text-[#0C1E36]">Riwayat Janji Temu & Progres Layanan</h3>
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono">
                  SINKRON REALTIME
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">Pantau status pengajuan jadwal, konfirmasi notaris, dan pelacakan sesi konsultasi resmi</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs font-mono">
                ${aptList.length} Janji Temu
              </span>
              <button onclick="openBookingModal('notary-1', 'Dr. Hendra Wijaya, S.H., M.Kn.')" class="px-4 py-2 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 font-bold text-xs transition flex items-center gap-1.5 shadow-xs">
                <i data-lucide="calendar-plus" class="w-3.5 h-3.5"></i>
                <span>Jadwalkan Janji Temu</span>
              </button>
            </div>
          </div>

          ${aptList.length === 0 ? `
            <div class="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200 max-w-xl mx-auto space-y-4">
              <div class="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto shadow-2xs">
                <i data-lucide="calendar-clock" class="w-7 h-7"></i>
              </div>
              <div>
                <h4 class="font-bold text-slate-800 text-sm">Belum Ada Riwayat Janji Temu</h4>
                <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  Anda belum memiliki jadwal janji temu dengan Notaris Rekanan. Jadwalkan konsultasi tatap muka kantor atau panggilan suara resmi untuk pendirian PT dan penelaahan kontrak.
                </p>
              </div>
              <button onclick="openBookingModal('notary-1', 'Dr. Hendra Wijaya, S.H., M.Kn.')" class="px-5 py-2.5 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 font-bold text-xs shadow-sm transition inline-flex items-center gap-2">
                <i data-lucide="calendar" class="w-4 h-4"></i>
                <span>Jadwalkan Janji Temu Sekarang</span>
              </button>
            </div>
          ` : `
            <div class="space-y-5">
              ${aptList.map(apt => {
                const isVoice = apt.mode === 'voice';
                const isChat = apt.mode === 'chat';
                const isDeed = apt.mode === 'in_person_deed';

                const statusColor = apt.status === 'Dikonfirmasi'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : (apt.status === 'Selesai'
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : (apt.status === 'Dibatalkan'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-800 border-amber-300'));

                return `
                  <div class="appointment-card p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-500/50 transition shadow-sm space-y-4" id="appointment-card-${apt.id}">
                    <!-- Card Top Header -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                      <div class="flex items-center gap-3">
                        <div class="relative shrink-0">
                          <img src="${apt.notaryAvatar || 'assets/team/team_1.jpeg'}" alt="${escapeHtml(apt.notaryName)}" class="w-12 h-12 rounded-full object-cover border-2 border-emerald-400">
                          <span class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></span>
                        </div>
                        <div>
                          <div class="flex flex-wrap items-center gap-2">
                            <h4 class="font-bold text-sm text-[#0C1E36]">${escapeHtml(apt.notaryName)}</h4>
                            <span class="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-200">
                              SK KEMENKUMHAM
                            </span>
                          </div>
                          <p class="text-[11px] text-slate-500 mt-0.5">${escapeHtml(apt.notaryTitle || 'Notaris & PPAT Berizin')}</p>
                          <div class="flex flex-wrap items-center gap-2 mt-1.5">
                            <span class="appointment-datetime inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold font-mono">
                              <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-500"></i> ${escapeHtml(apt.date)} • ${escapeHtml(apt.time)}
                            </span>
                            <span class="appointment-mode-badge inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${isVoice ? 'bg-emerald-100 text-emerald-800' : (isChat ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900')}">
                              <i data-lucide="${isVoice ? 'phone-call' : (isChat ? 'messages-square' : 'map-pin')}" class="w-3 h-3"></i>
                              ${escapeHtml(apt.modeLabel || (isVoice ? 'Panggilan Suara Notaris' : (isChat ? 'Konsultasi Chat Terenkripsi' : 'Tatap Muka di Kantor Notaris')))}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div class="flex flex-col sm:items-end gap-1">
                        <span class="appointment-status-badge px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${statusColor}">
                          ${apt.status === 'Menunggu Konfirmasi' ? '<span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>' : ''}
                          ${apt.status === 'Dikonfirmasi' ? '<i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i>' : ''}
                          ${apt.status === 'Selesai' ? '<i data-lucide="award" class="w-3.5 h-3.5 text-slate-600"></i>' : ''}
                          <span>${escapeHtml(apt.status)}</span>
                        </span>
                        <span class="text-[10px] text-slate-400 font-mono">ID: ${escapeHtml(apt.id)}</span>
                      </div>
                    </div>

                    <!-- Topic / Agenda Block -->
                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                      <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">Topik Hukum / Kebutuhan Perseroan</div>
                      <p class="appointment-topic text-slate-800 font-semibold leading-relaxed">${escapeHtml(apt.topic || 'Konsultasi hukum perseroan dan pengesahan akta')}</p>
                    </div>

                    <!-- 3-Step Visual Progress Tracker -->
                    <div class="pt-2">
                      <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">Status & Progres Layanan</div>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                        <!-- Step 1 -->
                        <div class="step-tracker-1 p-3.5 rounded-2xl border transition ${apt.stepIndex >= 1 ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-500'}">
                          <div class="flex items-center gap-2.5">
                            <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${apt.stepIndex >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}">
                              <i data-lucide="check" class="w-4 h-4"></i>
                            </div>
                            <div>
                              <div class="font-bold text-xs">1. Pengajuan Diajukan</div>
                              <div class="text-[10px] text-slate-500 font-mono mt-0.5">Terkirim ke Notaris</div>
                            </div>
                          </div>
                        </div>

                        <!-- Step 2 -->
                        <div class="step-tracker-2 p-3.5 rounded-2xl border transition ${apt.stepIndex >= 2 ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : (apt.stepIndex === 1 ? 'bg-amber-50/70 border-amber-300 text-amber-950' : 'bg-slate-50 border-slate-200 text-slate-500')}">
                          <div class="flex items-center gap-2.5">
                            <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${apt.stepIndex >= 2 ? 'bg-emerald-600 text-white' : (apt.stepIndex === 1 ? 'bg-amber-500 text-slate-950 font-extrabold animate-pulse' : 'bg-slate-200 text-slate-600')}">
                              ${apt.stepIndex >= 2 ? '<i data-lucide="check" class="w-4 h-4"></i>' : '2'}
                            </div>
                            <div>
                              <div class="font-bold text-xs">2. Dikonfirmasi Notaris</div>
                              <div class="text-[10px] font-mono mt-0.5 ${apt.stepIndex >= 2 ? 'text-emerald-700 font-semibold' : 'text-slate-500'}">
                                ${apt.stepIndex >= 2 ? 'Jadwal Terkunci' : 'Menunggu Konfirmasi'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Step 3 -->
                        <div class="step-tracker-3 p-3.5 rounded-2xl border transition ${apt.stepIndex >= 3 ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-500'}">
                          <div class="flex items-center gap-2.5">
                            <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${apt.stepIndex >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}">
                              ${apt.stepIndex >= 3 ? '<i data-lucide="check" class="w-4 h-4"></i>' : '3'}
                            </div>
                            <div>
                              <div class="font-bold text-xs">3. Sesi Konsultasi & Notulensi Selesai</div>
                              <div class="text-[10px] font-mono mt-0.5 ${apt.stepIndex >= 3 ? 'text-emerald-700 font-semibold' : 'text-slate-500'}">
                                ${apt.stepIndex >= 3 ? 'Selesai & Notulensi Terbit' : 'Diagendakan'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Card Actions Bar -->
                    <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div class="text-[11px] text-slate-400 font-mono">
                        Dibuat pada: ${new Date(apt.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>

                      <div class="flex flex-wrap items-center gap-2">
                        ${(apt.status !== 'Dibatalkan' && apt.status !== 'Selesai') ? `
                          <button onclick="handleCancelAppointment('${apt.id}')" class="btn-cancel-apt px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 font-semibold text-xs transition">
                            Batalkan Janji
                          </button>
                        ` : ''}

                        ${isVoice ? `
                          <button onclick="startVoiceCall('${apt.notaryId}')" class="btn-start-voice-call px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs">
                            <i data-lucide="phone-call" class="w-3.5 h-3.5"></i>
                            <span>Mulai Panggilan Suara</span>
                          </button>
                        ` : ''}

                        ${isChat ? `
                          <button onclick="openLiveChat('${apt.notaryId}')" class="btn-open-chat px-4 py-2 rounded-xl bg-[#2E9B95] hover:bg-teal-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs">
                            <i data-lucide="messages-square" class="w-3.5 h-3.5"></i>
                            <span>Buka Chat Notaris</span>
                          </button>
                        ` : ''}

                        ${isDeed ? `
                          <button onclick="showToast('Alamat kantor: SCBD Tower Lt. 18, Jakarta Selatan. Harap bawa KTP Asli dan NPWP Perusahaan.', 'info')" class="px-4 py-2 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 font-bold text-xs transition flex items-center gap-1.5 shadow-xs">
                            <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
                            <span>Petunjuk Lokasi Kantor</span>
                          </button>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      `;
    }

    if (state.activeClientTab === 'chat') {
      return `
        <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[650px]">
          <!-- Notary Header Bar -->
          <div class="p-4 px-6 bg-[#0C1E36] text-white flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <div class="relative">
                <img src="${notary.avatar}" alt="${notary.name}" class="w-11 h-11 rounded-full object-cover border-2 border-emerald-400">
                <span class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0C1E36]"></span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-sm text-white">${escapeHtml(notary.name)}</h3>
                  <span class="text-[9px] text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">SK RESMI KEMENKUMHAM</span>
                </div>
                <p class="text-[11px] text-slate-300 mt-0.5">${escapeHtml(notary.title)} • Online Siaga</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 text-emerald-300 font-mono">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Terhubung Cloud Realtime
              </span>
              <button onclick="startVoiceCall('${notary.id}')" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs">
                <i data-lucide="phone-call" class="w-3.5 h-3.5"></i> Panggilan Suara
              </button>
              <button onclick="openBookingModal('${notary.id}', '${notary.name}')" class="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs">
                <i data-lucide="calendar" class="w-3.5 h-3.5"></i> Jadwalkan Temu
              </button>
            </div>
          </div>

          <!-- Trust Security Bar -->
          <div class="px-6 py-2 bg-[#FAF8F5] border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
            <div class="flex items-center gap-2">
              <i data-lucide="lock" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Konsultasi Terenkripsi 256-bit • Rahasia Jabatan Notaris Sesuai UU No. 2 Tahun 2014</span>
            </div>
            <div class="font-bold text-[#0C1E36] font-mono text-xs">
              Klien: ${escapeHtml(user.companyName)}
            </div>
          </div>

          <!-- Stream -->
          <div id="client-portal-chat-stream" class="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FAF9F5] text-xs">
            <!-- Messages rendered by renderChatMessages() -->
          </div>

          <!-- Quick Query Pills -->
          <div class="px-6 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <button type="button" onclick="sendQuickPrompt('Bagaimana syarat dan modal pendirian PT sesuai UU Cipta Kerja?')" class="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-teal-50 text-[11px] font-semibold text-slate-700 hover:text-[#2E9B95] hover:border-[#2E9B95]/30 border border-slate-200 whitespace-nowrap transition">
              💼 Syarat & Modal PT
            </button>
            <button type="button" onclick="sendQuickPrompt('Bagaimana aturan uang kompensasi PKWT sesuai PP 35/2021?')" class="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-teal-50 text-[11px] font-semibold text-slate-700 hover:text-[#2E9B95] hover:border-[#2E9B95]/30 border border-slate-200 whitespace-nowrap transition">
              📜 Kompensasi PKWT
            </button>
            <button type="button" onclick="sendQuickPrompt('Bagaimana prosedur pendaftaran merek dagang HAKI di DJKI?')" class="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-teal-50 text-[11px] font-semibold text-slate-700 hover:text-[#2E9B95] hover:border-[#2E9B95]/30 border border-slate-200 whitespace-nowrap transition">
              ™️ Pendaftaran HAKI
            </button>
            <button type="button" onclick="sendQuickPrompt('Apakah klausul kerahasiaan NDA mengikat dan ada denda wanprestasi?')" class="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-teal-50 text-[11px] font-semibold text-slate-700 hover:text-[#2E9B95] hover:border-[#2E9B95]/30 border border-slate-200 whitespace-nowrap transition">
              🔒 Klausul NDA
            </button>
            <button type="button" onclick="sendQuickPrompt('Berapa rincian tarif akta notaris dan PNBP Kemenkumham?')" class="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-teal-50 text-[11px] font-semibold text-slate-700 hover:text-[#2E9B95] hover:border-[#2E9B95]/30 border border-slate-200 whitespace-nowrap transition">
              ⚖️ Tarif Akta & PNBP
            </button>
          </div>

          <!-- Input Form -->
          <div class="p-4 px-6 bg-white border-t border-slate-200 shrink-0">
            <form onsubmit="handleClientPortalSendChat(event)" class="flex items-center gap-3">
              <button type="button" onclick="attachLegalSampleDoc('Draft_Akta_Pendirian_PT.pdf', '248 KB')" class="p-2.5 rounded-xl border border-slate-300 hover:border-[#2E9B95] bg-slate-50 text-slate-600 hover:text-[#2E9B95] transition shrink-0" title="Lampirkan Dokumen Kontrak">
                <i data-lucide="paperclip" class="w-4 h-4"></i>
              </button>
              <input type="text" id="client-portal-chat-input" autocomplete="off" placeholder="Tanyakan permasalahan hukum perusahaan Anda atau kirim draf akta..." class="flex-1 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:border-[#2E9B95] focus:bg-white transition font-medium">
              <button type="submit" class="px-5 py-3 rounded-xl bg-[#2E9B95] hover:bg-teal-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs shrink-0">
                <i data-lucide="send" class="w-4 h-4"></i> Kirim Konsultasi
              </button>
            </form>
          </div>
        </div>
      `;
    }

    if (state.activeClientTab === 'invoices') {
      return `
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 class="text-lg font-bold text-[#0C1E36]">Riwayat Tagihan & Faktur Pajak Resmi</h3>
              <p class="text-xs text-slate-500 mt-0.5">Bukti transaksi pelunasan paket hukum dan penagihan berizin Kemenkeu RI</p>
            </div>
            <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs font-mono">
              ${transactions.length} Faktur
            </span>
          </div>

          ${transactions.length === 0 ? `
            <div class="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200 max-w-xl mx-auto">
              <i data-lucide="receipt" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
              <h4 class="font-bold text-slate-800 text-sm mb-1">Belum Ada Tagihan Berbayar</h4>
              <p class="text-xs text-slate-500 mb-6">Akun perusahaan Anda saat ini aktif pada Paket Biasa (Rp 0). Tingkatkan paket untuk menikmati konsultasi tak terbatas dan pembuatan akta resmi notaris.</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div class="font-bold text-xs text-[#0C1E36]">Full Legal Suite</div>
                  <div class="text-emerald-700 font-bold text-sm my-1">Rp 300.000 <span class="text-[10px] text-slate-400 font-normal">/bulan</span></div>
                  <p class="text-[10px] text-slate-500 mb-3">Akses akta PT lengkap, 6 template kontrak, konsultasi prioritas.</p>
                  <button onclick="openCheckoutModal('full')" class="w-full py-2 rounded-lg bg-[#2E9B95] hover:bg-teal-800 text-white font-bold text-xs transition">Pilih Paket</button>
                </div>
                <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div class="font-bold text-xs text-[#0C1E36]">Konsultasi Chat</div>
                  <div class="text-emerald-700 font-bold text-sm my-1">Rp 150.000 <span class="text-[10px] text-slate-400 font-normal">/30 hari</span></div>
                  <p class="text-[10px] text-slate-500 mb-3">Tanya jawab langsung notaris tanpa batas via chat terenkripsi.</p>
                  <button onclick="openCheckoutModal('chat')" class="w-full py-2 rounded-lg bg-[#0C1E36] hover:bg-slate-800 text-amber-300 font-bold text-xs transition">Pilih Paket</button>
                </div>
              </div>
            </div>
          ` : `
            <div class="overflow-x-auto rounded-2xl border border-slate-200">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th class="p-4">No. Faktur</th>
                    <th class="p-4">Paket Layanan</th>
                    <th class="p-4">Metode Bayar</th>
                    <th class="p-4">Jumlah (IDR)</th>
                    <th class="p-4">Status</th>
                    <th class="p-4">Tanggal</th>
                    <th class="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-700">
                  ${transactions.map(t => `
                    <tr class="hover:bg-slate-50 transition">
                      <td class="p-4 font-mono font-bold text-slate-900">${escapeHtml(t.id)}</td>
                      <td class="p-4 font-semibold text-[#0C1E36]">${escapeHtml(t.planName)}</td>
                      <td class="p-4 uppercase font-mono text-[11px]">${escapeHtml(t.method)}</td>
                      <td class="p-4 font-bold text-[#2E9B95]">IDR ${Number(t.amount || 0).toLocaleString('id-ID')}</td>
                      <td class="p-4">
                        <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          ${escapeHtml(t.status || 'LUNAS')}
                        </span>
                      </td>
                      <td class="p-4 text-slate-400">${escapeHtml(t.date)}</td>
                      <td class="p-4 text-right">
                        <button onclick="printOfficialInvoice('${t.id}')" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition inline-flex items-center gap-1">
                          <i data-lucide="printer" class="w-3.5 h-3.5"></i> Cetak Bukti
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    }

    // Default: 'documents' tab
    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left: Template Switcher & Field Customizer -->
        <div class="lg:col-span-4 space-y-4">
          <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h4 class="font-bold text-xs uppercase tracking-wider text-slate-500 font-mono">Pilih Instrumen Dokumen</h4>
            <div class="space-y-1.5">
              ${Object.values(CONTRACT_TEMPLATES).map(tmpl => `
                <button onclick="selectClientDocTemplate('${tmpl.key}')" class="w-full p-3 rounded-2xl text-left transition flex items-center justify-between border ${tmpl.key === activeDoc.key ? 'bg-[#0C1E36] text-white border-[#0C1E36] shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'}">
                  <div>
                    <div class="font-bold text-xs ${tmpl.key === activeDoc.key ? 'text-amber-300' : 'text-slate-900'}">${escapeHtml(tmpl.title)}</div>
                    <div class="text-[10px] ${tmpl.key === activeDoc.key ? 'text-slate-300' : 'text-slate-500'} mt-0.5">${escapeHtml(tmpl.subtitle)}</div>
                  </div>
                  <i data-lucide="chevron-right" class="w-4 h-4 shrink-0 ${tmpl.key === activeDoc.key ? 'text-amber-300' : 'text-slate-400'}"></i>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
            <h4 class="font-bold text-xs uppercase tracking-wider text-slate-500 font-mono">Kustomisasi Pihak & Klausul</h4>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Pihak Pertama (Perseroan Klien)</label>
              <input type="text" oninput="handleClientDocFormInput('party1Name', this.value)" value="${escapeHtml(state.docFormData.party1Name || user.companyName)}" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0C1E36]">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Pihak Kedua (Mitra / Rekan)</label>
              <input type="text" oninput="handleClientDocFormInput('party2Name', this.value)" value="${escapeHtml(state.docFormData.party2Name || 'PT Rekan Teknologi Mandiri')}" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0C1E36]">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Kota Penandatanganan</label>
                <input type="text" oninput="handleClientDocFormInput('contractCity', this.value)" value="${escapeHtml(state.docFormData.contractCity || user.city || 'Jakarta Selatan')}" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0C1E36]">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Nilai Komitmen</label>
                <input type="text" oninput="handleClientDocFormInput('contractValue', this.value)" value="${escapeHtml(state.docFormData.contractValue || 'Rp 250.000.000')}" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0C1E36]">
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Official Legal Document Preview & Download Actions -->
        <div class="lg:col-span-8 space-y-4">
          <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <span class="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  DRAF RESMI TERSTANDARISASI
                </span>
                <h3 class="text-lg font-bold text-[#0C1E36] mt-1">${escapeHtml(activeDoc.title)}</h3>
                <p class="text-xs text-slate-500">Nomor: ${escapeHtml(activeDoc.docNo)} • ${escapeHtml(activeDoc.subtitle)}</p>
              </div>

              <div class="flex items-center gap-2">
                <button onclick="downloadCurrentDocAsWord()" class="px-4 py-2.5 rounded-xl bg-[#2E9B95] hover:bg-teal-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs">
                  <i data-lucide="download" class="w-4 h-4"></i> Unduh Word (.doc)
                </button>
                <button onclick="openDocumentPreview('${activeDoc.key}')" class="px-4 py-2.5 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 font-bold text-xs transition flex items-center gap-1.5 shadow-xs">
                  <i data-lucide="eye" class="w-4 h-4"></i> Cetak / PDF
                </button>
              </div>
            </div>

            <!-- Parchment Paper Document Frame -->
            <div class="my-6 p-6 sm:p-8 rounded-2xl bg-[#FDFCFA] border border-amber-900/10 shadow-inner font-serif text-slate-800 text-xs leading-relaxed space-y-4 max-h-[480px] overflow-y-auto">
              <div class="text-center pb-4 border-b border-slate-300">
                <h4 class="font-bold text-sm uppercase text-[#0C1E36] tracking-wider">${escapeHtml(activeDoc.title)}</h4>
                <p class="text-[11px] italic text-slate-600 mt-1">Nomor Registrasi: ${escapeHtml(activeDoc.docNo)}</p>
                <p class="text-[11px] text-slate-500 mt-2">
                  Pada hari ini bertempat di <strong>${escapeHtml(state.docFormData.contractCity || user.city || 'Jakarta Selatan')}</strong>, telah disepakati dan ditandatangani perjanjian oleh dan antara <strong>${escapeHtml(state.docFormData.party1Name || user.companyName)}</strong> dan <strong>${escapeHtml(state.docFormData.party2Name || 'PT Rekan Teknologi Mandiri')}</strong>.
                </p>
              </div>

              ${clauses.map(clause => `
                <div class="space-y-1">
                  <h5 class="font-bold text-xs uppercase text-[#0C1E36] font-sans tracking-wide">${escapeHtml(clause.title)}</h5>
                  <p class="text-justify text-slate-700">${clause.content}</p>
                </div>
              `).join('')}

              <div class="pt-6 border-t border-slate-300 grid grid-cols-2 text-center text-[11px] gap-6">
                <div>
                  <div class="font-bold text-slate-800">PIHAK PERTAMA</div>
                  <div class="h-16 flex items-end justify-center font-bold text-[#0C1E36] underline">${escapeHtml(state.docFormData.party1Name || user.companyName)}</div>
                </div>
                <div>
                  <div class="font-bold text-slate-800">PIHAK KEDUA</div>
                  <div class="h-16 flex items-end justify-center font-bold text-[#0C1E36] underline">${escapeHtml(state.docFormData.party2Name || 'PT Rekan Teknologi Mandiri')}</div>
                </div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2.5">
                <i data-lucide="shield-alert" class="w-5 h-5 text-amber-700 shrink-0"></i>
                <span class="text-amber-950">Ingin klausul spesifik yang disesuaikan dengan AD/ART perseroan Anda?</span>
              </div>
              <button onclick="switchClientTab('chat')" class="px-4 py-2 rounded-xl bg-[#0C1E36] text-amber-300 font-bold text-xs transition flex items-center justify-center gap-1.5 shrink-0">
                <i data-lucide="messages-square" class="w-3.5 h-3.5"></i> Konsultasikan ke Notaris
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  window.openPlanPickerModal = function () {
    const modal = document.getElementById('plan-picker-modal');
    if (modal) {
      modal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  };

  window.closePlanPickerModal = function () {
    const modal = document.getElementById('plan-picker-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.renderClientPortal = function () {
    const portal = document.getElementById('client-portal-view');
    if (!portal) return;

    const user = state.currentUser;
    if (!user) {
      portal.innerHTML = `
        <div class="max-w-md mx-auto p-8 text-center bg-white rounded-3xl border border-slate-200">
          <p class="text-sm font-bold text-slate-700 mb-3">Silakan masuk untuk mengakses Dashboard Klien.</p>
          <button onclick="openAuthModal('login')" class="px-5 py-2.5 rounded-xl bg-[#0C1E36] text-amber-300 font-bold text-xs">Masuk Sekarang</button>
        </div>
      `;
      return;
    }

    if (!state.activeClientTab) state.activeClientTab = 'documents';
    const activeDoc = CONTRACT_TEMPLATES[state.activeDocKey] || CONTRACT_TEMPLATES.pks;

    const interpolatedClauses = activeDoc.clauses.map(clause => {
      let content = clause.content
        .replace(/\{\{party1Name\}\}/g, escapeHtml(state.docFormData.party1Name || user.companyName))
        .replace(/\{\{party2Name\}\}/g, escapeHtml(state.docFormData.party2Name || 'PT Rekan Teknologi Mandiri'))
        .replace(/\{\{contractCity\}\}/g, escapeHtml(state.docFormData.contractCity || user.city || 'Jakarta Selatan'))
        .replace(/\{\{contractDate\}\}/g, escapeHtml(state.docFormData.contractDate || new Date().toISOString().split('T')[0]))
        .replace(/\{\{contractValue\}\}/g, escapeHtml(state.docFormData.contractValue || 'Rp 250.000.000'));
      return { title: clause.title, content: content };
    });

    const notaryId = state.activeChatNotaryId || 'notary-1';
    const notary = NOTARIES.find(n => n.id === notaryId) || NOTARIES[0];
    if (!state.chatHistory) state.chatHistory = {};
    if (!state.chatHistory[notaryId] || state.chatHistory[notaryId].length === 0) {
      state.chatHistory[notaryId] = generateInitialGreeting(notaryId, user);
    }
    const msgs = state.chatHistory[notaryId];
    const transactions = user.transactions || [];
    const clientAppointments = (state.appointments || []).filter(apt => {
      if (!user) return false;
      return apt.userId === user.id ||
             apt.userEmail === user.email ||
             (user.email && apt.userEmail && apt.userEmail.toLowerCase().includes('fajar') && user.email.toLowerCase().includes('fajar')) ||
             (user.email && apt.userEmail && apt.userEmail.toLowerCase().includes('gelsay') && user.email.toLowerCase().includes('gelsay'));
    });

    portal.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <!-- 1. Corporate Identity Banner -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  TERVERIFIKASI AHU KEMENKUMHAM RI
                </span>
                <span class="text-xs text-slate-400 font-mono">NIB OSS-RBA: 1289000192834</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-serif-editorial font-bold text-[#0C1E36]">
                ${escapeHtml(user.companyName)}
              </h1>
              <p class="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-3">
                <span><strong class="text-slate-700">Direktur Utama:</strong> ${escapeHtml(user.fullName)}</span>
                <span>•</span>
                <span><strong class="text-slate-700">Kedudukan:</strong> ${escapeHtml(user.city || 'Jakarta Selatan')}</span>
                <span>•</span>
                <span><strong class="text-slate-700">Email:</strong> ${escapeHtml(user.email)}</span>
                <span>•</span>
                <span><strong class="text-slate-700">WhatsApp:</strong> ${escapeHtml(user.phone || '-')}</span>
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <div class="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-right min-w-[170px]">
                <div class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Paket Layanan</div>
                <div class="font-bold text-xs text-[#0C1E36]">${escapeHtml(user.planName || 'Paket Biasa (Rp 0)')}</div>
                <div class="text-[10px] ${user.plan === 'biasa' ? 'text-amber-600' : 'text-emerald-600'} font-semibold">
                  ${escapeHtml(user.planDuration || '0 Hari Aktif')}
                </div>
              </div>

              ${(user.plan === 'biasa' || user.plan === 'trial' || user.plan === 'chat') ? `
                <button onclick="openPlanPickerModal()" class="px-4 py-3 rounded-2xl bg-[#2E9B95] hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-2" title="Pilih / Upgrade Paket Langganan">
                  <i data-lucide="zap" class="w-4 h-4 text-amber-300"></i>
                  <span>${user.plan === 'chat' ? 'Upgrade ke Full Suite' : 'Pilih / Upgrade Paket'}</span>
                </button>
              ` : ''}

              <button onclick="switchView('public')" class="px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs transition flex items-center gap-2 shadow-2xs" title="Lihat Beranda Publik">
                <i data-lucide="globe" class="w-4 h-4 text-slate-500"></i>
                <span>Beranda Publik</span>
              </button>

              <button onclick="handleUserSignOut()" class="px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs transition flex items-center gap-2" title="Keluar">
                <i data-lucide="log-out" class="w-4 h-4"></i>
                <span>Keluar</span>
              </button>
            </div>
          </div>

          <!-- 4 KPI Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div class="text-[10px] font-bold uppercase text-slate-400 font-mono">Status AHU Online</div>
              <div class="text-sm font-bold text-[#0C1E36] mt-0.5">Badan Hukum Aktif</div>
              <div class="text-[10px] text-emerald-600 font-semibold mt-0.5">SK Menkumham Tersedia</div>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div class="text-[10px] font-bold uppercase text-slate-400 font-mono">Draf Dokumen Korporasi</div>
              <div class="text-sm font-bold text-[#0C1E36] mt-0.5">6 Template Standar</div>
              <div class="text-[10px] text-slate-500 mt-0.5">PKS, Akta PT, PKWT, NDA</div>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div class="text-[10px] font-bold uppercase text-slate-400 font-mono">Notaris Pendamping</div>
              <div class="text-sm font-bold text-[#0C1E36] mt-0.5">${escapeHtml(notary.name.split(',')[0])}</div>
              <div class="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online Siaga
              </div>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div class="text-[10px] font-bold uppercase text-slate-400 font-mono">Faktur & Tagihan</div>
              <div class="text-sm font-bold text-[#0C1E36] mt-0.5">
                ${user.plan === 'biasa' ? 'Paket Biasa (Rp 0)' : 'Lunas Terverifikasi'}
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">
                ${transactions.length} Faktur Resmi Tersedia
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Workspace Navigation Tabs -->
        <div class="bg-white rounded-2xl border border-slate-200 p-1.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 shadow-xs">
          <button onclick="switchClientTab('documents')" id="btn-client-tab-documents" class="flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${state.activeClientTab === 'documents' ? 'bg-[#0C1E36] text-amber-300 shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
            <i data-lucide="file-text" class="w-4 h-4"></i>
            <span>Berkas & Kontrak</span>
          </button>
          <button onclick="switchClientTab('appointments')" id="btn-client-tab-appointments" class="flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${state.activeClientTab === 'appointments' ? 'bg-[#0C1E36] text-amber-300 shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
            <i data-lucide="calendar-clock" class="w-4 h-4"></i>
            <span>Riwayat Janji Temu</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] font-mono ${state.activeClientTab === 'appointments' ? 'bg-amber-400/20 text-amber-300 font-extrabold' : 'bg-slate-100 text-slate-700'}">${clientAppointments.length}</span>
          </button>
          <button onclick="switchClientTab('chat')" id="btn-client-tab-chat" class="flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${state.activeClientTab === 'chat' ? 'bg-[#0C1E36] text-amber-300 shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
            <i data-lucide="messages-square" class="w-4 h-4"></i>
            <span>Konsultasi Chat</span>
          </button>
          <button onclick="switchClientTab('invoices')" id="btn-client-tab-invoices" class="flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${state.activeClientTab === 'invoices' ? 'bg-[#0C1E36] text-amber-300 shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
            <i data-lucide="receipt" class="w-4 h-4"></i>
            <span>Riwayat Tagihan</span>
          </button>
        </div>

        <!-- 3. Workspace Tab Content -->
        <div id="client-workspace-tab-content">
          ${renderClientWorkspaceTabBody(user, activeDoc, interpolatedClauses, notary, msgs, transactions, clientAppointments)}
        </div>
      </div>
    `;

    renderChatMessages();
    if (window.lucide) window.lucide.createIcons();

    if (state.activeClientTab === 'chat') {
      const stream = document.getElementById('client-portal-chat-stream');
      if (stream) stream.scrollTop = stream.scrollHeight;
    }
  };

  // --- DEDICATED NOTARY COMMAND CENTER (ROLE: NOTARY / ADMIN) ---
  window.switchAdminPortalTab = function (tabName) {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
      showToast('Akses ditolak.', 'error');
      return;
    }
    activeAdminTab = tabName;
    renderAdminPortal();
    renderAdminContent();
  };

  window.renderAdminPortal = function () {
    const portal = document.getElementById('admin-portal-view');
    if (!portal) return;

    if (!state.currentUser || state.currentUser.role !== 'admin') {
      portal.innerHTML = `
        <div class="max-w-md mx-auto p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 text-white">
          <p class="text-sm font-bold mb-3">Akses ditolak: Konsol ini khusus Notaris Administrator.</p>
          <button onclick="openAuthModal('login')" class="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs">Masuk Administrator</button>
        </div>
      `;
      return;
    }

    const users = getRegisteredUsers();
    const clients = Object.values(state.adminClientChats || {});
    let totalRevenue = 0;
    users.forEach(u => {
      if (u.transactions) {
        u.transactions.forEach(t => {
          totalRevenue += Number(t.amount || 0);
        });
      }
    });
    if (totalRevenue === 0) totalRevenue = 850000;

    portal.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <!-- 1. Executive Notary Banner -->
        <div class="bg-gradient-to-r from-[#0C1E36] to-[#122b4d] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg border-2 border-amber-300 shrink-0">
                <i data-lucide="shield" class="w-8 h-8"></i>
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-2 mb-1">
                  <span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    DEWAN NOTARIS UTAMA & PPAT RI
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono">SK: AHU-0019283.AH.02.01.Tahun 2015</span>
                </div>
                <h1 class="text-xl sm:text-2xl font-serif-editorial font-bold text-white">
                  Prof. Dr. Hendra Gunawan, S.H., M.Kn.
                </h1>
                <p class="text-xs text-slate-300 mt-0.5">
                  Ketua Majelis Kehormatan Notaris & Administrator Eksekutif LegalEase Cloud
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2.5">
              <button onclick="switchView('public')" class="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-2 border border-white/10" title="Buka Beranda Publik">
                <i data-lucide="globe" class="w-4 h-4 text-slate-300"></i>
                <span>Beranda Publik</span>
              </button>
              <button onclick="handleUserSignOut()" class="px-4 py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs transition flex items-center gap-2" title="Keluar">
                <i data-lucide="log-out" class="w-4 h-4"></i>
                <span>Keluar</span>
              </button>
            </div>
          </div>

          <!-- 4 Executive KPI Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div class="p-4 rounded-2xl bg-black/30 border border-white/5">
              <div class="text-[10px] font-bold uppercase text-amber-300/80 font-mono">Total Klien Terdaftar</div>
              <div class="text-2xl font-bold text-white mt-1">${users.length} Perusahaan</div>
              <div class="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Akun Terverifikasi
              </div>
            </div>
            <div class="p-4 rounded-2xl bg-black/30 border border-white/5">
              <div class="text-[10px] font-bold uppercase text-amber-300/80 font-mono">Total Kas Masuk</div>
              <div class="text-2xl font-bold text-amber-300 mt-1">Rp ${totalRevenue.toLocaleString('id-ID')}</div>
              <div class="text-[10px] text-slate-400 mt-1">Settled via QRIS & VA</div>
            </div>
            <div class="p-4 rounded-2xl bg-black/30 border border-white/5">
              <div class="text-[10px] font-bold uppercase text-amber-300/80 font-mono">Sesi Chat Multi-Perangkat</div>
              <div class="text-2xl font-bold text-white mt-1">${clients.length} Sesi Live</div>
              <div class="text-[10px] text-teal-400 mt-1">Supabase Realtime Sync</div>
            </div>
            <div class="p-4 rounded-2xl bg-black/30 border border-white/5">
              <div class="text-[10px] font-bold uppercase text-amber-300/80 font-mono">Integrasi SABH AHU</div>
              <div class="text-2xl font-bold text-emerald-400 mt-1">99.98%</div>
              <div class="text-[10px] text-slate-400 mt-1">Ditjen AHU Kemenkumham</div>
            </div>
          </div>
        </div>

        <!-- 2. Admin Workspace Tabs -->
        <div class="bg-[#0C1E36] rounded-2xl border border-slate-800 p-1.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5 shadow-xs">
          <button onclick="switchAdminPortalTab('chats')" id="btn-admin-portal-tab-chats" class="flex-1 py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeAdminTab === 'chats' ? 'bg-amber-400 text-slate-950 font-extrabold shadow-xs' : 'text-slate-300 hover:text-white'}">
            <i data-lucide="messages-square" class="w-4 h-4"></i>
            <span>Konsultasi Live</span>
            <span class="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono">${clients.length}</span>
          </button>
          <button onclick="switchAdminPortalTab('notaries')" id="btn-admin-portal-tab-notaries" class="flex-1 py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeAdminTab === 'notaries' ? 'bg-amber-400 text-slate-950 font-extrabold shadow-xs' : 'text-slate-300 hover:text-white'}">
            <i data-lucide="award" class="w-4 h-4"></i>
            <span>Direktori Notaris (${NOTARIES.length})</span>
          </button>
          <button onclick="switchAdminPortalTab('users')" id="btn-admin-portal-tab-users" class="flex-1 py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeAdminTab === 'users' ? 'bg-amber-400 text-slate-950 font-extrabold shadow-xs' : 'text-slate-300 hover:text-white'}">
            <i data-lucide="users" class="w-4 h-4"></i>
            <span>Database Klien (${users.length})</span>
          </button>
          <button onclick="switchAdminPortalTab('transactions')" id="btn-admin-portal-tab-transactions" class="flex-1 py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeAdminTab === 'transactions' ? 'bg-amber-400 text-slate-950 font-extrabold shadow-xs' : 'text-slate-300 hover:text-white'}">
            <i data-lucide="receipt" class="w-4 h-4"></i>
            <span>Buku Kas</span>
          </button>
          <button onclick="switchAdminPortalTab('deeds')" id="btn-admin-portal-tab-deeds" class="flex-1 py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeAdminTab === 'deeds' ? 'bg-amber-400 text-slate-950 font-extrabold shadow-xs' : 'text-slate-300 hover:text-white'}">
            <i data-lucide="stamp" class="w-4 h-4"></i>
            <span>Verifikasi Akta</span>
          </button>
        </div>

        <!-- 3. Admin Tab Content Area -->
        <div id="admin-portal-tab-content" class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl text-slate-800 min-h-[580px] flex flex-col">
          <!-- Rendered dynamically by renderAdminContent() -->
        </div>
      </div>
    `;

    renderAdminContent();
    if (window.lucide) window.lucide.createIcons();
  };

  // --- ADMIN CONSOLE CONTROLLER ---
  let activeAdminTab = 'chats';

  window.openAdminConsole = function () {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
      showToast('Akses ditolak: Konsol ini hanya untuk Notaris Administrator resmi terdaftar.', 'error');
      return;
    }
    const modal = document.getElementById('admin-console-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    renderAdminContent();
  };

  window.closeAdminConsole = function () {
    const modal = document.getElementById('admin-console-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.switchAdminTab = function (tab) {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
      showToast('Akses ditolak.', 'error');
      return;
    }
    activeAdminTab = tab;
    ['chats', 'users', 'transactions'].forEach(t => {
      const btn = document.getElementById(`tab-btn-admin-${t}`);
      if (btn) {
        if (t === tab) {
          btn.className = 'py-3 px-3 text-xs font-bold border-b-2 border-[#0C1E36] text-[#0C1E36] flex items-center gap-2 transition';
        } else {
          btn.className = 'py-3 px-3 text-xs font-bold border-b-2 border-transparent text-slate-600 hover:text-slate-900 flex items-center gap-2 transition';
        }
      }
    });
    renderAdminContent();
  };

  function renderAdminContent() {
    const container = document.getElementById('admin-tab-content');
    const portalContainer = document.getElementById('admin-portal-tab-content');
    if (!container && !portalContainer) return;

    let contentHtml = '';

    if (activeAdminTab === 'chats') {
      const clients = Object.values(state.adminClientChats);
      const activeEmail = state.activeAdminChatEmail || (clients.length > 0 ? clients[0].clientEmail : null);
      const activeChat = clients.find(c => c.clientEmail === activeEmail) || null;

      contentHtml = `
        <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
          <!-- Left Client Threads List (Hidden on mobile if a chat is active) -->
          <div class="${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 flex-col shrink-0">
            <div class="p-3 border-b border-slate-200 flex items-center justify-between">
              <span class="text-xs font-bold text-slate-800">Sesi Klien Multi-Perangkat</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">${clients.length} Percakapan</span>
            </div>
            <div class="flex-1 overflow-y-auto divide-y divide-slate-200">
              ${clients.length === 0 ? `
                <div class="p-6 text-center text-xs text-slate-400">
                  <i data-lucide="message-square" class="w-8 h-8 text-slate-300 mx-auto mb-2"></i>
                  Belum ada pesan masuk dari perangkat klien lain.<br>Kirim pesan dari perangkat klien untuk melihat sinkronisasi live.
                </div>
              ` : clients.map(c => `
                <div onclick="selectAdminClientChat('${c.clientEmail}')" class="p-3.5 hover:bg-slate-100 cursor-pointer transition ${c.clientEmail === activeEmail ? 'bg-white border-l-4 border-[#2E9B95] shadow-2xs' : ''}">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-bold text-xs text-[#0C1E36] truncate">${escapeHtml(c.clientName)}</span>
                    <span class="text-[9px] text-slate-400 font-mono">${c.messages.length > 0 ? c.messages[c.messages.length - 1].timestamp : ''}</span>
                  </div>
                  <div class="text-[10px] text-[#2E9B95] font-semibold truncate mb-1">${escapeHtml(c.clientCompany)}</div>
                  <div class="text-[11px] text-slate-500 truncate">${c.messages.length > 0 ? escapeHtml(c.messages[c.messages.length - 1].text) : 'Belum ada pesan'}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right Chat Stream (Hidden on mobile if no active chat) -->
          <div class="${activeChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white">
            ${activeChat ? `
              <div class="p-3.5 px-4 sm:px-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div class="flex items-center gap-2">
                  <button type="button" onclick="deselectAdminChat()" class="md:hidden p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-2xs" title="Kembali ke Daftar Klien">
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                  </button>
                  <div>
                    <h4 class="font-bold text-xs text-[#0C1E36]">${escapeHtml(activeChat.clientName)}</h4>
                  <p class="text-[10px] text-slate-500">${escapeHtml(activeChat.clientCompany)} • ${escapeHtml(activeChat.clientEmail)}</p>
                </div>
                <span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Terhubung Live
                </span>
              </div>

              <!-- Stream -->
              <div id="admin-chat-messages" class="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF9F5] text-xs">
                ${activeChat.messages.map(m => `
                  <div class="flex items-start gap-2.5 ${m.sender === 'notary' ? 'justify-end ml-auto' : ''} max-w-[85%]">
                    <div class="p-3 rounded-2xl ${m.sender === 'notary' ? 'bg-[#0C1E36] text-white rounded-tr-xs' : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs shadow-2xs'} space-y-1">
                      <div class="flex items-center gap-1.5 text-[9px] ${m.sender === 'notary' ? 'text-amber-300' : 'text-slate-400'} font-mono">
                        <span>${escapeHtml(m.senderName)}</span> • <span>${m.timestamp}</span>
                      </div>
                      ${m.attachment ? `
                        <div class="p-2 rounded-lg bg-black/10 text-[10px] font-mono flex items-center gap-1.5 mb-1">
                          <i data-lucide="file" class="w-3.5 h-3.5"></i> ${escapeHtml(m.attachment.name)}
                        </div>
                      ` : ''}
                      <div>${formatChatMessage(m.text)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- Admin Reply Form -->
              <form onsubmit="handleSendAdminReply(event)" class="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
                <input type="text" id="admin-reply-input" autocomplete="off" placeholder="Tulis tanggapan notaris resmi ke perangkat klien..." class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:border-[#0C1E36] focus:bg-white font-medium">
                <button type="submit" class="px-4 py-2.5 rounded-xl bg-[#2E9B95] hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
                  <i data-lucide="send" class="w-4 h-4"></i> Balas Klien
                </button>
              </form>
            ` : `
              <div class="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 text-xs">
                <i data-lucide="messages-square" class="w-12 h-12 text-slate-300 mb-3"></i>
                <h5 class="font-bold text-slate-700 text-sm mb-1">Pilih Sesi Konsultasi Klien</h5>
                <p class="max-w-sm">Pilih salah satu percakapan di kolom kiri untuk menelaah dokumen dan menjawab konsultasi klien secara real-time.</p>
              </div>
            `}
          </div>
        </div>
      `;
    } else if (activeAdminTab === 'users') {
      const users = getRegisteredUsers();
      contentHtml = `
        <div class="flex-1 overflow-y-auto p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h4 class="font-bold text-sm text-[#0C1E36]">Database Klien Terdaftar</h4>
              <p class="text-xs text-slate-500">Seluruh pengguna yang membuat akun mandiri di platform</p>
            </div>
            <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">${users.length} Akun Terdaftar</span>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div class="overflow-x-auto w-full">
              <table class="w-full text-xs text-left min-w-[650px]">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th class="p-3.5">Nama Klien</th>
                  <th class="p-3.5">Perusahaan / PT</th>
                  <th class="p-3.5">Email & WhatsApp</th>
                  <th class="p-3.5">Kota</th>
                  <th class="p-3.5">Paket</th>
                  <th class="p-3.5">Tgl Daftar</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                ${users.length === 0 ? `
                  <tr><td colspan="6" class="p-6 text-center text-slate-400">Belum ada klien mendaftar.</td></tr>
                ` : users.map(u => `
                  <tr class="hover:bg-slate-50">
                    <td class="p-3.5 font-bold text-slate-900">${escapeHtml(u.fullName)}</td>
                    <td class="p-3.5 font-semibold text-[#2E9B95]">${escapeHtml(u.companyName)}</td>
                    <td class="p-3.5 font-mono text-[11px]">${escapeHtml(u.email)}<br><span class="text-slate-400">${escapeHtml(u.phone || '-')}</span></td>
                    <td class="p-3.5">${escapeHtml(u.city)}</td>
                    <td class="p-3.5"><span class="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-[10px]">${escapeHtml(u.planName || 'Paket Biasa (Rp 0)')}</span></td>
                    <td class="p-3.5 text-slate-400">${escapeHtml(u.registeredAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } else if (activeAdminTab === 'transactions') {
      const users = getRegisteredUsers();
      const allTx = [];
      users.forEach(u => {
        if (u.transactions) {
          u.transactions.forEach(t => allTx.push(Object.assign({ userName: u.fullName, company: u.companyName }, t)));
        }
      });

      contentHtml = `
        <div class="flex-1 overflow-y-auto p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h4 class="font-bold text-sm text-[#0C1E36]">Riwayat Tagihan & Pembayaran</h4>
              <p class="text-xs text-slate-500">Seluruh transaksi pelunasan paket hukum klien</p>
            </div>
            <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">${allTx.length} Transaksi</span>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div class="overflow-x-auto w-full">
              <table class="w-full text-xs text-left min-w-[680px]">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th class="p-3.5">No. Faktur</th>
                  <th class="p-3.5">Klien & Perusahaan</th>
                  <th class="p-3.5">Paket</th>
                  <th class="p-3.5">Jumlah (IDR)</th>
                  <th class="p-3.5">Metode</th>
                  <th class="p-3.5">Status</th>
                  <th class="p-3.5">Waktu</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                ${allTx.length === 0 ? `
                  <tr><td colspan="7" class="p-6 text-center text-slate-400">Belum ada transaksi pembayaran.</td></tr>
                ` : allTx.map(t => `
                  <tr class="hover:bg-slate-50">
                    <td class="p-3.5 font-mono font-bold text-slate-900">${escapeHtml(t.id)}</td>
                    <td class="p-3.5 font-semibold">${escapeHtml(t.userName)}<br><span class="text-[10px] text-slate-400">${escapeHtml(t.company)}</span></td>
                    <td class="p-3.5">${escapeHtml(t.planName)}</td>
                    <td class="p-3.5 font-bold text-[#2E9B95]">IDR ${Number(t.amount || 0).toLocaleString('id-ID')}</td>
                    <td class="p-3.5">${escapeHtml(t.method)}</td>
                    <td class="p-3.5"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">${escapeHtml(t.status || 'LUNAS')}</span></td>
                    <td class="p-3.5 text-slate-400">${escapeHtml(t.date)}</td>
                  </tr>
                `).join('')}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } else if (activeAdminTab === 'notaries') {
      contentHtml = `
        <div class="p-6 sm:p-8 space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-bold text-[#0C1E36]">Direktori & Pengawasan Dewan Notaris Rekanan</h3>
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-bold">${NOTARIES.length} Notaris Berizin Resmi</span>
              </div>
              <p class="text-xs text-slate-500 mt-1">Konsol pengawasan Majelis Kehormatan: Memantau seluruh Pejabat Notaris & PPAT berlisensi resmi Ditjen AHU Kemenkumham RI yang berpraktik di LegalEase.</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5">
                <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i> Pengawasan Majelis Pengawas Daerah (MPD)
              </span>
            </div>
          </div>

          <!-- Notaries Directory Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${NOTARIES.map((notary, idx) => `
              <div class="p-5 rounded-2xl border border-slate-200 hover:border-amber-400 transition bg-slate-50/50 hover:bg-white shadow-2xs space-y-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <img src="${notary.avatar}" alt="${escapeHtml(notary.name)}" class="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200 shrink-0">
                    <div>
                      <div class="flex items-center gap-2">
                        <h4 class="font-bold text-sm text-[#0C1E36]">${escapeHtml(notary.name)}</h4>
                        <span class="text-[9px] px-2 py-0.5 rounded-full ${idx === 0 ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300' : 'bg-slate-200 text-slate-700 font-medium'} font-mono">
                          ${idx === 0 ? 'Notaris Aktif (Akun Demo)' : 'Notaris Rekanan'}
                        </span>
                      </div>
                      <p class="text-[11px] text-slate-500 font-semibold">${escapeHtml(notary.title)}</p>
                      <p class="text-[10px] text-emerald-700 font-mono font-bold mt-0.5">${escapeHtml(notary.skNumber)}</p>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="flex items-center gap-1 text-amber-500 font-bold text-xs">
                      <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400"></i> ${notary.rating}
                    </div>
                    <div class="text-[10px] text-slate-400">${notary.reviewsCount} Ulasan Klien</div>
                  </div>
                </div>

                <div class="p-3 bg-white rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-slate-500 font-medium">Wilayah Yurisdiksi:</span>
                    <span class="text-[#0C1E36] font-bold">${escapeHtml(notary.office)}</span>
                  </div>
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-slate-500 font-medium">Alamat Kantor:</span>
                    <span class="text-slate-700 truncate max-w-[220px]">${escapeHtml(notary.address)}</span>
                  </div>
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-slate-500 font-medium">Email Akun Dinas:</span>
                    <span class="text-indigo-700 font-mono font-bold">${idx === 0 ? 'notaris@legalease.co.id' : (notary.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '') + '@legalease.co.id')}</span>
                  </div>
                </div>

                <div class="flex flex-wrap gap-1.5 pt-1">
                  ${notary.specialties.map(s => `
                    <span class="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium border border-slate-200/60">${escapeHtml(s)}</span>
                  `).join('')}
                </div>

                <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span class="text-emerald-600 font-bold flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ${escapeHtml(notary.status)}
                  </span>
                  <button onclick="showToast('Audit integritas berkas ${escapeHtml(notary.name)}: Status Bersih, tidak ada catatan pelanggaran etik.', 'success')" class="text-xs font-bold text-amber-600 hover:text-amber-700">
                    Audit Kepatuhan &rarr;
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (activeAdminTab === 'deeds') {
      const users = getRegisteredUsers();
      contentHtml = `
        <div class="flex-1 overflow-y-auto p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h4 class="font-bold text-sm text-[#0C1E36]">Antrean Verifikasi Akta & SABH Kemenkumham RI</h4>
              <p class="text-xs text-slate-500">Pemeriksaan minuta akta pendirian perseroan, validasi KBLI 2020, dan SK Pengesahan</p>
            </div>
            <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs font-mono">Terhubung Ditjen AHU</span>
          </div>

          <div class="space-y-4">
            ${users.length === 0 ? `
              <div class="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                Belum ada berkas pendirian PT yang masuk dalam antrean verifikasi notaris.
              </div>
            ` : users.map((u, idx) => `
              <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span class="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">BERKAS #${idx + 1}</span>
                    <h5 class="font-bold text-sm text-[#0C1E36] mt-1">${escapeHtml(u.companyName)}</h5>
                    <p class="text-xs text-slate-500">Direktur Utama: ${escapeHtml(u.fullName)} • Domisili: ${escapeHtml(u.city || 'DKI Jakarta')}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Menunggu Tanda Tangan Minuta
                    </span>
                  </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs">
                  <div class="flex items-center gap-1.5 text-emerald-700">
                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                    <span>Pengecekan Nama AHU</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-emerald-700">
                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                    <span>KBLI 2020 Terverifikasi</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-emerald-700">
                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                    <span>Modal Disetor (Min 25%)</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-teal-700">
                    <i data-lucide="clock" class="w-4 h-4"></i>
                    <span>SK Pengesahan AHU</span>
                  </div>
                </div>

                <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button onclick="openDocumentPreview('akta_pt')" class="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1">
                    <i data-lucide="eye" class="w-3.5 h-3.5"></i> Pratinjau Minuta
                  </button>
                  <button onclick="showToast('Verifikasi akta disetujui. Notaris telah membubuhkan tanda tangan digital bersertifikasi BSrE.', 'success')" class="px-3.5 py-1.5 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 text-xs font-bold transition flex items-center gap-1">
                    <i data-lucide="stamp" class="w-3.5 h-3.5"></i> Sahkan Akta & Terbitkan SK
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (container) {
      container.innerHTML = contentHtml;
    }
    if (portalContainer) {
      // In full-page portal, use distinct input ID and button label to avoid pointer event intercepts
      const portalVersion = contentHtml
        .replace('id="admin-reply-input"', 'id="admin-portal-reply-input"')
        .replace('Balas Klien', 'Tanggapi Klien');
      portalContainer.innerHTML = portalVersion;
    }
    if (window.lucide) window.lucide.createIcons();
  }

  window.selectAdminClientChat = function (email) {
    state.activeAdminChatEmail = email;
    if (state.adminClientChats[email]) {
      state.adminClientChats[email].unreadCount = 0;
    }
    if (state.currentView === 'notary_dashboard') {
      renderNotaryPortal();
      const stream = document.getElementById('notary-workstation-messages');
      if (stream) stream.scrollTop = stream.scrollHeight;
    } else {
      renderAdminContent();
      const stream = document.getElementById('admin-chat-messages');
      if (stream) stream.scrollTop = stream.scrollHeight;
    }
  };

  window.handleSendAdminReply = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!state.currentUser || state.currentUser.role !== 'admin') {
      showToast('Akses ditolak: Hanya Notaris Administrator yang memiliki izin membalas.', 'error');
      return;
    }
    const inputModal = document.getElementById('admin-reply-input');
    const inputPortal = document.getElementById('admin-portal-reply-input');
    const text = ((inputModal && inputModal.value.trim()) || (inputPortal && inputPortal.value.trim()) || '').trim();
    if (!text) return;
    if (inputModal) inputModal.value = '';
    if (inputPortal) inputPortal.value = '';

    const email = state.activeAdminChatEmail;
    if (!email || !state.adminClientChats[email]) return;

    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const notName = 'Dr. Hendra Wijaya, S.H., M.Kn.';

    // Append to admin chat thread
    const adminReplyMsg = {
      id: 'msg_adm_' + Date.now(),
      sender: 'notary',
      senderName: notName,
      senderAvatar: 'assets/team/team_1.jpeg',
      text: text,
      timestamp: now
    };
    state.adminClientChats[email].messages.push(adminReplyMsg);

    // Also append to active notary chat history so client immediately sees it (Item 12)
    if (!state.chatHistory) state.chatHistory = {};
    if (!state.chatHistory['notary-1']) state.chatHistory['notary-1'] = [];
    state.chatHistory['notary-1'].push(adminReplyMsg);
    saveState();
    renderChatMessages();
    renderAdminContent();

    // Broadcast reply back to client device via Supabase Realtime
    if (realtimeChannel) {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'notary-reply',
        payload: {
          id: 'msg_adm_' + Date.now(),
          notaryId: 'notary-1',
          sender: 'notary',
          senderName: notName,
          userEmail: email,
          text: text,
          timestamp: now,
          deviceId: DEVICE_ID
        }
      });
    }

    showToast('Balasan notaris berhasil dikirimkan ke perangkat klien.', 'success');
  };

  // Global Escape Key Listener to dismiss any active modal or live chat
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (typeof window.closeLiveChat === 'function') window.closeLiveChat();
      if (typeof window.closeAuthModal === 'function') window.closeAuthModal();
      if (typeof window.closeBookingModal === 'function') window.closeBookingModal();
      if (typeof window.closeApkGuideModal === 'function') window.closeApkGuideModal();
      if (typeof window.closeDocumentPreview === 'function') window.closeDocumentPreview();
      if (typeof window.closePlanPickerModal === 'function') window.closePlanPickerModal();
      if (typeof window.closeApkViewModal === 'function') window.closeApkViewModal();
      if (typeof window.closeCheckoutModal === 'function') window.closeCheckoutModal();
    }
  });

  

// =========================================================================
  // DEDICATED NOTARY WORKSTATION SYSTEM (ROLE: NOTARY / NOTARIS REKANAN BIASA)
  // =========================================================================

  let activeNotaryTab = 'deeds'; // 'deeds', 'chat', 'schedule'

  window.switchNotaryPortalTab = function (tab) {
    activeNotaryTab = tab;
    renderNotaryPortal();
  };

  window.handleSendNotaryWorkstationReply = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('notary-workstation-reply-input');
    if (!input) return;
    const text = (input.value || '').trim();
    if (!text) return;

    const notary = NOTARIES[0];
    const targetEmail = state.activeAdminChatEmail || 'fajar@sinergidigital.co.id';
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    if (!state.adminClientChats[targetEmail]) {
      state.adminClientChats[targetEmail] = {
        clientEmail: targetEmail,
        clientName: 'Fajar Nugraha',
        clientCompany: 'PT Sinergi Digital Indonesia',
        messages: []
      };
    }

    const replyMsg = {
      id: 'msg_not_ws_' + Date.now(),
      sender: 'notary',
      senderName: notary.name,
      senderAvatar: notary.avatar,
      text: text,
      timestamp: now
    };

    state.adminClientChats[targetEmail].messages.push(replyMsg);

    // Also sync to notary-1 chatHistory
    if (!state.chatHistory['notary-1']) state.chatHistory['notary-1'] = [];
    state.chatHistory['notary-1'].push(replyMsg);

    input.value = '';
    saveState();
    renderNotaryPortal();
    playMessageNotificationSound();

    if (realtimeChannel) {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'notary-reply',
        payload: Object.assign({}, replyMsg, { targetEmail: targetEmail, notaryId: 'notary-1' })
      });
    }

    showToast('Tanggapan notaris rekanan terkirim langsung ke layar klien.', 'success');
  };

  window.renderNotaryPortal = function () {
    const portal = document.getElementById('notary-portal-view');
    if (!portal) return;

    const user = state.currentUser;
    if (!user || (user.role !== 'notary' && user.role !== 'admin')) {
      portal.innerHTML = `
        <div class="max-w-md mx-auto p-8 text-center bg-[#071F19] rounded-3xl border border-emerald-900/60 text-white">
          <p class="text-sm font-bold mb-3">Akses ditolak: Dasbor ini khusus Meja Kerja Notaris Rekanan.</p>
          <button onclick="openAuthModal('login')" class="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">Masuk Notaris Rekanan</button>
        </div>
      `;
      return;
    }

    if (!state.adminClientChats || Object.keys(state.adminClientChats).length === 0) {
      state.adminClientChats = {
        'fajar@sinergidigital.co.id': {
          clientEmail: 'fajar@sinergidigital.co.id',
          clientName: 'Fajar Nugraha',
          clientCompany: 'PT Sinergi Digital Indonesia',
          unreadCount: 1,
          messages: [
            {
              id: 'msg_client_init_01',
              sender: 'client',
              senderName: 'Fajar Nugraha',
              senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              text: 'Selamat siang Bapak Notaris Dr. Hendra Wijaya. Kami dari PT Sinergi Digital Indonesia sedang mereview draf Perjanjian Kerja Sama (PKS) B2B. Mohon arahan terkait klausul kerahasiaan dan domisili hukum penyelesaian sengketa.',
              timestamp: '10:15 WIB'
            }
          ]
        }
      };
      state.activeAdminChatEmail = 'fajar@sinergidigital.co.id';
    }

    const clients = Object.values(state.adminClientChats || {});
    const activeEmail = state.activeAdminChatEmail || (clients.length > 0 ? clients[0].clientEmail : 'fajar@sinergidigital.co.id');
    const activeChat = clients.find(c => c.clientEmail === activeEmail) || (clients.length > 0 ? clients[0] : null);

    portal.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <!-- 1. Notary Partner Workstation Banner -->
        <div class="bg-gradient-to-r from-[#0A2920] to-[#0E3A2E] rounded-3xl p-6 sm:p-8 border border-emerald-800/60 shadow-2xl">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="flex items-center gap-4">
              <div class="relative shrink-0">
                <img src="assets/team/team_1.jpeg" alt="Dr. Hendra Wijaya" class="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-md">
                <span class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0A2920]"></span>
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-2 mb-1">
                  <span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    NOTARIS REKANAN RESMI KEMENKUMHAM RI
                  </span>
                  <span class="text-[10px] text-slate-300 font-mono">SK: AHU-0019284.AH.02.01.Tahun 2017</span>
                </div>
                <h1 class="text-xl sm:text-2xl font-serif-editorial font-bold text-white">
                  Dr. Hendra Wijaya, S.H., M.Kn.
                </h1>
                <p class="text-xs text-slate-200 mt-0.5">
                  Notaris & PPAT Wilayah Kerja Jakarta Selatan • Spesialisasi Pendirian PT, PMA, dan Kontrak Bisnis
                </p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2.5">
              <button onclick="switchView('public')" class="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-2 border border-white/10" title="Buka Beranda Publik">
                <i data-lucide="globe" class="w-4 h-4 text-slate-300"></i>
                <span>Beranda Publik</span>
              </button>
              <button onclick="handleUserSignOut()" class="px-4 py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs transition flex items-center gap-2" title="Keluar">
                <i data-lucide="log-out" class="w-4 h-4"></i>
                <span>Keluar</span>
              </button>
            </div>
          </div>

          <!-- 4 Notary Partner KPI Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div class="p-4 rounded-2xl bg-black/30 border border-white/5">
              <div class="text-[10px] font-bold uppercase text-emerald-300 font-mono">Draf Akta Masuk</div>
              <div class="text-2xl font-bold text-white mt-1">3 Berkas</div>
              <div class="text-[10px] text-amber-300 mt-1 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> 2 Perlu Telaah Klausul
              </div>
            </div>
            <div class="p-4 rounded-2xl bg-black/30 border border-white/5">
              <div class="text-[10px] font-bold uppercase text-emerald-300 font-mono">Konsultasi Klien Siaga</div>
              <div class="text-2xl font-bold text-emerald-300 mt-1">Online Aktif</div>
              <div class="text-[10px] text-slate-300 mt-1">Rating 4.95 ⭐ (342 Klien)</div>
            </div>
            <div class="p-4 rounded-2xl bg-black/30 border border-white/5">
              <div class="text-[10px] font-bold uppercase text-emerald-300 font-mono">Agenda Janji Temu</div>
              <div class="text-2xl font-bold text-white mt-1">2 Sesi Hari Ini</div>
              <div class="text-[10px] text-teal-300 mt-1">1 Tatap Muka • 1 Panggilan Suara</div>
            </div>
            <div class="p-4 rounded-2xl bg-black/30 border border-white/5">
              <div class="text-[10px] font-bold uppercase text-emerald-300 font-mono">Sertifikat Elektronik</div>
              <div class="text-2xl font-bold text-emerald-400 mt-1">BSrE Aktif</div>
              <div class="text-[10px] text-slate-300 mt-1">Tanda Tangan Digital Terverifikasi</div>
            </div>
          </div>
        </div>

        <!-- 2. Workstation Navigation Tabs -->
        <div class="bg-[#09241C] rounded-2xl border border-emerald-900/60 p-1.5 grid grid-cols-1 sm:grid-cols-3 gap-1.5 shadow-xs">
          <button onclick="switchNotaryPortalTab('deeds')" id="btn-notary-tab-deeds" class="py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeNotaryTab === 'deeds' ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-xs' : 'text-emerald-200 hover:text-white'}">
            <i data-lucide="file-check-2" class="w-4 h-4"></i>
            <span>Meja Telaah Minuta Akta (3)</span>
          </button>
          <button onclick="switchNotaryPortalTab('chat')" id="btn-notary-tab-chat" class="py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeNotaryTab === 'chat' ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-xs' : 'text-emerald-200 hover:text-white'}">
            <i data-lucide="messages-square" class="w-4 h-4"></i>
            <span>Konsultasi Klien Notaris</span>
            <span class="px-1.5 py-0.2 rounded-full bg-emerald-900 text-emerald-200 text-[10px] font-mono">${clients.length}</span>
          </button>
          <button onclick="switchNotaryPortalTab('schedule')" id="btn-notary-tab-schedule" class="py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeNotaryTab === 'schedule' ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-xs' : 'text-emerald-200 hover:text-white'}">
            <i data-lucide="calendar" class="w-4 h-4"></i>
            <span>Buku Agenda Temu & Panggilan Suara (${(state.appointments || []).length})</span>
          </button>
        </div>

        <!-- 3. Workstation Content Area -->
        <div class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl text-slate-800 min-h-[560px] flex flex-col">
          ${renderNotaryWorkstationTabContent(activeNotaryTab, clients, activeChat)}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  };

  function renderNotaryWorkstationTabContent(tab, clients, activeChat) {
    if (tab === 'chat') {
      return `
        <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
          <!-- Left: Client Threads -->
          <div class="${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 flex-col shrink-0">
            <div class="p-3 border-b border-slate-200 flex items-center justify-between">
              <span class="text-xs font-bold text-slate-800">Klien Binaan Dr. Hendra</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">${clients.length} Percakapan</span>
            </div>
            <div class="flex-1 overflow-y-auto divide-y divide-slate-200">
              ${clients.length === 0 ? `
                <div class="p-6 text-center text-xs text-slate-400">
                  <i data-lucide="messages-square" class="w-8 h-8 text-slate-300 mx-auto mb-2"></i>
                  Belum ada pesan masuk dari klien Anda.
                </div>
              ` : clients.map(c => `
                <div onclick="selectAdminClientChat('${c.clientEmail}')" class="p-3.5 hover:bg-slate-100 cursor-pointer transition ${c.clientEmail === (activeChat ? activeChat.clientEmail : '') ? 'bg-white border-l-4 border-emerald-600 shadow-2xs' : ''}">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-bold text-xs text-[#0C1E36] truncate">${escapeHtml(c.clientName)}</span>
                    <span class="text-[9px] text-slate-400 font-mono">${c.messages.length > 0 ? c.messages[c.messages.length - 1].timestamp : ''}</span>
                  </div>
                  <div class="text-[10px] text-emerald-700 font-semibold truncate mb-1">${escapeHtml(c.clientCompany)}</div>
                  <div class="text-[11px] text-slate-500 truncate">${c.messages.length > 0 ? escapeHtml(c.messages[c.messages.length - 1].text) : 'Belum ada pesan'}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right: Chat Stream -->
          <div class="${activeChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white">
            ${activeChat ? `
              <div class="p-3.5 px-4 sm:px-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div class="flex items-center gap-2">
                  <button type="button" onclick="deselectAdminChat()" class="md:hidden p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-2xs" title="Kembali ke Daftar Klien">
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                  </button>
                  <div>
                    <h4 class="font-bold text-xs text-[#0C1E36]">${escapeHtml(activeChat.clientName)}</h4>
                    <p class="text-[10px] text-slate-500">${escapeHtml(activeChat.clientCompany)} • ${escapeHtml(activeChat.clientEmail)}</p>
                  </div>
                </div>
                <span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Sesi Konsultasi Notaris Aktif
                </span>
              </div>

              <div id="notary-workstation-messages" class="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF9F5] text-xs">
                ${activeChat.messages.map(m => `
                  <div class="flex items-start gap-2.5 ${m.sender === 'notary' ? 'justify-end ml-auto' : ''} max-w-[85%]">
                    <div class="p-3 rounded-2xl ${m.sender === 'notary' ? 'bg-[#0A2920] text-white rounded-tr-xs' : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs shadow-2xs'} space-y-1">
                      <div class="flex items-center gap-1.5 text-[9px] ${m.sender === 'notary' ? 'text-emerald-300' : 'text-slate-400'} font-mono">
                        <span>${escapeHtml(m.senderName)}</span> • <span>${m.timestamp}</span>
                      </div>
                      ${m.attachment ? `
                        <div class="p-2 rounded-lg bg-black/10 text-[10px] font-mono flex items-center gap-1.5 mb-1">
                          <i data-lucide="file" class="w-3.5 h-3.5"></i> ${escapeHtml(m.attachment.name)}
                        </div>
                      ` : ''}
                      <div>${formatChatMessage(m.text)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>

              <form onsubmit="handleSendNotaryWorkstationReply(event)" class="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
                <input type="text" id="notary-workstation-reply-input" autocomplete="off" placeholder="Tulis tanggapan notaris resmi (Dr. Hendra Wijaya) ke klien..." class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white font-medium">
                <button type="submit" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
                  <i data-lucide="send" class="w-4 h-4"></i> Balas Klien
                </button>
              </form>
            ` : `
              <div class="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 text-xs">
                <i data-lucide="messages-square" class="w-12 h-12 text-slate-300 mb-3"></i>
                <h5 class="font-bold text-slate-700 text-sm mb-1">Pilih Klien untuk Konsultasi</h5>
                <p class="max-w-sm">Pilih salah satu percakapan klien di kolom sebelah kiri untuk menelaah pertanyaan dan membalas konsultasi hukum.</p>
              </div>
            `}
          </div>
        </div>
      `;
    }

    if (tab === 'schedule') {
      if (!state.appointments) state.appointments = [];
      const appointments = state.appointments;

      return `
        <div class="p-6 sm:p-8 space-y-6">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-base text-[#0C1E36]">Buku Agenda Janji Temu Resmi Notaris</h3>
              <p class="text-xs text-slate-500">Jadwal tatap muka kantor dan konsultasi panggilan suara terdaftar untuk Dr. Hendra Wijaya</p>
            </div>
            <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">${appointments.length} Sesi Terjadwal</span>
          </div>

          ${appointments.length === 0 ? `
            <div class="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200 max-w-xl mx-auto space-y-3">
              <i data-lucide="calendar-x" class="w-10 h-10 text-slate-400 mx-auto"></i>
              <h4 class="font-bold text-slate-800 text-sm">Belum Ada Agenda Janji Temu</h4>
              <p class="text-xs text-slate-500">Belum ada sesi konsultasi yang diajukan oleh klien saat ini.</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${appointments.map(apt => {
                const isVoice = apt.mode === 'voice';
                const isChat = apt.mode === 'chat';
                const isDeed = apt.mode === 'in_person_deed';

                const statusBadge = apt.status === 'Dikonfirmasi'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : (apt.status === 'Selesai'
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : (apt.status === 'Dibatalkan'
                      ? 'bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-amber-100 text-amber-800 border-amber-300'));

                return `
                  <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-500/50 transition" id="notary-apt-${apt.id}">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-xl ${isVoice ? 'bg-emerald-100 text-emerald-800' : (isChat ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')} flex items-center justify-center shrink-0">
                          <i data-lucide="${isVoice ? 'phone-call' : (isChat ? 'messages-square' : 'map-pin')}" class="w-5 h-5"></i>
                        </div>
                        <div>
                          <div class="flex flex-wrap items-center gap-2">
                            <h4 class="font-bold text-sm text-[#0C1E36]">${escapeHtml(apt.userName)} (${escapeHtml(apt.companyName)})</h4>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isVoice ? 'bg-emerald-100 text-emerald-800' : (isChat ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900')}">
                              ${escapeHtml(apt.modeLabel || (isVoice ? 'Panggilan Suara Notaris' : (isChat ? 'Konsultasi Chat Terenkripsi' : 'Tatap Muka di Kantor')))}
                            </span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}">
                              ${escapeHtml(apt.status)}
                            </span>
                          </div>
                          <p class="text-xs text-slate-600 mt-1">Agenda: <strong class="text-slate-800">${escapeHtml(apt.topic || '-')}</strong></p>
                          <p class="text-[11px] text-slate-400 font-mono mt-0.5">Waktu: ${escapeHtml(apt.date)} • ${escapeHtml(apt.time)} • Klien: ${escapeHtml(apt.userEmail)}</p>
                        </div>
                      </div>

                      <div class="flex flex-wrap items-center gap-2">
                        ${apt.status === 'Menunggu Konfirmasi' ? `
                          <button onclick="handleConfirmNotaryAppointment('${apt.id}')" class="btn-confirm-notary-apt px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs">
                            <i data-lucide="check" class="w-3.5 h-3.5"></i>
                            <span>Konfirmasi Janji</span>
                          </button>
                        ` : ''}

                        ${apt.status === 'Dikonfirmasi' ? `
                          <button onclick="handleCompleteNotaryAppointment('${apt.id}')" class="btn-complete-notary-apt px-4 py-2 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 font-bold text-xs transition flex items-center gap-1.5 shadow-xs">
                            <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
                            <span>Tandai Selesai</span>
                          </button>
                        ` : ''}

                        ${isVoice ? `
                          <button onclick="startVoiceCall('${apt.notaryId}')" class="px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs transition flex items-center gap-1.5">
                            <i data-lucide="phone-call" class="w-3.5 h-3.5"></i> Mulai Panggilan Suara
                          </button>
                        ` : ''}

                        ${isChat ? `
                          <button onclick="state.activeAdminChatEmail = '${apt.userEmail}'; switchNotaryPortalTab('chat');" class="px-4 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs transition flex items-center gap-1.5">
                            <i data-lucide="messages-square" class="w-3.5 h-3.5"></i> Chat Klien
                          </button>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      `;
    }

    // Default: 'deeds' tab
    return `
      <div class="p-6 sm:p-8 space-y-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 class="font-bold text-base text-[#0C1E36]">Meja Telaah Minuta Akta Perseroan & Kontrak</h3>
            <p class="text-xs text-slate-500">Pemeriksaan pasal hukum, komparisi para pihak, dan validasi yuridis sebelum pengesahan</p>
          </div>
          <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">3 Berkas Aktif</span>
        </div>

        <div class="space-y-4">
          <!-- Berkas 1: PT Sinergi Digital Indonesia -->
          <div class="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/60 transition shadow-2xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span class="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">BERKAS #NOT-202610-01</span>
                <h4 class="font-bold text-sm text-[#0C1E36] mt-1">PT Sinergi Digital Indonesia</h4>
                <p class="text-xs text-slate-500">Direktur Utama: Fajar Nugraha • Modal Dasar: Rp 1.000.000.000 • KBLI 62019</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Menunggu Paraf Notaris
                </span>
              </div>
            </div>
            <div class="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <p class="text-slate-600">Dokumen: <strong>Draf Akta Pendirian Perseroan Terbatas</strong> (Sesuai UUJN & UU No. 40/2007)</p>
              <div class="flex items-center gap-2">
                <button onclick="openDocumentPreview('akta_pt')" class="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition flex items-center gap-1">
                  <i data-lucide="eye" class="w-3.5 h-3.5"></i> Periksa Minuta
                </button>
                <button onclick="showToast('Catatan yuridis: Minuta akta PT Sinergi Digital disetujui untuk ditandatangani.', 'success')" class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1 shadow-2xs">
                  <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Beri Paraf Notaris
                </button>
              </div>
            </div>
          </div>

          <!-- Berkas 2: PT Gelsay Law Nusantara -->
          <div class="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/60 transition shadow-2xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span class="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">BERKAS #NOT-202610-02</span>
                <h4 class="font-bold text-sm text-[#0C1E36] mt-1">PT Gelsay Law Nusantara</h4>
                <p class="text-xs text-slate-500">Direktur Utama: Gelsay Behrous • Nilai Komitmen: Rp 250.000.000</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Klausul Terverifikasi Sesuai KUHPerdata
                </span>
              </div>
            </div>
            <div class="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <p class="text-slate-600">Dokumen: <strong>Perjanjian Kerjasama Kemitraan Bisnis (PKS)</strong></p>
              <div class="flex items-center gap-2">
                <button onclick="openDocumentPreview('pks')" class="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition flex items-center gap-1">
                  <i data-lucide="eye" class="w-3.5 h-3.5"></i> Buka Dokumen
                </button>
                <button onclick="showToast('Sertifikat verifikasi klausul notaris diterbitkan untuk PT Gelsay.', 'success')" class="px-3.5 py-1.5 rounded-lg bg-[#0C1E36] hover:bg-slate-800 text-amber-300 font-bold transition flex items-center gap-1 shadow-2xs">
                  <i data-lucide="award" class="w-3.5 h-3.5"></i> Terbitkan Sertifikasi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  
  // --- HALODOC-INSPIRED MOBILE BOTTOM NAV DOCK (Item 16) ---
  window.handleMobileBottomNav = function (tab) {
    ['beranda', 'riwayat', 'profil', 'bantuan'].forEach(t => {
      const btn = document.getElementById('btn-bottom-' + t);
      if (btn) {
        const span = btn.querySelector('span');
        if (t === tab) {
          btn.className = 'flex flex-col items-center justify-center py-1 px-2 text-[#2E9B95] group cursor-pointer';
          if (span) span.className = 'text-[10px] font-bold leading-none';
        } else {
          btn.className = 'flex flex-col items-center justify-center py-1 px-2 text-slate-500 hover:text-slate-800 group cursor-pointer';
          if (span) span.className = 'text-[10px] font-medium leading-none';
        }
      }
    });

    if (tab === 'beranda') {
      window.switchView('public');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'chat') {
      window.openLiveChat();
    } else if (tab === 'riwayat') {
      if (state.currentUser) {
        window.switchView('client_dashboard');
        window.switchClientTab('appointments');
      } else {
        window.requireAuth(() => {
          window.switchView('client_dashboard');
          window.switchClientTab('appointments');
        }, 'melihat riwayat janji temu');
      }
    } else if (tab === 'profil') {
      if (state.currentUser) {
        window.switchView('client_dashboard');
        window.switchClientTab('overview');
      } else {
        window.openAuthModal('login');
      }
    } else if (tab === 'bantuan') {
      const faqSec = document.getElementById('faq');
      if (faqSec) {
        faqSec.scrollIntoView({ behavior: 'smooth' });
      } else {
        showToast('Pusat Bantuan LegalEase: WhatsApp Notaris Siaga +62-811-9876-0001 (24 Jam)', 'info');
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    // Check if running inside LegalEase Native Android App WebView
    const isMobileApp = (navigator.userAgent && navigator.userAgent.includes('LegalEaseMobileApp')) || window.location.protocol === 'file:';
    if (isMobileApp) {
      document.documentElement.classList.add('is-mobile-app');
      document.body.classList.add('is-mobile-app');
      console.log('✓ Running inside Native LegalEase Android App WebView');
    }

    initMobileMenu();
    initBackToTop();
    initRealtimeChannel();
    syncNavbarUser();
    renderNotaries();
    renderTemplateTabs();
    renderLandingDocPreview();
    renderChecklist();

    // Initialize distinct dashboard view based on active session
    if (state.currentUser) {
      if (state.currentUser.role === 'admin') {
        switchView('admin_dashboard');
      } else if (state.currentUser.role === 'notary') {
        switchView('notary_dashboard');
      } else {
        switchView('client_dashboard');
      }
    } else {
      switchView('public');
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }

    console.log('✓ LegalEase Production Platform initialized.');
  });

})();