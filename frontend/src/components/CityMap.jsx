import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import Dashboard from "./Dashboard";
import ControlPanel from "./ControlPanel";
import {
  GRID,
  intersectionCenter,
  roadMid,
  getRoadBetween,
  buildRoads,
  findPath,
  updateCongestion
} from "../engine/simulation";

const CityMap = forwardRef(({
  isRunning,
  setIsRunning,
  speed,
  setSpeed,
  emergencyMode,
  setEmergencyMode,
  roadBuilderMode,
  setRoadBuilderMode,
  onAddIncident,
  onClearAll,
  onMapUpdate,
  onLogEvent,
  aiMode,
  hallucinationLevel,
  aiLogs,
  setAiLogs,
  aiThinking,
  setAiThinking,
  user,
  metrics,
  tick
}, ref) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Game states stored in refs for 60fps performance without React re-render overhead
  const stateRef = useRef({
    tick: 0,
    roads: [],
    cars: [],
    incidents: [],
    ambulance: null, // { gx, gy, path, step, progress, targetIncidentRoadId, returning, holdTicks, x, y }
    frameCounter: 0,
    width: 800,
    height: 600
  });

  // Tooltip UI state (managed in React for layout flexibility)
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, html: "" });

  // Expose methods to App.jsx parent
  useImperativeHandle(ref, () => ({
    triggerRandomIncident() {
      triggerIncident();
    },
    clearAllIncidents() {
      clearAll();
    }
  }));

  // Handle canvas sizing and resizing dynamically
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      canvas.width = width;
      canvas.height = height;
      stateRef.current.width = width;
      stateRef.current.height = height;
      
      drawMap();
    };

    // Initialize roads in state
    stateRef.current.roads = buildRoads(800, 600); // base values, size updates on resize anyway
    
    // Spawn initial cars
    stateRef.current.cars = [];
    for (let i = 0; i < 25; i++) {
      const car = spawnCar(stateRef.current.roads);
      if (car) stateRef.current.cars.push(car);
    }

    // Attach resize listener
    window.addEventListener("resize", handleResize);
    // Initial size trigger
    setTimeout(handleResize, 100);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync animation loop with play/pause and speed changes using delta time (dt)
  useEffect(() => {
    let animId;
    let lastTime = performance.now();
    let tickAccumulator = 0;

    const msPerTick = {
      1: 1000, // Speed 1: update state every 1000ms
      2: 500,  // Speed 2: update state every 500ms
      3: 250,  // Speed 3: update state every 250ms
      4: 120,  // Speed 4: update state every 120ms
      5: 50    // Speed 5: update state every 50ms
    }[speed] || 500;

    const renderLoop = (timestamp) => {
      if (!timestamp) timestamp = performance.now();
      const dt = Math.min(100, timestamp - lastTime); // cap at 100ms to avoid jumps
      lastTime = timestamp;

      if (isRunning) {
        // 1. Move all vehicles and visual entities smoothly using delta time
        updateVisuals(dt);
        
        // 2. Accumulate time for logical simulation ticks
        tickAccumulator += dt;
        while (tickAccumulator >= msPerTick) {
          updateSimulationTick();
          tickAccumulator -= msPerTick;
        }
        stateRef.current.frameCounter++;
      } else {
        // Even when paused, run visual update with dt=0 to keep roads rendering properly
        updateVisuals(0);
      }
      
      drawMap();
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, speed]);

  // Push stats from Canvas Ref to React parent state
  const pushStateToReact = () => {
    const s = stateRef.current;
    const congestedCount = s.roads.filter(r => r.built && r.congestion > 0.4).length;
    const blockedCount = s.roads.filter(r => r.built && r.blocked).length;
    const flowRate = Math.max(0, Math.round(100 - congestedCount * 2.5 - blockedCount * 12));

    onMapUpdate({
      tick: s.tick,
      metrics: {
        flowRate,
        congestedCount,
        incidentsCount: s.incidents.length,
        activeCars: s.cars.length
      },
      incidents: s.incidents,
      roads: s.roads
    });
  };

  // ─── CAR & PATHFINDING HELPERS ───
  const spawnCar = (roadsList) => {
    const builtRoads = roadsList.filter(r => r.built);
    if (builtRoads.length === 0) return null;

    const gx1 = Math.floor(Math.random() * GRID);
    const gy1 = Math.floor(Math.random() * GRID);
    let gx2, gy2;
    let attempts = 0;
    
    do {
      gx2 = Math.floor(Math.random() * GRID);
      gy2 = Math.floor(Math.random() * GRID);
      attempts++;
    } while ((gx2 === gx1 && gy2 === gy1) && attempts < 10);

    const path = findPath(roadsList, gx1, gy1, gx2, gy2);
    if (!path || path.length < 2) return null;

    const colors = ["#00d4ff", "#ff6b35", "#00ff88", "#ffb800", "#a78bfa", "#fb7185", "#34d399", "#f472b6"];
    
    return {
      gx: gx1,
      gy: gy1,
      targetGx: gx2,
      targetGy: gy2,
      path,
      step: 0,
      progress: 0.0, // Progress (0 to 1) along the current segment
      color: colors[Math.floor(Math.random() * colors.length)],
      speedFactor: 1 + Math.random() * 0.4,
      x: 0, // Pixel coords computed dynamically, stored for tooltip/logic
      y: 0
    };
  };

  // Triggered when an incident occurs or is resolved, forces cars to find new routes
  const rerouteAllCars = (newRoadsState) => {
    const s = stateRef.current;
    let reroutedCount = 0;
    s.cars.forEach(car => {
      if (car.step < car.path.length - 1) {
        const currentLoc = car.path[car.step];
        const next = car.path[car.step + 1];
        const r = getRoadBetween(newRoadsState, currentLoc.gx, currentLoc.gy, next.gx, next.gy);
        
        // If their current active road segment is no longer valid (either demolished or blocked)
        if (!r || !r.built || r.blocked) {
          // Snap the vehicle back to its last safe intersection node
          car.progress = 0.0;
          const lastSafePos = intersectionCenter(car.gx, car.gy, s.width, s.height);
          car.x = lastSafePos.x;
          car.y = lastSafePos.y;

          const newPath = findPath(newRoadsState, car.gx, car.gy, car.targetGx, car.targetGy);
          if (newPath) {
            car.path = newPath;
            car.step = 0;
            reroutedCount++;
          } else {
            // Completely trapped, respawn elsewhere
            const newCar = spawnCar(newRoadsState);
            if (newCar) Object.assign(car, newCar);
          }
        }
      }
    });
    if (reroutedCount > 0) {
      onLogEvent(`${reroutedCount} vehicule au fost redirecționate pe rute alternative.`, "🔄");
    }
  };

  // ─── AMBULANCE / EMERGENCY RESPONDER ───
  const spawnAmbulance = (incident) => {
    const roadSegment = stateRef.current.roads[incident.road];
    const path = findPath(stateRef.current.roads, 0, 0, roadSegment.gx, roadSegment.gy, true); // ignoreBlocked = true for emergency priority!
    if (!path) return null;

    onLogEvent(`Dispecerat: Ambulanța a plecat spre accident de la Spital. Traseu calculat cu prioritate semafoare.`, "🚑", "ambulance_dispatch");

    return {
      gx: 0,
      gy: 0,
      path,
      step: 0,
      progress: 0.0,
      targetIncidentRoadId: incident.road,
      returning: false,
      holdTicks: 0,
      x: 0,
      y: 0
    };
  };

  // ─── SIMULATION STATE UPDATE CYCLE ───
  // Move all entities smoothly using delta time (dt)
  const updateVisuals = (dt) => {
    const s = stateRef.current;
    
    // Smooth road color (congestion) transitions
    s.roads.forEach(r => {
      if (r.visualCongestion === undefined) {
        r.visualCongestion = r.congestion || 0;
      }
      if (dt > 0) {
        const diff = r.congestion - r.visualCongestion;
        r.visualCongestion += diff * (1 - Math.exp(-0.008 * dt));
      }
    });

    // 1. Move civilian cars smoothly
    s.cars.forEach(car => {
      if (car.step >= car.path.length - 1) {
        // If somehow stuck at destination, give it a new route immediately
        const newCar = spawnCar(s.roads);
        if (newCar) Object.assign(car, newCar);
        return;
      }

      const next = car.path[car.step + 1];
      const r = getRoadBetween(s.roads, car.path[car.step].gx, car.path[car.step].gy, next.gx, next.gy);
      
      // Fine progress step sized for 60 FPS (16.67ms base)
      const speedFactorVal = r && r.congestion > 0.75 ? 0.003 : r && r.congestion > 0.35 ? 0.009 : 0.018;
      
      car.progress += speedFactorVal * car.speedFactor * (speed / 2) * (dt / 16.67);
      if (car.progress > 1.0) car.progress = 1.0;
      
      // Calculate pixel coordinates dynamically
      const p1 = intersectionCenter(car.path[car.step].gx, car.path[car.step].gy, s.width, s.height);
      const p2 = intersectionCenter(next.gx, next.gy, s.width, s.height);
      car.x = p1.x + (p2.x - p1.x) * car.progress;
      car.y = p1.y + (p2.y - p1.y) * car.progress;
      
      if (car.progress >= 1.0) {
        car.progress = 0.0;
        car.gx = next.gx;
        car.gy = next.gy;
        car.step++;
        
        if (car.step >= car.path.length - 1) {
          // Immediately route to a new destination to keep driving seamlessly!
          const newCar = spawnCar(s.roads);
          if (newCar) {
            Object.assign(car, newCar);
          }
        }
      }
    });

    // 2. Move emergency ambulance smoothly
    if (s.ambulance) {
      const amb = s.ambulance;
      
      if (!amb.returning) {
        if (amb.step >= amb.path.length - 1) {
          const targetRoad = s.roads[amb.targetIncidentRoadId];
          const midPos = roadMid(targetRoad, s.width, s.height);
          amb.x = midPos.x;
          amb.y = midPos.y;
        } else {
          const next = amb.path[amb.step + 1];
          amb.progress += 0.024 * (speed / 2) * (dt / 16.67);
          if (amb.progress > 1.0) amb.progress = 1.0;
          
          const p1 = intersectionCenter(amb.path[amb.step].gx, amb.path[amb.step].gy, s.width, s.height);
          const p2 = intersectionCenter(next.gx, next.gy, s.width, s.height);
          amb.x = p1.x + (p2.x - p1.x) * amb.progress;
          amb.y = p1.y + (p2.y - p1.y) * amb.progress;
          
          if (amb.progress >= 1.0) {
            amb.progress = 0.0;
            amb.gx = next.gx;
            amb.gy = next.gy;
            amb.step++;
          }
        }
      } else {
        if (amb.step >= amb.path.length - 1) {
          // done
        } else {
          const next = amb.path[amb.step + 1];
          amb.progress += 0.024 * (speed / 2) * (dt / 16.67);
          if (amb.progress > 1.0) amb.progress = 1.0;
          
          const p1 = intersectionCenter(amb.path[amb.step].gx, amb.path[amb.step].gy, s.width, s.height);
          const p2 = intersectionCenter(next.gx, next.gy, s.width, s.height);
          amb.x = p1.x + (p2.x - p1.x) * amb.progress;
          amb.y = p1.y + (p2.y - p1.y) * amb.progress;
          
          if (amb.progress >= 1.0) {
            amb.progress = 0.0;
            amb.gx = next.gx;
            amb.gy = next.gy;
            amb.step++;
          }
        }
      }
    }
  };

  // Run logical simulation ticks (stats, dispatch checks, etc.)
  const updateSimulationTick = () => {
    const s = stateRef.current;
    s.tick++;

    // 1. Maintain active cars count
    while (s.cars.length < 28) {
      const c = spawnCar(s.roads);
      if (c) s.cars.push(c);
      else break;
    }

    // 2. Spawn completed cars new path
    s.cars.forEach(car => {
      if (car.step >= car.path.length - 1) {
        const newCar = spawnCar(s.roads);
        if (newCar) Object.assign(car, newCar);
      }
    });

    // 3. Ambulance logic (repair timing / returns)
    if (s.ambulance) {
      const amb = s.ambulance;
      if (!amb.returning && amb.step >= amb.path.length - 1) {
        const targetRoad = s.roads[amb.targetIncidentRoadId];
        amb.holdTicks++;
        if (amb.holdTicks === 1) {
          onLogEvent("Ambulanța a sosit la locul accidentului. Se acordă primul ajutor și se eliberează carosabilul.", "🏥");
        }
        
        if (amb.holdTicks >= 12) {
          targetRoad.blocked = false;
          targetRoad.congestion = 0;
          s.incidents = s.incidents.filter(i => i.road !== amb.targetIncidentRoadId);
          onLogEvent(`Incident soluționat pe tronsonul ${targetRoad.isHoriz ? "E-V" : "N-S"} [${targetRoad.gx},${targetRoad.gy}]. Segment deschis circulației.`, "✅", "incident_resolved");
          rerouteAllCars(s.roads);
          
          const returnPath = findPath(s.roads, targetRoad.gx, targetRoad.gy, 0, 0, true);
          if (returnPath) {
            amb.path = returnPath;
            amb.step = 0;
            amb.progress = 0.0;
            amb.returning = true;
            amb.holdTicks = 0;
            onLogEvent("Ambulanța se întoarce la unitatea de bază (Spital).", "🚑");
          } else {
            s.ambulance = null;
          }
        }
      } else if (amb.returning && amb.step >= amb.path.length - 1) {
        s.ambulance = null;
        onLogEvent("Ambulanța este pregătită pentru intervenții noi la Spital.", "🅿️");
      }
    } else {
      if (s.incidents.length > 0) {
        s.ambulance = spawnAmbulance(s.incidents[0]);
      }
    }

    // 4. Update density and congestion stats
    updateCongestion(s.roads, s.cars, s.width, s.height);

    // 5. Push state back to React Dashboard
    pushStateToReact();
  };

  // ─── USER TRIGGERED ACTIONS ───
  const triggerIncident = () => {
    const s = stateRef.current;
    const builtRoads = s.roads.filter(r => r.built && !r.blocked);
    if (builtRoads.length === 0) {
      onLogEvent("Nu s-a putut genera incident: Nu există străzi construite liber.", "⚠️");
      return;
    }

    const targetRoad = builtRoads[Math.floor(Math.random() * builtRoads.length)];
    const icons = ["🚗", "🔥", "🚧", "⚡", "🌊"];
    const types = ["Coliziune Auto", "Incendiu Carosabil", "Lucrări Drum", "Cablu Electric Doborât", "Inundație Locală"];
    const idx = Math.floor(Math.random() * icons.length);

    targetRoad.blocked = true;
    s.incidents.push({
      road: targetRoad.id,
      icon: icons[idx],
      type: types[idx],
      tick: s.tick
    });

    onLogEvent(`APARIȚIE INCIDENT: ${types[idx]} pe drumul ${targetRoad.isHoriz ? "E-V" : "N-S"} [${targetRoad.gx},${targetRoad.gy}]`, icons[idx], "incident_spawned");
    rerouteAllCars(s.roads);
    pushStateToReact();
  };

  const clearAll = () => {
    const s = stateRef.current;
    s.incidents = [];
    s.ambulance = null;
    s.roads.forEach(r => {
      r.blocked = false;
      r.congestion = 0;
    });
    // Recalculate civilian paths
    s.cars.forEach(car => {
      car.progress = 0.0;
      const newPath = findPath(s.roads, car.gx, car.gy, car.targetGx, car.targetGy);
      if (newPath) {
        car.path = newPath;
        car.step = 0;
      }
    });
    onLogEvent("Toate incidentele au fost curățate de operator. Trafic restabilit.", "🧹", "clear_all");
    pushStateToReact();
  };

  // ─── CANVAS DRAWING FUNCTIONS ───
  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const s = stateRef.current;

    ctx.clearRect(0, 0, s.width, s.height);

    // Draw tech background grid pattern
    ctx.strokeStyle = "rgba(0, 212, 255, 0.04)";
    ctx.lineWidth = 0.5;
    const gridSize = 24;
    for (let x = 0; x < s.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, s.height);
      ctx.stroke();
    }
    for (let y = 0; y < s.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(s.width, y);
      ctx.stroke();
    }

    // 1. Draw block buildings
    drawBlocks(ctx, s.width, s.height);

    // 2. Draw road paths
    drawRoadSegments(ctx, s.width, s.height);

    // 3. Draw intersections
    drawJunctions(ctx, s.width, s.height);

    // 4. Draw vehicles
    drawCars(ctx);

    // 5. Draw ambulance
    if (s.ambulance) {
      drawAmbulance(ctx);
    }

    // 6. Draw incidents
    drawIncidents(ctx, s.width, s.height);
  };

  const drawBlocks = (ctx, W, H) => {
    const isPowerSavingActive = stateRef.current.cars.length > 23;

    for (let gx = 0; gx < GRID - 1; gx++) {
      for (let gy = 0; gy < GRID - 1; gy++) {
        // Compute pixel coordinates dynamically
        const p1 = intersectionCenter(gx, gy, W, H);
        const p2 = intersectionCenter(gx + 1, gy + 1, W, H);
        
        const bx = p1.x + p1.road / 2 + 2;
        const by = p1.y + p1.road / 2 + 2;
        const bw = p2.x - p1.x - p1.road - 4;
        const bh = p2.y - p1.y - p1.road - 4;

        if (bw <= 0 || bh <= 0) continue;

        // Base ground block
        ctx.fillStyle = "#080c16";
        ctx.strokeStyle = "rgba(30, 41, 59, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        roundRect(ctx, bx, by, bw, bh, 6);
        ctx.fill();
        ctx.stroke();

        // Unique block styling (Hospital, School, Mall, Office)
        let label = "";
        let color = "#121b2d";
        let labelColor = "#64748b";

        if (gx === 0 && gy === 0) {
          label = "🏥 SPITAL";
          color = "rgba(255, 59, 59, 0.08)";
          labelColor = "#ff3b3b";
        } else if (gx === 2 && gy === 0) {
          label = "🏫 ȘCOALĂ";
          color = "rgba(255, 184, 0, 0.08)";
          labelColor = "#ffb800";
        } else if (gx === 0 && gy === 4) {
          label = "🛍️ MALL";
          color = "rgba(167, 139, 250, 0.08)";
          labelColor = "#a78bfa";
        } else if (gx === 4 && gy === 4) {
          label = "🏢 BIROURI";
          color = "rgba(0, 212, 255, 0.08)";
          labelColor = "#00d4ff";
        }

        ctx.fillStyle = color;
        ctx.strokeStyle = label ? labelColor + "40" : "transparent";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        roundRect(ctx, bx + 2, by + 2, bw - 4, bh - 4, 4);
        ctx.fill();
        if (label) ctx.stroke();

        // Windows drawing
        const rows = 3;
        const cols = 4;
        const winW = (bw - 16) / cols;
        const winH = 8;
        
        if (winW > 2 && winH > 2) {
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const winX = bx + 8 + c * (winW + 2);
              const winY = by + 28 + r * (winH + 4);
              
              const winLit = !isPowerSavingActive && ((gx * 3 + gy * 7 + r * 5 + c * 2) % 3 !== 0);
              
              ctx.fillStyle = winLit ? "rgba(255, 220, 50, 0.6)" : "rgba(26, 37, 53, 0.8)";
              ctx.fillRect(winX, winY, winW, winH);
            }
          }
        }

        // Draw label
        if (label && bw > 50) {
          ctx.font = 'bold 9px "Space Grotesk", sans-serif';
          ctx.fillStyle = labelColor;
          ctx.textAlign = "center";
          ctx.fillText(label, bx + bw / 2, by + 16);
        }
      }
    }
  };

  // Smooth color interpolation based on congestion (0.0 to 1.0)
  const getRoadColor = (congestion) => {
    // 0.0 (Fluid): rgb(22, 29, 49) [#161d31]
    // 0.5 (Moderate): rgb(255, 184, 0) [#ffb800]
    // 1.0 (Heavy): rgb(255, 107, 53) [#ff6b35]
    let r, g, b;
    if (congestion < 0.5) {
      const t = congestion / 0.5;
      r = Math.round(22 + (255 - 22) * t);
      g = Math.round(29 + (184 - 29) * t);
      b = Math.round(49 + (0 - 49) * t);
    } else {
      const t = (congestion - 0.5) / 0.5;
      r = 255;
      g = Math.round(184 + (107 - 184) * t);
      b = Math.round(0 + (53 - 0) * t);
    }
    return `rgb(${r}, ${g}, ${b})`;
  };

  const drawRoadSegments = (ctx, W, H) => {
    const s = stateRef.current;
    
    s.roads.forEach(r => {
      // Compute coordinates dynamically
      const p1 = intersectionCenter(r.isHoriz ? r.gx : r.gx, r.isHoriz ? r.gy : r.gy, W, H);
      const p2 = intersectionCenter(r.isHoriz ? r.gx + 1 : r.gx, r.isHoriz ? r.gy : r.gy + 1, W, H);
      
      const rx1 = r.isHoriz ? p1.x + p1.road / 2 : p1.x - p1.road / 2;
      const ry1 = r.isHoriz ? p1.y - p1.road / 2 : p1.y + p1.road / 2;
      const rx2 = r.isHoriz ? p2.x - p2.road / 2 : p2.x + p2.road / 2;
      const ry2 = r.isHoriz ? p2.y + p2.road / 2 : p2.y - p2.road / 2;
      
      const rw = rx2 - rx1;
      const rh = ry2 - ry1;

      if (!r.built) {
        if (roadBuilderMode) {
          ctx.strokeStyle = "rgba(0, 212, 255, 0.2)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(rx1, ry1, rw, rh);
          ctx.setLineDash([]);
        }
        return;
      }

      // Built roads
      if (r.blocked) {
        ctx.fillStyle = "rgba(255, 59, 59, 0.25)";
        ctx.strokeStyle = "rgba(255, 59, 59, 0.7)";
        ctx.lineWidth = 1;
        ctx.fillRect(rx1, ry1, rw, rh);
        ctx.strokeRect(rx1, ry1, rw, rh);
      } else {
        ctx.fillStyle = getRoadColor(r.visualCongestion !== undefined ? r.visualCongestion : r.congestion);
        ctx.fillRect(rx1, ry1, rw, rh);
        
        // Draw lane lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        if (r.isHoriz) {
          ctx.moveTo(rx1, ry1 + rh / 2);
          ctx.lineTo(rx2, ry1 + rh / 2);
        } else {
          ctx.moveTo(rx1 + rw / 2, ry1);
          ctx.lineTo(rx1 + rw / 2, ry2);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  };

  const drawJunctions = (ctx, W, H) => {
    const s = stateRef.current;
    
    for (let gx = 0; gx < GRID; gx++) {
      for (let gy = 0; gy < GRID; gy++) {
        const c = intersectionCenter(gx, gy, W, H);
        
        const connectedRoads = s.roads.filter(r => 
          r.built && (
            (r.isHoriz && r.gy === gy && (r.gx === gx || r.gx === gx - 1)) ||
            (!r.isHoriz && r.gx === gx && (r.gy === gy || r.gy === gy - 1))
          )
        );

        if (connectedRoads.length === 0) continue;

        const maxC = connectedRoads.reduce((max, r) => Math.max(max, r.visualCongestion !== undefined ? r.visualCongestion : r.congestion), 0);
        const hasBlockage = connectedRoads.some(r => r.blocked);

        if (hasBlockage) {
          ctx.fillStyle = "rgba(255, 59, 59, 0.25)";
        } else {
          ctx.fillStyle = getRoadColor(maxC);
        }
        ctx.fillRect(c.x - c.road / 2, c.y - c.road / 2, c.road, c.road);

        // Traffic Light
        const phase = (s.tick + gx * 13 + gy * 7) % 60;
        let isGreen = phase < 30;
        
        const hasHeavyCongestedRoad = connectedRoads.some(r => r.congestion > 0.7);
        if (hasHeavyCongestedRoad) {
          isGreen = true; // Traffic priority lock
        }
        
        const lightColor = hasBlockage ? "#ff3b3b" : isGreen ? "#00ff88" : "#ff3b3b";
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw neon glow for junction traffic lights (cheap overlay, no shadowBlur)
        ctx.fillStyle = lightColor;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }
  };

  const drawCars = (ctx) => {
    const s = stateRef.current;
    s.cars.forEach(car => {
      if (car.step >= car.path.length - 1) return;

      const next = car.path[car.step + 1];
      const p1 = intersectionCenter(car.path[car.step].gx, car.path[car.step].gy, s.width, s.height);
      const p2 = intersectionCenter(next.gx, next.gy, s.width, s.height);
      
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(angle);

      // Draw neon glow capsule (multi-pass transparency, highly optimized)
      ctx.fillStyle = car.color;
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      roundRect(ctx, -6.5, -4.5, 13, 9, 3);
      ctx.fill();

      // Solid body capsule
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = car.color;
      ctx.beginPath();
      roundRect(ctx, -4.5, -2.5, 9, 5, 1.8);
      ctx.fill();

      // Front Headlights
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(3.5, -2, 1, 1);
      ctx.fillRect(3.5, 1, 1, 1);

      // Rear Taillights
      ctx.fillStyle = "#ff3b3b";
      ctx.fillRect(-4.5, -2, 1, 1);
      ctx.fillRect(-4.5, 1, 1, 1);

      ctx.restore();
    });
  };

  const drawAmbulance = (ctx) => {
    const amb = stateRef.current.ambulance;
    if (!amb) return;
    const s = stateRef.current;
    
    let angle = 0;
    if (amb.step < amb.path.length - 1) {
      const next = amb.path[amb.step + 1];
      const p1 = intersectionCenter(amb.path[amb.step].gx, amb.path[amb.step].gy, s.width, s.height);
      const p2 = intersectionCenter(next.gx, next.gy, s.width, s.height);
      angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    } else {
      const targetRoad = s.roads[amb.targetIncidentRoadId];
      if (targetRoad) {
        angle = targetRoad.isHoriz ? 0 : Math.PI / 2;
      }
    }
    
    const sirenColor = Math.floor(performance.now() / 150) % 2 === 0 ? "#ff3b3b" : "#00d4ff";
    
    ctx.save();
    ctx.translate(amb.x, amb.y);
    ctx.rotate(angle);
    
    // Pulsing outer siren glow (zero performance impact)
    ctx.fillStyle = sirenColor;
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    // Solid white chassis (larger than civilian cars)
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    roundRect(ctx, -7, -4.5, 14, 9, 2.5);
    ctx.fill();
    
    // Red Cross icon on roof
    ctx.fillStyle = "#ff3b3b";
    ctx.fillRect(-3, -0.8, 6, 1.6);
    ctx.fillRect(-0.8, -3, 1.6, 6);

    // Flashing siren dome
    ctx.fillStyle = sirenColor;
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Headlights
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(6, -3, 1, 1.5);
    ctx.fillRect(6, 1.5, 1, 1.5);

    // Taillights
    ctx.fillStyle = "#ff3b3b";
    ctx.fillRect(-7, -3, 1, 1.5);
    ctx.fillRect(-7, 1.5, 1, 1.5);
    
    ctx.restore();
  };

  const drawIncidents = (ctx, W, H) => {
    stateRef.current.incidents.forEach(inc => {
      const roadSegment = stateRef.current.roads[inc.road];
      if (!roadSegment) return;
      const mid = roadMid(roadSegment, W, H);
      
      // Continuous 60fps pulsing sine-wave based on performance.now()
      const pulse = Math.sin(performance.now() * 0.005) * 0.22 + 0.78;
      
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = "#ff3b3b";
      ctx.lineWidth = 1.8;
      
      ctx.beginPath();
      ctx.arc(mid.x, mid.y, 14, 0, Math.PI * 2);
      ctx.stroke();

      // Outer glow pulse ring
      ctx.strokeStyle = "#ff3b3b";
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = (1.0 - pulse) * 0.5;
      ctx.beginPath();
      ctx.arc(mid.x, mid.y, 14 + (1.0 - pulse) * 12, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.globalAlpha = 1.0;
      ctx.font = "12px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(inc.icon, mid.x, mid.y);
      ctx.restore();
    });
  };

  const roundRect = (ctx, x, y, w, h, r) => {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  };

  // ─── CLICK HANDLERS (ROAD BUILDER / ACCIDENTS) ───
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let closestRoad = null;
    let closestDist = 24;
    
    const s = stateRef.current;

    s.roads.forEach(r => {
      const mid = roadMid(r, s.width, s.height);
      const d = Math.sqrt((mx - mid.x) ** 2 + (my - mid.y) ** 2);
      if (d < closestDist) {
        closestDist = d;
        closestRoad = r;
      }
    });

    if (!closestRoad) return;

    if (emergencyMode) {
      if (!closestRoad.built) {
        onLogEvent("Nu poți plasa un incident pe o stradă neconstruită!", "⚠️");
        return;
      }
      if (closestRoad.blocked) {
        onLogEvent("Tronsonul selectat are deja un incident activ.", "⚠️");
        return;
      }
      
      const icons = ["🚗", "🔥", "🚧", "⚡", "🌊"];
      const types = ["Coliziune Auto", "Incendiu Carosabil", "Lucrări Drum", "Cablu Electric Doborât", "Inundație Locală"];
      const idx = Math.floor(Math.random() * icons.length);

      closestRoad.blocked = true;
      s.incidents.push({
        road: closestRoad.id,
        icon: icons[idx],
        type: types[idx],
        tick: s.tick
      });

      onLogEvent(`ACCIDENT PLASAT DE OPERATOR: ${types[idx]} pe tronsonul [${closestRoad.gx},${closestRoad.gy}]`, icons[idx], "incident_spawn_click");
      rerouteAllCars(s.roads);
      setEmergencyMode(false);
      pushStateToReact();
    }
    
    else if (roadBuilderMode) {
      if (closestRoad.blocked) {
        onLogEvent("Nu poți demola o stradă blocată de un incident activ!", "⚠️");
        return;
      }

      closestRoad.built = !closestRoad.built;
      
      const icon = closestRoad.built ? "🏗️" : "🧹";
      const message = closestRoad.built
        ? `STRADĂ NOUĂ CONSTRUITĂ: Tronson ${closestRoad.isHoriz ? "E-V" : "N-S"} la poziția [${closestRoad.gx},${closestRoad.gy}]`
        : `STRADĂ DEMOLATĂ: Tronson ${closestRoad.isHoriz ? "E-V" : "N-S"} eliminat la poziția [${closestRoad.gx},${closestRoad.gy}]`;

      onLogEvent(message, icon, closestRoad.built ? "road_built" : "road_demolished");
      
      rerouteAllCars(s.roads);
      pushStateToReact();
    }
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let hoveredRoad = null;
    const s = stateRef.current;

    s.roads.forEach(r => {
      const mid = roadMid(r, s.width, s.height);
      if (Math.abs(mx - mid.x) < 20 && Math.abs(my - mid.y) < 20) {
        hoveredRoad = r;
      }
    });

    if (hoveredRoad) {
      const inc = s.incidents.find(i => i.road === hoveredRoad.id);
      let statusHtml = "";
      
      if (!hoveredRoad.built) {
        statusHtml = `<span style="color:var(--muted)">🚫 NECONSTRUITĂ</span><br><span style="font-size:10px;color:var(--accent)">Click în mod Constructor pentru asamblare.</span>`;
      } else if (hoveredRoad.blocked) {
        statusHtml = `<span style="color:var(--red);font-weight:600">🚨 BLOCATĂ (${inc ? inc.type : "Accident"})</span>`;
      } else {
        const cong = Math.round(hoveredRoad.congestion * 100);
        const color = cong > 75 ? "var(--red)" : cong > 35 ? "var(--amber)" : "var(--green)";
        statusHtml = `<b>OPERAȚIONALĂ</b><br>Trafic: <span style="color:${color};font-weight:600">${cong}%</span>`;
      }

      const roadName = `${hoveredRoad.isHoriz ? "E-V" : "N-S"} Tronson [${hoveredRoad.gx}, ${hoveredRoad.gy}]`;

      setTooltip({
        show: true,
        x: e.clientX + 15,
        y: e.clientY - 20,
        html: `<strong>${roadName}</strong><br>${statusHtml}`
      });
    } else {
      setTooltip({ show: false, x: 0, y: 0, html: "" });
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#060913",
        overflow: "hidden"
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => setTooltip({ show: false, x: 0, y: 0, html: "" })}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          background: "#050811",
          cursor: emergencyMode || roadBuilderMode ? "crosshair" : "default"
        }}
      />

      {/* Floating HUD - Dashboard Metrics at the Top */}
      <div style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        right: "20px",
        display: "flex",
        pointerEvents: "none",
        zIndex: 10
      }}>
        <div style={{ pointerEvents: "auto", display: "flex", gap: "10px", width: "100%", justifyContent: "space-between" }}>
          {/* Title Panel */}
          <div className="cyber-panel" style={{
            padding: "8px 16px",
            background: "rgba(13, 18, 34, 0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            border: "1px solid rgba(30, 41, 59, 0.6)"
          }}>
            <div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "1px" }}>Control Center</div>
            <div className="logo" style={{ fontSize: "16px" }}>CITY<span>SIM</span></div>
          </div>
          
          {/* Horizontal metrics cards */}
          <div style={{ display: "flex", gap: "10px" }}>
            <div className={`metric-card ${metrics.flowRate > 80 ? 'ok' : metrics.flowRate > 50 ? 'warn' : 'crit'}`} style={{ background: "rgba(13, 18, 34, 0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(30, 41, 59, 0.6)", minWidth: "115px", padding: "8px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <span className="val" style={{ fontSize: "20px" }}>{metrics.flowRate}%</span>
              <span className="lbl" style={{ fontSize: "9px" }}>Debit Trafic</span>
            </div>
            
            <div className={`metric-card ${metrics.congestedCount === 0 ? 'ok' : metrics.congestedCount < 5 ? 'warn' : 'crit'}`} style={{ background: "rgba(13, 18, 34, 0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(30, 41, 59, 0.6)", minWidth: "115px", padding: "8px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <span className="val" style={{ fontSize: "20px" }}>{metrics.congestedCount}</span>
              <span className="lbl" style={{ fontSize: "9px" }}>Blocaje Străzi</span>
            </div>
            
            <div className={`metric-card ${metrics.incidentsCount === 0 ? 'ok' : 'crit'}`} style={{ background: "rgba(13, 18, 34, 0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(30, 41, 59, 0.6)", minWidth: "115px", padding: "8px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <span className="val" style={{ fontSize: "20px" }}>{metrics.incidentsCount}</span>
              <span className="lbl" style={{ fontSize: "9px" }}>Accidente</span>
            </div>
            
            <div className="metric-card ok" style={{ background: "rgba(13, 18, 34, 0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(30, 41, 59, 0.6)", minWidth: "115px", padding: "8px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <span className="val" style={{ fontSize: "20px" }}>{metrics.activeCars}</span>
              <span className="lbl" style={{ fontSize: "9px" }}>Vehicule</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Control HUD at Bottom-Left */}
      <div style={{
        position: "absolute",
        bottom: "20px",
        left: "20px",
        zIndex: 10,
        width: "280px"
      }}>
        <div className="cyber-panel" style={{
          background: "rgba(13, 18, 34, 0.85)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(30, 41, 59, 0.6)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          padding: "12px"
        }}>
          <ControlPanel
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            speed={speed}
            setSpeed={setSpeed}
            emergencyMode={emergencyMode}
            setEmergencyMode={setEmergencyMode}
            roadBuilderMode={roadBuilderMode}
            setRoadBuilderMode={setRoadBuilderMode}
            onAddIncident={onAddIncident}
            onClearAll={onClearAll}
          />
        </div>
      </div>

      {/* Floating Sparkline Overlay at Bottom-Right */}
      <div style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        zIndex: 10,
        width: "280px"
      }}>
        <Dashboard metrics={metrics} tick={tick} overlayMode={true} />
      </div>

      {/* Floating HUD Alert Overlay */}
      {emergencyMode && (
        <div style={{
          position: "absolute",
          top: "92px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(255, 59, 59, 0.95)",
          color: "white",
          padding: "6px 16px",
          borderRadius: "6px",
          fontWeight: "600",
          fontSize: "11px",
          letterSpacing: "0.5px",
          border: "1px solid var(--red)",
          boxShadow: "0 0 15px rgba(255,59,59,0.4)",
          pointerEvents: "none",
          zIndex: 10
        }}>
          🚨 MOD PLASARE INCIDENT: CLICK PE DRUM CONSTRUIT
        </div>
      )}

      {roadBuilderMode && (
        <div style={{
          position: "absolute",
          top: "92px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0, 212, 255, 0.95)",
          color: "black",
          padding: "6px 16px",
          borderRadius: "6px",
          fontWeight: "700",
          fontSize: "11px",
          letterSpacing: "0.5px",
          border: "1px solid var(--accent)",
          boxShadow: "0 0 15px rgba(0,212,255,0.4)",
          pointerEvents: "none",
          zIndex: 10
        }}>
          🏗️ CONSTRUCTOR STRĂZI: CLICK PENTRU CONSTRUIRE / DEMOLARE
        </div>
      )}

      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="cyber-tooltip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            display: "block"
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.html }}
        />
      )}
    </div>
  );
});

export default CityMap;