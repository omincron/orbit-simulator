// ── Physical constants ────────────────────────────────────────────────────────
const G = 6.674e-11;          // gravitational constant  (m³ kg⁻¹ s⁻²)
const EARTH_MASS = 5.972e24;  // Earth mass              (kg)
const EARTH_RADIUS = 6.371e6; // Earth mean radius       (m)  — display only

// ── Simulation timestep ───────────────────────────────────────────────────────
// dt = 10 s gives smooth Euler integration at LEO speeds (~7800 m/s).
const DT = 10;                // seconds per physics step
const R_MIN = 1e3;            // minimum radius clamp    (m)  — prevents ÷0

// ── Rendering ─────────────────────────────────────────────────────────────────
// LEO orbit radius ≈ 6.771e6 m.  We want that to fit comfortably on a ~400 px
// half-screen, so 1 pixel ≈ 20 000 m  →  scale = 5e-5 px/m.
const METERS_TO_PIXELS = 5e-5;         // px per metre
const EARTH_RADIUS_PX  = Math.max(2, EARTH_RADIUS * METERS_TO_PIXELS);
const SATELLITE_RADIUS_PX = 3;

// ── Loop limits ───────────────────────────────────────────────────────────────
const MAX_STEPS_PER_FRAME = 5;
const TRAIL_MAX_POINTS    = 2000;

// ── Initial conditions: circular LEO at ~400 km altitude ─────────────────────
// r₀ = 6.771e6 m,  v_circ = √(GM/r₀) ≈ 7672 m/s  (tangent, +y direction)
const ORBIT_RADIUS   = EARTH_RADIUS + 4e5;                   // 6.771e6 m
const ORBITAL_SPEED  = Math.sqrt(G * EARTH_MASS / ORBIT_RADIUS); // ≈ 7672 m/s

const canvas = document.getElementById("sim-canvas");
const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("2D canvas context is required.");
}

// Top-down view: +x → right (east), +y → up (north), origin = Earth centre.
// Satellite starts on the +x axis moving tangentially in the +y direction.
const satellite = {
  position: { x: ORBIT_RADIUS, y: 0 },
  velocity: { x: 0, y: ORBITAL_SPEED }
};

const trail = [];

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.floor(window.innerWidth * dpr);
  const height = Math.floor(window.innerHeight * dpr);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function computeGravityAcceleration(position) {
  const dx = -position.x;
  const dy = -position.y;
  const r = Math.hypot(dx, dy);
  const rSafe = Math.max(r, R_MIN);

  const a = (G * EARTH_MASS) / (rSafe * rSafe);
  const ax = a * (dx / rSafe);
  const ay = a * (dy / rSafe);

  return { x: ax, y: ay };
}

function assertFiniteState() {
  const values = [
    satellite.position.x,
    satellite.position.y,
    satellite.velocity.x,
    satellite.velocity.y
  ];

  for (const value of values) {
    if (!Number.isFinite(value)) {
      throw new Error("Invalid simulation state: encountered non-finite value.");
    }
  }
}

function stepPhysics() {
  const acceleration = computeGravityAcceleration(satellite.position);

  satellite.velocity.x += acceleration.x * DT;
  satellite.velocity.y += acceleration.y * DT;

  satellite.position.x += satellite.velocity.x * DT;
  satellite.position.y += satellite.velocity.y * DT;

  assertFiniteState();

  trail.push({ x: satellite.position.x, y: satellite.position.y });
  if (trail.length > TRAIL_MAX_POINTS) {
    trail.shift();
  }
}

function drawFilledCircle(x, y, radiusPx) {
  ctx.beginPath();
  ctx.arc(x, y, radiusPx, 0, Math.PI * 2);
  ctx.fill();
}

function drawScene() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Top-down view: simulation +y is screen-up, so invert y axis.
  // Scale converts metres → pixels.
  ctx.setTransform(METERS_TO_PIXELS, 0, 0, -METERS_TO_PIXELS, centerX, centerY);

  // Earth — blue circle sized to its real radius in the chosen scale.
  ctx.fillStyle = "#1a6fff";
  drawFilledCircle(0, 0, EARTH_RADIUS_PX / METERS_TO_PIXELS);

  // Orbit trail — thin white line.
  if (trail.length > 1) {
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1 / METERS_TO_PIXELS;
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length; i += 1) {
      ctx.lineTo(trail[i].x, trail[i].y);
    }
    ctx.stroke();
  }

  // Satellite — bright white dot.
  ctx.fillStyle = "#fff";
  drawFilledCircle(
    satellite.position.x,
    satellite.position.y,
    SATELLITE_RADIUS_PX / METERS_TO_PIXELS
  );
}

let accumulator = 0;
let previousTimeSeconds = performance.now() / 1000;

function frame() {
  const nowSeconds = performance.now() / 1000;
  let frameDelta = nowSeconds - previousTimeSeconds;
  previousTimeSeconds = nowSeconds;

  if (!Number.isFinite(frameDelta) || frameDelta < 0) {
    frameDelta = 0;
  }

  accumulator += frameDelta;

  let steps = 0;
  while (accumulator >= DT && steps < MAX_STEPS_PER_FRAME) {
    stepPhysics();
    accumulator -= DT;
    steps += 1;
  }

  if (steps === MAX_STEPS_PER_FRAME && accumulator > DT) {
    accumulator = 0;
  }

  drawScene();
  requestAnimationFrame(frame);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

trail.push({ x: satellite.position.x, y: satellite.position.y });
requestAnimationFrame(frame);
