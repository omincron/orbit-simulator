# Implementation Consistency Guidelines (Step 1 Orbit Simulator)

## Purpose

Use this document with the Step 1 spec to ensure every implementation is consistent, maintainable, and reviewable.

## Required File Layout

Use this exact baseline layout at repo root:
- `/index.html`
- `/styles.css`
- `/main.js`

Optional files (still at repo root):
- `/physics.js`
- `/render.js`
- `/constants.js`

Rules:
- CSS must always be in `/styles.css` (no inline `<style>` blocks, no style attributes)
- JavaScript must be in module files (no inline `<script>` logic other than module import wiring)
- No additional directories for Step 1
- Overlay UI for later steps is allowed, but it must remain lightweight and be declared explicitly in the guide for that step

## Separation of Concerns

- `index.html`: structure only (canvas, optional overlay controls/readouts, script/css links)
- `styles.css`: visual styling only
- `main.js`: app bootstrap, animation loop orchestration
- `physics.js` (optional): gravity and integrator logic
- `render.js` (optional): canvas drawing logic
- `constants.js` (optional): all tunable constants in one place

## Determinism Rules

- Use a fixed timestep (`dt`) for physics updates
- Do not tie physics updates directly to render frame duration
- Use an accumulator loop for fixed-step stepping
- Apply a maximum physics steps per frame cap to avoid spiral-of-death
- Keep initialization values constant unless the task explicitly says otherwise

## Physics and Units Rules

- Keep physics calculations in simulation units consistently
- Convert to pixels only in rendering code
- Keep viewpoint top-down in the x-y plane with Earth fixed at origin
- Use explicit named constants for all physics parameters
- Guard small-radius divisions with a fixed minimum radius clamp
- Avoid hidden conversions inside generic helpers
- Keep SI constants and initial conditions physically consistent (avoid placeholder local-space values)

## Rendering Rules

- Canvas rendering only
- Later-step controls and telemetry may use DOM overlay elements outside the canvas
- Center-origin coordinate system must be explicit and consistent
- Clear canvas every frame before draw calls
- Draw order must be stable: background, Earth, trail (if any), satellite
- Trail sampling (if enabled) must happen on fixed physics steps, not variable render frames

## Code Quality Rules

- Prefer small, single-purpose functions
- Prefer pure functions for physics calculations where possible
- Avoid classes unless there is clear value
- No dead code, commented-out code, or placeholder stubs in final output
- Use clear names (`position`, `velocity`, `acceleration`, `dt`)
- Keep comments short and only where math or flow is non-obvious

## Constant Management

Declare all magic values as named constants near the top level (or in `constants.js`), for example:
- `G`
- `EARTH_MASS`
- `DT`
- `R_MIN`
- `METERS_TO_PIXELS`
- `MAX_STEPS_PER_FRAME`
- `TRAIL_MAX_POINTS`

Do not hardcode these values in multiple files.

## Error and Edge Handling

- Handle very small `r` safely using `r_safe = max(r, R_MIN)`
- Ensure no `NaN` or `Infinity` state values propagate
- If invalid state is detected, fail fast in console with a clear error

## Performance Baseline

- Keep per-frame allocations minimal
- Reuse arrays/objects when practical (especially for trail buffers)
- Limit trail length with fixed upper bound
- Avoid expensive logging inside tight loops

## HTML and CSS Baseline

- `index.html` includes only essentials: charset, viewport, title, stylesheet link, canvas, optional step-specific overlay controls/readouts, module script
- `styles.css` sets:
  - black page/canvas background
  - no scrollbars
  - canvas displayed as block
  - centered or full-window canvas behavior per chosen approach

## Review Checklist (Definition of Done)

- File layout matches required structure
- CSS is fully externalized in `/styles.css`
- Physics update is fixed-step and deterministic
- Gravity and Euler update math match spec formulas
- No division-by-zero risk
- Visual output matches minimal style constraints
- No UI controls or overlays added
- Runs directly by opening `index.html` in a browser

## Change Control for Future Steps

- Keep Step 1 minimal; do not pre-implement Step 2+ features
- Add new capabilities only behind explicit step requirements
- Preserve existing constants and defaults unless change is requested
- Document any intentional deviation from Step 1 spec in PR/commit notes

## Documentation Requirement

For every non-trivial implementation change, update the relevant guide file in the same change set so future contributors can follow both what changed and why.

Minimum documentation updates per change:
- What was changed
- Why it was changed
- Constants or formulas introduced or modified
- Any deterministic-loop or numerical-stability implications

## Process Traceability

Maintain a chronological process log section in the simulation guide (`SIMULATION_GUIDE.md`) with concise entries describing:
- baseline implementation
- correctness fixes
- refinement steps (for example Step 1.5)

The log should be short, technical, and specific enough for a new contributor to reconstruct the implementation path.
