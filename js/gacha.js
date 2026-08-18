// js/gacha.js - Extreme Dopamine Gacha System (Kyuin Sound, Puchun Blackout & Surprise Rank-Up)
import { sound } from './sound.js';
import { fx } from './fx.js';
import { RARITIES, WEAPONS } from './data.js';

export class GachaManager {
  constructor(app) {
    this.app = app;
    this.isSpinning = false;
    this.lastRollResults = [];
    this.unopenedCount = 0;
    this.cinematicTimeouts = [];
  }

  init() {
    this.setupEventListeners();
    this.renderInventory();
    this.updateEquippedDisplay();
  }

  setupEventListeners() {
    const singleBtn = document.getElementById('gacha-single-btn');
    const multiBtn = document.getElementById('gacha-multi-btn');
    const closeResultBtn = document.getElementById('gacha-result-close-btn');
    const skipFlipBtn = document.getElementById('gacha-skip-flip-btn');
    const shareXBtn = document.getElementById('gacha-share-x-btn');
    const animOverlay = document.getElementById('gacha-animation-overlay');

    if (singleBtn) {
      singleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.roll(1);
      });
    }

    if (multiBtn) {
      multiBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.roll(10);
      });
    }

    if (closeResultBtn) {
      closeResultBtn.addEventListener('click', () => {
        this.hideResultModal();
        sound.playTap();
      });
    }

    if (skipFlipBtn) {
      skipFlipBtn.addEventListener('click', () => {
        this.openAllCards();
      });
    }

    if (shareXBtn) {
      shareXBtn.addEventListener('click', () => {
        this.shareResultOnX();
      });
    }

    // Tap anywhere on overlay to skip cinematic!
    if (animOverlay) {
      animOverlay.addEventListener('click', () => {
        if (this.isSpinning && this.lastRollResults.length > 0) {
          this.skipCinematic();
        }
      });
    }
  }

  getWeaponAtk(weaponId) {
    const weapon = WEAPONS.find(w => w.id === weaponId);
    if (!weapon) return 15;

    const level = (this.app.state.weaponLevels && this.app.state.weaponLevels[weaponId]) || 1;
    const dupes = (this.app.state.weaponDuplicates && this.app.state.weaponDuplicates[weaponId]) || 0;

    const limitBreakMult = 1 + (dupes * 0.2);
    const levelBonus = (level - 1) * (weapon.baseAtk * 0.15);

    return Math.round(weapon.baseAtk * limitBreakMult + levelBonus);
  }

  getUpgradeCost(weaponId) {
    const level = (this.app.state.weaponLevels && this.app.state.weaponLevels[weaponId]) || 1;
    const weapon = WEAPONS.find(w => w.id === weaponId) || WEAPONS[0];
    const rarityMult = { N: 1, R: 2, SR: 5, SSR: 15, UR: 50 };
    return Math.round(level * 80 * (rarityMult[weapon.rarity] || 1));
  }

  upgradeWeapon(weaponId) {
    if (!this.app.state.weaponLevels) this.app.state.weaponLevels = {};
    const level = this.app.state.weaponLevels[weaponId] || 1;
    if (level >= 50) {
      alert('これ以上強化できません（最大レベル: 50）');
      return;
    }

    const cost = this.getUpgradeCost(weaponId);
    if (this.app.state.coins < cost) {
      sound.playTap();
      alert(`🪙 コインが足りません！（必要: ${cost} コイン / 所持: ${this.app.state.coins} コイン）\nタスクを粉砕するかボスを倒してコインを稼ごう！`);
      return;
    }

    this.app.state.coins -= cost;
    this.app.state.weaponLevels[weaponId] = level + 1;
    this.app.state.totalUpgrades = (this.app.state.totalUpgrades || 0) + 1;

    sound.playUpgrade();
    fx.flash('rgba(0, 243, 255, 0.4)', 250);

    this.app.checkAchievements();
    this.app.updateHeaderStats();
    this.renderInventory();
    this.updateEquippedDisplay();
    if (this.app.battle) this.app.battle.updateStatsDisplay();
    this.app.saveState();
  }

  roll(count) {
    this.clearCinematicTimeouts();
    this.isSpinning = false;

    const cost = count === 1 ? 100 : 900;
    if (this.app.state.gems < cost) {
      sound.playTap();
      fx.flash('rgba(255, 0, 0, 0.4)', 250);
      alert(`💎 DOPA GEMS が足りません！（必要: ${cost} GEMS / 現在: ${this.app.state.gems} GEMS）\nToDoタスクを粉砕してジェムを集めよう！`);
      return;
    }

    this.isSpinning = true;
    this.app.state.gems -= cost;
    this.app.state.totalGachaPulls = (this.app.state.totalGachaPulls || 0) + count;
    this.app.updateHeaderStats();
    this.app.saveState();

    const results = [];
    let highestRarity = 'N';
    const rarityRank = { N: 1, R: 2, SR: 3, SSR: 4, UR: 5 };

    if (!this.app.state.inventory) this.app.state.inventory = ['w_n1'];
    if (!this.app.state.weaponLevels) this.app.state.weaponLevels = { 'w_n1': 1 };
    if (!this.app.state.weaponDuplicates) this.app.state.weaponDuplicates = { 'w_n1': 0 };

    for (let i = 0; i < count; i++) {
      const isGuaranteed = (count === 10 && i === 9);
      const weapon = this.drawRandomWeapon(isGuaranteed);

      const isDupe = this.app.state.inventory.includes(weapon.id);
      if (!isDupe) {
        this.app.state.inventory.push(weapon.id);
        this.app.state.weaponLevels[weapon.id] = 1;
        this.app.state.weaponDuplicates[weapon.id] = 0;
      } else {
        const currentDupes = this.app.state.weaponDuplicates[weapon.id] || 0;
        this.app.state.weaponDuplicates[weapon.id] = Math.min(5, currentDupes + 1);
      }

      // Surprise rank-up chance (15% chance for SSR/UR to disguise as SR on card back!)
      const isSurprise = (weapon.rarity === 'SSR' || weapon.rarity === 'UR') && Math.random() < 0.4;

      results.push({
        ...weapon,
        isDupe: isDupe,
        dupeCount: this.app.state.weaponDuplicates[weapon.id] || 0,
        isSurprise: isSurprise,
        isOpen: false
      });

      if (rarityRank[weapon.rarity] > rarityRank[highestRarity]) {
        highestRarity = weapon.rarity;
      }
    }

    this.lastRollResults = results;
    this.unopenedCount = results.length;
    this.autoEquipStrongest();
    this.app.checkAchievements();
    this.app.saveState();

    // Trigger Extreme Dopamine Cinematic Sequence
    this.playCinematicSequence(results, highestRarity);
  }

  drawRandomWeapon(guaranteedSR = false) {
    let rand = Math.random() * 100;

    let targetRarity = 'N';
    if (guaranteedSR) {
      if (rand < 5) targetRarity = 'UR';
      else if (rand < 30) targetRarity = 'SSR';
      else targetRarity = 'SR';
    } else {
      if (rand < RARITIES.UR.rate) targetRarity = 'UR';
      else if (rand < RARITIES.UR.rate + RARITIES.SSR.rate) targetRarity = 'SSR';
      else if (rand < RARITIES.UR.rate + RARITIES.SSR.rate + RARITIES.SR.rate) targetRarity = 'SR';
      else if (rand < RARITIES.UR.rate + RARITIES.SSR.rate + RARITIES.SR.rate + RARITIES.R.rate) targetRarity = 'R';
      else targetRarity = 'N';
    }

    const pool = WEAPONS.filter(w => w.rarity === targetRarity);
    if (pool.length === 0) return WEAPONS[0];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  clearCinematicTimeouts() {
    this.cinematicTimeouts.forEach(id => clearTimeout(id));
    this.cinematicTimeouts = [];
  }

  skipCinematic() {
    this.clearCinematicTimeouts();
    const overlay = document.getElementById('gacha-animation-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.classList.remove('puchun-blackout');
    }
    this.showCardFlipModal(this.lastRollResults);
    this.isSpinning = false;
    this.renderInventory();
    this.updateEquippedDisplay();
    if (this.app.battle) this.app.battle.updateStatsDisplay();
  }

  // --- Extreme Dopamine Summon Sequence with Kyuin, Puchun & Rank-Up ---
  playCinematicSequence(results, highestRarity) {
    this.clearCinematicTimeouts();
    const overlay = document.getElementById('gacha-animation-overlay');
    const cutin = document.getElementById('gacha-cutin-text');
    const portal = document.getElementById('gacha-portal-core');

    if (overlay) {
      overlay.classList.remove('puchun-blackout');
      overlay.classList.add('active');
    }
    if (portal) portal.className = 'portal-core step-blue';
    if (cutin) {
      cutin.textContent = '⚡ LEVER ON: SYNAPSE CHARGING... (タップでSKIP)';
      cutin.style.color = '#00f3ff';
      cutin.className = 'gacha-cutin-msg';
    }

    // 1. Heavy Lever-On Impact
    try { sound.playLeverOn(); } catch(e) {}
    try { fx.flash('rgba(0, 243, 255, 0.5)', 200); } catch(e) {}
    try { fx.screenShake(10, 800); } catch(e) {}

    // Drumroll starts
    this.cinematicTimeouts.push(setTimeout(() => {
      try { sound.playGachaBuildup(); } catch(e) {}
    }, 200));

    // Step 1: Step-Up Glow (Blue -> Yellow)
    this.cinematicTimeouts.push(setTimeout(() => {
      try { sound.playStepUp(2); } catch(e) {}
      if (portal) portal.className = 'portal-core step-yellow';
      if (cutin) {
        cutin.textContent = '⚡ 脳汁シナプス加速中: 65%... ⚡';
        cutin.style.color = '#ffd700';
      }
    }, 800));

    // Step 2: Step-Up to Red / SSR if applicable
    this.cinematicTimeouts.push(setTimeout(() => {
      if (highestRarity === 'SSR' || highestRarity === 'UR') {
        try { sound.playStepUp(3); } catch(e) {}
        if (portal) portal.className = 'portal-core step-red';
        if (cutin) {
          cutin.textContent = '🔥 激熱警報！！ ドパミン臨界突破: 99%！！ 🔥';
          cutin.style.color = '#ff007f';
        }
        try { fx.screenShake(16, 600); } catch(e) {}
      }
    }, 1400));

    // Step 3: PUCHUN Freeze (0.7s Total Blackout) for SSR/UR!
    if (highestRarity === 'SSR' || highestRarity === 'UR') {
      this.cinematicTimeouts.push(setTimeout(() => {
        if (overlay) overlay.classList.add('puchun-blackout');
        try { sound.vibrateFreeze(); } catch(e) {}
      }, 2000));

      // Awakening Blast + KYUIN-KYUIN Siren Sound!
      this.cinematicTimeouts.push(setTimeout(() => {
        if (overlay) overlay.classList.remove('puchun-blackout');

        // Pachinko Kyuin Jackpot Siren!
        try { sound.playKyuin(); } catch(e) {}

        if (highestRarity === 'UR') {
          if (portal) portal.className = 'portal-core step-rainbow';
          if (cutin) {
            cutin.textContent = '🌈 キュインキュイン！！ 神域 (UR) 降臨！！！ 🌈';
            cutin.style.color = '#00ff88';
            cutin.classList.add('pulse-rainbow');
          }
          try { sound.playRainbowFanfare(); } catch(e) {}
          try { fx.createRainbowConfetti(); } catch(e) {}
          try { fx.createGoldSparksFX(window.innerWidth / 2, window.innerHeight / 2, 80, 'rainbow'); } catch(e) {}
          try { fx.flash('rgba(0, 255, 136, 0.8)', 600); } catch(e) {}
          try { fx.screenShake(35, 900); } catch(e) {}
        } else {
          if (portal) portal.className = 'portal-core step-red';
          if (cutin) {
            cutin.textContent = '🔥 覚醒大当り！！ ULTRA RARE (SSR) 出現！！ 🔥';
            cutin.style.color = '#ff007f';
            cutin.classList.add('pulse-ssr');
          }
          try { sound.playRainbowFanfare(); } catch(e) {}
          try { fx.createRainbowConfetti(); } catch(e) {}
          try { fx.createGoldSparksFX(window.innerWidth / 2, window.innerHeight / 2, 60, 'ssr'); } catch(e) {}
          try { fx.flash('rgba(255, 0, 127, 0.8)', 500); } catch(e) {}
          try { fx.screenShake(25, 700); } catch(e) {}
        }
      }, 2700));
    } else {
      this.cinematicTimeouts.push(setTimeout(() => {
        if (highestRarity === 'SR') {
          if (portal) portal.className = 'portal-core step-yellow';
          if (cutin) {
            cutin.textContent = '⚡ SUPER RARE (SR) 確定！ ⚡';
            cutin.style.color = '#ffd700';
          }
          try { sound.playCritical(); } catch(e) {}
          try { fx.flash('rgba(255, 215, 0, 0.5)', 300); } catch(e) {}
        }
      }, 2000));
    }

    // Step 4: Show Card Flip Modal
    const revealDelay = (highestRarity === 'SSR' || highestRarity === 'UR') ? 4200 : 2800;
    this.cinematicTimeouts.push(setTimeout(() => {
      this.skipCinematic();
    }, revealDelay));
  }

  // --- Interactive 3D Card Flip Modal (With Surprise Rank-Up) ---
  showCardFlipModal(results) {
    const modal = document.getElementById('gacha-result-modal');
    const container = document.getElementById('gacha-cards-container');
    const skipBtn = document.getElementById('gacha-skip-flip-btn');

    if (!modal || !container) return;

    container.innerHTML = '';
    this.unopenedCount = results.length;

    if (skipBtn) skipBtn.style.display = 'inline-block';

    results.forEach((weapon, idx) => {
      const cardWrap = document.createElement('div');
      cardWrap.className = `flip-card-wrapper rarity-${weapon.rarity.toLowerCase()}`;
      cardWrap.dataset.index = idx;

      const atk = this.getWeaponAtk(weapon.id);
      const dupes = (this.app.state.weaponDuplicates && this.app.state.weaponDuplicates[weapon.id]) || 0;
      
      // Determine aura on card back (If surprise, show SR gold aura first!)
      let auraClass = '';
      if (weapon.isSurprise) {
        auraClass = 'aura-sr';
      } else if (weapon.rarity === 'UR') {
        auraClass = 'aura-ur';
      } else if (weapon.rarity === 'SSR') {
        auraClass = 'aura-ssr';
      } else if (weapon.rarity === 'SR') {
        auraClass = 'aura-sr';
      }

      cardWrap.innerHTML = `
        <div class="flip-card-inner">
          <!-- Back of card (Hidden) -->
          <div class="flip-card-back ${auraClass}">
            <div class="card-back-pattern">⚡</div>
            <div class="card-back-tap-hint">TAP TO REVEAL</div>
          </div>
          <!-- Front of card (Revealed) -->
          <div class="flip-card-front gacha-card rarity-${weapon.rarity.toLowerCase()}">
            <div class="card-rarity-badge">${weapon.rarity}</div>
            ${weapon.isDupe ? `<div class="card-dupe-badge">★+${dupes} 凸</div>` : '<div class="card-new-badge">NEW!</div>'}
            <div class="card-icon">${weapon.icon}</div>
            <div class="card-name">${weapon.name}</div>
            <div class="card-atk">ATK: <span>+${this.app.formatNumber(atk)}</span></div>
            <div class="card-desc">${weapon.desc}</div>
          </div>
        </div>
      `;

      cardWrap.addEventListener('click', () => {
        this.flipCard(cardWrap, weapon);
      });

      container.appendChild(cardWrap);
    });

    modal.classList.add('active');
  }

  flipCard(cardWrap, weapon) {
    if (cardWrap.classList.contains('is-flipped')) return;

    // Check for Surprise Rank-Up Effect (まだまだァァッ！！)
    if (weapon.isSurprise) {
      this.triggerSurpriseRankUp(cardWrap, weapon);
      return;
    }

    this.executeCardFlip(cardWrap, weapon);
  }

  triggerSurpriseRankUp(cardWrap, weapon) {
    weapon.isSurprise = false; // Trigger once
    try { sound.playShoukaku(); } catch(e) {}
    try { sound.playKyuin(); } catch(e) {}
    try { fx.screenShake(20, 400); } catch(e) {}
    try { fx.flash('rgba(255, 215, 0, 0.7)', 300); } catch(e) {}

    // Show floating rank-up cutin on screen
    const cutinEl = document.createElement('div');
    cutinEl.className = 'surprise-rankup-cutin';
    cutinEl.textContent = '💥 まだまだァァッ！！ 昇格覚醒！！ 💥';
    document.body.appendChild(cutinEl);

    setTimeout(() => {
      cutinEl.remove();
      this.executeCardFlip(cardWrap, weapon);
    }, 400);
  }

  executeCardFlip(cardWrap, weapon) {
    cardWrap.classList.add('is-flipped');
    weapon.isOpen = true;
    this.unopenedCount--;

    const isRare = (weapon.rarity === 'SSR' || weapon.rarity === 'UR');
    try { sound.playCardFlip(isRare); } catch(e) {}

    const rect = cardWrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    if (weapon.rarity === 'UR') {
      try { fx.createGoldSparksFX(cx, cy, 50, 'rainbow'); } catch(e) {}
      try { fx.flash('rgba(0, 255, 136, 0.5)', 250); } catch(e) {}
      try { fx.screenShake(15, 300); } catch(e) {}
    } else if (weapon.rarity === 'SSR') {
      try { fx.createGoldSparksFX(cx, cy, 40, 'ssr'); } catch(e) {}
      try { fx.flash('rgba(255, 0, 127, 0.5)', 250); } catch(e) {}
      try { fx.screenShake(10, 250); } catch(e) {}
    } else if (weapon.rarity === 'SR') {
      try { fx.createGoldSparksFX(cx, cy, 25, 'gold'); } catch(e) {}
    }

    if (this.unopenedCount <= 0) {
      const skipBtn = document.getElementById('gacha-skip-flip-btn');
      if (skipBtn) skipBtn.style.display = 'none';
    }
  }

  openAllCards() {
    const cards = document.querySelectorAll('.flip-card-wrapper');
    cards.forEach((card, idx) => {
      setTimeout(() => {
        const weapon = this.lastRollResults[idx];
        if (weapon && !card.classList.contains('is-flipped')) {
          this.executeCardFlip(card, weapon);
        }
      }, idx * 70);
    });
  }

  hideResultModal() {
    const modal = document.getElementById('gacha-result-modal');
    if (modal) modal.classList.remove('active');
    this.isSpinning = false;
  }

  shareResultOnX() {
    if (!this.lastRollResults || this.lastRollResults.length === 0) return;

    const best = [...this.lastRollResults].sort((a, b) => {
      const rarityRank = { N: 1, R: 2, SR: 3, SSR: 4, UR: 5 };
      return rarityRank[b.rarity] - rarityRank[a.rarity];
    })[0];

    const text = `⚡【神引き】DopaTodoで [${best.rarity}]「${best.name}」(ATK:+${this.app.formatNumber(this.getWeaponAtk(best.id))}) を召喚した！\nタスクを粉砕して脳汁全開！⚔️💥\n\n#DopaTodo #ドパがき #ToDoアプリ`;
    const url = window.location.href;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

    window.open(shareUrl, '_blank');
  }

  autoEquipStrongest() {
    let bestWeaponId = this.app.state.equippedWeaponId || 'w_n1';
    let bestAtk = this.getWeaponAtk(bestWeaponId);

    if (Array.isArray(this.app.state.inventory)) {
      this.app.state.inventory.forEach(id => {
        const atk = this.getWeaponAtk(id);
        if (atk > bestAtk) {
          bestAtk = atk;
          bestWeaponId = id;
        }
      });
    }

    this.app.state.equippedWeaponId = bestWeaponId;
  }

  getEquippedWeapon() {
    return WEAPONS.find(w => w.id === this.app.state.equippedWeaponId) || WEAPONS[0];
  }

  updateEquippedDisplay() {
    const weapon = this.getEquippedWeapon();
    const atk = this.getWeaponAtk(weapon.id);
    const level = (this.app.state.weaponLevels && this.app.state.weaponLevels[weapon.id]) || 1;
    const dupes = (this.app.state.weaponDuplicates && this.app.state.weaponDuplicates[weapon.id]) || 0;

    const nameEl = document.getElementById('equipped-name');
    const iconEl = document.getElementById('equipped-icon');
    const atkEl = document.getElementById('equipped-atk');
    const rarityEl = document.getElementById('equipped-rarity');
    const levelEl = document.getElementById('equipped-level-badge');

    if (nameEl) nameEl.textContent = `${weapon.name} ${dupes > 0 ? `★+${dupes}` : ''}`;
    if (iconEl) iconEl.textContent = weapon.icon;
    if (atkEl) atkEl.textContent = `ATK: +${this.app.formatNumber(atk)}`;
    if (levelEl) levelEl.textContent = `Lv.${level}`;
    if (rarityEl) {
      rarityEl.textContent = weapon.rarity;
      rarityEl.className = `rarity-tag rarity-${weapon.rarity.toLowerCase()}`;
    }
  }

  renderInventory() {
    const container = document.getElementById('inventory-list');
    if (!container) return;

    container.innerHTML = '';
    const ownedWeapons = WEAPONS.filter(w => (this.app.state.inventory || []).includes(w.id));

    ownedWeapons.sort((a, b) => this.getWeaponAtk(b.id) - this.getWeaponAtk(a.id));

    ownedWeapons.forEach(w => {
      const isEquipped = w.id === this.app.state.equippedWeaponId;
      const atk = this.getWeaponAtk(w.id);
      const level = (this.app.state.weaponLevels && this.app.state.weaponLevels[w.id]) || 1;
      const dupes = (this.app.state.weaponDuplicates && this.app.state.weaponDuplicates[w.id]) || 0;
      const upgradeCost = this.getUpgradeCost(w.id);

      const item = document.createElement('div');
      item.className = `inventory-item glass-panel ${isEquipped ? 'is-equipped' : ''} rarity-${w.rarity.toLowerCase()}`;

      item.innerHTML = `
        <div class="inv-icon">${w.icon}</div>
        <div class="inv-info">
          <div class="inv-name-row">
            <span class="inv-name">${w.name} ${dupes > 0 ? `<span class="dupe-star-tag">★+${dupes}</span>` : ''}</span>
            <span class="rarity-tag rarity-${w.rarity.toLowerCase()}">${w.rarity}</span>
            <span class="inv-level-tag">Lv.${level}</span>
          </div>
          <div class="inv-atk">攻撃力: <strong>+${this.app.formatNumber(atk)}</strong></div>
        </div>
        <div class="inv-actions">
          <button class="upgrade-btn ${this.app.state.coins >= upgradeCost ? 'can-upgrade' : ''}" title="コインで強化">
            <span>強化</span>
            <span class="cost-tag">🪙${this.app.formatNumber(upgradeCost)}</span>
          </button>
          <button class="equip-btn ${isEquipped ? 'active' : ''}">
            ${isEquipped ? '装備中' : '装備'}
          </button>
        </div>
      `;

      const equipBtn = item.querySelector('.equip-btn');
      equipBtn.addEventListener('click', () => {
        if (this.app.state.equippedWeaponId !== w.id) {
          this.app.state.equippedWeaponId = w.id;
          sound.playTap();
          this.app.saveState();
          this.renderInventory();
          this.updateEquippedDisplay();
          if (this.app.battle) this.app.battle.updateStatsDisplay();
        }
      });

      const upgradeBtn = item.querySelector('.upgrade-btn');
      upgradeBtn.addEventListener('click', () => {
        this.upgradeWeapon(w.id);
      });

      container.appendChild(item);
    });
  }
}
