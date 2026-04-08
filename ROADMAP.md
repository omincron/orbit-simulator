# Orbit Simulator — Roadmap

This document lists all identified improvement directions for the simulator.
Each item is self-contained so a contributor can pick any one and implement it independently.
Items are grouped by category. Effort ratings assume familiarity with the existing codebase.

---

## Physics Accuracy

### Velocity Verlet integrator
**Effort:** Low  
Replace the current semi-implicit Euler integration in `stepPhysics()` with Velocity Verlet.
Velocity Verlet conserves orbital energy and angular momentum over hundreds of orbits,
eliminating the slow outward spiral that explicit and semi-implicit Euler accumulate over time.

Update rule:
```
a_n    = gravity(x_n)
x_n+1  = x_n + v_n * dt + 0.5 * a_n * dt²
a_n+1  = gravity(x_n+1)
v_n+1  = v_n + 0.5 * (a_n + a_n+1) * dt
```

Document the change in `SIMULATION_GUIDE.md` as Step 3.

---

### RK4 integrator
**Effort:** Medium  
Implement a fourth-order Runge–Kutta integrator for higher accuracy on elliptical orbits
and multi-burn maneuver scenarios. Noticeable improvement over Velocity Verlet only at
larger timesteps or highly eccentric orbits.

---

### Orbital energy and angular momentum display
**Effort:** Low  
Add two telemetry readouts to the HUD drawer:

- Specific orbital energy: `ε = v² / 2 − μ / r`  where `μ = G * M`
- Specific angular momentum magnitude: `h = |r × v|` (in 2D: `h = x * vy − y * vx`)

These should remain nearly constant for a stable orbit. Watching them drift exposes
integrator error and makes the simulator a direct teaching tool for conservation laws.

---

### Atmospheric drag model
**Effort:** Medium  
Add a drag deceleration opposing the velocity vector, scaled by an exponential atmospheric
density model based on altitude:

```
ρ(h) = ρ₀ * exp(−h / H)
```

where `ρ₀ ≈ 1.225 kg/m³` at sea level and `H ≈ 8500 m` is the scale height.
Drag force: `F_drag = −0.5 * Cd * A * ρ * v²` in the velocity direction.
Orbits will visibly decay and spiral inward without thruster input.
Add a `DRAG_ENABLED` constant to toggle it.

---

### J2 perturbation
**Effort:** High  
Model Earth's equatorial bulge (J2 term of the geopotential). This causes a secular drift
of the orbital plane and argument of perigee over time — the main perturbation for real LEO
satellites. Relevant for a future multi-orbit or constellation simulation.

---

## Orbital Mechanics Features

### Escape velocity indicator
**Effort:** Low  
Add a telemetry row or visual marker showing whether the satellite is above or below local
escape velocity:

```
v_esc = sqrt(2 * G * M / r)  =  sqrt(2) * v_circ
```

When `v ≥ v_esc`, mark the telemetry in a distinct color and display "ESCAPE TRAJECTORY".

---

### Orbital period display
**Effort:** Low  
Compute and display the orbital period from the current semimajor axis via Kepler's third law:

```
T = 2π * sqrt(a³ / (G * M))
```

For a circular orbit, `a = r`. For an ellipse derived from current `ε`, use `a = −μ / (2ε)`.
Show it in the telemetry drawer in minutes.

---

### Apogee and perigee markers
**Effort:** Medium  
From the current position, velocity, and energy, compute the semimajor axis and eccentricity
of the instantaneous conic section. Project and draw the apogee and perigee points on the
canvas as small labeled markers. Update them each physics step.

Formulas:
```
ε  = v² / 2 − μ / r
a  = −μ / (2ε)                      (negative ε = bound orbit)
e  = sqrt(1 + 2 * ε * h² / μ²)
r_peri  = a * (1 − e)
r_apo   = a * (1 + e)
```

---

### Orbit prediction overlay
**Effort:** Medium  
Draw the analytical Keplerian conic for the current state as a faded dashed ellipse on the
canvas. Uses the same orbital elements as the apogee/perigee calculation. Updated when the
user moves the speed slider or after each physics step. This is separate from the trail —
the trail is historical, the overlay is predictive.

---

### Hohmann transfer maneuver
**Effort:** Medium  
Add a second altitude control to the HUD. Compute and display the two required delta-v burns
to transfer from the current circular orbit to the target altitude:

```
Δv₁ = v_transfer_peri − v_current
Δv₂ = v_target − v_transfer_apo
```

Apply the first burn immediately as a tangential velocity change. After half an orbital period
detect apogee and apply the second burn automatically.
Visualise the transfer orbit as a distinct overlay arc.

---

### Multiple scenario presets
**Effort:** Low  
Add a small preset selector (dropdown or set of buttons) with named starting states:

| Preset | Position | Speed factor | Notes |
|---|---|---|---|
| LEO Circular | 400 km alt | 1.00× | Default |
| Low ellipse | 400 km alt | 0.85× | Perigee near surface |
| High ellipse | 400 km alt | 1.15× | Apogee ~2000 km |
| Near escape | 400 km alt | 1.39× | Just below escape |
| Retrograde | 400 km alt | −1.00× | Reverse direction |

These exercise the full range of orbit types without requiring manual slider adjustment.

---

## Visualization

### Velocity and gravity vector arrows
**Effort:** Low  
Draw two arrows from the satellite on the canvas:

- Velocity vector: direction of current velocity, length proportional to speed
- Gravity vector: direction toward Earth center, length proportional to acceleration magnitude

Scale both to a fixed maximum pixel length. Toggle visibility with a button in the HUD bar.

---

### Altitude reference ring
**Effort:** Low  
Draw a dashed circle on the canvas showing the radius of the initial circular orbit.
Serves as a visual reference when the orbit changes after a speed adjustment.
Optionally add a second ring for the current apogee or a target altitude.

---

### Dynamic trail fade
**Effort:** Low  
Instead of a uniform semi-transparent trail, fade the trail from full opacity near the
satellite to transparent at the oldest point. Computed by varying `strokeStyle` alpha as
a function of trail index. Makes the direction of travel and recent trajectory immediately
readable.

---

### Zoom and pan
**Effort:** Medium  
Add a `cameraScale` and `cameraOffset` state. Allow scroll-wheel zoom and click-drag pan.
Optionally add a "follow satellite" mode that keeps the satellite centered.
All coordinate conversions in `drawScene` pass through the camera transform.

---

### Earth atmosphere glow
**Effort:** Low  
Draw a radial gradient halo around Earth as its bottom-most layer to represent the atmosphere.
Use a transparent-to-blue gradient between `EARTH_RADIUS` and `EARTH_RADIUS + 100 km` in
simulation units.

---

### Ground track
**Effort:** Medium  
For a top-down inertial view, compute the sub-satellite point as the angle of the position
vector. Draw tick marks or a colored arc on the Earth circle representing where the satellite
has passed over. If Earth rotation is added (a `EARTH_ROTATION_RATE` constant), the ground
track becomes a moving non-repeating curve.

---

## Simulation Controls

### Pause and play
**Effort:** Low  
Add a pause state boolean. When paused, skip the `stepPhysics` calls and `requestAnimationFrame`
re-queues on each frame but advances no simulation time. Add a toggle button (⏸ / ▶) to the HUD
bar next to the reset button.

---

### Single-step button
**Effort:** Low  
Add a step button (⏭) that, when paused, calls `stepPhysics()` exactly once and redraws.
Useful for studying integrator behavior frame by frame.

---

### Time scale control
**Effort:** Low  
Replace the fixed `TIME_SCALE = 60` constant with a variable driven by a second slider or
set of preset speed buttons (1×, 10×, 60×, 300×). Allows watching slow maneuvers in real
time or fast-forwarding through many orbits.

---

### Manual velocity direction control
**Effort:** Medium  
Expose the velocity direction as a second control — a bearing angle relative to the tangent.
Combined with the speed slider this allows prograde, retrograde, radial, and normal burns.
A complete delta-v interface that makes the simulator usable for teaching orbital maneuvers.

---

### Scenario save and restore
**Effort:** Medium  
Serialize the simulation state (`position`, `velocity`, `simulationTimeSeconds`) to a JSON
string and write it to `localStorage`. Add save and load buttons to the HUD. Allows bookmarking
interesting orbital configurations.

---

## Project Architecture

### Modularize into physics.js, render.js, constants.js
**Effort:** Low  
The guide already defines this split. Extract:

- `constants.js` — all named constants
- `physics.js` — `computeGravityAcceleration`, `stepPhysics`, `checkCrash`, orbital element helpers
- `render.js` — `drawScene`, `drawCrashOverlay`, `drawFilledCircle`, `lerp`
- `main.js` — bootstrap, loop, DOM wiring only

Each module uses ES module `export` / `import`. No bundler required.

---

### Unit tests for physics functions
**Effort:** Medium  
Add a `tests/` directory with a lightweight test runner (no framework — plain `<script type="module">`
assertions or Node.js `assert`). Cover:

- Gravity acceleration magnitude and direction at known positions
- Circular orbit speed formula
- Integrator energy conservation over one full orbit
- Crash detection boundary condition

---

### Second body: the Moon
**Effort:** High  
Add a second gravitational body with Moon mass (`7.342e22 kg`) at a scaled orbital distance.
Each step computes gravity from both Earth and Moon. Produces figure-eight trajectories,
Lagrange-point dynamics, and gravitational capture/escape scenarios.
Requires the architecture modularization step first for clean body management.

---

### Multiple satellites
**Effort:** High  
Replace the single `satellite` object with an array of satellite states. Each step
integrates all satellites independently. Renders all trails and dots.
Interesting for formation flying, collision probability visualization, and constellation patterns.

---

## Recommended starting points by goal

| Goal | Start with |
|---|---|
| Better physics accuracy | Velocity Verlet integrator |
| Educational / teaching use | Orbital period + escape velocity indicator + apogee/perigee markers |
| Richer interactivity | Pause/play + time scale slider + velocity vector arrow |
| Visual realism | Dynamic trail fade + atmosphere glow + zoom/pan |
| Maneuver simulation | Hohmann transfer + manual velocity direction control |
| Long-term maintainability | Modularize into physics.js / render.js + unit tests |
| Advanced simulation | Atmospheric drag + second body (Moon) |
