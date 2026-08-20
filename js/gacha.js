// js/gacha.js - Extreme Dopamine Gacha System (Kyuin Sound, Puchun Blackout & Surprise Rank-Up)
import { sound } from './sound.js';
import { fx } from './fx.js';
import { RARITIES, WEAPONS, EQUIPMENT_ITEMS, EQUIP_SLOTS, SET_BONUSES } from './data.js';

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
    this.setupRewardAdUI();
    this.renderInventory();
    this.updateEquippedDisplay();
  }

  setupRewardAdUI() {
    const watchAdBtn = document.getElementById('watch-reward-ad-btn');
    const countVal = document.getElementById('reward-ad-count-val');

    const today = new Date().toISOString().split('T')[0];
    if (!this.app.state.lastAdDate || this.app.state.lastAdDate !== today) {
      this.app.state.lastAdDate = today;
      this.app.state.dailyAdWatches = 0;
      this.app.saveState();
    }

    const remaining = Math.max(0, 3 - (this.app.state.dailyAdWatches || 0));
    if (countVal) countVal.textContent = remaining;
    if (watchAdBtn) {
      if (remaining <= 0) {
        watchAdBtn.disabled = true;
        watchAdBtn.textContent = '本日分終了 (明日リセット)';
        watchAdBtn.classList.add('is-finished');
      } else {
        watchAdBtn.disabled = false;
        watchAdBtn.innerHTML = '<span>📺 応援してGET</span>';
        watchAdBtn.classList.remove('is-finished');
      }
    }

    if (watchAdBtn && !watchAdBtn.dataset.listener) {
      watchAdBtn.dataset.listener = 'true';
      watchAdBtn.addEventListener('click', () => {
        const curRemaining = Math.max(0, 3 - (this.app.state.dailyAdWatches || 0));
        if (curRemaining <= 0) {
          alert('本日の広告応援ボーナス（3回）はすべて受け取り済みです！\n明日またリセットされます！');
          return;
        }

        sound.playLeverOn();
        watchAdBtn.disabled = true;
        watchAdBtn.textContent = '⚡ スポンサー応援中...';

        setTimeout(() => {
          this.app.state.dailyAdWatches = (this.app.state.dailyAdWatches || 0) + 1;
          this.app.state.gems += 100;
          this.app.updateHeaderStats();
          this.app.saveState();

          try {
            sound.playRainbowFanfare();
            fx.createRainbowConfetti();
            fx.flash('rgba(0, 255, 136, 0.5)', 300);
          } catch (e) {}

          alert('🎉 スポンサー応援完了！\n💎 +100 DOPA GEMS を獲得しました！');
          this.setupRewardAdUI();
        }, 1200);
      });
    }
  }

  setupEventListeners() {
    const singleBtn = document.getElementById('gacha-single-btn');
    const multiBtn = document.getElementById('gacha-multi-btn');
    const closeResultBtn = document.getElementById('gacha-result-close-btn');
    const skipFlipBtn = document.getElementById('gacha-skip-flip-btn');
    const shareXBtn = document.getElementById('gacha-share-x-btn');
    const animOverlay = document.getElementById('gacha-animation-overlay');

    // Helper: lever pull animation on a button
    const addLeverAnim = (btn, callback) => {
      if (!btn) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // Visual lever-pull animation
        btn.classList.add('lever-pulling');
        try { sound.playLeverPull(); } catch(e2) {}
        setTimeout(() => {
          btn.classList.remove('lever-pulling');
          callback();
        }, 280);
      });
    };

    addLeverAnim(singleBtn, () => this.roll(1));
    addLeverAnim(multiBtn, () => this.roll(10));

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

    // Inventory Slot Filter Buttons
    const filterBtns = document.querySelectorAll('.inv-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.slotFilter || 'all';
        this.renderInventory(filter);
        sound.playTap();
      });
    });
  }

  getLoadoutStats() {
    const equipped = this.app.state.equipped || {
      weapon: 'w_n1',
      armor: 'a_n1',
      head: 'h_n1',
      accessory: 'acc_n1'
    };

    let totalAtk = 0;
    let totalCritRate = 0.05; // Base 5%
    let totalCritMult = 2.0;  // Base 2.0x
    let totalGemBonus = 0;
    let totalCoinBonus = 0;
    const seriesCounts = {};

    Object.entries(equipped).forEach(([slot, itemId]) => {
      const item = EQUIPMENT_ITEMS.find(eq => eq.id === itemId);
      if (!item) return;

      const itemAtk = this.getItemAtk(itemId);
      totalAtk += itemAtk;
      totalCritRate += (item.critRate || 0);
      totalCritMult += (item.critMult || 0);
      totalGemBonus += (item.gemBonus || 0);

      // Count series for set bonuses
      if (item.series && item.series !== 'basic') {
        seriesCounts[item.series] = (seriesCounts[item.series] || 0) + 1;
      }
    });

    // Check Set Bonuses
    const activeSetBonuses = [];
    Object.entries(seriesCounts).forEach(([seriesKey, count]) => {
      const setDef = SET_BONUSES[seriesKey];
      if (!setDef) return;

      if (count >= 2) {
        activeSetBonuses.push({
          name: `${setDef.name} (2部位)`,
          color: setDef.color,
          label: setDef.twoPiece.label,
          effect: setDef.twoPiece
        });
        if (setDef.twoPiece.dmgBoost) totalAtk *= setDef.twoPiece.dmgBoost;
        if (setDef.twoPiece.critDmgBoost) totalCritMult += setDef.twoPiece.critDmgBoost;
        if (setDef.twoPiece.coinBonus) totalCoinBonus += setDef.twoPiece.coinBonus;
      }

      if (count >= 4) {
        activeSetBonuses.push({
          name: `${setDef.name} (4部位コンプ)`,
          color: setDef.color,
          label: setDef.fourPiece.label,
          effect: setDef.fourPiece
        });
        if (setDef.fourPiece.gemBonus) totalGemBonus += setDef.fourPiece.gemBonus;
        if (setDef.fourPiece.critRateBoost) totalCritRate += setDef.fourPiece.critRateBoost;
      }
    });

    // Calculate Total Battle Power (総合戦闘力)
    const battlePower = Math.round(totalAtk * (1 + totalCritRate * (totalCritMult - 1)) * (1 + totalGemBonus + totalCoinBonus));

    return {
      totalAtk: Math.round(totalAtk),
      critRate: Math.min(1.0, totalCritRate),
      critMult: totalCritMult,
      gemBonus: totalGemBonus,
      coinBonus: totalCoinBonus,
      battlePower: Math.max(10, battlePower),
      seriesCounts,
      activeSetBonuses,
      equipped
    };
  }

  getItemAtk(itemId) {
    const item = EQUIPMENT_ITEMS.find(eq => eq.id === itemId);
    if (!item) return 15;

    const level = (this.app.state.weaponLevels && this.app.state.weaponLevels[itemId]) || 1;
    const dupes = (this.app.state.weaponDuplicates && this.app.state.weaponDuplicates[itemId]) || 0;

    const limitBreakMult = 1 + (dupes * 0.2);
    const levelBonus = (level - 1) * (item.baseAtk * 0.15);

    return Math.round(item.baseAtk * limitBreakMult + levelBonus);
  }

  getWeaponAtk(weaponId) {
    // Backward compatibility wrapper
    return this.getItemAtk(weaponId);
  }

  getUpgradeCost(itemId) {
    const level = (this.app.state.weaponLevels && this.app.state.weaponLevels[itemId]) || 1;
    const item = EQUIPMENT_ITEMS.find(eq => eq.id === itemId) || EQUIPMENT_ITEMS[0];
    const rarityMult = { N: 1, R: 2, SR: 5, SSR: 15, UR: 50 };
    return Math.round(level * 80 * (rarityMult[item.rarity] || 1));
  }

  upgradeItem(itemId) {
    if (!this.app.state.weaponLevels) this.app.state.weaponLevels = {};
    const level = this.app.state.weaponLevels[itemId] || 1;
    if (level >= 50) {
      alert('これ以上強化できません（最大レベル: 50）');
      return;
    }

    const cost = this.getUpgradeCost(itemId);
    if (this.app.state.coins < cost) {
      sound.playTap();
      alert(`🪙 コインが足りません！（必要: ${cost} コイン / 所持: ${this.app.state.coins} コイン）\nタスクを粉砕するかボスを倒してコインを稼ごう！`);
      return;
    }

    this.app.state.coins -= cost;
    this.app.state.weaponLevels[itemId] = level + 1;
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

  upgradeWeapon(weaponId) {
    this.upgradeItem(weaponId);
  }

  equipItem(slot, itemId) {
    if (!this.app.state.equipped) {
      this.app.state.equipped = { weapon: 'w_n1', armor: 'a_n1', head: 'h_n1', accessory: 'acc_n1' };
    }
    this.app.state.equipped[slot] = itemId;
    if (slot === 'weapon') this.app.state.equippedWeaponId = itemId;

    sound.playTap();
    this.app.saveState();
    this.renderInventory();
    this.updateEquippedDisplay();
    if (this.app.battle) this.app.battle.updateStatsDisplay();
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

    if (!this.app.state.inventory) this.app.state.inventory = ['w_n1', 'a_n1', 'h_n1', 'acc_n1'];
    if (!this.app.state.weaponLevels) this.app.state.weaponLevels = {};
    if (!this.app.state.weaponDuplicates) this.app.state.weaponDuplicates = {};

    for (let i = 0; i < count; i++) {
      const isGuaranteed = (count === 10 && i === 9);
      const item = this.drawRandomEquipment(isGuaranteed);

      const isDupe = this.app.state.inventory.includes(item.id);
      if (!isDupe) {
        this.app.state.inventory.push(item.id);
        this.app.state.weaponLevels[item.id] = 1;
        this.app.state.weaponDuplicates[item.id] = 0;
      } else {
        const currentDupes = this.app.state.weaponDuplicates[item.id] || 0;
        this.app.state.weaponDuplicates[item.id] = Math.min(5, currentDupes + 1);
      }

      const isSurprise = (item.rarity === 'SSR' || item.rarity === 'UR') && Math.random() < 0.4;

      results.push({
        ...item,
        isDupe: isDupe,
        dupeCount: this.app.state.weaponDuplicates[item.id] || 0,
        isSurprise: isSurprise,
        isOpen: false
      });

      if (rarityRank[item.rarity] > rarityRank[highestRarity]) {
        highestRarity = item.rarity;
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

  drawRandomEquipment(guaranteedSR = false) {
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

    const pool = EQUIPMENT_ITEMS.filter(w => w.rarity === targetRarity);
    if (pool.length === 0) return EQUIPMENT_ITEMS[0];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  drawRandomWeapon(guaranteedSR = false) {
    return this.drawRandomEquipment(guaranteedSR);
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
    const is10x = results.length >= 10;

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

    // For 10x: Show slot scroll teaser
    if (is10x) {
      this.cinematicTimeouts.push(setTimeout(() => {
        if (cutin) {
          cutin.textContent = '🎰 10連召喚スロット起動中...';
          cutin.style.color = '#ffd700';
        }
        this.showSlotScrollPreview(overlay);
        try { sound.playSlotSpin(); } catch(e) {}
      }, 500));
    }

    // Step 1: Step-Up Glow (Blue -> Yellow)
    this.cinematicTimeouts.push(setTimeout(() => {
      try { sound.playStepUp(2); } catch(e) {}
      if (portal) portal.className = 'portal-core step-yellow';
      if (cutin) {
        cutin.textContent = '⚡ 脳汁シナプス加速中: 65%... ⚡';
        cutin.style.color = '#ffd700';
      }
    }, 900));

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
    }, 1600));

    // Step 3: PUCHUN Freeze (0.7s Total Blackout) for SSR/UR!
    if (highestRarity === 'SSR' || highestRarity === 'UR') {
      this.cinematicTimeouts.push(setTimeout(() => {
        if (overlay) overlay.classList.add('puchun-blackout');
        try { sound.vibrateFreeze(); } catch(e) {}
      }, 2300));

      // Awakening Blast + KYUIN-KYUIN Siren Sound + FULL-SCREEN CUTIN!
      this.cinematicTimeouts.push(setTimeout(() => {
        if (overlay) overlay.classList.remove('puchun-blackout');

        // Full-screen rarity cutin burst!
        this.showRarityCutin(highestRarity, overlay);

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
      }, 3000));
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
      }, 2300));
    }

    // Step 4: Show Card Flip Modal
    const revealDelay = (highestRarity === 'SSR' || highestRarity === 'UR') ? 4500 : 3000;
    this.cinematicTimeouts.push(setTimeout(() => {
      this.skipCinematic();
    }, revealDelay));
  }

  // --- Slot Scroll Preview (10連時のスロット風演出) ---
  showSlotScrollPreview(overlay) {
    const slotEl = document.getElementById('gacha-slot-preview') || (() => {
      const el = document.createElement('div');
      el.id = 'gacha-slot-preview';
      el.className = 'gacha-slot-preview';
      if (overlay) overlay.appendChild(el);
      return el;
    })();

    const icons = ['⚡','🗡️','💥','🌈','👑','☄️','🤖','⭐','🔥','💎'];
    let frame = 0;
    let speed = 50;
    let running = true;

    const tick = () => {
      if (!running) return;
      const shuffled = [...icons].sort(() => Math.random() - 0.5);
      slotEl.innerHTML = shuffled.slice(0, 5).map(ic =>
        `<span class="gacha-spinner-icon">${ic}</span>`
      ).join('');
      frame++;
      speed = Math.min(speed + 3, 200);
      this.cinematicTimeouts.push(setTimeout(tick, speed));
    };
    tick();

    // Stop slot after 800ms
    this.cinematicTimeouts.push(setTimeout(() => {
      running = false;
      slotEl.remove();
    }, 900));
  }

  // --- Full-Screen Rarity Cutin Blast (SSR/UR only) ---
  showRarityCutin(rarity, overlay) {
    // Remove any existing cutin
    const old = document.getElementById('gacha-rarity-cutin');
    if (old) old.remove();

    const cutin = document.createElement('div');
    cutin.id = 'gacha-rarity-cutin';
    cutin.className = `gacha-rarity-cutin rarity-cutin-${rarity.toLowerCase()}`;

    if (rarity === 'UR') {
      cutin.innerHTML = `
        <div class="rarity-cutin-bg"></div>
        <div class="rarity-cutin-text">🌈 神域降臨 🌈</div>
        <div class="rarity-cutin-sub">GOD RARE ✦ UR ✦ 確定演出</div>
        <div class="rarity-cutin-sparks">✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦</div>
      `;
    } else {
      cutin.innerHTML = `
        <div class="rarity-cutin-bg"></div>
        <div class="rarity-cutin-text">🔥 覚醒大当り 🔥</div>
        <div class="rarity-cutin-sub">ULTRA RARE ✦ SSR ✦ 確定演出</div>
        <div class="rarity-cutin-sparks">✦ ✦ ✦ ✦ ✦ ✦</div>
      `;
    }

    document.body.appendChild(cutin);

    // Remove after animation
    this.cinematicTimeouts.push(setTimeout(() => {
      if (cutin.parentNode) cutin.remove();
    }, 1400));
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
    if (!this.app.state.equipped) {
      this.app.state.equipped = { weapon: 'w_n1', armor: 'a_n1', head: 'h_n1', accessory: 'acc_n1' };
    }

    const slots = ['weapon', 'armor', 'head', 'accessory'];
    const inventory = this.app.state.inventory || [];

    slots.forEach(slot => {
      let currentId = this.app.state.equipped[slot];
      let bestId = currentId;
      let bestAtk = currentId ? this.getItemAtk(currentId) : 0;

      inventory.forEach(id => {
        const item = EQUIPMENT_ITEMS.find(eq => eq.id === id);
        if (item && item.slot === slot) {
          const atk = this.getItemAtk(id);
          if (atk > bestAtk) {
            bestAtk = atk;
            bestId = id;
          }
        }
      });

      if (bestId) this.app.state.equipped[slot] = bestId;
    });

    this.app.state.equippedWeaponId = this.app.state.equipped.weapon;
  }

  getEquippedWeapon() {
    const wId = (this.app.state.equipped && this.app.state.equipped.weapon) || this.app.state.equippedWeaponId || 'w_n1';
    return EQUIPMENT_ITEMS.find(w => w.id === wId) || EQUIPMENT_ITEMS[0];
  }

  updateEquippedDisplay() {
    const stats = this.getLoadoutStats();

    // Update Loadout Slots UI
    const slotKeys = ['weapon', 'armor', 'head', 'accessory'];
    slotKeys.forEach(slot => {
      const itemId = stats.equipped[slot];
      const item = EQUIPMENT_ITEMS.find(eq => eq.id === itemId) || EQUIPMENT_ITEMS.find(eq => eq.slot === slot);
      if (!item) return;

      const level = (this.app.state.weaponLevels && this.app.state.weaponLevels[item.id]) || 1;
      const dupes = (this.app.state.weaponDuplicates && this.app.state.weaponDuplicates[item.id]) || 0;
      const atk = this.getItemAtk(item.id);

      const slotIconEl = document.getElementById(`loadout-icon-${slot}`);
      const slotNameEl = document.getElementById(`loadout-name-${slot}`);
      const slotStatEl = document.getElementById(`loadout-stat-${slot}`);
      const slotRarityEl = document.getElementById(`loadout-rarity-${slot}`);
      const slotLevelEl = document.getElementById(`loadout-level-${slot}`);

      if (slotIconEl) slotIconEl.textContent = item.icon;
      if (slotNameEl) slotNameEl.textContent = `${item.name} ${dupes > 0 ? `★+${dupes}` : ''}`;
      if (slotStatEl) {
        if (slot === 'weapon') slotStatEl.textContent = `ATK +${this.app.formatNumber(atk)}`;
        else if (slot === 'armor') slotStatEl.textContent = `会心倍率 +${item.critMult}x`;
        else if (slot === 'head') slotStatEl.textContent = `会心率 +${Math.round((item.critRate || 0)*100)}%`;
        else if (slot === 'accessory') slotStatEl.textContent = `報酬Gems +${Math.round((item.gemBonus || 0)*100)}%`;
      }
      if (slotLevelEl) slotLevelEl.textContent = `Lv.${level}`;
      if (slotRarityEl) {
        slotRarityEl.textContent = item.rarity;
        slotRarityEl.className = `rarity-tag rarity-${item.rarity.toLowerCase()}`;
      }
    });

    // Update Overall Battle Power and Stats
    const bpEl = document.getElementById('loadout-total-bp');
    const atkEl = document.getElementById('loadout-total-atk');
    const critEl = document.getElementById('loadout-total-crit');
    const bonusEl = document.getElementById('loadout-total-bonus');
    const setsContainer = document.getElementById('loadout-active-sets');

    if (bpEl) bpEl.textContent = `⚡ 総合戦闘力: ${this.app.formatNumber(stats.battlePower)}`;
    if (atkEl) atkEl.textContent = `⚔️ 合計ATK: +${this.app.formatNumber(stats.totalAtk)}`;
    if (critEl) critEl.textContent = `💥 会心率: ${Math.round(stats.critRate * 100)}% (x${stats.critMult.toFixed(1)})`;
    if (bonusEl) bonusEl.textContent = `💎 報酬UP: +${Math.round(stats.gemBonus * 100)}%`;

    if (setsContainer) {
      setsContainer.innerHTML = '';
      if (stats.activeSetBonuses.length === 0) {
        setsContainer.innerHTML = '<span class="set-none-text">発動中のセット効果: なし (同シリーズ装備で発動)</span>';
      } else {
        stats.activeSetBonuses.forEach(set => {
          const badge = document.createElement('div');
          badge.className = 'set-bonus-badge';
          badge.style.borderColor = set.color;
          badge.style.color = set.color;
          badge.innerHTML = `<span>🌟 ${set.name}:</span> <strong>${set.label}</strong>`;
          setsContainer.appendChild(badge);
        });
      }
    }

    // Keep legacy single-weapon header in sync if present
    const legacyName = document.getElementById('equipped-name');
    const legacyIcon = document.getElementById('equipped-icon');
    const legacyAtk = document.getElementById('equipped-atk');
    const mainWeapon = this.getEquippedWeapon();
    if (legacyName) legacyName.textContent = mainWeapon.name;
    if (legacyIcon) legacyIcon.textContent = mainWeapon.icon;
    if (legacyAtk) legacyAtk.textContent = `ATK: +${this.app.formatNumber(stats.totalAtk)}`;
  }

  renderInventory(activeFilter = 'all') {
    const container = document.getElementById('inventory-list');
    if (!container) return;

    this.currentInventoryFilter = activeFilter;
    container.innerHTML = '';
    const ownedItems = EQUIPMENT_ITEMS.filter(w => (this.app.state.inventory || []).includes(w.id));

    // Filter by slot
    const filteredItems = activeFilter === 'all' 
      ? ownedItems 
      : ownedItems.filter(item => item.slot === activeFilter);

    filteredItems.sort((a, b) => this.getItemAtk(b.id) - this.getItemAtk(a.id));

    if (filteredItems.length === 0) {
      container.innerHTML = '<div class="empty-log-msg">該当する装備がありません。ガチャを引いて装備を手に入れよう！</div>';
      return;
    }

    const equipped = this.app.state.equipped || {};

    filteredItems.forEach(item => {
      const isEquipped = equipped[item.slot] === item.id;
      const atk = this.getItemAtk(item.id);
      const level = (this.app.state.weaponLevels && this.app.state.weaponLevels[item.id]) || 1;
      const dupes = (this.app.state.weaponDuplicates && this.app.state.weaponDuplicates[item.id]) || 0;
      const upgradeCost = this.getUpgradeCost(item.id);
      const slotDef = EQUIP_SLOTS[item.slot] || { label: '装備', icon: '⚡' };
      const seriesDef = SET_BONUSES[item.series];

      const itemCard = document.createElement('div');
      itemCard.className = `inventory-item glass-panel ${isEquipped ? 'is-equipped' : ''} rarity-${item.rarity.toLowerCase()}`;

      let seriesBadgeHtml = '';
      if (seriesDef) {
        seriesBadgeHtml = `<span class="series-tag" style="border-color: ${seriesDef.color}; color: ${seriesDef.color};">${seriesDef.name.split('（')[0]}</span>`;
      }

      itemCard.innerHTML = `
        <div class="inv-icon">${item.icon}</div>
        <div class="inv-info">
          <div class="inv-name-row">
            <span class="inv-slot-pill">${slotDef.icon} ${slotDef.label}</span>
            ${seriesBadgeHtml}
            <span class="inv-name">${item.name} ${dupes > 0 ? `<span class="dupe-star-tag">★+${dupes}</span>` : ''}</span>
            <span class="rarity-tag rarity-${item.rarity.toLowerCase()}">${item.rarity}</span>
            <span class="inv-level-tag">Lv.${level}</span>
          </div>
          <div class="inv-atk">
            ${item.slot === 'weapon' ? `攻撃力: <strong>+${this.app.formatNumber(atk)}</strong>` : ''}
            ${item.slot === 'armor' ? `会心倍率: <strong>+${item.critMult}x</strong>` : ''}
            ${item.slot === 'head' ? `会心率: <strong>+${Math.round((item.critRate || 0)*100)}%</strong>` : ''}
            ${item.slot === 'accessory' ? `報酬Gems: <strong>+${Math.round((item.gemBonus || 0)*100)}%</strong>` : ''}
          </div>
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

      const equipBtn = itemCard.querySelector('.equip-btn');
      equipBtn.addEventListener('click', () => {
        this.equipItem(item.slot, item.id);
      });

      const upgradeBtn = itemCard.querySelector('.upgrade-btn');
      upgradeBtn.addEventListener('click', () => {
        this.upgradeItem(item.id);
      });

      container.appendChild(itemCard);
    });
  }
}
