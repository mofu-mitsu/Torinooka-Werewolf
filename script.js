// ==========================================
// script.js - 観戦夜バグ修正 & 完全版
// ==========================================

// --- 0. ユーティリティ & ヘルパー関数 ---

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function sleep(ms) { return new Promise(r => setTimeout(r, isSkipping ? 0 : ms)); }

// ★ メンバーリスト用（アイコン右上・絶対配置）
function getBadgeHTML(role) {
    if (role === "人狼") return `<div class="wolf-mark mark-wolf">🐺</div>`;
    if (role === "妖狐") return `<div class="wolf-mark mark-fox">🦊</div>`;
    if (role === "占い師") return `<div class="wolf-mark" style="background:#8844ff">🔮</div>`;
    if (role === "霊媒師") return `<div class="wolf-mark" style="background:#4400aa">👻</div>`;
    if (role === "騎士") return `<div class="wolf-mark" style="background:#00aaff">🛡️</div>`;
    if (role === "狂人") return `<div class="wolf-mark" style="background:#ff88aa">🤪</div>`;
    if (role === "狂信者") return `<div class="wolf-mark mark-fanatic">信</div>`;
    if (role === "背徳者") return `<div class="wolf-mark mark-fanatic">背</div>`;
    if (role === "共有者") return `<div class="wolf-mark mark-mason">共</div>`;
    if (role === "パン屋") return `<div class="wolf-mark" style="background:#ffaa44">🍞</div>`;
    if (role === "てるてる坊主") return `<div class="wolf-mark" style="background:#ddd; color:#000;">☀</div>`;
    if (role === "猫又") return `<div class="wolf-mark" style="background:#ffaaaa">🐱</div>`;
    if (role === "番犬") return `<div class="wolf-mark" style="background:#aaaaaa">🐕</div>`;
    if (role === "訪問者") return `<div class="wolf-mark" style="background:#00cc88">🚪</div>`;
    if (role === "怪盗") return `<div class="wolf-mark" style="background:#333">🎩</div>`;
    return ""; 
}

// ★ チャットログ用（名前の横・インライン配置）
function getChatBadgeHTML(role) {
    if (role === "人狼") return `<span class="chat-role-mark mark-wolf">🐺</span>`;
    if (role === "妖狐") return `<span class="chat-role-mark mark-fox">🦊</span>`;
    if (role === "占い師") return `<span class="chat-role-mark" style="background:#8844ff">🔮</span>`;
    if (role === "霊媒師") return `<span class="chat-role-mark" style="background:#4400aa">👻</span>`;
    if (role === "騎士") return `<span class="chat-role-mark" style="background:#00aaff">🛡️</span>`;
    if (role === "狂人") return `<span class="chat-role-mark" style="background:#ff88aa">🤪</span>`;
    if (role === "狂信者") return `<span class="chat-role-mark mark-fanatic">信</span>`;
    if (role === "背徳者") return `<span class="chat-role-mark mark-fanatic">背</span>`;
    if (role === "共有者") return `<span class="chat-role-mark mark-mason">共</span>`;
    if (role === "パン屋") return `<span class="chat-role-mark" style="background:#ffaa44">🍞</span>`;
    if (role === "てるてる坊主") return `<span class="chat-role-mark" style="background:#ddd; color:#000;">☀</span>`;
    if (role === "猫又") return `<span class="chat-role-mark" style="background:#ffaaaa">🐱</span>`;
    if (role === "番犬") return `<span class="chat-role-mark" style="background:#aaaaaa">🐕</span>`;
    if (role === "訪問者") return `<span class="chat-role-mark" style="background:#00cc88">🚪</span>`;
    if (role === "怪盗") return `<span class="chat-role-mark" style="background:#333">🎩</span>`;
    return ""; 
}

function getRoleDisplayInfo(roleName) {
    const map = {
        "村人": { css: "role-villager", img: "villager" },
        "人狼": { css: "role-wolf", img: "wolf" },
        "占い師": { css: "role-seer", img: "seer" },
        "霊媒師": { css: "role-medium", img: "medium" },
        "騎士": { css: "role-knight", img: "knight" },
        "狂人": { css: "role-madman", img: "madman" },
        "パン屋": { css: "role-villager", img: "baker" },
        "妖狐": { css: "role-villager", img: "fox" },
        "狂信者": { css: "role-madman", img: "fanatic" },
        "背徳者": { css: "role-madman", img: "immoralist" },
        "共有者": { css: "role-villager", img: "mason" },
        "てるてる坊主": { css: "role-madman", img: "teruteru" },
        "怪盗": { css: "role-villager", img: "thief" },
        "番犬": { css: "role-villager", img: "dog" },
        "猫又": { css: "role-villager", img: "cat" },
        "訪問者": { css: "role-villager", img: "visitor" },
    };
    const info = map[roleName] || { css: "role-villager", img: "villager" };
    return { cssClass: info.css, img: `img/cards/${info.img}.png` };
}

// --- 1. グローバル変数 ---
let playerName = "あなた";
let playerCustomImg = null; 
let selectedCharIds = [];
let participants = []; 
let dayCount = 1; 
let lastExecutedId = null; 
let remainingTurns = 20; 
const MAX_TURNS = 20;

let isSpectator = false; 
let isSkipping = false;
let isAutoPlaying = false; 
let playerStats = { coCount: 0, selfDefendCount: 0 }; 

const CLASSES = ["1-1", "1-2", "1-3", "1-4", "2-1", "2-2", "3-1", "3-2"];

// --- 2. DOM取得 ---
const titleScreen = document.getElementById("title-screen");
const selectionScreen = document.getElementById("selection-screen");
const gameScreen = document.getElementById("game-screen");

const nameInput = document.getElementById("player-name-input");
const playerIconInput = document.getElementById("player-icon-input");
const previewIcon = document.getElementById("preview-icon");
const toSelectionBtn = document.getElementById("to-selection-btn");
const spectatorModeBtn = document.getElementById("spectator-mode-btn");
const showRulesBtn = document.getElementById("show-rules-btn");
const tabsContainer = document.getElementById("class-tabs");
const charGrid = document.getElementById("char-grid");
const selectedCountSpan = document.getElementById("selected-count");
const gameStartBtn = document.getElementById("game-start-btn");

const myRoleCard = document.getElementById("my-role-card");
const membersList = document.getElementById("members-list");
const startDayBtn = document.getElementById("start-day-btn");

const detailBox = document.getElementById("char-details-preview");
const detailImg = document.getElementById("detail-img");
const detailName = document.getElementById("detail-name");
const detailGender = document.getElementById("detail-gender");
const detailMbti = document.getElementById("detail-mbti");
const detailClass = document.getElementById("detail-class");
const detailProfile = document.getElementById("detail-profile");

const discussionHeader = document.getElementById("discussion-header");
const gameSetupArea = document.getElementById("game-setup-area");
const miniRoleIcon = document.getElementById("mini-role-icon");
const miniRoleText = document.getElementById("mini-role-text");
const showInfoBtn = document.getElementById("show-info-btn");
const infoModal = document.getElementById("info-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const roleBreakdownList = document.getElementById("role-breakdown-list");

const actionButtons = document.getElementById("action-buttons");
const nextTurnBtn = document.getElementById("next-turn-btn");
const playerActBtn = document.getElementById("player-act-btn");
const skipBtn = document.getElementById("skip-btn");

const actionModal = document.getElementById("action-modal");
const actTypeBtns = document.querySelectorAll(".act-type-btn");
const targetSelectorArea = document.getElementById("target-selector-area");
const targetSelect = document.getElementById("target-select");
const roleSelectorArea = document.getElementById("role-selector-area");
const roleCoSelect = document.getElementById("role-co-select");
const resultSelectorArea = document.getElementById("result-selector-area");
const resultSelect = document.getElementById("result-select");
const executeActionBtn = document.getElementById("execute-action-btn");
const closeActionModalBtn = document.getElementById("close-action-modal-btn");

const resultModal = document.getElementById("result-modal");
const resultTitle = document.getElementById("result-title");
const resultGrid = document.getElementById("result-grid");
const rulesModal = document.getElementById("rules-modal");
const closeRulesBtn = document.getElementById("close-rules-btn");

const skipModal = document.getElementById("skip-modal");
const skipYesBtn = document.getElementById("skip-yes-btn");
const skipNoBtn = document.getElementById("skip-no-btn");

const bgmTitle = document.getElementById("bgm-title");
const bgmNoon = document.getElementById("bgm-noon");
const bgmNight = document.getElementById("bgm-night");
const bgmToggle = document.getElementById("bgm-toggle");

let dialogueArea = document.getElementById("dialogue-area"); 
let voteModal = null; 
let isBgmOn = true;

const turnCounterDiv = document.createElement("div");
turnCounterDiv.className = "turn-counter";
if (!document.querySelector(".turn-counter")) {
    document.querySelector(".header-left").appendChild(turnCounterDiv);
}
const allyListDisplay = document.getElementById("ally-list-display") || document.createElement("div");
if (!document.getElementById("ally-list-display")) {
    allyListDisplay.id = "ally-list-display";
    allyListDisplay.className = "ally-list-display hidden";
    document.querySelector(".header-left").appendChild(allyListDisplay);
}

// --- 画像アップロード ---
playerIconInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            playerCustomImg = e.target.result; 
            previewIcon.src = playerCustomImg;
        }
        reader.readAsDataURL(file);
    }
});

// --- BGM制御 ---
function playBgm(type) {
    if (!isBgmOn) return;
    bgmTitle.pause(); bgmNoon.pause(); bgmNight.pause();
    bgmTitle.currentTime = 0; bgmNoon.currentTime = 0; bgmNight.currentTime = 0;
    if (type === "title") bgmTitle.play().catch(()=>{});
    if (type === "noon") bgmNoon.play().catch(()=>{});
    if (type === "night") bgmNight.play().catch(()=>{});
}

bgmToggle.addEventListener("click", () => {
    isBgmOn = !isBgmOn;
    if (isBgmOn) {
        bgmToggle.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        if(!gameScreen.classList.contains("hidden")) playBgm("noon");
        else playBgm("title");
    } else {
        bgmToggle.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        bgmTitle.pause(); bgmNoon.pause(); bgmNight.pause();
    }
});
bgmTitle.volume = 0.3; bgmNoon.volume = 0.3; bgmNight.volume = 0.3;

showRulesBtn.addEventListener("click", () => rulesModal.classList.remove("hidden"));
closeRulesBtn.addEventListener("click", () => rulesModal.classList.add("hidden"));

// ==========================================
// 1. 画面遷移・初期設定
// ==========================================
playBgm("title");

toSelectionBtn.addEventListener("click", () => { isSpectator = false; goToSelection(); });
spectatorModeBtn.addEventListener("click", () => { isSpectator = true; playerName = "観戦者"; goToSelection(); });

function goToSelection() {
    const inputVal = nameInput.value.trim();
    if (inputVal !== "") playerName = inputVal;
    titleScreen.classList.add("hidden");
    selectionScreen.classList.remove("hidden");
    renderTabs("1-1");
    renderChars("1-1");
    updateStartButton();
}

function renderTabs(activeClass) {
    tabsContainer.innerHTML = "";
    CLASSES.forEach(cls => {
        const btn = document.createElement("button");
        btn.innerText = cls;
        btn.className = "tab-btn";
        if (cls === activeClass) btn.classList.add("active");
        btn.onclick = () => { renderTabs(cls); renderChars(cls); };
        tabsContainer.appendChild(btn);
    });
}

function renderChars(targetClass) {
    charGrid.innerHTML = "";
    const targets = charactersData.filter(c => c.class === targetClass);
    if (targets.length === 0) { charGrid.innerHTML = "<p style='color:#ccc; margin:auto;'>データ準備中...</p>"; return; }
    targets.forEach(char => {
        const card = document.createElement("div");
        card.className = "char-card";
        if (selectedCharIds.includes(char.id)) card.classList.add("selected");
        const imgSrc = `img/${char.img}.png`;
        card.innerHTML = `<img src="${imgSrc}" class="char-icon" onerror="this.src='https://via.placeholder.com/60?text=?'"><div class="char-name">${char.name}</div>`;
        card.onclick = () => { toggleCharSelection(char.id, card); showCharProfile(char); };
        charGrid.appendChild(card);
    });
}

function showCharProfile(char) {
    detailBox.classList.remove("hidden");
    detailImg.src = `img/${char.img}.png`;
    detailImg.onerror = () => { detailImg.src = 'https://via.placeholder.com/70'; };
    detailName.innerText = char.fullName || char.name;
    detailGender.innerHTML = char.gender === 'male' ? '<i class="fa-solid fa-mars"></i> 男子' : '<i class="fa-solid fa-venus"></i> 女子';
    detailMbti.innerText = char.mbti;
    detailClass.innerText = char.class;
    detailProfile.innerText = char.profile || "情報なし";
}

function toggleCharSelection(id, cardElement) {
    if (selectedCharIds.includes(id)) {
        selectedCharIds = selectedCharIds.filter(i => i !== id);
        cardElement.classList.remove("selected");
    } else {
        selectedCharIds.push(id);
        cardElement.classList.add("selected");
    }
    updateStartButton();
}

function updateStartButton() {
    const count = selectedCharIds.length;
    selectedCountSpan.innerText = count;
    if (isSpectator) gameStartBtn.innerText = `観戦開始！ (NPC ${count}人)`;
    else gameStartBtn.innerText = `ゲーム開始！ (${count}人 + ${playerName})`;
    gameStartBtn.classList.toggle("disabled", count === 0);
    gameStartBtn.disabled = count === 0;
}

// ==========================================
// 2. ゲーム開始処理
// ==========================================
gameStartBtn.addEventListener("click", () => {
    if (selectedCharIds.length === 0) return;
    isSkipping = false;
    isAutoPlaying = false;
    dayCount = 1;
    lastExecutedId = null;
    remainingTurns = MAX_TURNS;
    playerStats = { coCount: 0, selfDefendCount: 0 };

    setupParticipants();
    assignRoles();
    
    selectionScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    renderGameScreen();
    dialogueArea = document.getElementById("dialogue-area");
    if (dialogueArea) dialogueArea.innerHTML = "";
});

function setupParticipants() {
    participants = [];
    selectedCharIds.forEach(id => {
        const charData = charactersData.find(c => c.id === id);
        participants.push({
            ...JSON.parse(JSON.stringify(charData)), 
            isPlayer: false,
            isAlive: true,
            status: "alive",
            mental: charData.params.mental || 100,
            suspicionMeter: {},
            agitation: 0,
            speechCount: 0, 
            coRole: null, 
            nightInfo: null,
            watchdogTarget: null 
        });
    });

    if (!isSpectator) {
        participants.push({
            id: "player",
            name: playerName,
            fullName: playerName,
            class: "PLAYER",
            mbti: "XX",
            img: "player",
            isPlayer: true,
            isAlive: true,
            status: "alive",
            mental: 100,
            agitation: 0,
            speechCount: 0,
            dialogues: {},
            params: { logic: 50, emotion: 50, trust_bias: {} },
            suspicionMeter: {},
            coRole: null,
            nightInfo: null,
            watchdogTarget: null
        });
    }
}

function assignRoles() {
    const total = participants.length;
    let roles = [];
    const optionCheckboxes = document.querySelectorAll(".role-opt:checked");
    const optionalRoles = Array.from(optionCheckboxes).map(cb => cb.value);

    let baseRoles = ["人狼", "狂人", "占い師", "騎士"];
    if (total >= 6) baseRoles.push("霊媒師");
    if (total >= 9) baseRoles.push("人狼"); 
    if (total >= 12) baseRoles.push("人狼"); 
    if (total >= 20) baseRoles.push("人狼");
    
    roles = [...baseRoles];
    optionalRoles.forEach(role => {
        if (roles.length < total) {
            if (role === "共有者") {
                if (roles.length + 2 <= total) roles.push("共有者", "共有者");
            } else {
                roles.push(role);
            }
        }
    });
    while (roles.length < total) roles.push("村人");
    roles = roles.slice(0, total);
    roles = shuffleArray(roles);
    participants.forEach((p, index) => { p.role = roles[index]; });
}

function renderGameScreen() {
    const me = participants.find(p => p.isPlayer);
    if (isSpectator) {
        gameScreen.setAttribute("data-my-role", "SPECTATOR");
        myRoleCard.className = `role-card role-villager`; 
        myRoleCard.innerHTML = `<i class="fa-solid fa-tv" style="font-size:3rem; margin-bottom:10px;"></i><span>観戦中</span>`;
    } else {
        const roleInfo = getRoleDisplayInfo(me.role);
        gameScreen.setAttribute("data-my-role", me.role);
        myRoleCard.className = `role-card ${roleInfo.cssClass}`;
        let myImgSrc = playerCustomImg ? playerCustomImg : roleInfo.img;
        myRoleCard.innerHTML = `<img src="${myImgSrc}" style="width:80px; height:80px; margin-bottom:10px; object-fit:cover; border-radius:50%;" onerror="this.style.display='none'"><span>${me.role}</span>`;
    }
    updateMembersList();
    updateAllyList();
}

function updateAllyList() {
    allyListDisplay.innerHTML = "";
    allyListDisplay.classList.add("hidden");
    const me = participants.find(p => p.isPlayer);
    if (isSpectator || !me) return;

    let allies = [];
    let label = "";

    if (me.role === "人狼") { label = "仲間: "; allies = participants.filter(p => p.role === "人狼" && p.id !== me.id); }
    else if (me.role === "狂信者") { label = "ご主人様: "; allies = participants.filter(p => p.role === "人狼"); }
    else if (me.role === "背徳者") { label = "妖狐: "; allies = participants.filter(p => p.role === "妖狐"); }
    else if (me.role === "共有者") { label = "相方: "; allies = participants.filter(p => p.role === "共有者" && p.id !== me.id); }

    if (allies.length > 0) {
        const names = allies.map(p => p.name).join(", ");
        allyListDisplay.innerHTML = `<i class="fa-solid fa-link"></i> ${label}${names}`;
        allyListDisplay.classList.remove("hidden");
    }
}

function updateMembersList() {
    const me = participants.find(p => p.isPlayer);
    const isSpectatorMode = isSpectator;
    const canSeeWolf = (!isSpectator && (me.role === "人狼" || me.role === "狂信者"));
    const isMason = (!isSpectator && me.role === "共有者");
    const isImmoralist = (!isSpectator && me.role === "背徳者");
    const isDog = (!isSpectator && me.role === "番犬");

    membersList.innerHTML = "";
    participants.forEach(p => {
        const chip = document.createElement("div");
        chip.className = `member-chip ${p.isPlayer ? "is-player" : ""}`;
        if (!p.isAlive) chip.classList.add("dead"); 
        
        let marks = "";
        if (isSpectatorMode) {
            marks = getBadgeHTML(p.role); // メンバーリスト用（absolute）
        } else {
            if (canSeeWolf && p.role === "人狼" && !p.isPlayer) marks = getBadgeHTML("人狼");
            if (isMason && p.role === "共有者" && !p.isPlayer) marks = getBadgeHTML("共有者");
            if (isImmoralist && p.role === "妖狐") marks = getBadgeHTML("妖狐");
            if (isDog && me.watchdogTarget === p.id) marks = `<div class="wolf-mark mark-dog">🐕</div>`;
        }
        
        let coBadge = "";
        if (p.coRole) coBadge = `<div style="position:absolute; bottom:-5px; right:-5px; background:#fff; color:#000; font-size:10px; padding:2px; border-radius:4px; border:1px solid #000;">${p.coRole.substr(0,1)}</div>`;

        let imgSrc = `img/${p.img}.png`;
        if (p.isPlayer && playerCustomImg) imgSrc = playerCustomImg;

        chip.innerHTML = `
            ${marks}
            <img src="${imgSrc}" onerror="this.src='https://via.placeholder.com/40'">
            <span>${p.name}</span>
            ${coBadge}
        `;
        membersList.appendChild(chip);
    });
}

// ==========================================
// 3. 議論パート
// ==========================================
startDayBtn.addEventListener("click", () => {
    remainingTurns = MAX_TURNS; 
    updateTurnDisplay();
    playBgm("noon");

    startDayBtn.classList.add("hidden");
    gameSetupArea.classList.add("hidden");
    discussionHeader.classList.remove("hidden");
    dialogueArea.classList.remove("hidden");
    actionButtons.classList.remove("hidden");

    if (isSpectator) {
        miniRoleIcon.innerHTML = `<i class="fa-solid fa-tv"></i>`;
        miniRoleText.innerText = `観戦中`;
        playerActBtn.style.display = "none"; 
        nextTurnBtn.innerText = "自動進行中...";
        nextTurnBtn.disabled = true;
    } else {
        const me = participants.find(p => p.isPlayer);
        const roleInfo = getRoleDisplayInfo(me.role);
        let myImgSrc = playerCustomImg ? playerCustomImg : roleInfo.img;
        miniRoleIcon.innerHTML = `<img src="${myImgSrc}" style="width:100%; height:100%;">`;
        miniRoleText.innerText = `${me.role}`;
    }

    addLog("system", `=== ${dayCount}日目の朝が来ました ===`);
    
    // 発言カウントリセット
    participants.forEach(p => p.speechCount = 0);

    const me = participants.find(p => p.isPlayer);
    if (isSpectator && me) checkMorningEvents(me); 
    else if (me) checkMorningEvents(me);

    addLog("system", "議論を開始します。");
    
    if (isSpectator) {
        isAutoPlaying = true;
        autoProgressLoop(); 
    } else {
        if (dayCount === 1) playIntroPhase();
    }
});

async function autoProgressLoop() {
    if (dayCount === 1) await playIntroPhase();
    while (remainingTurns > 0 && (isSkipping || isSpectator)) {
        await sleep(isSkipping ? 0 : 800); 
        await playDiscussionTurn();
        consumeTurn();
    }
}

function checkMorningEvents(me) {
    const bakerAlive = participants.some(p => p.role === "パン屋" && p.isAlive);
    if (bakerAlive) {
        addLog("system", "🍞 香ばしいパンの香りが漂ってきました…");
    } else {
        if (dayCount > 1) addLog("system", "今日はパンが届きませんでした…");
    }

    if (isSpectator && lastExecutedId) {
        const executed = participants.find(p => p.id === lastExecutedId);
        const result = executed.role === "人狼" ? "人狼" : "人間";
        addLog("system", `(霊媒情報: 昨日の処刑者 ${executed.name} は 【${result}】 でした)`);
    }
    else if (me && me.role === "霊媒師" && me.isAlive && lastExecutedId) {
        const executed = participants.find(p => p.id === lastExecutedId);
        const result = executed.role === "人狼" ? "人狼" : "人間";
        addLog(me.id, `(霊媒結果: 昨日の処刑者 ${executed.name} は 【${result}】 でした)`, "normal");
    }
}

function updateTurnDisplay() {
    turnCounterDiv.innerText = `日没まで: ${remainingTurns}`;
    turnCounterDiv.style.color = remainingTurns <= 3 ? "#ff4444" : "#ffaa00";
}

showInfoBtn.addEventListener("click", () => {
    const breakdown = {};
    participants.forEach(p => { breakdown[p.role] = (breakdown[p.role] || 0) + 1; });
    roleBreakdownList.innerHTML = "";
    for (const [role, count] of Object.entries(breakdown)) {
        const li = document.createElement("li");
        li.innerHTML = `<span>${role}</span> <span>x ${count}</span>`;
        roleBreakdownList.appendChild(li);
    }
    infoModal.classList.remove("hidden");
});
closeModalBtn.addEventListener("click", () => { infoModal.classList.add("hidden"); });

// --- プレイヤー発言 ---
let currentActionType = "accuse";
playerActBtn.addEventListener("click", () => {
    updateTargetSelect();
    actionModal.classList.remove("hidden");
});
closeActionModalBtn.addEventListener("click", () => { actionModal.classList.add("hidden"); });

skipBtn.addEventListener("click", () => {
    skipModal.classList.remove("hidden");
});

skipYesBtn.addEventListener("click", () => {
    isSkipping = true;
    skipBtn.disabled = true;
    skipBtn.innerText = "スキップ中...";
    skipModal.classList.add("hidden");
    if (!isAutoPlaying) {
        isAutoPlaying = true;
        autoProgressLoop();
    }
});

skipNoBtn.addEventListener("click", () => {
    skipModal.classList.add("hidden");
});

actTypeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        actTypeBtns.forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        currentActionType = btn.dataset.type;
        targetSelectorArea.classList.add("hidden");
        roleSelectorArea.classList.add("hidden");
        resultSelectorArea.classList.add("hidden");

        if (currentActionType === "accuse" || currentActionType === "defend") {
            targetSelectorArea.classList.remove("hidden");
        } else if (currentActionType === "co") {
            roleSelectorArea.classList.remove("hidden");
        } else if (currentActionType === "report") {
            targetSelectorArea.classList.remove("hidden");
            resultSelectorArea.classList.remove("hidden");
        }
    });
});

function updateTargetSelect() {
    targetSelect.innerHTML = "";
    const me = participants.find(p => p.isPlayer);
    const includeDead = (currentActionType === "report");
    let list = includeDead ? participants : participants.filter(p => p.isAlive);
    list.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        let suffix = "";
        if (!p.isAlive) suffix = "(死亡)";
        if (me && p.id === me.id) suffix += "(自分)";
        option.innerText = p.name + suffix;
        targetSelect.appendChild(option);
    });
}

executeActionBtn.addEventListener("click", () => {
    const me = participants.find(p => p.isPlayer);
    let text = "";
    
    if (currentActionType === "accuse") {
        const targetId = targetSelect.value;
        const target = participants.find(p => p.id === targetId);
        if (targetId === me.id) {
            text = "私を疑ってください！ 私が人狼かもしれませんよ？";
            me.agitation += 20; 
        } else {
            text = `私は ${target.name} さんが怪しいと思います。`;
            applySuspicionImpact(me, target, 20); 
            me.agitation += 10;
        }
    } else if (currentActionType === "defend") {
        const targetId = targetSelect.value;
        const target = participants.find(p => p.id === targetId);
        if (targetId === me.id) {
            text = "私は信じてください！ 絶対に人間です！";
            playerStats.selfDefendCount++;
            me.agitation += 5; 
            if (playerStats.selfDefendCount > 3) applySuspicionImpact(null, me, 10);
        } else {
            text = `私は ${target.name} さんを信じたいです。`;
            applySuspicionImpact(me, target, -40); 
            me.agitation -= 10;
        }
    } else if (currentActionType === "co") {
        const role = roleCoSelect.value;
        text = `【CO】私は ${role} です！`;
        playerStats.coCount++;
        if (playerStats.coCount > 1) {
            text += " (訂正します！)";
            applySuspicionImpact(null, me, 30);
        }
        me.coRole = role; 
        updateMembersList();
    } else if (currentActionType === "report") {
        const targetId = targetSelect.value;
        const target = participants.find(p => p.id === targetId);
        const result = resultSelect.value === "white" ? "人間" : "人狼";
        text = `結果報告です。${target.name} は 【${result}】 でした。`;
        if (result === "人狼") applySuspicionImpact(me, target, 100);
        else applySuspicionImpact(me, target, -50);
        
        applySuspicionImpact(null, me, -10);
    }

    addLog(me.id, text, "normal");
    me.speechCount++; 
    actionModal.classList.add("hidden");
    consumeTurn(); 
});

nextTurnBtn.addEventListener("click", () => {
    if (isSpectator) return;
    playDiscussionTurn();
    consumeTurn(); 
});

function consumeTurn() {
    remainingTurns--;
    updateTurnDisplay();
    if (remainingTurns <= 0) {
        addLog("system", "日が沈みました。強制的に投票の時間です。");
        startVotingPhase();
    }
}

// ==========================================
// 4. 思考エンジン (AI Logic)
// ==========================================
function isAlly(p1, p2) {
    if (!p1 || !p2) return false;
    if (p1.role === "人狼" && p2.role === "人狼") return true;
    if (p1.role === "共有者" && p2.role === "共有者") return true;
    if (p1.role === "狂信者" && p2.role === "人狼") return true;
    if (p1.role === "背徳者" && p2.role === "妖狐") return true;
    return false;
}

function applySuspicionImpact(source, target, amount) {
    if (source && isAlly(source, target) && amount > 0) return;
    
    if (source && amount < 0) {
        if (!target.suspicionMeter) target.suspicionMeter = {};
        target.suspicionMeter[source.id] = (target.suspicionMeter[source.id] || 0) - 50; 
    }

    participants.forEach(p => {
        if (!p.suspicionMeter) p.suspicionMeter = {};
        if (source && p.id === source.id) return;
        
        let impact = amount;
        
        if (amount > 0 && !isAlly(p, source) && target.id === p.id) {
             p.suspicionMeter[source.id] = (p.suspicionMeter[source.id] || 0) + (amount * 0.5); 
        }

        if (amount < 0) {
            target.mental = Math.min(100, target.mental + 5);
        }
        
        if (source && source.agitation > 30) {
            impact = impact * 0.5; 
            p.suspicionMeter[source.id] = (p.suspicionMeter[source.id] || 0) + 5;
        }

        const current = p.suspicionMeter[target.id] || 0;
        p.suspicionMeter[target.id] = current + impact;
    });
}

function chooseTarget(observer, type) {
    const candidates = participants.filter(p => p.id !== observer.id && p.isAlive);
    if (candidates.length === 0) return null;
    
    const knownFox = (observer.role === "背徳者") ? participants.find(p => p.role === "妖狐") : null;
    const seerCOs = participants.filter(p => p.coRole === "占い師");
    const livingSeers = seerCOs.filter(p => p.isAlive);
    const bittenSeers = seerCOs.filter(p => !p.isAlive && p.id !== lastExecutedId); 

    const scores = candidates.map(p => {
        let baseSuspicion = observer.params.suspicion_base || 10;
        let earnedSuspicion = observer.suspicionMeter[p.id] || 0;
        let suspicion = baseSuspicion + earnedSuspicion;
        
        if (observer.params.trust_bias && observer.params.trust_bias[p.id]) {
            suspicion += observer.params.trust_bias[p.id];
        }
        
        if (isAlly(observer, p)) suspicion -= 9999;
        if (p.coRole === "占い師" && observer.role === "占い師") suspicion += 50; 
        if (p.coRole === "人狼") suspicion += 999; 

        if (p.agitation > 40) suspicion += 20;

        if (livingSeers.length === 1 && bittenSeers.length >= 1 && p.id === livingSeers[0].id) {
            suspicion += 100;
        }

        const randomFactor = (Math.random() - 0.5) * 15; 
        return { id: p.id, score: suspicion + randomFactor, data: p };
    });

    if (type === "accuse") {
        scores.sort((a, b) => b.score - a.score); 
        if (scores.length > 0 && scores[0].score < -100) return null;
        const top = scores.slice(0, 2);
        return top[Math.floor(Math.random() * top.length)].data;
    } else {
        scores.sort((a, b) => a.score - b.score);
        const top = scores.slice(0, 2);
        return top[Math.floor(Math.random() * top.length)].data;
    }
}

async function playDiscussionTurn() {
    const speakers = participants.filter(p => !p.isPlayer && p.isAlive);
    if (speakers.length < 1) { if(!isSpectator) addLog("system", "発言できる人がいません..."); return; }
    const speaker = speakers[Math.floor(Math.random() * speakers.length)];

    // COロジック
    if (!speaker.coRole) {
        const LIARS = ["人狼", "狂人", "狂信者", "背徳者", "てるてる坊主", "怪盗"];
        let coTargetRole = null;
        const rand = Math.random();
        
        if (["占い師", "霊媒師"].includes(speaker.role) && rand < 0.3) {
            coTargetRole = speaker.role;
        } 
        else if (LIARS.includes(speaker.role) && rand < 0.15) {
            coTargetRole = Math.random() > 0.5 ? "占い師" : "霊媒師";
        }
        if (speaker.role === "てるてる坊主" && rand < 0.3) {
            coTargetRole = "占い師";
        }

        if (coTargetRole) {
            speaker.coRole = coTargetRole;
            let dialKey = coTargetRole === "占い師" ? "co_seer" : "co_medium";
            let text = getRandomDialogue(speaker, dialKey);
            addLog(speaker.id, text, "angry");
            speaker.speechCount++;
            updateMembersList();
            return; 
        }
    }

    // 結果報告ロジック
    if (speaker.coRole && Math.random() < 0.4) {
        let reportType = null;
        let target = null;
        let result = "white"; 
        
        if (speaker.coRole === "占い師") {
            if (speaker.role === "占い師" && speaker.nightInfo) {
                target = participants.find(p => p.id === speaker.nightInfo.targetId);
                result = speaker.nightInfo.result;
            } else {
                const targets = participants.filter(p => p.id !== speaker.id && p.isAlive);
                target = targets[Math.floor(Math.random() * targets.length)];
                if (isAlly(speaker, target)) result = "white";
                else if (speaker.role === "てるてる坊主") result = "black"; 
                else result = Math.random() > 0.7 ? "black" : "white"; 
            }
            reportType = result === "white" ? "report_seer_white" : "report_seer_black";
        } else if (speaker.coRole === "霊媒師") {
            if (lastExecutedId) {
                target = participants.find(p => p.id === lastExecutedId);
                if (speaker.role === "霊媒師") {
                    result = target.role === "人狼" ? "black" : "white";
                } else {
                    result = Math.random() > 0.5 ? "black" : "white";
                }
                reportType = result === "white" ? "report_medium_white" : "report_medium_black";
            }
        }
        if (reportType && target) {
            let text = getRandomDialogue(speaker, reportType, target);
            addLog(speaker.id, text, "normal");
            speaker.speechCount++;
            if (result === "black") applySuspicionImpact(speaker, target, 100);
            else applySuspicionImpact(speaker, target, -50);
            
            if (speaker.role === "てるてる坊主") speaker.agitation += 20;
            return;
        }
    }

    const aggression = speaker.params.aggressiveness || 50;
    const isAccuseMode = Math.random() * 100 < (aggression + 10); 
    let baseAction = isAccuseMode ? "accuse" : "defend";
    
    let target = chooseTarget(speaker, baseAction);
    if (baseAction === "accuse" && !target) {
        baseAction = "defend";
        target = chooseTarget(speaker, "defend");
    }

    let actionKey = decideAction(speaker, target);

    // ★ 最終安全装置: 仲間への攻撃は絶対にかばうに変更
    if (isAlly(speaker, target) && (actionKey.includes("accuse") || actionKey.includes("fake"))) {
        actionKey = "defend_other";
    }

    if (actionKey === "self_sacrifice") {
        let text = getSpecificDialogue(speaker, "self_sacrifice", null);
        if(!text) text = getRandomDialogue(speaker, "self_sacrifice");
        addLog(speaker.id, text, "sad");
        speaker.agitation += 10;
        speaker.speechCount++;
        return;
    }

    let text = getSpecificDialogue(speaker, actionKey, target);
    if (!text) text = getRandomDialogue(speaker, actionKey, target);
    
    addLog(speaker.id, text, getEmotionFromAction(actionKey));
    if (actionKey.includes("accuse")) {
        const influence = speaker.params.influence || 10;
        applySuspicionImpact(speaker, target, influence / 2); 
        speaker.agitation += 10; 
    } else {
        speaker.agitation = Math.max(0, speaker.agitation - 5); 
    }
    speaker.speechCount++;
}

function decideAction(speaker, target) {
    const mental = speaker.mental || 100;
    let weights = { "accuse_weak": 10, "accuse_strong": 5, "accuse_quiet": 5, "defend_other": 5, "fake_logic": 5, "defend_self": 0 };

    if (["狂人", "狂信者", "背徳者", "てるてる坊主"].includes(speaker.role)) {
        weights["fake_logic"] += 40;
        weights["accuse_strong"] += 20;
    }
    if (speaker.role === "てるてる坊主") {
        weights["fake_logic"] += 60; 
        weights["accuse_strong"] += 50; 
    }

    const logic = speaker.params.logic || 50;
    if (logic > 70 && target && target.agitation > 50) return "accuse_quiet";

    if (speaker.id === "noriomi") {
        weights["accuse_weak"] += 20; weights["defend_other"] += 30; 
        if (speaker.role === "人狼") weights["fake_logic"] = 0; 
        if (speaker.role === "村人") weights["self_sacrifice"] = 50; 
    } else {
        if (speaker.mbti === "ENTJ") { weights["accuse_strong"] += 30; weights["fake_logic"] += 10; }
        else if (speaker.mbti === "ISFP") { weights["defend_other"] += 30; weights["fake_logic"] += 20; }
        else if (speaker.mbti === "ESTP") { weights["fake_logic"] += 30; weights["accuse_strong"] += 20; }
        else if (speaker.mbti === "ESFJ") { weights["defend_other"] += 40; }
    }

    if (mental < 20) return "collapse";

    if(target) {
        let currentSuspicion = (speaker.suspicionMeter[target.id] || 0);
        if (speaker.params.trust_bias && speaker.params.trust_bias[target.id]) {
            currentSuspicion += speaker.params.trust_bias[target.id];
        }

        if (remainingTurns < MAX_TURNS/2 && target.speechCount < 2) {
             weights["accuse_quiet"] += 50;
        } else {
             weights["accuse_quiet"] = 0; 
        }

        if (currentSuspicion > 40) { weights["accuse_strong"] += 50; weights["defend_other"] = 0; } 
        else if (currentSuspicion < -10) { weights["defend_other"] += 100; weights["accuse_strong"] = 0; weights["accuse_weak"] = 0; }
    }

    let total = 0;
    for (let key in weights) total += weights[key];
    let rand = Math.random() * total;
    for (let key in weights) {
        if (rand < weights[key]) return key;
        rand -= weights[key];
    }
    return "accuse_weak";
}

// ... (投票フェーズなどはそのまま) ...
function startVotingPhase() {
    nextTurnBtn.disabled = true;
    playerActBtn.disabled = true;

    if (isSpectator) {
        submitVote(null);
        return;
    }

    const me = participants.find(p => p.isPlayer);
    if (!me.isAlive) {
        skipBtn.classList.remove("hidden");
        addLog("system", "あなたは霊界にいるため投票できません。");
        setTimeout(() => submitVote(null), 1500); 
        return;
    }

    const modal = document.createElement("div");
    modal.id = "vote-modal";
    modal.className = "modal"; 
    let html = `
        <div class="modal-content" style="max-width:600px;">
            <h3><i class="fa-solid fa-gavel"></i> 処刑投票</h3>
            <p>処刑する人を選んでください。</p>
            <div class="vote-list">
    `;
    participants.filter(p => p.isAlive).forEach(p => {
        let imgSrc = (p.isPlayer && playerCustomImg) ? playerCustomImg : `img/${p.img}.png`;
        html += `
            <div class="vote-card" onclick="submitVote('${p.id}')">
                <img src="${imgSrc}" onerror="this.src='https://via.placeholder.com/60'">
                <div>${p.name}</div>
            </div>
        `;
    });
    html += `</div></div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);
    voteModal = modal;
}

async function submitVote(playerVoteTargetId) {
    if (voteModal) { document.body.removeChild(voteModal); voteModal = null; }
    addLog("system", "=== 投票の時間です ===");

    const voters = participants.filter(p => p.isAlive);
    const votes = {}; 

    for (const voter of voters) {
        let voteTargetId = null;
        let target = null;

        if (voter.isPlayer) {
            voteTargetId = playerVoteTargetId;
            target = participants.find(p => p.id === voteTargetId);
        } else {
            target = chooseTarget(voter, "accuse");
            if (target && target.id === voter.id) {
                voteTargetId = target.id;
                let voteText = getSpecificDialogue(voter, "self_vote", null);
                if(!voteText) voteText = getRandomDialogue(voter, "self_vote");
                await sleep(300);
                addLog(voter.id, voteText, "sad");
            } else {
                if (target) {
                    voteTargetId = target.id;
                    let voteText = getSpecificDialogue(voter, "vote", target);
                    if(!voteText) voteText = getRandomDialogue(voter, "vote", target);
                    await sleep(300); 
                    addLog(voter.id, voteText, "angry");
                }
            }
        }
        if (voteTargetId) votes[voteTargetId] = (votes[voteTargetId] || 0) + 1;
    }

    addLog("system", "=== 開票結果 ===");
    await sleep(1000);

    let maxVotes = -1;
    let executedId = null;
    let tie = false;

    for (const [tid, count] of Object.entries(votes)) {
        const target = participants.find(p => p.id === tid);
        addLog("system", `${target.name}: ${count}票`);
        if (count > maxVotes) { maxVotes = count; executedId = tid; tie = false; }
        else if (count === maxVotes) { tie = true; }
    }

    if (tie) {
        addLog("system", "同票のため、処刑は行われませんでした。");
    } else if (executedId) {
        const executed = participants.find(p => p.id === executedId);
        executed.isAlive = false;
        executed.status = "dead";
        
        const executionMsg = document.createElement("div");
        executionMsg.className = "execution-log";
        executionMsg.innerHTML = `💀 ${executed.name} が処刑されました...`;
        dialogueArea.appendChild(executionMsg);
        
        let lastWord = getRandomDialogue(executed, "last_words");
        addLog(executed.id, lastWord, "sad"); 
        
        lastExecutedId = executedId;

        if (executed.role === "てるてる坊主") {
            showResultScreen("teru");
            return;
        }
        if (executed.role === "猫又") handleCatDeath(executed);
        if (executed.role === "妖狐") handleFoxDeath();
    } else {
        lastExecutedId = null;
    }
    
    updateMembersList();
    if (!checkWinCondition()) {
        setTimeout(startNightPhase, 2000); 
    }
}

function handleCatDeath(cat) {
    const aliveOthers = participants.filter(p => p.isAlive && p.id !== cat.id);
    if (aliveOthers.length > 0) {
        const victim = aliveOthers[Math.floor(Math.random() * aliveOthers.length)];
        victim.isAlive = false;
        victim.status = "dead";
        addLog("system", `猫又の道連れにより、${victim.name} も死亡しました...`);
    }
}
function handleFoxDeath() {
    const immoralists = participants.filter(p => p.role === "背徳者" && p.isAlive);
    immoralists.forEach(p => {
        p.isAlive = false;
        p.status = "dead";
        addLog("system", `妖狐の後を追って、背徳者 ${p.name} が死亡しました...`);
    });
}

function checkWinCondition() {
    const wolves = participants.filter(p => p.isAlive && p.role === "人狼").length;
    const humans = participants.filter(p => p.isAlive && p.role !== "人狼" && p.role !== "妖狐").length;
    const foxes = participants.filter(p => p.isAlive && p.role === "妖狐").length;

    if (wolves === 0 || wolves >= humans + foxes) {
        if (foxes > 0) { showResultScreen("fox"); return true; }
    }
    if (wolves === 0) { showResultScreen("human"); return true; }
    else if (wolves >= humans + foxes) { showResultScreen("wolf"); return true; }
    return false;
}

// ★ 全員発言リザルト
async function showResultScreen(winnerType) {
    playBgm("title"); 
    resultModal.classList.remove("hidden");
    
    let titleText = "";
    let color = "";
    if (winnerType === "human") { titleText = "VILLAGERS WIN"; color = "#00ccff"; resultModal.classList.add("win-human"); }
    else if (winnerType === "wolf") { titleText = "WEREWOLVES WIN"; color = "#ff0055"; resultModal.classList.add("win-wolf"); }
    else if (winnerType === "fox") { titleText = "FOX WINS"; color = "#ffaa00"; resultModal.classList.add("win-fox"); }
    else if (winnerType === "teru") { titleText = "TERU-TERU WINS"; color = "#eeeeee"; resultModal.classList.add("win-teru"); }

    resultTitle.innerText = titleText;
    resultTitle.style.color = color;
    resultGrid.innerHTML = "";
    
    for (const p of participants) {
        let isWinner = false;
        if (winnerType === "human" && ["村人", "占い師", "霊媒師", "騎士", "共有者", "番犬", "猫又", "訪問者", "パン屋"].includes(p.role)) isWinner = true;
        if (winnerType === "wolf" && ["人狼", "狂人", "狂信者"].includes(p.role)) isWinner = true;
        if (winnerType === "fox" && ["妖狐", "背徳者"].includes(p.role)) isWinner = true;
        if (winnerType === "teru" && p.role === "てるてる坊主") isWinner = true;

        let imgSrc = (p.isPlayer && playerCustomImg) ? playerCustomImg : `img/${p.img}.png`;
        const div = document.createElement("div");
        div.className = "result-card";
        
        // ★ 強制的に全員喋らせる
        let type = isWinner ? "win" : "lose";
        let text = getRandomDialogue(p, type);
        let bubbleId = `bubble-${p.id}`;
        let commentHtml = `<div id="${bubbleId}" class="result-comment">${text}</div>`;

        div.innerHTML = `<img src="${imgSrc}" onerror="this.src='https://via.placeholder.com/60'"><div>${p.name}</div><span class="role-badge">${p.role}</span>${commentHtml}`;
        
        div.onclick = () => {
            const bubble = document.getElementById(`bubble-${p.id}`);
            if (bubble) bubble.classList.toggle("hidden-bubble");
        };

        resultGrid.appendChild(div);
    }
}

// ==========================================
// 6. 夜フェーズ (Night Phase) 
// ==========================================
async function startNightPhase() {
    playBgm("night");
    addLog("system", "夜が来ました。");
    const nightOverlay = document.createElement("div");
    nightOverlay.className = "night-overlay";
    nightOverlay.innerHTML = `<div class="night-title">🌙 Night Phase</div><p>夜の行動を選択中...</p>`;
    document.body.appendChild(nightOverlay);
    const me = participants.find(p => p.isPlayer);
    let myActionTarget = null;

    // ★怪盗の処理 (初日のみ)
    if (me && me.role === "怪盗" && dayCount === 1) {
         nightOverlay.innerHTML += `<p>役職を盗む相手を選んでください。</p>`;
         let actionHTML = `<div style="margin-top:20px; display:flex; flex-wrap:wrap; justify-content:center;">`;
         const targets = participants.filter(p => !p.isPlayer);
         targets.forEach(t => {
            actionHTML += `<button onclick="setNightAction('${t.id}')" style="margin:5px; padding:10px 20px; background:#444; color:white; border:none;">${t.name}</button>`;
         });
         actionHTML += `</div>`;
         nightOverlay.innerHTML += actionHTML;
         myActionTarget = await new Promise(resolve => {
            window.setNightAction = (id) => resolve(id);
         });
    }
    // ... (他の役職処理) ...
    // ★ 修正: 観戦モード・死者・スキップ中は待つ
    else if (isSpectator || (me && !me.isAlive) || isSkipping) {
        await sleep(isSkipping ? 0 : 2000);
    } 
    // ★ 修正: 生存プレイヤーの行動
    else if (me && ["人狼", "占い師", "騎士", "共有者", "番犬", "訪問者"].includes(me.role)) {
        if (me.role === "人狼" || me.role === "共有者") {
            const partnerRole = me.role;
            const partners = participants.filter(p => p.role === partnerRole && p.isAlive && !p.isPlayer);
            if (partners.length > 0) {
                await sleep(1000);
                const partner = partners[0];
                let targets = participants.filter(p => p.isAlive && p.role !== partnerRole);
                let t = targets[Math.floor(Math.random() * targets.length)];
                let msg = me.role === "人狼" ? getRandomDialogue(partner, "decide_target", t) : getRandomDialogue(partner, "shared_chat", t);
                const chatDiv = document.createElement("div");
                chatDiv.className = "night-chat";
                chatDiv.innerHTML = `<strong>${partner.name}</strong>: ${msg}`;
                nightOverlay.appendChild(chatDiv);
            }
        }

        // 番犬2日目
        if (me.role === "番犬" && dayCount > 1) {
            const owner = participants.find(p => p.id === me.watchdogTarget);
            if (!owner || !owner.isAlive) {
                nightOverlay.innerHTML += `<p>飼い主 (${owner ? owner.name : "不明"}) は既に死亡しています。</p>`;
                await sleep(2000);
            } else {
                nightOverlay.innerHTML += `<p>飼い主: <strong>${owner.name}</strong></p><button id="dog-protect-btn" class="night-action-btn btn-protect">守る (Protect)</button><button id="dog-attack-btn" class="night-action-btn btn-attack">噛む (Attack)</button>`;
                myActionTarget = await new Promise(resolve => {
                    document.getElementById("dog-protect-btn").onclick = () => { nightOverlay.innerHTML = `<p>${owner.name} を守ります。</p>`; resolve("protect"); };
                    document.getElementById("dog-attack-btn").onclick = () => { nightOverlay.innerHTML = `<p>${owner.name} を噛みます！</p>`; resolve("attack"); };
                });
            }
        } else {
            let actionHTML = `<div style="margin-top:20px; display:flex; flex-wrap:wrap; justify-content:center;">`;
            const targets = participants.filter(p => {
                if (!p.isAlive || p.id === me.id) return false;
                // ★ 同族選択禁止 (人狼のみ)
                if (me.role === "人狼" && p.role === "人狼") return false; 
                return true;
            });
            targets.forEach(t => {
                const btnColor = "#444"; 
                actionHTML += `<button onclick="setNightAction('${t.id}')" style="margin:5px; padding:10px 20px; background:${btnColor}; color:white; border:none; border-radius:5px; font-size:1.1rem; cursor:pointer;">${t.name}</button>`;
            });
            actionHTML += `</div>`;
            nightOverlay.innerHTML += actionHTML;

            myActionTarget = await new Promise(resolve => {
                window.setNightAction = (id) => {
                    nightOverlay.innerHTML = `<div class="night-title">🌙 Night Phase</div><p>行動を受け付けました。朝を待っています...</p>`;
                    resolve(id);
                };
            });
        }
    } else {
        await sleep(2000); 
    }

    const nightActions = { wolf: null, guard: null, divine: null, visit: null, dog: null, thief: null };

    // ★ 怪盗処理
    if (me && me.role === "怪盗" && dayCount === 1) nightActions.thief = myActionTarget;
    else if (dayCount === 1) {
        const aiThief = participants.find(p => p.role === "怪盗" && !p.isPlayer);
        if (aiThief) {
            const targets = participants.filter(p => p.id !== aiThief.id);
            nightActions.thief = targets[Math.floor(Math.random() * targets.length)].id;
        }
    }

    // 1. 人狼
    if (me && me.role === "人狼" && me.isAlive) nightActions.wolf = myActionTarget;
    else {
        const wolves = participants.filter(p => p.role === "人狼" && p.isAlive);
        if (wolves.length > 0) {
            let victims = participants.filter(p => p.role !== "人狼" && p.isAlive);
            let priorityVictims = victims.filter(p => p.coRole === "占い師" || p.role === "占い師");
            if (priorityVictims.length > 0) victims = priorityVictims;
            
            if (victims.length > 0) nightActions.wolf = victims[Math.floor(Math.random() * victims.length)].id;
        }
    }

    // 2. 騎士
    if (me && me.role === "騎士" && me.isAlive) nightActions.guard = myActionTarget;
    else {
        const knight = participants.find(p => p.role === "騎士" && p.isAlive && !p.isPlayer);
        if (knight) {
            const targets = participants.filter(p => p.isAlive && p.id !== knight.id);
            nightActions.guard = targets[Math.floor(Math.random() * targets.length)].id;
        }
    }

    // 3. 番犬
    if (me && me.role === "番犬" && me.isAlive) {
        if (dayCount === 1) { me.watchdogTarget = myActionTarget; nightActions.dog = me.watchdogTarget; }
        else { if (myActionTarget === "attack") nightActions.dogAttack = me.watchdogTarget; else nightActions.dog = me.watchdogTarget; }
    } else {
        const dog = participants.find(p => p.role === "番犬" && p.isAlive && !p.isPlayer);
        if (dog) {
            if (dayCount === 1) {
                const targets = participants.filter(p => p.isAlive && p.id !== dog.id);
                dog.watchdogTarget = targets[Math.floor(Math.random() * targets.length)].id;
                nightActions.dog = dog.watchdogTarget;
            } else { nightActions.dog = dog.watchdogTarget; }
        }
    }

    // 4. 訪問者
    if (me && me.role === "訪問者" && me.isAlive) { nightActions.visit = myActionTarget; }
    else {
        const visitor = participants.find(p => p.role === "訪問者" && p.isAlive && !p.isPlayer);
        if (visitor) {
            const targets = participants.filter(p => p.isAlive && p.id !== visitor.id);
            nightActions.visit = targets[Math.floor(Math.random() * targets.length)].id;
        }
    }

    // 5. 占い師
    let divineTargetId = null;
    if (me && me.role === "占い師" && me.isAlive) divineTargetId = myActionTarget;
    else {
        const aiSeer = participants.find(p => p.role === "占い師" && p.isAlive && !p.isPlayer);
        if (aiSeer) {
            const targets = participants.filter(p => p.id !== aiSeer.id && p.isAlive);
            divineTargetId = targets[Math.floor(Math.random() * targets.length)].id;
        }
    }
    if (divineTargetId) {
        nightActions.divine = divineTargetId;
        const target = participants.find(p => p.id === divineTargetId);
        if (me && me.role === "占い師" && me.isAlive) {
            let result = (target.role === "人狼") ? "人狼" : "人間";
            alert(`🔮 占い結果: ${target.name} は 【${result}】 でした。`);
            me.nightInfo = { targetId: target.id, result: result === "人狼" ? "black" : "white" };
        }
    }

    await sleep(isSkipping ? 0 : 2000);
    document.body.removeChild(nightOverlay);
    resolveNight(nightActions);
}

function resolveNight(actions) {
    remainingTurns = MAX_TURNS; 
    updateTurnDisplay();
    playBgm("noon");
    addLog("system", "=== 朝が来ました ===");
    
    // 怪盗
    if (actions.thief) {
        const thief = participants.find(p => p.role === "怪盗");
        const target = participants.find(p => p.id === actions.thief);
        if (thief && target) {
            const stolenRole = target.role;
            target.role = "村人";
            thief.role = stolenRole;
            if (thief.isPlayer) alert(`🎩 怪盗成功！ あなたは ${stolenRole} になりました！`);
        }
    }

    if (actions.divine) {
        const divined = participants.find(p => p.id === actions.divine);
        if (divined.role === "妖狐" && divined.isAlive) {
            divined.isAlive = false;
            divined.status = "dead";
            addLog("system", `${divined.name} が無残な姿で発見されました... (呪殺)`);
            handleFoxDeath(); 
        }
    }
    const kills = [];
    if (actions.wolf) kills.push({ id: actions.wolf, type: "wolf" });
    if (actions.dogAttack) kills.push({ id: actions.dogAttack, type: "dog" });
    let peace = true;
    kills.forEach(kill => {
        const victim = participants.find(p => p.id === kill.id);
        if (!victim || !victim.isAlive) return;
        let isProtected = false;
        if (actions.guard === victim.id) isProtected = true;
        if (actions.dog === victim.id) isProtected = true;
        if (kill.type === "dog") isProtected = false; 
        if (isProtected) {
        } else if (victim.role === "妖狐" && kill.type === "wolf") {
        } else {
            victim.isAlive = false;
            victim.status = "dead";
            addLog("system", `昨夜、${victim.name} が無残な姿で発見されました...`);
            peace = false;
            if (victim.role === "猫又") handleCatDeath(victim);
        }
    });
    if (peace) addLog("system", "昨夜は平和でした。");

    if (actions.visit) {
        const target = participants.find(p => p.id === actions.visit);
        const visitor = participants.find(p => p.role === "訪問者" && p.isAlive);
        if (target && target.isPlayer && visitor) {
            addLog(target.id, `(訪問通知: 昨夜、${visitor.name} が部屋に来ました！白確定です！)`, "normal");
        }
        if (visitor && target) {
            if (!target.suspicionMeter) target.suspicionMeter = {}; target.suspicionMeter[visitor.id] = -999; 
            if (!visitor.suspicionMeter) visitor.suspicionMeter = {}; visitor.suspicionMeter[target.id] = -100;
        }
        const me = participants.find(p => p.isPlayer);
        if (me && me.role === "番犬" && me.isAlive && actions.visit === me.watchdogTarget) {
            if (visitor) addLog(me.id, `(番犬通知: 飼い主の元に ${visitor.name} が訪れました)`, "normal");
        }
    }

    updateMembersList();
    updateAllyList();
    if (!checkWinCondition()) {
        dayCount++;
        const me = participants.find(p => p.isPlayer);
        if (!isSpectator && me) nextTurnBtn.disabled = false;
        if (!isSpectator && me && me.isAlive) playerActBtn.disabled = false;
        addLog("system", `=== ${dayCount}日目の議論を開始します ===`);
        if (isSpectator && me) checkMorningEvents(me); 
        else if (me) checkMorningEvents(me);
        if (isAutoPlaying || isSpectator) { autoProgressLoop(); }
    }
}

// 共通関数
async function playIntroPhase() {
    const npcs = participants.filter(p => !p.isPlayer && p.isAlive);
    for (const npc of npcs) {
        await sleep(600);
        let text = getSpecificDialogue(npc, "intro", null);
        if (!text) text = getRandomDialogue(npc, "intro");
        addLog(npc.id, text, "intro");
    }
    addLog("system", "自己紹介終了。");
}

function getRandomDialogue(char, type, target = null) {
    if (!char.dialogues || !char.dialogues[type] || char.dialogues[type].length === 0) return "……";
    const lines = char.dialogues[type];
    let text = lines[Math.floor(Math.random() * lines.length)];
    if (target) {
        if (target.id === char.id) text = text.replace(/{target}/g, "私");
        else text = text.replace(/{target}/g, target.name);
    } else {
        text = text.replace(/{target}/g, "みんな");
    }
    return text;
}

function getSpecificDialogue(char, situation, target) {
    if (!char.dialogues || !char.dialogues.specific) return null;
    const targetId = target ? target.id : null; 
    if (!Array.isArray(char.dialogues.specific)) return null;

    const match = char.dialogues.specific.find(spec => {
        const targetMatch = (spec.target === targetId);
        const situationMatch = (spec.situation === situation) || situation.startsWith(spec.situation);
        if (situation === "intro" && spec.target) return false; 
        return targetMatch && situationMatch;
    });

    if (match && match.texts && match.texts.length > 0) {
        const lines = match.texts;
        let text = lines[Math.floor(Math.random() * lines.length)];
        if(target) text = text.replace(/{target}/g, target.name);
        return text;
    }
    return null;
}

function getEmotionFromAction(action) {
    if (action.includes("accuse") || action.includes("strong")) return "angry";
    if (action.includes("fake")) return "confused";
    return "normal";
}

function addLog(charId, text, emotion = "normal") {
    if (!dialogueArea) return;
    const logItem = document.createElement("div");
    logItem.style.marginBottom = "10px";
    logItem.style.display = "flex";
    logItem.style.alignItems = "center";
    
    if (charId === "system") {
        logItem.innerHTML = `<span style="color:#ffcc00; font-weight:bold; width:100%; text-align:center; display:block; padding:10px; background:rgba(255,200,0,0.1); border-radius:5px;">📢 ${text}</span>`;
    } else {
        const char = participants.find(p => p.id === charId);
        if (!char) return;
        let imgSrc = char.isPlayer ? `img/${char.img}.png` : `img/${char.img}_${emotion}.png`;
        let fallbackSrc = `img/${char.img}.png`;
        
        let markHtml = "";
        const me = participants.find(p => p.isPlayer);
        if (isSpectator) {
             markHtml = getChatBadgeHTML(char.role); // ★ ここで正しい関数を呼ぶ！
        } else if (me && isAlly(me, char) && me.id !== char.id) {
             markHtml = getChatBadgeHTML(char.role); // ★ ここも！
        }
        if (me && me.role === "番犬" && me.watchdogTarget === char.id) {
            markHtml = `<span class="chat-role-mark mark-dog">🐕</span>`;
        }
        // プレイヤー画像反映
        if (char.isPlayer && playerCustomImg) {
            imgSrc = playerCustomImg;
        }

        logItem.innerHTML = `
            <img src="${imgSrc}" onerror="this.src='${fallbackSrc}'" 
                 class="char-icon" 
                 style="margin-right:10px; flex-shrink:0;">
            <div>
                <div style="font-size:0.8rem; color:#ccc;">
                    ${char.name} (${char.class}) ${markHtml}
                </div>
                <div style="background:rgba(255,255,255,0.1); padding:8px; border-radius:8px; line-height:1.4; word-break:break-word;">${text}</div>
            </div>
        `;
    }
    dialogueArea.appendChild(logItem);
    
    const scrollContainer = document.querySelector('.scroll-content');
    if (scrollContainer) {
        setTimeout(() => {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 50);
    }
}
