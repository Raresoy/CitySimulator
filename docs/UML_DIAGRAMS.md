# UML Diagrams

This document contains UML-style diagrams for the Smart City Simulator project.

## Use Case Diagram

```mermaid
flowchart LR
    User[User]

    User --> Start[Start simulation]
    User --> Incident[Generate incident]
    User --> Optimize[Optimize traffic]
    User --> Reset[Reset simulation]
    User --> Dashboard[View dashboard]
    User --> CityMap[View city map]

    TrafficAgent[Traffic Manager Agent] --> Optimize
    EmergencyAgent[Emergency Response Agent] --> Incident
    EnergyAgent[Energy Manager Agent] --> Dashboard
```

## Component Diagram

```mermaid
flowchart TD
    App[App.jsx]

    App --> ControlPanel[ControlPanel Component]
    App --> CityMap[CityMap Component]
    App --> Dashboard[Dashboard Component]

    App --> SimulationEngine[Simulation Engine]

    SimulationEngine --> CityState[City State]

    CityState --> TrafficAgent[Traffic Manager Agent]
    CityState --> EmergencyAgent[Emergency Response Agent]
    CityState --> EnergyAgent[Energy Manager Agent]

    TrafficAgent --> AgentDecision[AI Decisions]
    EmergencyAgent --> AgentDecision
    EnergyAgent --> AgentDecision

    AgentDecision --> Dashboard
    CityState --> CityMap
```

## Class Diagram

```mermaid
classDiagram
    class CityState {
        +vehicles
        +roads
        +congestion
        +incidents
        +tick
    }

    class Vehicle {
        +id
        +road
        +x
        +y
        +dx
        +dy
    }

    class Incident {
        +id
        +road
        +type
        +resolved
    }

    class SimulationEngine {
        +initCity()
        +updateCity()
        +detectCongestion()
        +addIncident()
        +resolveIncident()
    }

    class TrafficManagerAgent {
        +trafficAgentDecision(cityState)
    }

    class EmergencyResponseAgent {
        +emergencyAgentDecision(incident, cityState)
    }

    class EnergyManagerAgent {
        +energyAgentDecision(cityState)
    }

    CityState "1" --> "*" Vehicle
    CityState "1" --> "*" Incident
    SimulationEngine --> CityState
    TrafficManagerAgent --> CityState
    EmergencyResponseAgent --> Incident
    EnergyManagerAgent --> CityState
```

## Sequence Diagram: Traffic Optimization

```mermaid
sequenceDiagram
    actor User
    participant UI as Control Panel
    participant App as App.jsx
    participant Engine as Simulation Engine
    participant Agent as Traffic Manager Agent
    participant Dashboard

    User->>UI: Click Optimize Traffic
    UI->>App: Trigger optimize action
    App->>Engine: Read current city state
    Engine-->>App: Return congestion data
    App->>Agent: Analyze city state
    Agent-->>App: Return traffic decision
    App->>Dashboard: Display AI decision
```

## Sequence Diagram: Emergency Incident

```mermaid
sequenceDiagram
    actor User
    participant UI as Control Panel
    participant App as App.jsx
    participant Engine as Simulation Engine
    participant Agent as Emergency Response Agent
    participant Dashboard

    User->>UI: Click Generate Incident
    UI->>App: Trigger incident generation
    App->>Engine: Add incident to city state
    Engine-->>App: Return updated city state
    App->>Agent: Analyze incident
    Agent-->>App: Return emergency response decision
    App->>Dashboard: Display emergency decision
```