# Smart City Simulator

Smart City Simulator is a web application that simulates a simplified smart city where AI agents make decisions related to traffic, emergency response, energy usage and city status.

The project demonstrates how multiple AI agents can be used inside a simulated urban environment to improve traffic flow, react to incidents and monitor the state of the city.

## Team roles

- Member 1: project setup, README, documentation, CI/CD and integration
- Member 2: city map UI, dashboard and visual components
- Member 3: simulation engine, traffic movement and congestion detection
- Member 4: AI agents and automated tests

## Implemented for Deadline 2

For the second deadline, the project includes:

- React/Vite frontend setup
- city map interface with roads, buildings, vehicles and incidents
- control panel for simulation actions
- dashboard with city status information
- simulation engine for city state updates
- vehicle movement simulation
- traffic congestion detection
- incident generation and handling
- Traffic Manager Agent
- Emergency Response Agent
- Energy Manager Agent
- automated tests for simulation and agents
- GitHub Actions CI/CD pipeline
- documentation for AI usage, testing and architecture

## Main features

- city map / city view
- traffic simulation
- congestion detection
- emergency incident simulation
- AI traffic optimization agent
- AI emergency response agent
- AI energy manager agent
- dashboard with city status
- automated tests for simulation and agents

## How to run the project

```bash
cd frontend
npm install
npm run dev
```

Then open the local URL displayed in the terminal, usually:

```text
http://localhost:5173/
```

## Run tests

```bash
cd frontend
npm test
```

## Build

```bash
cd frontend
npm run build
```

## Project structure

```text
frontend/                React frontend application
frontend/src/components/ UI components
frontend/src/agents/     AI agents
frontend/src/engine/     simulation engine
frontend/src/__tests__/  automated tests
docs/                    project documentation
.github/workflows/       CI/CD configuration
```

## Documentation

- AI usage: `docs/AI_USAGE.md`
- Testing: `docs/TESTING.md`
- Architecture: `docs/ARCHITECTURE.md`
- AI agent evals: `docs/AI_AGENT_EVALS.md`

## Git workflow

The team uses a branch-based workflow.

Each member works on a separate branch and opens a pull request into `dev`.

Example branches:

```text
feature/readme-ci
feature/city-map-ui
feature/simulation-engine
feature/ai-agents-tests
fix/add-test-script
feature/update-deadline2-docs
```

## CI/CD

The project uses GitHub Actions to automatically run tests and build the frontend.

The workflow runs on pushes and pull requests to `dev` and `main`.

## Current status

The project is currently in the intermediate development stage for Deadline 2.

The application runs locally and includes the first functional version of the Smart City Simulator.