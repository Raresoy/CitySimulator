# Testing

This document describes the testing plan for the Smart City Simulator project.

## Planned automated tests

The project will include automated tests for:

- traffic congestion detection
- vehicle movement simulation
- traffic agent decisions
- emergency agent decisions
- incident generation and handling

## Example test scenarios

### Congestion detection

Input:

- Road A has a high number of vehicles.
- Road B has a low number of vehicles.

Expected result:

- The system detects congestion on Road A.

### Traffic agent decision

Input:

- Road A is congested.
- Road B is available.

Expected result:

- The Traffic Manager Agent recommends redirecting traffic to Road B.

### Emergency agent decision

Input:

- An accident appears on a road.

Expected result:

- The Emergency Response Agent sends an emergency vehicle and requests traffic priority.

## Running the project locally

```bash
cd frontend
npm install
npm run dev
```

## Running checks

For now, the CI pipeline checks that the frontend can be built successfully.

```bash
cd frontend
npm install
npm run build
```