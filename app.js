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

let timerRunning = false;
let timerPaused = false;

let totalSecondsDefault = 30 * 60;
let intervalSecondsDefault = 30;

let totalSeconds = totalSecondsDefault;
let intervalSeconds = intervalSecondsDefault;

let remainingSeconds = totalSeconds;
let nextBeepAt = 0; // timestamp when next beep should happen
let targetEndTime = 0; // timestamp when timer ends
let tickIntervalId = null;

function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateDisplays() {
  timeDisplay.textContent = formatTime(Math.max(0, Math.ceil(remainingSeconds)));
  const secToNextBeep = Math.max(0, Math.ceil((nextBeepAt - Date.now()) / 1000));
  intervalDisplay.textContent = timerRunning && !timerPaused
    ? `Next beep in: ${secToNextBeep}s`
    : 'Paused';
}

function playSound(audioEl) {
  audioEl.currentTime = 0;
  const p = audioEl.play();
  if (p && typeof p.catch === 'function') {
    p.catch(() => {
      // Ignore autoplay restrictions; user must interact first.
    });
  }
}

function startTimer() {
  if (timerRunning && !timerPaused) return;

  // Read settings if starting fresh
  if (!timerRunning || timerPaused) {
    totalSecondsDefault = Math.max(1, parseInt(totalMinInput.value || '30', 10)) * 60;
    intervalSecondsDefault = Math.max(5, parseInt(intervalSecInput.value || '30', 10));

    if (!timerRunning) {
      totalSeconds = totalSecondsDefault;
      intervalSeconds = intervalSecondsDefault;
      remainingSeconds = totalSeconds;
    }

    const now = Date.now();
    targetEndTime = now + remainingSeconds * 1000;
    // Schedule first beep after 'intervalSeconds' from now (or immediately if just resumed?)
    // For simplicity: always count from current remaining and schedule next beep relative to that.
    // We'll compute nextBeepAt as now + (remaining % interval) * 1000
    const elapsed = totalSeconds - remainingSeconds;
    const timeIntoInterval = elapsed % intervalSeconds;
    const timeToNextInterval = (intervalSeconds - timeIntoInterval) % intervalSeconds;
    nextBeepAt = now + (timeToNextInterval || intervalSeconds) * 1000;
  }

  timerRunning = true;
  timerPaused = false;

  startBtn.disabled = true;
  pauseBtn.disabled = false;
  totalMinInput.disabled = true;
  intervalSecInput.disabled = true;

  playSound(startSound);

  if (tickIntervalId) clearInterval(tickIntervalId);
  tickIntervalId = setInterval(tick, 250);
  updateDisplays();
}

function pauseTimer() {
  if (!timerRunning || timerPaused) return;
  timerPaused = true;

  if (tickIntervalId) {
    clearInterval(tickIntervalId);
    tickIntervalId = null;
  }

  // Recalculate remaining based on targetEndTime
  remainingSeconds = Math.max(0, (targetEndTime - Date.now()) / 1000);

  startBtn.disabled = false;
  startBtn.textContent = 'Resume';
  pauseBtn.disabled = true;

  updateDisplays();
}

function resetTimer() {
  if (tickIntervalId) {
    clearInterval(tickIntervalId);
    tickIntervalId = null;
  }

  timerRunning = false;
  timerPaused = false;

  totalSecondsDefault = Math.max(1, parseInt(totalMinInput.value || '30', 10)) * 60;
  intervalSecondsDefault = Math.max(5, parseInt(intervalSecInput.value || '30', 10));

  totalSeconds = totalSecondsDefault;
  intervalSeconds = intervalSecondsDefault;
  remainingSeconds = totalSeconds;

  startBtn.disabled = false;
  startBtn.textContent = 'Start';
  pauseBtn.disabled = true;
  totalMinInput.disabled = false;
  intervalSecInput.disabled = false;

  updateDisplays();
}

function tick() {
  const now = Date.now();

  // Update remaining based on target end time
  remainingSeconds = Math.max(0, (targetEndTime - now) / 1000);

  // Check for interval beeps
  if (now >= nextBeepAt && remainingSeconds > 0.5) {
    playSound(beepSound);
    // schedule next beep
    nextBeepAt = nextBeepAt + intervalSeconds * 1000;
    // If we paused/resumed, nextBeepAt might be in past; push forward
    while (nextBeepAt <= now) {
      nextBeepAt += intervalSeconds * 1000;
    }
  }

  updateDisplays();

  // Timer finished
  if (remainingSeconds <= 0.05) {
    if (tickIntervalId) {
      clearInterval(tickIntervalId);
      tickIntervalId = null;
    }
    timerRunning = false;
    timerPaused = false;
    remainingSeconds = 0;
    updateDisplays();

    startBtn.disabled = false;
    startBtn.textContent = 'Start';
    pauseBtn.disabled = true;
    totalMinInput.disabled = false;
    intervalSecInput.disabled = false;

    playSound(stopSound);
  }
}

// Wire up buttons
startBtn.addEventListener('click', () => {
  if (!timerRunning) {
    startTimer();
  } else if (timerPaused) {
    // resume
    const remainingBefore = remainingSeconds;
    const now = Date.now();
    targetEndTime = now + remainingBefore * 1000;

    // Recompute next beep based on elapsed fraction
    const totalElapsedBefore = totalSeconds - remainingBefore;
    const timeIntoInterval = totalElapsedBefore % intervalSeconds;
    const timeToNextInterval = (intervalSeconds - timeIntoInterval) % intervalSeconds;
    nextBeepAt = now + (timeToNextInterval || intervalSeconds) * 1000;

    timerPaused = false;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    totalMinInput.disabled = true;
    intervalSecInput.disabled = true;

    if (tickIntervalId) clearInterval(tickIntervalId);
    tickIntervalId = setInterval(tick, 250);
    updateDisplays();
  }
});

pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Initialize display
updateDisplays();