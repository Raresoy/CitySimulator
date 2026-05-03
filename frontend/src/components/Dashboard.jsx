function Dashboard({ cityState, isRunning, aiDecision }) {
  const activeIncidents = cityState.incidents.filter(
    (incident) => !incident.resolved
  );

  return (
    <div
      style={{
        width: "330px",
        height: "500px",
        padding: "25px",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        border: "3px solid #dfe6e9",
        color: "#2d3436",
        boxSizing: "border-box",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Smart City Dashboard</h2>

      <p><strong>Simulation:</strong> {isRunning ? "Running" : "Stopped"}</p>

      <p>
        <strong>Traffic Status:</strong>{" "}
        {cityState.congestion.length > 0
          ? `Congested: ${cityState.congestion.join(", ")}`
          : "Normal"}
      </p>

      <p>
        <strong>Incident Status:</strong>{" "}
        {activeIncidents.length > 0
          ? `${activeIncidents.length} active incident(s)`
          : "No incident"}
      </p>

      <p><strong>AI Decision:</strong> {aiDecision}</p>

      <p><strong>Vehicles:</strong> {cityState.vehicles.length}</p>

      <p><strong>Tick:</strong> {cityState.tick}</p>
    </div>
  );
}

export default Dashboard;