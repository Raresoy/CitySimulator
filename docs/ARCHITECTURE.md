# Arhitectura Sistemului - Smart City Simulator

Smart City Simulator folosește o arhitectură web integrată, bazată pe React (frontend), un motor de simulare grafic pe Canvas și un backend serverless integrat în serverul de dezvoltare Vite (Connect middleware).

## Diagrama Arhitecturii

```mermaid
flowchart TD
    User[Utilizator] -->|Click / Interacțiune| UI[Interfață React]
    UI -->|Pornire/Oprire/Viteză| Controller[Control Panel]
    UI -->|Autentificare / Salvare Istoric| Middleware[Vite Dev Server API Middleware]
    
    Middleware -->|Citește/Scrie| DB[(Mock DB: JSON Files)]
    
    Controller -->|Modificări Hartă / Moduri| CityMap[CityMap Canvas Component]
    
    subgraph Simulation Loop (60 FPS)
        CityMap -->|Citește Străzi/Stare| Engine[Simulation Engine]
        Engine -->|BFS Pathfinding| Rerouting[Dynamic Router]
        Rerouting -->|Mută Vehicule| Vehicles[Cars Ref]
        Engine -->|Urmărește Accidente| Ambulance[Ambulance Dispatch Ref]
    end
    
    Vehicles -->|Update Date Ticks| UI
    Ambulance -->|Update Date Evenimente| Log[AI Agent Log]
    
    subgraph AI Decision Layer
        Log -->|Analiză date & Prompts| TrafficAgent[Traffic Agent]
        Log -->|Dispecerat Ambulanță| EmergencyAgent[Emergency Agent]
        Log -->|Protocol ECO - Dimming| EnergyAgent[Energy Agent]
    end
```

---

## Componente Principale

### 1. Frontend Shell & State Management (`App.jsx`)
- Gestionează starea de autentificare (dacă utilizatorul nu este logat, se afișează `Auth.jsx`).
- Coordonează sincronizarea metricilor venite din bucla Canvas (ticks, debit trafic, număr blocaje, incidente) și le trimite către panourile secundare.
- Salvează acțiunile operatorului (construcție străzi, incident rezolvat) apelând backend-ul local `/api/simulation/save`.

### 2. Vite Dev Server API Middleware (`vite.config.js`)
Pentru a evita nevoia pornirii unui al doilea proces Node.js, am utilizat hook-ul `configureServer` din Vite pentru a integra un API direct în serverul de dev:
- `/api/auth/register` & `/api/auth/login`: Înregistrează și validează credențialele utilizatorilor în `data/users.json`.
- `/api/simulation/save` & `/api/simulation/history`: Salvează și returnează istoricul rulărilor în `data/history.json`.
- `/api/ai/proxy`: Intermediază cererile către instanța locală de Ollama (`http://localhost:11434`), rezolvând problemele de CORS.

### 3. React Canvas Renderer (`CityMap.jsx`)
- Rulează o buclă `requestAnimationFrame` la 60 FPS.
- **Optimizare Performanță:** Mutarea mașinilor și desenarea lor se fac direct pe Canvas utilizând referințe (`useRef`), ocolind reconcilierea DOM-ului virtual React pentru a menține 60 FPS stabili.
- Trimite actualizări de stare către React doar o dată la fiecare Tick al simulării (o frecvență mult mai mică, controlată de viteză).

---

## Algoritmi & Logica Simulării

### Căutarea în lățime (BFS Pathfinding)
Harta orașului este modelată ca un graf de tip grilă de dimensiune $7 \times 7$. Fiecare intersecție reprezintă un nod. Legăturile dintre intersecții reprezintă străzi (maximum 84 de segmente).

Algoritmul BFS calculează drumul cel mai scurt între două intersecții conform regulilor:
1. **Vehicule Civile:** Nu pot folosi străzi neconstruite (`built = false`) și ocolesc străzile blocate de un incident (`blocked = true`).
2. **Ambulantă (Prioritar):** Nu poate folosi străzi neconstruite (lipsă asfalt), dar ignoră blocajele rutiere (`ignoreBlocked = true`) deoarece are prioritate de deplasare la semafor.

### Ciclul de Viață al unui Incident (Emergency Dispatch)
```text
[Incident Generat] 
       ↓ (Detectat de Emergency Agent)
[Spawnează Ambulanță la Spital (0,0)]
       ↓ (BFS Pathfinding cu prioritate)
[Ambulantă se deplasează spre accident]
       ↓ (Ajunge la destinație)
[Așteaptă 12 ticks pentru acordare prim ajutor]
       ↓ (Incident rezolvat: Strada se redeschide)
[Recalculare traseu înapoi la Spital]
       ↓ (Ambulanța ajunge la Spital)
[Dezafectare ambulanță]
```

### Optimizarea Consumului (ECO Mode)
Când numărul de vehicule depășește 23, Agentul de Energie ordonă trecerea în modul ECO. Vizual, clădirile și stâlpii își sting ferestrele și luminile în Canvas pentru a reduce consumul pe rețea cu 30%.