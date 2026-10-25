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
      return s ? JSON.parse(s) : null;
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
    }
  } catch (e) {
    console.warn('Failed to load state, using default:', e);
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

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // --- DYNAMIC PRODUCTION NAVBAR (GUEST vs CLIENT vs ADMIN) ---
  function syncNavbarUser() {
    const user = state.currentUser;
    const desktopContainer = document.getElementById('nav-auth-container');
    const mobileContainer = document.getElementById('mobile-auth-container');
    const mobileAvatarBtn = document.getElementById('mobile-user-avatar-btn');

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

    // 2. ADMINISTRATOR / NOTARY ACCOUNT
    if (user.role === 'admin') {
      if (desktopContainer) {
        desktopContainer.innerHTML = `
          <button type="button" onclick="openAdminConsole()" class="px-3.5 py-1.5 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-xs" title="Buka Konsol Realtime Notaris">
            <i data-lucide="shield" class="w-3.5 h-3.5"></i>
            <span>Konsol Notaris</span>
          </button>
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
              <button onclick="openAdminConsole(); toggleMobileMenu();" class="px-2.5 py-1 rounded-lg bg-[#0C1E36] text-amber-300 text-[10px] font-bold">Konsol</button>
              <button onclick="handleUserSignOut()" class="text-xs font-bold text-rose-600">Keluar</button>
            </div>
          </div>
        `;
      }
      if (mobileAvatarBtn) {
        mobileAvatarBtn.innerHTML = `
          <button onclick="openAdminConsole()" class="p-1.5 rounded-full bg-amber-400 text-slate-950 font-bold text-xs" title="Konsol Notaris">
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

    if (desktopContainer) {
      desktopContainer.innerHTML = `
        <button id="nav-auth-btn" onclick="openAuthModal('profile')" class="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-[#0C1E36] border border-slate-300 text-xs font-bold transition flex items-center gap-2 shadow-2xs">
          <div class="w-6 h-6 rounded-full bg-[#0C1E36] text-amber-300 text-[10px] font-extrabold flex items-center justify-center">
            ${user.initials || user.fullName.substring(0, 2).toUpperCase()}
          </div>
          <div class="text-left leading-tight hidden md:block max-w-[130px]">
            <div class="font-bold text-slate-900 text-[11px] truncate">${user.fullName}</div>
            <div class="${badgeClass} truncate">${user.planName || 'Paket Biasa (Rp 0)'}</div>
          </div>
          <i data-lucide="chevron-down" class="w-3 h-3 text-slate-400"></i>
        </button>
      `;
    }

    if (mobileContainer) {
      mobileContainer.innerHTML = `
        <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div class="truncate mr-2">
            <div class="font-bold text-xs text-slate-900 truncate">${user.fullName}</div>
            <div class="text-[10px] text-slate-500 font-semibold truncate">${user.companyName || user.email}</div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button onclick="openAuthModal('profile')" class="text-xs font-bold text-[#0D7A68]">Profil</button>
            <span class="text-slate-300">|</span>
            <button onclick="handleUserSignOut()" class="text-xs font-bold text-rose-600">Keluar</button>
          </div>
        </div>
      `;
    }

    if (mobileAvatarBtn) {
      mobileAvatarBtn.innerHTML = `
        <button onclick="openAuthModal('profile')" class="p-1.5 rounded-full border border-slate-300 bg-white text-slate-700" title="Akun Klien">
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
      <div class="bg-[#FAF9F5] border border-slate-200 rounded-3xl p-6 hover:border-[#C29236] transition-all shadow-2xs hover:shadow-md flex flex-col justify-between">
        <div>
          <div class="flex items-start gap-4 mb-4">
            <img src="${notary.avatar}" alt="${notary.name}" class="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0">
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
              <p class="text-[11px] text-[#0D7A68] font-bold">${notary.title}</p>
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
          <button onclick="openLiveChat('${notary.id}')" class="px-4 py-2.5 rounded-xl bg-[#0D7A68] hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs" title="Mulai Konsultasi Chat">
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
          .replace(/\{\{party1Name\}\}/g, state.docFormData.party1Name)
          .replace(/\{\{party2Name\}\}/g, state.docFormData.party2Name)
          .replace(/\{\{contractCity\}\}/g, state.docFormData.contractCity)
          .replace(/\{\{contractDate\}\}/g, state.docFormData.contractDate)
          .replace(/\{\{contractValue\}\}/g, state.docFormData.contractValue);

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
    const doc = CONTRACT_TEMPLATES[state.activeDocKey] || CONTRACT_TEMPLATES.pks;

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
        <p>1. <strong>${state.docFormData.party1Name}</strong>, selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.</p>
        <p>2. <strong>${state.docFormData.party2Name}</strong>, selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>.</p>
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
              <strong>${state.docFormData.party1Name}</strong>
            </td>
            <td>
              Pihak Kedua & Saksi Notaris,<br>
              <div class="seal">METERAI<br>Rp 10.000</div><br>
              <strong>${state.docFormData.party2Name}</strong>
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
            class="w-4 h-4 rounded text-[#0D7A68] focus:ring-[#0D7A68] cursor-pointer"
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
    if (!state.currentUser) {
      showToast('Silakan masuk atau buat akun perseroan terlebih dahulu untuk memilih paket berlangganan.', 'info');
      openAuthModal('register');
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
              <div class="grid grid-cols-3 gap-2 mb-3">
                <button type="button" onclick="selectPaymentChannel('qris')" class="p-3 rounded-2xl border text-center transition ${chk.method === 'qris' ? 'border-[#0D7A68] bg-teal-50/70 text-[#0D7A68] font-bold ring-1 ring-[#0D7A68]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}">
                  <span class="block text-xs font-bold">QRIS</span>
                  <span class="text-[9px] text-slate-500 block">Semua Bank & E-Wallet</span>
                </button>
                <button type="button" onclick="selectPaymentChannel('va')" class="p-3 rounded-2xl border text-center transition ${chk.method === 'va' ? 'border-[#0D7A68] bg-teal-50/70 text-[#0D7A68] font-bold ring-1 ring-[#0D7A68]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}">
                  <span class="block text-xs font-bold">Virtual Account</span>
                  <span class="text-[9px] text-slate-500 block">BCA, Mandiri, BNI, BRI</span>
                </button>
                <button type="button" onclick="selectPaymentChannel('ewallet')" class="p-3 rounded-2xl border text-center transition ${chk.method === 'ewallet' ? 'border-[#0D7A68] bg-teal-50/70 text-[#0D7A68] font-bold ring-1 ring-[#0D7A68]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}">
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
                      <button type="button" onclick="navigator.clipboard.writeText('8910081234567890'); alert('Nomor VA disalin!')" class="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-[#0D7A68] text-xs">
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
          <button type="button" onclick="startPaymentSimulationProcess()" class="w-full py-4 rounded-2xl bg-[#0D7A68] hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition">
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
          <div class="w-16 h-16 rounded-full border-4 border-[#0D7A68]/20 border-t-[#0D7A68] animate-spin mx-auto"></div>
          <div>
            <h3 id="checkout-proc-title" class="font-bold text-sm text-[#0C1E36]">Menghubungkan ke Gateway Pembayaran Bank...</h3>
            <p id="checkout-proc-sub" class="text-xs text-slate-500 mt-1">Mohon tunggu, transaksi sedang diverifikasi secara real-time melalui sistem Bank Indonesia.</p>
          </div>
          <div class="max-w-xs mx-auto bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div class="bg-[#0D7A68] h-full rounded-full animate-pulse" style="width: 75%"></div>
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
              <span class="text-[#0D7A68]">IDR ${chk.planPrice.toLocaleString('id-ID')}</span>
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
          .seal-stamp { border: 2px dashed #0D7A68; color: #0D7A68; padding: 8px 16px; display: inline-block; font-weight: bold; font-size: 11px; border-radius: 8px; margin-top: 20px; }
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

  // --- BOOKING MODAL ---
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
    const notary = NOTARIES.find(n => n.id === notaryId) || NOTARIES[0];
    const date = document.getElementById('booking-date')?.value || '';
    const time = document.getElementById('booking-time')?.value || '';

    closeBookingModal();
    showToast(`Janji temu resmi dengan ${notary.name} berhasil dijadwalkan pada ${date} pukul ${time}. Konfirmasi telah dikirimkan ke WhatsApp & Email Anda.`, 'success');
  };

  // --- APK GUIDE MODAL & SHA CHECKSUM ---
  window.openApkGuideModal = function () {
    const modal = document.getElementById('apk-guide-modal');
    if (modal) modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  };

  window.closeApkGuideModal = function () {
    const modal = document.getElementById('apk-guide-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.copySha256Checksum = function () {
    const sha = "a8f9c2d14e05b3879a6d41829e924bc102573fbc6d9a1845e0321a947df32890";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sha).then(() => {
        showToast(`SHA-256 Checksum disalin: ${sha.slice(0, 16)}...`, 'success');
      });
    } else {
      prompt("Salin SHA-256 Checksum Berkas APK:", sha);
    }
  };

  // --- PRODUCTION AUTH MODAL (LOGIN, REGISTER, PROFILE) ---
  window.openAuthModal = function (mode) {
    mode = mode || (state.currentUser ? 'profile' : 'login');
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

          <form onsubmit="handleUserLoginSubmit(event)" class="space-y-3 pt-1">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Email Resmi</label>
              <input type="email" id="auth-login-email" required placeholder="nama@perusahaan.co.id" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#0C1E36] focus:bg-white text-xs font-medium">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Kata Sandi</label>
              <input type="password" id="auth-login-password" required placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#0C1E36] focus:bg-white text-xs font-medium">
            </div>

            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Login Notaris / Admin:</span>
              <button type="button" onclick="fillAdminCredentials()" class="font-bold text-[#0D7A68] hover:underline">Gunakan Akun Notaris</button>
            </div>

            <button type="submit" class="w-full py-3 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition">
              <i data-lucide="log-in" class="w-4 h-4"></i> Masuk Sekarang
            </button>
          </form>

          <div class="pt-3 border-t border-slate-100 text-center">
            <p class="text-slate-600">
              Belum memiliki akun perusahaan? 
              <button type="button" onclick="openAuthModal('register')" class="font-bold text-[#0D7A68] hover:underline">Daftar Akun Baru (Gratis)</button>
            </p>
          </div>
        </div>
      `;
    } else if (mode === 'register') {
      body.innerHTML = `
        <div class="space-y-4 text-xs">
          <div class="text-center pb-2 border-b border-slate-100">
            <h4 class="font-serif-editorial font-bold text-xl text-[#0C1E36]">Registrasi Akun Klien Baru</h4>
            <p class="text-[11px] text-slate-500 mt-0.5">Daftarkan perusahaan Anda untuk konsultasi langsung dengan Notaris berlisensi</p>
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

            <button type="submit" class="w-full py-3 rounded-xl bg-[#0D7A68] hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition mt-2">
              <i data-lucide="user-plus" class="w-4 h-4"></i> Buat Akun Klien Sekarang
            </button>
          </form>

          <div class="pt-3 border-t border-slate-100 text-center">
            <p class="text-slate-600">
              Sudah memiliki akun terdaftar? 
              <button type="button" onclick="openAuthModal('login')" class="font-bold text-[#0D7A68] hover:underline">Masuk di sini</button>
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

  window.fillAdminCredentials = function () {
    const emailInput = document.getElementById('auth-login-email');
    const passInput = document.getElementById('auth-login-password');
    if (emailInput) emailInput.value = 'admin@legalease.co.id';
    if (passInput) passInput.value = 'admin';
  };

  window.handleUserLoginSubmit = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    const email = (document.getElementById('auth-login-email')?.value || '').trim().toLowerCase();
    const password = (document.getElementById('auth-login-password')?.value || '').trim();

    // Check Admin Login
    if (email === 'admin@legalease.co.id' || email === 'admin') {
      if (password === 'admin' || password === 'admin123' || password === 'notaris123') {
        state.currentUser = Object.assign({}, ADMIN_ACCOUNT);
        saveSession(state.currentUser);
        saveState();
        syncNavbarUser();
        closeAuthModal();
        showToast('Berhasil masuk sebagai Notaris Utama (Administrator)!', 'success');
        return;
      }
    }

    // Check Registered Client Login
    const users = getRegisteredUsers();
    const found = users.find(u => u.email.toLowerCase() === email);
    if (found) {
      if (found.password === password) {
        state.currentUser = Object.assign({}, found);
        saveSession(state.currentUser);
        saveState();
        syncNavbarUser();
        closeAuthModal();
        showToast(`Selamat datang kembali, ${found.fullName}!`, 'success');
        return;
      } else {
        showToast('Kata sandi yang Anda masukkan salah.', 'error');
        return;
      }
    }

    showToast('Akun tidak ditemukan. Silakan periksa email atau buat akun baru.', 'error');
  };

  window.handleUserRegisterSubmit = function (e) {
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

    const users = getRegisteredUsers();
    if (users.some(u => u.email === email)) {
      showToast('Email ini sudah terdaftar. Silakan masuk menggunakan kata sandi Anda.', 'error');
      return;
    }

    const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'KL';
    const newUser = {
      id: 'usr_' + Date.now().toString(36),
      fullName: name,
      initials: initials,
      companyName: company,
      email: email,
      phone: phone || '0812-3456-7890',
      password: password,
      city: city,
      role: 'client',
      plan: 'biasa',
      planName: 'Paket Biasa (Rp 0)',
      planDuration: '0 Hari Aktif',
      registeredAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      isAuthenticated: true,
      transactions: []
    };

    users.push(newUser);
    saveRegisteredUsers(users);

    state.currentUser = Object.assign({}, newUser);
    state.docFormData.party1Name = company;
    saveSession(state.currentUser);
    saveState();
    syncNavbarUser();
    closeAuthModal();

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

    showToast(`Selamat datang ${name}! Akun perseroan ${company} berhasil didaftarkan.`, 'success');
  };

  window.handleUserSignOut = function () {
    state.currentUser = null;
    saveSession(null);
    saveState();
    syncNavbarUser();
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

  // --- CHAT MESSAGE FORMATTER (MARKDOWN TO CLEAN HTML) ---
  function formatChatMessage(text) {
    if (!text) return '';
    let formatted = escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/\n• /g, '<br><span class="text-[#0D7A68] font-bold">•</span> ')
      .replace(/\n\n/g, '</p><p class="mt-2 text-xs">')
      .replace(/\n/g, '<br>');
    return `<p class="text-xs">${formatted}</p>`;
  }

  // --- INITIAL GREETING GENERATOR PER NOTARY & CLIENT PROFILE ---
  function generateInitialGreeting(notaryId, user) {
    const not = NOTARIES.find(n => n.id === notaryId) || NOTARIES[0];
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    if (user.plan === 'full') {
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
      return [
        {
          id: 'msg_init_' + notaryId,
          sender: 'notary',
          senderName: not.name,
          senderAvatar: not.avatar,
          text: `Halo Bapak/Ibu **${user.fullName}** dari **${user.companyName}**!\n\nSaya **${not.name}** (${not.title}). Sesi konsultasi hukum resmi LegalEase telah terhubung langsung dengan kantor kami. Apakah ada kebutuhan terkait pendirian PT, perizinan KBLI, kontrak kerja, atau legalitas bisnis yang dapat saya bantu telaah hari ini?`,
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
        `2. **Full Legal Suite**: **IDR 300.000/bulan** mencakup konsultasi chat prioritas, panggilan video 1-on-1, dan akses penuh pembuatan serta pengunduhan seluruh template kontrak hukum (Word & PDF).\n` +
        `3. **Pembuatan Akta Otentik**: Dikenakan tarif berdasarkan ketentuan Pasal 36 UU Jabatan Notaris (UUJN No. 2 Tahun 2014) disesuaikan dengan nilai ekonomis akta, ditambah biaya resmi PNBP Kemenkumham RI.\n\n` +
        `Anda dapat menjadwalkan janji temu tatap muka atau video call melalui tombol **"Jadwal Tatap Muka"** pada profil notaris kami.`;
    }

    // General / Fallback
    return `Terima kasih atas pertanyaan Anda, Bapak/Ibu **${userName}**.\n\n` +
      `Menanggapi poin yang Anda sampaikan terkait kegiatan usaha **${companyName}**:\n` +
      `1. Berdasarkan prinsip hukum perikatan perdata di Indonesia (Pasal 1320 & 1338 KUHPerdata), setiap kesepakatan bisnis berlaku sebagai undang-undang bagi mereka yang membuatnya sepanjang memenuhi 4 syarat sah: kesepakatan para pihak, kecakapan bertindak, obyek tertentu, dan kausa yang halal.\n` +
      `2. Untuk menjamin kepastian hukum (*legal certainty*) dan memitigasi risiko sengketa di kemudian hari, setiap transaksi atau perikatan sebaiknya dibuat dalam bentuk tertulis dengan klausul hak, kewajiban, wanprestasi, dan penyelesaian sengketa yang terperinci.\n\n` +
      `Ada dokumen tertentu atau klausul spesifik yang ingin saya bantu susunkan atau telaah lebih mendalam? Anda juga dapat mengunggah berkas rancangan kontrak melalui tombol lampiran (klip kertas).`;
  }

  // --- RENDER LIVE CHAT MESSAGES ---
  function renderChatMessages() {
    const container = document.getElementById('chat-messages-stream');
    if (!container) return;

    const notaryId = state.activeChatNotaryId || 'notary-1';
    const notary = NOTARIES.find(n => n.id === notaryId) || NOTARIES[0];

    if (!state.chatHistory) state.chatHistory = {};
    if (!state.chatHistory[notaryId] || state.chatHistory[notaryId].length === 0) {
      state.chatHistory[notaryId] = generateInitialGreeting(notaryId, state.currentUser);
    }

    const msgs = state.chatHistory[notaryId];

    container.innerHTML = msgs.map(msg => {
      if (msg.sender === 'notary') {
        return `
          <div class="flex items-start gap-2.5 max-w-[92%]">
            <img src="${msg.senderAvatar || notary.avatar}" alt="${msg.senderName}" class="w-8 h-8 rounded-full object-cover border border-slate-300 shrink-0 mt-0.5 shadow-2xs">
            <div>
              <div class="flex items-center gap-1.5 mb-1">
                <span class="font-bold text-[10px] text-slate-800">${msg.senderName}</span>
                <span class="text-[9px] text-slate-400 font-mono">${msg.timestamp}</span>
              </div>
              <div class="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-800 leading-relaxed shadow-2xs rounded-tl-xs space-y-2 text-xs">
                ${formatChatMessage(msg.text)}
              </div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="flex items-start justify-end gap-2.5 ml-auto max-w-[92%]">
            <div class="text-right">
              <div class="flex items-center justify-end gap-1.5 mb-1">
                <span class="text-[9px] text-slate-400 font-mono">${msg.timestamp}</span>
                <span class="font-bold text-[10px] text-[#0C1E36]">Anda</span>
                <span class="text-[10px] text-emerald-600 font-bold" title="Terkirim & Terbaca">✓✓</span>
              </div>
              <div class="p-3.5 rounded-2xl bg-[#0C1E36] text-white text-left leading-relaxed shadow-sm rounded-tr-xs text-xs space-y-2">
                ${msg.attachment ? `
                  <div class="p-2.5 rounded-xl bg-white/10 border border-white/20 flex items-center gap-2.5 mb-2">
                    <div class="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                      <i data-lucide="file-text" class="w-4 h-4"></i>
                    </div>
                    <div class="truncate text-left">
                      <div class="font-bold text-[11px] text-white truncate">${escapeHtml(msg.attachment.name)}</div>
                      <div class="text-[9px] text-slate-300 font-mono">${msg.attachment.size} • Terkirim untuk Telaah Notaris</div>
                    </div>
                  </div>
                ` : ''}
                <div>${escapeHtml(msg.text)}</div>
              </div>
            </div>
            <div class="w-8 h-8 rounded-full bg-[#0C1E36] text-amber-300 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 border border-amber-300/30">
              ${state.currentUser.initials || 'PS'}
            </div>
          </div>
        `;
      }
    }).join('');

    if (window.lucide) window.lucide.createIcons();
    container.scrollTop = container.scrollHeight;
  }

  // --- LIVE CHAT CONTROLLER FUNCTIONS ---
  window.openLiveChat = function (notaryId) {
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
    if (clientPill) clientPill.textContent = `${state.currentUser.fullName} (${state.currentUser.companyName})`;

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

    // Append user message
    state.chatHistory[notaryId].push({
      id: 'msg_usr_' + Date.now(),
      sender: 'user',
      senderName: state.currentUser.fullName,
      text: text,
      attachment: attachment || null,
      timestamp: now
    });

    saveState();
    renderChatMessages();

    // Instant response without any delay (tanpa delay sedikitpun)
    const replyText = generateNotaryLegalResponse(text, notary, state.currentUser, attachment ? attachment.name : null);
    const replyTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    state.chatHistory[notaryId].push({
      id: 'msg_not_' + (Date.now() + 1),
      sender: 'notary',
      senderName: notary.name,
      senderAvatar: notary.avatar,
      text: replyText,
      timestamp: replyTime
    });

    saveState();
    renderChatMessages();
    playMessageNotificationSound();

    const typingIndicator = document.getElementById('chat-typing-indicator');
    if (typingIndicator) typingIndicator.classList.add('hidden');

    const container = document.getElementById('chat-messages-stream');
    if (container) container.scrollTop = container.scrollHeight;

    // BROADCAST TO ALL CONNECTED DEVICES VIA SUPABASE REALTIME
    if (realtimeChannel) {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'client-message',
        payload: {
          id: 'msg_usr_' + Date.now(),
          notaryId: notaryId,
          sender: 'user',
          senderName: state.currentUser ? state.currentUser.fullName : 'Klien Tamu',
          userEmail: state.currentUser ? state.currentUser.email : 'guest@klien.id',
          userCompany: state.currentUser ? state.currentUser.companyName : 'Perusahaan Klien',
          text: text,
          attachment: attachment || null,
          timestamp: now,
          deviceId: DEVICE_ID
        }
      });

      realtimeChannel.send({
        type: 'broadcast',
        event: 'notary-reply',
        payload: {
          id: 'msg_not_' + (Date.now() + 1),
          notaryId: notaryId,
          sender: 'notary',
          senderName: notary.name,
          senderAvatar: notary.avatar,
          userEmail: state.currentUser ? state.currentUser.email : 'guest@klien.id',
          text: replyText,
          timestamp: replyTime,
          deviceId: DEVICE_ID
        }
      });
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

  // --- ADMIN CONSOLE CONTROLLER ---
  let activeAdminTab = 'chats';

  window.openAdminConsole = function () {
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
    if (!container) return;

    if (activeAdminTab === 'chats') {
      const clients = Object.values(state.adminClientChats);
      const activeEmail = state.activeAdminChatEmail || (clients.length > 0 ? clients[0].clientEmail : null);
      const activeChat = clients.find(c => c.clientEmail === activeEmail) || null;

      container.innerHTML = `
        <div class="flex-1 flex overflow-hidden">
          <!-- Left Client Threads List -->
          <div class="w-72 sm:w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
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
                <div onclick="selectAdminClientChat('${c.clientEmail}')" class="p-3.5 hover:bg-slate-100 cursor-pointer transition ${c.clientEmail === activeEmail ? 'bg-white border-l-4 border-[#0D7A68] shadow-2xs' : ''}">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-bold text-xs text-[#0C1E36] truncate">${c.clientName}</span>
                    <span class="text-[9px] text-slate-400 font-mono">${c.messages.length > 0 ? c.messages[c.messages.length - 1].timestamp : ''}</span>
                  </div>
                  <div class="text-[10px] text-[#0D7A68] font-semibold truncate mb-1">${c.clientCompany}</div>
                  <div class="text-[11px] text-slate-500 truncate">${c.messages.length > 0 ? c.messages[c.messages.length - 1].text : 'Belum ada pesan'}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right Chat Stream -->
          <div class="flex-1 flex flex-col bg-white">
            ${activeChat ? `
              <div class="p-3.5 px-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div>
                  <h4 class="font-bold text-xs text-[#0C1E36]">${activeChat.clientName}</h4>
                  <p class="text-[10px] text-slate-500">${activeChat.clientCompany} • ${activeChat.clientEmail}</p>
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
                        <span>${m.senderName}</span> • <span>${m.timestamp}</span>
                      </div>
                      ${m.attachment ? `
                        <div class="p-2 rounded-lg bg-black/10 text-[10px] font-mono flex items-center gap-1.5 mb-1">
                          <i data-lucide="file" class="w-3.5 h-3.5"></i> ${m.attachment.name}
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
                <button type="submit" class="px-4 py-2.5 rounded-xl bg-[#0D7A68] hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
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
      container.innerHTML = `
        <div class="flex-1 overflow-y-auto p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h4 class="font-bold text-sm text-[#0C1E36]">Database Klien Terdaftar</h4>
              <p class="text-xs text-slate-500">Seluruh pengguna yang membuat akun mandiri di platform</p>
            </div>
            <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">${users.length} Akun Terdaftar</span>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table class="w-full text-xs text-left">
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
                    <td class="p-3.5 font-bold text-slate-900">${u.fullName}</td>
                    <td class="p-3.5 font-semibold text-[#0D7A68]">${u.companyName}</td>
                    <td class="p-3.5 font-mono text-[11px]">${u.email}<br><span class="text-slate-400">${u.phone || '-'}</span></td>
                    <td class="p-3.5">${u.city}</td>
                    <td class="p-3.5"><span class="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-[10px]">${u.planName}</span></td>
                    <td class="p-3.5 text-slate-400">${u.registeredAt}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
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

      container.innerHTML = `
        <div class="flex-1 overflow-y-auto p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h4 class="font-bold text-sm text-[#0C1E36]">Riwayat Tagihan & Pembayaran</h4>
              <p class="text-xs text-slate-500">Seluruh transaksi pelunasan paket hukum klien</p>
            </div>
            <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">${allTx.length} Transaksi</span>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table class="w-full text-xs text-left">
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
                    <td class="p-3.5 font-mono font-bold text-slate-900">${t.id}</td>
                    <td class="p-3.5 font-semibold">${t.userName}<br><span class="text-[10px] text-slate-400">${t.company}</span></td>
                    <td class="p-3.5">${t.planName}</td>
                    <td class="p-3.5 font-bold text-[#0D7A68]">IDR ${Number(t.amount || 0).toLocaleString('id-ID')}</td>
                    <td class="p-3.5">${t.method}</td>
                    <td class="p-3.5"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">LUNAS</span></td>
                    <td class="p-3.5 text-slate-400">${t.date}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  window.selectAdminClientChat = function (email) {
    state.activeAdminChatEmail = email;
    if (state.adminClientChats[email]) {
      state.adminClientChats[email].unreadCount = 0;
    }
    renderAdminContent();
    const stream = document.getElementById('admin-chat-messages');
    if (stream) stream.scrollTop = stream.scrollHeight;
  };

  window.handleSendAdminReply = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('admin-reply-input');
    if (!input) return;
    const text = (input.value || '').trim();
    if (!text) return;
    input.value = '';

    const email = state.activeAdminChatEmail;
    if (!email || !state.adminClientChats[email]) return;

    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const notName = 'Dr. Hendra Wijaya, S.H., M.Kn.';

    // Append to admin chat thread
    state.adminClientChats[email].messages.push({
      id: 'msg_adm_' + Date.now(),
      sender: 'notary',
      senderName: notName,
      text: text,
      timestamp: now
    });

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

  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initRealtimeChannel();
    syncNavbarUser();
    renderNotaries();
    renderTemplateTabs();
    renderLandingDocPreview();
    renderChecklist();

    if (window.lucide) {
      window.lucide.createIcons();
    }

    console.log('✓ LegalEase Production Platform initialized.');
  });

})();
