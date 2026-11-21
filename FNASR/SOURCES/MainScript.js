
// =========================================================
// FNASR - IMAGE CONFIGURATION (Upload these to SOURCES/)
// =========================================================
const FOLDER = "SOURCES/";

const IMAGES = {
    // Menus & Endings
    title: "title.png",
    jumpscare: "jumpscare.png",
    win6am: "6am.png",
    powerOut: "power_out.png",

    // Office States
    officeNormal: "office_normal.png",
    officeLeftLight: "office_left_light.png",
    officeLeftScare: "office_left_enemy.png",   // Enemy at left door when light is on!
    officeRightLight: "office_right_light.png",
    officeRightScare: "office_right_enemy.png", // Enemy at right door when light is on!
    officeLeftClosed: "office_left_closed.png",
    officeRightClosed: "office_right_closed.png",
    officeBothClosed: "office_both_closed.png",

    // Camera Feeds (Empty vs Enemy Present)
    CAM_1A_empty: "cam_1a_empty.png",
    CAM_1A_enemy: "cam_1a_enemy.png",

    CAM_1B_empty: "cam_1b_empty.png",
    CAM_1B_enemy: "cam_1b_enemy.png",

    CAM_2A_empty: "cam_2a_empty.png",
    CAM_2A_enemy: "cam_2a_enemy.png",

    CAM_4A_empty: "cam_4a_empty.png",
    CAM_4A_enemy: "cam_4a_enemy.png"
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
let hour = 0; // 0 = 12 AM, 6 = 6 AM
let power = 100;
let leftDoor = false;
let rightDoor = false;
let leftLight = false;
let rightLight = false;
let camOpen = false;
let currentCam = "CAM_1A";

// Animatronic AI Position (Starts on Stage -> Dining -> Left or Right Door)
// Path: "CAM_1A" -> "CAM_1B" -> ("CAM_2A" -> "LEFT_DOOR") OR ("CAM_4A" -> "RIGHT_DOOR")
let enemyLocation = "CAM_1A";
let doorAttackTimer = 0;

let gameLoopInterval;
let aiLoopInterval;

// =========================================================
// DOM ELEMENTS
// =========================================================
const viewport = document.getElementById("viewport");
const missingNotice = document.getElementById("missing-img-notice");
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
// IMAGE RENDERING & ERROR HELPER
// =========================================================
function setViewportImage(filename) {
    viewport.src = FOLDER + filename;
}

// Tells you on-screen if an image hasn't been uploaded to SOURCES/ yet
viewport.onerror = function() {
    missingNotice.style.display = "block";
    missingNotice.textContent = `Missing image in SOURCES/: ${viewport.src.split('/').pop()}`;
};
viewport.onload = function() {
    missingNotice.style.display = "none";
};

function updateScreen() {
    if (!gameActive) return;

    if (camOpen) {
        // Show Camera Feed based on whether enemy is in that room
        const isEnemyHere = (enemyLocation === currentCam);
        const imgKey = isEnemyHere ? `${currentCam}_enemy` : `${currentCam}_empty`;
        setViewportImage(IMAGES[imgKey]);
    } else {
        // Show Office View based on lights, doors, and enemy at door
        if (leftLight) {
            if (enemyLocation === "LEFT_DOOR") {
                setViewportImage(IMAGES.officeLeftScare);
            } else {
                setViewportImage(IMAGES.officeLeftLight);
            }
        } else if (rightLight) {
            if (enemyLocation === "RIGHT_DOOR") {
                setViewportImage(IMAGES.officeRightScare);
            } else {
                setViewportImage(IMAGES.officeRightLight);
            }
        } else if (leftDoor && rightDoor) {
            setViewportImage(IMAGES.officeBothClosed);
        } else if (leftDoor) {
            setViewportImage(IMAGES.officeLeftClosed);
        } else if (rightDoor) {
            setViewportImage(IMAGES.officeRightClosed);
        } else {
            setViewportImage(IMAGES.officeNormal);
        }
    }
}

// =========================================================
// CONTROLS & BUTTONS
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
    if (leftLight) rightLight = false; // Only one light at a time
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
    
    // Turn off office lights when opening monitor
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
// GAME LOOP, POWER & AI LOGIC
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
    enemyLocation = "CAM_1A";
    doorAttackTimer = 0;

    // Reset UI
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

    // Main 1-second tick (Time & Power)
    gameLoopInterval = setInterval(() => {
        secondsElapsed++;

        // Every 45 seconds = 1 in-game hour (4.5 mins for full night)
        if (secondsElapsed % 45 === 0) {
            hour++;
            clockEl.textContent = `${hour} AM`;
            if (hour >= 6) {
                winGame();
                return;
            }
        }

        // Calculate Power Drain
        let usage = getUsageLevel();
        power -= (usage * 0.28);
        powerValEl.textContent = Math.max(0, Math.floor(power));

        if (power <= 0) {
            triggerPowerOut();
        }
    }, 1000);

    // Enemy Movement Loop (Checks every 5 seconds)
    aiLoopInterval = setInterval(moveEnemy, 5000);
}

function getUsageLevel() {
    let usage = 1; // Base usage
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

function moveEnemy() {
    if (!gameActive) return;

    // If at a door, check if blocked or ready to jumpscare
    if (enemyLocation === "LEFT_DOOR") {
        if (leftDoor) {
            // Blocked! Enemy retreats back to Dining Area
            enemyLocation = "CAM_1B";
            doorAttackTimer = 0;
        } else {
            doorAttackTimer++;
            if (doorAttackTimer >= 2) triggerJumpscare();
        }
        updateScreen();
        return;
    }

    if (enemyLocation === "RIGHT_DOOR") {
        if (rightDoor) {
            // Blocked! Enemy retreats back to Dining Area
            enemyLocation = "CAM_1B";
            doorAttackTimer = 0;
        } else {
            doorAttackTimer++;
            if (doorAttackTimer >= 2) triggerJumpscare();
        }
        updateScreen();
        return;
    }

    // 60% chance to advance closer to the office
    if (Math.random() < 0.6) {
        if (enemyLocation === "CAM_1A") {
            enemyLocation = "CAM_1B";
        } else if (enemyLocation === "CAM_1B") {
            // Pick Left Hall or Right Hall randomly
            enemyLocation = Math.random() < 0.5 ? "CAM_2A" : "CAM_4A";
        } else if (enemyLocation === "CAM_2A") {
            enemyLocation = "LEFT_DOOR";
            doorAttackTimer = 0;
        } else if (enemyLocation === "CAM_4A") {
            enemyLocation = "RIGHT_DOOR";
            doorAttackTimer = 0;
        }
        updateScreen();
    }
}

function triggerPowerOut() {
    clearInterval(gameLoopInterval);
    clearInterval(aiLoopInterval);
    gameActive = false;
    hud.style.display = "none";
    setViewportImage(IMAGES.powerOut);

    // Jumpscare 4 seconds after power goes out
    setTimeout(() => {
        triggerJumpscare();
    }, 4000);
}

function triggerJumpscare() {
    clearInterval(gameLoopInterval);
    clearInterval(aiLoopInterval);
    gameActive = false;
    hud.style.display = "none";
    setViewportImage(IMAGES.jumpscare);

    setTimeout(() => {
        overlayScreen.style.display = "flex";
        gameTitle.innerHTML = "GAME OVER";
        statusMsg.textContent = "You didn't survive the night.";
        startBtn.textContent = "Try Again";
    }, 2500);
}

function winGame() {
    clearInterval(gameLoopInterval);
    clearInterval(aiLoopInterval);
    gameActive = false;
    hud.style.display = "none";
    setViewportImage(IMAGES.win6am);

    setTimeout(() => {
        overlayScreen.style.display = "flex";
        gameTitle.innerHTML = "6:00 AM";
        statusMsg.textContent = "You survived the shift!";
        startBtn.textContent = "Play Again";
    }, 4000);
}

// Load title image on start
setViewportImage(IMAGES.title);
