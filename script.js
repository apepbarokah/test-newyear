// Canvas Setup
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const bgMusic = document.getElementById("bgMusic"); // Tambahkan ini
let musicPlaying = false;

// State Variables
let animationId;
let isPaused = false;
let particles = [];
let rockets = [];
let autoLaunchInterval;
let settings = {
  size: 3,
  speed: 1,
  autoLaunch: true,
  color: "romantic",
  intensity: "medium",
};

// Color Themes
const colorThemes = {
  romantic: ["#ff0066", "#ff3385", "#ff66a3", "#ffb3d9", "#ff1744", "#ff5252"],
  golden: ["#ffd700", "#ffed4e", "#fff9c4", "#ffffff", "#e6e6e6", "#cccccc"],
  rainbow: ["#ff0043", "#14fc56", "#1e7fff", "#e60aff", "#ffbf36", "#ffffff"],
  royal: ["#7c4dff", "#9c27b0", "#3f51b5", "#2196f3", "#00bcd4", "#b39ddb"],
  passion: ["#ff0000", "#ff1744", "#ff5252", "#ff8a80", "#ffcdd2", "#ffffff"],
};

// Generate Stars
function createStars() {
  const container = document.getElementById("starsContainer");
  const starCount = window.innerWidth < 768 ? 50 : 100;

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.animationDelay = Math.random() * 3 + "s";
    container.appendChild(star);
  }
}

// Screen Navigation
function goToScreen2() {
  document.getElementById("screen1").classList.add("fade-out");
  setTimeout(() => {
    document.getElementById("screen1").classList.add("hidden");
    document.getElementById("screen2").classList.remove("hidden");
  }, 1000);
}

function goToScreen3() {
  document.getElementById("screen2").classList.add("fade-out");
  setTimeout(() => {
    document.getElementById("screen2").classList.add("hidden");
    document.getElementById("screen3").classList.remove("hidden");
    bgMusic
      .play()
      .then(() => {
        musicPlaying = true;
        document.getElementById("musicToggle").textContent = "🎵";
      })
      .catch((err) => {
        console.log("Autoplay prevented:", err);
        musicPlaying = false;
        document.getElementById("musicToggle").textContent = "🔇";
      });
    resizeCanvas();
    animate();
    startAutoLaunch();
  }, 1000);
}

// Music Control
function toggleMusic() {
  if (musicPlaying) {
    bgMusic.pause();
    document.getElementById("musicToggle").textContent = "🔇";
    musicPlaying = false;
  } else {
    bgMusic
      .play()
      .then(() => {
        document.getElementById("musicToggle").textContent = "🎵";
        musicPlaying = true;
      })
      .catch((err) => {
        console.log("Play prevented:", err);
      });
  }
}

// Canvas Resize
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Auto Launch Fireworks
function startAutoLaunch() {
  if (autoLaunchInterval) clearInterval(autoLaunchInterval);

  if (settings.autoLaunch) {
    const delays = {
      low: 2000,
      medium: 1200,
      high: 800,
      extreme: 400,
    };

    autoLaunchInterval = setInterval(() => {
      if (!isPaused) {
        launchRocket();
        if (settings.intensity === "extreme" || settings.intensity === "high") {
          setTimeout(() => launchRocket(), 200);
        }
      }
    }, delays[settings.intensity]);
  }
}

// Control Functions
function togglePause() {
  isPaused = !isPaused;
}

function toggleSettings() {
  document.getElementById("settingsPanel").classList.toggle("open");
}

function updateSettings() {
  settings.size = parseInt(document.getElementById("sizeSelect").value);
  settings.speed = parseFloat(document.getElementById("speedRange").value);
  settings.autoLaunch = document.getElementById("autoLaunch").checked;
  settings.color = document.getElementById("colorSelect").value;
  settings.intensity = document.getElementById("intensitySelect").value;
  startAutoLaunch();
}

// Particle Class
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * (3 + settings.size * 1.5) + 2;
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    this.alpha = 1;
    this.decay = Math.random() * 0.015 + 0.008;
    this.gravity = 0.08;
    this.size = Math.random() * 3 + 1;
    this.brightness = Math.random() * 0.5 + 0.5;
    this.friction = 0.98;
  }

  update() {
    this.velocity.y += this.gravity;
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;
    this.x += this.velocity.x * settings.speed;
    this.y += this.velocity.y * settings.speed;
    this.alpha -= this.decay;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Create radial gradient for realistic glow
    const gradient = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.size * 3
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.5, this.color + "80");
    gradient.addColorStop(1, "transparent");

    ctx.fillStyle = gradient;
    ctx.shadowBlur = 15 * this.brightness;
    ctx.shadowColor = this.color;

    // Draw main particle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Add extra bright core
    ctx.fillStyle = "rgba(255, 255, 255, " + this.alpha * 0.8 + ")";
    ctx.shadowBlur = 5;
    ctx.shadowColor = "white";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Rocket Class
class Rocket {
  constructor(x) {
    this.x = x || Math.random() * canvas.width;
    this.y = canvas.height;
    this.targetY = Math.random() * canvas.height * 0.4 + canvas.height * 0.1;
    this.velocity = -10;
    this.exploded = false;
    this.trail = [];
  }

  update() {
    if (!this.exploded) {
      this.y += this.velocity * settings.speed;
      this.trail.push({ x: this.x, y: this.y, alpha: 1 });
      if (this.trail.length > 10) this.trail.shift();

      if (this.y <= this.targetY) {
        this.explode();
        this.exploded = true;
      }
    }
  }

  explode() {
    const colors = colorThemes[settings.color];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const particleCount = 80 * settings.size;

    // Main explosion
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(this.x, this.y, color));
    }

    // Add secondary burst for more realism
    setTimeout(() => {
      const secondColor = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < particleCount * 0.5; i++) {
        particles.push(new Particle(this.x, this.y, secondColor));
      }
    }, 100);

    // Heart shape explosion for romantic theme
    if (settings.color === "romantic" && Math.random() < 0.3) {
      this.createHeartExplosion();
    }
  }

  createHeartExplosion() {
    const colors = colorThemes[settings.color];
    for (let i = 0; i < 50; i++) {
      const t = (i / 50) * Math.PI * 2;
      const x = this.x + 16 * Math.pow(Math.sin(t), 3);
      const y =
        this.y -
        (13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t));
      particles.push(new Particle(x, y, colors[0]));
    }
  }

  drawTail() {
    // Draw realistic rocket tail with glow
    ctx.save();
    const gradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + 30
    );
    gradient.addColorStop(0, "rgba(255, 200, 100, 0.8)");
    gradient.addColorStop(0.5, "rgba(255, 100, 50, 0.6)");
    gradient.addColorStop(1, "rgba(255, 50, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff6600";
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - 3, this.y + 15);
    ctx.lineTo(this.x + 3, this.y + 15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  draw() {
    if (!this.exploded) {
      // Draw realistic tail first
      this.drawTail();

      // Draw trail with particles
      this.trail.forEach((point, index) => {
        ctx.save();
        ctx.globalAlpha = point.alpha * (index / this.trail.length);
        const gradient = ctx.createRadialGradient(
          point.x,
          point.y,
          0,
          point.x,
          point.y,
          3
        );
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.5, "rgba(255, 200, 100, 0.8)");
        gradient.addColorStop(1, "rgba(255, 100, 50, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw rocket head with glow
      ctx.save();
      const gradient = ctx.createRadialGradient(
        this.x,
        this.y,
        0,
        this.x,
        this.y,
        5
      );
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.5, "rgba(255, 200, 150, 0.8)");
      gradient.addColorStop(1, "rgba(255, 100, 100, 0)");
      ctx.fillStyle = gradient;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "white";
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

// Launch Rocket
function launchRocket(x) {
  rockets.push(new Rocket(x));
}

// Animation Loop
function animate() {
  if (!isPaused) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    rockets.forEach((rocket, index) => {
      rocket.update();
      rocket.draw();
      if (rocket.exploded && rocket.y > canvas.height + 100) {
        rockets.splice(index, 1);
      }
    });

    particles.forEach((particle, index) => {
      particle.update();
      particle.draw();
      if (particle.alpha <= 0 || particle.y > canvas.height) {
        particles.splice(index, 1);
      }
    });
  }

  animationId = requestAnimationFrame(animate);
}

// Event Listeners
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  launchRocket(x);
});

// Touch support for mobile
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  launchRocket(x);
});

window.addEventListener("resize", () => {
  resizeCanvas();
});

// Close settings panel when clicking outside
document.addEventListener("click", (e) => {
  const settingsPanel = document.getElementById("settingsPanel");
  const settingsBtn = document.querySelector(
    ".controls .control-btn:last-child"
  );

  if (
    settingsPanel.classList.contains("open") &&
    !settingsPanel.contains(e.target) &&
    e.target !== settingsBtn &&
    !settingsBtn.contains(e.target)
  ) {
    settingsPanel.classList.remove("open");
  }
});

// Initialize
createStars();

// Prevent context menu on long press (mobile)
canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && musicPlaying) {
    bgMusic.pause();
  } else if (!document.hidden && musicPlaying) {
    bgMusic.play().catch((err) => console.log("Play prevented:", err));
  }
});
