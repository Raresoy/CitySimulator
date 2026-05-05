export function trafficAgentDecision(cityState) {
    if (!cityState || !cityState.roads) return { action: "NONE", message: "Aștept date despre trafic..." };

    // Detectăm drumurile cu o congestie mai mare de 80%
    const congestedRoads = cityState.roads.filter(road => road.congestionLevel > 80);

    if (congestedRoads.length > 0) {
        return {
            action: "DIVERT_TRAFFIC",
            targetRoads: congestedRoads.map(r => r.id),
            message: `Congestie detectată! Se redirecționează traficul de pe: ${congestedRoads.map(r => r.name).join(', ')}`
        };
    }

    return { action: "MAINTAIN", message: "Traficul este optim." };
}