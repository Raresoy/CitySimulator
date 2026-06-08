import React, { useState, useEffect } from "react";

function Dashboard({ metrics, tick, overlayMode = false }) {
  const [flowHistory, setFlowHistory] = useState([100, 100, 100, 100, 100]);
  const [loadHistory, setLoadHistory] = useState([60, 60, 60, 60, 60]);

  // Keep a history of the last 20 ticks for SVG sparkline visualization
  useEffect(() => {
    if (tick === 0) return;

    setFlowHistory((prev) => {
      const updated = [...prev, metrics.flowRate];
      if (updated.length > 20) updated.shift();
      return updated;
    });

    setLoadHistory((prev) => {
      // Load index is simulated based on active cars and incidents
      const currentLoad = Math.min(100, Math.round(50 + (metrics.activeCars / 30) * 35 + metrics.incidentsCount * 8));
      const updated = [...prev, currentLoad];
      if (updated.length > 20) updated.shift();
      return updated;
    });
  }, [tick]);

  // Helper to generate SVG polyline points
  const getSvgPoints = (data, width, height, maxVal = 100) => {
    if (data.length < 2) return "0,0";
    const xStep = width / (data.length - 1);
    return data
      .map((val, i) => {
        const x = i * xStep;
        // SVG coordinates start from top-left, so invert Y
        const y = height - (val / maxVal) * (height - 8) - 4;
        return `${x},${y}`;
      })
      .join(" ");
  };

  const flowCardClass = metrics.flowRate > 80 ? "metric-card ok" : metrics.flowRate > 50 ? "metric-card warn" : "metric-card crit";
  const congestionCardClass = metrics.congestedCount === 0 ? "metric-card ok" : metrics.congestedCount < 5 ? "metric-card warn" : "metric-card crit";
  const incidentCardClass = metrics.incidentsCount === 0 ? "metric-card ok" : "metric-card crit";

  const containerStyle = overlayMode 
    ? { display: "flex", flexDirection: "column", gap: "10px" } 
    : { display: "flex", flexDirection: "column", gap: "16px" };

  const cardStyle = overlayMode 
    ? { padding: "10px 12px", background: "rgba(13, 18, 34, 0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(30, 41, 59, 0.7)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" } 
    : { padding: "12px", background: "var(--card)" };

  if (overlayMode) {
    return (
      <div style={containerStyle}>
        {/* SVG Historical Charts */}
        <div className="cyber-panel" style={cardStyle}>
          <div className="section-title" style={{ fontSize: "9px", marginBottom: "6px" }}>Istoric Debit Trafic (20 Ticks)</div>
          <div style={{ height: "45px", width: "100%", position: "relative" }}>
            <svg style={{ width: "100%", height: "100%", overflow: "visible" }}>
              <line x1="0" y1="22.5" x2="100%" y2="22.5" stroke="var(--border)" strokeDasharray="3 3" />
              <polyline
                fill="none"
                stroke={metrics.flowRate > 70 ? "var(--green)" : "var(--amber)"}
                strokeWidth="2"
                points={getSvgPoints(flowHistory, 256, 45)}
              />
            </svg>
          </div>
        </div>

        <div className="cyber-panel" style={cardStyle}>
          <div className="section-title" style={{ fontSize: "9px", marginBottom: "6px" }}>Sarcină Rețea Electrică</div>
          <div style={{ height: "45px", width: "100%", position: "relative" }}>
            <svg style={{ width: "100%", height: "100%", overflow: "visible" }}>
              <line x1="0" y1="22.5" x2="100%" y2="22.5" stroke="var(--border)" strokeDasharray="3 3" />
              <polyline
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                points={getSvgPoints(loadHistory, 256, 45)}
              />
            </svg>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "9px", color: "var(--muted)" }}>
            <span>Consum: {loadHistory[loadHistory.length - 1]}%</span>
            <span>
              {loadHistory[loadHistory.length - 1] > 80 ? "⚠️ ECO Limit" : "🟢 Stabil"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* 4-Card Grid */}
      <div className="section-title">Metrici Oraș</div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div className={flowCardClass}>
          <span className="val">{metrics.flowRate}%</span>
          <span className="lbl">Debit Trafic</span>
        </div>

        <div className={congestionCardClass}>
          <span className="val">{metrics.congestedCount}</span>
          <span className="lbl">Blocaje Străzi</span>
        </div>

        <div className={incidentCardClass}>
          <span className="val">{metrics.incidentsCount}</span>
          <span className="lbl">Incidente Active</span>
        </div>

        <div className="metric-card ok">
          <span className="val">{metrics.activeCars}</span>
          <span className="lbl">Vehicule Active</span>
        </div>
      </div>

      {/* SVG Historical Charts */}
      <div className="cyber-panel" style={cardStyle}>
        <div className="section-title" style={{ fontSize: "10px", marginBottom: "8px" }}>Istoric Debit Trafic (20 Ticks)</div>
        <div style={{ height: "60px", width: "100%", position: "relative" }}>
          <svg style={{ width: "100%", height: "100%", overflow: "visible" }}>
            {/* Grid line */}
            <line x1="0" y1="30" x2="100%" y2="30" stroke="var(--border)" strokeDasharray="3 3" />
            
            {/* Fill gradient area */}
            <path
              d={`M 0,60 L ${getSvgPoints(flowHistory, 280, 60)} L 280,60 Z`}
              fill="rgba(0, 255, 136, 0.05)"
              stroke="none"
            />
            
            {/* Flow Line */}
            <polyline
              fill="none"
              stroke={metrics.flowRate > 70 ? "var(--green)" : "var(--amber)"}
              strokeWidth="2.5"
              points={getSvgPoints(flowHistory, 280, 60)}
            />
          </svg>
        </div>
      </div>

      <div className="cyber-panel" style={cardStyle}>
        <div className="section-title" style={{ fontSize: "10px", marginBottom: "8px" }}>Încărcare Rețea Electrică (Smart Grid Load)</div>
        <div style={{ height: "60px", width: "100%", position: "relative" }}>
          <svg style={{ width: "100%", height: "100%", overflow: "visible" }}>
            <line x1="0" y1="30" x2="100%" y2="30" stroke="var(--border)" strokeDasharray="3 3" />
            
            <polyline
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              points={getSvgPoints(loadHistory, 280, 60)}
            />
          </svg>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "10px", color: "var(--muted)" }}>
          <span>Consum: {loadHistory[loadHistory.length - 1]}%</span>
          <span>
            {loadHistory[loadHistory.length - 1] > 80 ? "⚡ REȚEA SUPRAÎNCĂRCATĂ" : "🟢 REȚEA STABILĂ"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;