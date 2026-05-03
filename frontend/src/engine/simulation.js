// ============================================
// CITY SIMULATION ENGINE
// ============================================

export const ROADS = ["roadA", "roadB", "roadC", "roadD"];
export const CONGESTION_THRESHOLD = 3;
export const GRID_SIZE = 500;

export function initCity() {
    return {
        vehicles: generateVehicles(8),
        roads: ROADS,
        congestion: [],
        incidents: [],
        tick: 0,
    };
}

function generateVehicles(count) {
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        x: Math.random() * GRID_SIZE,
        y: Math.random() * GRID_SIZE,
        dx: (Math.random() - 0.5) * 4,
        dy: (Math.random() - 0.5) * 4,
        road: ROADS[Math.floor(Math.random() * ROADS.length)],
    }));
}