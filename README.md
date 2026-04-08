# Orbit Simulator

Orbit Simulator is a lightweight, browser-based project for building physically grounded orbital mechanics simulations step by step.

## Project Direction

This repository is intended to evolve from a minimal 2D Earth-satellite simulation into a progressively richer orbital simulation toolkit while preserving:

- deterministic physics updates
- clear unit handling
- simple, readable implementation
- minimal dependencies

## What the Simulator Shows

### In plain terms

A single satellite is shown orbiting Earth, viewed from directly above the North Pole.
Earth sits at the center. The satellite moves around it in a curved path because gravity
constantly pulls it inward. If it moves too slowly it falls toward Earth; too fast and it
flies away. At just the right speed it keeps going around in a stable loop — that is an orbit.
The simulator starts the satellite at that exact speed so you can watch it circle continuously.

### Scientific explanation

The simulation models a two-body Newtonian gravitational system in the orbital plane (x-y).

Earth is treated as a point mass fixed at the origin with mass $M = 5.972 \times 10^{24}$ kg.
The satellite has no mass of its own and is subject only to the gravitational acceleration:

$$\vec{a} = -\frac{GM}{r^2}\hat{r}$$

where $r = \|\vec{r}\|$ is the distance from Earth's center and $\hat{r}$ is the unit vector
pointing from Earth to the satellite.

Initial conditions are set to a circular Low Earth Orbit at 400 km altitude:

$$r_0 = R_\oplus + 400\,\text{km} \approx 6.771 \times 10^6\,\text{m}$$

$$v_\text{circ} = \sqrt{\frac{GM}{r_0}} \approx 7672\,\text{m/s (tangential)}$$

Integration uses semi-implicit (symplectic) Euler with a fixed timestep of $\Delta t = 1\,\text{s}$,
which conserves orbital energy better than explicit Euler over long simulation runs.
Simulation time is scaled at $60\times$ real time and rendered with sub-step interpolation
for smooth visual output independent of frame rate.

## Current Scope

Step 1 focuses on a top-down 2D Newtonian gravity simulation using HTML Canvas and vanilla JavaScript.

Step 1.5 refines runtime quality while preserving deterministic fixed-step physics:

- semi-implicit Euler integration
- fixed-step accumulator with interpolation rendering
- explicit simulation time scaling for observable motion

Step 2 adds user-facing observation tools:

- a speed control slider to raise or lower orbital speed
- a reset action to restore the starting circular orbit
- on-screen telemetry for speed, altitude, radius, orbit ratio, and simulation time

## Documentation Policy

Implementation changes must be documented in the project guide files as part of the same work, including what changed, why, and how it affects physics or determinism.
