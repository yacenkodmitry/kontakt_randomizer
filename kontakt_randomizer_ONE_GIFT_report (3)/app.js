/* TARO 8 МАРТА · Kontakt InterSearch
   Frontend MVP + optional Google Apps Script backend (email uniqueness + limits)
*/
(function(){
  const $ = (sel) => document.querySelector(sel);

  const STORAGE_KEY = "kontakt_randomizer_v2";
  const state = loadState();

  const data = window.CARDS_DATA;
  const regular = data.regular;
  const gifts = data.gifts.map(g => ({...g, issued_count: 0, status: "active"}));


  // === RANDOM CARD BACKS (unique, no repeats until pool ends) ===
  // Place images in /assets/backs. This build includes 23 backs.
  const CARD_BACKS = [
    "assets/backs/back01.png",
    "assets/backs/back02.png",
    "assets/backs/back03.png",
    "assets/backs/back04.png",
    "assets/backs/back05.png",
    "assets/backs/back06.png",
    "assets/backs/back07.png",
    "assets/backs/back08.png",
    "assets/backs/back09.png",
    "assets/backs/back10.png",
    "assets/backs/back11.png",
    "assets/backs/back12.png",
    "assets/backs/back13.png",
    "assets/backs/back14.png",
    "assets/backs/back15.png",
    "assets/backs/back16.png",
    "assets/backs/back17.png",
    "assets/backs/back18.png",
    "assets/backs/back19.png",
    "assets/backs/back20.png",
    "assets/backs/back21.png",
    "assets/backs/back22.png",
    "assets/backs/back23.png",
  ];

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  let _backPool = shuffle([...CARD_BACKS]);
  function nextBack() {
    if (!_backPool.length) _backPool = shuffle([...CARD_BACKS]);
    return _backPool.pop();
  }

  function applyRandomBack(root = document) {
    const els = root.querySelectorAll(".card-back");
    if (!els || !els.length) return;

    els.forEach((el) => {
      // Keep one assigned back per конкретный DOM-элемент,
      // чтобы в рамках одного экрана не «прыгало» при ререндере.
      if (!el.dataset.backUrl) {
        el.dataset.backUrl = nextBack();
      }
      const url = el.dataset.backUrl;
      el.style.backgroundImage = `url("${url}")`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.style.backgroundRepeat = "no-repeat";
    });
  }
  // === /RANDOM CARD BACKS ===


  const params = new URLSearchParams(location.search);
  const DEBUG_TEST = params.get("test") === "1";


  // Put your deployed Apps Script Web App URL here (optional but recommended)
  const BACKEND_CLAIM_URL = "https://script.google.com/macros/s/AKfycbzQH34KB78sfh268CNLLzD_NuDgVSJO3EvOr26Iqr9z6yYruyCOm81jmzM2HHz5DsgcGw/exec";
 // e.g. "https://script.google.com/macros/s/XXX/exec"

  let audioReady = false;
  const flipAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=");
  flipAudio.volume = 0.18;

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return { pulls:0, hasGift:false, giftId:null, claimedAt:null, streakNoGift:0 };
      const obj = JSON.parse(raw);
      return Object.assign({ pulls:0, hasGift:false, giftId:null, claimedAt:null, streakNoGift:0 }, obj);
    }catch(e){
      return { pulls:0, hasGift:false, giftId:null, claimedAt:null, streakNoGift:0 };
    }
  }

  function saveState(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function screenHero(){
    const stage = $("#stage");
    stage.innerHTML = `
      <div class="hero">
        <div class="hero-card">
          <div class="hero-frame"></div>
          <div class="hero-body">
         <div class="hero-title">Да будет так!</div>
<div class="hero-subtitle">Случайные неслучайности от Kontakt InterSearch</div>
            <button class="btn primary hero-btn xl" id="startBtn">Начать</button>
          </div>
        </div>
      </div>
    `;
    $("#startBtn").addEventListener("click", () => {
      primeAudio();
      screenWelcome();
    });
  }

  function primeAudio(){
    if(audioReady) return;
    try{ flipAudio.play().then(()=>{ flipAudio.pause(); flipAudio.currentTime = 0; audioReady = true; }).catch(()=>{}); }catch(e){}
  }

  function playFlip(){
    try{
      if(!audioReady) return;
      flipAudio.currentTime = 0;
      flipAudio.play().catch(()=>{});
    }catch(e){}
  }

  function screenWelcome(){
    const stage = $("#stage");
    stage.innerHTML = `
      <div class="screen">
        <div class="row">
          <div class="deck">
            <div class="card-back float" aria-label="Колода карт">
              <div class="back-text">
   <div class="badge"></div>
   <div class="big">Ваша неслучайность</div>
   </div>
            </div>
          </div>
          <div class="copy">
            <div class="lead">
              Сформулируйте вопрос или намерение, чтобы получить неслучайную подсказку о том, как дальше действовать.
              <br><br>
              Затем нажмите кнопку «ЕСТЬ КОНТАКТ!”.
            </div>
            <div class="actions">
              <button class="btn primary xl" id="pullBtn">ЕСТЬ КОНТАКТ!</button>
            </div>
          </div>
        </div>
      </div>
    `;
    applyRandomBack(stage);

    $("#pullBtn").addEventListener("click", pullCard);
  }

  function chooseFrom(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

  function weightedGiftPick(){
    const weights = data.config.gift_weights || {};
    const available = gifts.filter(g => g.status === "active" && g.issued_count < (g.limit ?? Infinity));
    if(available.length === 0) return null;
    let total = 0;
    const w = available.map(g => {
      const ww = Number(weights[g.id] ?? 1);
      total += ww;
      return ww;
    });
    let r = Math.random() * total;
    for(let i=0;i<available.length;i++){ r -= w[i]; if(r <= 0) return available[i]; }
    return available[available.length-1];
  }

  function pullCard(){
    state.pulls += 1;
    saveState();
if(!state.hasGift && state.pulls >= 10){
  const g = weightedGiftPick();
  if(g){
    state.hasGift = true;
    state.lastCardId = g.id;
    saveState();
    playFlip();
    return screenCard(g);
  }
}
    let card;
function pickRegular(){
  let c;
  let attempts = 0;
  do{
    c = chooseFrom(regular);
    attempts++;
  } while(c.id === state.lastCardId && attempts < 10);
  return c;
}
    if(state.hasGift){
      card = pickRegular();
    } else {
      let pGift = data.config.gift_probability ?? 0.10;
      // Pity-timer: if user hasn't seen a gift for a while, gently increase chance (no UX hints)
      if(!DEBUG_TEST && state.streakNoGift >= 12){
        const bonus = Math.min(0.22, (state.streakNoGift - 12) * 0.01);
        pGift = Math.min(0.35, pGift + bonus);
      }
      if(DEBUG_TEST) pGift = 1;
      if(Math.random() < pGift){
        const g = weightedGiftPick();
        card = g ? g : pickRegular();
        if(card && card.type === "gift"){
          state.hasGift = true;
          saveState();
        }
      } else {
        card = pickRegular();
      }
    }

    // update streak tracker (only while user hasn't claimed a gift)
    if(!state.hasGift){
      if(card && card.type === "gift") state.streakNoGift = 0;
      else state.streakNoGift = (state.streakNoGift || 0) + 1;
      saveState();
    }
state.lastCardId = card.id;
saveState();
    playFlip();
    screenCard(card);
  }

  function screenCard(card){
    const stage = $("#stage");
    const isGift = card.type === "gift";
    const badge = isGift
      ? `<span class="spark-ico">✨</span><span class="spark-text">Особый знак</span>`
      : `<span class="spark-ico">🟣</span><span class="spark-text">Подсказка для вас</span>`;
    stage.innerHTML = `
      <div class="screen">
        <div class="row">
          <div class="deck">
            <div class="card-back float">
             <div class="back-text">
  <div class="badge"></div>
  <div class="big">Ваша неслучайность</div>
  <div class="sub-big">${escapeHtml(card.title)}</div>
</div>
            </div>
          </div>
          <div class="copy">
            <div class="card-face ${isGift ? "gift-glow gift-border" : ""}">
              <div class="face-top">
                <div class="face-title">${escapeHtml(card.title)}</div>
                <div class="spark">${badge}</div>
              </div>
              <div class="face-body">${escapeHtml(card.text)}</div>
            </div>

            <div class="actions">
              <button class="btn primary xl" id="pullMoreBtn">✨ Вытянуть ещё</button>
              ${isGift ? `<button class="btn ghost xl" id="claimBtn">Получить подарок</button>` : ``}
            </div>
          </div>
        </div>
      </div>
    `;
    applyRandomBack(stage);

    $("#pullMoreBtn").addEventListener("click", pullCard);
    if(isGift){ $("#claimBtn").addEventListener("click", () => openGiftModal(card)); }
  }

  function openGiftModal(card){
    const modal = $("#giftModal");
 const _giftTitleEl = $("#giftTitle");
    if(_giftTitleEl){ _giftTitleEl.textContent = card.gift_name || "Подарок"; }
const _giftPillEl = $("#giftPill");
    if(_giftPillEl){ _giftPillEl.textContent = card.gift_name || "Подарок"; }
    $("#giftNote").textContent = "Оставьте контакты — и мы отправим вам подарок.";
    const form = $("#giftForm");
    form.reset?.();

    const lockGiftOnce = () => {
      if(!state.hasGift){ state.hasGift = true; saveState(); }
    };

    const closeBtn = $("#closeGiftBtn");
    if(closeBtn){ closeBtn.onclick = () => { lockGiftOnce(); modal.close(); }; }
    const skipBtn = $("#skipGift");
    if(skipBtn){ skipBtn.onclick = () => { lockGiftOnce(); modal.close(); }; }

    // ESC closes too
    modal.addEventListener("cancel", (e) => { e.preventDefault(); lockGiftOnce(); modal.close(); }, { once:true });

    form.onsubmit = async (e) => {
      e.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.gift_id = card.id;
      payload.gift_name = card.gift_name || card.title;
      payload.user_agent = navigator.userAgent;

      try{
        if(BACKEND_CLAIM_URL){
          const res = await fetch(BACKEND_CLAIM_URL, {
            method: "POST",
            // IMPORTANT: no custom headers -> avoids CORS preflight for Apps Script Web Apps
            body: JSON.stringify({ action: "claim", ...payload })
          });
          const text = await res.text();
          let out;
          try { out = JSON.parse(text); } catch(e) { out = { ok:false, message: "Непонятный ответ сервера", raw: text }; }
          if(!out.ok){ alert(out.message || "Не получилось закрепить подарок. Попробуйте позже."); return; }
        }

        state.hasGift = true;
        state.streakNoGift = 0;
        state.giftId = card.id;
        state.claimedAt = new Date().toISOString();
        saveState();

        modal.close();
        screenThankYou(card);
      }catch(err){ alert("Ошибка связи. Попробуйте ещё раз. Если вы тестируете локально (file://), откройте через сервер/хостинг. Также проверьте, что Apps Script задеплоен как Web App с доступом Anyone."); }
    };

    modal.showModal();
    // click outside content closes
    modal.addEventListener("click", (ev) => {
      if(ev.target === modal){ lockGiftOnce(); modal.close(); }
    }, { once:true });

  }

  function screenThankYou(card){
    const stage = $("#stage");
    stage.innerHTML = `
      <div class="screen">
        <div class="card-face gift-glow gift-border" style="margin:0 auto;">
          <div class="face-top">
            <div class="face-title">🎁 Подарок закреплён за вами</div>
            <div class="spark">готово</div>
          </div>
          <div class="face-body">
            Ваш подарок: ${escapeHtml(card.gift_name || card.title)}.
            <br><br>
            В течение 3 рабочих дней с вами свяжется консультант Kontakt InterSearch.
          </div>
        </div>
        <div class="actions" style="justify-content:center; margin-top:16px;">
          <button class="btn primary xl" id="continueBtn">✨ Продолжить вытягивать карты</button>
        </div>
      </div>
    `;
    $("#continueBtn").addEventListener("click", pullCard);
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;")
      .replaceAll("\n","<br>");
  }

  screenHero();
})();
function formatTitle(title){
  const idx = title.indexOf("«");
  if(idx !== -1){
    return title.substring(0, idx) + "<br>" + title.substring(idx);
  }
  return title;
}


