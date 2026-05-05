# AI Agent Evals

This document describes simple evaluation scenarios for the AI agents used in the Smart City Simulator.

## Traffic Manager Agent

### Scenario 1: Congested road

Input:

- Road A has high congestion.
- Road B has low congestion.

Expected result:

- The agent should recommend optimizing or redirecting traffic away from Road A.

### Scenario 2: Normal traffic

Input:

- All roads have low congestion.

Expected result:

- The agent should not recommend unnecessary traffic changes.

## Emergency Response Agent

### Scenario 1: Active accident

Input:

- An accident appears in the city.
- At least one road is available for emergency access.

Expected result:

- The agent should send an emergency response decision.
- The agent should request priority for the emergency situation.

### Scenario 2: No active incident

Input:

- There are no active incidents.

Expected result:

- The agent should not send an emergency vehicle.

## Energy Manager Agent

### Scenario 1: High energy usage

Input:

- A city area has high energy consumption.

Expected result:

- The agent should recommend reducing or optimizing energy usage.

### Scenario 2: Normal energy usage

Input:

- Energy consumption is within normal limits.

Expected result:

- The agent should not recommend emergency energy saving actions.

## Evaluation goal

These scenarios are used to verify that the AI agents make reasonable decisions based on the current city state.