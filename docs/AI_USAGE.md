# AI Usage

This document describes how AI tools were used during the development of the Smart City Simulator project.

## AI tools used

- ChatGPT
- Gemini (Specifically for Sprint 1 / Deadline 2 implementations)
- GitHub Copilot / AI code assistance, if used by team members

## How AI was used

AI tools were used generally for:

- generating and refining the initial project idea
- defining user stories and backlog items
- planning the project structure
- generating parts of the React setup
- writing documentation drafts
- suggesting implementation ideas for the simulation engine

### Specific Implementations generated with AI (Sprint 1)

For the current sprint, AI (Gemini) was actively used to write and structure code:
- **AI Agents Logic**: Generated the core decision-making functions for the `Traffic Manager Agent` (detecting congestion and diverting traffic) and the `Emergency Response Agent` (dispatching ambulances and requesting traffic priority).
- **Automated Testing**: Generated the Vitest unit test suites (`trafficAgent.test.js` and `emergencyAgent.test.js`) to validate the AI agents' logic against mock city states.
- **Troubleshooting**: Assisted in debugging Git staging (`untracked files`) and structuring the commit history to meet the project's source control requirements.

## Human verification

All AI-generated code and documentation is reviewed by the team before being committed.

The team verifies that:

- the application runs locally
- generated code is adapted to the project structure
- the logic matches the project requirements
- tests and CI checks pass before merging