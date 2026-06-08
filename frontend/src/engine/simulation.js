// ==========================================================
// SMART CITY SIMULATION UTILITIES & ENGINE
// ==========================================================

export const GRID = 7;
export const CELL = 72;
export const ROAD = 18;

// Get pixel coordinates of intersection center dynamically
export function intersectionCenter(gx, gy, W, H) {
  const size = Math.min(W - 100, H - 240);
  const cell = size / (GRID - 1);
  const road = Math.max(12, cell * 0.22);
  const ox = (W - (GRID - 1) * cell - road) / 2;
  // Shift slightly down from top (e.g. top starts at 110px) to make space for HUD
  const oy = 110 + (H - 110 - (GRID - 1) * cell - road - 160) / 2;
  
  return {
    x: ox + gx * cell + road / 2,
    y: oy + gy * cell + road / 2,
    cell,
    road,
    ox,
    oy
  };
}

// Get pixel coordinates of road midpoint dynamically
export function roadMid(r, W, H) {
  const p1 = intersectionCenter(r.isHoriz ? r.gx : r.gx, r.isHoriz ? r.gy : r.gy, W, H);
  const p2 = intersectionCenter(r.isHoriz ? r.gx + 1 : r.gx, r.isHoriz ? r.gy : r.gy + 1, W, H);
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
}

// Check if a road exists and is built between two intersections
export function getRoadBetween(roads, gx1, gy1, gx2, gy2) {
  if (gx1 === gx2) {
    const gy = Math.min(gy1, gy2);
    return roads.find(r => !r.isHoriz && r.gx === gx1 && r.gy === gy) || null;
  } else {
    const gx = Math.min(gx1, gx2);
    return roads.find(r => r.isHoriz && r.gy === gy1 && r.gx === gx) || null;
  }
}

// Build the initial roads layout with coordinates and pre-built state
export function buildRoads(W, H) {
  const roads = [];
  let id = 0;
  const ox = (W - (GRID - 1) * CELL - ROAD) / 2;
  const oy = (H - (GRID - 1) * CELL - ROAD) / 2;

  // Horizontal roads (grid intersections: 0..GRID-2 X, 0..GRID-1 Y)
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID - 1; gx++) {
      // Prebuild ring road (y=0, y=6), central line (y=3), and some connection channels
      const isDefaultBuilt = 
        gy === 0 || 
        gy === 3 || 
        gy === 6 || 
        gx === 0 || 
        gx === 5 ||
        (gy === 1 && gx === 2) ||
        (gy === 5 && gx === 3);

      roads.push({
        id: id++,
        isHoriz: true,
        gx,
        gy,
        x1: ox + gx * CELL + ROAD,
        y1: oy + gy * CELL,
        x2: ox + (gx + 1) * CELL,
        y2: oy + gy * CELL + ROAD,
        congestion: 0,
        blocked: false,
        built: isDefaultBuilt
      });
    }
  }

  // Vertical roads (grid intersections: 0..GRID-1 X, 0..GRID-2 Y)
  for (let gx = 0; gx < GRID; gx++) {
    for (let gy = 0; gy < GRID - 1; gy++) {
      // Prebuild ring road (x=0, x=6), central line (x=3), and some connection channels
      const isDefaultBuilt = 
        gx === 0 || 
        gx === 3 || 
        gx === 6 || 
        gy === 0 || 
        gy === 5 ||
        (gx === 1 && gy === 2) ||
        (gx === 5 && gy === 3);

      roads.push({
        id: id++,
        isHoriz: false,
        gx,
        gy,
        x1: ox + gx * CELL,
        y1: oy + gy * CELL + ROAD,
        x2: ox + gx * CELL + ROAD,
        y2: oy + (gy + 1) * CELL,
        congestion: 0,
        blocked: false,
        built: isDefaultBuilt
      });
    }
  }

  return roads;
}

// Find path using Breadth First Search (BFS)
export function findPath(roads, gx1, gy1, gx2, gy2, ignoreBlocked = false) {
  const key = (x, y) => `${x},${y}`;
  const q = [{
    gx: gx1,
    gy: gy1,
    path: [{ gx: gx1, gy: gy1 }]
  }];
  const visited = new Set([key(gx1, gy1)]);

  while (q.length) {
    const { gx, gy, path } = q.shift();
    if (gx === gx2 && gy === gy2) return path;

    // Explore 4 neighbors
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = gx + dx;
      const ny = gy + dy;

      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
      if (visited.has(key(nx, ny))) continue;

      const r = getRoadBetween(roads, gx, gy, nx, ny);
      // Cars cannot travel on unbuilt roads. If not ignoreBlocked, they cannot travel on blocked roads.
      if (!r || !r.built) continue;
      if (!ignoreBlocked && r.blocked) continue;

      visited.add(key(nx, ny));
      q.push({
        gx: nx,
        gy: ny,
        path: [...path, { gx: nx, gy: ny }]
      });
    }
  }

  // Fallback: If we couldn't find a path avoiding blocked roads, try again but allowing blocked roads
  // (unbuilt roads are still forbidden, cars cannot drive through thin air!)
  if (!ignoreBlocked) {
    return findPath(roads, gx1, gy1, gx2, gy2, true);
  }

  return null;
}

// Calculate congestion scores based on vehicles
export function updateCongestion(roads, cars, W, H) {
  const size = Math.min(W - 100, H - 240);
  const cell = size / (GRID - 1);
  
  for (const r of roads) {
    if (!r.built) {
      r.congestion = 0;
      continue;
    }
    const mid = roadMid(r, W, H);
    let nearby = 0;
    
    // Count vehicles on or near this road segment
    for (const c of cars) {
      if (Math.abs(c.x - mid.x) < cell / 2 + 10 && Math.abs(c.y - mid.y) < cell / 2 + 10) {
        nearby++;
      }
    }
    
    // Base congestion is a function of car density
    r.congestion = Math.min(1, nearby / 5);
  }
}

// ─── COMPATIBILITY FUNCTIONS FOR UNIT TESTS ───
export const GRID_SIZE = 500;

export function initCity() {
  return {
    vehicles: generateVehicles(8),
    roads: ["roadA", "roadB", "roadC", "roadD"],
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
    road: ["roadA", "roadB", "roadC", "roadD"][Math.floor(Math.random() * 4)],
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

    return { ...v, x: newX, y: newY, dx: newDx, dy: newDy };
  });
}

export function detectCongestion(vehicles) {
  const roadCount = {};

  vehicles.forEach((v) => {
    roadCount[v.road] = (roadCount[v.road] || 0) + 1;
  });

  return Object.entries(roadCount)
    .filter(([_, count]) => count >= 3)
    .map(([road]) => road);
}

export function addIncident(state) {
  const road = ["roadA", "roadB", "roadC", "roadD"][Math.floor(Math.random() * 4)];
  const incident = {
    id: Date.now(),
    road,
    type: "accident",
    resolved: false,
  };

  return {
    ...state,
    incidents: [...state.incidents, incident],
  };
}

export function resolveIncident(state, incidentId) {
  return {
    ...state,
    incidents: state.incidents.map((inc) =>
      inc.id === incidentId ? { ...inc, resolved: true } : inc
    ),
  };
}