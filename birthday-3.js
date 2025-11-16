// Combined 3-style fireworks with name effects
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let W = (canvas.width = innerWidth);
let H = (canvas.height = innerHeight);
window.addEventListener("resize", () => {
  W = canvas.width = innerWidth;
  H = canvas.height = innerHeight;
});

// UI
const modeButtons = document.querySelectorAll(".mode");
let MODE = "real";
modeButtons.forEach((b) => {
  b.addEventListener("click", () => {
    modeButtons.forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    MODE = b.dataset.mode;
  });
});
const launchBtn = document.getElementById("launch");
const autoChk = document.getElementById("auto");

launchBtn.addEventListener("click", () => spawnRocket(W * 0.5));

// overlay elements
const smokeName = document.getElementById("smokeName");
const premiumText = document.getElementById("premiumText");
const clap = document.getElementById("clap");
const bounceHolder = document.getElementById("bounceHolder");

// util
function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function randInt(a, b) {
  return Math.floor(rand(a, b + 1));
}

// Entities
class Rocket {
  constructor(x) {
    this.x = x ?? rand(W * 0.15, W * 0.85);
    this.y = H + 6;
    // this.vy = rand(-9.6, -7.6);
    // this.vx = rand(-0.6, 0.6);

    this.vy = rand(-13.6, -10.6);
    this.vx = rand(-0.9, 0.9);
    this.color = `hsl(${randInt(0, 360)},80%,60%)`;
    this.trail = [];
    this.size = 3 + Math.random() * 2;
  }
  update(dt) {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 10) this.trail.shift();
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 0.12 * dt;
  }
  draw() {
    // trail
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      ctx.globalAlpha = (i / this.trail.length) * 0.9;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Particle {
  constructor(x, y, color, opts = {}) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.age = 0;
    this.life = opts.life ?? randInt(50, 130);
    const speed = opts.speed ?? rand(1.2, 7.6);
    const angle = opts.angle ?? rand(0, Math.PI * 2);
    this.vx = Math.cos(angle) * speed + (opts.vx || 0);
    this.vy = Math.sin(angle) * speed + (opts.vy || 0);
    this.size = opts.size ?? rand(1, 3.2);
    this.gravity = opts.gravity ?? 0.02;
    this.shape = opts.shape || "circle";
    this.fade = opts.fade ?? 0.01;
    this.glow = opts.glow ?? false;
  }
  update(dt) {
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.age += dt;
  }
  draw() {
    const t = 1 - Math.min(1, this.age / this.life);
    ctx.globalAlpha = t;
    if (this.glow) {
      ctx.shadowBlur = 14;
      ctx.shadowColor = this.color;
    } else ctx.shadowBlur = 0;
    ctx.fillStyle = this.color;
    if (this.shape === "square")
      ctx.fillRect(
        this.x - this.size,
        this.y - this.size,
        this.size * 2,
        this.size * 2
      );
    else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

// engine store
const rockets = [];
const particles = [];

// spawn rocket
function spawnRocket(x) {
  rockets.push(new Rocket(x));
}

// explode functions
function explodeRealistic(x, y, color) {
  // dense bright particles + soft smoke
  const hueBase = randInt(0, 360);
  for (let i = 0; i < 90; i++) {
    particles.push(
      new Particle(x, y, `hsl(${hueBase + randInt(-30, 30)},85%,60%)`, {
        angle: rand(0, Math.PI * 2),
        speed: rand(2.2, 7.8),
        size: rand(1, 2.2),
        life: randInt(80, 160),
        gravity: 0.02,
        glow: true,
      })
    );
  }
  // smoke puffs (big slow)
  for (let i = 0; i < 12; i++) {
    particles.push(
      new Particle(
        x + rand(-30, 30),
        y + rand(-10, 10),
        "rgba(120,120,120,0.6)",
        {
          angle: rand(-Math.PI, Math.PI),
          speed: rand(0.2, 1.4),
          size: rand(10, 28),
          life: randInt(80, 160),
          gravity: -0.01,
          shape: "circle",
          glow: false,
        }
      )
    );
  }
  // show smoke-name float
  showSmokeName();
}

function explodeCartoon(x, y, color) {
  // colorful big blobs
  const colors = [
    "#ffcf6b",
    "#ff6fb2",
    "#7bdff0",
    "#ffd56b",
    "#8aff8a",
    "#ff8a8a",
  ];

  for (let i = 0; i < 36; i++) {
    particles.push(
      new Particle(
        // x + rand(-6, 6),
        // y + rand(-6, 6),
        x + rand(20, 20),
        y + rand(20, 20),
        colors[i % colors.length],
        {
          angle: rand(0, Math.PI * 2),
          speed: rand(0.6, 4.4),
          size: rand(6, 12),
          life: randInt(50, 105),
          gravity: 0.08, //0.08
          shape: i % 4 === 0 ? "square" : "circle", //4
        }
      )
    );
  }
  // bounce letters
  spawnBouncyText("Happy Birthday Afsana Tajnin Preo🥰");
}

function explodePremium(x, y, color) {
  // layer 1 - core glow
  const hue = randInt(30, 55); // golden-ish or any hue tweak
  for (let i = 0; i < 22; i++) {
    particles.push(
      new Particle(x, y, `hsl(${hue + randInt(-10, 10)},90%,60%)`, {
        angle: rand(0, Math.PI * 2),
        speed: rand(0.6, 2.4),
        size: rand(6, 14),
        life: randInt(50, 110),
        glow: true,
      })
    );
  }
  // layer 2 - streaks
  for (let i = 0; i < 140; i++) {
    particles.push(
      new Particle(x, y, `hsl(${randInt(hue - 40, hue + 40)},85%,60%)`, {
        angle: rand(0, Math.PI * 2),
        speed: rand(2.8, 10.2),
        size: rand(0.9, 2.6),
        life: randInt(40, 140),
        gravity: 0.015,
        glow: true,
      })
    );
  }
  // layer 3 - ring
  const ring = 36;
  for (let i = 0; i < ring; i++) {
    const ang = (i / ring) * Math.PI * 2;
    particles.push(
      new Particle(
        x + Math.cos(ang) * 8,
        y + Math.sin(ang) * 8,
        `hsl(${hue},85%,66%)`,
        {
          angle: ang + rand(-0.06, 0.06),
          speed: rand(0.8, 3.6),
          size: rand(2, 4.5),
          life: randInt(60, 130),
          gravity: 0.01,
          glow: true,
        }
      )
    );
  }
  // premium text + clap
  showPremiumText();
}

// mixed mode simply triggers all
function explodeMixed(x, y, color) {
  explodeRealistic(x, y, color);
  explodeCartoon(x + rand(-40, 40), y + rand(-20, 20), color);
  explodePremium(x + rand(-60, 60), y + rand(-30, 30), color);
}

// Name display functions
let smokeTimer = 0,
  premiumTimer = 0;
function showSmokeName() {
  smokeTimer = 120;
  smokeName.style.opacity = 1;
  smokeName.style.transform = "translateX(-50%) translateY(-18px) scale(1)";
}
function showPremiumText() {
  premiumTimer = 160;
  premiumText.style.opacity = 1;
  premiumText.style.transform = "translateX(-50%) translateY(-8px) scale(1)";
  // clap sparkle moment shortly
  setTimeout(() => {
    clap.style.opacity = 1;
    clap.style.transform = "translateX(-50%) scale(1.1)";
  }, 700);
  setTimeout(() => {
    clap.style.opacity = 0;
    clap.style.transform = "translateX(-50%) scale(0.9)";
  }, 2000);
}

// Cartoon bouncing letters pool
let bouncingLetters = [];
function spawnBouncyText(text) {
  // clear previous letters
  bounceHolder.innerHTML = "";
  bouncingLetters = [];
  // center position
  const startX = W / 2;
  // create span for each letter
  for (let i = 0; i < text.length; i++) {
    const span = document.createElement("span");
    span.className = "cartoon-letter";
    span.textContent = text[i];
    span.style.opacity = 1;
    span.style.display = "inline-block";
    span.style.transform = `translateY(${-rand(0, 20)}px)`;
    bounceHolder.appendChild(span);

    // letter physics
    bouncingLetters.push({
      el: span,
      x: startX + (i - text.length / 2) * 36 + rand(-8, 8),
      y: H * 0.18 + rand(-8, 8),
      vy: -rand(2, 6),
      vx: rand(-1.2, 1.2),
      rot: rand(-0.8, 0.8),
      life: randInt(80, 160),
    });
  }
}

// main loop
let last = performance.now();
function loop(now) {
  const dt = Math.min(2.4, (now - last) * 0.06);
  last = now;

  // background partial fade to get trails
  ctx.fillStyle = "rgba(3,4,8,0.22)";
  ctx.fillRect(0, 0, W, H);

  // spawn rockets auto
  // handled separately by interval

  // update rockets
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.update(dt);
    r.draw();
    if (r.vy > -1.2) {
      // explode according to MODE
      if (MODE === "real") explodeRealistic(r.x, r.y, r.color);
      else if (MODE === "cartoon") explodeCartoon(r.x, r.y, r.color);
      else if (MODE === "premium") explodePremium(r.x, r.y, r.color);
      else if (MODE === "mixed") explodeMixed(r.x, r.y, r.color);
      rockets.splice(i, 1);
    }
  }

  // update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update(dt);
    p.draw();
    if (p.age > p.life) particles.splice(i, 1);
  }

  // update bouncing letters (cartoon)
  for (let i = bouncingLetters.length - 1; i >= 0; i--) {
    const L = bouncingLetters[i];
    L.vy += 0.18 * dt; // gravity stronger for cartoon
    L.x += L.vx * dt * 10;
    L.y += L.vy * dt * 10;
    L.life--;
    // update element transform
    L.el.style.transform = `translate(${L.x - W / 2}px, ${
      L.y - H * 0.18
    }px) rotate(${L.rot * (1 - L.life / 200)}rad) scale(${
      1 + (1 - L.life / 200) * 0.15
    })`;
    if (L.life < 0) {
      L.el.style.opacity = 0;
      L.el.remove();
      bouncingLetters.splice(i, 1);
    }
  }

  // overlay name timers decay
  if (smokeTimer > 0) {
    smokeTimer--;
    smokeName.style.opacity = smokeTimer / 120;
    smokeName.style.transform = `translateX(-50%) translateY(${
      -18 - (120 - smokeTimer) / 4
    }px) scale(${1 + (120 - smokeTimer) / 600})`;
  } else {
    smokeName.style.opacity = 0;
  }
  if (premiumTimer > 0) {
    premiumTimer--;
    premiumText.style.opacity = premiumTimer / 160;
    premiumText.style.transform = `translateX(-50%) translateY(${
      -8 - (160 - premiumTimer) / 8
    }px) scale(${1 + (160 - premiumTimer) / 800})`;
  } else {
    premiumText.style.opacity = 0;
  }

  // small star twinkles
  if (Math.random() < 0.01) {
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(rand(0, W), rand(0, H), 1, 1);
  }

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// auto launching
let autoInterval = setInterval(() => {
  if (autoChk.checked) spawnRocket(rand(W * 0.15, W * 0.85));
}, 1600);

// small memory guard
setInterval(() => {
  if (particles.length > 6000) particles.splice(0, 3000);
}, 3000);
