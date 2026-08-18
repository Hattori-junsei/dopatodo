// js/todo.js - Multi-Frequency Routines, Always-Visible Routine Widget, 5-Star Difficulty & Dopamine Tasks
import { sound } from './sound.js';
import { fx } from './fx.js';
import { PRESET_TASKS, TASK_TAGS, DIFFICULTIES } from './data.js';

export class TodoManager {
  constructor(app) {
    this.app = app;
    this.feverTimer = null;
    this.focusTimerInterval = null;
    this.focusTimeRemaining = 0;
    this.isFocusTimerActive = false;
    this.selectedDifficulty = 2; // Default 2-star
    this.routineCheckInterval = null;
  }

  init() {
    this.renderDifficultySelector();
    this.renderTagFilters();
    this.renderPresets();
    this.renderTasks();
    this.renderRoutineWidget();
    this.setupEventListeners();
    this.updateComboUI();
    this.setupFocusTimerUI();
    this.setupRoutineManager();

    // Auto-check routines on startup
    this.checkAndApplyRoutines();
    if (this.routineCheckInterval) clearInterval(this.routineCheckInterval);
    this.routineCheckInterval = setInterval(() => this.checkAndApplyRoutines(), 60000);
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

    const handleAdd = () => {
      const text = input.value.trim();
      if (!text) return;
      const tag = tagSelect ? tagSelect.value : 'work';
      const diff = diffSelect ? parseInt(diffSelect.value, 10) : this.selectedDifficulty;
      this.addTask(text, diff, tag);
      input.value = '';
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

  addTask(text, difficultyLevel = 2, tag = 'work', routineId = null) {
    const diffObj = DIFFICULTIES[difficultyLevel] || DIFFICULTIES[2];
    const newTask = {
      id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      text,
      difficulty: difficultyLevel,
      gems: diffObj.gems,
      coins: diffObj.coins,
      tag,
      routineId: routineId,
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

  renderTasks() {
    const list = document.getElementById('todo-list');
    const emptyNotice = document.getElementById('todo-empty');
    if (!list) return;

    list.innerHTML = '';
    let activeTasks = (this.app.state.tasks || []).filter(t => !t.completed);

    if (this.app.state.currentTagFilter && this.app.state.currentTagFilter !== 'all') {
      activeTasks = activeTasks.filter(t => t.tag === this.app.state.currentTagFilter);
    }

    // Sort: Pinned first, then routines, then normal
    activeTasks.sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
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

        const mult = (this.app.state.isFever ? 2 : 1) * (this.isFocusTimerActive ? 1.5 : 1);
        const displayGems = Math.round(task.gems * mult);
        const displayCoins = Math.round(task.coins * mult);

        // Find routine info if available
        let routineBadgeText = '🔄 日課';
        if (isRoutine && Array.isArray(this.app.state.routines)) {
          const rObj = this.app.state.routines.find(r => r.id === task.routineId);
          if (rObj) {
            routineBadgeText = `🔄 ${this.getRoutineFreqLabel(rObj)}`;
          }
        }

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
              ${task.pinned ? '<span class="pinned-pill">⭐ 最優先</span>' : ''}
              ${this.isFocusTimerActive ? '<span class="speed-pill">⚡ 1.5x</span>' : ''}
            </div>
            <div class="todo-title">${task.text}</div>
            <div class="todo-reward-badge">
              <span class="reward-gem">💎 +${displayGems}</span>
              <span class="reward-coin">🪙 +${displayCoins}</span>
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

  completeTask(task, element, event) {
    if (element.classList.contains('shattering')) return;
    element.classList.add('shattering');

    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    sound.playShatter();
    fx.createShatterFX(x, y);
    fx.screenShake(12, 250);

    const mult = (this.app.state.isFever ? 2 : 1) * (this.isFocusTimerActive ? 1.5 : 1);
    const earnedGems = Math.round(task.gems * mult);
    const earnedCoins = Math.round(task.coins * mult);

    setTimeout(() => {
      sound.playCoin();
    }, 120);

    this.app.state.gems += earnedGems;
    this.app.state.coins += earnedCoins;
    this.app.state.comboCount += 1;
    this.app.state.totalCrushed = (this.app.state.totalCrushed || 0) + 1;
    this.app.state.feverGauge = Math.min(100, this.app.state.feverGauge + 25);

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

    if (this.app.state.feverGauge >= 100 && !this.app.state.isFever) {
      this.triggerFever();
    }

    this.app.updateHeaderStats();
    this.updateComboUI();
    this.app.saveState();

    setTimeout(() => {
      this.renderTasks();
      this.renderRoutineWidget();
    }, 300);
  }

  // --- Multi-Frequency Recurring Routines (Daily, Weekdays, Weekends, Weekly, Monthly) ---
  checkAndApplyRoutines() {
    if (!this.app.state.routines || !Array.isArray(this.app.state.routines)) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const dayOfWeek = now.getDay(); // 0:Sun, 1:Mon, ..., 6:Sat
    const dayOfMonth = now.getDate(); // 1-31
    const currentHourMin = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    let addedCount = 0;
    this.app.state.routines.forEach(r => {
      if (!r.enabled) return;

      // Duplicate prevention rule: If active uncompleted task with this routineId exists, DO NOT duplicate!
      const alreadyPending = (this.app.state.tasks || []).some(t => t.routineId === r.id && !t.completed);
      if (alreadyPending) {
        return;
      }

      // Check if already added today
      if (r.lastAddedDate === today) return;

      // Check scheduled time
      if (currentHourMin < (r.time || '00:00')) return;

      // Check frequency condition
      const freq = r.freqType || 'daily';
      let isDue = false;

      if (freq === 'daily') {
        isDue = true;
      } else if (freq === 'weekdays') {
        isDue = (dayOfWeek >= 1 && dayOfWeek <= 5);
      } else if (freq === 'weekends') {
        isDue = (dayOfWeek === 0 || dayOfWeek === 6);
      } else if (freq === 'weekly') {
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

    // Safe Open Routine Modal Helper
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

    // Bind by both IDs and global click delegation
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

    // Dynamic frequency sub-selector (Weekday vs Day-of-month)
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

      // Status check
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

  // --- Fever Mode & Focus Timer ---
  triggerFever() {
    this.app.state.isFever = true;
    this.app.state.feverTimeLeft = 20;
    sound.playFever();
    fx.flash('rgba(255, 0, 127, 0.4)', 400);
    fx.createRainbowConfetti();

    const feverBanner = document.getElementById('fever-banner');
    if (feverBanner) feverBanner.classList.add('active');
    document.body.classList.add('fever-active');

    if (this.feverTimer) clearInterval(this.feverTimer);
    this.feverTimer = setInterval(() => {
      this.app.state.feverTimeLeft--;
      this.updateComboUI();

      if (this.app.state.feverTimeLeft <= 0) {
        clearInterval(this.feverTimer);
        this.feverTimer = null;
        this.app.state.isFever = false;
        this.app.state.feverGauge = 0;
        document.body.classList.remove('fever-active');
        if (feverBanner) feverBanner.classList.remove('active');
        this.updateComboUI();
        this.renderTasks();
      }
    }, 1000);
  }

  updateComboUI() {
    const comboEl = document.getElementById('combo-display');
    const gaugeFill = document.getElementById('fever-gauge-fill');
    const feverTimeEl = document.getElementById('fever-time-display');

    if (comboEl) {
      comboEl.textContent = `${this.app.state.comboCount} COMBO`;
      if (this.app.state.comboCount > 0) {
        comboEl.classList.add('combo-bounce');
        setTimeout(() => comboEl.classList.remove('combo-bounce'), 200);
      }
    }

    if (gaugeFill) {
      gaugeFill.style.width = `${this.app.state.feverGauge}%`;
    }

    if (feverTimeEl) {
      if (this.app.state.isFever) {
        feverTimeEl.style.display = 'inline-block';
        feverTimeEl.textContent = `🔥 FEVER TIME! 残り ${this.app.state.feverTimeLeft}s (報酬2倍)`;
      } else {
        feverTimeEl.style.display = 'none';
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

  openLogModal() {
    const modal = document.getElementById('log-modal');
    const countEl = document.getElementById('log-today-count');
    const gemsEl = document.getElementById('log-today-gems');
    const coinsEl = document.getElementById('log-today-coins');
    const listEl = document.getElementById('log-items-list');

    if (!modal) return;

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
          row.className = 'log-item-row';
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

    modal.classList.add('active');
  }
}
