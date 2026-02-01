// ==========================================
// script.js - とりの丘人狼 メインロジック
// ==========================================

// --- グローバル変数 ---
let playerName = "あなた";
let selectedCharIds = [];
let participants = []; // ゲーム参加者（プレイヤー + NPC）
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
const detailBox = document.getElementById("char-details-preview");
const detailImg = document.getElementById("detail-img");
const detailName = document.getElementById("detail-name");
const detailGender = document.getElementById("detail-gender");
const detailMbti = document.getElementById("detail-mbti");
const detailClass = document.getElementById("detail-class");
const detailProfile = document.getElementById("detail-profile");
const dialogueArea = document.getElementById("dialogue-area");
const gameHeader = document.getElementById("game-header-area");

// 議論ログ表示用エリア（JSで動的に追加するよ）
let dialogueLogArea = null;

// ==========================================
// 1. タイトル画面
// ==========================================
toSelectionBtn.addEventListener("click", () => {
    const inputVal = nameInput.value.trim();
    playerName = inputVal === "" ? "あなた" : inputVal;
    
    // 画面遷移
    titleScreen.classList.add("hidden");
    selectionScreen.classList.remove("hidden");

    // 初期表示
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

// ▼▼▼ キャラ一覧描画（修正：クリックで詳細表示） ▼▼▼
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

        const imgSrc = `img/${char.img}.png`; // パスは / を使用

        card.innerHTML = `
            <img src="${imgSrc}" class="char-icon" onerror="this.src='https://via.placeholder.com/60?text=?'">
            <div class="char-name">${char.name}</div>
        `;

        // クリックイベント
        card.onclick = () => {
            toggleCharSelection(char.id, card);
            showCharProfile(char); // ★ここで詳細を表示！
        };
        charGrid.appendChild(card);
    });
}
// ★ NEW: プロフィール表示関数
function showCharProfile(char) {
    detailBox.classList.remove("hidden");
    
    // 画像パス
    detailImg.src = `img/${char.img}.png`;
    detailImg.onerror = () => { detailImg.src = 'https://via.placeholder.com/70'; };

    // テキスト情報セット
    detailName.innerText = char.fullName || char.name;
    detailGender.innerHTML = `<i class="fa-solid fa-${char.gender === 'male' ? 'mars' : 'venus'}"></i> ${char.gender === 'male' ? '男子' : '女子'}`;
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
    
    // 1人以上で開始可能（テスト用）
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
    setupParticipants();
    assignRoles();
    
    // 画面切り替え
    selectionScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    
    renderGameScreen();
    createDialogueArea(); // ログエリアを作成
});

function setupParticipants() {
    participants = [];
    
    // NPC追加
    selectedCharIds.forEach(id => {
        const charData = charactersData.find(c => c.id === id);
        // データをディープコピーして参加者オブジェクトを作成
        participants.push({
            ...JSON.parse(JSON.stringify(charData)), 
            isPlayer: false,
            isAlive: true,
            status: "alive"
        });
    });

    // プレイヤー追加
    participants.push({
        id: "player",
        name: playerName,
        fullName: playerName,
        class: "PLAYER",
        mbti: "XX",
        img: "player", // img/player.png を用意するか、なければエラーハンドリング
        isPlayer: true,
        isAlive: true,
        status: "alive",
        dialogues: {} // プレイヤーは選択肢で喋るため空でOK
    });
}

function assignRoles() {
    const total = participants.length;
    let roles = [];

    // 人数別配役パターン
    if (total <= 4) roles = ["人狼", "狂人", "村人", "村人"];
    else if (total <= 6) roles = ["人狼", "狂人", "占い師", "村人", "村人", "村人"];
    else if (total <= 9) roles = ["人狼", "人狼", "狂人", "占い師", "騎士", "村人", "村人", "村人", "村人"];
    else {
        const base = ["人狼", "人狼", "人狼", "狂人", "占い師", "騎士", "霊媒師", "パン屋"];
        const villagers = total - base.length;
        for(let i=0; i<villagers; i++) base.push("村人");
        roles = base.slice(0, total); // 調整
    }

    // シャッフルして割り当て
    roles = shuffleArray(roles);
    participants.forEach((p, index) => {
        p.role = roles[index];
    });
    
    console.log("配役完了:", participants);
}

// ▼▼▼ ゲーム画面描画（修正：役職名を保存） ▼▼▼
function renderGameScreen() {
    const me = participants.find(p => p.isPlayer);
    const roleInfo = getRoleDisplayInfo(me.role);
    
    // CSS用に自分の役職名をデータ属性として保存（議論モードで上に表示するため）
    gameScreen.setAttribute("data-my-role", me.role);

    myRoleCard.className = `role-card ${roleInfo.cssClass}`;
    
    // ★画像パス修正: カード画像を表示
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
        if (!p.isAlive) chip.classList.add("dead"); // 死亡時スタイル（CSSでグレーアウト等）

        const imgSrc = `img/${p.img}.png`;

        chip.innerHTML = `
            <img src="${imgSrc}" onerror="this.src='https://via.placeholder.com/40'">
            <span>${p.name}</span>
        `;
        membersList.appendChild(chip);
    });
}

// 役職情報ヘルパー
function getRoleDisplayInfo(roleName) {
    // 画像パスは img/cards/roleName.png
    // cssClassは背景色用
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
    
    return {
        cssClass: info.css,
        img: `img/cards/${info.img}.png`
    };
}

// ログエリアを動的生成
function createDialogueArea() {
    if (document.getElementById("dialogue-area")) return;
    
    dialogueLogArea = document.createElement("div");
    dialogueLogArea.id = "dialogue-area";
    // CSSスタイル（簡易）
    dialogueLogArea.style.cssText = `
        width: 100%;
        height: 300px;
        background: rgba(0,0,0,0.5);
        border-radius: 8px;
        margin-top: 20px;
        padding: 10px;
        overflow-y: auto;
        color: #fff;
        font-family: sans-serif;
    `;
    
    // ゲーム画面のボタンの上に追加
    const footer = gameScreen.querySelector(".footer-action");
    gameScreen.insertBefore(dialogueLogArea, footer);
}

// ==========================================
// 4. 議論パート (AI Logic)
// ==========================================
// ▼▼▼ 議論開始ボタン（修正：画面レイアウト切り替え） ▼▼▼
startDayBtn.addEventListener("click", () => {
    // 1. ボタンを消す
    startDayBtn.classList.add("hidden");
    
    // 2. 画面を「議論モード」にする（CSSでヘッダーが消えてログが広がる）
    gameScreen.classList.add("discussion-mode");
    
    // 3. ログエリアを表示
    dialogueArea.classList.remove("hidden");
    
    addLog("system", "=== 1日目の朝が来ました ===");
    addLog("system", "（役職カードを隠しました。上部のバーで確認できます）");
    
    // 自己紹介開始
    playIntroPhase();
});

// イントロフェーズ（全員が一言ずつ喋る）
async function playIntroPhase() {
    const npcs = participants.filter(p => !p.isPlayer && p.isAlive);
    
    for (const npc of npcs) {
        // 0.5秒待機（人間らしく）
        await new Promise(r => setTimeout(r, 500));
        
        // セリフ取得
        const text = getRandomDialogue(npc, "intro");
        
        // ログ出力（画像は intro バージョン）
        addLog(npc.id, text, "intro");
    }
    
    addLog("system", "議論を開始してください。（機能はここまで！次は投票ロジックだね！）");
}

// セリフ取得・整形関数
function getRandomDialogue(char, type, target = null) {
    if (!char.dialogues || !char.dialogues[type]) {
        return "……（セリフデータが見つかりません）";
    }
    
    const lines = char.dialogues[type];
    let text = lines[Math.floor(Math.random() * lines.length)];
    
    // {target} の置換処理
    if (target) {
        text = text.replace(/{target}/g, target.name);
    } else {
        // ターゲット指定がないのに {target} がある場合は「みんな」等に置換、または削除
        text = text.replace(/{target}/g, "みんな");
    }
    
    return text;
}

// ログ追加関数
function addLog(charId, text, emotion = "normal") {
    const logItem = document.createElement("div");
    logItem.style.marginBottom = "10px";
    logItem.style.display = "flex";
    logItem.style.alignItems = "center";
    
    if (charId === "system") {
        logItem.innerHTML = `<span style="color:#ffcc00;">📢 ${text}</span>`;
    } else {
        const char = participants.find(p => p.id === charId);
        if (!char) return;

        // 画像パスの決定（感情に合わせて切り替え）
        // 例: img/momoka_intro.png
        // ファイルがないとエラーになるので、onerrorで通常画像に戻す
        const imgSrc = `img/${char.img}_${emotion}.png`;
        const fallbackSrc = `img/${char.img}.png`;

        logItem.innerHTML = `
            <img src="${imgSrc}" onerror="this.src='${fallbackSrc}'" 
                 style="width:50px; height:50px; border-radius:50%; margin-right:10px; border:2px solid #fff;">
            <div>
                <div style="font-size:0.8rem; color:#ccc;">${char.name}</div>
                <div style="background:rgba(255,255,255,0.1); padding:8px; border-radius:8px;">${text}</div>
            </div>
        `;
    }
    
    dialogueLogArea.appendChild(logItem);
    dialogueLogArea.scrollTop = dialogueLogArea.scrollHeight; // 最下部へスクロール
}

// ユーティリティ
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}