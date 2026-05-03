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

export function updateCity(state) {
    const movedVehicles = moveVehicles(state.vehicles);
    const congestion = detectCongestion(movedVehicles);

    return {
        ...state,
        vehicles: movedVehicles,
        congestion,
        tick: state.tick + 1,
    };
}

function moveVehicles(vehicles) {
    return vehicles.map((v) => {
        let newX = v.x + v.dx;
        let newY = v.y + v.dy;
        let newDx = v.dx;
        let newDy = v.dy;

        if (newX < 0 || newX > GRID_SIZE) newDx = -newDx;
        if (newY < 0 || newY > GRID_SIZE) newDy = -newDy;

        return {...v, x: newX, y: newY, dx: newDx, dy: newDy };
    });
}