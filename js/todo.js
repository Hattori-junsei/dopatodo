// js/todo.js - Multi-Frequency Routines, Due Reminders ("これ終わりましたか？"), 5-Star Difficulty & Dopamine Tasks
import { sound } from './sound.js';
import { fx } from './fx.js';
import { PRESET_TASKS, TASK_TAGS, DIFFICULTIES } from './data.js';

export class TodoManager {
  constructor(app) {
    this.app = app;
    this.focusTimerInterval = null;
    this.focusTimeRemaining = 0;
    this.isFocusTimerActive = false;
    this.selectedDifficulty = 2; // Default 2-star
    this.selectedDueMinutes = 0;
    this.routineCheckInterval = null;
    this.dueCheckInterval = null;
    this.activeRemindTask = null;
  }

  init() {
    this.renderDifficultySelector();
    this.renderTagFilters();
    this.renderPresets();
    this.renderTasks();
    this.renderRoutineWidget();
    this.setupSubtabs();
    this.setupEventListeners();
    this.setupDueOptionsUI();
    this.setupDueRemindModal();
    this.updateComboUI();
    this.setupFocusTimerUI();
    this.setupRoutineManager();

    // Auto-check routines and due reminders
    this.checkAndApplyRoutines();
    this.checkDueReminders();

    if (this.routineCheckInterval) clearInterval(this.routineCheckInterval);
    this.routineCheckInterval = setInterval(() => {
      this.checkAndApplyRoutines();
      this.checkDueReminders();
    }, 30000); // Check every 30s
  }

  setupEventListeners() {
    const input = document.getElementById('task-input');
    const tagSelect = document.getElementById('task-tag-select');
    const diffSelect = document.getElementById('task-diff-inline-select');
    const addBtn = document.getElementById('add-task-btn');
    const logBtn = document.getElementById('view-log-btn');
    const closeLogBtn = document.getElementById('log-modal-close-btn');
    const logModal = document.getElementById('log-modal');
    const presetToggleBtn = document.getElementById('toggle-presets-btn');
    const presetsSection = document.getElementById('presets-collapse-wrap');
    const timePicker = document.getElementById('task-due-time-input');

    const handleAdd = () => {
      const text = input.value.trim();
      if (!text) return;
      const tag = tagSelect ? tagSelect.value : 'work';
      const diff = diffSelect ? parseInt(diffSelect.value, 10) : this.selectedDifficulty;

      let dueTimestamp = null;
      if (timePicker && timePicker.value) {
        const [hours, mins] = timePicker.value.split(':').map(Number);
        const target = new Date();
        target.setHours(hours, mins, 0, 0);
        if (target.getTime() <= Date.now()) {
          target.setDate(target.getDate() + 1); // Tomorrow if time already passed
        }
        dueTimestamp = target.getTime();
      } else if (this.selectedDueMinutes > 0) {
        dueTimestamp = Date.now() + this.selectedDueMinutes * 60 * 1000;
      }

      this.addTask(text, diff, tag, null, dueTimestamp);
      input.value = '';
      if (timePicker) timePicker.value = '';
      this.resetDueButtons();
      sound.playTap();
    };

    if (addBtn) addBtn.addEventListener('click', handleAdd);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAdd();
      });
    }

    if (presetToggleBtn && presetsSection) {
      presetToggleBtn.addEventListener('click', () => {
        const isHidden = presetsSection.style.display === 'none' || !presetsSection.style.display;
        presetsSection.style.display = isHidden ? 'block' : 'none';
        presetToggleBtn.classList.toggle('active', isHidden);
        sound.playTap();
      });
    }

    if (logBtn) {
      logBtn.addEventListener('click', () => {
        this.openLogModal();
        sound.playTap();
      });
    }

    if (closeLogBtn) {
      closeLogBtn.addEventListener('click', () => {
        if (logModal) logModal.classList.remove('active');
        sound.playTap();
      });
    }

    if (logModal) {
      logModal.addEventListener('click', (e) => {
        if (e.target === logModal) {
          logModal.classList.remove('active');
          sound.playTap();
        }
      });
    }
  }

  setupDueOptionsUI() {
    const quickBtns = document.querySelectorAll('.due-quick-btn');
    const timePicker = document.getElementById('task-due-time-input');

    quickBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        quickBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedDueMinutes = parseInt(btn.dataset.min, 10);
        if (timePicker) timePicker.value = '';
        sound.playTap();
      });
    });

    if (timePicker) {
      timePicker.addEventListener('change', () => {
        if (timePicker.value) {
          quickBtns.forEach(b => b.classList.remove('active'));
          this.selectedDueMinutes = 0;
          sound.playTap();
        }
      });
    }
  }

  resetDueButtons() {
    this.selectedDueMinutes = 0;
    const quickBtns = document.querySelectorAll('.due-quick-btn');
    quickBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.min === '0');
    });
  }

  renderDifficultySelector() {
    const diffSelect = document.getElementById('task-diff-inline-select');
    if (!diffSelect) return;

    diffSelect.innerHTML = '';
    Object.values(DIFFICULTIES).forEach(diff => {
      const opt = document.createElement('option');
      opt.value = diff.level;
      opt.textContent = `${diff.stars} ${diff.label} (+💎${diff.gems})`;
      if (diff.level === this.selectedDifficulty) opt.selected = true;
      diffSelect.appendChild(opt);
    });

    diffSelect.addEventListener('change', (e) => {
      this.selectedDifficulty = parseInt(e.target.value, 10);
    });
  }

  renderTagFilters() {
    const container = document.getElementById('tag-filter-chips');
    if (!container) return;

    container.innerHTML = '';
    TASK_TAGS.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = `tag-chip ${this.app.state.currentTagFilter === tag.id ? 'active' : ''}`;
      btn.innerHTML = `<span>${tag.icon}</span> <span>${tag.label}</span>`;
      btn.addEventListener('click', () => {
        this.app.state.currentTagFilter = tag.id;
        sound.playTap();
        this.renderTagFilters();
        this.renderTasks();
      });
      container.appendChild(btn);
    });
  }

  renderPresets() {
    const container = document.getElementById('preset-tasks-container');
    if (!container) return;

    container.innerHTML = '';
    PRESET_TASKS.forEach(preset => {
      const btn = document.createElement('button');
      btn.className = 'preset-tag-btn';
      const tagObj = TASK_TAGS.find(t => t.id === preset.tag) || { label: '超イージー', icon: '⚡' };
      const diffObj = DIFFICULTIES[preset.difficulty] || DIFFICULTIES[1];

      btn.innerHTML = `
        <span class="preset-diff" style="color: ${diffObj.color};">${diffObj.stars}</span>
        <span class="preset-tag">${tagObj.icon}</span>
        <span class="preset-text">${preset.text}</span>
        <span class="preset-reward">+💎${diffObj.gems}</span>
      `;

      btn.addEventListener('click', () => {
        this.addTask(preset.text, preset.difficulty, preset.tag);
        sound.playTap();
        btn.classList.add('btn-pop');
        setTimeout(() => btn.classList.remove('btn-pop'), 200);
      });
      container.appendChild(btn);
    });
  }

  addTask(text, difficultyLevel = 2, tag = 'work', routineId = null, dueTimestamp = null) {
    const diffObj = DIFFICULTIES[difficultyLevel] || DIFFICULTIES[2];
    const newTask = {
      id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      text,
      difficulty: difficultyLevel,
      gems: diffObj.gems,
      coins: diffObj.coins,
      gemsMin: diffObj.gemsMin || diffObj.gems,
      gemsMax: diffObj.gemsMax || diffObj.gems,
      coinsMin: diffObj.coinsMin || diffObj.coins,
      coinsMax: diffObj.coinsMax || diffObj.coins,
      tag,
      routineId: routineId,
      dueTimestamp: dueTimestamp,
      dueReminded: false,
      pinned: false,
      completed: false,
      createdAt: Date.now()
    };

    if (!Array.isArray(this.app.state.tasks)) this.app.state.tasks = [];
    this.app.state.tasks.unshift(newTask);
    this.app.saveState();
    this.renderTasks();
    this.renderRoutineWidget();
  }

  getRoutineFreqLabel(r) {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const freq = r.freqType || 'daily';
    if (freq === 'daily') return `毎日 ${r.time || '08:00'}`;
    if (freq === 'weekdays') return `平日 ${r.time || '08:00'}`;
    if (freq === 'weekends') return `土日 ${r.time || '08:00'}`;
    if (freq === 'weekly') return `毎週(${days[r.freqDay ?? 1]}) ${r.time || '08:00'}`;
    if (freq === 'monthly') return `毎月${r.freqDay ?? 1}日 ${r.time || '08:00'}`;
    return `定期 ${r.time || '08:00'}`;
  }

  // --- Render Always-Visible Routine Chips on Main Screen ---
  renderRoutineWidget() {
    const container = document.getElementById('routine-widget-chips');
    if (!container) return;

    container.innerHTML = '';
    const routines = this.app.state.routines || [];
    if (routines.length === 0) {
      container.innerHTML = '<span style="font-size: 10px; color: var(--text-dim); padding: 4px;">登録された日課はありません。「⚙️ 設定・新規登録」から作成！</span>';
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    routines.forEach(r => {
      if (!r.enabled) return;

      const diffObj = DIFFICULTIES[r.difficulty || 3] || DIFFICULTIES[3];
      const isPending = (this.app.state.tasks || []).some(t => t.routineId === r.id && !t.completed);
      const isCompletedToday = (this.app.state.completedLog || []).some(l => {
        const logDate = new Date(l.timestamp).toISOString().split('T')[0];
        return logDate === today && l.text === r.text;
      });

      const freqLabel = this.getRoutineFreqLabel(r);
      const card = document.createElement('div');
      card.className = 'routine-chip-card';
      card.style.borderLeftColor = diffObj.color;

      let actionHtml = '';
      if (isPending) {
        actionHtml = '<span class="routine-chip-status-text routine-chip-status-active">⚡ ToDo追加済</span>';
      } else if (isCompletedToday) {
        actionHtml = '<span class="routine-chip-status-text routine-chip-status-done">✅ 本日粉砕済</span>';
      } else {
        actionHtml = '<button class="routine-chip-action-btn">+今すぐやる</button>';
      }

      card.innerHTML = `
        <div class="routine-chip-info">
          <span class="routine-chip-name">${r.text}</span>
          <span class="routine-chip-meta">
            <span style="color: ${diffObj.color}; font-weight: 900;">${diffObj.stars}</span>
            <span>${freqLabel}</span>
          </span>
        </div>
        ${actionHtml}
      `;

      const actionBtn = card.querySelector('.routine-chip-action-btn');
      if (actionBtn) {
        actionBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.addTask(r.text, r.difficulty || 3, r.tag || 'health', r.id);
          r.lastAddedDate = today;
          this.app.saveState();
          sound.playCoin();
          this.renderTasks();
          this.renderRoutineWidget();
        });
      }

      container.appendChild(card);
    });
  }

  // --- Format Due Time Badges ---
  getDueBadgeHtml(task) {
    if (!task.dueTimestamp) return '';

    const now = Date.now();
    const diffMs = task.dueTimestamp - now;
    const diffMins = Math.round(diffMs / 60000);

    if (diffMs < 0) {
      return '<span class="due-pill due-overdue">⚠️ 締切超過！</span>';
    } else if (diffMins <= 15) {
      return `<span class="due-pill due-warning">🔥 締切直前！(残${diffMins}分)</span>`;
    } else if (diffMins < 60) {
      return `<span class="due-pill">⏰ 残${diffMins}分</span>`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `<span class="due-pill">⏰ 残${hours}時間${mins > 0 ? `${mins}分` : ''}</span>`;
    }
  }

  renderTasks() {
    const list = document.getElementById('todo-list');
    const emptyNotice = document.getElementById('todo-empty');
    if (!list) return;

    list.innerHTML = '';
    let activeTasks = (this.app.state.tasks || []).filter(t => !t.completed);

    if (this.app.state.currentTagFilter && this.app.state.currentTagFilter !== 'all') {
      activeTasks = activeTasks.filter(t => t.tag === this.app.state.currentTagFilter);
    }

    // Sort: Pinned first, then overdue/urgent due tasks, then routines, then newest
    activeTasks.sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
      if (a.dueTimestamp && b.dueTimestamp) return a.dueTimestamp - b.dueTimestamp;
      if (a.dueTimestamp) return -1;
      if (b.dueTimestamp) return 1;
      if (!!a.routineId !== !!b.routineId) return a.routineId ? -1 : 1;
      return b.createdAt - a.createdAt;
    });

    if (activeTasks.length === 0) {
      if (emptyNotice) emptyNotice.style.display = 'block';
    } else {
      if (emptyNotice) emptyNotice.style.display = 'none';
      activeTasks.forEach((task) => {
        const item = document.createElement('div');
        const diffObj = DIFFICULTIES[task.difficulty || 2] || DIFFICULTIES[2];
        const tagObj = TASK_TAGS.find(t => t.id === task.tag) || { label: '一般', icon: '📝', color: '#00f3ff' };
        const isRoutine = !!task.routineId;

        item.className = `todo-item glass-panel ${task.pinned ? 'is-pinned' : ''} ${isRoutine ? 'is-routine-card' : ''}`;
        item.style.setProperty('--card-diff-color', diffObj.color);
        item.dataset.id = task.id;

        const speedMult = this.isFocusTimerActive ? 1.5 : 1;
        const gemsMin = Math.round((task.gemsMin || diffObj.gemsMin || diffObj.gems * 0.5) * speedMult);
        const gemsMax = Math.round((task.gemsMax || diffObj.gemsMax || diffObj.gems * 2) * speedMult);
        const coinsMin = Math.round((task.coinsMin || diffObj.coinsMin || diffObj.coins * 0.5) * speedMult);
        const coinsMax = Math.round((task.coinsMax || diffObj.coinsMax || diffObj.coins * 2) * speedMult);

        // Routine Badge
        let routineBadgeText = '🔄 日課';
        if (isRoutine && Array.isArray(this.app.state.routines)) {
          const rObj = this.app.state.routines.find(r => r.id === task.routineId);
          if (rObj) {
            routineBadgeText = `🔄 ${this.getRoutineFreqLabel(rObj)}`;
          }
        }

        const dueBadgeHtml = this.getDueBadgeHtml(task);

        item.innerHTML = `
          <div class="todo-left-stripe" style="background: ${diffObj.color};"></div>
          <div class="todo-item-content">
            <div class="todo-tag-row">
              <span class="task-diff-pill" style="border-color: ${diffObj.color}; color: ${diffObj.color};">
                ${diffObj.stars} ${diffObj.label}
              </span>
              <span class="task-category-pill" style="border-color: ${tagObj.color}; color: ${tagObj.color};">
                ${tagObj.icon} ${tagObj.label}
              </span>
              ${isRoutine ? `<span class="routine-pill">${routineBadgeText}</span>` : ''}
              ${dueBadgeHtml}
              ${task.pinned ? '<span class="pinned-pill">⭐ 最優先</span>' : ''}
              ${this.isFocusTimerActive ? '<span class="speed-pill">⚡ 1.5x</span>' : ''}
            </div>
            <div class="todo-title">${task.text}</div>
            <div class="todo-reward-badge">
              <span class="reward-gem">💎 <span class="reward-range">${gemsMin}〜</span>${gemsMax}</span>
              <span class="reward-coin">🪙 <span class="reward-range">${coinsMin}〜</span>${coinsMax}</span>
            </div>
          </div>
          <div class="todo-actions-wrap">
            <button class="pin-btn ${task.pinned ? 'active' : ''}" title="最優先固定">
              ${task.pinned ? '⭐' : '☆'}
            </button>
            <button class="delete-btn" title="報酬なしで削除">
              🗑️
            </button>
            <button class="crush-btn" title="タスクを粉砕！">
              <span class="crush-icon">💥</span>
              <span class="crush-text">粉砕!</span>
            </button>
          </div>
        `;

        const pinBtn = item.querySelector('.pin-btn');
        pinBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          task.pinned = !task.pinned;
          sound.playTap();
          this.app.saveState();
          this.renderTasks();
        });

        const deleteBtn = item.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`タスク「${task.text}」を削除しますか？（報酬は得られません）`)) {
            this.app.state.tasks = this.app.state.tasks.filter(t => t.id !== task.id);
            sound.playTap();
            this.app.saveState();
            this.renderTasks();
            this.renderRoutineWidget();
          }
        });

        const crushBtn = item.querySelector('.crush-btn');
        crushBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.completeTask(task, item, e);
        });

        item.addEventListener('click', (e) => {
          this.completeTask(task, item, e);
        });

        list.appendChild(item);
      });
    }
  }

  // --- Roulette Reward Roll (ルーレット報酬抽選) ---
  rollRouletteReward(task, speedMult = 1.0) {
    const diffObj = DIFFICULTIES[task.difficulty || 2] || DIFFICULTIES[2];
    const gemsMin = Math.round((task.gemsMin || diffObj.gemsMin || diffObj.gems * 0.5) * speedMult);
    const gemsMax = Math.round((task.gemsMax || diffObj.gemsMax || diffObj.gems * 2) * speedMult);
    const coinsMin = Math.round((task.coinsMin || diffObj.coinsMin || diffObj.coins * 0.5) * speedMult);
    const coinsMax = Math.round((task.coinsMax || diffObj.coinsMax || diffObj.coins * 2) * speedMult);

    const earnedGems = gemsMin + Math.floor(Math.random() * (gemsMax - gemsMin + 1));
    const earnedCoins = coinsMin + Math.floor(Math.random() * (coinsMax - coinsMin + 1));

    // Is jackpot? (top 15% of range)
    const gemsRange = gemsMax - gemsMin;
    const isJackpot = earnedGems >= gemsMin + Math.floor(gemsRange * 0.85);

    return { earnedGems, earnedCoins, gemsMin, gemsMax, coinsMin, coinsMax, isJackpot };
  }

  // --- Animated Roulette Counter Popup ---
  showRoulettePopup(element, earnedGems, earnedCoins, isJackpot, diffColor) {
    const existing = document.getElementById('reward-roulette-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'reward-roulette-popup';
    popup.className = `reward-roulette-popup ${isJackpot ? 'is-jackpot' : ''}`;
    popup.style.setProperty('--diff-color', diffColor || '#00f3ff');

    if (isJackpot) {
      popup.innerHTML = `
        <div class="roulette-jackpot-title">🎰 JACKPOT!!🎰</div>
        <div class="roulette-gems-row"><span id="roulette-gems-val">0</span> <span class="roulette-unit">💎 GEMS</span></div>
        <div class="roulette-coins-row"><span id="roulette-coins-val">0</span> <span class="roulette-unit">🪙 COINS</span></div>
      `;
    } else {
      popup.innerHTML = `
        <div class="roulette-label">🎲 報酷ルーレット！</div>
        <div class="roulette-gems-row"><span id="roulette-gems-val">0</span> <span class="roulette-unit">💎 GEMS</span></div>
        <div class="roulette-coins-row"><span id="roulette-coins-val">0</span> <span class="roulette-unit">🪙 COINS</span></div>
      `;
    }

    document.body.appendChild(popup);

    // Animate counting up (roulette-style)
    const gemsEl = document.getElementById('roulette-gems-val');
    const coinsEl = document.getElementById('roulette-coins-val');
    const duration = isJackpot ? 700 : 500;
    const fps = 30;
    const steps = Math.round(duration / (1000 / fps));
    let step = 0;

    const tickFn = () => {
      step++;
      const progress = step / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      if (gemsEl) {
        const displayGems = Math.round(easedProgress * earnedGems);
        gemsEl.textContent = displayGems;
      }
      if (coinsEl) {
        const displayCoins = Math.round(easedProgress * earnedCoins);
        coinsEl.textContent = displayCoins;
      }

      try { sound.playRouletteTick(); } catch(e) {}

      if (step < steps) {
        requestAnimationFrame(tickFn);
      } else {
        // Final value settled!
        if (gemsEl) gemsEl.textContent = earnedGems;
        if (coinsEl) coinsEl.textContent = earnedCoins;

        if (isJackpot) {
          try { sound.playJackpotHit(); } catch(e) {}
          try { fx.createRainbowConfetti(); } catch(e) {}
          try { fx.flash('rgba(255, 215, 0, 0.7)', 400); } catch(e) {}
          popup.classList.add('settled-jackpot');
        } else {
          try { sound.playCoin(); } catch(e) {}
          popup.classList.add('settled');
        }

        // Auto remove after 2.5s
        setTimeout(() => {
          popup.classList.add('fading-out');
          setTimeout(() => { if (popup.parentNode) popup.remove(); }, 500);
        }, 2000);
      }
    };

    requestAnimationFrame(tickFn);
  }

  completeTask(task, element = null, event = null) {
    if (element && element.classList.contains('shattering')) return;
    if (element) element.classList.add('shattering');

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    if (element) {
      const rect = element.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    sound.playShatter();
    fx.createShatterFX(x, y);

    const speedMult = this.isFocusTimerActive ? 1.5 : 1;
    const { earnedGems, earnedCoins, isJackpot } = this.rollRouletteReward(task, speedMult);
    const diffObj = DIFFICULTIES[task.difficulty || 2] || DIFFICULTIES[2];

    // Show roulette popup at element position
    setTimeout(() => {
      this.showRoulettePopup(element, earnedGems, earnedCoins, isJackpot, diffObj.color);
    }, 80);

    this.app.state.gems += earnedGems;
    this.app.state.coins += earnedCoins;
    this.app.state.comboCount += 1;
    this.app.state.totalCrushed = (this.app.state.totalCrushed || 0) + 1;

    const today = new Date().toISOString().split('T')[0];
    if (!this.app.state.todayStats || this.app.state.todayStats.date !== today) {
      this.app.state.todayStats = { crushed: 0, gemsEarned: 0, coinsEarned: 0, date: today };
    }
    this.app.state.todayStats.crushed += 1;
    this.app.state.todayStats.gemsEarned += earnedGems;
    this.app.state.todayStats.coinsEarned += earnedCoins;

    if (!Array.isArray(this.app.state.completedLog)) this.app.state.completedLog = [];
    this.app.state.completedLog.unshift({
      id: task.id,
      text: task.text,
      difficulty: task.difficulty || 2,
      tag: task.tag,
      gems: earnedGems,
      coins: earnedCoins,
      timestamp: Date.now()
    });

    if (this.app.state.completedLog.length > 50) {
      this.app.state.completedLog.pop();
    }

    this.app.state.tasks = this.app.state.tasks.filter(t => t.id !== task.id);
    this.app.checkAchievements();

    this.app.updateHeaderStats();
    this.updateComboUI();
    this.app.saveState();

    setTimeout(() => {
      this.renderTasks();
      this.renderRoutineWidget();
    }, 300);
  }

  // --- Due Reminder Engine ("これ終わりましたか？") ---
  checkDueReminders() {
    if (!this.app.state.tasks || !Array.isArray(this.app.state.tasks)) return;

    const now = Date.now();
    const dueTask = this.app.state.tasks.find(t => !t.completed && t.dueTimestamp && t.dueTimestamp <= now && !t.dueReminded);

    if (dueTask) {
      dueTask.dueReminded = true;
      this.app.saveState();
      this.triggerDueReminder(dueTask);
    }
  }

  triggerDueReminder(task) {
    this.activeRemindTask = task;
    sound.playRainbowFanfare();

    // 1. Show In-App Modal
    const modal = document.getElementById('due-remind-modal');
    const taskTextEl = document.getElementById('due-remind-task-text');
    const metaEl = document.getElementById('due-remind-meta');
    const rewardEl = document.getElementById('due-remind-reward');

    const diffObj = DIFFICULTIES[task.difficulty || 2] || DIFFICULTIES[2];
    const tagObj = TASK_TAGS.find(t => t.id === task.tag) || { label: '一般', icon: '📝', color: '#00f3ff' };

    if (taskTextEl) taskTextEl.textContent = task.text;
    if (metaEl) {
      metaEl.innerHTML = `
        <span class="task-diff-pill" style="border-color: ${diffObj.color}; color: ${diffObj.color};">${diffObj.stars} ${diffObj.label}</span>
        <span class="task-category-pill" style="border-color: ${tagObj.color}; color: ${tagObj.color};">${tagObj.icon} ${tagObj.label}</span>
      `;
    }
    if (rewardEl) {
      rewardEl.innerHTML = `<span class="reward-gem">💎 +${task.gems} GEMS</span> <span class="reward-coin">🪙 +${task.coins} COINS</span>`;
    }

    if (modal) modal.classList.add('active');

    // 2. Web Notification API (Browser / OS Push)
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification('⏰【DopaTodo 締切リマインド】', {
            body: `「${task.text}」の締切時間になりました！粉砕完了できましたか？💥`,
            icon: './icons/icon-192.svg'
          });
        } catch (e) {}
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }

  setupDueRemindModal() {
    const modal = document.getElementById('due-remind-modal');
    const crushBtn = document.getElementById('due-action-crush-btn');
    const snoozeBtn = document.getElementById('due-action-snooze-btn');

    if (crushBtn) {
      crushBtn.addEventListener('click', () => {
        if (!this.activeRemindTask) return;
        const task = this.activeRemindTask;
        if (modal) modal.classList.remove('active');

        // Find element on screen if present
        const el = document.querySelector(`.todo-item[data-id="${task.id}"]`);
        this.completeTask(task, el);
        this.activeRemindTask = null;
      });
    }

    if (snoozeBtn) {
      snoozeBtn.addEventListener('click', () => {
        if (!this.activeRemindTask) return;
        // Snooze 15 minutes
        this.activeRemindTask.dueTimestamp = Date.now() + 15 * 60 * 1000;
        this.activeRemindTask.dueReminded = false;
        this.app.saveState();

        sound.playTap();
        alert(`⏱️ 締切を15分延長しました！残り時間で一気に粉砕しよう！`);
        if (modal) modal.classList.remove('active');
        this.activeRemindTask = null;
        this.renderTasks();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    }
  }

  // --- Multi-Frequency Recurring Routines ---
  checkAndApplyRoutines() {
    if (!this.app.state.routines || !Array.isArray(this.app.state.routines)) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();
    const currentHourMin = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    let addedCount = 0;
    this.app.state.routines.forEach(r => {
      if (!r.enabled) return;

      const alreadyPending = (this.app.state.tasks || []).some(t => t.routineId === r.id && !t.completed);
      if (alreadyPending) return;

      if (r.lastAddedDate === today) return;
      if (currentHourMin < (r.time || '00:00')) return;

      const freq = r.freqType || 'daily';
      let isDue = false;

      if (freq === 'daily') isDue = true;
      else if (freq === 'weekdays') isDue = (dayOfWeek >= 1 && dayOfWeek <= 5);
      else if (freq === 'weekends') isDue = (dayOfWeek === 0 || dayOfWeek === 6);
      else if (freq === 'weekly') {
        const targetDay = (r.freqDay !== undefined && r.freqDay !== null) ? parseInt(r.freqDay, 10) : 1;
        isDue = (dayOfWeek === targetDay);
      } else if (freq === 'monthly') {
        const targetDate = (r.freqDay !== undefined && r.freqDay !== null) ? parseInt(r.freqDay, 10) : 1;
        isDue = (dayOfMonth === targetDate);
      }

      if (isDue) {
        this.addTask(r.text, r.difficulty || 3, r.tag || 'health', r.id);
        r.lastAddedDate = today;
        addedCount++;
      }
    });

    if (addedCount > 0) {
      this.app.saveState();
      this.renderTasks();
      this.renderRoutineWidget();
    }
  }

  setupRoutineManager() {
    const modal = document.getElementById('routine-modal');
    const closeBtn = document.getElementById('routine-modal-close-btn');
    const addRoutineBtn = document.getElementById('add-routine-btn');
    const syncBtn = document.getElementById('sync-routine-btn');
    const freqSelect = document.getElementById('routine-freq-select');
    const freqSubContainer = document.getElementById('routine-freq-sub-wrap');
    const freqSubSelect = document.getElementById('routine-freq-sub-select');

    const openRoutineModal = () => {
      if (modal) {
        modal.classList.add('active');
        try {
          this.renderRoutineList();
        } catch (err) {
          console.error('Error rendering routine list:', err);
        }
        sound.playTap();
      }
    };

    const openBtn1 = document.getElementById('open-routine-modal-btn');
    const openBtn2 = document.getElementById('open-routine-modal-btn-inline');

    if (openBtn1) openBtn1.addEventListener('click', (e) => { e.preventDefault(); openRoutineModal(); });
    if (openBtn2) openBtn2.addEventListener('click', (e) => { e.preventDefault(); openRoutineModal(); });

    document.addEventListener('click', (e) => {
      if (e.target.closest('#open-routine-modal-btn') || e.target.closest('#open-routine-modal-btn-inline')) {
        e.preventDefault();
        openRoutineModal();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (modal) modal.classList.remove('active');
        sound.playTap();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
          sound.playTap();
        }
      });
    }

    const updateFreqSubUI = () => {
      if (!freqSelect || !freqSubContainer || !freqSubSelect) return;
      const freq = freqSelect.value;

      if (freq === 'weekly') {
        freqSubContainer.style.display = 'block';
        freqSubSelect.innerHTML = `
          <option value="1">月曜日</option>
          <option value="2">火曜日</option>
          <option value="3">水曜日</option>
          <option value="4">木曜日</option>
          <option value="5">金曜日</option>
          <option value="6">土曜日</option>
          <option value="0">日曜日</option>
        `;
      } else if (freq === 'monthly') {
        freqSubContainer.style.display = 'block';
        let optionsHtml = '';
        for (let d = 1; d <= 31; d++) {
          optionsHtml += `<option value="${d}">毎月 ${d} 日</option>`;
        }
        freqSubSelect.innerHTML = optionsHtml;
      } else {
        freqSubContainer.style.display = 'none';
      }
    };

    if (freqSelect) {
      freqSelect.addEventListener('change', updateFreqSubUI);
      updateFreqSubUI();
    }

    if (syncBtn) {
      syncBtn.addEventListener('click', () => {
        this.checkAndApplyRoutines();
        sound.playRainbowFanfare();
        alert('🔄 定期ルーティンの同期チェックを行いました！');
        this.renderRoutineList();
        this.renderRoutineWidget();
      });
    }

    if (addRoutineBtn) {
      addRoutineBtn.addEventListener('click', () => {
        const textInput = document.getElementById('routine-text-input');
        const diffSelect = document.getElementById('routine-diff-select');
        const tagSelect = document.getElementById('routine-tag-select');
        const timeInput = document.getElementById('routine-time-input');

        const text = textInput ? textInput.value.trim() : '';
        if (!text) {
          alert('日課の名前を入力してください。');
          return;
        }

        const freq = freqSelect ? freqSelect.value : 'daily';
        let freqDay = 0;
        if (freq === 'weekly' || freq === 'monthly') {
          freqDay = freqSubSelect ? parseInt(freqSubSelect.value, 10) : 1;
        }

        const newRoutine = {
          id: 'r_' + Date.now(),
          text,
          difficulty: diffSelect ? parseInt(diffSelect.value, 10) : 3,
          tag: tagSelect ? tagSelect.value : 'health',
          freqType: freq,
          freqDay: freqDay,
          time: (timeInput && timeInput.value) ? timeInput.value : '08:00',
          enabled: true,
          lastAddedDate: ''
        };

        if (!Array.isArray(this.app.state.routines)) this.app.state.routines = [];
        this.app.state.routines.push(newRoutine);
        this.app.saveState();
        if (textInput) textInput.value = '';
        sound.playCoin();
        this.renderRoutineList();
        this.renderRoutineWidget();
        this.checkAndApplyRoutines();
      });
    }
  }

  renderRoutineList() {
    const container = document.getElementById('routine-items-list');
    if (!container) return;

    container.innerHTML = '';
    if (!this.app.state.routines || !Array.isArray(this.app.state.routines) || this.app.state.routines.length === 0) {
      container.innerHTML = '<div class="empty-log-msg">定期日課が登録されていません。「+ 登録」から新しい日課を作成しよう！</div>';
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    this.app.state.routines.forEach(r => {
      const diffObj = DIFFICULTIES[r.difficulty || 3] || DIFFICULTIES[3];
      const tagObj = TASK_TAGS.find(t => t.id === r.tag) || { label: '一般', icon: '📝' };
      const freqLabel = this.getRoutineFreqLabel(r);

      const isPending = (this.app.state.tasks || []).some(t => t.routineId === r.id && !t.completed);
      let statusHtml = '';
      if (!r.enabled) {
        statusHtml = '<span class="routine-status-pill status-disabled">停止中</span>';
      } else if (isPending) {
        statusHtml = '<span class="routine-status-pill status-pending">⚠️ 未完了タスクあり（二重追加防止中）</span>';
      } else if (r.lastAddedDate === today) {
        statusHtml = '<span class="routine-status-pill status-added">✅ 本日追加済み</span>';
      } else {
        statusHtml = `<span class="routine-status-pill status-ready">⏰ ${freqLabel} 予定</span>`;
      }

      const item = document.createElement('div');
      item.className = `routine-item glass-panel ${!r.enabled ? 'is-disabled' : ''}`;

      item.innerHTML = `
        <div class="routine-item-info">
          <div class="routine-meta-row">
            <span class="task-diff-pill" style="border-color: ${diffObj.color}; color: ${diffObj.color};">
              ${diffObj.stars} ${diffObj.label}
            </span>
            <span class="task-category-pill">${tagObj.icon} ${tagObj.label}</span>
            <span class="routine-time-tag">🔄 ${freqLabel}</span>
            ${statusHtml}
          </div>
          <div class="routine-title">${r.text}</div>
        </div>
        <div class="routine-actions">
          <label class="switch" title="有効/無効">
            <input type="checkbox" class="routine-toggle" ${r.enabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
          <button class="delete-btn routine-del-btn" title="日課を削除">🗑️</button>
        </div>
      `;

      const toggle = item.querySelector('.routine-toggle');
      if (toggle) {
        toggle.addEventListener('change', (e) => {
          r.enabled = e.target.checked;
          sound.playTap();
          this.app.saveState();
          this.renderRoutineList();
          this.renderRoutineWidget();
        });
      }

      const delBtn = item.querySelector('.routine-del-btn');
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          if (confirm(`日課「${r.text}」を削除しますか？`)) {
            this.app.state.routines = this.app.state.routines.filter(itemR => itemR.id !== r.id);
            sound.playTap();
            this.app.saveState();
            this.renderRoutineList();
            this.renderRoutineWidget();
          }
        });
      }

      container.appendChild(item);
    });
  }

  // --- Combo & Stats UI ---
  updateComboUI() {
    const comboEl = document.getElementById('combo-display');
    if (comboEl) {
      comboEl.textContent = `${this.app.state.comboCount || 0} COMBO`;
      if ((this.app.state.comboCount || 0) > 0) {
        comboEl.classList.add('combo-bounce');
        setTimeout(() => comboEl.classList.remove('combo-bounce'), 200);
      }
    }
  }

  setupFocusTimerUI() {
    const timerBtns = document.querySelectorAll('.focus-timer-preset-btn');
    const stopBtn = document.getElementById('focus-timer-stop-btn');

    timerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const minutes = parseInt(btn.dataset.min, 10);
        this.startFocusTimer(minutes);
        sound.playTap();
      });
    });

    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        this.stopFocusTimer();
        sound.playTap();
      });
    }
  }

  startFocusTimer(minutes) {
    this.stopFocusTimer();
    this.isFocusTimerActive = true;
    this.focusTimeRemaining = minutes * 60;

    const bar = document.getElementById('focus-timer-active-bar');
    if (bar) bar.style.display = 'flex';

    this.updateFocusTimerDisplay();
    this.renderTasks();

    this.focusTimerInterval = setInterval(() => {
      this.focusTimeRemaining--;
      this.updateFocusTimerDisplay();

      if (this.focusTimeRemaining <= 0) {
        this.stopFocusTimer();
        sound.playRainbowFanfare();
        alert('⏱️ 集中タイムアタック終了！お疲れ様でした！');
      }
    }, 1000);
  }

  stopFocusTimer() {
    if (this.focusTimerInterval) {
      clearInterval(this.focusTimerInterval);
      this.focusTimerInterval = null;
    }
    this.isFocusTimerActive = false;
    const bar = document.getElementById('focus-timer-active-bar');
    if (bar) bar.style.display = 'none';
    this.renderTasks();
  }

  updateFocusTimerDisplay() {
    const text = document.getElementById('focus-timer-clock');
    if (!text) return;
    const m = Math.floor(this.focusTimeRemaining / 60);
    const s = this.focusTimeRemaining % 60;
    text.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // =====================================================
  // SUB-TAB NAVIGATION SYSTEM (いま粉砕 / 定期日課 / 討伐履歴)
  // =====================================================
  setupSubtabs() {
    const subtabBtns = document.querySelectorAll('.todo-subtab-btn');
    const panes = document.querySelectorAll('.todo-subtab-pane');

    const switchSubtab = (targetTab) => {
      subtabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.subtab === targetTab);
      });
      panes.forEach(pane => {
        pane.classList.toggle('active', pane.id === `todo-pane-${targetTab}`);
      });

      if (targetTab === 'routines') {
        this.renderSubtabRoutineList();
      } else if (targetTab === 'history') {
        this.renderSubtabHistoryList();
      } else if (targetTab === 'tasks') {
        this.renderTasks();
      }
    };

    subtabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.subtab;
        switchSubtab(tab);
        sound.playTap();
      });
    });

    // Subtab Routine Add Form logic
    const addBtn = document.getElementById('subtab-add-routine-btn');
    const syncBtn = document.getElementById('subtab-sync-routine-btn');
    const freqSelect = document.getElementById('subtab-routine-freq-select');
    const freqSubContainer = document.getElementById('subtab-routine-freq-sub-wrap');
    const freqSubSelect = document.getElementById('subtab-routine-freq-sub-select');

    const updateSubtabFreqUI = () => {
      if (!freqSelect || !freqSubContainer || !freqSubSelect) return;
      const freq = freqSelect.value;
      if (freq === 'weekly') {
        freqSubContainer.style.display = 'block';
        freqSubSelect.innerHTML = `
          <option value="1">月曜日</option>
          <option value="2">火曜日</option>
          <option value="3">水曜日</option>
          <option value="4">木曜日</option>
          <option value="5">金曜日</option>
          <option value="6">土曜日</option>
          <option value="0">日曜日</option>
        `;
      } else if (freq === 'monthly') {
        freqSubContainer.style.display = 'block';
        let optionsHtml = '';
        for (let d = 1; d <= 31; d++) {
          optionsHtml += `<option value="${d}">毎月 ${d} 日</option>`;
        }
        freqSubSelect.innerHTML = optionsHtml;
      } else {
        freqSubContainer.style.display = 'none';
      }
    };

    if (freqSelect) {
      freqSelect.addEventListener('change', updateSubtabFreqUI);
      updateSubtabFreqUI();
    }

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const textInput = document.getElementById('subtab-routine-text-input');
        const diffSelect = document.getElementById('subtab-routine-diff-select');
        const tagSelect = document.getElementById('subtab-routine-tag-select');
        const timeInput = document.getElementById('subtab-routine-time-input');

        const text = textInput ? textInput.value.trim() : '';
        if (!text) {
          alert('日課の名前を入力してください。');
          return;
        }

        const freq = freqSelect ? freqSelect.value : 'daily';
        let freqDay = 0;
        if (freq === 'weekly' || freq === 'monthly') {
          freqDay = freqSubSelect ? parseInt(freqSubSelect.value, 10) : 1;
        }

        const newRoutine = {
          id: 'r_' + Date.now(),
          text,
          difficulty: diffSelect ? parseInt(diffSelect.value, 10) : 3,
          tag: tagSelect ? tagSelect.value : 'health',
          freqType: freq,
          freqDay: freqDay,
          time: (timeInput && timeInput.value) ? timeInput.value : '08:00',
          enabled: true,
          lastAddedDate: ''
        };

        if (!Array.isArray(this.app.state.routines)) this.app.state.routines = [];
        this.app.state.routines.push(newRoutine);
        this.app.saveState();
        if (textInput) textInput.value = '';
        sound.playCoin();
        this.renderSubtabRoutineList();
        this.checkAndApplyRoutines();
      });
    }

    if (syncBtn) {
      syncBtn.addEventListener('click', () => {
        this.checkAndApplyRoutines();
        sound.playRainbowFanfare();
        alert('🔄 定期ルーティンの同期チェックを行いました！');
        this.renderSubtabRoutineList();
      });
    }
  }

  // --- Render Routines in Subtab ---
  renderSubtabRoutineList() {
    const container = document.getElementById('subtab-routine-items-list');
    if (!container) return;

    container.innerHTML = '';
    const routines = this.app.state.routines || [];
    if (routines.length === 0) {
      container.innerHTML = '<div class="empty-log-msg">定期日課が登録されていません。上のフォームから新しい日課を登録しよう！</div>';
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    routines.forEach(r => {
      const diffObj = DIFFICULTIES[r.difficulty || 3] || DIFFICULTIES[3];
      const tagObj = TASK_TAGS.find(t => t.id === r.tag) || { label: '一般', icon: '📝' };
      const freqLabel = this.getRoutineFreqLabel(r);

      const isPending = (this.app.state.tasks || []).some(t => t.routineId === r.id && !t.completed);
      let statusHtml = '';
      if (!r.enabled) {
        statusHtml = '<span class="routine-status-pill status-disabled">停止中</span>';
      } else if (isPending) {
        statusHtml = '<span class="routine-status-pill status-pending">⚡ ToDo追加済</span>';
      } else if (r.lastAddedDate === today) {
        statusHtml = '<span class="routine-status-pill status-added">✅ 本日追加済み</span>';
      } else {
        statusHtml = `<span class="routine-status-pill status-ready">⏰ ${freqLabel} 予定</span>`;
      }

      const item = document.createElement('div');
      item.className = `routine-item glass-panel ${!r.enabled ? 'is-disabled' : ''}`;

      item.innerHTML = `
        <div class="routine-item-info">
          <div class="routine-meta-row">
            <span class="task-diff-pill" style="border-color: ${diffObj.color}; color: ${diffObj.color};">
              ${diffObj.stars} ${diffObj.label}
            </span>
            <span class="task-category-pill">${tagObj.icon} ${tagObj.label}</span>
            <span class="routine-time-tag">🔄 ${freqLabel}</span>
            ${statusHtml}
          </div>
          <div class="routine-title">${r.text}</div>
        </div>
        <div class="routine-actions">
          ${!isPending && r.enabled ? '<button class="routine-chip-action-btn subtab-summon-btn" style="margin-right: 4px;">+今すぐやる</button>' : ''}
          <label class="switch" title="有効/無効">
            <input type="checkbox" class="routine-toggle" ${r.enabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
          <button class="delete-btn routine-del-btn" title="日課を削除">🗑️</button>
        </div>
      `;

      const summonBtn = item.querySelector('.subtab-summon-btn');
      if (summonBtn) {
        summonBtn.addEventListener('click', () => {
          this.addTask(r.text, r.difficulty || 3, r.tag || 'health', r.id);
          r.lastAddedDate = today;
          this.app.saveState();
          sound.playCoin();
          this.renderSubtabRoutineList();
          alert(`⚡ タスク「${r.text}」をToDoに追加しました！「いま粉砕」タブで粉砕しよう！`);
        });
      }

      const toggle = item.querySelector('.routine-toggle');
      if (toggle) {
        toggle.addEventListener('change', (e) => {
          r.enabled = e.target.checked;
          sound.playTap();
          this.app.saveState();
          this.renderSubtabRoutineList();
        });
      }

      const delBtn = item.querySelector('.routine-del-btn');
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          if (confirm(`日課「${r.text}」を削除しますか？`)) {
            this.app.state.routines = this.app.state.routines.filter(itemR => itemR.id !== r.id);
            sound.playTap();
            this.app.saveState();
            this.renderSubtabRoutineList();
          }
        });
      }

      container.appendChild(item);
    });
  }

  // --- Render History in Subtab ---
  renderSubtabHistoryList() {
    const countEl = document.getElementById('subtab-log-today-count');
    const gemsEl = document.getElementById('subtab-log-today-gems');
    const coinsEl = document.getElementById('subtab-log-today-coins');
    const listEl = document.getElementById('subtab-log-items-list');

    const today = new Date().toISOString().split('T')[0];
    if (!this.app.state.todayStats || this.app.state.todayStats.date !== today) {
      this.app.state.todayStats = { crushed: 0, gemsEarned: 0, coinsEarned: 0, date: today };
    }

    if (countEl) countEl.textContent = `${this.app.state.todayStats.crushed} 個`;
    if (gemsEl) gemsEl.textContent = `💎 +${this.app.formatNumber(this.app.state.todayStats.gemsEarned)}`;
    if (coinsEl) coinsEl.textContent = `🪙 +${this.app.formatNumber(this.app.state.todayStats.coinsEarned)}`;

    if (listEl) {
      listEl.innerHTML = '';
      if (!this.app.state.completedLog || this.app.state.completedLog.length === 0) {
        listEl.innerHTML = '<div class="empty-log-msg">まだ粉砕されたタスクはありません。タスクを粉砕して脳汁を出そう！</div>';
      } else {
        this.app.state.completedLog.forEach(item => {
          const row = document.createElement('div');
          row.className = 'log-item-row glass-panel';
          const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const diffObj = DIFFICULTIES[item.difficulty || 2] || DIFFICULTIES[2];

          row.innerHTML = `
            <div class="log-item-title-col">
              <span class="log-item-time">${timeStr}</span>
              <span class="task-diff-pill" style="font-size: 8px; border-color: ${diffObj.color}; color: ${diffObj.color};">${diffObj.stars}</span>
              <span class="log-item-text">${item.text}</span>
            </div>
            <div class="log-item-rewards">
              <span class="reward-gem">💎+${item.gems}</span>
              <span class="reward-coin">🪙+${item.coins}</span>
            </div>
          `;
          listEl.appendChild(row);
        });
      }
    }
  }
}
