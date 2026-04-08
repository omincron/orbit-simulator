# Orbit Simulator

Orbit Simulator is a lightweight, browser-based project for building physically grounded orbital mechanics simulations step by step.

## Project Direction

This repository is intended to evolve from a minimal 2D Earth-satellite simulation into a progressively richer orbital simulation toolkit while preserving:

- deterministic physics updates
- clear unit handling
- simple, readable implementation
- minimal dependencies

## Current Scope

Step 1 focuses on a top-down 2D Newtonian gravity simulation using HTML Canvas and vanilla JavaScript.

Step 1.5 refines runtime quality while preserving deterministic fixed-step physics:

- semi-implicit Euler integration
- fixed-step accumulator with interpolation rendering
- explicit simulation time scaling for observable motion

## Documentation Policy

Implementation changes must be documented in the project guide files as part of the same work, including what changed, why, and how it affects physics or determinism.
