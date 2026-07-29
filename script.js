/* ── LOCAL & PEER STATE ── */
let state = {
  playerName: localStorage.getItem('ss_name') || '',
  score: 0,
  level: 1,
  mode: 'solo', // 'solo', 'vs', 'custom'
  streak: 0,
  hints: 3,
  gridSize: 10,
  grid: [],
  wordsToFind: [],
  foundWords: [],
  customExtras: [],
  timer: null,
  timeLeft: 0,
  maxTime: 0
};

let vsState = {
  peer: null,
  conn: null,
  isHost: false,
  roomCode: '',
  oppName: 'Opponent',
  oppScore: 0,
  oppFound: 0
};

const COLORS = ['#38BDF8', '#F472B6', '#34D399', '#A78BFA', '#FBBF24', '#FB923C'];

/* ── EXPANDED PRESET LEVELS WITH MULTIPLE SENTENCES ── */
const PRESET_LEVELS = [
  {
    level: 1,
    type: 'normal',
    sentences: [
      "The quick brown [FOX] jumps over.",
      "A loyal [DOG] barks loudly outside.",
      "Bright green [TREES] grow near the lake.",
      "Small blue [BIRDS] sing in the morning."
    ],
    extras: ["CAT", "SUN", "PARK"]
  },
  {
    level: 2,
    type: 'normal',
    sentences: [
      "Bright [STARS] shine in the night [SKY].",
      "The full [MOON] reflects bright sunlight.",
      "Soft white [CLOUDS] drift across the horizon.",
      "A gentle [WIND] blows through the meadow."
    ],
    extras: ["DARK", "GLOW", "NIGHT"]
  },
  {
    level: 3,
    type: 'bonus',
    time: 45,
    sentences: [
      "Fast [RIVER] flows into the deep [OCEAN].",
      "Colorful fish swim in cool [WATER].",
      "Heavy [RAIN] falls from dark storm clouds.",
      "Sailors navigate a massive wooden [BOAT]."
    ],
    extras: ["WAVE", "FISH", "COAST", "SEAS"]
  }
];

window.addEventListener('DOMContentLoaded', () => {
  initBackgroundCanvas();
  loadLeaderboard();
  
  if (state.playerName) {
    document.getElementById('name-inp').value = state.playerName;
  }
  
  document.getElementById('name-go').addEventListener('click', () => {
    const val = document.getElementById('name-inp').value.trim();
    if (val) {
      state.playerName = val;
      localStorage.setItem('ss_name', val);
      if (state.pendingMode === 'vs') initVSLobby();
      else startSoloGame();
    }
  });

  setupGridDragging();
});

function show(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('s-' + screenId).classList.add('active');
}

function goSolo() {
  if (!state.playerName) {
    state.pendingMode = 'solo';
    show('name');
  } else {
    startSoloGame();
  }
}

function goVS() {
  if (!state.playerName) {
    state.pendingMode = 'vs';
    show('name');
  } else {
    initVSLobby();
  }
}

function goJoinChallenge() { show('join'); }
function goCreate() { show('create'); }

function startSoloGame() {
  state.mode = 'solo';
  state.score = 0;
  state.level = 1;
  state.hints = 3;
  loadLevel(state.level);
  show('game');
}

function loadLevel(lvlNum) {
  const lvlData = PRESET_LEVELS[(lvlNum - 1) % PRESET_LEVELS.length];
  state.streak = 0;
  state.foundWords = [];
  updateStreakUI();
  
  parseAndBuildLevel(lvlData);
  
  document.getElementById('vs-bar').classList.remove('on');
  document.getElementById('type-banner').classList.remove('on');
  
  if (lvlData.type === 'bonus') {
    setupTimerBanner('⚡ Bonus Round!', 'Find all missing words before time runs out!', lvlData.time, '#FBBF24');
  }

  document.getElementById('level-tag').innerHTML = `Level ${lvlNum} · <span style="color:var(--sky)">${lvlData.type.toUpperCase()}</span>`;
  document.getElementById('score-disp').textContent = `${state.score} PTS`;
  document.getElementById('hint-cnt').textContent = state.hints;
}

function parseAndBuildLevel(data) {
  const container = document.getElementById('sentence-container');
  container.innerHTML = '';
  const words = [];
  
  data.sentences.forEach(sText => {
    const card = document.createElement('div');
    card.className = 's-card';
    const html = sText.replace(/\[(.*?)\]/g, (match, word) => {
      const clean = word.toUpperCase();
      words.push(clean);
      return `<span class="blank" data-word="${clean}">___</span>`;
    });
    card.innerHTML = html;
    container.appendChild(card);
  });

  if (data.extras) words.push(...data.extras.map(e => e.toUpperCase()));
  state.wordsToFind = [...new Set(words)];
  generateGrid(state.wordsToFind);
}

function generateGrid(words) {
  const maxLen = Math.max(...words.map(w => w.length));
  // Dynamic sizing to fit all sentences and words cleanly
  const size = Math.max(10, maxLen + 2);
  state.gridSize = size;
  let grid = Array(size).fill(null).map(() => Array(size).fill(''));
  
  const directions = [[0, 1], [1, 0], [1, 1], [-1, 1]];

  words.forEach(word => {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
      attempts++;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);

      if (canPlaceWord(grid, word, row, col, dir, size)) {
        for (let i = 0; i < word.length; i++) {
          grid[row + dir[0] * i][col + dir[1] * i] = word[i];
        }
        placed = true;
      }
    }
  });

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
    }
  }

  state.grid = grid;
  renderGridUI();
}

function canPlaceWord(grid, word, r, c, dir, size) {
  for (let i = 0; i < word.length; i++) {
    const nr = r + dir[0] * i;
    const nc = c + dir[1] * i;
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) return false;
    if (grid[nr][nc] !== '' && grid[nr][nc] !== word[i]) return false;
  }
  return true;
}

function renderGridUI() {
  const gridEl = document.getElementById('grid');
  gridEl.style.gridTemplateColumns = `repeat(${state.gridSize}, 1fr)`;
  gridEl.innerHTML = '';
  document.getElementById('svg-found-group').innerHTML = '';

  for (let r = 0; r < state.gridSize; r++) {
    for (let c = 0; c < state.gridSize; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.textContent = state.grid[r][c];
      gridEl.appendChild(cell);
    }
  }
}

/* ── TOUCH & MOUSE GRID DRAGGING ── */
let dragStart = null;
let currentSelection = [];

function setupGridDragging() {
  const box = document.getElementById('grid-box');

  const getCellCoords = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el.classList.contains('cell')) {
      return { r: parseInt(el.dataset.r), c: parseInt(el.dataset.c) };
    }
    return null;
  };

  const startDrag = (e) => {
    const coords = getCellCoords(e);
    if (coords) {
      dragStart = coords;
      updateDrag(coords);
    }
  };

  const moveDrag = (e) => {
    if (!dragStart) return;
    const coords = getCellCoords(e);
    if (coords) updateDrag(coords);
  };

  const endDrag = ()
