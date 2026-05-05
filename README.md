# Smart City Simulator

Smart City Simulator is a web application that simulates a simplified smart city where AI agents make decisions related to traffic, emergency response and city status.

## Team roles

- Member 1: project setup, README, documentation, CI/CD
- Member 2: city map UI, dashboard and visual components
- Member 3: simulation engine, traffic movement and congestion detection
- Member 4: AI agents and automated tests

## Deadline 2 progress

For the second deadline, the project contains:

- initial React/Vite frontend setup
- basic project structure
- Git workflow with branches
- documentation structure
- CI/CD workflow
- preparation for city map, simulation engine and AI agents

## Main features planned

- city map / city view
- traffic simulation
- congestion detection
- emergency incident simulation
- AI traffic optimization agent
- AI emergency response agent
- dashboard with city status
- automated tests for simulation and agents

## How to run the project

```bash
cd frontend
npm install
npm run dev
```

Then open:

```text
http://localhost:5173/
```

## Project structure

```text
frontend/                React frontend application
docs/                    project documentation
docs/diagrams/           architecture and workflow diagrams
.github/workflows/       CI/CD configuration
```

## Documentation

- AI usage: `docs/AI_USAGE.md`
- Testing: `docs/TESTING.md`
- Architecture: `docs/ARCHITECTURE.md`

## Git workflow

Each team member works on a separate branch and opens a pull request into `dev`.

Example branches:

```text
feature/readme-ci
feature/city-map-ui
feature/simulation-engine
feature/ai-agents-tests
```

## CI/CD

The project uses GitHub Actions to automatically check the frontend build.

## Current status

The project is currently in the intermediate development stage for Deadline 2.