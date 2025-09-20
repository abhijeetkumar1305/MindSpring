// MindSpring app interactions — mobile-first sliding screens + features

document.addEventListener('DOMContentLoaded', () => {
  // elements
  const screens = document.getElementById('screens');
  const navBtns = document.querySelectorAll('.nav-btn');
  const fab = document.getElementById('fab');
  const toast = document.getElementById('toast');

  // screen index state
  let currentIndex = 0;
  function goTo(index) {
    currentIndex = index;
    screens.style.transform = `translateX(-${index * 100}%)`;
    navBtns.forEach((b, i) => b.classList.toggle('active', i === index));
  }

  // attach nav
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => goTo(Number(btn.dataset.index ?? btn.datasetIndex ?? btn.getAttribute('data-index')) || Number(btn.dataset.index)));
    // support both attribute names
    btn.addEventListener('click', (e) => {
      const idx = Number(btn.getAttribute('data-index'));
      if (!isNaN(idx)) goTo(idx);
    });
  });

  // also attach buttons with data-target attribute (hero)
  document.querySelectorAll('[data-target]').forEach(el=>{
    el.addEventListener('click', () => {
      const target = el.getAttribute('data-target');
      const targetIndex = {home:0,mood:1,chat:2,doctor:3,payment:4}[target];
      if (typeof targetIndex === 'number') goTo(targetIndex);
    });
  });

  // FAB opens mood quickly
  fab?.addEventListener('click', ()=> goTo(1));

  // small toast function
  function showToast(text, ms = 1800){
    if(!toast) return;
    toast.textContent = text;
    toast.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(()=> toast.classList.add('hidden'), ms);
  }

  // --- Mood save (localStorage)
  const moodInput = document.getElementById('mood-input');
  const saveMoodBtn = document.getElementById('save-mood');
  const moodList = document.getElementById('mood-list');
  const MOOD_KEY = 'mindspring_moods';

  function loadMoods(){
    moodList.innerHTML = '';
    const raw = localStorage.getItem(MOOD_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.slice().reverse().forEach(m=>{
      const li = document.createElement('li');
      li.textContent = `${new Date(m.t).toLocaleString()}: ${m.text}`;
      moodList.appendChild(li);
    });
  }
  function saveMood(){
    const txt = moodInput.value.trim();
    if(!txt){ showToast('Write a short mood'); return; }
    const raw = localStorage.getItem(MOOD_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({t: Date.now(), text: txt});
    localStorage.setItem(MOOD_KEY, JSON.stringify(arr));
    moodInput.value = '';
    loadMoods();
    showToast('Mood saved locally');
  }
  saveMoodBtn?.addEventListener('click', saveMood);
  loadMoods();

  // --- Chat (user & AI simulation with typing spinner + bounce)
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendChatBtn = document.getElementById('send-chat');

  function appendMessage(kind, html){
    const wrap = document.createElement('div');
    wrap.className = 'msg ' + (kind === 'ai' ? 'ai' : 'user');
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = kind === 'ai' ? '<i class="fa-solid fa-robot"></i>' : '<i class="fa-solid fa-user"></i>';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = html;
    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
    // style wrappers to match CSS structure
    const msg = document.createElement('div');
    msg.className = 'msg ' + (kind === 'ai' ? 'ai' : 'user') + ' bounce';
    // create correct inner structure
    if(kind === 'ai'){
      msg.innerHTML = `<div class="avatar ai-avatar"><i class="fa-solid fa-robot"></i></div><div class="bubble">${html}</div>`;
    } else {
      msg.innerHTML = `<div class="avatar user-avatar"><i class="fa-solid fa-user"></i></div><div class="bubble">${html}</div>`;
    }
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function simulateAiReply(userText){
    // typing indicator
    const typing = document.createElement('div');
    typing.className = 'msg ai';
    typing.innerHTML = `<div class="avatar ai-avatar"><i class="fa-solid fa-robot"></i></div><div class="bubble"><span class="typing-dot"></span> Mindy is typing...</div>`;
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(()=>{
      typing.remove();
      // basic rules for empathetic replies
      const t = (userText||'').toLowerCase();
      let reply = "Thanks for sharing — I'm here with you. Can you tell me a bit more?";
      if(/sad|depress|down/.test(t)) reply = "I'm really sorry you're feeling low. Try one small step: write one thing you did today (even small).";
      if(/anx|stress|stressed/.test(t)) reply = "When stress hits, try the 4-4-4 breathing: inhale 4s, hold 4s, exhale 4s. Repeat 3 times.";
      if(/happy|good|great/.test(t)) reply = "That's wonderful! Hold onto that feeling — what helped you today?";
      if(/suicide|kill myself|end my life|want to die/.test(t)){
        reply = "I hear you — if you're in immediate danger call local emergency services now. You can also contact crisis lines in your country.";
        showEmergencyBanner();
      }
      appendMessage('ai', `<i class="fa-solid fa-robot"></i> ${reply}`);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 900 + Math.random()*600);
  }

  sendChatBtn?.addEventListener('click', ()=>{
    const txt = chatInput.value.trim();
    if(!txt) return;
    appendMessage('user', txt);
    chatInput.value = '';
    simulateAiReply(txt);
  });

  chatInput?.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){ e.preventDefault(); sendChatBtn.click(); }
  });

  // emergency banner
  function showEmergencyBanner(){
    if(document.getElementById('emergency-banner')) return;
    const b = document.createElement('div');
    b.id = 'emergency-banner';
    b.className = 'card';
    b.style.position = 'fixed';
    b.style.left = '16px';
    b.style.bottom = '120px';
    b.style.zIndex = 9999;
    b.innerHTML = `<strong>Emergency?</strong> If you are in immediate danger call local emergency services now. <button id="crisisBtn" class="btn outline">Crisis Info</button>`;
    document.body.appendChild(b);
    document.getElementById('crisisBtn').addEventListener('click', ()=> {
      alert('If in India call 112. US call 988. UK Samaritans 116 123. Reach local emergency services immediately.');
    });
    setTimeout(()=> b.remove(), 15000);
  }

  // --- Doctor form
  const doctorForm = document.getElementById('doctor-form');
  const generatedId = document.getElementById('generated-id');
  doctorForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = document.getElementById('doc-name').value.trim();
    const email = document.getElementById('doc-email').value.trim();
    const location = document.getElementById('doc-location').value.trim();
    const issue = document.getElementById('doc-issue').value.trim();
    if(!issue){ showToast('Please describe your issue'); return; }
    const pid = localStorage.getItem('mindspring_patientid') || generatePatientID();
    localStorage.setItem('mindspring_patientid', pid);
    generatedId.textContent = `Patient ID: ${pid}`;
    showToast('Summary saved. A demo doctor will review it.');
    // save a demo record for dashboard (if needed)
    const patientsRaw = localStorage.getItem('mindspring_patients') || '[]';
    const patients = JSON.parse(patientsRaw);
    patients.push({id:pid,name,email,location,issue,created:Date.now()});
    localStorage.setItem('mindspring_patients', JSON.stringify(patients));
  });

  document.getElementById('generate-id')?.addEventListener('click', ()=>{
    const pid = generatePatientID();
    localStorage.setItem('mindspring_patientid', pid);
    generatedId.textContent = `Patient ID: ${pid}`;
    showToast('Patient ID generated');
  });

  function generatePatientID(){ return 'PAT' + Math.floor(100000 + Math.random()*800000); }

  // --- Payment
  const paymentForm = document.getElementById('payment-form');
  const paymentSuccess = document.getElementById('payment-success');
  paymentForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    // very light validation
    const card = document.getElementById('card-number').value.trim();
    if(card.length < 12){ showToast('Enter card number (demo)'); return; }
    paymentSuccess.classList.remove('hidden');
    showToast('Payment successful');
  });

  // start at home
  goTo(0);
});
