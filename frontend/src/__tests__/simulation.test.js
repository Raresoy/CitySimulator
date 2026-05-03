import {
    initCity,
    updateCity,
    detectCongestion,
    addIncident,
    resolveIncident,
    GRID_SIZE,
} from "../engine/simulation";

describe("initCity", () => {
    test("returneaza un state valid", () => {
        const state = initCity();
        expect(state.vehicles).toHaveLength(8);
        expect(state.congestion).toEqual([]);
        expect(state.incidents).toEqual([]);
        expect(state.tick).toBe(0);
    });
});

describe("updateCity", () => {
    test("incrementeaza tick-ul", () => {
        const state = initCity();
        const updated = updateCity(state);
        expect(updated.tick).toBe(1);
    });

    test("muta vehiculele", () => {
        const state = initCity();
        const updated = updateCity(state);
        const moved = updated.vehicles.some(
            (v, i) => v.x !== state.vehicles[i].x || v.y !== state.vehicles[i].y
        );
        expect(moved).toBe(true);
    });

    test("vehiculele raman in grid", () => {
        let state = initCity();
        for (let i = 0; i < 100; i++) {
            state = updateCity(state);
        }
        state.vehicles.forEach((v) => {
            expect(v.x).toBeGreaterThanOrEqual(0);
            expect(v.x).toBeLessThanOrEqual(GRID_SIZE);
            expect(v.y).toBeGreaterThanOrEqual(0);
            expect(v.y).toBeLessThanOrEqual(GRID_SIZE);
        });
    });
});

describe("detectCongestion", () => {
    test("detecteaza congestie cand sunt 3+ masini pe acelasi road", () => {
        const vehicles = [
            { id: 1, road: "roadA" },
            { id: 2, road: "roadA" },
            { id: 3, road: "roadA" },
            { id: 4, road: "roadB" },
        ];
        const congestion = detectCongestion(vehicles);
        expect(congestion).toContain("roadA");
        expect(congestion).not.toContain("roadB");
    });

    test("returneaza array gol daca nu e congestie", () => {
        const vehicles = [
            { id: 1, road: "roadA" },
            { id: 2, road: "roadB" },
        ];
        expect(detectCongestion(vehicles)).toEqual([]);
    });
});

describe("addIncident", () => {
    test("adauga un incident in state", () => {
        const state = initCity();
        const updated = addIncident(state);
        expect(updated.incidents).toHaveLength(1);
        expect(updated.incidents[0].resolved).toBe(false);
        expect(updated.incidents[0].type).toBe("accident");
    });
});

describe("resolveIncident", () => {
    test("marcheaza incidentul ca resolved", () => {
        let state = initCity();
        state = addIncident(state);
        const incidentId = state.incidents[0].id;
        const resolved = resolveIncident(state, incidentId);
        expect(resolved.incidents[0].resolved).toBe(true);
    });
});