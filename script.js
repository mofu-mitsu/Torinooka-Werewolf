// ==========================================
// script.js - とりの丘人狼 メインロジック (修正版: shuffleArray追加)
// ==========================================

// --- グローバル変数 ---
let playerName = "あなた";
let selectedCharIds = [];
let participants = []; 
const CLASSES = ["1-1", "1-2", "1-3", "1-4", "2-1", "2-2", "3-1", "3-2"];

// --- DOM要素 ---
const titleScreen = document.getElementById("title-screen");
const selectionScreen = document.getElementById("selection-screen");
const gameScreen = document.getElementById("game-screen");

const nameInput = document.getElementById("player-name-input");
const toSelectionBtn = document.getElementById("to-selection-btn");
const tabsContainer = document.getElementById("class-tabs");
const charGrid = document.getElementById("char-grid");
const selectedCountSpan = document.getElementById("selected-count");
const gameStartBtn = document.getElementById("game-start-btn");

const myRoleCard = document.getElementById("my-role-card");
const membersList = document.getElementById("members-list");
const startDayBtn = document.getElementById("start-day-btn");

// プロフィール表示用
const detailBox = document.getElementById("char-details-preview");
const detailImg = document.getElementById("detail-img");
const detailName = document.getElementById("detail-name");
const detailGender = document.getElementById("detail-gender");
const detailMbti = document.getElementById("detail-mbti");
const detailClass = document.getElementById("detail-class");
const detailProfile = document.getElementById("detail-profile");

// ゲーム画面パーツ
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
const votePhaseBtn = document.getElementById("vote-phase-btn");

// 議論ログエリア
let dialogueArea = null; 

// ==========================================
// 1. タイトル画面
// ==========================================
toSelectionBtn.addEventListener("click", () => {
    const inputVal = nameInput.value.trim();
    playerName = inputVal === "" ? "あなた" : inputVal;
    
    titleScreen.classList.add("hidden");
    selectionScreen.classList.remove("hidden");
    renderTabs("1-1");
    renderChars("1-1");
});

// ==========================================
// 2. キャラ選択画面
// ==========================================
function renderTabs(activeClass) {
    tabsContainer.innerHTML = "";
    CLASSES.forEach(cls => {
        const btn = document.createElement("button");
        btn.innerText = cls;
        btn.className = "tab-btn";
        if (cls === activeClass) btn.classList.add("active");
        btn.onclick = () => {
            renderTabs(cls);
            renderChars(cls);
        };
        tabsContainer.appendChild(btn);
    });
}

function renderChars(targetClass) {
    charGrid.innerHTML = "";
    const targets = charactersData.filter(c => c.class === targetClass);

    if (targets.length === 0) {
        charGrid.innerHTML = "<p style='color:#ccc; margin:auto;'>データ準備中...</p>";
        return;
    }

    targets.forEach(char => {
        const card = document.createElement("div");
        card.className = "char-card";
        if (selectedCharIds.includes(char.id)) card.classList.add("selected");

        const imgSrc = `img/${char.img}.png`;

        card.innerHTML = `
            <img src="${imgSrc}" class="char-icon" onerror="this.src='https://via.placeholder.com/60?text=?'">
            <div class="char-name">${char.name}</div>
        `;

        card.onclick = () => {
            toggleCharSelection(char.id, card);
            showCharProfile(char);
        };
        charGrid.appendChild(card);
    });
}

function showCharProfile(char) {
    detailBox.classList.remove("hidden");
    detailImg.src = `img/${char.img}.png`;
    detailImg.onerror = () => { detailImg.src = 'https://via.placeholder.com/70'; };
    
    detailName.innerText = char.fullName || char.name;
    const genderIcon = char.gender === 'male' ? '<i class="fa-solid fa-mars"></i> 男子' : '<i class="fa-solid fa-venus"></i> 女子';
    detailGender.innerHTML = genderIcon;
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
    gameStartBtn.innerText = `ゲーム開始！ (${count}人 + ${playerName})`;
    
    if (count > 0) {
        gameStartBtn.classList.remove("disabled");
        gameStartBtn.disabled = false;
    } else {
        gameStartBtn.classList.add("disabled");
        gameStartBtn.disabled = true;
    }
}

// ==========================================
// 3. ゲーム開始 & 配役
// ==========================================

gameStartBtn.addEventListener("click", () => {
    // 参加者が0人だとエラーになるのでガード
    if (selectedCharIds.length === 0) {
        alert("参加者を最低1人は選んでね！");
        return;
    }

    setupParticipants();
    assignRoles();
    
    selectionScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    
    renderGameScreen();
    createDialogueArea(); 
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
            mental: charData.params.mental || 100 
        });
    });

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
        dialogues: {}
    });
}

function assignRoles() {
    const total = participants.length;
    let roles = [];
    if (total <= 4) roles = ["人狼", "狂人", "村人", "村人"];
    else if (total <= 6) roles = ["人狼", "狂人", "占い師", "村人", "村人", "村人"];
    else if (total <= 9) roles = ["人狼", "人狼", "狂人", "占い師", "騎士", "村人", "村人", "村人", "村人"];
    else {
        const base = ["人狼", "人狼", "人狼", "狂人", "占い師", "騎士", "霊媒師", "パン屋"];
        const villagers = total - base.length;
        for(let i=0; i<villagers; i++) base.push("村人");
        roles = base.slice(0, total);
    }
    
    // ★ここがエラーの原因だった！関数を追加したので動くはず！
    roles = shuffleArray(roles); 

    participants.forEach((p, index) => {
        p.role = roles[index];
    });
    console.log("配役完了:", participants);
}

function renderGameScreen() {
    const me = participants.find(p => p.isPlayer);
    const roleInfo = getRoleDisplayInfo(me.role);
    gameScreen.setAttribute("data-my-role", me.role);

    myRoleCard.className = `role-card ${roleInfo.cssClass}`;
    const cardImgPath = roleInfo.img; 
    myRoleCard.innerHTML = `
        <img src="${cardImgPath}" style="width:80px; height:80px; margin-bottom:10px;" onerror="this.style.display='none'">
        <span>${me.role}</span>
    `;
    updateMembersList();
}

function updateMembersList() {
    membersList.innerHTML = "";
    participants.forEach(p => {
        const chip = document.createElement("div");
        chip.className = `member-chip ${p.isPlayer ? "is-player" : ""}`;
        if (!p.isAlive) chip.classList.add("dead"); 
        const imgSrc = `img/${p.img}.png`;
        chip.innerHTML = `
            <img src="${imgSrc}" onerror="this.src='https://via.placeholder.com/40'">
            <span>${p.name}</span>
        `;
        membersList.appendChild(chip);
    });
}

function getRoleDisplayInfo(roleName) {
    const map = {
        "村人": { css: "role-villager", img: "villager" },
        "人狼": { css: "role-wolf", img: "wolf" },
        "占い師": { css: "role-seer", img: "seer" },
        "霊媒師": { css: "role-medium", img: "medium" },
        "騎士": { css: "role-knight", img: "knight" },
        "狂人": { css: "role-madman", img: "madman" },
        "パン屋": { css: "role-villager", img: "baker" }
    };
    const info = map[roleName] || { css: "role-villager", img: "villager" };
    return { cssClass: info.css, img: `img/cards/${info.img}.png` };
}

function createDialogueArea() {
    dialogueArea = document.getElementById("dialogue-area");
    if (dialogueArea) {
        dialogueArea.innerHTML = "";
    } else {
        console.error("Error: dialogue-area not found in HTML!");
    }
}

// ==========================================
// 4. 議論パート
// ==========================================

startDayBtn.addEventListener("click", () => {
    // 1. レイアウト切り替え
    startDayBtn.classList.add("hidden");
    gameSetupArea.classList.add("hidden"); // デカいカードを消す
    discussionHeader.classList.remove("hidden"); // 上部バーを表示
    dialogueArea.classList.remove("hidden");
    actionButtons.classList.remove("hidden"); // 操作ボタン表示

    // 2. ミニヘッダーに情報をセット
    const me = participants.find(p => p.isPlayer);
    const roleInfo = getRoleDisplayInfo(me.role);
    miniRoleIcon.innerHTML = `<img src="${roleInfo.img}" style="width:100%; height:100%;">`;
    miniRoleText.innerText = `${me.role}`;

    addLog("system", "=== 1日目の朝が来ました ===");
    
    // イントロ開始
    playIntroPhase();
});

// --- 内訳モーダル操作 ---
showInfoBtn.addEventListener("click", () => {
    updateRoleBreakdown();
    infoModal.classList.remove("hidden");
});
closeModalBtn.addEventListener("click", () => {
    infoModal.classList.add("hidden");
});

function updateRoleBreakdown() {
    const breakdown = {};
    participants.forEach(p => {
        breakdown[p.role] = (breakdown[p.role] || 0) + 1;
    });

    roleBreakdownList.innerHTML = "";
    for (const [role, count] of Object.entries(breakdown)) {
        const li = document.createElement("li");
        li.innerHTML = `<span>${role}</span> <span>x ${count}</span>`;
        roleBreakdownList.appendChild(li);
    }
}

// --- 議論進行ロジック ---

// 議論を進めるボタン
nextTurnBtn.addEventListener("click", () => {
    playDiscussionTurn();
});

// イントロフェーズ
async function playIntroPhase() {
    const npcs = participants.filter(p => !p.isPlayer && p.isAlive);
    
    // specificチェック
    for (const npc of npcs) {
        await sleep(600);
        let text = getSpecificDialogue(npc, "intro", null); 
        
        if (!text) {
            text = getRandomDialogue(npc, "intro"); 
        }
        addLog(npc.id, text, "intro");
    }
    addLog("system", "自己紹介終了。議論を開始します。（「議論を進める」を押してね）");
}

// 議論1ターン分
async function playDiscussionTurn() {
    const speakers = participants.filter(p => !p.isPlayer && p.isAlive);
    if (speakers.length < 2) return; 

    const speaker = speakers[Math.floor(Math.random() * speakers.length)];
    const targets = participants.filter(p => p.id !== speaker.id && p.isAlive);
    const target = targets[Math.floor(Math.random() * targets.length)];

    // 行動決定 (簡易ランダム)
    const actionType = Math.random() > 0.3 ? "accuse" : "defend"; 

    // Specificチェック
    let text = getSpecificDialogue(speaker, actionType, target);

    if (!text) {
        // 通常会話
        let dialKey = actionType === "accuse" ? 
            (Math.random() > 0.5 ? "accuse_strong" : "accuse_weak") : "defend_other";
        
        text = getRandomDialogue(speaker, dialKey, target);
    }

    addLog(speaker.id, text);
}


// --- Specific会話の取得 ---
function getSpecificDialogue(char, situation, target) {
    if (!char.dialogues || !char.dialogues.specific) return null;

    const match = char.dialogues.specific.find(spec => {
        // targetが指定されている場合はID一致チェック
        const targetMatch = target ? (spec.target === target.id) : true;
        // situationの前方一致 (accuse_weak -> accuse)
        const situationMatch = spec.situation === situation || situation.startsWith(spec.situation);

        return targetMatch && situationMatch;
    });

    if (match) {
        const lines = match.texts;
        let text = lines[Math.floor(Math.random() * lines.length)];
        if(target) text = text.replace(/{target}/g, target.name);
        return text;
    }
    return null;
}

// --- 共通関数 ---

function getRandomDialogue(char, type, target = null) {
    if (!char.dialogues || !char.dialogues[type]) return "……";
    
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

function addLog(charId, text, emotion = "normal") {
    if (!dialogueArea) return;

    const logItem = document.createElement("div");
    logItem.style.marginBottom = "10px";
    logItem.style.display = "flex";
    logItem.style.alignItems = "center";
    
    if (charId === "system") {
        logItem.innerHTML = `<span style="color:#ffcc00; font-weight:bold; width:100%; text-align:center; display:block; padding:10px; background:rgba(255,200,0,0.1);">📢 ${text}</span>`;
    } else {
        const char = participants.find(p => p.id === charId);
        if (!char) return;

        const imgSrc = `img/${char.img}_${emotion}.png`;
        const fallbackSrc = `img/${char.img}.png`;

        logItem.innerHTML = `
            <img src="${imgSrc}" onerror="this.src='${fallbackSrc}'" 
                 style="width:50px; height:50px; border-radius:50%; margin-right:10px; border:2px solid #fff; object-fit:cover; flex-shrink:0;">
            <div>
                <div style="font-size:0.8rem; color:#ccc;">${char.name} (${char.class})</div>
                <div style="background:rgba(255,255,255,0.1); padding:8px; border-radius:8px; line-height:1.4;">${text}</div>
            </div>
        `;
    }
    dialogueArea.appendChild(logItem);
    dialogueArea.scrollTop = dialogueArea.scrollHeight; 
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ★迷子になってた関数をここに追加！★
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
