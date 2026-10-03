const totalMinInput = document.getElementById("totalMin");
const intervalSecInput = document.getElementById("intervalSec");

const timeDisplay = document.getElementById("timeDisplay");
const intervalDisplay = document.getElementById("intervalDisplay");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

const soundPlayer = document.getElementById("soundPlayer");

const SOUND_FILES = {
  start: "./sounds/start.mp3",
  beep: "./sounds/beep.mp3",
  stop: "./sounds/stop.mp3",
};

let running = false;
let paused = false;
let starting = false;
let audioUnlocked = false;

let totalSeconds = 30 * 60;
let intervalSeconds = 30;
let remainingSeconds = totalSeconds;

let endTime = 0;
let nextBeepTime = 0;
let tickId = null;

function formatTime(seconds) {
  const wholeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  const secs = wholeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function readSettings() {
  const minutes = Number.parseInt(totalMinInput.value, 10);
  const seconds = Number.parseInt(intervalSecInput.value, 10);

  const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 30;
  const safeInterval = Number.isFinite(seconds) && seconds > 0 ? seconds : 30;

  totalSeconds = safeMinutes * 60;
  intervalSeconds = safeInterval;
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(remainingSeconds);

  if (starting) {
    intervalDisplay.textContent = "Playing start sound...";
    return;
  }

  if (paused) {
    intervalDisplay.textContent = "Paused";
    return;
  }

  if (running) {
    const secondsToBeep = Math.max(
      0,
      Math.ceil((nextBeepTime - Date.now()) / 1000)
    );

    intervalDisplay.textContent = `Next beep in: ${secondsToBeep}s`;
    return;
  }

  intervalDisplay.textContent = `Next beep in: ${intervalSeconds}s`;
}

function setInputsDisabled(disabled) {
  totalMinInput.disabled = disabled;
  intervalSecInput.disabled = disabled;
}

function stopTicking() {
  if (tickId !== null) {
    window.clearInterval(tickId);
    tickId = null;
  }
}

function startTicking() {
  stopTicking();
  tickId = window.setInterval(tick, 250);
  tick();
}

function setSoundSource(name) {
  soundPlayer.pause();
  soundPlayer.currentTime = 0;
  soundPlayer.src = SOUND_FILES[name];
  soundPlayer.load();
}

async function playSound(name) {
  try {
    setSoundSource(name);
    await soundPlayer.play();
    return true;
  } catch (error) {
    console.warn(`Could not play ${name} sound.`, error);
    return false;
  }
}

function scheduleCountdownStartAfterSound() {
  const startCountdown = () => {
    soundPlayer.removeEventListener("ended", startCountdown);

    if (!starting) {
      return;
    }

    const now = Date.now();

    starting = false;
    running = true;
    paused = false;

    endTime = now + remainingSeconds * 1000;
    nextBeepTime = now + intervalSeconds * 1000;

    startBtn.textContent = "Running";
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    startTicking();
  };

  soundPlayer.addEventListener("ended", startCountdown, { once: true });
}

async function startNewTimerFromTap() {
  readSettings();

  remainingSeconds = totalSeconds;
  running = false;
  paused = false;
  starting = true;

  setInputsDisabled(true);

  startBtn.textContent = "Starting...";
  startBtn.disabled = true;
  pauseBtn.disabled = true;

  updateDisplay();

  scheduleCountdownStartAfterSound();

  const didStartAudio = await playSound("start");

  if (!didStartAudio) {
    // Do not leave the app stuck if iPhone/browser blocks audio.
    starting = false;

    const now = Date.now();
    endTime = now + remainingSeconds * 1000;
    nextBeepTime = now + intervalSeconds * 1000;

    running = true;
    paused = false;

    startBtn.textContent = "Running";
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    startTicking();
  }
}

function resumeTimer() {
  const now = Date.now();

  running = true;
  paused = false;
  starting = false;

  endTime = now + remainingSeconds * 1000;
  nextBeepTime = now + intervalSeconds * 1000;

  startBtn.textContent = "Running";
  startBtn.disabled = true;
  pauseBtn.disabled = false;

  setInputsDisabled(true);

  startTicking();
}

function pauseTimer() {
  if (!running || paused || starting) {
    return;
  }

  remainingSeconds = Math.max(0, (endTime - Date.now()) / 1000);

  running = false;
  paused = true;

  stopTicking();

  startBtn.textContent = "Resume";
  startBtn.disabled = false;
  pauseBtn.disabled = true;

  updateDisplay();
}

function resetTimer() {
  stopTicking();

  soundPlayer.pause();
  soundPlayer.currentTime = 0;

  readSettings();

  running = false;
  paused = false;
  starting = false;

  remainingSeconds = totalSeconds;
  endTime = 0;
  nextBeepTime = 0;

  startBtn.textContent = "Start";
  startBtn.disabled = false;
  pauseBtn.disabled = true;

  setInputsDisabled(false);

  updateDisplay();
}

function finishTimer() {
  stopTicking();

  running = false;
  paused = false;
  starting = false;

  remainingSeconds = 0;

  startBtn.textContent = "Start";
  startBtn.disabled = false;
  pauseBtn.disabled = true;

  setInputsDisabled(false);

  updateDisplay();

  playSound("stop");
}

function tick() {
  if (!running || paused || starting) {
    return;
  }

  const now = Date.now();

  remainingSeconds = Math.max(0, (endTime - now) / 1000);

  while (now >= nextBeepTime && remainingSeconds > 0) {
    playSound("beep");
    nextBeepTime += intervalSeconds * 1000;
  }

  updateDisplay();

  if (remainingSeconds <= 0) {
    finishTimer();
  }
}

startBtn.addEventListener("click", async () => {
  if (starting) {
    return;
  }

  if (paused) {
    resumeTimer();
    return;
  }

  if (!running) {
    audioUnlocked = true;
    await startNewTimerFromTap();
  }
});

pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && running && !paused && !starting) {
    tick();
  }
});

readSettings();
remainingSeconds = totalSeconds;
updateDisplay();
