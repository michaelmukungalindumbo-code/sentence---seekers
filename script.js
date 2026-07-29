/* ── LOCAL & PEER STATE ── */
let state = {
  playerName: localStorage.getItem('ss_name') || '',
  score: 0,
  level: 1,
  mode: 'solo', // 'solo', 'vs', 'custom'
  streak: 0,
  hints: 3,
  gridSize: 8,
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

const PRESET_LEVELS = [
  {
    level: 1,
    type: 'normal',
    sentences: ["The quick brown [FOX] jumps over.", "A loyal [DOG] barks loudly."],
    extras: ["CAT", "SUN"]
  },
  {
    level: 2,
    type: 'normal',
    sentences: ["Bright [STARS] shine in the night [SKY].", "The [MOON] reflects sunlight."],
    extras: ["DARK", "GLOW"]
  },
  {
    level: 3,
    type: 'bonus',
    time: 30,
    sentences: ["Fast [RIVER] flows to the deep [OCEAN].", "Fish swim in blue [WATER]."],
    extras: ["WAVE", "FISH", "BOAT"]
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
    setupTimerBanner('⚡ Bonus Round!', 'Find all missing words before timer ends!', lvlData.time, '#FBBF24');
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
  const size = Math.max(8, ...words.map(w => w.length));
  state.gridSize = size;
  let grid = Array(size).fill(null).map(() => Array(size).fill(''));
  
  const directions = [[0, 1], [1, 0], [1, 1], [-1, 1]];

  words.forEach(word => {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
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

  const endDrag = () => {
    if (!dragStart) return;
    checkSelectedWord();
    dragStart = null;
    currentSelection = [];
    document.getElementById('svg-drag').style.display = 'none';
    document.querySelectorAll('.cell.active').forEach(c => c.classList.remove('active'));
  };

  box.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', moveDrag);
  window.addEventListener('mouseup', endDrag);

  box.addEventListener('touchstart', (e) => { startDrag(e); e.preventDefault(); }, { passive: false });
  window.addEventListener('touchmove', moveDrag, { passive: false });
  window.addEventListener('touchend', endDrag);
}

function updateDrag(endCoords) {
  const dr = endCoords.r - dragStart.r;
  const dc = endCoords.c - dragStart.c;
  
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return;

  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  const stepR = dr === 0 ? 0 : dr / steps;
  const stepC = dc === 0 ? 0 : dc / steps;

  currentSelection = [];
  document.querySelectorAll('.cell.active').forEach(c => c.classList.remove('active'));

  for (let i = 0; i <= steps; i++) {
    const r = dragStart.r + stepR * i;
    const c = dragStart.c + stepC * i;
    currentSelection.push({ r, c });
    
    const cellEl = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    if (cellEl) cellEl.classList.add('active');
  }

  if (currentSelection.length > 0) {
    const startCell = document.querySelector(`.cell[data-r="${dragStart.r}"][data-c="${dragStart.c}"]`);
    const endCell = document.querySelector(`.cell[data-r="${endCoords.r}"][data-c="${endCoords.c}"]`);
    drawSVGLine('svg-drag', startCell, endCell);
  }
}

function checkSelectedWord() {
  if (currentSelection.length === 0) return;

  const word = currentSelection.map(pos => state.grid[pos.r][pos.c]).join('');
  const reverseWord = word.split('').reverse().join('');

  let matched = null;
  if (state.wordsToFind.includes(word)) matched = word;
  else if (state.wordsToFind.includes(reverseWord)) matched = reverseWord;

  if (matched && !state.foundWords.includes(matched)) {
    handleWordFound(matched, currentSelection);
  }
}

function handleWordFound(word, posArray) {
  state.foundWords.push(word);
  
  state.streak++;
  const mult = Math.min(state.streak, 3);
  const pts = word.length * 100 * mult;
  state.score += pts;
  
  document.getElementById('score-disp').textContent = `${state.score} PTS`;
  updateStreakUI();

  document.querySelectorAll(`.blank[data-word="${word}"]`).forEach(b => {
    b.textContent = word;
    b.classList.add('done');
  });

  const firstCell = document.querySelector(`.cell[data-r="${posArray[0].r}"][data-c="${posArray[0].c}"]`);
  const lastCell = document.querySelector(`.cell[data-r="${posArray[posArray.length-1].r}"][data-c="${posArray[posArray.length-1].c}"]`);
  
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('class', 'l-found');
  const color = COLORS[(state.foundWords.length - 1) % COLORS.length];
  line.setAttribute('stroke', color);
  
  setLineCoordinates(line, firstCell, lastCell);
  document.getElementById('svg-found-group').appendChild(line);

  if (state.mode === 'vs' && vsState.conn) {
    vsState.conn.send({
      type: 'WORD_FOUND',
      word: word,
      score: state.score,
      foundCount: state.foundWords.length,
      lineCoords: { r1: posArray[0].r, c1: posArray[0].c, r2: posArray[posArray.length-1].r, c2: posArray[posArray.length-1].c }
    });
  }

  if (state.foundWords.length >= state.wordsToFind.length) {
    setTimeout(levelComplete, 600);
  }
}

function drawSVGLine(lineId, cell1, cell2) {
  const line = document.getElementById(lineId);
  line.style.display = 'block';
  setLineCoordinates(line, cell1, cell2);
}

function setLineCoordinates(line, cell1, cell2) {
  const gridBox = document.getElementById('grid-box').getBoundingClientRect();
  const r1 = cell1.getBoundingClientRect();
  const r2 = cell2.getBoundingClientRect();

  const x1 = (r1.left + r1.width / 2) - gridBox.left;
  const y1 = (r1.top + r1.height / 2) - gridBox.top;
  const x2 = (r2.left + r2.width / 2) - gridBox.left;
  const y2 = (r2.top + r2.height / 2) - gridBox.top;

  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
}

function setupTimerBanner(title, subtitle, seconds, color) {
  const banner = document.getElementById('type-banner');
  banner.classList.add('on');
  document.getElementById('type-lbl').textContent = title;
  document.getElementById('type-sub').textContent = subtitle;
  document.getElementById('type-lbl').style.color = color;
  
  state.timeLeft = seconds;
  state.maxTime = seconds;
  
  if (state.timer) clearInterval(state.timer);
  state.timer = setInterval(() => {
    state.timeLeft--;
    document.getElementById('type-time').textContent = state.timeLeft;
    const pct = (state.timeLeft / state.maxTime) * 100;
    document.getElementById('type-fill').style.width = pct + '%';

    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      levelComplete();
    }
  }, 1000);
}

function levelComplete() {
  if (state.timer) clearInterval(state.timer);
  const ov = document.getElementById('ov');
  ov.classList.remove('hide');
  
  ov.innerHTML = `
    <div class="ov-title">LEVEL COMPLETE!</div>
    <div class="ov-score">+${state.score} PTS</div>
    <button class="btn btn-sky" onclick="closeOverlay(); nextLevel();">Next Level →</button>
  `;
  saveScoreToLeaderboard(state.playerName, state.score);
}

function nextLevel() {
  state.level++;
  loadLevel(state.level);
}

function closeOverlay() {
  document.getElementById('ov').classList.add('hide');
}

function confirmExit() {
  if (confirm("Quit current game?")) {
    if (state.timer) clearInterval(state.timer);
    show('home');
  }
}

function updateStreakUI() {
  const dots = document.querySelectorAll('.sdot');
  dots.forEach((d, idx) => {
    if (idx < state.streak) d.classList.add('on');
    else d.classList.remove('on');
  });
  document.getElementById('streak-mult').textContent = `${Math.min(state.streak + 1, 3)}x`;
}

function useHint() {
  if (state.hints <= 0) return;
  const unfound = state.wordsToFind.filter(w => !state.foundWords.includes(w));
  if (unfound.length === 0) return;

  const target = unfound[0];
  state.hints--;
  document.getElementById('hint-cnt').textContent = state.hints;

  for (let r = 0; r < state.gridSize; r++) {
    for (let c = 0; c < state.gridSize; c++) {
      if (state.grid[r][c] === target[0]) {
        const cell = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
        if (cell) {
          cell.style.background = 'rgba(167, 139, 250, 0.4)';
          setTimeout(() => cell.style.background = '', 1000);
        }
      }
    }
  }
}

function addExtraWord() {
  const inp = document.getElementById('c-extra-inp');
  const val = inp.value.trim().toUpperCase();
  if (val && !state.customExtras.includes(val)) {
    state.customExtras.push(val);
    renderChips();
    inp.value = '';
  }
}

function renderChips() {
  const container = document.getElementById('c-chips');
  container.innerHTML = '';
  state.customExtras.forEach(w => {
    const chip = document.createElement('div');
    chip.className = 'chip chip-rose';
    chip.innerHTML = `${w}`;
    container.appendChild(chip);
  });
}

function saveCustomPuzzle() {
  const text = document.getElementById('c-text').value.trim();
  if (!text) return alert("Please enter sentences.");

  const payload = {
    sentences: text.split('\n').filter(s => s.trim().length > 0),
    extras: state.customExtras
  };

  const code = btoa(JSON.stringify(payload));
  const ov = document.getElementById('ov');
  ov.classList.remove('hide');
  ov.innerHTML = `
    <div class="ov-title">PUZZLE CREATED!</div>
    <p style="text-align:center; max-width:300px; word-break:break-all;">${code}</p>
    <button class="btn btn-rose" onclick="navigator.clipboard.writeText('${code}'); alert('Code copied!');">Copy Code 📋</button>
    <button class="btn btn-ghost" onclick="closeOverlay(); show('home');">Back</button>
  `;
}

function loadCustomChallenge() {
  const code = document.getElementById('custom-code-inp').value.trim();
  if (!code) return;

  try {
    const decoded = JSON.parse(atob(code));
    state.mode = 'custom';
    state.score = 0;
    parseAndBuildLevel(decoded);
    show('game');
  } catch (e) {
    document.getElementById('custom-status').textContent = 'Invalid Challenge Code!';
  }
}

function saveScoreToLeaderboard(name, score) {
  let lb = JSON.parse(localStorage.getItem('ss_lb') || '[]');
  lb.push({ name, score });
  lb.sort((a, b) => b.score - a.score);
  lb = lb.slice(0, 5);
  localStorage.setItem('ss_lb', JSON.stringify(lb));
  loadLeaderboard();
}

function loadLeaderboard() {
  const lb = JSON.parse(localStorage.getItem('ss_lb') || '[]');
  const list = document.getElementById('lb-list');
  if (lb.length === 0) {
    list.innerHTML = `<div class="lb-empty">No high scores yet!</div>`;
    return;
  }
  list.innerHTML = lb.map((item, idx) => `
    <div class="lb-row">
      <div class="lb-rank">#${idx + 1}</div>
      <div class="lb-name">${item.name}</div>
      <div class="lb-score">${item.score} PTS</div>
    </div>
  `).join('');
}

function initVSLobby() {
  show('vs');
  document.getElementById('p1-name').textContent = state.playerName;
  const room = Math.random().toString(36).substring(2, 6).toUpperCase();
  vsState.roomCode = room;
  document.getElementById('vs-code-display').textContent = room;

  vsState.peer = new Peer('ss-room-' + room);
  vsState.peer.on('open', () => { vsState.isHost = true; });
  vsState.peer.on('connection', (conn) => {
    vsState.conn = conn;
    setupVSConnection();
  });
}

function joinVSRoom() {
  const code = document.getElementById('vs-join-inp').value.trim().toUpperCase();
  if (!code) return;

  vsState.peer = new Peer();
  vsState.peer.on('open', () => {
    vsState.conn = vsState.peer.connect('ss-room-' + code);
    vsState.isHost = false;
    setupVSConnection();
  });
}

function setupVSConnection() {
  vsState.conn.on('open', () => {
    document.getElementById('p2-dot').className = 'p-dot';
    document.getElementById('vs-start-btn').disabled = false;
    vsState.conn.send({ type: 'HANDSHAKE', name: state.playerName });
  });

  vsState.conn.on('data', (data) => {
    if (data.type === 'HANDSHAKE') {
      vsState.oppName = data.name;
      document.getElementById('p2-name').textContent = data.name;
    } else if (data.type === 'START_GAME') {
      startVSGameUI(data.levelData);
    } else if (data.type === 'WORD_FOUND') {
      vsState.oppScore = data.score;
      vsState.oppFound = data.foundCount;
      document.getElementById('vs-opp-score').textContent = vsState.oppScore;
      document.getElementById('vs-opp-found').textContent = `${vsState.oppFound} words`;
    }
  });
}

function startVSGame() {
  const levelData = PRESET_LEVELS[0];
  if (vsState.conn) vsState.conn.send({ type: 'START_GAME', levelData });
  startVSGameUI(levelData);
}

function startVSGameUI(levelData) {
  state.mode = 'vs';
  state.score = 0;
  state.foundWords = [];
  parseAndBuildLevel(levelData);
  document.getElementById('vs-bar').classList.add('on');
  document.getElementById('vs-me-name').textContent = state.playerName;
  document.getElementById('vs-opp-name').textContent = vsState.oppName;
  show('game');
}

function initBackgroundCanvas() {
  const canvas = document.getElementById('bg-cv');
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const stars = Array(40).fill(null).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 1.5 + 0.5,
    alpha: Math.random(),
    speed: Math.random() * 0.01 + 0.005
  }));

  function animate() {
    ctx.clearRect(0, 0, width, height);
    stars.forEach(s => {
      s.alpha += s.speed;
      if (s.alpha > 1 || s.alpha < 0) s.speed = -s.speed;
      ctx.fillStyle = `rgba(56, 189, 248, ${Math.abs(s.alpha) * 0.4})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
  }
    
