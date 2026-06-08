import React, { useState, useEffect, useRef } from "react";
import Auth from "./components/Auth";
import CityMap from "./components/CityMap";
import Dashboard from "./components/Dashboard";
import ControlPanel from "./components/ControlPanel";
import AICenter from "./components/AICenter";
import LearningCenter from "./components/LearningCenter";

function App() {
  // Authentication State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("citysim_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Active Tab: 'ai' | 'learning'
  const [activeTab, setActiveTab] = useState("ai");

  // Simulation controls replicated in React state
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [roadBuilderMode, setRoadBuilderMode] = useState(false);

  // Stats updated from the Canvas loop
  const [tick, setTick] = useState(0);
  const [metrics, setMetrics] = useState({
    flowRate: 100,
    congestedCount: 0,
    incidentsCount: 0,
    activeCars: 0,
  });

  // Current road network state and incident states passed from canvas to React
  const [incidents, setIncidents] = useState([]);
  const [roads, setRoads] = useState([]);

  // AI Center Configuration
  const [aiMode, setAiMode] = useState("offline"); // 'offline' | 'transformers' | 'ollama'
  const [hallucinationLevel, setHallucinationLevel] = useState(30); // 0 to 100
  const [aiLogs, setAiLogs] = useState([
    {
      id: 1,
      type: "event",
      tick: 0,
      text: "Sistemul Smart City a fost inițializat.",
      icon: "🏙️",
    },
  ]);
  const [aiThinking, setAiThinking] = useState(false);

  // References for sending triggers to CityMap
  const mapRef = useRef(null);

  // Save authentication info
  const handleLogin = (username, token) => {
    const userData = { username, token };
    setUser(userData);
    localStorage.setItem("citysim_user", JSON.stringify(userData));
    addLogEntry("event", `Utilizatorul ${username} s-a autentificat.`, "👤");
  };

  const handleLogout = () => {
    localStorage.removeItem("citysim_user");
    setUser(null);
  };

  // Helper to add log entries
  const addLogEntry = (type, text, icon = "") => {
    setAiLogs((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        type,
        tick,
        text,
        icon,
      },
    ]);
  };

  // Save events to backend database history
  const saveEventToBackend = async (action, details) => {
    if (!user) return;
    try {
      await fetch("/api/simulation/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          action,
          details,
        }),
      });
    } catch (e) {
      console.error("Failed to save history to backend", e);
    }
  };

  // Triggers from the UI
  const handleAddIncident = () => {
    if (mapRef.current) {
      mapRef.current.triggerRandomIncident();
    }
  };

  const handleClearAll = () => {
    if (mapRef.current) {
      mapRef.current.clearAllIncidents();
    }
  };

  // Callback from Canvas (CityMap) when a tick occurs or state changes
  const handleMapUpdate = (mapData) => {
    setTick(mapData.tick);
    setMetrics(mapData.metrics);
    setIncidents(mapData.incidents);
    setRoads(mapData.roads);
  };

  // Log events from canvas interaction (e.g. road built, incident clicked)
  const handleLogEvent = (text, icon, actionType) => {
    addLogEntry("event", text, icon);
    if (actionType) {
      saveEventToBackend(actionType, text);
    }
  };

  // If not logged in, show Auth
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // Calculate city condition pill class
  const getCityStatus = () => {
    const { flowRate, incidentsCount } = metrics;
    if (incidentsCount > 2 || flowRate < 50) return { label: "CRITIC", className: "pill crit" };
    if (incidentsCount > 0 || flowRate < 80) return { label: "AVERTIZARE", className: "pill warn" };
    return { label: "NOMINAL", className: "pill ok" };
  };

  const status = getCityStatus();

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header className="header-panel">
        <div className="logo">
          CITY<span>SIM</span>
        </div>
        <div className={status.className}>{status.label}</div>
        
        <div style={{ display: "flex", gap: "12px", marginLeft: "auto", alignItems: "center" }}>
          <div className="pill ok" style={{ display: metrics.congestedCount > 0 ? "none" : "block" }}>
            Trafic Fluid
          </div>
          {metrics.congestedCount > 0 && (
            <div className="pill warn">
              {metrics.congestedCount} Blocaje
            </div>
          )}
          
          <div className={`pill ${metrics.incidentsCount > 0 ? 'crit' : 'ok'}`}>
            {metrics.incidentsCount === 0 ? "Fără Incidente" : `${metrics.incidentsCount} Incidente`}
          </div>

          <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--muted)", borderLeft: "1px solid var(--border)", paddingLeft: "15px" }}>
            T+{tick}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderLeft: "1px solid var(--border)", paddingLeft: "15px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600" }}>👤 {user.username}</span>
            <button 
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                color: "var(--muted)",
                padding: "2px 8px",
                fontSize: "11px",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => { e.target.style.borderColor = "var(--red)"; e.target.style.color = "var(--red)" }}
              onMouseLeave={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--muted)" }}
            >
              Ieșire
            </button>
          </div>
        </div>
      </header>

      {/* Main Map View Port */}
      <main className="main-content" style={{
        padding: "0",
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden"
      }}>
        <CityMap
          ref={mapRef}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          speed={speed}
          setSpeed={setSpeed}
          emergencyMode={emergencyMode}
          setEmergencyMode={setEmergencyMode}
          roadBuilderMode={roadBuilderMode}
          setRoadBuilderMode={setRoadBuilderMode}
          onAddIncident={handleAddIncident}
          onClearAll={handleClearAll}
          onMapUpdate={handleMapUpdate}
          onLogEvent={handleLogEvent}
          aiMode={aiMode}
          hallucinationLevel={hallucinationLevel}
          aiLogs={aiLogs}
          setAiLogs={setAiLogs}
          aiThinking={aiThinking}
          setAiThinking={setAiThinking}
          user={user}
          metrics={metrics}
          tick={tick}
        />
      </main>

      {/* Sidebar Panel */}
      <aside className="side-panel">
        <div className="tabs-header" style={{ padding: "12px 16px 0 16px" }}>
          <button
            className={`tab-btn ${activeTab === "ai" ? "active" : ""}`}
            onClick={() => setActiveTab("ai")}
          >
            Operațiuni AI
          </button>
          <button
            className={`tab-btn ${activeTab === "learning" ? "active" : ""}`}
            onClick={() => setActiveTab("learning")}
          >
            React & Vite
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px 16px" }}>
          {activeTab === "ai" && (
            <AICenter
              aiMode={aiMode}
              setAiMode={setAiMode}
              hallucinationLevel={hallucinationLevel}
              setHallucinationLevel={setHallucinationLevel}
              aiLogs={aiLogs}
              aiThinking={aiThinking}
              setAiThinking={setAiThinking}
              addLogEntry={addLogEntry}
              metrics={metrics}
              incidents={incidents}
              roads={roads}
              tick={tick}
              mapRef={mapRef}
              saveEventToBackend={saveEventToBackend}
            />
          )}

          {activeTab === "learning" && (
            <LearningCenter />
          )}
        </div>
      </aside>
    </div>
  );
}

export default App;