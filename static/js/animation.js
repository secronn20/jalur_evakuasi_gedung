/**
 * animation.js — Step-by-step animation engine for Hill Climbing visualization
 * Handles path animation, heuristic chart, step log, and condition detection
 */

// ── Chart.js instance ─────────────────────────────────────────────────────
let heuristicChart = null;
let animationInterval = null;
let currentStepIndex = 0;
let allSteps = [];
let animationSpeed = 300; // ms per step

// ── Initialize Chart ──────────────────────────────────────────────────────
function initChart() {
  const ctx = document.getElementById('heuristic-chart').getContext('2d');

  if (heuristicChart) heuristicChart.destroy();

  heuristicChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Heuristik (h)',
        data: [],
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0,212,255,0.08)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#00d4ff',
        pointBorderColor: '#0d1117',
        pointBorderWidth: 1,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 200 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1c2128',
          borderColor: '#30363d',
          borderWidth: 1,
          titleColor: '#e6edf3',
          bodyColor: '#8b949e',
          callbacks: {
            label: ctx => `h = ${ctx.raw}`,
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(48,54,61,0.6)', drawTicks: false },
          ticks: { color: '#484f58', font: { size: 9 }, maxTicksLimit: 8 },
          title: { display: true, text: 'Langkah', color: '#484f58', font: { size: 9 } }
        },
        y: {
          grid: { color: 'rgba(48,54,61,0.6)', drawTicks: false },
          ticks: { color: '#484f58', font: { size: 9 }, maxTicksLimit: 6 },
          title: { display: true, text: 'h(n)', color: '#484f58', font: { size: 9 } },
          beginAtZero: true
        }
      }
    }
  });
}

// ── Add a data point to chart ─────────────────────────────────────────────
function chartAddPoint(step, value) {
  heuristicChart.data.labels.push(step);
  heuristicChart.data.datasets[0].data.push(value);
  heuristicChart.update('none');
}

// ── Reset chart ───────────────────────────────────────────────────────────
function resetChart() {
  if (heuristicChart) {
    heuristicChart.data.labels = [];
    heuristicChart.data.datasets[0].data = [];
    heuristicChart.update('none');
  }
}

// ── Main Animation Runner ─────────────────────────────────────────────────
function runAnimation(result) {
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }

  allSteps = result.steps || [];
  currentStepIndex = 0;

  clearOverlays();
  resetChart();
  clearStepLog();
  resetConditionCounts();

  updateStatus('running', '⚙️ Menjalankan algoritma...');
  setRunButtonState('stop');

  // Condition counters
  let condCounts = { local_optima: 0, plateau: 0, ridge: 0 };

  animationInterval = setInterval(() => {
    if (currentStepIndex >= allSteps.length) {
      finishAnimation(result, condCounts);
      return;
    }

    const step = allSteps[currentStepIndex];
    renderStep(step, currentStepIndex, condCounts);
    currentStepIndex++;
  }, animationSpeed);
}

// ── Render a single step ──────────────────────────────────────────────────
function renderStep(step, idx, condCounts) {
  const { current, neighbors, chosen, current_h, state_type } = step;

  // Clear previous "current-pos" and highlights
  document.querySelectorAll('.cell.current-pos, .cell.neighbor-highlight, .cell.neighbor-best, .cell.local-optima, .cell.plateau, .cell.ridge').forEach(el => {
    const r = parseInt(el.dataset.row);
    const c = parseInt(el.dataset.col);
    const type = grid[r][c];
    // Only reset visual overlays, keep path/explored
    el.classList.remove('current-pos', 'neighbor-highlight', 'neighbor-best', 'local-optima', 'plateau', 'ridge');
    if (!el.classList.contains('path') && !el.classList.contains('explored')) {
      el.className = `cell ${type}`;
    }
  });

  // Mark neighbors
  if (neighbors) {
    neighbors.forEach(n => {
      if (!n.passable) return;
      const cell = getCellEl(n.pos[0], n.pos[1]);
      const type = grid[n.pos[0]][n.pos[1]];
      if (type === 'start' || type === 'exit') return;

      if (step.is_stochastic && n.is_chosen) {
        cell.classList.add('neighbor-best');
      } else if (!step.is_stochastic && n.is_best) {
        cell.classList.add('neighbor-best');
      } else {
        cell.classList.add('neighbor-highlight');
      }

      // Show h value
      if (n.h >= 0) {
        let hv = cell.querySelector('.h-value');
        if (!hv) {
          hv = document.createElement('span');
          hv.className = 'h-value';
          cell.appendChild(hv);
        }
        hv.textContent = n.h;
      }
    });
  }

  // Mark explored path
  const prevCell = getCellEl(current[0], current[1]);
  const prevType = grid[current[0]][current[1]];
  if (prevType !== 'start' && prevType !== 'exit') {
    prevCell.classList.add('explored');
  }

  // Mark current position
  const curCell = getCellEl(current[0], current[1]);
  curCell.classList.remove('explored');
  curCell.classList.add('current-pos');

  // Apply state condition
  if (state_type === 'local_optima') {
    curCell.classList.add('local-optima');
    condCounts.local_optima++;
    updateConditionCount('local_optima', condCounts.local_optima);
  } else if (state_type === 'plateau') {
    curCell.classList.add('plateau');
    condCounts.plateau++;
    updateConditionCount('plateau', condCounts.plateau);
  } else if (state_type === 'ridge') {
    curCell.classList.add('ridge');
    condCounts.ridge++;
    updateConditionCount('ridge', condCounts.ridge);
  }

  // Mark chosen (next move)
  if (chosen) {
    const chosenCell = getCellEl(chosen[0], chosen[1]);
    const chosenType = grid[chosen[0]][chosen[1]];
    if (chosenType !== 'exit') {
      chosenCell.classList.add('path');
    }
  }

  // Update chart
  chartAddPoint(idx + 1, current_h);

  // Update stats
  document.getElementById('stat-h-current').textContent = current_h;
  document.getElementById('stat-steps').textContent = idx + 1;

  // Add to step log
  addStepEntry(idx + 1, step.description, state_type);

  // Progress bar
  const pct = Math.round(((idx + 1) / allSteps.length) * 100);
  document.getElementById('progress-fill').style.width = `${pct}%`;

  // Stochastic: show probability
  if (step.is_stochastic && step.chosen_probability !== undefined) {
    document.getElementById('stat-prob').textContent = `${step.chosen_probability}%`;
  }
}

// ── Finish Animation ──────────────────────────────────────────────────────
function finishAnimation(result, condCounts) {
  clearInterval(animationInterval);
  animationInterval = null;
  setRunButtonState('run');

  const { success, path, history, termination, algorithm } = result;

  // Draw final path
  if (path) {
    path.forEach(([r, c]) => {
      const cell = getCellEl(r, c);
      const type = grid[r][c];
      if (type !== 'start' && type !== 'exit') {
        cell.className = `cell ${type} path`;
      }
    });
  }

  // Final chart point
  if (history && history.length > 0) {
    chartAddPoint('✓', history[history.length - 1]);
  }

  // Update status
  if (success) {
    updateStatus('success', `✅ Goal tercapai! Panjang jalur: ${path ? path.length : '?'} langkah`);
    showToast(`${algorithm} berhasil menemukan jalur!`, 'success', '✅');
  } else {
    const termMsg = {
      local_optima: '🚫 Local Optima — Tidak ada tetangga lebih baik',
      plateau: '⚠️ Plateau — Semua tetangga bernilai sama',
      ridge: '⛰️ Ridge — Jalur tersumbat',
      max_iterations: '⏱️ Batas iterasi tercapai'
    }[termination] || '❌ Gagal menemukan jalur';

    updateStatus('failed', termMsg);
    showToast(termMsg, 'warning', '⚠️');
  }

  // Final stats
  document.getElementById('stat-path-len').textContent = path ? path.length : '-';
  document.getElementById('progress-fill').style.width = '100%';

  // Update condition panel styling
  updateConditionDetected('local_optima', condCounts.local_optima > 0);
  updateConditionDetected('plateau', condCounts.plateau > 0);
  updateConditionDetected('ridge', condCounts.ridge > 0);
}

// ── Step Log ──────────────────────────────────────────────────────────────
function addStepEntry(num, text, type) {
  const log = document.getElementById('step-log');
  const entry = document.createElement('div');
  entry.className = `step-entry type-${type}`;
  entry.innerHTML = `
    <span class="step-num">#${String(num).padStart(3,'0')}</span>
    <span class="step-text">${text || '...'}</span>
  `;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;

  // Keep max 100 entries
  while (log.children.length > 100) {
    log.removeChild(log.firstChild);
  }
}

function clearStepLog() {
  document.getElementById('step-log').innerHTML = '';
}

// ── Condition Counters ────────────────────────────────────────────────────
function resetConditionCounts() {
  ['local_optima', 'plateau', 'ridge'].forEach(type => {
    updateConditionCount(type, 0);
    updateConditionDetected(type, false);
  });
}

function updateConditionCount(type, count) {
  const el = document.getElementById(`cond-count-${type}`);
  if (el) el.textContent = count;
}

function updateConditionDetected(type, detected) {
  const el = document.getElementById(`cond-item-${type}`);
  if (!el) return;
  el.classList.toggle('detected', detected);
  if (type === 'plateau') el.classList.toggle('plateau', detected);
  if (type === 'ridge') el.classList.toggle('ridge', detected);
}

// ── Status Updates ────────────────────────────────────────────────────────
function updateStatus(state, message) {
  const bar = document.getElementById('status-bar');
  bar.className = `status-bar ${state}`;
  document.getElementById('status-text').textContent = message;
}

// ── Run Button State ──────────────────────────────────────────────────────
function setRunButtonState(state) {
  const btn = document.getElementById('run-btn');
  if (state === 'stop') {
    btn.innerHTML = `<span>⏹</span> Stop`;
    btn.classList.add('btn-danger');
    btn.classList.remove('btn-primary');
    btn.onclick = stopAnimation;
  } else {
    btn.innerHTML = `<span>▶</span> Jalankan`;
    btn.classList.add('btn-primary');
    btn.classList.remove('btn-danger');
    btn.onclick = startRun;
  }
}

// ── Stop Animation ────────────────────────────────────────────────────────
function stopAnimation() {
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }
  setRunButtonState('run');
  updateStatus('idle', '⏸ Dihentikan oleh pengguna');
}

// ── Toast Notifications ───────────────────────────────────────────────────
function showToast(message, type = 'info', icon = 'ℹ️') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Main Run Handler ──────────────────────────────────────────────────────
async function startRun() {
  const algorithmInput = document.querySelector('.algo-btn.active');
  if (!algorithmInput) {
    showToast('Pilih algoritma terlebih dahulu!', 'error', '❌');
    return;
  }

  const algorithm = algorithmInput.dataset.algo;
  updateStatus('running', '🔄 Mengirim ke server...');

  try {
    const resp = await fetch('/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grid, algorithm })
    });

    const result = await resp.json();

    if (result.error) {
      showToast(result.error, 'error', '❌');
      updateStatus('failed', `❌ ${result.error}`);
      return;
    }

    // Update algorithm display
    document.getElementById('footer-algo').textContent = result.algorithm || algorithm;
    document.getElementById('stat-total-steps').textContent = result.total_steps || '-';

    runAnimation(result);

  } catch (err) {
    showToast('Gagal terhubung ke server!', 'error', '❌');
    updateStatus('failed', '❌ Koneksi gagal');
    console.error(err);
  }
}

// ── Speed Control ─────────────────────────────────────────────────────────
document.getElementById('speed-slider').addEventListener('input', function () {
  // Slider 1–10, map to 600ms–50ms (inverted)
  animationSpeed = Math.round(650 - this.value * 60);
  document.getElementById('speed-label').textContent = `${this.value}x`;
});

// ── Algorithm Buttons ─────────────────────────────────────────────────────
document.querySelectorAll('.algo-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ── Run / Reset Buttons ───────────────────────────────────────────────────
document.getElementById('run-btn').addEventListener('click', startRun);

document.getElementById('reset-btn').addEventListener('click', () => {
  stopAnimation();
  resetGrid();
  resetChart();
  clearStepLog();
  resetConditionCounts();
  updateStatus('idle', '🖊️ Gambar peta evakuasi');
  document.getElementById('stat-h-current').textContent = '-';
  document.getElementById('stat-steps').textContent = '0';
  document.getElementById('stat-path-len').textContent = '-';
  document.getElementById('stat-total-steps').textContent = '-';
  document.getElementById('stat-prob').textContent = '-';
  document.getElementById('progress-fill').style.width = '0%';
  showToast('Grid direset', 'info', '🔄');
});

document.getElementById('clear-path-btn').addEventListener('click', () => {
  stopAnimation();
  clearOverlays();
  resetChart();
  clearStepLog();
  resetConditionCounts();
  updateStatus('idle', '🖊️ Jalur dihapus. Siap dijalankan ulang.');
  document.getElementById('stat-h-current').textContent = '-';
  document.getElementById('stat-steps').textContent = '0';
  document.getElementById('progress-fill').style.width = '0%';
});

// ── Preset Buttons ────────────────────────────────────────────────────────
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    stopAnimation();
    loadPreset(btn.dataset.preset);
    clearStepLog();
    resetChart();
    resetConditionCounts();
    updateStatus('idle', '🗺️ Preset dimuat. Klik "Jalankan" untuk mulai.');
  });
});

// ── Mobile Tab Navigation Logic ───────────────────────────────────────────
function setupMobileTabs() {
  const tabs = document.querySelectorAll('.mobile-tab-btn');
  const mainContent = document.getElementById('main-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Toggle active states on buttons
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Set custom data attribute on main layout to toggle responsive views in CSS
      const targetTab = tab.dataset.tab;
      mainContent.setAttribute('data-active-tab', targetTab);

      // Force-resize and update Chart.js when entering statistics tab to prevent collapsed width (0px)
      if (targetTab === 'stats' && heuristicChart) {
        setTimeout(() => {
          heuristicChart.resize();
          heuristicChart.update('none');
        }, 80);
      }
    });
  });
}

// ── Init ──────────────────────────────────────────────────────────────────
initChart();
setupMobileTabs();
updateStatus('idle', '🖊️ Gambar peta evakuasi pada grid, lalu klik "Jalankan"');
