const totalMinInput = document.getElementById('totalMin');
const intervalSecInput = document.getElementById('intervalSec');

const timeDisplay = document.getElementById('timeDisplay');
const intervalDisplay = document.getElementById('intervalDisplay');

const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

const startSound = document.getElementById('startSound');
const beepSound = document.getElementById('beepSound');
const stopSound = document.getElementById('stopSound');

let running = false;
let paused = false;
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

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function playSound(audio) {
  audio.currentTime = 0;
  audio.play().catch(() => {
    // The Start button provides the required user interaction.
  });
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(remainingSeconds);

  if (running && !paused) {
    const nextBeepIn = Math.max(
      0,
      Math.ceil((nextBeepTime - Date.now()) / 1000)
    );

    intervalDisplay.textContent = `Next beep in: ${nextBeepIn}s`;
  } else if (paused) {
    intervalDisplay.textContent = 'Paused';
  } else {
    intervalDisplay.textContent = `Next beep in: ${intervalSeconds}s`;
  }
}

function setControls(isRunning) {
  totalMinInput.disabled = isRunning;
  intervalSecInput.disabled = isRunning;
  pauseBtn.disabled = !isRunning || paused;
}

function readSettings() {
  const minutes = Number.parseInt(totalMinInput.value, 10);
  const seconds = Number.parseInt(intervalSecInput.value, 10);

  totalSeconds = Math.max(1, Number.isFinite(minutes) ? minutes : 30) * 60;
  intervalSeconds = Math.max(1, Number.isFinite(seconds) ? seconds : 30);
}

function startNewTimer() {
  readSettings();

  remainingSeconds = totalSeconds;
  endTime = Date.now() + remainingSeconds * 1000;
  nextBeepTime = Date.now() + intervalSeconds * 1000;

  running = true;
  paused = false;

  startBtn.textContent = 'Running';
  startBtn.disabled = true;
  setControls(true);

  playSound(startSound);
  startTicking();
}

function resumeTimer() {
  endTime = Date.now() + remainingSeconds * 1000;
  nextBeepTime = Date.now() + intervalSeconds * 1000;

  running = true;
  paused = false;

  startBtn.textContent = 'Running';
  startBtn.disabled = true;
  setControls(true);

  startTicking();
}

function startTicking() {
  stopTicking();
  tickId = window.setInterval(tick, 250);
  updateDisplay();
}

function stopTicking() {
  if (tickId !== null) {
    window.clearInterval(tickId);
    tickId = null;
  }
}

function tick() {
  const now = Date.now();

  remainingSeconds = Math.max(0, (endTime - now) / 1000);

  while (now >= nextBeepTime && remainingSeconds > 0) {
    playSound(beepSound);
    nextBeepTime += intervalSeconds * 1000;
  }

  updateDisplay();

  if (remainingSeconds <= 0) {
    finishTimer();
  }
}

function pauseTimer() {
  if (!running || paused) {
    return;
  }

  remainingSeconds = Math.max(0, (endTime - Date.now()) / 1000);
  paused = true;

  stopTicking();

  startBtn.disabled = false;
  startBtn.textContent = 'Resume';
  pauseBtn.disabled = true;

  updateDisplay();
}

function finishTimer() {
  stopTicking();

  running = false;
  paused = false;
  remainingSeconds = 0;

  startBtn.disabled = false;
  startBtn.textContent = 'Start';
  pauseBtn.disabled = true;

  totalMinInput.disabled = false;
  intervalSecInput.disabled = false;

  updateDisplay();
  playSound(stopSound);
}

function resetTimer() {
  stopTicking();

  readSettings();

  running = false;
  paused = false;
  remainingSeconds = totalSeconds;

  startBtn.disabled = false;
  startBtn.textContent = 'Start';
  pauseBtn.disabled = true;

  totalMinInput.disabled = false;
  intervalSecInput.disabled = false;

  updateDisplay();
}

startBtn.addEventListener('click', () => {
  if (!running) {
    startNewTimer();
  } else if (paused) {
    resumeTimer();
  }
});

pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

readSettings();
remainingSeconds = totalSeconds;
updateDisplay();
