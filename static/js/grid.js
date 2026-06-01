/**
 * grid.js — Grid initialization & interaction logic
 * Evacuation Path Optimizer — Hill Climbing Simulator
 */

const ROWS = 20;
const COLS = 20;

let grid = [];
let currentTool = 'wall';
let isMouseDown = false;

// ── Initialize Grid Data ──────────────────────────────────────────────────
function initGridData() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      row.push('empty');
    }
    grid.push(row);
  }
}

// ── Build DOM Grid ────────────────────────────────────────────────────────
function buildGrid() {
  const gridEl = document.getElementById('evacuation-grid');
  gridEl.innerHTML = '';

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell', 'empty');
      cell.id = `cell-${r}-${c}`;
      cell.dataset.row = r;
      cell.dataset.col = c;

      // Click / Mouse down
      cell.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        paintCell(r, c);
        e.preventDefault();
      });

      // Drag paint (Mouse)
      cell.addEventListener('mouseenter', () => {
        if (isMouseDown) paintCell(r, c);
      });

      // Touch start (Mobile)
      cell.addEventListener('touchstart', (e) => {
        isMouseDown = true;
        paintCell(r, c);
        e.preventDefault(); // Prevent scrolling while drawing
      }, { passive: false });

      gridEl.appendChild(cell);
    }
  }

  // Global mouse / touch release
  document.addEventListener('mouseup', () => { isMouseDown = false; });
  document.addEventListener('touchend', () => { isMouseDown = false; });

  // Touch drag paint on grid container (Mobile)
  gridEl.addEventListener('touchmove', (e) => {
    if (!isMouseDown) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('cell')) {
      const r = parseInt(target.dataset.row);
      const c = parseInt(target.dataset.col);
      if (!isNaN(r) && !isNaN(c)) {
        paintCell(r, c);
      }
    }
    e.preventDefault(); // Prevent scrolling while drawing
  }, { passive: false });
}

// ── Paint a single cell ───────────────────────────────────────────────────
function paintCell(r, c) {
  const tool = currentTool;

  // Enforce single start / single exit
  if (tool === 'start') {
    clearCellType('start');
  } else if (tool === 'exit') {
    clearCellType('exit');
  }

  grid[r][c] = tool;
  const cell = getCellEl(r, c);
  cell.className = `cell ${tool}`;

  updateGridInfo();
}

function clearCellType(type) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === type) {
        grid[r][c] = 'empty';
        getCellEl(r, c).className = 'cell empty';
      }
    }
  }
}

function getCellEl(r, c) {
  return document.getElementById(`cell-${r}-${c}`);
}

// ── Reset Grid ────────────────────────────────────────────────────────────
function resetGrid() {
  initGridData();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      getCellEl(r, c).className = 'cell empty';
    }
  }
  updateGridInfo();
  clearOverlays();
}

// ── Clear Visual Overlays (keep walls/fire/start/exit) ────────────────────
function clearOverlays() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = getCellEl(r, c);
      const type = grid[r][c];
      cell.className = `cell ${type}`;
      const hv = cell.querySelector('.h-value');
      if (hv) hv.remove();
    }
  }
}

// ── Grid Info Stats ────────────────────────────────────────────────────────
function updateGridInfo() {
  let walls = 0, fires = 0;
  let hasStart = false, hasExit = false;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = grid[r][c];
      if (t === 'wall')  walls++;
      if (t === 'fire')  fires++;
      if (t === 'start') hasStart = true;
      if (t === 'exit')  hasExit  = true;
    }
  }
  document.getElementById('stat-walls').textContent = walls;
  document.getElementById('stat-fires').textContent = fires;

  const runBtn = document.getElementById('run-btn');
  runBtn.disabled = !(hasStart && hasExit);
}

// ── Load Preset Map ───────────────────────────────────────────────────────
function loadPreset(presetName) {
  resetGrid();

  const presets = {
    simple: () => {
      // A clear corridor — Simple HC should find this easily
      grid[1][1] = 'start'; getCellEl(1,1).className = 'cell start';
      grid[18][18] = 'exit'; getCellEl(18,18).className = 'cell exit';
      // Some walls forming a corridor
      for (let c = 3; c < 17; c++) { grid[5][c] = 'wall'; getCellEl(5,c).className = 'cell wall'; }
      for (let c = 3; c < 17; c++) { grid[10][c] = 'wall'; getCellEl(10,c).className = 'cell wall'; }
      grid[5][10] = 'empty'; getCellEl(5,10).className = 'cell empty';
      grid[10][8] = 'empty'; getCellEl(10,8).className = 'cell empty';
      grid[1][10] = 'fire'; getCellEl(1,10).className = 'cell fire';
    },
    optima: () => {
      // Designed to create LOCAL OPTIMA
      grid[10][1] = 'start'; getCellEl(10,1).className = 'cell start';
      grid[10][18] = 'exit'; getCellEl(10,18).className = 'cell exit';
      // Walls blocking straight path, creating a local optima trap
      for (let r = 7; r <= 13; r++) { grid[r][8] = 'wall'; getCellEl(r,8).className = 'cell wall'; }
      for (let r = 7; r <= 13; r++) { grid[r][12] = 'wall'; getCellEl(r,12).className = 'cell wall'; }
      grid[7][8] = 'wall'; getCellEl(7,8).className = 'cell wall';
      grid[13][8] = 'wall'; getCellEl(13,8).className = 'cell wall';
      // Additional blocker to force local optima
      for (let r = 0; r < 8; r++) { grid[r][5] = 'wall'; getCellEl(r,5).className = 'cell wall'; }
      for (let r = 12; r < ROWS; r++) { grid[r][5] = 'wall'; getCellEl(r,5).className = 'cell wall'; }
      grid[5][2] = 'fire'; getCellEl(5,2).className = 'cell fire';
      grid[15][2] = 'fire'; getCellEl(15,2).className = 'cell fire';
    },
    maze: () => {
      // Maze-like structure
      grid[0][0] = 'start'; getCellEl(0,0).className = 'cell start';
      grid[19][19] = 'exit'; getCellEl(19,19).className = 'cell exit';
      const walls = [
        [1,0],[1,1],[1,2],[1,3],[1,4],[1,5],
        [3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[3,8],
        [5,0],[5,1],[5,2],[5,3],[5,4],[5,5],[5,6],
        [7,3],[7,4],[7,5],[7,6],[7,7],[7,8],[7,9],
        [9,0],[9,1],[9,2],[9,3],[9,4],[9,5],[9,6],[9,7],
        [11,4],[11,5],[11,6],[11,7],[11,8],[11,9],[11,10],
        [13,0],[13,1],[13,2],[13,3],[13,4],[13,5],
        [15,5],[15,6],[15,7],[15,8],[15,9],[15,10],[15,11],
        [17,0],[17,1],[17,2],[17,3],[17,4],[17,5],[17,6],[17,7],
      ];
      walls.forEach(([r,c]) => {
        grid[r][c] = 'wall';
        getCellEl(r,c).className = 'cell wall';
      });
      grid[6][8] = 'fire'; getCellEl(6,8).className = 'cell fire';
      grid[12][12] = 'fire'; getCellEl(12,12).className = 'cell fire';
    }
  };

  if (presets[presetName]) {
    presets[presetName]();
    updateGridInfo();
    showToast(`Preset "${presetName}" dimuat`, 'info', '🗺️');
  }
}

// ── Tool Buttons ──────────────────────────────────────────────────────────
function setupToolButtons() {
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTool = btn.dataset.tool;
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Set default active
  document.querySelector('[data-tool="wall"]').classList.add('active');
}

// ── Initialize ────────────────────────────────────────────────────────────
initGridData();
buildGrid();
setupToolButtons();
updateGridInfo();
