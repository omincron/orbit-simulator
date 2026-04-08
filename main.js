const G = 6.674e-11;
const EARTH_MASS = 5.972e24;
const EARTH_RADIUS = 6.371e6;

const DT = 1;
const TIME_SCALE = 60;
const R_MIN = 1e3;

const METERS_TO_PIXELS = 5e-5;
const EARTH_RADIUS_PX = Math.max(2, EARTH_RADIUS * METERS_TO_PIXELS);
const SATELLITE_RADIUS_PX = 3;

const MAX_STEPS_PER_FRAME = 12;
const TRAIL_MAX_POINTS = 2000;

const ORBIT_RADIUS = EARTH_RADIUS + 4e5;
const ORBITAL_SPEED = Math.sqrt(G * EARTH_MASS / ORBIT_RADIUS);
const MIN_SPEED_FACTOR = 0.6;
const MAX_SPEED_FACTOR = 1.4;

const canvas = document.getElementById("sim-canvas");
const speedSlider = document.getElementById("speed-slider");
const speedFactorValue = document.getElementById("speed-factor-value");
const resetButton = document.getElementById("reset-button");
const speedReadout = document.getElementById("speed-readout");
const altitudeReadout = document.getElementById("altitude-readout");
const radiusReadout = document.getElementById("radius-readout");
const circularSpeedReadout = document.getElementById("circular-speed-readout");
const orbitRatioReadout = document.getElementById("orbit-ratio-readout");
const simTimeReadout = document.getElementById("sim-time-readout");

if (
  !canvas ||
  !speedSlider ||
  !speedFactorValue ||
  !resetButton ||
  !speedReadout ||
  !altitudeReadout ||
  !radiusReadout ||
  !circularSpeedReadout ||
  !orbitRatioReadout ||
  !simTimeReadout
) {
  throw new Error("Required DOM elements are missing.");
}

const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("2D canvas context is required.");
}

const satellite = {
  previousPosition: { x: ORBIT_RADIUS, y: 0 },
  position: { x: ORBIT_RADIUS, y: 0 },
  velocity: { x: 0, y: ORBITAL_SPEED }
};

const trail = [];

let simulationTimeSeconds = 0;
let accumulator = 0;
let previousTimeSeconds = performance.now() / 1000;

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

  return {
    x: a * (dx / rSafe),
    y: a * (dy / rSafe)
  };
}

function assertFiniteState() {
  const values = [
    satellite.previousPosition.x,
    satellite.previousPosition.y,
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

function formatKilometers(valueMeters, digits = 0) {
  return `${(valueMeters / 1000).toFixed(digits)} km`;
}

function formatKilometersPerSecond(valueMetersPerSecond, digits = 2) {
  return `${(valueMetersPerSecond / 1000).toFixed(digits)} km/s`;
}

function formatSimulationTime(totalSeconds) {
  const minutes = totalSeconds / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(1)} min`;
  }

  return `${(minutes / 60).toFixed(2)} h`;
}

function getRadius() {
  return Math.hypot(satellite.position.x, satellite.position.y);
}

function getSpeedMagnitude() {
  return Math.hypot(satellite.velocity.x, satellite.velocity.y);
}

function getCircularSpeedAtRadius(radius) {
  return Math.sqrt(G * EARTH_MASS / Math.max(radius, R_MIN));
}

function getTangentialUnitVector() {
  const radius = getRadius();
  const radiusSafe = Math.max(radius, R_MIN);

  return {
    x: -satellite.position.y / radiusSafe,
    y: satellite.position.x / radiusSafe
  };
}

function resetTrail() {
  trail.length = 0;
  trail.push({ x: satellite.position.x, y: satellite.position.y });
}

function updateTelemetry() {
  const radius = getRadius();
  const altitude = radius - EARTH_RADIUS;
  const speed = getSpeedMagnitude();
  const circularSpeed = getCircularSpeedAtRadius(radius);

  speedReadout.textContent = formatKilometersPerSecond(speed);
  altitudeReadout.textContent = formatKilometers(altitude);
  radiusReadout.textContent = formatKilometers(radius);
  circularSpeedReadout.textContent = formatKilometersPerSecond(circularSpeed);
  orbitRatioReadout.textContent = `${(speed / circularSpeed).toFixed(3)}x`;
  simTimeReadout.textContent = formatSimulationTime(simulationTimeSeconds);
}

function applySpeedFactor(speedFactor) {
  const clampedFactor = Math.min(MAX_SPEED_FACTOR, Math.max(MIN_SPEED_FACTOR, speedFactor));
  const radius = getRadius();
  const circularSpeed = getCircularSpeedAtRadius(radius);
  const tangentialDirection = getTangentialUnitVector();
  const newSpeed = circularSpeed * clampedFactor;

  satellite.previousPosition.x = satellite.position.x;
  satellite.previousPosition.y = satellite.position.y;
  satellite.velocity.x = tangentialDirection.x * newSpeed;
  satellite.velocity.y = tangentialDirection.y * newSpeed;

  speedSlider.value = clampedFactor.toFixed(2);
  speedFactorValue.textContent = `${clampedFactor.toFixed(2)}x`;

  resetTrail();
  updateTelemetry();
}

function resetToCircularOrbit() {
  satellite.previousPosition.x = ORBIT_RADIUS;
  satellite.previousPosition.y = 0;
  satellite.position.x = ORBIT_RADIUS;
  satellite.position.y = 0;
  satellite.velocity.x = 0;
  satellite.velocity.y = ORBITAL_SPEED;

  simulationTimeSeconds = 0;
  accumulator = 0;
  speedSlider.value = "1.00";
  speedFactorValue.textContent = "1.00x";

  resetTrail();
  updateTelemetry();
}

function stepPhysics() {
  satellite.previousPosition.x = satellite.position.x;
  satellite.previousPosition.y = satellite.position.y;

  const acceleration = computeGravityAcceleration(satellite.position);

  satellite.velocity.x += acceleration.x * DT;
  satellite.velocity.y += acceleration.y * DT;
  satellite.position.x += satellite.velocity.x * DT;
  satellite.position.y += satellite.velocity.y * DT;
  simulationTimeSeconds += DT;

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

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawScene(alpha) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  ctx.setTransform(METERS_TO_PIXELS, 0, 0, -METERS_TO_PIXELS, centerX, centerY);

  ctx.fillStyle = "#1a6fff";
  drawFilledCircle(0, 0, EARTH_RADIUS_PX / METERS_TO_PIXELS);

  if (trail.length > 1) {
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1 / METERS_TO_PIXELS;
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let index = 1; index < trail.length; index += 1) {
      ctx.lineTo(trail[index].x, trail[index].y);
    }
    ctx.stroke();
  }

  const satelliteX = lerp(satellite.previousPosition.x, satellite.position.x, alpha);
  const satelliteY = lerp(satellite.previousPosition.y, satellite.position.y, alpha);

  ctx.fillStyle = "#fff";
  drawFilledCircle(
    satelliteX,
    satelliteY,
    SATELLITE_RADIUS_PX / METERS_TO_PIXELS
  );
}

function frame() {
  const nowSeconds = performance.now() / 1000;
  let frameDelta = nowSeconds - previousTimeSeconds;
  previousTimeSeconds = nowSeconds;

  if (!Number.isFinite(frameDelta) || frameDelta < 0) {
    frameDelta = 0;
  }

  frameDelta = Math.min(frameDelta, 0.25);
  accumulator += frameDelta * TIME_SCALE;

  let steps = 0;
  while (accumulator >= DT && steps < MAX_STEPS_PER_FRAME) {
    stepPhysics();
    accumulator -= DT;
    steps += 1;
  }

  if (steps === MAX_STEPS_PER_FRAME && accumulator >= DT) {
    accumulator = DT - 1e-9;
  }

  drawScene(accumulator / DT);
  updateTelemetry();
  requestAnimationFrame(frame);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

speedSlider.addEventListener("input", (event) => {
  applySpeedFactor(Number(event.target.value));
});

resetButton.addEventListener("click", () => {
  resetToCircularOrbit();
});

resetToCircularOrbit();
requestAnimationFrame(frame);
