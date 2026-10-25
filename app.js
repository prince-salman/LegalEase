/**
 * LegalEase - Official Client Portal & Application Script
 * Indonesia's Premier On-Demand Legal & Notary Platform
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons if available
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // --- STATE MANAGEMENT ---
  const state = {
    currentScreen: 1, // 1 to 7, 8: Video Call
    activeNotaryFilter: 'all',
    videoCallNotary: 'Notary A, S.H., M.Kn.',
    isCallMuted: false,
    callSeconds: 0,
    callTimerInterval: null,
    activePlan: 'full', // 'trial', 'chat', 'full'
    checklist: [
      { id: 1, text: "Prepare founders' ID & tax no. (KTP & NPWP Pendiri)", completed: true },
      { id: 2, text: "Set name & business activities (Nama PT & KBLI)", completed: true },
      { id: 3, text: "Set authorized capital (Penetapan Modal Dasar & Disetor)", completed: true },
      { id: 4, text: "Sign the deed at the notary (Tanda Tangan Akta Notaris)", completed: false },
      { id: 5, text: "Legal entity approval (SK Pengesahan Kemenkumham)", completed: false },
      { id: 6, text: "Get NIB via OSS (Penerbitan NIB & Izin Berusaha)", completed: false }
    ],
    cart: [
      { id: 'plan-full', title: 'Monthly Full Legal Suite (Call + Chat + Templates)', price: 300000, qty: 1 }
    ],
    selectedPaymentMethod: 'va',
    chatMessages: [
      { sender: 'user', text: 'I want to set up a PT for my startup. What documents do I need to prepare?', time: '10:14 AM' },
      { sender: 'notary', text: "Hello! We will start with the founders' identification and business capital. I am sending you our official checklist.", time: '10:15 AM' },
      { 
        sender: 'notary', 
        isAttachment: true, 
        attachmentTitle: 'PT Setup Checklist', 
        attachmentSubtitle: 'Official verified guide & checklist (PDF)',
        actionTarget: 5,
        docKey: 'checklist',
        time: '10:15 AM' 
      },
      { sender: 'user', text: 'Thank you! How long does the deed signing usually take once requirements are complete?', time: '10:16 AM' }
    ]
  };

  // Screen Names & Meta for Portal Header
  const screenMeta = {
    1: { title: "1. Home Dashboard", subtitle: "Instant access to verified notaries, contract templates, and company setup on one screen." },
    2: { title: "2. Choose a Notary", subtitle: "Licensed Notaries & PPAT with verified credentials and transparent consultation fees." },
    3: { title: "3. Consultation Room", subtitle: "Live encrypted chat and video meeting protected by legal professional secrecy." },
    4: { title: "4. Document Templates", subtitle: "Ready-to-use, legally vetted contract templates for startups and businesses." },
    5: { title: "5. Guides & Checklists", subtitle: "Step-by-step company incorporation roadmap with automated milestone tracking." },
    6: { title: "6. Payment Gateway", subtitle: "Secure multi-channel checkout via Bank Transfer, E-Wallet, QRIS, or Credit Card." },
    7: { title: "7. Client Account & Retainer", subtitle: "Manage your LegalEase subscription (Trial, Chat Rp 150k, or Full Suite Rp 300k) and corporate filings." },
    8: { title: "Video Consultation", subtitle: "Live encrypted online meeting with licensed Notary & PPAT." }
  };

  // --- SCREEN NAVIGATION ---
  window.goToScreen = function(screenNum) {
    if (screenNum < 1 || screenNum > 8) return;
    
    // Stop video call timer if navigating away from screen 8
    if (state.currentScreen === 8 && screenNum !== 8) {
      if (state.callTimerInterval) {
        clearInterval(state.callTimerInterval);
        state.callTimerInterval = null;
      }
    }

    state.currentScreen = screenNum;
    renderScreen();
    updateScreenNavButtons();
  };

  function updateScreenNavButtons() {
    document.querySelectorAll('.screen-select-btn').forEach(btn => {
      const target = parseInt(btn.getAttribute('data-screen'));
      if (target === state.currentScreen) {
        btn.classList.add('bg-[#162B48]', 'text-amber-300', 'border-[#C29236]/60', 'shadow-sm');
        btn.classList.remove('bg-[#162B48]/50', 'text-slate-300', 'border-white/10');
      } else {
        btn.classList.remove('bg-[#162B48]', 'text-amber-300', 'border-[#C29236]/60', 'shadow-sm');
        btn.classList.add('bg-[#162B48]/50', 'text-slate-300', 'border-white/10');
      }
    });

    // Update highlights label
    const meta = screenMeta[state.currentScreen] || screenMeta[1];
    const titleEl = document.getElementById('screen-meta-title');
    const subtitleEl = document.getElementById('screen-meta-subtitle');
    const badgeEl = document.getElementById('screen-meta-badge');
    if (titleEl) titleEl.textContent = meta.title;
    if (subtitleEl) subtitleEl.textContent = meta.subtitle;
    if (badgeEl) badgeEl.textContent = state.currentScreen <= 7 ? `Screen ${state.currentScreen} of 7` : 'Live Video Session';
  }

  function renderScreen() {
    const container = document.getElementById('phone-screen-content');
    if (!container) return;

    // Interactive Mode
    switch (state.currentScreen) {
      case 1:
        renderHomeScreen(container);
        break;
      case 2:
        renderNotaryListScreen(container);
        break;
      case 3:
        renderChatScreen(container);
        break;
      case 4:
        renderTemplatesScreen(container);
        break;
      case 5:
        renderChecklistScreen(container);
        break;
      case 6:
        renderPaymentScreen(container);
        break;
      case 7:
        renderB2BDashboardScreen(container);
        break;
      case 8:
        renderVideoCallScreen(container);
        break;
      default:
        renderHomeScreen(container);
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- SCREEN 1: HOME ---
  function renderHomeScreen(container) {
    container.innerHTML = `
      <div class="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
        <!-- Top Header -->
        <div class="bg-slate-900 text-white p-5 pt-10 rounded-b-3xl shadow-md">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-white p-1 shadow-sm flex items-center justify-center shrink-0">
                <img src="assets/logo.png" alt="LegalEase" class="w-full h-full object-contain">
              </div>
              <div>
                <span class="text-[9px] uppercase tracking-wider text-amber-400 font-semibold block leading-none">Legal Solutions, Made Easy.</span>
                <h2 class="text-base font-bold text-white tracking-tight leading-tight mt-0.5">LegalEase</h2>
              </div>
            </div>
            <div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 text-xs font-semibold">
              JS
            </div>
          </div>
          <p class="text-xs text-slate-300 mb-3">Hi! Need on-demand legal counsel today?</p>
          
          <!-- Search Bar -->
          <div class="relative">
            <input type="text" placeholder="Search notaries, templates, guides..." 
              class="w-full pl-9 pr-4 py-2 bg-slate-800/90 text-xs text-white placeholder-slate-400 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
          </div>
        </div>

        <!-- 4 Quick Services Grid -->
        <div class="p-4">
          <div class="grid grid-cols-2 gap-3 mb-4">
            <!-- Templates -->
            <button onclick="goToScreen(4)" class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm text-left hover:border-amber-400 transition-all group flex flex-col justify-between h-28">
              <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <i data-lucide="file-text" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="font-bold text-xs text-slate-900 group-hover:text-amber-600 transition-colors">Templates</h4>
                <p class="text-[10px] text-slate-500">Verified contracts</p>
              </div>
            </button>

            <!-- Notary Chat -->
            <button onclick="goToScreen(2)" class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm text-left hover:border-teal-500 transition-all group flex flex-col justify-between h-28">
              <div class="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <i data-lucide="message-square" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="font-bold text-xs text-slate-900 group-hover:text-teal-600 transition-colors">Notary Chat</h4>
                <p class="text-[10px] text-slate-500">Direct consultation</p>
              </div>
            </button>

            <!-- Business & Retainer -->
            <button onclick="goToScreen(7)" class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm text-left hover:border-blue-500 transition-all group flex flex-col justify-between h-28">
              <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <i data-lucide="briefcase" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">Retainers</h4>
                <p class="text-[10px] text-slate-500">From 150k/mo</p>
              </div>
            </button>

            <!-- Video Call -->
            <button onclick="startConsultation('Notary A, S.H., M.Kn.', 'video')" class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm text-left hover:border-purple-500 transition-all group flex flex-col justify-between h-28">
              <div class="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <i data-lucide="video" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="font-bold text-xs text-slate-900 group-hover:text-purple-600 transition-colors">Video Call</h4>
                <p class="text-[10px] text-slate-500">Encrypted session</p>
              </div>
            </button>
          </div>

          <!-- Promo / Highlight Card -->
          <div class="bg-gradient-to-br from-amber-100/90 to-amber-50 border border-amber-200/80 p-3.5 rounded-2xl mb-4 shadow-sm">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-amber-900">Legal Solutions, Made Easy.</span>
                <p class="text-xs font-semibold text-slate-900 mt-0.5">Instant access to licensed notaries</p>
                <p class="text-[10px] text-slate-600 mt-1">Popular services: PT Setup, PKS Agreement</p>
              </div>
              <button onclick="goToScreen(5)" class="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold hover:bg-amber-700 transition">
                Explore
              </button>
            </div>
          </div>

          <!-- Fast Notary Quick List -->
          <div class="mb-2">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-xs font-bold text-slate-800">Online Notaries On-Duty</h3>
              <button onclick="goToScreen(2)" class="text-[10px] text-amber-600 font-semibold hover:underline">View All</button>
            </div>
            
            <div onclick="goToScreen(3)" class="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between cursor-pointer hover:border-teal-500 transition">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold relative">
                  NA
                  <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900">Notary A, S.H., M.Kn.</h4>
                  <p class="text-[10px] text-slate-500">PT/CV setup, partnership contracts</p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-teal-700">Rp 150k</span>
                <span class="text-[9px] text-slate-400 block">/session</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Phone Bottom Nav -->
        ${renderBottomNav(1)}
      </div>
    `;
  }

  // --- SCREEN 2: CHOOSE A NOTARY ---
  function renderNotaryListScreen(container) {
    const notaries = [
      {
        id: 'A',
        name: 'Notary A, S.H., M.Kn.',
        tag: 'Notary & PPAT • Online',
        specialty: 'PT/CV setup, corporate agreements',
        rate: 'Rp 150.000',
        rateNum: 150000,
        category: 'pt'
      },
      {
        id: 'B',
        name: 'Notary B, S.H., M.Kn.',
        tag: 'Notary & PPAT • Online',
        specialty: 'Property law & land titles (PPAT)',
        rate: 'Rp 200.000',
        rateNum: 200000,
        category: 'property'
      },
      {
        id: 'C',
        name: 'Notary C, S.H., M.Kn.',
        tag: 'Notary & PPAT • Online',
        specialty: 'Startup contracts & seed investments',
        rate: 'Rp 175.000',
        rateNum: 175000,
        category: 'contract'
      }
    ];

    const filtered = state.activeNotaryFilter === 'all' 
      ? notaries 
      : notaries.filter(n => n.category === state.activeNotaryFilter);

    container.innerHTML = `
      <div class="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
        <!-- Top Bar -->
        <div class="bg-slate-900 text-white p-4 pt-10 sticky top-0 z-10 shadow-sm">
          <div class="flex items-center gap-3">
            <button onclick="goToScreen(1)" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white">
              <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>
            <h2 class="text-sm font-bold text-white">Find a Licensed Notary</h2>
          </div>

          <!-- Category Filter Tabs -->
          <div class="flex gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
            <button onclick="filterNotaries('all')" class="px-3 py-1 rounded-full text-[11px] font-semibold transition ${state.activeNotaryFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'}">
              All
            </button>
            <button onclick="filterNotaries('pt')" class="px-3 py-1 rounded-full text-[11px] font-semibold transition ${state.activeNotaryFilter === 'pt' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'}">
              PT/CV
            </button>
            <button onclick="filterNotaries('property')" class="px-3 py-1 rounded-full text-[11px] font-semibold transition ${state.activeNotaryFilter === 'property' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'}">
              Property
            </button>
            <button onclick="filterNotaries('contract')" class="px-3 py-1 rounded-full text-[11px] font-semibold transition ${state.activeNotaryFilter === 'contract' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'}">
              Contracts
            </button>
          </div>
        </div>

        <!-- Notary Cards List -->
        <div class="p-3.5 space-y-3 flex-1">
          <p class="text-[10px] text-emerald-700 uppercase tracking-wider font-bold flex items-center gap-1">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600"></i>
            Accredited by Ministry of Law (Kemenkumham) & BPN
          </p>

          ${filtered.map(n => `
            <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm hover:border-amber-400 transition-all">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs relative shrink-0">
                  ${n.id}
                  <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xs font-bold text-slate-900 truncate">${n.name}</h3>
                  </div>
                  <span class="inline-block text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium my-0.5">${n.tag}</span>
                  <p class="text-[11px] text-slate-600 truncate">${n.specialty}</p>
                  
                  <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span class="text-xs font-bold text-slate-900">${n.rate}</span>
                      <span class="text-[9px] text-slate-400">/session</span>
                    </div>
                    <div class="flex gap-2">
                      <button onclick="startConsultation('${n.name}', 'chat')" class="px-3 py-1 bg-teal-600 text-white text-[11px] font-semibold rounded-lg hover:bg-teal-700 transition flex items-center gap-1 shadow-sm">
                        <i data-lucide="message-square" class="w-3 h-3"></i> Chat
                      </button>
                      <button onclick="startConsultation('${n.name}', 'video')" class="px-3 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg hover:bg-slate-800 transition flex items-center gap-1 shadow-sm">
                        <i data-lucide="video" class="w-3 h-3"></i> Video
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Phone Bottom Nav -->
        ${renderBottomNav(2)}
      </div>
    `;
  }

  window.filterNotaries = function(cat) {
    state.activeNotaryFilter = cat;
    renderNotaryListScreen(document.getElementById('phone-screen-content'));
  };

  window.startConsultation = function(notaryName, mode) {
    state.videoCallNotary = notaryName;
    if (mode === 'video') {
      state.isCallMuted = false;
      state.callSeconds = 0;
      if (state.callTimerInterval) clearInterval(state.callTimerInterval);
      
      showToast(`Connecting encrypted video consultation with ${notaryName}...`, 'info');
      state.currentScreen = 8;
      renderScreen();

      // Start timer
      state.callTimerInterval = setInterval(() => {
        state.callSeconds++;
        const mins = String(Math.floor(state.callSeconds / 60)).padStart(2, '0');
        const secs = String(state.callSeconds % 60).padStart(2, '0');
        const timerEl = document.getElementById('call-timer');
        if (timerEl) {
          timerEl.textContent = `${mins}:${secs}`;
        }
      }, 1000);

    } else {
      showToast(`Opening consultation chat room with ${notaryName}...`, 'success');
      goToScreen(3);
    }
  };

  // --- SCREEN 8: IN-PHONE VIDEO CALL INTERFACE ---
  function renderVideoCallScreen(container) {
    container.innerHTML = `
      <div class="flex-1 flex flex-col video-call-screen text-white overflow-hidden relative">
        <!-- Top Status Call Header -->
        <div class="p-4 pt-10 flex items-center justify-between z-20 bg-gradient-to-b from-slate-950/80 to-transparent">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <h3 class="text-xs font-bold leading-tight">${state.videoCallNotary}</h3>
              <span class="text-[9px] text-teal-300 flex items-center gap-1 font-mono">
                <i data-lucide="lock" class="w-2.5 h-2.5"></i> Encrypted Consultation
              </span>
            </div>
          </div>
          
          <!-- Call Duration Timer -->
          <div class="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] font-mono font-bold text-amber-300" id="call-timer">
            00:00
          </div>
        </div>

        <!-- Main Video Area -->
        <div class="flex-1 flex flex-col items-center justify-center p-6 relative">
          
          <!-- PiP User Camera Feed -->
          <div class="absolute top-4 right-4 pip-video z-20 flex flex-col justify-between p-1.5">
            <span class="text-[8px] font-bold text-white/90 bg-slate-900/60 px-1 py-0.2 rounded w-fit">You</span>
            <div class="w-full flex justify-center pb-1">
              <i data-lucide="user" class="w-5 h-5 text-white/80"></i>
            </div>
          </div>

          <!-- Notary Video Center Display -->
          <div class="relative flex flex-col items-center">
            <div class="w-28 h-28 rounded-full bg-gradient-to-tr from-teal-700 via-teal-600 to-slate-800 p-1 shadow-2xl shadow-teal-500/20 mb-4 relative">
              <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-3xl font-extrabold text-amber-400 border-2 border-white/20">
                NA
              </div>
              <span class="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <i data-lucide="mic" class="w-3 h-3 text-white"></i>
              </span>
            </div>

            <!-- Audio Waveform Visualization -->
            <div class="flex items-center gap-1.5 h-6 mb-3">
              <span class="w-1 bg-amber-400 rounded-full audio-bar-1"></span>
              <span class="w-1 bg-teal-400 rounded-full audio-bar-2"></span>
              <span class="w-1 bg-amber-300 rounded-full audio-bar-3"></span>
              <span class="w-1 bg-teal-300 rounded-full audio-bar-4"></span>
              <span class="w-1 bg-amber-400 rounded-full audio-bar-2"></span>
            </div>

            <h4 class="text-sm font-bold text-white text-center">Notary Speaking</h4>
            <p class="text-[10px] text-slate-300 text-center max-w-[240px] mt-1 leading-relaxed">
              "Please upload the founders' ID & tax documents to the chat, and I will prepare the official deed draft for you."
            </p>
          </div>
        </div>

        <!-- Video Call Bottom Controls Bar -->
        <div class="p-4 pb-8 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent flex items-center justify-around z-20">
          <!-- Toggle Mute -->
          <button onclick="toggleCallMute()" id="btn-call-mute" class="w-11 h-11 rounded-full ${state.isCallMuted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200'} flex items-center justify-center hover:bg-slate-700 transition">
            <i data-lucide="${state.isCallMuted ? 'mic-off' : 'mic'}" class="w-5 h-5"></i>
          </button>

          <!-- Switch to Chat -->
          <button onclick="goToScreen(3)" class="w-11 h-11 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center hover:bg-slate-700 transition">
            <i data-lucide="message-square" class="w-5 h-5"></i>
          </button>

          <!-- Toggle Camera -->
          <button onclick="showToast('Camera flipped', 'info')" class="w-11 h-11 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center hover:bg-slate-700 transition">
            <i data-lucide="camera-reverse" class="w-5 h-5"></i>
          </button>

          <!-- End Call Button -->
          <button onclick="endVideoCall()" class="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition shadow-lg shadow-red-600/30">
            <i data-lucide="phone-off" class="w-5 h-5"></i>
          </button>
        </div>
      </div>
    `;
  }

  window.toggleCallMute = function() {
    state.isCallMuted = !state.isCallMuted;
    showToast(state.isCallMuted ? 'Microphone muted' : 'Microphone unmuted', 'info');
    renderVideoCallScreen(document.getElementById('phone-screen-content'));
  };

  window.endVideoCall = function() {
    if (state.callTimerInterval) {
      clearInterval(state.callTimerInterval);
      state.callTimerInterval = null;
    }
    showToast('Video consultation ended. Session history saved securely.', 'success');
    goToScreen(3);
  };

  // --- SCREEN 3: CONSULTATION ROOM ---
  function renderChatScreen(container) {
    container.innerHTML = `
      <div class="flex-1 flex flex-col bg-slate-100 overflow-hidden">
        <!-- Chat Top Bar -->
        <div class="bg-slate-900 text-white p-3 pt-10 flex items-center justify-between shadow-sm">
          <div class="flex items-center gap-2.5">
            <button onclick="goToScreen(2)" class="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white">
              <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>
            <div class="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold relative">
              A
              <span class="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white"></span>
            </div>
            <div>
              <h3 class="text-xs font-bold leading-tight">Notary A, S.H., M.Kn.</h3>
              <span class="text-[9px] text-emerald-400 flex items-center gap-1">● Online</span>
            </div>
          </div>
          <button onclick="startConsultation('Notary A, S.H., M.Kn.', 'video')" class="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 transition">
            <i data-lucide="video" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Encrypted Security Notice -->
        <div class="bg-teal-50 border-b border-teal-100 py-1.5 px-3 flex items-center justify-center gap-1.5 text-[10px] text-teal-800 font-medium">
          <i data-lucide="lock" class="w-3 h-3 text-teal-600"></i>
          Encrypted & confidential chat (Protected by Notarial Secrecy)
        </div>

        <!-- Chat Messages Container -->
        <div id="chat-messages-box" class="flex-1 p-3 overflow-y-auto space-y-2.5">
          ${state.chatMessages.map(msg => {
            if (msg.sender === 'user') {
              return `
                <div class="flex justify-end">
                  <div class="max-w-[78%] bg-teal-700 text-white p-2.5 rounded-2xl rounded-tr-xs shadow-sm">
                    <p class="text-xs leading-relaxed">${msg.text}</p>
                    <span class="text-[8px] text-teal-200 block text-right mt-1">${msg.time}</span>
                  </div>
                </div>
              `;
            } else if (msg.isAttachment) {
              return `
                <div class="flex justify-start">
                  <div class="max-w-[85%] bg-white p-3 rounded-2xl rounded-tl-xs shadow-sm border border-slate-200">
                    <div class="flex items-center gap-2.5 mb-2">
                      <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <i data-lucide="file-check-2" class="w-4 h-4"></i>
                      </div>
                      <div>
                        <h4 class="text-xs font-bold text-slate-900">${msg.attachmentTitle}</h4>
                        <p class="text-[9px] text-slate-500">${msg.attachmentSubtitle}</p>
                      </div>
                    </div>
                    <div class="flex gap-1.5">
                      <button onclick="goToScreen(${msg.actionTarget})" class="flex-1 py-1.5 bg-amber-600 text-white text-[10px] font-bold rounded-lg hover:bg-amber-700 transition flex items-center justify-center gap-1">
                        <i data-lucide="check-square" class="w-3 h-3"></i> Open Checklist
                      </button>
                      <button onclick="openDocumentPreview('${msg.docKey || 'checklist'}')" class="py-1.5 px-2 bg-slate-800 text-amber-300 text-[10px] font-bold rounded-lg hover:bg-slate-700 transition flex items-center justify-center gap-1">
                        <i data-lucide="eye" class="w-3 h-3"></i> Document
                      </button>
                    </div>
                    <span class="text-[8px] text-slate-400 block text-right mt-1">${msg.time}</span>
                  </div>
                </div>
              `;
            } else {
              return `
                <div class="flex justify-start">
                  <div class="max-w-[78%] bg-white text-slate-900 p-2.5 rounded-2xl rounded-tl-xs shadow-sm border border-slate-200/80">
                    <p class="text-xs leading-relaxed">${msg.text}</p>
                    <span class="text-[8px] text-slate-400 block text-right mt-1">${msg.time}</span>
                  </div>
                </div>
              `;
            }
          }).join('')}
        </div>

        <!-- Chat Input Form -->
        <div class="p-2.5 bg-white border-t border-slate-200">
          <form onsubmit="handleSendChat(event)" class="flex items-center gap-2">
            <input type="text" id="chat-input" placeholder="Type a message to your notary..." 
              class="flex-1 bg-slate-100 text-xs text-slate-900 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600">
            <button type="submit" class="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 transition shadow-sm shrink-0">
              <i data-lucide="send" class="w-4 h-4"></i>
            </button>
          </form>
        </div>
      </div>
    `;

    // Auto scroll chat to bottom
    setTimeout(() => {
      const box = document.getElementById('chat-messages-box');
      if (box) box.scrollTop = box.scrollHeight;
    }, 50);
  }

  window.handleSendChat = function(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;

    const userText = input.value.trim();
    input.value = '';

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    state.chatMessages.push({ sender: 'user', text: userText, time: timeStr });
    renderChatScreen(document.getElementById('phone-screen-content'));

    // Simulated Smart Response from Notary
    setTimeout(() => {
      let replyText = "Understood, I have noted your requirements. We will guide you through the initial legal paperwork step by step.";
      const lower = userText.toLowerCase();
      if (lower.includes('fee') || lower.includes('cost') || lower.includes('price') || lower.includes('rate') || lower.includes('biaya') || lower.includes('harga') || lower.includes('tarif')) {
        replyText = "Our single session rate is Rp 150,000. Alternatively, our Monthly Legal Chat subscription is Rp 150,000/month, and the Full Legal Suite (including video calls and document templates) is Rp 300,000/month.";
      } else if (lower.includes('how long') || lower.includes('time') || lower.includes('duration') || lower.includes('days') || lower.includes('lama') || lower.includes('waktu') || lower.includes('hari')) {
        replyText = "Drafting the establishment deed and obtaining Ministry approval typically takes 3-5 business days once all checklist items are signed.";
      } else if (lower.includes('requirement') || lower.includes('pt') || lower.includes('document') || lower.includes('need') || lower.includes('syarat') || lower.includes('dokumen')) {
        replyText = "Core requirements for PT setup: ID & Tax numbers for at least 2 founders, 3-word company name, KBLI business classification codes, and office domicile address. Please check the Checklist sent above.";
      }

      state.chatMessages.push({ sender: 'notary', text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      renderChatScreen(document.getElementById('phone-screen-content'));
    }, 900);
  };

  // --- SCREEN 4: DOCUMENT TEMPLATES ---
  function renderTemplatesScreen(container) {
    const templates = [
      {
        id: 'coop',
        name: 'Business Cooperation Agreement',
        desc: 'Standard commercial partnership (PKS Kemitraan)',
        price: 'Rp 149.000',
        priceNum: 149000,
        badge: 'Popular'
      },
      {
        id: 'setup',
        name: 'Company Incorporation Package',
        desc: 'Complete PT/CV setup documents & standard bylaws',
        price: 'Rp 299.000',
        priceNum: 299000,
        badge: 'Best Value'
      },
      {
        id: 'investor',
        name: 'Investor & Shareholder Agreement',
        desc: 'Seed stage investment & equity governance',
        price: 'Rp 399.000',
        priceNum: 399000,
        badge: 'Corporate'
      },
      {
        id: 'employment',
        name: 'Standard Employment Contract',
        desc: 'Compliant with Omnibus & Manpower Law (PKWT/PKWTT)',
        price: 'Rp 99.000',
        priceNum: 99000,
        badge: 'Essential'
      }
    ];

    container.innerHTML = `
      <div class="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
        <!-- Top Bar -->
        <div class="bg-slate-900 text-white p-4 pt-10 sticky top-0 z-10 shadow-sm flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button onclick="goToScreen(1)" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white">
              <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>
            <div>
              <h2 class="text-sm font-bold text-white">Document Templates</h2>
              <p class="text-[10px] text-amber-400">Ready to use • Drafted by Licensed Notaries</p>
            </div>
          </div>
          <button onclick="goToScreen(6)" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 relative">
            <i data-lucide="shopping-bag" class="w-4 h-4"></i>
            <span class="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-900 text-[9px] font-bold rounded-full flex items-center justify-center">
              ${state.cart.length}
            </span>
          </button>
        </div>

        <!-- Template Catalog -->
        <div class="p-3.5 space-y-3 flex-1">
          <div class="bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-amber-900">
            <span class="font-medium">Included free with Full Legal Suite (Rp 300k/mo)</span>
            <span class="text-[10px] font-bold text-amber-700">Verified by PPAT</span>
          </div>

          ${templates.map(t => `
            <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm hover:border-amber-500 transition-all flex flex-col justify-between">
              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
                  <i data-lucide="file-check" class="w-4 h-4"></i>
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xs font-bold text-slate-900">${t.name}</h3>
                  </div>
                  <p class="text-[10px] text-slate-500 mt-0.5">${t.desc}</p>
                </div>
              </div>
              <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-slate-900">${t.price}</span>
                  <span class="text-[9px] text-emerald-600 font-semibold block">Format DOCX + PDF</span>
                </div>
                <div class="flex gap-1.5">
                  <button onclick="openDocumentPreview('${t.id}')" class="px-2.5 py-1.5 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg hover:bg-slate-200 transition flex items-center gap-1">
                    <i data-lucide="eye" class="w-3 h-3"></i> Preview
                  </button>
                  <button onclick="addToCartAndCheckout('${t.name}', ${t.priceNum})" class="px-3 py-1.5 bg-amber-600 text-white text-[11px] font-bold rounded-lg hover:bg-amber-700 transition shadow-sm flex items-center gap-1">
                    <i data-lucide="shopping-cart" class="w-3 h-3"></i> Buy
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Phone Bottom Nav -->
        ${renderBottomNav(3)}
      </div>
    `;
  }

  window.addToCartAndCheckout = function(title, price) {
    state.cart = [
      { id: 'item-' + Date.now(), title: title, price: price, qty: 1 }
    ];
    showToast(`Template "${title}" added to cart!`, 'success');
    setTimeout(() => {
      goToScreen(6); // Go to payment
    }, 500);
  };

  // --- SCREEN 5: GUIDES & CHECKLISTS ---
  function renderChecklistScreen(container) {
    const completedCount = state.checklist.filter(item => item.completed).length;
    const totalCount = state.checklist.length;
    const progressPercent = Math.round((completedCount / totalCount) * 100);

    container.innerHTML = `
      <div class="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
        <!-- Top Bar -->
        <div class="bg-slate-900 text-white p-4 pt-10 sticky top-0 z-10 shadow-sm flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button onclick="goToScreen(1)" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white">
              <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>
            <div>
              <h2 class="text-sm font-bold text-white">Guides & Checklists</h2>
              <p class="text-[10px] text-amber-400">Step-by-step PT Setup</p>
            </div>
          </div>
          <button onclick="openDocumentPreview('checklist')" class="px-2.5 py-1 bg-slate-800 text-amber-300 text-[10px] font-bold rounded-lg hover:bg-slate-700 transition flex items-center gap-1">
            <i data-lucide="file-text" class="w-3 h-3"></i> PDF
          </button>
        </div>

        <!-- Progress Card -->
        <div class="p-3.5 flex-1">
          <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm mb-3">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-xs font-bold text-slate-900">PT Setup Progress</h3>
              <span class="text-xs font-bold text-teal-700">${completedCount} of ${totalCount} steps completed</span>
            </div>
            
            <!-- Progress Bar -->
            <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div class="h-full bg-teal-600 transition-all duration-500 rounded-full" style="width: ${progressPercent}%;"></div>
            </div>
            <p class="text-[10px] text-slate-500">${progressPercent}% completed. Tap checklist items to update progress.</p>
          </div>

          <!-- Interactive Steps -->
          <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm mb-3 space-y-2.5">
            <h4 class="text-xs font-bold text-slate-800 mb-1">Incorporation Roadmap:</h4>
            ${state.checklist.map((step, idx) => `
              <div onclick="toggleChecklistStep(${step.id})" class="flex items-start gap-2.5 p-2 rounded-xl transition cursor-pointer hover:bg-slate-50 ${step.completed ? 'bg-emerald-50/50' : ''}">
                <div class="w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 transition ${step.completed ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white text-transparent'}">
                  <i data-lucide="check" class="w-3.5 h-3.5"></i>
                </div>
                <div class="flex-1 text-left">
                  <span class="text-xs ${step.completed ? 'font-semibold text-slate-900 line-through text-slate-500' : 'font-medium text-slate-800'}">
                    ${idx + 1}. ${step.text}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Follow-up Reminder Card -->
          <div class="bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 rounded-2xl p-3.5 shadow-sm">
            <div class="flex items-start gap-2.5">
              <div class="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                <i data-lucide="calendar" class="w-4 h-4"></i>
              </div>
              <div class="flex-1">
                <span class="text-[9px] font-bold uppercase tracking-wider text-amber-800">Follow-up reminder</span>
                <h4 class="text-xs font-bold text-slate-900 mt-0.5">Deed signing schedule from notary</h4>
                <p class="text-[10px] text-slate-600 mt-1">Physical deed signing appointment with Notary A will be scheduled after document verification is complete.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Phone Bottom Nav -->
        ${renderBottomNav(3)}
      </div>
    `;
  }

  window.toggleChecklistStep = function(id) {
    const item = state.checklist.find(i => i.id === id);
    if (item) {
      item.completed = !item.completed;
      renderChecklistScreen(document.getElementById('phone-screen-content'));
      if (item.completed) {
        showToast(`Step "${item.text.split('(')[0].trim()}" completed!`, 'success');
      }
    }
  };

  // --- SCREEN 6: PAYMENT GATEWAY ---
  function renderPaymentScreen(container) {
    const totalAmount = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const formattedTotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalAmount);

    container.innerHTML = `
      <div class="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
        <!-- Top Bar -->
        <div class="bg-slate-900 text-white p-4 pt-10 sticky top-0 z-10 shadow-sm flex items-center gap-3">
          <button onclick="goToScreen(1)" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white">
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
          </button>
          <div>
            <h2 class="text-sm font-bold text-white">Payment Checkout</h2>
            <p class="text-[10px] text-amber-400">Integrated with Bank & E-Wallet Gateway</p>
          </div>
        </div>

        <div class="p-3.5 space-y-3 flex-1">
          <!-- ORDER SUMMARY -->
          <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm">
            <h3 class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">ORDER SUMMARY</h3>
            <div class="space-y-2 text-xs text-slate-700">
              ${state.cart.map(item => `
                <div class="flex justify-between items-start gap-2">
                  <span class="font-medium text-slate-800">${item.title}</span>
                  <span class="font-bold text-slate-900 whitespace-nowrap">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price)}</span>
                </div>
              `).join('')}
            </div>
            <div class="border-t border-slate-100 mt-2.5 pt-2 flex justify-between items-center">
              <span class="text-xs font-bold text-slate-900">Total Due</span>
              <span class="text-sm font-extrabold text-amber-600">${formattedTotal}</span>
            </div>
          </div>

          <!-- PAYMENT METHODS -->
          <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm">
            <h3 class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">PAYMENT METHOD</h3>
            <div class="space-y-2">
              <!-- VA -->
              <label onclick="selectPayment('va')" class="flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${state.selectedPaymentMethod === 'va' ? 'border-teal-600 bg-teal-50/50' : 'border-slate-200 hover:bg-slate-50'}">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded-full border flex items-center justify-center ${state.selectedPaymentMethod === 'va' ? 'border-teal-600 bg-teal-600' : 'border-slate-300'}">
                    <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                  </div>
                  <span class="text-xs font-semibold text-slate-800">Bank Virtual Account</span>
                </div>
                <span class="text-[10px] text-slate-400 font-mono">BCA / Mandiri / BRI</span>
              </label>

              <!-- E-Wallet -->
              <label onclick="selectPayment('ewallet')" class="flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${state.selectedPaymentMethod === 'ewallet' ? 'border-teal-600 bg-teal-50/50' : 'border-slate-200 hover:bg-slate-50'}">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded-full border flex items-center justify-center ${state.selectedPaymentMethod === 'ewallet' ? 'border-teal-600 bg-teal-600' : 'border-slate-300'}">
                    <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                  </div>
                  <span class="text-xs font-semibold text-slate-800">E-Wallet</span>
                </div>
                <span class="text-[10px] text-slate-400">GoPay / OVO / Dana</span>
              </label>

              <!-- QRIS -->
              <label onclick="selectPayment('qris')" class="flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${state.selectedPaymentMethod === 'qris' ? 'border-teal-600 bg-teal-50/50' : 'border-slate-200 hover:bg-slate-50'}">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded-full border flex items-center justify-center ${state.selectedPaymentMethod === 'qris' ? 'border-teal-600 bg-teal-600' : 'border-slate-300'}">
                    <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                  </div>
                  <span class="text-xs font-semibold text-slate-800">QRIS Standard</span>
                </div>
                <span class="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Instant</span>
              </label>

              <!-- Card -->
              <label onclick="selectPayment('card')" class="flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${state.selectedPaymentMethod === 'card' ? 'border-teal-600 bg-teal-50/50' : 'border-slate-200 hover:bg-slate-50'}">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded-full border flex items-center justify-center ${state.selectedPaymentMethod === 'card' ? 'border-teal-600 bg-teal-600' : 'border-slate-300'}">
                    <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                  </div>
                  <span class="text-xs font-semibold text-slate-800">Debit / Credit Card</span>
                </div>
                <span class="text-[10px] text-slate-400">Visa / Mastercard</span>
              </label>
            </div>
          </div>

          <!-- PAY NOW BUTTON -->
          <button onclick="handleProcessPayment()" class="w-full py-3 bg-slate-900 text-amber-400 font-bold text-xs rounded-xl shadow-md hover:bg-slate-800 transition flex items-center justify-center gap-1.5">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i>
            ${totalAmount === 0 ? 'Activate 3-Day Free Trial (Rp 0)' : `Confirm & Pay (${formattedTotal})`}
          </button>

          <p class="text-[9px] text-center text-slate-400 flex items-center justify-center gap-1">
            <i data-lucide="lock" class="w-3 h-3 text-slate-400"></i>
            Encrypted payment processing via certified payment gateway
          </p>
        </div>

        <!-- Phone Bottom Nav -->
        ${renderBottomNav(3)}
      </div>
    `;
  }

  window.selectPayment = function(method) {
    state.selectedPaymentMethod = method;
    renderPaymentScreen(document.getElementById('phone-screen-content'));
  };

  window.handleProcessPayment = function() {
    showToast('Processing transaction with Payment Gateway...', 'info');
    setTimeout(() => {
      alert('🎉 Payment Confirmed! Your LegalEase subscription/booking has been activated. The assigned notary and legal team are ready.');
      state.activePlan = 'full';
      goToScreen(7); // View active subscription account
    }, 700);
  };

  // --- SCREEN 7: CLIENT ACCOUNT & RETAINER SUBSCRIPTIONS ---
  function renderB2BDashboardScreen(container) {
    const plans = {
      trial: { 
        name: '3-Day Free Trial', 
        price: 'IDR 0 (Free)', 
        badge: 'Trial Active', 
        call: false, 
        chat: true, 
        templates: false,
        desc: '3-day exploration with notary chat consultation.'
      },
      chat: { 
        name: 'Legal Chat Essential', 
        price: 'IDR 150,000 / mo', 
        badge: 'Active Subscription', 
        call: false, 
        chat: true, 
        templates: false,
        desc: 'Unlimited legal consultation via Chat (No templates/calls).'
      },
      full: { 
        name: 'Full Legal Suite', 
        price: 'IDR 300,000 / mo', 
        badge: 'Active Subscription', 
        call: true, 
        chat: true, 
        templates: true,
        desc: 'Complete Retainer: Video Calls + Chat + Document Templates.'
      }
    };

    const current = plans[state.activePlan || 'full'];

    container.innerHTML = `
      <div class="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
        <!-- Top Bar -->
        <div class="bg-slate-900 text-white p-4 pt-10 sticky top-0 z-10 shadow-sm flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button onclick="goToScreen(1)" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white">
              <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>
            <div>
              <h2 class="text-sm font-bold text-white">Client Account</h2>
              <p class="text-[10px] text-slate-400">PT Solusi Maju Bersama • ID: LE-9281</p>
            </div>
          </div>
          <span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-bold">
            ${current.badge}
          </span>
        </div>

        <div class="p-3.5 space-y-3 flex-1">
          <!-- Active Subscription Plan Card -->
          <div class="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl p-4 border border-amber-200/90 shadow-sm">
            <div class="flex justify-between items-start mb-2">
              <div>
                <span class="text-[9px] font-bold uppercase tracking-wider text-amber-800">Current Retainer Plan</span>
                <h3 class="text-xs font-bold text-slate-900 mt-0.5">${current.name}</h3>
              </div>
              <span class="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded-full">
                ${current.price}
              </span>
            </div>

            <p class="text-[10px] text-slate-600 mb-2 leading-relaxed">${current.desc}</p>

            <div class="space-y-1.5 text-[11px] text-slate-700 mt-2">
              <div class="flex items-center gap-2">
                <i data-lucide="${current.chat ? 'check-circle-2' : 'x-circle'}" class="w-3.5 h-3.5 ${current.chat ? 'text-teal-600' : 'text-slate-400'}"></i>
                <span class="${current.chat ? 'font-medium' : 'line-through text-slate-400'}">Legal Consultation via Chat</span>
              </div>
              <div class="flex items-center gap-2">
                <i data-lucide="${current.call ? 'check-circle-2' : 'x-circle'}" class="w-3.5 h-3.5 ${current.call ? 'text-teal-600' : 'text-slate-400'}"></i>
                <span class="${current.call ? 'font-medium' : 'line-through text-slate-400'}">Encrypted 1-on-1 Video Call Consultations</span>
              </div>
              <div class="flex items-center gap-2">
                <i data-lucide="${current.templates ? 'check-circle-2' : 'x-circle'}" class="w-3.5 h-3.5 ${current.templates ? 'text-teal-600' : 'text-slate-400'}"></i>
                <span class="${current.templates ? 'font-medium' : 'line-through text-slate-400'}">Verified Legal Document Templates (DOCX/PDF)</span>
              </div>
            </div>

            <!-- Quick Plan Selector Pill Tabs -->
            <div class="mt-3 pt-2.5 border-t border-amber-200/60">
              <span class="text-[9px] text-slate-600 font-bold uppercase block mb-1.5">Switch Active Tier:</span>
              <div class="grid grid-cols-3 gap-1">
                <button onclick="switchActivePlan('trial')" class="py-1 text-[9px] font-bold rounded-lg transition ${state.activePlan === 'trial' ? 'bg-[#0C1E36] text-amber-300' : 'bg-white text-slate-700 border border-amber-200 hover:bg-slate-50'}">
                  Free Trial
                </button>
                <button onclick="switchActivePlan('chat')" class="py-1 text-[9px] font-bold rounded-lg transition ${state.activePlan === 'chat' ? 'bg-[#0C1E36] text-amber-300' : 'bg-white text-slate-700 border border-amber-200 hover:bg-slate-50'}">
                  Chat (150k)
                </button>
                <button onclick="switchActivePlan('full')" class="py-1 text-[9px] font-bold rounded-lg transition ${state.activePlan === 'full' ? 'bg-[#0C1E36] text-amber-300' : 'bg-white text-slate-700 border border-amber-200 hover:bg-slate-50'}">
                  Full (300k)
                </button>
              </div>
            </div>

            <div class="mt-2.5 pt-2 border-t border-amber-200/60 flex justify-between items-center text-[10px]">
              <span class="text-slate-500">Auto-renews monthly</span>
              <span class="text-amber-800 font-semibold">Next billing: Nov 28</span>
            </div>
          </div>

          <!-- CORPORATE DOCUMENT REQUESTS -->
          <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm">
            <h3 class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">ACTIVE CORPORATE FILINGS</h3>
            
            <div class="space-y-2.5">
              <!-- Item 1 -->
              <div class="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <i data-lucide="file-edit" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-slate-900">Articles of Association Amendment</h4>
                    <span class="text-[9px] text-slate-400">Capital increase deed filing</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold">
                  In review
                </span>
              </div>

              <!-- Item 2 -->
              <div class="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <i data-lucide="file-check-2" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-slate-900">Investor Agreement (PKS)</h4>
                    <span class="text-[9px] text-slate-400">Seed round legal documentation</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                  Completed
                </span>
              </div>

              <!-- Item 3 -->
              <div class="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <i data-lucide="clock" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-slate-900">EGMS Circular Resolution</h4>
                    <span class="text-[9px] text-slate-400">Keputusan Sirkuler Pemegang Saham</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold">
                  Awaiting sign
                </span>
              </div>
            </div>

            <button onclick="showToast('Corporate filing request initiated with on-duty Notary.', 'info')" class="w-full mt-3 py-2 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 font-semibold hover:border-amber-500 hover:text-amber-700 transition flex items-center justify-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Request New Corporate Filing
            </button>
          </div>
        </div>

        <!-- Phone Bottom Nav -->
        ${renderBottomNav(4)}
      </div>
    `;
  }

  window.switchActivePlan = function(planKey) {
    state.activePlan = planKey;
    showToast(`Switched active tier to: ${planKey === 'trial' ? '3-Day Free Trial' : planKey === 'chat' ? 'Legal Chat (150k)' : 'Full Suite (300k)'}`, 'success');
    renderB2BDashboardScreen(document.getElementById('phone-screen-content'));
  };

  // --- REUSABLE PHONE BOTTOM NAVIGATION BAR ---
  function renderBottomNav(activeTab) {
    // 1: Home, 2: Consult, 3: Documents, 4: Profile/Business
    return `
      <div class="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-between z-20 shrink-0">
        <button onclick="goToScreen(1)" class="flex flex-col items-center gap-0.5 ${activeTab === 1 ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'}">
          <i data-lucide="home" class="w-4 h-4"></i>
          <span class="text-[9px]">Home</span>
        </button>

        <button onclick="goToScreen(2)" class="flex flex-col items-center gap-0.5 ${activeTab === 2 ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'}">
          <i data-lucide="message-square" class="w-4 h-4"></i>
          <span class="text-[9px]">Consult</span>
        </button>

        <button onclick="goToScreen(4)" class="flex flex-col items-center gap-0.5 ${activeTab === 3 ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'}">
          <i data-lucide="file-text" class="w-4 h-4"></i>
          <span class="text-[9px]">Documents</span>
        </button>

        <button onclick="goToScreen(7)" class="flex flex-col items-center gap-0.5 ${activeTab === 4 ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'}">
          <i data-lucide="user" class="w-4 h-4"></i>
          <span class="text-[9px]">Account</span>
        </button>
      </div>
    `;
  }

  // --- FORMAL LEGAL DOCUMENT VIEWER MODAL (PARCHMENT AESTHETIC) ---
  const legalDocs = {
    coop: {
      title: "PERJANJIAN KERJASAMA KEMITRAAN BISNIS (PKS)",
      sub: "Nomor Dokumen: 042/PKS-LE/X/2026",
      parties: "Pihak Pertama: PT Solusi Maju Bersama | Pihak Kedua: Rekanan Mitra Usaha",
      clauses: [
        {
          pasal: "Pasal 1 — Ruang Lingkup Kerjasama",
          isi: "Para Pihak sepakat untuk menjalin kemitraan strategis dalam pengembangan teknologi hukum terintegrasi serta distribusi layanan bantuan hukum digital bagi pelaku usaha di seluruh Indonesia."
        },
        {
          pasal: "Pasal 2 — Hak dan Kewajiban",
          isi: "Pihak Pertama berkewajiban menyediakan infrastruktur platform LegalEase, sedangkan Pihak Kedua menyediakan keahlian hukum dan verifikasi legalitas dokumen secara berkala dan tepat waktu."
        },
        {
          pasal: "Pasal 3 — Kerahasiaan Informasi (Non-Disclosure)",
          isi: "Segala data, rahasia dagang, pembukuan, dan materi hukum yang dipertukarkan dalam pelaksanaan perjanjian ini wajib dirahasiakan dan tidak boleh disebarluaskan kepada pihak ketiga tanpa persetujuan tertulis."
        },
        {
          pasal: "Pasal 4 — Penyelesaian Sengketa",
          isi: "Apabila timbul perselisihan di kemudian hari, Para Pihak sepakat menyelesaikan secara musyawarah untuk mufakat. Apabila tidak tercapai mufakat, perselisihan akan diselesaikan melalui Badan Arbitrase Nasional Indonesia (BANI)."
        }
      ]
    },
    setup: {
      title: "DRAF AKTA PENDIRIAN PERSEROAN TERBATAS (PT)",
      sub: "Kemenkumham RI — Standar Notaris & PPAT Berlisensi",
      parties: "Para Penghadap: Para Pendiri Perseroan Terbatas",
      clauses: [
        {
          pasal: "Pasal 1 — Nama dan Tempat Kedudukan",
          isi: "Perseroan ini bernama PT Solusi Legal Mandiri, berkedudukan di wilayah hukum Republik Indonesia dengan kantor pusat yang ditetapkan oleh Direksi."
        },
        {
          pasal: "Pasal 2 — Jangka Waktu Berdiri",
          isi: "Perseroan didirikan untuk jangka waktu tidak terbatas terhitung sejak tanggal diterbitkannya Keputusan Menteri Hukum dan Hak Asasi Manusia."
        },
        {
          pasal: "Pasal 3 — Maksud, Tujuan dan Kegiatan Usaha",
          isi: "Maksud dan tujuan perseroan ini adalah menjalankan aktivitas konsultasi manajemen, portal web legal, perizinan berusaha, dan aktivitas pendukung bisnis sesuai Klasifikasi Baku Lapangan Usaha Indonesia (KBLI)."
        },
        {
          pasal: "Pasal 4 — Modal Perseroan",
          isi: "Modal dasar perseroan ditetapkan sekurang-kurangnya sebesar Rp 50.000.000 (lima puluh juta rupiah), di mana 25% (dua puluh lima persen) daripadanya telah disetor penuh oleh para pemegang saham."
        }
      ]
    },
    investor: {
      title: "INVESTOR & SHAREHOLDER AGREEMENT",
      sub: "Draft Investasi Saham Seri Awal (Seed Stage)",
      parties: "Antara: Pendiri (Founders) dan Calon Investor / Pemodal Ventura",
      clauses: [
        {
          pasal: "Pasal 1 — Nilai Investasi dan Kepemilikan Saham",
          isi: "Investor setuju menempatkan sejumlah modal investasi untuk ditukarkan dengan sejumlah persentase saham preferen di dalam perseroan."
        },
        {
          pasal: "Pasal 2 — Hak Suara dan Kursi Dewan Komisaris",
          isi: "Investor berhak menunjuk sekurang-kurangnya 1 (satu) orang perwakilan sebagai Komisaris Perseroan untuk mengawasi tata kelola keuangan."
        },
        {
          pasal: "Pasal 3 — Hak Penolakan Pertama (Right of First Refusal)",
          isi: "Setiap pemegang saham yang hendak mengalihkan atau menjual sahamnya wajib menawarkan terlebih dahulu kepada pemegang saham lainnya sebelum ditawarkan kepada pihak luar."
        }
      ]
    },
    employment: {
      title: "PERJANJIAN KERJA WAKTU TERTENTU (PKWT)",
      sub: "Sesuai UU Ketenagakerjaan & PP No. 35 Tahun 2021",
      parties: "Antara Perusahaan (Pemberi Kerja) dan Pekerja",
      clauses: [
        {
          pasal: "Pasal 1 — Posisi dan Uraian Tugas",
          isi: "Perusahaan mempekerjakan Karyawan sebagai Legal Specialist dengan tanggung jawab melakukan penyusunan dan penelaahan kontrak kerja sama."
        },
        {
          pasal: "Pasal 2 — Upah dan Fasilitas",
          isi: "Karyawan berhak menerima gaji pokok bulanan, tunjangan operasional, serta perlindungan jaminan sosial BPJS Ketenagakerjaan dan Kesehatan."
        },
        {
          pasal: "Pasal 3 — Waktu Kerja dan Istirahat",
          isi: "Waktu kerja diatur selama 8 jam sehari atau 40 jam seminggu sesuai ketentuan perundang-undangan ketenagakerjaan yang berlaku."
        }
      ]
    },
    checklist: {
      title: "CHECKLIST VERIFIKASI RESMI PENDIRIAN PT",
      sub: "Panduan Terpadu Verifikasi Notaris & PPAT Rekanan LegalEase",
      parties: "Dikeluarkan oleh: Kantor Notaris & PPAT Rekanan LegalEase",
      clauses: [
        {
          pasal: "1. Data Identitas & Pajak",
          isi: "KTP Elektronik dan Kartu NPWP yang valid dari minimal 2 (dua) orang Warga Negara Indonesia (WNI) selaku pendiri dan pemegang saham."
        },
        {
          pasal: "2. Penetapan Nama Perusahaan",
          isi: "Pilihan nama PT terdiri dari minimal 3 (tiga) suku kata berbahasa Indonesia yang belum digunakan oleh entitas lain di database Ditjen AHU Kemenkumham."
        },
        {
          pasal: "3. Domisili dan Alamat Kantor",
          isi: "Bukti kepemilikan atau sewa tempat usaha (gedung kantor / virtual office) yang berada dalam zonasi perkantoran/komersial."
        },
        {
          pasal: "4. Perizinan OSS RBA & NIB",
          isi: "Penerbitan Nomor Induk Berusaha (NIB) dan izin operasional berbasis risiko (Risk-Based Approach) melalui sistem Online Single Submission (OSS)."
        }
      ]
    }
  };

  window.openDocumentPreview = function(docKey) {
    const doc = legalDocs[docKey] || legalDocs['coop'];
    const modal = document.getElementById('doc-preview-modal');
    const titleEl = document.getElementById('doc-preview-title');
    const subEl = document.getElementById('doc-preview-sub');
    const partiesEl = document.getElementById('doc-preview-parties');
    const bodyEl = document.getElementById('doc-preview-body');

    if (titleEl) titleEl.textContent = doc.title;
    if (subEl) subEl.textContent = doc.sub;
    if (partiesEl) partiesEl.textContent = doc.parties;

    if (bodyEl) {
      bodyEl.innerHTML = doc.clauses.map(c => `
        <div class="mb-4">
          <h5 class="font-bold text-xs text-slate-900 tracking-wide">${c.pasal}</h5>
          <p class="text-xs text-slate-700 leading-relaxed mt-1 text-justify">${c.isi}</p>
        </div>
      `).join('');
    }

    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeDocumentPreview = function() {
    const modal = document.getElementById('doc-preview-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  // --- PLAN CHECKOUT HELPER ---
  window.selectPlanAndCheckout = function(planKey) {
    if (planKey === 'trial') {
      state.cart = [
        { id: 'plan-trial', title: '3-Day Free Trial (Platform Access)', price: 0, qty: 1 }
      ];
      state.activePlan = 'trial';
      showToast('🎉 3-Day Free Trial selected! No credit card required.', 'success');
      goToScreen(6);
    } else if (planKey === 'chat') {
      state.cart = [
        { id: 'plan-chat', title: 'Monthly Legal Chat Plan (1 Month)', price: 150000, qty: 1 }
      ];
      state.activePlan = 'chat';
      showToast('Monthly Legal Chat Plan (IDR 150,000) selected!', 'info');
      goToScreen(6);
    } else if (planKey === 'full') {
      state.cart = [
        { id: 'plan-full', title: 'Monthly Full Legal Suite (Call + Chat + Templates)', price: 300000, qty: 1 }
      ];
      state.activePlan = 'full';
      showToast('Full Legal Suite (IDR 300,000) selected!', 'success');
      goToScreen(6);
    }
    const simulatorEl = document.getElementById('simulator');
    if (simulatorEl) {
      simulatorEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- FAQ ACCORDION TOGGLE ---
  window.toggleFaq = function(faqId) {
    const content = document.getElementById('faq-content-' + faqId);
    const icon = document.getElementById('faq-icon-' + faqId);
    if (!content) return;
    const isHidden = content.classList.contains('hidden');
    document.querySelectorAll('.faq-answer').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.faq-chevron').forEach(el => el.classList.remove('rotate-180'));
    if (isHidden) {
      content.classList.remove('hidden');
      icon?.classList.add('rotate-180');
    }
  };

  // --- TOAST NOTIFICATIONS ---
  window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colorClasses = type === 'success' 
      ? 'bg-emerald-800 text-emerald-100 border-emerald-600'
      : type === 'error'
      ? 'bg-red-800 text-red-100 border-red-600'
      : 'bg-slate-800 text-slate-100 border-amber-500';

    toast.className = `flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg text-xs font-medium transition-all duration-300 transform translate-y-2 opacity-0 ${colorClasses}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}" class="w-4 h-4 shrink-0"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // --- MOBILE MENU TOGGLE ---
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Initialize Screen
  renderScreen();
  updateScreenNavButtons();
});
