/* ===== CHRONOS STOPWATCH ===== */

// — State
let startTime   = 0;
let elapsed     = 0;
let timerHandle = null;
let running     = false;
let laps        = [];

// — DOM refs
const minutesEl     = document.getElementById('minutes');
const secondsEl     = document.getElementById('seconds');
const msEl          = document.getElementById('milliseconds');
const timerDisplay  = document.getElementById('timerDisplay');
const startPauseBtn = document.getElementById('startPauseBtn');
const btnIcon       = document.getElementById('btnIcon');
const btnLabel      = document.getElementById('btnLabel');
const resetBtn      = document.getElementById('resetBtn');
const lapBtn        = document.getElementById('lapBtn');
const lapsList      = document.getElementById('lapsList');
const lapsHeader    = document.getElementById('lapsHeader');

// — Format helpers
function pad(n, digits = 2) {
  return String(Math.floor(n)).padStart(digits, '0');
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const millis = ms % 1000;
  return { mins, secs, millis };
}

function formatDisplay(ms) {
  const { mins, secs, millis } = formatTime(ms);
  return `${pad(mins)}:${pad(secs)}.${pad(millis, 3)}`;
}

// — Update the display
function updateDisplay(ms) {
  const { mins, secs, millis } = formatTime(ms);
  minutesEl.textContent = pad(mins);
  secondsEl.textContent = pad(secs);
  msEl.textContent      = pad(millis, 3);
}

// — Tick using requestAnimationFrame for accuracy
function tick() {
  elapsed = Date.now() - startTime;
  updateDisplay(elapsed);
  timerHandle = requestAnimationFrame(tick);
}

// — Start / Pause
function startPause() {
  if (!running) {
    // Start or resume
    startTime   = Date.now() - elapsed;
    timerHandle = requestAnimationFrame(tick);
    running     = true;

    btnIcon.textContent  = '⏸';
    btnLabel.textContent = 'PAUSE';
    startPauseBtn.classList.remove('paused-state');

    lapBtn.disabled = false;
    timerDisplay.classList.add('running');
    timerDisplay.classList.remove('paused');
  } else {
    // Pause
    cancelAnimationFrame(timerHandle);
    running = false;

    btnIcon.textContent  = '▶';
    btnLabel.textContent = 'RESUME';
    startPauseBtn.classList.add('paused-state');

    timerDisplay.classList.remove('running');
    timerDisplay.classList.add('paused');
  }
}

// — Reset
function reset() {
  cancelAnimationFrame(timerHandle);
  running = false;
  elapsed = 0;
  laps    = [];

  updateDisplay(0);

  btnIcon.textContent  = '▶';
  btnLabel.textContent = 'START';
  startPauseBtn.classList.remove('paused-state');

  lapBtn.disabled = true;
  lapsList.innerHTML = '';
  lapsHeader.style.display = 'none';

  timerDisplay.classList.remove('running', 'paused');
}

// — Lap
function lap() {
  if (!running) return;

  const lapElapsed   = elapsed;
  const prevTotal    = laps.length ? laps[laps.length - 1].total : 0;
  const lapSplit     = lapElapsed - prevTotal;

  laps.push({ total: lapElapsed, split: lapSplit });

  renderLaps();
}

// — Render laps with best/worst highlighting
function renderLaps() {
  if (!laps.length) return;

  lapsHeader.style.display = 'grid';
  lapsList.innerHTML = '';

  // Find best and worst by split (only if 2+ laps)
  let bestIdx = -1, worstIdx = -1;
  if (laps.length >= 2) {
    let minSplit = Infinity, maxSplit = -Infinity;
    laps.forEach((l, i) => {
      if (l.split < minSplit) { minSplit = l.split; bestIdx  = i; }
      if (l.split > maxSplit) { maxSplit = l.split; worstIdx = i; }
    });
  }

  // Render newest first
  [...laps].reverse().forEach((lapData, revIdx) => {
    const idx = laps.length - 1 - revIdx;
    const li  = document.createElement('li');
    li.className = 'lap-item';

    if (idx === bestIdx)  { li.classList.add('lap-best');  }
    if (idx === worstIdx) { li.classList.add('lap-worst'); }

    const badge = idx === bestIdx
      ? '<span class="lap-badge">BEST</span>'
      : idx === worstIdx
        ? '<span class="lap-badge">SLOW</span>'
        : '';

    li.innerHTML = `
      <span class="lap-number">LAP ${String(idx + 1).padStart(2, '0')}</span>
      <span class="lap-split">${formatDisplay(lapData.split)}${badge}</span>
      <span class="lap-total">${formatDisplay(lapData.total)}</span>
    `;

    lapsList.appendChild(li);
  });
}

// — Event listeners
startPauseBtn.addEventListener('click', startPause);
resetBtn.addEventListener('click', reset);
lapBtn.addEventListener('click', lap);

// — Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  switch (e.key) {
    case ' ':
    case 'Enter':
      e.preventDefault();
      startPause();
      break;
    case 'l':
    case 'L':
      if (!lapBtn.disabled) lap();
      break;
    case 'r':
    case 'R':
      reset();
      break;
  }
});

// Init display
updateDisplay(0);