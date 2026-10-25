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

  // --- DUAL PRESET ACCOUNTS (2 AKUN PENGGUNA) ---
  // Akun 1: Klien Baru (Paket Biasa, Benar-benar 0 / Belum Berlangganan)
  const ACCOUNT_1_SALMAN = {
    id: 'usr_salman_01',
    fullName: 'Pratama Salman',
    initials: 'PS',
    companyName: 'PT Solusi Maju Bersama',
    email: 'salman@solusimaju.co.id',
    phone: '0812-9876-5432',
    city: 'Jakarta Selatan',
    plan: 'biasa', // 'biasa' = Paket Biasa (Rp 0 / Belum Berlangganan)
    planName: 'Paket Biasa (Rp 0)',
    planDuration: '0 Hari Aktif',
    isAuthenticated: true,
    transactions: [] // Benar-benar 0 transaksi awal!
  };

  // Akun 2: Klien Korporasi (Full Legal Suite Rp 300.000 / Aktif)
  const ACCOUNT_2_GELSAY = {
    id: 'usr_gelsay_02',
    fullName: 'Gelsay Behrous',
    initials: 'GB',
    companyName: 'PT Nusantara Digital Mandiri',
    email: 'gelsay@nusantaradigital.id',
    phone: '0811-2345-6789',
    city: 'Jakarta Pusat',
    plan: 'full', // 'full' = Full Legal Suite (Rp 300.000)
    planName: 'Full Legal Suite (Rp 300.000)',
    planDuration: 'Aktif s/d 24 Nov 2026',
    isAuthenticated: true,
    transactions: [
      {
        id: 'INV-2026-3001',
        planName: 'Full Legal Suite (1 Bulan)',
        amount: 300000,
        method: 'QRIS Real-Time',
        date: '24 Okt 2026',
        status: 'PAID'
      }
    ]
  };

  // --- PERSISTENT STATE ---
  const STORAGE_KEY = 'legalease_production_state_v5';

  const defaultState = {
    activeAccountKey: 'salman', // 'salman' or 'gelsay'
    currentUser: Object.assign({}, ACCOUNT_1_SALMAN),
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

  // --- SYNC NAVBAR WITH ACTIVE USER PROFILE ---
  function syncNavbarUser() {
    const user = state.currentUser;
    const nameEl = document.getElementById('nav-auth-name');
    const badgeEl = document.getElementById('nav-auth-badge');
    const avatarEl = document.getElementById('nav-user-avatar');
    const avatarMobile = document.getElementById('nav-user-avatar-mobile');
    const mobileName = document.getElementById('mobile-auth-name');
    const mobileBadge = document.getElementById('mobile-auth-badge');

    if (nameEl) nameEl.textContent = user.fullName;
    if (avatarEl) avatarEl.textContent = user.initials || 'LE';
    if (avatarMobile) avatarMobile.textContent = user.initials || 'LE';
    if (mobileName) mobileName.textContent = user.fullName;

    let badgeText = 'Paket Biasa (Rp 0)';
    let badgeClass = 'text-[9px] text-slate-500 font-semibold';

    if (user.plan === 'full') {
      badgeText = 'Full Suite (Aktif • 300k)';
      badgeClass = 'text-[9px] text-amber-600 font-bold';
    } else if (user.plan === 'chat') {
      badgeText = 'Chat Essential (150k)';
      badgeClass = 'text-[9px] text-teal-600 font-bold';
    } else if (user.plan === 'trial') {
      badgeText = 'Free Trial (3 Hari)';
      badgeClass = 'text-[9px] text-emerald-600 font-bold';
    }

    if (badgeEl) {
      badgeEl.textContent = badgeText;
      badgeEl.className = badgeClass;
    }
    if (mobileBadge) {
      mobileBadge.textContent = badgeText;
    }
  }

  // --- 2-ACCOUNT SWITCHER FUNCTION ---
  window.switchAccount = function (accountKey) {
    if (accountKey === 'salman') {
      state.activeAccountKey = 'salman';
      state.currentUser = Object.assign({}, ACCOUNT_1_SALMAN);
      state.docFormData.party1Name = ACCOUNT_1_SALMAN.companyName;
      showToast('Beralih ke Akun 1: Pratama Salman (Paket Biasa Rp 0 / Belum Berlangganan)', 'info');
    } else if (accountKey === 'gelsay') {
      state.activeAccountKey = 'gelsay';
      state.currentUser = Object.assign({}, ACCOUNT_2_GELSAY);
      state.docFormData.party1Name = ACCOUNT_2_GELSAY.companyName;
      showToast('Beralih ke Akun 2: Gelsay Behrous (Full Legal Suite Rp 300k / Aktif)', 'success');
    }

    saveState();
    syncNavbarUser();
    renderLandingDocPreview();
    closeAuthModal();
  };

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
          <button onclick="openCheckoutModal('chat')" class="px-4 py-2.5 rounded-xl bg-[#0D7A68] hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs" title="Mulai Konsultasi Chat">
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
    planId = planId || 'full';
    state.checkoutState.planId = planId;
    state.checkoutState.step = 'input';
    state.checkoutState.countdownSeconds = 899; // 14:59

    const user = state.currentUser;
    state.checkoutState.customerName = user.fullName;
    state.checkoutState.customerEmail = user.email;
    state.checkoutState.customerPhone = user.phone || '0812-9876-5432';
    state.checkoutState.customerCompany = user.companyName;
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
    state.checkoutState.step = 'processing';
    renderCheckoutModal();

    setTimeout(() => {
      const titleEl = document.getElementById('checkout-proc-title');
      const subEl = document.getElementById('checkout-proc-sub');
      if (titleEl) titleEl.textContent = 'Menerima verifikasi webhook dari Bank Indonesia...';
      if (subEl) subEl.textContent = 'Otorisasi pembayaran berhasil diterima oleh gateway LegalEase.';
    }, 1200);

    setTimeout(() => {
      // Payment Successful!
      state.checkoutState.step = 'success';

      // Upgrade active user's plan
      const user = state.currentUser;
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

      // Record transaction
      user.transactions.unshift({
        id: state.checkoutState.invoiceNo,
        planName: state.checkoutState.planName,
        amount: state.checkoutState.planPrice,
        method: state.checkoutState.planPrice > 0 ? (state.checkoutState.method === 'qris' ? 'QRIS Real-Time' : 'BCA Virtual Account') : 'Free Trial Activation',
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: 'PAID'
      });

      // Update company name if filled
      if (state.checkoutState.customerCompany) {
        user.companyName = state.checkoutState.customerCompany;
        state.docFormData.party1Name = state.checkoutState.customerCompany;
      }
      if (state.checkoutState.customerName) {
        user.fullName = state.checkoutState.customerName;
      }

      saveState();
      syncNavbarUser();
      renderLandingDocPreview();
      playSuccessChime();
      renderCheckoutModal();
      showToast(`Pembayaran berhasil! Paket ${user.planName} aktif untuk ${user.fullName}.`, 'success');
    }, 2400);
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

  // --- AUTH MODAL & DUAL PROFILE SWITCHER ---
  window.openAuthModal = function (mode) {
    const modal = document.getElementById('auth-modal');
    const body = document.getElementById('auth-modal-body');
    if (!modal || !body) return;

    const user = state.currentUser;

    body.innerHTML = `
      <div class="space-y-5 text-xs">
        
        <!-- Active User Profile Card -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Profil Klien Aktif</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${user.plan === 'full' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}">
              ${user.planName}
            </span>
          </div>

          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-[#0C1E36] text-amber-300 font-extrabold text-sm flex items-center justify-center">
              ${user.initials || 'LE'}
            </div>
            <div>
              <div class="font-bold text-sm text-[#0C1E36]">${user.fullName}</div>
              <div class="text-slate-600 font-medium">${user.companyName}</div>
              <div class="text-[10px] text-slate-400">${user.email} • ${user.city}</div>
            </div>
          </div>

          <div class="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
            <span class="text-slate-500">Status Langganan:</span>
            <span class="font-bold ${user.plan === 'full' ? 'text-amber-600' : 'text-slate-700'}">
              ${user.plan === 'full' ? 'Full Legal Suite (Aktif)' : (user.plan === 'chat' ? 'Chat Essential (Aktif)' : 'Paket Biasa (0 / Belum Bayar)')}
            </span>
          </div>
        </div>

        <!-- 2 Accounts Quick Switcher (Permintaan Pengguna) -->
        <div>
          <label class="block font-bold text-slate-800 mb-2">Pilih Akun Cepat (Tersedia 2 Akun Pengguna):</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            <!-- Akun 1: Salman (Paket Biasa Rp 0) -->
            <div onclick="switchAccount('salman')" class="p-3.5 rounded-2xl border ${state.activeAccountKey === 'salman' ? 'border-[#0D7A68] bg-teal-50/60 ring-2 ring-[#0D7A68]/20' : 'border-slate-200 bg-white hover:border-slate-300'} cursor-pointer transition shadow-2xs">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-bold text-slate-500 uppercase">Akun 1 (Default)</span>
                ${state.activeAccountKey === 'salman' ? '<span class="text-[9px] font-extrabold text-emerald-600">✓ Aktif</span>' : ''}
              </div>
              <div class="font-bold text-xs text-[#0C1E36]">Pratama Salman</div>
              <div class="text-[10px] text-slate-500 truncate">PT Solusi Maju Bersama</div>
              <div class="mt-2 text-[10px] font-bold text-slate-600 bg-slate-100 py-1 px-2 rounded-md inline-block">
                Paket Biasa (Rp 0)
              </div>
              <p class="text-[9px] text-slate-400 mt-1 leading-tight">Mulai dari 0 untuk simulasi alur pembayaran asli.</p>
            </div>

            <!-- Akun 2: Gelsay (Full Suite Rp 300k) -->
            <div onclick="switchAccount('gelsay')" class="p-3.5 rounded-2xl border ${state.activeAccountKey === 'gelsay' ? 'border-[#C29236] bg-amber-50/60 ring-2 ring-[#C29236]/30' : 'border-slate-200 bg-white hover:border-slate-300'} cursor-pointer transition shadow-2xs">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-bold text-amber-700 uppercase">Akun 2 (Enterprise)</span>
                ${state.activeAccountKey === 'gelsay' ? '<span class="text-[9px] font-extrabold text-[#C29236]">✓ Aktif</span>' : ''}
              </div>
              <div class="font-bold text-xs text-[#0C1E36]">Gelsay Behrous</div>
              <div class="text-[10px] text-slate-500 truncate">PT Nusantara Digital Mandiri</div>
              <div class="mt-2 text-[10px] font-bold text-amber-800 bg-amber-100 py-1 px-2 rounded-md inline-block">
                Full Suite (Rp 300.000)
              </div>
              <p class="text-[9px] text-slate-400 mt-1 leading-tight">Sudah lunas dengan riwayat faktur resmi.</p>
            </div>

          </div>
        </div>

        <!-- Action Buttons -->
        <div class="pt-2 flex items-center justify-between">
          <span class="text-[10px] text-slate-400">Sinkronisasi Cloud Aktif</span>
          <button type="button" onclick="closeAuthModal()" class="px-5 py-2.5 rounded-xl bg-[#0C1E36] hover:bg-slate-800 text-white font-bold text-xs shadow-2xs">
            Tutup
          </button>
        </div>

      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  };

  window.closeAuthModal = function () {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
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
  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
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
