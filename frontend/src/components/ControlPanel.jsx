function ControlPanel({
  onStart,
  onGenerateIncident,
  onOptimizeTraffic,
  onReset,
}) {
  const buttonStyle = {
    padding: "10px 15px",
    margin: "5px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#6c5ce7",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  };

  return (
    <div style={{ marginBottom: "20px", textAlign: "center" }}>
      <button style={buttonStyle} onClick={onStart}>Start Simulation</button>
      <button style={buttonStyle} onClick={onGenerateIncident}>Generate Incident</button>
      <button style={buttonStyle} onClick={onOptimizeTraffic}>Optimize Traffic</button>
      <button style={buttonStyle} onClick={onReset}>Reset</button>
    </div>
  );
}

export default ControlPanel;