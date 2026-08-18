// js/battle.js - Boss Battle & High-Inflation Damage Engine
import { sound } from './sound.js';
import { fx } from './fx.js';
import { MONSTERS } from './data.js';

export class BattleManager {
  constructor(app) {
    this.app = app;
    this.autoAttackTimer = null;
    this.currentMonster = null;
    this.isEnraged = false;
  }

  init() {
    this.loadMonster();
    this.setupEventListeners();
    this.startAutoAttack();
    this.updateStatsDisplay();
  }

  loadMonster() {
    const stageIdx = (this.app.state.stage - 1) % MONSTERS.length;
    const baseMonster = MONSTERS[stageIdx];
    const loopCount = Math.floor((this.app.state.stage - 1) / MONSTERS.length);

    const scaleFactor = Math.pow(3.5, loopCount);
    const maxHp = Math.round(baseMonster.baseHp * scaleFactor);

    this.isEnraged = false;
    this.currentMonster = {
      ...baseMonster,
      name: loopCount > 0 ? `極・${baseMonster.name} (Lv.${this.app.state.stage})` : baseMonster.name,
      maxHp: maxHp,
      currentHp: this.app.state.bossCurrentHp > 0 && this.app.state.bossCurrentHp <= maxHp
        ? this.app.state.bossCurrentHp
        : maxHp,
      rewardGems: Math.round(baseMonster.rewardGems * Math.pow(1.8, loopCount)),
      rewardCoins: Math.round(baseMonster.rewardCoins * Math.pow(1.8, loopCount))
    };

    this.app.state.bossMaxHp = this.currentMonster.maxHp;
    this.app.state.bossCurrentHp = this.currentMonster.currentHp;
    this.renderMonster();
  }

  setupEventListeners() {
    const attackBtn = document.getElementById('battle-attack-btn');
    const monsterTarget = document.getElementById('monster-avatar-container');
    const autoToggle = document.getElementById('auto-attack-toggle');
    const shareBossBtn = document.getElementById('battle-share-x-btn');

    const handleManualHit = (e) => {
      this.attack(2.0, e, true);
    };

    if (attackBtn) attackBtn.addEventListener('click', handleManualHit);
    if (monsterTarget) monsterTarget.addEventListener('click', handleManualHit);

    if (shareBossBtn) {
      shareBossBtn.addEventListener('click', () => {
        this.shareBossVictoryOnX();
      });
    }

    if (autoToggle) {
      autoToggle.checked = this.app.state.autoAttackEnabled;
      autoToggle.addEventListener('change', (e) => {
        this.app.state.autoAttackEnabled = e.target.checked;
        this.app.saveState();
        if (this.app.state.autoAttackEnabled) {
          this.startAutoAttack();
        } else {
          this.stopAutoAttack();
        }
      });
    }
  }

  startAutoAttack() {
    this.stopAutoAttack();
    if (!this.app.state.autoAttackEnabled) return;

    this.autoAttackTimer = setInterval(() => {
      this.attack(1.0, null, false);
    }, 1000);
  }

  stopAutoAttack() {
    if (this.autoAttackTimer) {
      clearInterval(this.autoAttackTimer);
      this.autoAttackTimer = null;
    }
  }

  attack(multiplier = 1.0, event = null, isManual = false) {
    if (!this.currentMonster || this.currentMonster.currentHp <= 0) return;

    const atkPower = this.app.gacha.getWeaponAtk(this.app.state.equippedWeaponId);
    let baseAtk = atkPower * multiplier;

    if (this.app.state.isFever) {
      baseAtk *= 3;
    }

    const isCrit = Math.random() < 0.25 || isManual;
    const finalDamage = Math.round(baseAtk * (isCrit ? (2.5 + Math.random()) : (0.9 + Math.random() * 0.2)));

    this.currentMonster.currentHp = Math.max(0, this.currentMonster.currentHp - finalDamage);
    this.app.state.bossCurrentHp = this.currentMonster.currentHp;

    if (isCrit) {
      sound.playCritical();
      fx.screenShake(10, 200);
    } else {
      sound.playAttack();
    }

    const targetEl = document.getElementById('monster-avatar');
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const x = (event ? event.clientX : rect.left + rect.width / 2) + (Math.random() - 0.5) * 60;
      const y = (event ? event.clientY : rect.top + rect.height / 3) + (Math.random() - 0.5) * 40;

      const dmgText = `${isCrit ? '💥 CRITICAL! ' : ''}-${this.app.formatNumber(finalDamage)}`;
      fx.createFloatingText(x, y, dmgText, isCrit ? '#ff007f' : '#ffd700', isCrit ? 32 : 22, isCrit);

      targetEl.classList.add('monster-hit');
      setTimeout(() => targetEl.classList.remove('monster-hit'), 150);
    }

    // Check Boss Enrage Mode (HP < 30%)
    if (!this.isEnraged && this.currentMonster.currentHp > 0 && (this.currentMonster.currentHp / this.currentMonster.maxHp) <= 0.3) {
      this.triggerEnrage();
    }

    this.updateHpBar();

    if (this.currentMonster.currentHp <= 0) {
      this.handleDefeat();
    }
  }

  triggerEnrage() {
    this.isEnraged = true;
    sound.playCritical();
    fx.flash('rgba(255, 0, 85, 0.5)', 300);

    const quoteEl = document.getElementById('monster-quote');
    const avatarEl = document.getElementById('monster-avatar');
    if (quoteEl) quoteEl.textContent = '「グハッ…！ まだだ…お前の集中力を奪うまでは…！！」';
    if (avatarEl) avatarEl.classList.add('monster-enraged');
  }

  handleDefeat() {
    this.stopAutoAttack();
    sound.playExplosion();

    const targetEl = document.getElementById('monster-avatar');
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      fx.createExplosionFX(x, y);
      targetEl.classList.add('monster-defeated');
    }

    const mult = this.app.state.isFever ? 2 : 1;
    const earnedGems = this.currentMonster.rewardGems * mult;
    const earnedCoins = this.currentMonster.rewardCoins * mult;

    this.app.state.gems += earnedGems;
    this.app.state.coins += earnedCoins;
    this.app.state.stage += 1;
    this.app.state.totalDefeated += 1;

    this.app.checkAchievements();
    this.app.updateHeaderStats();
    this.updateStatsDisplay();

    setTimeout(() => {
      sound.playRainbowFanfare();
      fx.createRainbowConfetti();
    }, 400);

    setTimeout(() => {
      this.loadMonster();
      this.app.saveState();
      this.startAutoAttack();
    }, 1800);
  }

  shareBossVictoryOnX() {
    const stage = this.app.state.stage;
    const defeated = this.app.state.totalDefeated;
    const weapon = this.app.gacha.getEquippedWeapon();
    const atk = this.app.gacha.getWeaponAtk(weapon.id);

    const text = `⚔️【先延ばし粉砕】DopaTodoで Stage ${stage} に到達！ボスを累計 ${defeated} 体粉砕した！\n現在の愛用武器: [${weapon.rarity}]「${weapon.name}」(ATK:+${this.app.formatNumber(atk)})\n\n#DopaTodo #ドパがき #ToDoアプリ`;
    const url = window.location.href;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

    window.open(shareUrl, '_blank');
  }

  renderMonster() {
    const avatarEl = document.getElementById('monster-avatar');
    const nameEl = document.getElementById('monster-name');
    const titleEl = document.getElementById('monster-title');
    const quoteEl = document.getElementById('monster-quote');
    const stageEl = document.getElementById('battle-stage-display');

    if (avatarEl) {
      avatarEl.textContent = this.currentMonster.icon;
      avatarEl.className = 'monster-avatar';
    }
    if (nameEl) nameEl.textContent = this.currentMonster.name;
    if (titleEl) titleEl.textContent = this.currentMonster.title;
    if (quoteEl) quoteEl.textContent = this.currentMonster.quote;
    if (stageEl) stageEl.textContent = `STAGE ${this.app.state.stage}`;

    this.updateHpBar();
  }

  updateHpBar() {
    const fillEl = document.getElementById('boss-hp-fill');
    const textEl = document.getElementById('boss-hp-text');

    if (!this.currentMonster) return;
    const pct = Math.max(0, Math.min(100, (this.currentMonster.currentHp / this.currentMonster.maxHp) * 100));

    if (fillEl) fillEl.style.width = `${pct}%`;
    if (textEl) {
      textEl.textContent = `HP: ${this.app.formatNumber(this.currentMonster.currentHp)} / ${this.app.formatNumber(this.currentMonster.maxHp)} (${pct.toFixed(1)}%)`;
    }
  }

  updateStatsDisplay() {
    const weapon = this.app.gacha ? this.app.gacha.getEquippedWeapon() : { id: 'w_n1' };
    const atk = this.app.gacha ? this.app.gacha.getWeaponAtk(weapon.id) : 15;
    const totalAtkEl = document.getElementById('stat-total-atk');
    const stageEl = document.getElementById('stat-stage');
    const defeatedEl = document.getElementById('stat-defeated');

    if (totalAtkEl) totalAtkEl.textContent = this.app.formatNumber(atk);
    if (stageEl) stageEl.textContent = `Stage ${this.app.state.stage}`;
    if (defeatedEl) defeatedEl.textContent = `${this.app.state.totalDefeated} 体`;
  }
}
