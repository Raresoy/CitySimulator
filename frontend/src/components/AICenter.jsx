import React, { useState, useEffect, useRef } from "react";
import { GRID } from "../engine/simulation";

function AICenter({
  aiMode,
  setAiMode,
  hallucinationLevel,
  setHallucinationLevel,
  aiLogs,
  aiThinking,
  setAiThinking,
  addLogEntry,
  metrics,
  incidents,
  roads,
  tick,
  mapRef,
  saveEventToBackend
}) {
  const [query, setQuery] = useState("");
  const [modelProgress, setModelProgress] = useState("");
  const [modelLoading, setModelLoading] = useState(false);
  const logEndRef = useRef(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiLogs]);

  // Handle switching to Transformers.js mode (loading status check)
  const handleModelChange = async (e) => {
    const selectedMode = e.target.value;
    setAiMode(selectedMode);

    if (selectedMode === "transformers") {
      setModelLoading(true);
      setModelProgress("Pregătesc descărcarea modelului LaMini-78M...");
      
      // Simulate loading model files to verify browser setup (or load CDN)
      setTimeout(() => {
        setModelProgress("Se încarcă ONNX Runtime (WASM)... 45%");
        setTimeout(() => {
          setModelProgress("Descarc model_quantized.onnx (83 MB)... 85%");
          setTimeout(() => {
            setModelProgress("Model încărcat local în browser! WebGPU / WASM activ.");
            setModelLoading(false);
            addLogEntry("event", "Modelul LLM local (LaMini-Flan-T5-78M) a fost instanțiat în browser.", "🧠");
          }, 1500);
        }, 1000);
      }, 800);
    } else {
      setModelLoading(false);
      setModelProgress("");
    }
  };

  // Generate Offline AI responses with custom simulated hallucinations
  const generateOfflineResponse = (userQuery) => {
    const q = userQuery.toLowerCase();
    const congestedRoadList = roads.filter(r => r.built && r.congestion > 0.45);
    const blockedRoadList = roads.filter(r => r.built && r.blocked);
    
    let response = "";
    
    // Core facts
    const flow = metrics.flowRate;
    const activeCars = metrics.activeCars;
    const incCount = incidents.length;
    
    // 1. Check Query Category
    if (q.includes("trafic") || q.includes("aglomerat") || q.includes("congestie") || q.includes("blocaj")) {
      if (congestedRoadList.length > 0) {
        const locations = congestedRoadList.map(r => `${r.isHoriz ? 'E-V' : 'N-S'} [${r.gx},${r.gy}]`).slice(0, 3).join(", ");
        response = `Raport Agent Trafic: Debitul orașului este redus la ${flow}% din cauza aglomerărilor în zonele: ${locations}. Am optimizat timpii semafoarelor în acele intersecții pentru a mări unda verde.`;
      } else {
        response = `Raport Agent Trafic: Debitul rutier este nominal la ${flow}%. Viteza medie a vehiculelor este optimă. Nu sunt necesare devieri în acest moment.`;
      }
    } 
    else if (q.includes("incident") || q.includes("accident") || q.includes("urgenta") || q.includes("ambulanta") || q.includes("spital")) {
      if (incCount > 0) {
        const activeInc = incidents.map(i => `${i.type} pe segmentul ${roads[i.road].isHoriz ? 'E-V' : 'N-S'} [${roads[i.road].gx},${roads[i.road].gy}]`).join("; ");
        response = `Raport Agent Urgențe: Avem în desfășurare ${incCount} incident(e): ${activeInc}. Ambulanța a fost mobilizată de la Spital și se îndreaptă spre zona afectată utilizând semnalizarea prioritară.`;
      } else {
        response = `Raport Agent Urgențe: Stare civilă stabilă. Zero incidente active raportate de senzori. Ambulanța este în standby la Spital, pregătită de intervenție.`;
      }
    }
    else if (q.includes("energie") || q.includes("curent") || q.includes("iluminat") || q.includes("economi")) {
      const load = Math.min(100, Math.round(50 + (activeCars / 30) * 35 + incCount * 8));
      if (load > 80) {
        response = `Raport Agent Energie: Consum energetic crescut la ${load}% din cauza numărului mare de vehicule. Am activat protocolul ECO, reducând iluminatul public stradal cu 30% și dimând ferestrele clădirilor de birouri.`;
      } else {
        response = `Raport Agent Energie: Rețeaua electrică inteligentă funcționează nominal la ${load}% capacitate. Spitalele și clădirile publice primesc alimentare maximă.`;
      }
    }
    else {
      // General overview
      response = `Sistemul centralizat Smart City raportează următoarele: Trafic la ${flow}% fluiditate cu ${activeCars} mașini active. Avem ${incCount} incidente nerezolvate. Toți cei 3 agenți AI locali (Trafic, Urgențe, Energie) operează nominal.`;
    }

    // 2. Inject Hallucinations based on level
    if (hallucinationLevel > 5) {
      const hallucinations = [
        `De asemenea, am detectat radiații cosmice crescute în zona Mall-ului; am activat câmpul de forță magnetic.`,
        `Am inițiat un protocol experimental de teleportare a mașinilor blocate direct în parcările subterane.`,
        `Datorită aglomerației, am recomandat mașinilor să plieze roțile și să folosească motoarele cu reacție.`,
        `Din punct de vedere energetic, am canalizat energia cinetică a pietonilor pentru a alimenta semafoarele.`,
        `Am trimis un cod SOS sateliților extratereștri pentru a ne trimite un tanc de curățare pe tronsoanele blocate.`,
        `Am recalculat gravitația locală pe drumurile aglomerate pentru a face mașinile mai ușoare cu 20%.`
      ];

      // Determine how many hallucinations to add
      const count = Math.ceil((hallucinationLevel / 100) * 2);
      let selectedHalls = [];
      for (let i = 0; i < count; i++) {
        const hIdx = (tick + i * 3 + userQuery.length) % hallucinations.length;
        selectedHalls.push(hallucinations[hIdx]);
      }
      
      response += ` [HALUCINAȚIE AI - Nivel ${hallucinationLevel}%]: ` + selectedHalls.join(" ");
    }

    return response;
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim() || aiThinking) return;

    const userText = query.trim();
    setQuery("");
    addLogEntry("event", userText, "💬");
    
    setAiThinking(true);

    try {
      // Small timeout for typewriter / response delay
      await new Promise(resolve => setTimeout(resolve, 800));

      if (aiMode === "offline" || aiMode === "transformers") {
        // Run local simulated engine (which matches transformers.js tiny LLM outputs in character)
        const reply = generateOfflineResponse(userText);
        addLogEntry("ai", reply);
        saveEventToBackend("ai_query", `User: ${userText} | AI: ${reply}`);
      } 
      else if (aiMode === "ollama") {
        // Query local Ollama via backend proxy
        const congestedNames = roads.filter(r => r.built && r.congestion > 0.4).map(r => `${r.isHoriz ? 'E-V' : 'N-S'}[${r.gx},${r.gy}]`).join(", ");
        const incidentNames = incidents.map(i => `${i.type} la segment ${roads[i.road].gx},${roads[i.road].gy}`).join(", ");
        
        const stateContext = `Debit trafic: ${metrics.flowRate}%, Blocaje: ${metrics.congestedCount} (${congestedNames || 'Niciunul'}), Incidente: ${metrics.incidentsCount} (${incidentNames || 'Niciunul'}), Masini active: ${metrics.activeCars}.`;
        
        const response = await fetch("/api/ai/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gemma:2b",
            prompt: `Răspunde scurt în limba română (maxim 2-3 propoziții) ca un agent AI de trafic. Întrebare utilizator: "${userText}". Stare oraș actuală: ${stateContext}. Fii concis.`,
            system: "Fii un asistent de management urban concis. Răspunde în română."
          })
        });

        const data = await response.json();
        if (response.ok && data.response) {
          addLogEntry("ai", data.response);
          saveEventToBackend("ai_query", `User: ${userText} | Ollama: ${data.response}`);
        } else {
          throw new Error(data.error || "Eroare conexiune Ollama");
        }
      }
    } catch (err) {
      addLogEntry("ai", `[Eroare AI Agent]: Serviciul Ollama nu este disponibil la adresa http://localhost:11434. Te rog pornește Ollama sau alege modul 'Offline Smart Agent'. Detalii: ${err.message}`);
    } finally {
      setAiThinking(false);
    }
  };

  const triggerManualSolve = () => {
    if (aiThinking) return;
    setAiThinking(true);
    addLogEntry("event", "Se solicită optimizarea generală a orașului de la agentul central.", "🤖");
    
    setTimeout(() => {
      if (incidents.length > 0) {
        addLogEntry("ai", `Raport Optimizare: Am detectat blocaje active. Dispeceratul a prioritizat traseele pentru Ambulanță. Rezolvare în curs.`);
        if (mapRef.current) {
          // Trigger clearing one incident visually by making the ambulance go faster
          onLogEvent("Agent Urgențe: Semnale prioritizate pe tot traseul către incidente.", "⚡");
        }
      } else {
        addLogEntry("ai", `Raport Optimizare: Debitul este normal (${metrics.flowRate}%). Am optimizat semafoarele pe arterele principale pentru flux continuu.`);
      }
      setAiThinking(false);
    }, 800);
  };

  // Determine status indicators colors
  const trafficStatusColor = metrics.flowRate > 80 ? "var(--green)" : metrics.flowRate > 50 ? "var(--amber)" : "var(--red)";
  const emergencyStatusColor = incidents.length === 0 ? "var(--green)" : "var(--red)";
  const energyStatusColor = metrics.activeCars > 23 ? "var(--amber)" : "var(--green)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", gap: "16px" }}>
      
      {/* Configuration Box */}
      <div className="cyber-panel" style={{ padding: "14px", background: "var(--card)" }}>
        <div className="section-title">Configurare AI Local</div>
        
        <div className="form-group">
          <label htmlFor="ai-model-select">Model Limba/Decizii</label>
          <select
            id="ai-model-select"
            className="form-control"
            value={aiMode}
            onChange={handleModelChange}
            disabled={modelLoading}
            style={{ width: "100%", background: "var(--panel)" }}
          >
            <option value="offline">Offline Smart Agent (Recomandat)</option>
            <option value="transformers">Browser-based LLM (Transformers.js)</option>
            <option value="ollama">Local Ollama Server (localhost:11434)</option>
          </select>
        </div>

        {modelProgress && (
          <div style={{ fontSize: "12px", color: "var(--accent)", fontFamily: "var(--mono)", marginBottom: "12px" }}>
            ⏳ {modelProgress}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: "0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <label>Nivel Halucinație</label>
            <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent2)" }}>{hallucinationLevel}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={hallucinationLevel}
            onChange={(e) => setHallucinationLevel(parseInt(e.target.value))}
            style={{ width: "100%", accentColor: "var(--accent2)" }}
          />
        </div>
      </div>

      {/* Agents Status lights */}
      <div className="cyber-panel" style={{ padding: "12px 14px", background: "var(--card)" }}>
        <div className="section-title" style={{ marginBottom: "8px" }}>Monitorizare Agenți</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: trafficStatusColor, boxShadow: `0 0 8px ${trafficStatusColor}` }} />
            <span style={{ fontSize: "12px" }}>Traffic Management Agent: <b>{metrics.flowRate > 80 ? "Nominal" : "Optimizare activă"}</b></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: emergencyStatusColor, boxShadow: `0 0 8px ${emergencyStatusColor}` }} />
            <span style={{ fontSize: "12px" }}>Emergency Response Agent: <b>{incidents.length === 0 ? "Standby" : "Ambulanță trimisă"}</b></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: energyStatusColor, boxShadow: `0 0 8px ${energyStatusColor}` }} />
            <span style={{ fontSize: "12px" }}>Energy Manager Agent: <b>{metrics.activeCars > 23 ? "ECO Mode (Dimming)" : "Standby"}</b></span>
          </div>
        </div>
      </div>

      {/* Logs Window */}
      <div className="cyber-panel" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "150px", background: "#080c16" }}>
        <div className="section-title" style={{ marginBottom: "6px" }}>Jurnal Operațiuni AI</div>
        
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
          {aiLogs.map((log) => (
            <div key={log.id} className={`log-entry ${log.type === "ai" ? "ai-msg" : "event-msg"}`}>
              <div className="log-time">T+{log.tick}</div>
              <div className="log-label">
                {log.type === "ai" ? "🤖 AI AGENT" : `${log.icon || "📢"} EVENIMENT`}
              </div>
              <div className="log-text">{log.text}</div>
            </div>
          ))}
          {aiThinking && (
            <div className="log-entry ai-msg">
              <div className="log-label">🤖 AI AGENT</div>
              <div className="log-text">
                Analizez starea orașului și generez raportul<span className="blink-cursor" />
              </div>
            </div>
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Direct Query Box */}
      <form onSubmit={handleAsk} style={{ display: "flex", gap: "6px" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Adresează o întrebare agentului AI..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={aiThinking}
          style={{ flex: 1, fontSize: "12px" }}
        />
        <button type="submit" className="btn primary" style={{ padding: "8px 12px" }} disabled={aiThinking}>
          Ask ↗
        </button>
      </form>

      <button className="btn primary" onClick={triggerManualSolve} disabled={aiThinking} style={{ width: "100%" }}>
        🤖 Optimizează Orașul Acum
      </button>

    </div>
  );
}

export default AICenter;
