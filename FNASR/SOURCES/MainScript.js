// =========================================================
// FNASR - ASSET & ENEMY MAPPING CONFIGURATION
// =========================================================
const FOLDER = "SOURCES/";

const ASSETS = {
    Freddy: FOLDER + "Freddy.png",
    Bonnie: FOLDER + "Bonnie.png",
    Chica: FOLDER + "Chica.png",
    Foxy: FOLDER + "Foxy.png"
};

const CAM_NAMES = {
    CAM_1A: "CAM 1A - Show Stage",
    CAM_1B: "CAM 1B - Dining Area",
    CAM_2A: "CAM 2A - West Hall",
    CAM_4A: "CAM 4A - East Hall"
};

// =========================================================
// GAME STATE
// =========================================================
let gameActive = false;
let hour = 0; 
let power = 100;
let leftDoor = false;
let rightDoor = false;
let leftLight = false;
let rightLight = false;
let camOpen = false;
let currentCam = "CAM_1A";

// Enemy tracking: Freddy (Stage -> Dining -> Right Door), Bonnie (Stage -> W. Hall -> Left Door)
let freddyLoc = "CAM_1A";
let bonnieLoc = "CAM_1A";
let freddyTimer = 0;
let bonnieTimer = 0;

let gameLoopInterval;
let aiLoopInterval;

// =========================================================
// DOM ELEMENTS
// =========================================================
const viewport = document.getElementById("viewport");
const overlayScreen = document.getElementById("overlay-screen");
const gameTitle = document.getElementById("game-title");
const statusMsg = document.getElementById("status-msg");
const startBtn = document.getElementById("start-btn");
const hud = document.getElementById("hud");

const clockEl = document.getElementById("clock");
const powerValEl = document.getElementById("power-val");
const leftDoorBtn = document.getElementById("left-door-btn");
const leftLightBtn = document.getElementById("left-light-btn");
const rightDoorBtn = document.getElementById("right-door-btn");
const rightLightBtn = document.getElementById("right-light-btn");
const camToggleBtn = document.getElementById("cam-toggle");
const camMap = document.getElementById("cam-map");
const camLabel = document.getElementById("cam-label");
const camBtns = document.querySelectorAll(".cam-btn");

// =========================================================
// PROCEDURAL BACKGROUND GENERATOR (No external images required for rooms!)
// =========================================================
function renderScene(type, data = {}) {
    let html = "";

    switch(type) {
        case "title":
            html = `<div style="text-align:center;"><h1 style="font-size:3.5rem; color:#f00; text-shadow: 2px 2px #500;">FIVE NIGHTS AT SR</h1><p style="color:#888; margin-top:10px;">Security System Online</p></div>`;
            break;

        case "office":
            let leftWallColor = leftDoor ? "#333" : "#1a1510";
            let rightWallColor = rightDoor ? "#333" : "#1a1510";
            let leftDecor = "";
            let rightDecor = "";

            if (leftLight) {
                if (data.enemyLeft === "Bonnie") {
                    leftDecor = `<img src="${ASSETS.Bonnie}" style="position:absolute; bottom:50px; left:120px; width:180px; filter:drop-shadow(0 0 10px #f00);">`;
                } else {
                    leftDecor = `<div style="position:absolute; bottom:120px; left:140px; color:#ff0; font-weight:bold;">[ Hallway Empty ]</div>`;
                }
            }
            if (rightLight) {
                if (data.enemyRight === "Freddy") {
                    rightDecor = `<img src="${ASSETS.Freddy}" style="position:absolute; bottom:50px; right:120px; width:180px; filter:drop-shadow(0 0 10px #f00);">`;
                } else {
                    rightDecor = `<div style="position:absolute; bottom:120px; right:140px; color:#ff0; font-weight:bold;">[ Hallway Empty ]</div>`;
                }
            }

            html = `
                <div style="position:relative; width:100%; height:100%; background:#080808; display:flex; justify-content:center; align-items:center;">
                    <!-- Left Doorway -->
                    <div style="position:absolute; left:0; width:300px; height:100%; background:${leftWallColor}; border-right:4px solid #000;">
                        ${leftDoor ? '<div style="width:100%; height:100%; background:repeating-linear-gradient(45deg,#222,#222 20px,#333 20px,#333 40px);"></div>' : ''}
                        ${leftDecor}
                    </div>
                    <!-- Desk & Monitors -->
                    <div style="position:absolute; bottom:0; width:500px; height:200px; background:#151515; border-top:6px solid #2a2a2a; display:flex; justify-content:center; align-items:center; gap:20px;">
                        <div style="width:70px; height:50px; background:#002200; border:2px solid #0f0; box-shadow:0 0 10px #0f0;"></div>
                        <div style="width:90px; height:60px; background:#002200; border:2px solid #0f0; box-shadow:0 0 15px #0f0;"></div>
                        <div style="width:70px; height:50px; background:#002200; border:2px solid #0f0; box-shadow:0 0 10px #0f0;"></div>
                    </div>
                    <!-- Right Doorway -->
                    <div style="position:absolute; right:0; width:300px; height:100%; background:${rightWallColor}; border-left:4px solid #000;">
                        ${rightDoor ? '<div style="width:100%; height:100%; background:repeating-linear-gradient(45deg,#222,#222 20px,#333 20px,#333 40px);"></div>' : ''}
                        ${rightDecor}
                    </div>
                </div>`;
            break;

        case "camera":
            let camContent = "";
            if (data.cam === "CAM_1A") {
                camContent = `
                    <div style="display:flex; gap:30px; align-items:flex-end;">
                        ${freddyLoc === "CAM_1A" ? `<img src="${ASSETS.Freddy}" style="width:120px;">` : ''}
                        ${bonnieLoc === "CAM_1A" ? `<img src="${ASSETS.Bonnie}" style="width:120px;">` : ''}
                        <img src="${ASSETS.Chica}" style="width:120px;">
                    </div>
                    <div style="position:absolute; top:20px; font-weight:bold; color:#0f0;">CAM 1A - SHOW STAGE</div>`;
            } else if (data.cam === "CAM_1B") {
                camContent = `
                    <div style="color:#aaa; font-style:italic;">Dining Area Tables</div>
                    ${Math.random() < 0.5 ? `<img src="${ASSETS.Foxy}" style="width:140px; position:absolute;">` : ''}
                    <div style="position:absolute; top:20px; font-weight:bold; color:#0f0;">CAM 1B - DINING AREA</div>`;
            } else if (data.cam === "CAM_2A") {
                camContent = `
                    <div style="width:100%; height:100%; background:linear-gradient(90deg, #111, #222); display:flex; justify-content:center; align-items:center;">
                        ${bonnieLoc === "CAM_2A" ? `<img src="${ASSETS.Bonnie}" style="width:160px; filter:brightness(0.5);">` : '<span style="color:#555;">West Hall Clear</span>'}
                    </div>
                    <div style="position:absolute; top:20px; font-weight:bold; color:#0f0;">CAM 2A - WEST HALL</div>`;
            } else if (data.cam === "CAM_4A") {
                camContent = `
                    <div style="width:100%; height:100%; background:linear-gradient(90deg, #222, #111); display:flex; justify-content:center; align-items:center;">
                        ${freddyLoc === "CAM_4A" ? `<img src="${ASSETS.Freddy}" style="width:160px; filter:brightness(0.5);">` : '<span style="color:#555;">East Hall Clear</span>'}
                    </div>
                    <div style="position:absolute; top:20px; font-weight:bold; color:#0f0;">CAM 4A - EAST HALL</div>`;
            }

            html = `
                <div style="position:relative; width:100%; height:100%; background:#031103; display:flex; justify-content:center; align-items:center; border: 15px solid rgba(0,255,0,0.05);">
                    ${camContent}
                </div>`;
            break;

        case "jumpscare":
            let attacker = data.attacker || ASSETS.Freddy;
            html = `<div style="background:#000; width:100%; height:100%; display:flex; justify-content:center; align-items:center;"><img src="${attacker}" style="width:400px; animation: shake 0.1s infinite;"></div>`;
            break;

        case "win":
            html = `<div style="text-align:center;"><h1 style="font-size:5rem; color:#0f0; text-shadow:0 0 20px #0f0;">6:00 AM</h1><p style="color:#fff; font-size:1.5rem; margin-top:15px;">You survived the shift!</p></div>`;
            break;

        case "powerout":
            html = `<div style="background:#000; width:100%; height:100%; display:flex; justify-content:center; align-items:center;"><h2 style="color:#f00; font-size:3rem;">POWER OUT</h2></div>`;
            break;
    }

    viewport.innerHTML = html;
}

// =========================================================
// CONTROLS & EVENT LISTENERS
// =========================================================
startBtn.addEventListener("click", startGame);

leftDoorBtn.addEventListener("click", () => {
    if (!gameActive || camOpen) return;
    leftDoor = !leftDoor;
    leftDoorBtn.classList.toggle("on", leftDoor);
    updateUsageUI();
    updateScreen();
});

rightDoorBtn.addEventListener("click", () => {
    if (!gameActive || camOpen) return;
    rightDoor = !rightDoor;
    rightDoorBtn.classList.toggle("on", rightDoor);
    updateUsageUI();
    updateScreen();
});

leftLightBtn.addEventListener("click", () => {
    if (!gameActive || camOpen) return;
    leftLight = !leftLight;
    if (leftLight) rightLight = false;
    leftLightBtn.classList.toggle("on", leftLight);
    rightLightBtn.classList.remove("on");
    updateUsageUI();
    updateScreen();
});

rightLightBtn.addEventListener("click", () => {
    if (!gameActive || camOpen) return;
    rightLight = !rightLight;
    if (rightLight) leftLight = false;
    rightLightBtn.classList.toggle("on", rightLight);
    leftLightBtn.classList.remove("on");
    updateUsageUI();
    updateScreen();
});

camToggleBtn.addEventListener("click", () => {
    if (!gameActive) return;
    camOpen = !camOpen;
    if (camOpen) {
        leftLight = false;
        rightLight = false;
        leftLightBtn.classList.remove("on");
        rightLightBtn.classList.remove("on");
        camMap.style.display = "block";
        document.getElementById("left-controls").style.display = "none";
        document.getElementById("right-controls").style.display = "none";
    } else {
        camMap.style.display = "none";
        document.getElementById("left-controls").style.display = "flex";
        document.getElementById("right-controls").style.display = "flex";
    }
    updateUsageUI();
    updateScreen();
});

camBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        if (!gameActive || !camOpen) return;
        camBtns.forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        currentCam = btn.dataset.cam;
        camLabel.textContent = CAM_NAMES[currentCam];
        updateScreen();
    });
});

// =========================================================
// GAME LOGIC & LOOPS
// =========================================================
function startGame() {
    gameActive = true;
    hour = 0;
    power = 100;
    leftDoor = false;
    rightDoor = false;
    leftLight = false;
    rightLight = false;
    camOpen = false;
    currentCam = "CAM_1A";
    freddyLoc = "CAM_1A";
    bonnieLoc = "CAM_1A";
    freddyTimer = 0;
    bonnieTimer = 0;

    overlayScreen.style.display = "none";
    hud.style.display = "block";
    camMap.style.display = "none";
    document.getElementById("left-controls").style.display = "flex";
    document.getElementById("right-controls").style.display = "flex";
    leftDoorBtn.classList.remove("on");
    rightDoorBtn.classList.remove("on");
    leftLightBtn.classList.remove("on");
    rightLightBtn.classList.remove("on");

    clockEl.textContent = "12 AM";
    powerValEl.textContent = "100";
    updateUsageUI();
    updateScreen();

    let secondsElapsed = 0;

    gameLoopInterval = setInterval(() => {
        secondsElapsed++;
        if (secondsElapsed % 45 === 0) {
            hour++;
            clockEl.textContent = `${hour} AM`;
            if (hour >= 6) {
                winGame();
                return;
            }
        }

        let usage = getUsageLevel();
        power -= (usage * 0.28);
        powerValEl.textContent = Math.max(0, Math.floor(power));

        if (power <= 0) {
            triggerPowerOut();
        }
    }, 1000);

    aiLoopInterval = setInterval(moveEnemies, 5000);
}

function updateScreen() {
    if (!gameActive) return;

    if (camOpen) {
        renderScene("camera", { cam: currentCam });
    } else {
        renderScene("office", {
            enemyLeft: bonnieLoc === "LEFT_DOOR" ? "Bonnie" : null,
            enemyRight: freddyLoc === "RIGHT_DOOR" ? "Freddy" : null
        });
    }
}

function getUsageLevel() {
    let usage = 1;
    if (leftDoor) usage++;
    if (rightDoor) usage++;
    if (leftLight || rightLight) usage++;
    if (camOpen) usage++;
    return usage;
}

function updateUsageUI() {
    const usage = getUsageLevel();
    for (let i = 1; i <= 4; i++) {
        const bar = document.getElementById(`bar-${i}`);
        bar.className = "bar";
        if (i <= usage) {
            if (usage === 1) bar.classList.add("active-green");
            else if (usage <= 3) bar.classList.add("active-yellow");
            else bar.classList.add("active-red");
        }
    }
}

function moveEnemies() {
    if (!gameActive) return;

    // Bonnie AI Movement
    if (bonnieLoc === "CAM_1A" && Math.random() < 0.6) bonnieLoc = "CAM_2A";
    else if (bonnieLoc === "CAM_2A") {
        if (Math.random() < 0.7) bonnieLoc = "LEFT_DOOR";
    } else if (bonnieLoc === "LEFT_DOOR") {
        if (leftDoor) {
            bonnieLoc = "CAM_1A"; // Blocked!
        } else {
            bonnieTimer++;
            if (bonnieTimer >= 2) {
                triggerJumpscare(ASSETS.Bonnie);
                return;
            }
        }
    }

    // Freddy AI Movement
    if (freddyLoc === "CAM_1A" && Math.random() < 0.5) freddyLoc = "CAM_4A";
    else if (freddyLoc === "CAM_4A") {
        if (Math.random() < 0.6) freddyLoc = "RIGHT_DOOR";
    } else if (freddyLoc === "RIGHT_DOOR") {
        if (rightDoor) {
            freddyLoc = "CAM_1A"; // Blocked!
        } else {
            freddyTimer++;
            if (freddyTimer >= 2) {
                triggerJumpscare(ASSETS.Freddy);
                return;
            }
        }
    }

    updateScreen();
}

function triggerPowerOut() {
    clearInterval(gameLoopInterval);
    clearInterval(aiLoopInterval);
    gameActive = false;
    hud.style.display = "none";
    renderScene("powerout");

    setTimeout(() => {
        triggerJumpscare(ASSETS.Freddy);
    }, 4000);
}

function triggerJumpscare(attackerImg) {
    clearInterval(gameLoopInterval);
    clearInterval(aiLoopInterval);
    gameActive = false;
    hud.style.display = "none";
    renderScene("jumpscare", { attacker: attackerImg });

    setTimeout(() => {
        overlayScreen.style.display = "flex";
        gameTitle.innerHTML = "GAME OVER";
        statusMsg.textContent = "You were caught!";
        startBtn.textContent = "Try Again";
    }, 2500);
}

function winGame() {
    clearInterval(gameLoopInterval);
    clearInterval(aiLoopInterval);
    gameActive = false;
    hud.style.display = "none";
    renderScene("win");

    setTimeout(() => {
        overlayScreen.style.display = "flex";
        gameTitle.innerHTML = "6:00 AM";
        statusMsg.textContent = "You survived the night!";
        startBtn.textContent = "Play Again";
    }, 4000);
}

// Initial render
renderScene("title");
