// js/fx.js - Particle & Visual FX Engine (Extreme Visuals Edition)

class FXEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animId = null;
    this.lastTime = performance.now();
  }

  init(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.loop();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  loop() {
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.update(dt);
        p.draw(this.ctx);

        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }

    this.animId = requestAnimationFrame(() => this.loop());
  }

  // 1. Task Shatter Particles
  createShatterFX(x, y) {
    const colors = ['#00ff88', '#00f3ff', '#ffd700', '#ff007f', '#ffffff'];
    const count = 40;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 450;
      const size = 4 + Math.random() * 8;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const life = 0.5 + Math.random() * 0.7;

      this.particles.push(new ShardParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, size, color, life));
    }
  }

  // 2. Boss Blast Explosion Particles
  createExplosionFX(x, y) {
    const colors = ['#ff007f', '#ff5500', '#ffd700', '#ffffff', '#a855f7'];
    const count = 80;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 700;
      const size = 6 + Math.random() * 12;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const life = 0.6 + Math.random() * 0.8;

      this.particles.push(new SmokeExplosionParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, size, color, life));
    }

    this.screenShake(20, 400);
  }

  // 3. Rainbow Confetti
  createRainbowConfetti() {
    if (!this.canvas) return;
    const colors = ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'];
    const count = 120;

    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.canvas.width;
      const y = -20;
      const vx = (Math.random() - 0.5) * 250;
      const vy = 150 + Math.random() * 400;
      const size = 6 + Math.random() * 10;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const life = 2.5 + Math.random() * 1.5;

      this.particles.push(new ConfettiParticle(x, y, vx, vy, size, color, life));
    }
  }

  // 4. Gold / Neon Spark Fireworks (Gacha SSR/UR Card Flip & Shoukaku)
  createGoldSparksFX(x, y, count = 50, colorType = 'gold') {
    let colors = ['#ffd700', '#ffaa00', '#ffffff', '#ffea70'];
    if (colorType === 'rainbow') {
      colors = ['#00ff88', '#00f3ff', '#ff007f', '#ffd700', '#ffffff'];
    } else if (colorType === 'ssr') {
      colors = ['#ff007f', '#ffd700', '#ff5500', '#ffffff'];
    }

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 180 + Math.random() * 550;
      const size = 3 + Math.random() * 6;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const life = 0.6 + Math.random() * 0.6;

      this.particles.push(new SparkParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, size, color, life));
    }
  }

  // Screen Flash
  flash(color = 'rgba(255, 255, 255, 0.8)', duration = 200) {
    const el = document.getElementById('flash-overlay');
    if (!el) return;
    el.style.backgroundColor = color;
    el.style.opacity = '1';
    setTimeout(() => {
      el.style.opacity = '0';
    }, duration);
  }

  // Screen Shake (Disabled completely while viewing ToDo screen)
  screenShake(intensity = 10, duration = 300) {
    const todoSection = document.getElementById('section-todo');
    if (todoSection && todoSection.classList.contains('active')) {
      const app = document.getElementById('app');
      if (app) app.style.transform = 'translate(0px, 0px)';
      return;
    }

    const app = document.getElementById('app');
    if (!app) return;

    const start = performance.now();
    const shake = () => {
      // Check again during shake animation in case user switched to ToDo
      if (todoSection && todoSection.classList.contains('active')) {
        app.style.transform = 'translate(0px, 0px)';
        return;
      }

      const elapsed = performance.now() - start;
      if (elapsed < duration) {
        const decay = 1 - (elapsed / duration);
        const dx = (Math.random() * 2 - 1) * intensity * decay;
        const dy = (Math.random() * 2 - 1) * intensity * decay;
        app.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(shake);
      } else {
        app.style.transform = 'translate(0px, 0px)';
      }
    };
    shake();
  }

  // Damage Number Floater / Floating Text
  createFloatingText(x, y, text, color = '#ffd700', fontSize = 24, isCrit = false) {
    const container = document.getElementById('damage-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `damage-popup ${isCrit ? 'is-crit' : ''}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    if (fontSize) el.style.fontSize = `${fontSize}px`;

    container.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 900);
  }

  createDamagePopup(x, y, text, isCrit = false, color = '#ff0055') {
    this.createFloatingText(x, y, text, color, isCrit ? 32 : 22, isCrit);
  }
}

// --- Particle Classes ---
class ShardParticle {
  constructor(x, y, vx, vy, size, color, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.rotation = Math.random() * Math.PI * 2;
    this.vRot = (Math.random() - 0.5) * 10;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 450 * dt; // gravity
    this.rotation += this.vRot * dt;
    this.life -= dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }
}

class SmokeExplosionParticle {
  constructor(x, y, vx, vy, size, color, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.life = life;
    this.maxLife = life;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.94;
    this.vy *= 0.94;
    this.size += 15 * dt;
    this.life -= dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class ConfettiParticle {
  constructor(x, y, vx, vy, size, color, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.rotation = Math.random() * Math.PI * 2;
    this.vRot = (Math.random() - 0.5) * 8;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.vRot * dt;
    this.life -= dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    ctx.restore();
  }
}

class SparkParticle {
  constructor(x, y, vx, vy, size, color, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.life = life;
    this.maxLife = life;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.92;
    this.vy *= 0.92;
    this.vy += 120 * dt;
    this.life -= dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export const fx = new FXEngine();
