// js/app.js - Main Application Orchestrator (Robust & Safe)
import { INITIAL_STATE, ACHIEVEMENTS, WEAPONS } from './data.js';
import { sound } from './sound.js';
import { fx } from './fx.js';
import { TodoManager } from './todo.js';
import { GachaManager } from './gacha.js';
import { BattleManager } from './battle.js';

class DopaTodoApp {
  constructor() {
    this.currentSlot = parseInt(localStorage.getItem('dopatodo_active_slot') || '1', 10);
    this.storageKey = `dopatodo_save_slot_${this.currentSlot}`;
    this.state = this.loadState();

    this.todo = new TodoManager(this);
    this.gacha = new GachaManager(this);
    this.battle = new BattleManager(this);
    this.deferredPrompt = null;
  }

  loadState() {
    let state = JSON.parse(JSON.stringify(INITIAL_STATE));
    try {
      const saved = localStorage.getItem(this.storageKey) || localStorage.getItem('dopatodo_save_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        state = {
          ...state,
          ...parsed,
          activeSlot: this.currentSlot,
          weaponLevels: { ...INITIAL_STATE.weaponLevels, ...(parsed.weaponLevels || {}) },
          weaponDuplicates: { ...INITIAL_STATE.weaponDuplicates, ...(parsed.weaponDuplicates || {}) },
          achievementsClaimed: { ...INITIAL_STATE.achievementsClaimed, ...(parsed.achievementsClaimed || {}) },
          todayStats: { ...INITIAL_STATE.todayStats, ...(parsed.todayStats || {}) },
          routines: Array.isArray(parsed.routines) && parsed.routines.length > 0 ? parsed.routines : INITIAL_STATE.routines,
          inventory: Array.isArray(parsed.inventory) && parsed.inventory.length > 0 ? parsed.inventory : INITIAL_STATE.inventory,
          tasks: Array.isArray(parsed.tasks) ? parsed.tasks : INITIAL_STATE.tasks
        };
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
    }
    return state;
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      localStorage.setItem('dopatodo_active_slot', this.currentSlot.toString());
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }

  init() {
    // 1. Init Visual FX Canvas
    const canvas = document.getElementById('fx-canvas');
    if (canvas) fx.init(canvas);

    // 2. Setup Global Controls & Modals
    this.setupGlobalControls();
    this.setupTabs();
    this.setupKeyboardShortcuts();
    this.setupPWA();
    this.setupSettingsModal();
    this.setupAchievementsUI();

    // 3. Init Submodules
    this.todo.init();
    this.gacha.init();
    this.battle.init();

    // 4. Update Header UI
    this.updateHeaderStats();

    // 5. Sound & Haptics initial state
    sound.soundEnabled = this.state.soundEnabled;
    sound.hapticsEnabled = this.state.hapticsEnabled;

    // 6. Global first interaction sound unlock
    const unlockSound = () => {
      sound.init();
      window.removeEventListener('click', unlockSound);
      window.removeEventListener('keydown', unlockSound);
      window.removeEventListener('touchstart', unlockSound);
    };
    window.addEventListener('click', unlockSound);
    window.addEventListener('keydown', unlockSound);
    window.addEventListener('touchstart', unlockSound);
  }

  setupPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
          console.log('SW registration failed:', err);
        });
      });
    }

    const installBanner = document.getElementById('pwa-install-banner');
    const installBtn = document.getElementById('pwa-install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      if (installBanner) installBanner.style.display = 'flex';
    });

    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (this.deferredPrompt) {
          this.deferredPrompt.prompt();
          const { outcome } = await this.deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            if (installBanner) installBanner.style.display = 'none';
          }
          this.deferredPrompt = null;
        }
      });
    }
  }

  setupGlobalControls() {
    const soundBtn = document.getElementById('sound-toggle-btn');
    const bgmBtn = document.getElementById('bgm-toggle-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const achBtn = document.getElementById('achievements-btn');

    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        this.state.soundEnabled = !this.state.soundEnabled;
        sound.soundEnabled = this.state.soundEnabled;
        soundBtn.textContent = this.state.soundEnabled ? '🔊 SE: ON' : '🔇 SE: OFF';
        soundBtn.classList.toggle('active', this.state.soundEnabled);
        if (this.state.soundEnabled) sound.playTap();
        this.saveState();
      });
    }

    if (bgmBtn) {
      bgmBtn.addEventListener('click', () => {
        const isBgm = sound.toggleBgm();
        this.state.bgmEnabled = isBgm;
        bgmBtn.textContent = isBgm ? '🎵 BGM: ON' : '🎵 BGM: OFF';
        bgmBtn.classList.toggle('active', isBgm);
        this.saveState();
      });
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.openSettingsModal();
        sound.playTap();
      });
    }

    if (achBtn) {
      achBtn.addEventListener('click', () => {
        this.openAchievementsModal();
        sound.playTap();
      });
    }
  }

  setupTabs() {
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    const sections = document.querySelectorAll('.app-section');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        sound.playTap();

        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        sections.forEach(sec => {
          if (sec.id === `section-${targetTab}`) {
            sec.classList.add('active');
          } else {
            sec.classList.remove('active');
          }
        });

        // Instantly reset any residual screen shake transform
        const appEl = document.getElementById('app');
        if (appEl) appEl.style.transform = 'translate(0px, 0px)';
      });
    });
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (this.battle) this.battle.attack(2.0, null, true);
      } else if (e.key === '1') {
        this.switchTab('todo');
      } else if (e.key === '2') {
        this.switchTab('battle');
      } else if (e.key === '3') {
        this.switchTab('gacha');
      }
    });
  }

  switchTab(tabId) {
    const btn = document.querySelector(`.nav-tab-btn[data-tab="${tabId}"]`);
    if (btn) btn.click();
  }

  updateHeaderStats() {
    const gemEl = document.getElementById('header-gems');
    const coinEl = document.getElementById('header-coins');
    const slotEl = document.getElementById('header-slot-badge');

    if (gemEl) gemEl.textContent = this.formatNumber(this.state.gems);
    if (coinEl) coinEl.textContent = this.formatNumber(this.state.coins);
    if (slotEl) slotEl.textContent = `Slot ${this.currentSlot}`;
  }

  // --- Settings & Save Slot / Data Transfer ---
  setupSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('settings-modal-close-btn');
    const slotSelect = document.getElementById('slot-select');
    const exportBtn = document.getElementById('export-data-btn');
    const importBtn = document.getElementById('import-data-btn');
    const resetBtn = document.getElementById('reset-slot-btn');
    const hapticsToggle = document.getElementById('haptics-toggle');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        sound.playTap();
      });
    }

    if (slotSelect) {
      slotSelect.value = this.currentSlot.toString();
      slotSelect.addEventListener('change', (e) => {
        const newSlot = parseInt(e.target.value, 10);
        this.currentSlot = newSlot;
        localStorage.setItem('dopatodo_active_slot', newSlot.toString());
        sound.playTap();
        location.reload();
      });
    }

    if (hapticsToggle) {
      hapticsToggle.checked = this.state.hapticsEnabled;
      hapticsToggle.addEventListener('change', (e) => {
        this.state.hapticsEnabled = e.target.checked;
        sound.hapticsEnabled = this.state.hapticsEnabled;
        this.saveState();
        if (this.state.hapticsEnabled) sound.vibrateLight();
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const dataStr = btoa(unescape(encodeURIComponent(JSON.stringify(this.state))));
        navigator.clipboard.writeText(dataStr).then(() => {
          sound.playCoin();
          alert('📋 引き継ぎコードをクリップボードにコピーしました！\n別のスマホやPCで「引き継ぎコード読み込み」に貼り付けて復元できます。');
        }).catch(() => {
          prompt('以下のコードをコピーしてください:', dataStr);
        });
      });
    }

    if (importBtn) {
      importBtn.addEventListener('click', () => {
        const code = prompt('引き継ぎコードを貼り付けてください:');
        if (!code) return;
        try {
          const decoded = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
          if (decoded && decoded.gems !== undefined) {
            localStorage.setItem(this.storageKey, JSON.stringify(decoded));
            sound.playRainbowFanfare();
            alert('🎉 データの復元に成功しました！再読み込みします。');
            location.reload();
          } else {
            throw new Error('Invalid format');
          }
        } catch (err) {
          alert('❌ 無効な引き継ぎコードです。コードを確認してください。');
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm(`【警告】現在のスロット ${this.currentSlot} のデータを完全初期化しますか？`)) {
          localStorage.removeItem(this.storageKey);
          location.reload();
        }
      });
    }
  }

  openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('active');
  }

  // --- Achievements System ---
  setupAchievementsUI() {
    const modal = document.getElementById('achievements-modal');
    const closeBtn = document.getElementById('achievements-modal-close-btn');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        sound.playTap();
      });
    }
  }

  openAchievementsModal() {
    const modal = document.getElementById('achievements-modal');
    const list = document.getElementById('achievements-list');
    if (!modal || !list) return;

    list.innerHTML = '';
    ACHIEVEMENTS.forEach(ach => {
      const isClaimed = !!(this.state.achievementsClaimed && this.state.achievementsClaimed[ach.id]);
      const isComplete = this.isAchievementCompleted(ach);

      const item = document.createElement('div');
      item.className = `achievement-item glass-panel ${isClaimed ? 'is-claimed' : (isComplete ? 'is-complete' : '')}`;

      item.innerHTML = `
        <div class="ach-icon">${isClaimed ? '✅' : (isComplete ? '🎁' : '🔒')}</div>
        <div class="ach-info">
          <div class="ach-title">${ach.title}</div>
          <div class="ach-desc">${ach.desc}</div>
        </div>
        <div class="ach-reward-action">
          <span class="ach-reward-badge">💎 +${ach.rewardGems}</span>
          ${isComplete && !isClaimed ? `<button class="claim-btn">受取</button>` : ''}
          ${isClaimed ? `<span class="claimed-text">達成済</span>` : ''}
        </div>
      `;

      if (isComplete && !isClaimed) {
        const claimBtn = item.querySelector('.claim-btn');
        claimBtn.addEventListener('click', () => {
          if (!this.state.achievementsClaimed) this.state.achievementsClaimed = {};
          this.state.achievementsClaimed[ach.id] = true;
          this.state.gems += ach.rewardGems;
          sound.playRainbowFanfare();
          fx.createRainbowConfetti();
          this.updateHeaderStats();
          this.saveState();
          this.openAchievementsModal();
        });
      }

      list.appendChild(item);
    });

    modal.classList.add('active');
  }

  isAchievementCompleted(ach) {
    if (!this.state) return false;
    if (ach.reqType === 'crushed') return (this.state.totalCrushed || 0) >= ach.reqValue;
    if (ach.reqType === 'gacha') return (this.state.totalGachaPulls || 0) >= ach.reqValue;
    if (ach.reqType === 'defeated') return (this.state.totalDefeated || 0) >= ach.reqValue;
    if (ach.reqType === 'upgraded') return (this.state.totalUpgrades || 0) >= ach.reqValue;
    if (ach.reqType === 'has_ssr') {
      return (this.state.inventory || []).some(id => {
        const w = WEAPONS.find(item => item.id === id);
        return w && (w.rarity === 'SSR' || w.rarity === 'UR');
      });
    }
    if (ach.reqType === 'has_ur') {
      return (this.state.inventory || []).some(id => {
        const w = WEAPONS.find(item => item.id === id);
        return w && w.rarity === 'UR';
      });
    }
    return false;
  }

  checkAchievements() {
    let newCompleted = false;
    ACHIEVEMENTS.forEach(ach => {
      const isClaimed = !!(this.state.achievementsClaimed && this.state.achievementsClaimed[ach.id]);
      if (!isClaimed && this.isAchievementCompleted(ach)) {
        newCompleted = true;
      }
    });

    const badge = document.getElementById('ach-notification-dot');
    if (badge) badge.style.display = newCompleted ? 'block' : 'none';
  }

  formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    if (num < 1000) return num.toLocaleString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(2) + 'M';
    if (num < 1000000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num < 1000000000000000) return (num / 1000000000000).toFixed(2) + 'T';
    return (num / 1000000000000000).toFixed(2) + ' QUAD';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new DopaTodoApp();
  window.app = app;
  app.init();
});
