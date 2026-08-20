// js/app.js - Main Application Orchestrator & State Manager (With Live Update System)
import { sound } from './sound.js';
import { fx } from './fx.js';
import { INITIAL_STATE, ACHIEVEMENTS, WEAPONS, APP_VERSION, RELEASE_NOTES } from './data.js';
import { TodoManager } from './todo.js';
import { GachaManager } from './gacha.js';
import { BattleManager } from './battle.js';

class DopaTodoApp {
  constructor() {
    this.state = this.loadState();
    this.todo = new TodoManager(this);
    this.gacha = new GachaManager(this);
    this.battle = new BattleManager(this);
    this.deferredPrompt = null;
    this.swRegistration = null;
  }

  loadState() {
    const saved = localStorage.getItem('dopatodo_save_slot_1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Deep merge with INITIAL_STATE for schema migrations
        const state = {
          ...INITIAL_STATE,
          ...parsed,
          equipped: { ...INITIAL_STATE.equipped, ...(parsed.equipped || {}) },
          todayStats: { ...INITIAL_STATE.todayStats, ...(parsed.todayStats || {}) },
          weaponLevels: { ...INITIAL_STATE.weaponLevels, ...(parsed.weaponLevels || {}) },
          weaponDuplicates: { ...INITIAL_STATE.weaponDuplicates, ...(parsed.weaponDuplicates || {}) },
          achievementsClaimed: { ...INITIAL_STATE.achievementsClaimed, ...(parsed.achievementsClaimed || {}) }
        };
        // Ensure default starter items exist in inventory
        INITIAL_STATE.inventory.forEach(defaultId => {
          if (!state.inventory.includes(defaultId)) state.inventory.push(defaultId);
        });
        return state;
      } catch (e) {
        console.error('Failed to parse save state, resetting to initial:', e);
      }
    }
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }

  saveState() {
    try {
      const slotKey = `dopatodo_save_slot_${this.state.activeSlot || 1}`;
      localStorage.setItem(slotKey, JSON.stringify(this.state));
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
    this.setupWhatsNewModal();

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

    // 7. Check Version Update for What's New modal popup
    this.checkVersionUpdate();
  }

  // --- Realtime PWA Live Update System ---
  setupPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
          this.swRegistration = reg;

          // Check if new worker is already waiting
          if (reg.waiting) {
            this.showUpdateBanner(reg.waiting);
          }

          // Listen for update events
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateBanner(newWorker);
              }
            });
          });
        }).catch((err) => {
          console.log('SW registration failed:', err);
        });

        // Safe update banner only, avoid auto-reload loop
        console.log('DopaTodo Service Worker registered smoothly.');
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

    const applyUpdateBtn = document.getElementById('apply-update-btn');
    if (applyUpdateBtn) {
      applyUpdateBtn.addEventListener('click', () => {
        if (this.waitingWorker) {
          this.waitingWorker.postMessage({ action: 'skipWaiting' });
        } else {
          window.location.reload();
        }
      });
    }
  }

  showUpdateBanner(worker) {
    this.waitingWorker = worker;
    const banner = document.getElementById('app-update-banner');
    if (banner) {
      banner.style.display = 'flex';
      sound.playCoin();
    }
  }

  // --- What's New Release Notes Modal & Update Gift ---
  checkVersionUpdate() {
    const lastSeen = localStorage.getItem('dopatodo_last_seen_version');
    if (lastSeen !== APP_VERSION) {
      // First time on this new version! Show What's New modal
      setTimeout(() => {
        this.openWhatsNewModal(true);
      }, 600);
    }
  }

  setupWhatsNewModal() {
    const btn = document.getElementById('whats-new-btn');
    const closeBtn = document.getElementById('whats-new-modal-close-btn');
    const claimBtn = document.getElementById('claim-update-gift-btn');
    const checkUpdateBtn = document.getElementById('check-update-btn');
    const modal = document.getElementById('whats-new-modal');

    if (btn) {
      btn.addEventListener('click', () => {
        this.openWhatsNewModal(false);
        sound.playTap();
      });
    }

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

    if (claimBtn) {
      claimBtn.addEventListener('click', () => {
        const giftKey = `dopatodo_update_gift_${APP_VERSION}`;
        const alreadyClaimed = localStorage.getItem(giftKey);

        if (!alreadyClaimed) {
          localStorage.setItem(giftKey, 'true');
          localStorage.setItem('dopatodo_last_seen_version', APP_VERSION);
          this.state.gems += (RELEASE_NOTES.giftGems || 300);
          this.updateHeaderStats();
          this.saveState();

          sound.playRainbowFanfare();
          fx.createRainbowConfetti();
          alert(`🎉 アップデート記念ボーナス！\n💎 +${RELEASE_NOTES.giftGems || 300} DOPA GEMS を獲得しました！`);
        } else {
          localStorage.setItem('dopatodo_last_seen_version', APP_VERSION);
          sound.playTap();
        }

        if (modal) modal.classList.remove('active');
      });
    }

    if (checkUpdateBtn) {
      checkUpdateBtn.addEventListener('click', async () => {
        sound.playTap();
        if (this.swRegistration) {
          try {
            await this.swRegistration.update();
            if (this.swRegistration.waiting) {
              this.showUpdateBanner(this.swRegistration.waiting);
            } else {
              alert(`✅ 現在最新のバージョン (${APP_VERSION}) を使用中です！`);
            }
          } catch (e) {
            alert(`✅ 現在最新のバージョン (${APP_VERSION}) です。`);
          }
        } else {
          alert(`✅ 現在のバージョン: ${APP_VERSION}`);
        }
      });
    }
  }

  openWhatsNewModal(isNewVersionArrival = false) {
    const modal = document.getElementById('whats-new-modal');
    const versionPill = document.getElementById('whats-new-version-pill');
    const dateEl = document.getElementById('whats-new-date');
    const titleEl = document.getElementById('whats-new-modal-title');
    const listEl = document.getElementById('whats-new-features-list');
    const giftAmountEl = document.getElementById('whats-new-gift-amount');
    const claimBtn = document.getElementById('claim-update-gift-btn');

    if (!modal) return;

    if (versionPill) versionPill.textContent = `v${RELEASE_NOTES.version}`;
    if (dateEl) dateEl.textContent = RELEASE_NOTES.date;
    if (titleEl) titleEl.textContent = RELEASE_NOTES.title;
    if (giftAmountEl) giftAmountEl.textContent = `💎 +${RELEASE_NOTES.giftGems} GEMS`;

    const giftKey = `dopatodo_update_gift_${APP_VERSION}`;
    const alreadyClaimed = localStorage.getItem(giftKey);
    if (claimBtn) {
      claimBtn.textContent = alreadyClaimed ? '確認完了 (閉じる)' : `💎 +${RELEASE_NOTES.giftGems} GEMSを受け取る！`;
    }

    if (listEl) {
      listEl.innerHTML = '';
      (RELEASE_NOTES.features || []).forEach(f => {
        const card = document.createElement('div');
        card.className = 'whats-new-feature-card';
        card.innerHTML = `
          <div class="whats-new-feature-icon">${f.icon}</div>
          <div class="whats-new-feature-content">
            <div class="whats-new-feature-title">${f.title}</div>
            <div class="whats-new-feature-desc">${f.desc}</div>
          </div>
        `;
        listEl.appendChild(card);
      });
    }

    modal.classList.add('active');
    if (isNewVersionArrival) {
      sound.playRainbowFanfare();
      fx.createRainbowConfetti();
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
        const isBgmActive = sound.toggleBgm();
        this.state.bgmEnabled = isBgmActive;
        bgmBtn.textContent = isBgmActive ? '🎵 BGM: ON' : '🔇 BGM: OFF';
        bgmBtn.classList.toggle('active', isBgmActive);
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

        // Reset scroll to top on tab switch
        const mainGrid = document.querySelector('.main-content-grid');
        if (mainGrid) mainGrid.scrollTop = 0;

        // Trigger section specific refreshes
        if (targetTab === 'loadout' && this.gacha) {
          this.gacha.renderInventory();
          this.gacha.updateEquippedDisplay();
        } else if (targetTab === 'todo' && this.todo) {
          this.todo.renderTasks();
        } else if (targetTab === 'battle' && this.battle) {
          this.battle.updateStatsDisplay();
        }

        // Instantly reset any residual screen shake transform
        const appEl = document.getElementById('app');
        if (appEl) appEl.style.transform = 'translate(0px, 0px)';
      });
    });
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when focused in text input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (this.battle) {
          this.battle.attack(2.0, null, true);
        }
      } else if (e.key === '1') {
        this.switchTab('todo');
      } else if (e.key === '2') {
        this.switchTab('battle');
      } else if (e.key === '3') {
        this.switchTab('loadout');
      } else if (e.key === '4') {
        this.switchTab('gacha');
      }
    });
  }

  switchTab(tabName) {
    const btn = document.querySelector(`.nav-tab-btn[data-tab="${tabName}"]`);
    if (btn) btn.click();
  }

  updateHeaderStats() {
    const gemsEl = document.getElementById('header-gems');
    const coinsEl = document.getElementById('header-coins');
    const slotBadge = document.getElementById('header-slot-badge');

    if (gemsEl) gemsEl.textContent = this.formatNumber(this.state.gems);
    if (coinsEl) coinsEl.textContent = this.formatNumber(this.state.coins);
    if (slotBadge) slotBadge.textContent = `Slot ${this.state.activeSlot || 1}`;

    this.checkAchievements();
  }

  formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e4) return (num / 1e3).toFixed(1) + 'k';
    return num.toLocaleString();
  }

  // --- Settings & Multi-User Save Slots ---
  setupSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('settings-modal-close-btn');
    const slotSelect = document.getElementById('slot-select');
    const resetBtn = document.getElementById('reset-slot-btn');
    const exportBtn = document.getElementById('export-data-btn');
    const importBtn = document.getElementById('import-data-btn');
    const hapticsToggle = document.getElementById('haptics-toggle');

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

    if (slotSelect) {
      slotSelect.value = (this.state.activeSlot || 1).toString();
      slotSelect.addEventListener('change', (e) => {
        const newSlot = parseInt(e.target.value, 10);
        this.switchSaveSlot(newSlot);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('【警告】本当にこのスロットのデータを初期化しますか？\n（所持武器、ジェム、タスクすべてリセットされます）')) {
          this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
          this.state.activeSlot = parseInt(slotSelect.value, 10);
          this.saveState();
          sound.playExplosion();
          alert('セーブデータを初期化しました。');
          window.location.reload();
        }
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const jsonStr = JSON.stringify(this.state);
        const code = btoa(encodeURIComponent(jsonStr));
        navigator.clipboard.writeText(code).then(() => {
          sound.playCoin();
          alert('📲 データ引き継ぎコードをクリップボードにコピーしました！\n別の端末で「コード読込・復元」に貼り付けてください。');
        }).catch(() => {
          prompt('以下のコードをコピーしてください:', code);
        });
      });
    }

    if (importBtn) {
      importBtn.addEventListener('click', () => {
        const code = prompt('引き継ぎコードを貼り付けてください:');
        if (!code) return;
        try {
          const jsonStr = decodeURIComponent(atob(code.trim()));
          const loaded = JSON.parse(jsonStr);
          if (loaded && typeof loaded === 'object') {
            this.state = { ...INITIAL_STATE, ...loaded };
            this.saveState();
            sound.playRainbowFanfare();
            alert('🎉 データの復元に成功しました！アプリを再読み込みします。');
            window.location.reload();
          }
        } catch (err) {
          alert('引き継ぎコードが無効です。正しくコピーされているかご確認ください。');
        }
      });
    }

    if (hapticsToggle) {
      hapticsToggle.checked = this.state.hapticsEnabled;
      hapticsToggle.addEventListener('change', (e) => {
        this.state.hapticsEnabled = e.target.checked;
        sound.hapticsEnabled = e.target.checked;
        this.saveState();
      });
    }
  }

  openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const slotSelect = document.getElementById('slot-select');
    const versionEl = document.getElementById('settings-app-version');
    if (slotSelect) slotSelect.value = (this.state.activeSlot || 1).toString();
    if (versionEl) versionEl.textContent = `v${APP_VERSION}`;
    if (modal) modal.classList.add('active');
  }

  switchSaveSlot(slotNumber) {
    this.saveState();
    const saved = localStorage.getItem(`dopatodo_save_slot_${slotNumber}`);
    if (saved) {
      try {
        this.state = { ...INITIAL_STATE, ...JSON.parse(saved), activeSlot: slotNumber };
      } catch (e) {
        this.state = { ...INITIAL_STATE, activeSlot: slotNumber };
      }
    } else {
      this.state = { ...INITIAL_STATE, activeSlot: slotNumber };
    }
    this.saveState();
    sound.playTap();
    alert(`スロット ${slotNumber} に切り替えました！`);
    window.location.reload();
  }

  // --- Achievements System ---
  setupAchievementsUI() {
    const modal = document.getElementById('achievements-modal');
    const closeBtn = document.getElementById('achievements-modal-close-btn');

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
      item.className = `achievement-item glass-panel ${isComplete ? 'is-completed' : ''} ${isClaimed ? 'is-claimed' : ''}`;

      let btnHtml = '';
      if (isClaimed) {
        btnHtml = '<span class="claimed-text">受取済</span>';
      } else if (isComplete) {
        btnHtml = `<button class="claim-btn" data-id="${ach.id}">受取 (+💎${ach.rewardGems})</button>`;
      } else {
        btnHtml = `<span style="font-size: 10px; color: var(--text-dim);">未達成 (+💎${ach.rewardGems})</span>`;
      }

      item.innerHTML = `
        <div class="ach-icon">${isComplete ? '🌟' : '🔒'}</div>
        <div class="ach-info">
          <div class="ach-title">${ach.title}</div>
          <div class="ach-desc">${ach.desc}</div>
        </div>
        <div class="ach-action">${btnHtml}</div>
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

    const dot = document.getElementById('ach-notification-dot');
    if (dot) dot.style.display = newCompleted ? 'block' : 'none';
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.dopaApp = new DopaTodoApp();
  window.dopaApp.init();
});
