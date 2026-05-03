function CityMap({ vehicles = [], congestion = [], incidents = [] }) {
  const roadColor = (roadName) =>
    congestion.includes(roadName) ? "#d63031" : "#636e72";

  function getVehiclePosition(vehicle, index) {
    const speed = 8;
    const movement = (vehicle.x * speed + index * 70) % 430;

    if (vehicle.road === "roadA") {
      return { left: movement + 25, top: 138 };
    }

    if (vehicle.road === "roadB") {
      return { left: movement + 25, top: 348 };
    }

    if (vehicle.road === "roadC") {
      return { left: 158, top: movement + 25 };
    }

    return { left: 358, top: movement + 25 };
  }

  const buildingBaseStyle = {
    position: "absolute",
    width: "115px",
    height: "75px",
    borderRadius: "10px",
    fontWeight: "bold",
    color: "#2d3436",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    zIndex: 2,
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        width: "500px",
        height: "500px",
        backgroundColor: "#dfe6e9",
        position: "relative",
        overflow: "hidden",
        borderRadius: "12px",
        border: "3px solid #2d3436",
      }}
    >
      {/* drumuri */}
      <div style={{
        width: "100%",
        height: "55px",
        backgroundColor: roadColor("roadA"),
        position: "absolute",
        top: "120px",
      }} />

      <div style={{
        width: "100%",
        height: "55px",
        backgroundColor: roadColor("roadB"),
        position: "absolute",
        top: "330px",
      }} />

      <div style={{
        width: "55px",
        height: "100%",
        backgroundColor: roadColor("roadC"),
        position: "absolute",
        left: "140px",
      }} />

      <div style={{
        width: "55px",
        height: "100%",
        backgroundColor: roadColor("roadD"),
        position: "absolute",
        left: "340px",
      }} />

      {/* cladiri */}
      <div style={{ ...buildingBaseStyle, left: "15px", top: "35px", backgroundColor: "#fab1a0" }}>
        Hospital
      </div>

      <div style={{ ...buildingBaseStyle, left: "205px", top: "35px", backgroundColor: "#ffeaa7" }}>
        School
      </div>

      <div style={{ ...buildingBaseStyle, left: "15px", top: "400px", backgroundColor: "#a29bfe" }}>
        Mall
      </div>

      <div style={{ ...buildingBaseStyle, left: "210px", top: "400px", backgroundColor: "#81ecec" }}>
        Office
      </div>

      {/* masini */}
      {vehicles.map((vehicle, index) => {
        const pos = getVehiclePosition(vehicle, index);

        return (
          <div
            key={vehicle.id}
            title={`Vehicle ${vehicle.id} on ${vehicle.road}`}
            style={{
              width: "18px",
              height: "18px",
              backgroundColor: "#0984e3",
              borderRadius: "50%",
              position: "absolute",
              left: `${pos.left}px`,
              top: `${pos.top}px`,
              boxShadow: "0 0 8px rgba(0,0,0,0.4)",
              zIndex: 5,
            }}
          />
        );
      })}

      {/* incidente */}
      {incidents
        .filter((incident) => !incident.resolved)
        .map((incident) => {
          const incidentPositions = {
            roadA: { left: 250, top: 132 },
            roadB: { left: 250, top: 342 },
            roadC: { left: 152, top: 240 },
            roadD: { left: 352, top: 240 },
          };

          const pos = incidentPositions[incident.road] || { left: 250, top: 240 };

          return (
            <div
              key={incident.id}
              title={`Incident on ${incident.road}`}
              style={{
                width: "30px",
                height: "30px",
                backgroundColor: "#d63031",
                color: "white",
                borderRadius: "50%",
                position: "absolute",
                left: `${pos.left}px`,
                top: `${pos.top}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "20px",
                boxShadow: "0 0 15px red",
                zIndex: 10,
              }}
            >
              !
            </div>
          );
        })}
    </div>
  );
}

export default CityMap;