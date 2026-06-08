import { describe, test, expect } from "vitest";
import { buildRoads, findPath, getRoadBetween } from "../engine/simulation";

describe("Sistem Pathfinding dinamic", () => {
  test("ar trebui să găsească o cale validă între două puncte pe un drum direct", () => {
    // Generăm străzile pe un ecran de 550x550 pixeli
    const roads = buildRoads(550, 550);
    
    // Rulăm căutarea de cale de la intersecția (0,0) (Spital) la (3,3) (Intersecție centrală)
    const path = findPath(roads, 0, 0, 3, 3);
    
    expect(path).not.toBeNull();
    expect(path[0]).toEqual({ gx: 0, gy: 0 });
    expect(path[path.length - 1]).toEqual({ gx: 3, gy: 3 });
  });

  test("nu ar trebui să poată folosi străzi care nu sunt construite (built = false)", () => {
    const roads = buildRoads(550, 550);
    
    // Demolăm toate străzile care pornesc din nodul (0,0)
    roads.forEach(r => {
      if ((r.gx === 0 && r.gy === 0) || (r.isHoriz && r.gy === 0 && r.gx === 0) || (!r.isHoriz && r.gx === 0 && r.gy === 0)) {
        r.built = false;
      }
    });

    // Încercăm să planificăm o cale din (0,0) în (1,0)
    const path = findPath(roads, 0, 0, 1, 0);
    expect(path).toBeNull(); // Niciun drum nu e construit din (0,0)
  });

  test("mașinile civile ocolesc străzile blocate (blocked = true), dar ruta de urgență le poate folosi", () => {
    const roads = buildRoads(550, 550);
    
    // Găsim strada directă de la (0,0) la (1,0) și o blocăm cu un accident
    const r = getRoadBetween(roads, 0, 0, 1, 0);
    expect(r).not.toBeNull();
    r.built = true;
    r.blocked = true;

    // Blocăm și drumul de la (0,0) la (0,1) ca să forțăm ocolirea
    const rVertical = getRoadBetween(roads, 0, 0, 0, 1);
    if (rVertical) {
      rVertical.built = true;
      rVertical.blocked = true;
    }

    // A. O mașină normală (ignoreBlocked = false) nu poate trece prin blocaje directe, deci va returna null dacă toate ieșirile sunt blocate
    const pathCivilian = findPath(roads, 0, 0, 1, 0, false);
    
    // B. Ambulanța (ignoreBlocked = true) are prioritate și trece direct prin blocaje pentru salvare
    const pathAmbulance = findPath(roads, 0, 0, 1, 0, true);
    
    expect(pathAmbulance).not.toBeNull();
    expect(pathAmbulance[1]).toEqual({ gx: 1, gy: 0 });
  });
});
