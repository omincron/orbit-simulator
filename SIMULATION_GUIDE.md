# Orbit Simulator — Simulation Guide

This file is the single growing reference for all implementation steps.
Each step is documented in sequence so contributors can follow the full build process.

This guide must be used together with `IMPLEMENTATION_CONSISTENCY_GUIDELINES.md`.
If there is any ambiguity, follow both documents and choose the stricter constraint.

## Objective

Implement a minimal 2D simulation of a satellite orbiting Earth using Newtonian gravity.

Priorities:
- Correctness
- Simplicity
- Deterministic behavior

Non-goals:
- UI
- Frameworks
- Visual embellishments

## Strict Constraints

- Use vanilla JavaScript only (no frameworks, no external libraries)
- No build tooling (no Vite, Webpack, etc.)
- Use a single HTML file plus ES module JavaScript files
- Render with the HTML Canvas API only
- No UI controls (sliders, buttons, panels)
- Minimal visuals only:
  - Black background
  - White Earth (circle)
  - White satellite (dot)
  - Optional thin single-color orbit trail
- No text overlays (optional debug console logs are allowed)
- Deterministic update loop with a required fixed `dt`

## Units and Coordinates

- Run physics in simulation units based on SI-style relationships:
  - Position in meters
  - Velocity in meters/second
  - Time in seconds
- Point of view is required to be top-down (orthographic) from above Earth:
  - Earth is centered at the origin
  - Satellite motion is in the x-y plane only
- Apply meters-to-pixels conversion only when rendering.
- Use simulation coordinates with `+x` to the right and `+y` upward.
- Because canvas is y-down by default, convert on draw (for example by inverting y or transforming the context once).

## Core Physics Model

Satellite state:
- Position: `(x, y)`
- Velocity: `(vx, vy)`

Earth:
- Fixed position: `(0, 0)`
- Constant mass: `M`

Gravity:
- Acceleration magnitude: `a = (G * M) / r^2`
- Direction: unit vector from satellite to Earth
- Components:
  - `ax = a * (dx / r)`
  - `ay = a * (dy / r)`

## Numerical Integration

Use explicit Euler for Step 1:
- `vx += ax * dt`
- `vy += ay * dt`
- `x += vx * dt`
- `y += vy * dt`

Notes:
- Required fixed timestep: `dt = 10`
- Guard against division by zero using a fixed minimum radius clamp:
  - `R_MIN = 1e3`
  - `r_safe = max(r, R_MIN)`
  - Use `r_safe` in gravity calculations

## Constants

Define top-level constants:
- `G = 6.674e-11`
- `EARTH_MASS = 5.972e24`

Scaling:
- Use a required meters-to-pixels scale factor (for example `METERS_TO_PIXELS = 5e-5`)
- Keep scaling consistent for all rendered positions and sizes

## Initial Conditions

Use deterministic initial values:
- `EARTH_RADIUS = 6.371e6`
- `ORBIT_RADIUS = EARTH_RADIUS + 4e5`
- Position: `(ORBIT_RADIUS, 0)`
- Velocity: `(0, sqrt((G * EARTH_MASS) / ORBIT_RADIUS))`

Interpretation:
- These values are in simulation units defined above
- Keep these exact defaults for Step 1 comparability
- Do not replace these with placeholder values such as `(300, 0)` and `(0, 2)` when using SI constants

Expected behavior:
- Curved trajectory
- Stable orbit with correct tuning
- Escape or crash when initial velocity changes

## Rendering Requirements

Canvas:
- Full window or fixed size (for example `800x800`)
- Origin at the center of the canvas

Per frame:
1. Clear canvas
2. Draw Earth (centered circle)
3. Draw satellite (small circle)
4. Optionally draw trail with deterministic rules:
  - Sample trail points on fixed physics steps (not render frames)
  - Use a fixed maximum length (for example `TRAIL_MAX_POINTS = 2000`)
  - Drop oldest points first when full

Do not implement camera movement or zoom.

## Animation Loop

Use `requestAnimationFrame`.

Loop structure:
1. Fixed timestep physics update (not tied directly to frame rate)
2. Render after physics update

Recommended pattern:
- Accumulate elapsed frame time
- Advance physics in fixed `dt` increments
- Clamp catch-up work with a fixed cap (for example `MAX_STEPS_PER_FRAME = 5`) to prevent spiral-of-death behavior

## File Structure

Minimum:
- `/index.html`
- `/main.js`

Optional modularization:
- `/physics.js`
- `/render.js`

No additional directories.

## Execution Flow

1. Initialize canvas and rendering context
2. Translate coordinate system so origin is centered
3. Initialize Earth and satellite state
4. Start animation loop
5. Each frame:
   - Advance fixed-step physics
   - Render current state

## Success Criteria

- Satellite accelerates toward Earth
- Trajectory is curved (not linear)
- Stable orbit is achievable with proper velocity
- Behavior changes predictably with initial velocity

## Failure Conditions

- Satellite moves in a straight line (gravity not applied)
- Orbit diverges numerically (incorrect math or too-large `dt`)
- Satellite snaps or jitters (instability)
- Division-by-zero errors
- Earth appears static while only a brief line flashes through the center (typically caused by inconsistent units or non-physical initial values)

## Out of Scope

Do not implement:
- UI or interactivity
- Multiple bodies
- High-fidelity real-world unit accuracy beyond basic scaling
- Collision handling beyond simple visual overlap
- 3D rendering
- Advanced integrators (RK4, Verlet)
- Orbital maneuvers

## Notes for the Agent

- Prioritize correctness over abstraction
- Keep functions small and explicit
- Avoid unnecessary classes and patterns
- Use clear variable names
- Keep math readable and direct
- Use console logging only for debugging when needed

## Step 1.5 Refinement Profile

Step 1.5 keeps Step 1 constraints (single page, canvas only, deterministic fixed-step physics) while improving simulation quality and readability.

Required Step 1.5 changes:
- Integrator: use semi-implicit Euler (symplectic Euler)
  - `vx += ax * dt`
  - `vy += ay * dt`
  - `x += vx * dt`
  - `y += vy * dt`
- Fixed physics step: `dt = 1` second
- Add explicit simulation speed control: `TIME_SCALE = 60`
  - Meaning: 60 simulation seconds advance per real second
- Keep accumulator fixed-step loop with step cap
  - Use `MAX_STEPS_PER_FRAME = 12`
  - If overloaded, keep a bounded remainder instead of zeroing all accumulated time
- Render interpolation:
  - Keep previous and current physics positions
  - Interpolate rendered position with `alpha = accumulator / dt`
  - Trail sampling must still occur only on physics steps

Expected Step 1.5 behavior:
- Smoother apparent motion without changing deterministic fixed-step physics
- Better long-duration orbit quality versus naive explicit Euler stepping
- Stable real-time behavior under moderate frame jitter

## Implementation Process Log

This section records the implementation process so future contributors can reproduce decisions and avoid prior mistakes.

1. Baseline setup:
- Created root files: `/index.html`, `/styles.css`, `/main.js`
- Added deterministic fixed-step simulation loop and minimal canvas rendering

2. Correctness fix (units and viewpoint):
- Identified mismatch between SI constants and placeholder initial values
- Standardized top-down x-y orbital view with Earth at origin
- Switched to physically consistent LEO initial conditions in SI units
- Added guide warnings against placeholder values like `(300, 0)` and `(0, 2)` with SI constants

3. Step 1.5 refinement:
- Reduced fixed step to `dt = 1` for better integration quality
- Added `TIME_SCALE = 60` to keep orbit motion visible in real time
- Added interpolation using previous/current position for smooth rendering
- Updated accumulator overload handling to preserve bounded remainder time

## Deliverable

A single web page that runs without setup and shows a satellite orbiting Earth with a minimal, clean, physically correct simulation.
