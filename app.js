/**
 * LegalEase - Interactive Application Script
 * Prototype & Showcase Website
 * Group 4 - Economic Survival
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons if available
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // --- STATE MANAGEMENT ---
  const state = {
    currentScreen: 1, // 1 to 7
    screenViewMode: 'interactive', // 'interactive' or 'screenshot'
    activeNotaryFilter: 'all',
    checklist: [
      { id: 1, text: "Prepare founders' ID & tax no. (KTP & NPWP Pendiri)", completed: true },
      { id: 2, text: "Set name & business activities (Nama PT & KBLI)", completed: true },
      { id: 3, text: "Set authorized capital (Penetapan Modal Dasar & Disetor)", completed: true },
      { id: 4, text: "Sign the deed at the notary (Tanda Tangan Akta Notaris)", completed: false },
      { id: 5, text: "Legal entity approval (SK Pengesahan Kemenkumham)", completed: false },
      { id: 6, text: "Get NIB via OSS (Penerbitan NIB & Izin Berusaha)", completed: false }
    ],
    cart: [
      { id: 'video-consult', title: 'Video consultation - Notary A', price: 150000, qty: 1 },
      { id: 'coop-template', title: 'Coop. Agreement Template', price: 149000, qty: 1 }
    ],
    selectedPaymentMethod: 'va',
    chatMessages: [
      { sender: 'user', text: 'I want to set up a PT for my startup. What documents do I need to prepare?', time: '10:14 AM' },
      { sender: 'notary', text: "Hello! We'll start with the founders' data and business capital. I'll send you the checklist.", time: '10:15 AM' },
      { 
        sender: 'notary', 
        isAttachment: true, 
        attachmentTitle: 'PT Setup Checklist', 
        attachmentSubtitle: 'Automated guide & checklist (PDF)',
        actionTarget: 5,
        time: '10:15 AM' 
      },
      { sender: 'user', text: 'Okay, thank you! How long does the deed signing usually take?', time: '10:16 AM' }
    ],
    currentSlide: 1,
    totalSlides: 7
  };

  // Screen Names & Meta
  const screenMeta = {
    1: { title: "1. Home Dashboard", subtitle: "Instant access to notaries and four main services on one screen (Value Propositions)." },
    2: { title: "2. Choose a Notary", subtitle: "Licensed notaries & PPAT with specialties and per-session consultation rates." },
    3: { title: "3. Consultation Room", subtitle: "Live chat and video consultation with secure and confidential data, plus automatic checklist delivery." },
    4: { title: "4. Document Templates", subtitle: "Ready-to-use legal templates for startups and growing businesses." },
    5: { title: "5. Guides & Checklists", subtitle: "Step-by-step guides, checklists, and follow-up reminders keep users on track." },
    6: { title: "6. Payment Gateway", subtitle: "Secure checkout via bank transfer, e-wallet, QRIS, or card." },
    7: { title: "7. Business Dashboard (B2B)", subtitle: "Monthly B2B subscription (from Rp 1.500.000/month) + corporate document service." }
  };

  const originalScreens = {
    1: 'assets/screens/screen_1_home.png',
    2: 'assets/screens/screen_2_choose_notary.png',
    3: 'assets/screens/screen_3_consultation_room.png',
    4: 'assets/screens/screen_4_document_templates.png',
    5: 'assets/screens/screen_5_guides_checklists.png',
    6: 'assets/screens/screen_6_payment.png',
    7: 'assets/screens/screen_7_business_account.png'
  };

  // --- SCREEN NAVIGATION ---
  window.goToScreen = function(screenNum) {
    if (screenNum < 1 || screenNum > 7) return;
    state.currentScreen = screenNum;
    renderScreen();
    updateScreenNavButtons();
  };

  window.toggleViewMode = function(mode) {
    state.screenViewMode = mode;
    const btnInteractive = document.getElementById('btn-mode-interactive');
    const btnScreenshot = document.getElementById('btn-mode-screenshot');

    if (mode === 'interactive') {
      btnInteractive?.classList.add('bg-amber-600', 'text-white', 'shadow-sm');
      btnInteractive?.classList.remove('text-slate-600', 'hover:bg-slate-100');
      btnScreenshot?.classList.remove('bg-amber-600', 'text-white', 'shadow-sm');
      btnScreenshot?.classList.add('text-slate-600', 'hover:bg-slate-100');
    } else {
      btnScreenshot?.classList.add('bg-amber-600', 'text-white', 'shadow-sm');
      btnScreenshot?.classList.remove('text-slate-600', 'hover:bg-slate-100');
      btnInteractive?.classList.remove('bg-amber-600', 'text-white', 'shadow-sm');
      btnInteractive?.classList.add('text-slate-600', 'hover:bg-slate-100');
    }
    renderScreen();
  };

  function updateScreenNavButtons() {
    document.querySelectorAll('.screen-select-btn').forEach(btn => {
      const target = parseInt(btn.getAttribute('data-screen'));
      if (target === state.currentScreen) {
        btn.classList.add('bg-slate-900', 'text-amber-400', 'border-amber-400/40', 'shadow-md');
        btn.classList.remove('bg-slate-800/60', 'text-slate-300', 'border-slate-700');
      } else {
        btn.classList.remove('bg-slate-900', 'text-amber-400', 'border-amber-400/40', 'shadow-md');
        btn.classList.add('bg-slate-800/60', 'text-slate-300', 'border-slate-700');
      }
    });

    // Update highlights label
    const meta = screenMeta[state.currentScreen];
    const titleEl = document.getElementById('screen-meta-title');
    const subtitleEl = document.getElementById('screen-meta-subtitle');
    const badgeEl = document.getElementById('screen-meta-badge');
    if (titleEl) titleEl.textContent = meta.title;
    if (subtitleEl) subtitleEl.textContent = meta.subtitle;
    if (badgeEl) badgeEl.textContent = `Screen ${state.currentScreen} of 7`;
  }

  function renderScreen() {
    const container = document.getElementById('phone-screen-content');
    if (!container) return;

    // If Screenshot Mode: render original PDF screen image
    if (state.screenViewMode === 'screenshot') {
      container.innerHTML = `
        <div class="h-full w-full overflow-y-auto bg-slate-900 flex flex-col items-center justify-start p-2">
          <div class="w-full text-center py-2 text-xs font-semibold text-amber-300 uppercase tracking-wider bg-slate-800/90 rounded-lg mb-2">
            Dokumen Asli (PDF Prototype Mockup)
          </div>
          <img src="${originalScreens[state.currentScreen]}" alt="Screen ${state.currentScreen}" class="w-full object-contain rounded-xl shadow-lg border border-slate-700" />
        </div>
      `;
      return;
    }

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
          <p class="text-xs text-slate-300 mb-3">Hi! Need legal help today?</p>
          
          <!-- Search Bar -->
          <div class="relative">
            <input type="text" placeholder="Search notaries, documents, guides" 
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
                <p class="text-[10px] text-slate-500">Ready to use</p>
              </div>
            </button>

            <!-- Notary Chat -->
            <button onclick="goToScreen(2)" class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm text-left hover:border-teal-500 transition-all group flex flex-col justify-between h-28">
              <div class="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <i data-lucide="message-square" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="font-bold text-xs text-slate-900 group-hover:text-teal-600 transition-colors">Notary Chat</h4>
                <p class="text-[10px] text-slate-500">Quick consult</p>
              </div>
            </button>

            <!-- Business -->
            <button onclick="goToScreen(7)" class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm text-left hover:border-blue-500 transition-all group flex flex-col justify-between h-28">
              <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <i data-lucide="briefcase" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">Business</h4>
                <p class="text-[10px] text-slate-500">For companies</p>
              </div>
            </button>

            <!-- Video Call -->
            <button onclick="goToScreen(2)" class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm text-left hover:border-purple-500 transition-all group flex flex-col justify-between h-28">
              <div class="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <i data-lucide="video" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="font-bold text-xs text-slate-900 group-hover:text-purple-600 transition-colors">Video Call</h4>
                <p class="text-[10px] text-slate-500">Online meeting</p>
              </div>
            </button>
          </div>

          <!-- Promo / Highlight Card -->
          <div class="bg-gradient-to-br from-amber-100/90 to-amber-50 border border-amber-200/80 p-3.5 rounded-2xl mb-4 shadow-sm">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-amber-900">Legal Solutions, Made Easy.</span>
                <p class="text-xs font-semibold text-slate-900 mt-0.5">Instant access to licensed notaries</p>
                <p class="text-[10px] text-slate-600 mt-1">Popular guides: PT Setup, Partnership Agreement</p>
              </div>
              <button onclick="goToScreen(5)" class="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold hover:bg-amber-700 transition">
                Lihat
              </button>
            </div>
          </div>

          <!-- Fast Notary Quick List -->
          <div class="mb-2">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-xs font-bold text-slate-800">Notaris Online Terdekat</h3>
              <button onclick="goToScreen(2)" class="text-[10px] text-amber-600 font-semibold hover:underline">Lihat Semua</button>
            </div>
            
            <div onclick="goToScreen(3)" class="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between cursor-pointer hover:border-teal-500 transition">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold relative">
                  NA
                  <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900">Notary A, S.H., M.Kn.</h4>
                  <p class="text-[10px] text-slate-500">PT/CV setup, business agreements</p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-teal-700">Rp 150k</span>
                <span class="text-[9px] text-slate-400 block">/sesi</span>
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
        specialty: 'PT/CV setup, business agreements',
        rate: 'Rp 150.000',
        rateNum: 150000,
        category: 'pt'
      },
      {
        id: 'B',
        name: 'Notary B, S.H., M.Kn.',
        tag: 'Notary & PPAT • Online',
        specialty: 'Property law (PPAT)',
        rate: 'Rp 200.000',
        rateNum: 200000,
        category: 'property'
      },
      {
        id: 'C',
        name: 'Notary C, S.H., M.Kn.',
        tag: 'Notary & PPAT • Online',
        specialty: 'Startup contracts & legality',
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
            <h2 class="text-sm font-bold text-white">Choose a Notary</h2>
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
              Contract
            </button>
          </div>
        </div>

        <!-- Notary Cards List -->
        <div class="p-3.5 space-y-3 flex-1">
          <p class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Names and rates are sample data</p>

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
    renderScreen();
  };

  window.startConsultation = function(notaryName, mode) {
    if (mode === 'video') {
      showToast(`Memulai panggilan video dengan ${notaryName}...`, 'info');
      setTimeout(() => {
        alert(`Simulasi Video Call aktif dengan ${notaryName}. Kamera & mikrofon terenkripsi end-to-end.`);
      }, 400);
    } else {
      showToast(`Membuka ruang chat konsultasi dengan ${notaryName}...`, 'success');
      goToScreen(3);
    }
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
          <button onclick="startConsultation('Notary A', 'video')" class="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 transition">
            <i data-lucide="video" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Encrypted Security Notice -->
        <div class="bg-teal-50 border-b border-teal-100 py-1.5 px-3 flex items-center justify-center gap-1.5 text-[10px] text-teal-800 font-medium">
          <i data-lucide="lock" class="w-3 h-3 text-teal-600"></i>
          Encrypted & confidential chat (Kerahasiaan Hukum Terjamin)
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
                    <button onclick="goToScreen(${msg.actionTarget})" class="w-full py-1.5 bg-amber-600 text-white text-[10px] font-bold rounded-lg hover:bg-amber-700 transition flex items-center justify-center gap-1">
                      <i data-lucide="external-link" class="w-3 h-3"></i> Buka Checklist Panduan
                    </button>
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
            <input type="text" id="chat-input" placeholder="Type a message..." 
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
      let replyText = "Baik, saya catat kebutuhan Anda. Dokumen legalitas awal akan kami pandu langkah demi langkah.";
      const lower = userText.toLowerCase();
      if (lower.includes('biaya') || lower.includes('harga') || lower.includes('tarif')) {
        replyText = "Tarif konsultasi kami adalah Rp 150.000/sesi. Untuk paket akta pendirian PT lengkap SK Kemenkumham, Anda dapat memilih paket di menu Dokumen seharga Rp 299.000.";
      } else if (lower.includes('berapa lama') || lower.includes('waktu') || lower.includes('hari')) {
        replyText = "Pembuatan akta pendirian dan SK Kemenkumham rata-rata selesai dalam 3-5 hari kerja setelah dokumen checklist lengkap ditandatangani.";
      } else if (lower.includes('syarat') || lower.includes('pt') || lower.includes('dokumen')) {
        replyText = "Syarat utama pendirian PT: KTP & NPWP minimal 2 pendiri, nama PT (3 kata), bidang KBLI, dan alamat domisili usaha. Silakan periksa Checklist yang telah saya kirimkan di atas.";
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
        desc: 'Partnership between businesses (PKS Kemitraan)',
        price: 'Rp 149.000',
        priceNum: 149000,
        badge: 'Popular'
      },
      {
        id: 'setup',
        name: 'Business Setup Documents',
        desc: 'PT/CV for startups & SMEs (Paket Lengkap)',
        price: 'Rp 299.000',
        priceNum: 299000,
        badge: 'Best Value'
      },
      {
        id: 'investor',
        name: 'Investor & Shareholder Agreement',
        desc: 'For investors and shareholders (Perjanjian Pemegang Saham)',
        price: 'Rp 399.000',
        priceNum: 399000,
        badge: 'Corporate'
      },
      {
        id: 'employment',
        name: 'Employment Contract',
        desc: 'Standard for growing businesses (PKWT / PKWTT)',
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
              <p class="text-[10px] text-amber-400">Ready to use • Drafted by Notaries</p>
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
            <span class="font-medium">Prices are sample data (Revenue Stream)</span>
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
                <button onclick="addToCartAndCheckout('${t.name}', ${t.priceNum})" class="px-3.5 py-1.5 bg-amber-600 text-white text-[11px] font-bold rounded-lg hover:bg-amber-700 transition shadow-sm flex items-center gap-1">
                  <i data-lucide="shopping-cart" class="w-3 h-3"></i> Buy
                </button>
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
      { id: 'item-' + Date.now(), title: title, price: price, qty: 1 },
      { id: 'video-consult', title: 'Video consultation - Notary A', price: 150000, qty: 1 }
    ];
    showToast(`Template "${title}" ditambahkan ke keranjang!`, 'success');
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
        <div class="bg-slate-900 text-white p-4 pt-10 sticky top-0 z-10 shadow-sm flex items-center gap-3">
          <button onclick="goToScreen(1)" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white">
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
          </button>
          <div>
            <h2 class="text-sm font-bold text-white">Guides & Checklists</h2>
            <p class="text-[10px] text-amber-400">Step-by-step PT Setup</p>
          </div>
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
            <p class="text-[10px] text-slate-500">${progressPercent}% selesai. Klik centang untuk memperbarui kemajuan.</p>
          </div>

          <!-- Interactive Steps -->
          <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm mb-3 space-y-2.5">
            <h4 class="text-xs font-bold text-slate-800 mb-1">Tahapan Pendirian Usaha:</h4>
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

          <!-- Follow-up Reminder Card (from deck) -->
          <div class="bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 rounded-2xl p-3.5 shadow-sm">
            <div class="flex items-start gap-2.5">
              <div class="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                <i data-lucide="calendar" class="w-4 h-4"></i>
              </div>
              <div class="flex-1">
                <span class="text-[9px] font-bold uppercase tracking-wider text-amber-800">Follow-up reminder</span>
                <h4 class="text-xs font-bold text-slate-900 mt-0.5">Deed signing schedule from notary</h4>
                <p class="text-[10px] text-slate-600 mt-1">Jadwal tanda tangan akta fisik bersama Notaris A dijadwalkan setelah kelengkapan data diverifikasi.</p>
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
        showToast(`Tahap "${item.text.split('(')[0].trim()}" selesai!`, 'success');
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
          <button onclick="goToScreen(4)" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white">
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
          </button>
          <div>
            <h2 class="text-sm font-bold text-white">Payment Checkout</h2>
            <p class="text-[10px] text-amber-400">Integrated with payment gateway</p>
          </div>
        </div>

        <div class="p-3.5 space-y-3 flex-1">
          <!-- ORDER SUMMARY -->
          <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm">
            <h3 class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">ORDER SUMMARY</h3>
            <div class="space-y-1.5 text-xs text-slate-700">
              ${state.cart.map(item => `
                <div class="flex justify-between">
                  <span>${item.title}</span>
                  <span class="font-semibold text-slate-900">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price)}</span>
                </div>
              `).join('')}
            </div>
            <div class="border-t border-slate-100 mt-2.5 pt-2 flex justify-between items-center">
              <span class="text-xs font-bold text-slate-900">Total</span>
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
                  <span class="text-xs font-semibold text-slate-800">Bank Transfer (Virtual Account)</span>
                </div>
                <span class="text-[10px] text-slate-400 font-mono">BCA/Mandiri/BRI</span>
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
                  <span class="text-xs font-semibold text-slate-800">QRIS</span>
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
            Pay Now (${formattedTotal})
          </button>

          <p class="text-[9px] text-center text-slate-400 flex items-center justify-center gap-1">
            <i data-lucide="lock" class="w-3 h-3 text-slate-400"></i>
            Processed securely via partner payment gateway
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
    showToast('Memproses transaksi pembayaran...', 'info');
    setTimeout(() => {
      alert('🎉 Pembayaran Berhasil! Transaksi Anda telah diverifikasi oleh Payment Gateway. Notaris rekanan telah menerima jadwal sesi Anda.');
      goToScreen(5); // Go back to checklist or consult
    }, 700);
  };

  // --- SCREEN 7: BUSINESS ACCOUNT (B2B) ---
  function renderB2BDashboardScreen(container) {
    container.innerHTML = `
      <div class="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
        <!-- Top Bar -->
        <div class="bg-slate-900 text-white p-4 pt-10 sticky top-0 z-10 shadow-sm flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button onclick="goToScreen(1)" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white">
              <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>
            <div>
              <h2 class="text-sm font-bold text-white">Business Account</h2>
              <p class="text-[10px] text-slate-400">PT Contoh Maju (sample data)</p>
            </div>
          </div>
          <span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-bold">
            Active
          </span>
        </div>

        <div class="p-3.5 space-y-3 flex-1">
          <!-- Monthly B2B Plan Card -->
          <div class="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl p-4 border border-amber-200/90 shadow-sm">
            <div class="flex justify-between items-start mb-2">
              <div>
                <span class="text-[9px] font-bold uppercase tracking-wider text-amber-800">Corporate Retainer</span>
                <h3 class="text-xs font-bold text-slate-900">Monthly B2B Plan</h3>
              </div>
              <span class="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded-full">
                Active
              </span>
            </div>

            <div class="space-y-1.5 text-[11px] text-slate-700 mt-2">
              <div class="flex items-center gap-2">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-teal-600"></i>
                <span>Regular legal consultation</span>
              </div>
              <div class="flex items-center gap-2">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-teal-600"></i>
                <span>Document drafting & review</span>
              </div>
              <div class="flex items-center gap-2">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-teal-600"></i>
                <span>Corporate document services</span>
              </div>
            </div>

            <div class="mt-3 pt-2 border-t border-amber-200/60 flex justify-between items-center text-[10px]">
              <span class="text-slate-500">Mulai dari Rp 1.500.000 / bln</span>
              <span class="text-amber-800 font-semibold">Perpanjang: 28 Okt</span>
            </div>
          </div>

          <!-- CORPORATE DOCUMENT REQUESTS -->
          <div class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm">
            <h3 class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">CORPORATE DOCUMENT REQUESTS</h3>
            
            <div class="space-y-2.5">
              <!-- Item 1 -->
              <div class="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <i data-lucide="file-edit" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-slate-900">Articles of association change</h4>
                    <span class="text-[9px] text-slate-400">Perubahan AD/ART & Modal</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold">
                  In process
                </span>
              </div>

              <!-- Item 2 -->
              <div class="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <i data-lucide="file-check-2" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-slate-900">Investor agreement</h4>
                    <span class="text-[9px] text-slate-400">Seed round legal docs</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                  Done
                </span>
              </div>

              <!-- Item 3 -->
              <div class="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <i data-lucide="clock" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-slate-900">Shareholder resolution</h4>
                    <span class="text-[9px] text-slate-400">Keputusan Sirkuler RUPS</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold">
                  Awaiting data
                </span>
              </div>
            </div>

            <button onclick="showToast('Form permohonan dokumen korporat baru dibuka.', 'info')" class="w-full mt-3 py-2 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 font-semibold hover:border-amber-500 hover:text-amber-700 transition flex items-center justify-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Request Corporate Document
            </button>
          </div>
        </div>

        <!-- Phone Bottom Nav -->
        ${renderBottomNav(4)}
      </div>
    `;
  }

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
          <span class="text-[9px]">Profile</span>
        </button>
      </div>
    `;
  }

  // --- PRESENTATION SLIDE VIEWER MODAL ---
  window.openSlideModal = function(slideIndex) {
    state.currentSlide = slideIndex || 1;
    renderSlideModal();
    const modal = document.getElementById('slide-modal');
    if (modal) modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  window.closeSlideModal = function() {
    const modal = document.getElementById('slide-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  window.changeSlide = function(delta) {
    let next = state.currentSlide + delta;
    if (next < 1) next = state.totalSlides;
    if (next > state.totalSlides) next = 1;
    state.currentSlide = next;
    renderSlideModal();
  };

  function renderSlideModal() {
    const imgEl = document.getElementById('modal-slide-img');
    const counterEl = document.getElementById('modal-slide-counter');
    const titleEl = document.getElementById('modal-slide-title');

    const slideTitles = {
      1: "Cover: Economic Survival - Team Title Slide",
      2: "Slide 2: App Concept & Value Proposition",
      3: "Slide 3: User Flow & 3-Sided Ecosystem",
      4: "Slide 4: Prototype Screens (Home, Choose Notary, Consultation)",
      5: "Slide 5: Prototype Screens (Templates, Checklists, Payment)",
      6: "Slide 6: Business Services (B2B Retainer Model)",
      7: "Slide 7: Prototype Notes, Trust & Team Credits"
    };

    if (imgEl) imgEl.src = `assets/slides/slide_${state.currentSlide}.png`;
    if (counterEl) counterEl.textContent = `Slide ${state.currentSlide} / ${state.totalSlides}`;
    if (titleEl) titleEl.textContent = slideTitles[state.currentSlide] || `Slide ${state.currentSlide}`;
  }

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

  // Initialize Simulator
  renderScreen();
  updateScreenNavButtons();
});
