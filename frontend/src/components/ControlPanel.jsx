import React from "react";

function ControlPanel({
  isRunning,
  setIsRunning,
  speed,
  setSpeed,
  emergencyMode,
  setEmergencyMode,
  roadBuilderMode,
  setRoadBuilderMode,
  onAddIncident,
  onClearAll
}) {

  const handleTogglePlay = () => {
    setIsRunning(!isRunning);
  };

  const handleToggleRoadBuilder = () => {
    setRoadBuilderMode(!roadBuilderMode);
    if (emergencyMode) setEmergencyMode(false);
  };

  const handleToggleEmergencyMode = () => {
    setEmergencyMode(!emergencyMode);
    if (roadBuilderMode) setRoadBuilderMode(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Simulation Playback Control */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          className={`btn ${isRunning ? "active" : "primary"}`}
          onClick={handleTogglePlay}
          style={{ flex: 1 }}
        >
          {isRunning ? "⏸ Pauză" : "▶ Pornire"}
        </button>

        <button
          className="btn"
          onClick={onClearAll}
          style={{ flex: 1 }}
        >
          🧹 Curăță Tot
        </button>
      </div>

      {/* Speed Slider */}
      <div className="cyber-panel" style={{ padding: "10px 14px", background: "var(--card)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase" }}>Viteză Sim</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)" }}>{speed}×</span>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={speed}
          onChange={(e) => setSpeed(parseInt(e.target.value))}
          style={{
            width: "100%",
            accentColor: "var(--accent)",
            cursor: "pointer",
            background: "var(--border)",
            height: "4px",
            borderRadius: "2px"
          }}
        />
      </div>

      {/* Editor Toggles */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button
          className={`btn ${roadBuilderMode ? "active" : "primary"}`}
          onClick={handleToggleRoadBuilder}
          style={{ width: "100%" }}
        >
          {roadBuilderMode ? "❌ Închide Constructor Străzi" : "🏗️ Constructor Străzi"}
        </button>

        <button
          className={`btn ${emergencyMode ? "active" : "danger"}`}
          onClick={handleToggleEmergencyMode}
          style={{ width: "100%" }}
        >
          {emergencyMode ? "❌ Anulează Plasare" : "🚨 Plasează Incident"}
        </button>

        <button
          className="btn success"
          onClick={onAddIncident}
          style={{ width: "100%" }}
        >
          🎲 Incident Aleatoriu
        </button>
      </div>
    </div>
  );
}

export default ControlPanel;