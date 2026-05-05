# Architecture

The Smart City Simulator uses a simple web architecture.

## Main components

```text
User
 |
Frontend UI
 |
City Map + Dashboard
 |
Simulation Engine
 |
AI Agents
 |
City State / Data
```

## Frontend UI

The frontend displays the simulated city, including roads, buildings, vehicles, citizens, incidents and dashboard information.

## Simulation Engine

The simulation engine updates the state of the city.

It handles:

- vehicle movement
- traffic density
- congestion detection
- incidents
- city status updates

## AI Agents

The project includes AI agents that make automatic decisions based on the current city state.

### Traffic Manager Agent

Responsibilities:

- analyzes traffic congestion
- recommends route changes
- helps emergency vehicles pass faster

### Emergency Response Agent

Responsibilities:

- detects emergency situations
- sends emergency vehicles
- requests traffic priority

## City State

The city state contains information such as:

- roads
- vehicles
- incidents
- traffic levels
- agent decisions