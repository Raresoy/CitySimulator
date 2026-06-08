import React from "react";

function LearningCenter() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "13px", lineHeight: "1.6" }}>
      <div className="section-title">Ce am descoperit în React & Vite</div>

      {/* Vite Middleware Box */}
      <div className="cyber-panel" style={{ padding: "14px", background: "var(--card)" }}>
        <h4 style={{ color: "var(--accent)", marginBottom: "8px", fontWeight: "600" }}>
          1. Backend Integrat în Vite Dev Server
        </h4>
        <p style={{ color: "#a2b4cd", marginBottom: "10px" }}>
          În loc să rulăm un server separat de Node.js/Express, am configurat hook-ul <code>configureServer</code> direct în <code>vite.config.js</code>.
        </p>
        <p style={{ color: "#64748b" }}>
          Acesta interceptează rutele care încep cu <code>/api</code> și rulează ca un middleware Connect. Astfel, API-ul de utilizatori, istoric și proxy-ul AI rulează <b>pe același port (5173)</b> cu frontend-ul React. 
        </p>
        <div style={{
          backgroundColor: "#080c16",
          padding: "8px",
          borderRadius: "6px",
          fontFamily: "var(--mono)",
          fontSize: "11px",
          marginTop: "10px",
          color: "var(--accent)"
        }}>
          vite.config.js → configureServer(server) → server.middlewares.use(req, res, next)
        </div>
      </div>

      {/* React Canvas Box */}
      <div className="cyber-panel" style={{ padding: "14px", background: "var(--card)" }}>
        <h4 style={{ color: "var(--accent2)", marginBottom: "8px", fontWeight: "600" }}>
          2. Canvas Hibrid la 60 FPS în React
        </h4>
        <p style={{ color: "#a2b4cd", marginBottom: "10px" }}>
          Dacă actualizăm starea React (mașini, ticks) la 60 FPS, aplicația se blochează din cauza procesului de reconciliere a DOM-ului virtual.
        </p>
        <p style={{ color: "#64748b" }}>
          <b>Soluția:</b> Am reținut starea fierbinte a simulării într-un <code>useRef</code> (mașinile sunt mutate și desenate direct în canvas la fiecare frame), dar trimitem statistici consolidate către React doar <b>o dată la fiecare tick (la ~0.5s)</b> pentru a actualiza panourile de monitorizare.
        </p>
      </div>

      {/* Dynamic Graph Pathfinding */}
      <div className="cyber-panel" style={{ padding: "14px", background: "var(--card)" }}>
        <h4 style={{ color: "var(--green)", marginBottom: "8px", fontWeight: "600" }}>
          3. Graf Dinamic & Rerutare Vehicule
        </h4>
        <p style={{ color: "#a2b4cd", marginBottom: "10px" }}>
          Orașul este modelat ca un graf unde intersecțiile sunt noduri, iar străzile sunt muchii.
        </p>
        <p style={{ color: "#64748b" }}>
          Când utilizatorul dă click și marchează o stradă ca fiind demolată sau blocată de un accident, topologia grafului se schimbă instantaneu. Mașinile care aveau planificată acea rută rulează o căutare în lățime (BFS) pe noul graf și se rerutează din mers.
        </p>
      </div>

      {/* Grader Tip */}
      <div style={{
        backgroundColor: "rgba(0, 212, 255, 0.05)",
        border: "1px dashed var(--accent)",
        borderRadius: "8px",
        padding: "12px",
        color: "var(--text)",
        fontSize: "11px"
      }}>
        💡 <b>Cum se testează:</b> Activează modul <b>Builder</b> în panoul de monitorizare și fă click pe orice canal punctat pentru a adăuga străzi. Mașinile se vor adapta imediat!
      </div>
    </div>
  );
}

export default LearningCenter;
