import { useEffect, useState } from "react";
import CityMap from "./components/CityMap";
import Dashboard from "./components/Dashboard";
import ControlPanel from "./components/ControlPanel";
import { initCity, updateCity, addIncident } from "./engine/simulation";

function App() {
  const [cityState, setCityState] = useState(initCity());
  const [isRunning, setIsRunning] = useState(false);
  const [aiDecision, setAiDecision] = useState("Waiting");

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setCityState((prevState) => updateCity(prevState));
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning]);

  function handleStart() {
    setIsRunning(true);
    setAiDecision("Simulation started");
  }

  function handleGenerateIncident() {
    setCityState((prevState) => addIncident(prevState));
    setAiDecision("Emergency agent notified");
  }

  function handleOptimizeTraffic() {
    if (cityState.congestion.length > 0) {
      setAiDecision(
        `Traffic Agent: redirecting vehicles from ${cityState.congestion.join(", ")}`
      );
    } else {
      setAiDecision("Traffic Agent: traffic is normal");
    }
  }

  function handleReset() {
    setCityState(initCity());
    setIsRunning(false);
    setAiDecision("Waiting");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f6fa",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", fontSize: "48px", color: "#2d3436" }}>
        Smart City Simulator - AI Demo
      </h1>

      <p style={{ textAlign: "center", color: "#636e72", fontSize: "18px" }}>
        AI agents monitor traffic, incidents and emergency response.
      </p>

      <ControlPanel
        onStart={handleStart}
        onGenerateIncident={handleGenerateIncident}
        onOptimizeTraffic={handleOptimizeTraffic}
        onReset={handleReset}
      />

      <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
        <CityMap
          vehicles={cityState.vehicles}
          congestion={cityState.congestion}
          incidents={cityState.incidents}
        />

        <Dashboard
          cityState={cityState}
          isRunning={isRunning}
          aiDecision={aiDecision}
        />
      </div>
    </div>
  );
}

export default App;