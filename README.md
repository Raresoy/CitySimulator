# Smart City Simulator - Proiect MDS

Smart City Simulator este o aplicație web de înaltă fidelitate ce simulează dinamica unui oraș inteligent. Sistemul folosește **3 agenți AI locali** (Trafic, Urgențe, Energie) și o buclă grafică pe Canvas la 60 FPS în React, gestionată în siguranță de un backend serverless integrat în serverul de dezvoltare Vite.

## Membrii Echipei & Roluri

- **Membru 1**: Configurare proiect, README principal, raport utilizare AI, configurare pipeline CI/CD (GitHub Actions).
- **Membru 2**: UI/UX Hartă CityMap Canvas, dashboard cu grafice SVG evolutive și componente vizuale (glassmorphism).
- **Membru 3**: Motorul de simulare grafic, deplasare vehicule, detectare blocaje rutiere și pathfinding BFS dinamic.
- **Membru 4**: Dezvoltarea logică a celor 3 agenți AI, configurare API local, scriere suite de teste unitare în Vitest.

---

## A. Demonstrație Proiect (Live Demo & Prezentare)
- **Prezentare locală**: 
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  Deschideți apoi: `http://localhost:5173/`

---

## B. Procesul de Dezvoltare Software cu AI (Cerințe Laborator)

### 1. User Stories (Minim 10) & Backlog (2 pct)

Am definit 10 User Stories care acoperă toate funcționalitățile dezvoltate:

1. **US1 (Planificare Dinamică Rute)**: *Ca cetățean*, vreau ca vehiculul meu să își recalculeze traseul dacă o stradă este blocată de un incident, *pentru a* nu rămâne blocat în trafic și a găsi rute alternative.
2. **US2 (Construirea Străzilor)**: *Ca urbanist*, vreau să pot adăuga străzi prin click pe grilă (modul Builder), *pentru a* conecta zone izolate ale orașului în funcție de evoluția fluxului de mașini.
3. **US3 (Demolarea Străzilor)**: *Ca urbanist*, vreau să pot demola străzi din grilă prin click (modul Builder), *pentru a* reconfigura drumurile sau a efectua lucrări de restructurare.
4. **US4 (Provocare Incidente)**: *Ca operator al dispeceratului*, vreau să pot plasa manual incidente (accident, incendiu, inundație) pe orice stradă construită prin click, *pentru a* testa reziliența orașului.
5. **US5 (Trimitere Ambulanță)**: *Ca cetățean*, vreau ca o ambulanță cu sirene vizuale să plece automat de la Spital spre un incident activ, *pentru a* acorda ajutor și a elibera carosabilul.
6. **US6 (Economisire Energie - ECO Mode)**: *Ca manager energetic*, vreau ca iluminatul clădirilor și al străzilor să se stingă (ECO mode) când numărul de mașini depășește limita nominală, *pentru a* proteja rețeaua electrică de supraîncărcare.
7. **US7 (Prioritizare Semafoare)**: *Ca șofer de ambulanță*, vreau ca semafoarele de pe traseul meu de intervenție să devină automat verzi, *pentru a* ajunge în siguranță și fără întârzieri la accident.
8. **US8 (Panou Control Viteza)**: *Ca utilizator*, vreau să pot pune pauză și să pot modifica viteza simulării (1x - 5x), *pentru a* analiza în detaliu deplasarea mașinilor și deciziile agenților.
9. **US9 (Autentificare Securizată)**: *Ca operator*, vreau să mă înregistrez și să mă autentific în platformă, *pentru ca* modificările mele pe hartă (străzi construite/demolate) să fie înregistrate în baza de date pe numele meu.
10. **US10 (Vizualizare Istoric)**: *Ca administrator*, vreau să pot vizualiza un istoric în timp real al acțiunilor anterioare efectuate în simulator, *pentru* auditul deciziilor sistemului.

#### Product Backlog (Trello / Jira reprezentat în Markdown)
| ID | Cerință / Punct de Backlog | Prioritate | Status | Sprint |
|---|---|---|---|---|
| US1 | Motorul de simulare vehicule cu deplasare pe grilă | Ridicată | Finalizat | Sprint 1 |
| US9 | Pagina de autentificare utilizator (Register/Login) | Medie | Finalizat | Sprint 1 |
| US2 | Modul Builder: adăugare străzi la click | Ridicată | Finalizat | Sprint 2 |
| US3 | Modul Builder: eliminare străzi la click | Ridicată | Finalizat | Sprint 2 |
| US5 | Rutarea și deplasarea ambulanței de la Spital | Ridicată | Finalizat | Sprint 2 |
| US6 | Integrare ECO Mode (stingere lumini la supraîncărcare) | Medie | Finalizat | Sprint 2 |
| US10| Istoric evenimente salvat în fișiere de tip bază de date | Medie | Finalizat | Sprint 2 |

---

### 2. Diagrame (UML, Arhitectură, Workflows) (1 pct)
Diagramele sunt incluse în documentația proiectului.

---

### 3. Source Control cu Git (1 pct)

Echipa lucrează respectând fluxul Git:
- Dezvoltarea se face pe ramuri dedicate (`feature/*` sau `fix/*`), care sunt ulterior integrate în ramura `dev` prin Pull Requests.
- Ramura `main` conține exclusiv versiunile de release stabile.
- Fiecare student a efectuat **minim 5 commit-uri** semnate, documentând clar progresul.

**Ramuri principale folosite în proiect:**
- `feature/project-setup`: Setup-ul inițial de React, structură foldere, linter și fișiere de config.
- `feature/city-map-ui`: Interfața grafică a hărții și elementele de Canvas.
- `feature/simulation-engine`: Rutarea mașinilor cu algoritmul BFS și generarea congestiilor.
- `features/AI-agents`: Logica de decizie pentru cei 3 agenți AI locali.
- `fix/ai-integration`: Conectarea agenților AI la UI și adăugarea opțiunilor de local LLM (Ollama).

---

### 4. Teste Automate (Inclusiv Evals de Agenți) (2 pct)

Aplicația dispune de **14 teste automate** care rulează în framework-ul **Vitest**:
- Testarea deciziilor de redirecționare ale Agentului de Trafic.
- Testarea deciziei de dispatch a Agentului de Urgență.
- Testarea dinamică a grafului de pathfinding (evitarea segmentelor neconstruite de către mașini și prioritatea ambulanței pe străzi blocate).


---

### 5. Raportare Bug și Rezolvare cu Pull Request (1 pct)

- **Bug raportat**: *[BUG #11] Ambulanța se blochează în mod nedefinit pe hartă*
  - **Descriere**: Dacă un utilizator demolase (setat `built = false`) o stradă de pe traseul de întoarcere al ambulanței în timp ce aceasta era activă la locul incidentului, ambulanța nu mai găsea cale spre spital (0,0) și rămânea blocată în buclă infinită pe Canvas, împiedicând rezolvarea altor accidente.
- **Rezolvare (Pull Request)**: Am modificat logica de întoarcere în `CityMap.jsx`: dacă ambulanța nu poate găsi o cale validă înapoi spre spital (din cauza modificărilor de grilă făcute de operator în timp real), sistemul execută o recalculare de urgență prin drumuri secundare sau, în ultimă instanță, folosește un protocol de teleportare de siguranță la unitatea de bază. Codul a fost integrat în `dev` printr-un PR aprobat și testat.

---

### 6. Pipeline CI/CD (1 pct)

Fiecare commit și Pull Request trimis către ramurile `dev` și `main` declanșează automat execuția pipeline-ului nostru de Integrare Continuă (**GitHub Actions**):
- Fişier workflow: [ci.yml](file:///Users/mihneavicol/FACULTATE/CitySimulator/.github/workflows/ci.yml)
- **Etape automate**:
  1. Descărcarea codului sursă (`checkout`).
  2. Setup Node.js v20.
  3. Instalarea curată a dependențelor (`npm ci`).
  4. Executarea celor 14 teste unitare (`npm test`).
  5. Rularea build-ului de producție (`npm run build`).

---

### 7. Raport despre utilizarea instrumentelor de AI (2 pct)

Un raport complet despre modul în care instrumentele de AI (Gemini 3.5 Flash, ChatGPT, Copilot) au fost utilizate pentru generare cod, debug, planificare backlog și documentație:

---

## C. Prezentare Detaliată Proiect (Raport Academic / LaTeX)

Această secțiune conține varianta în format Markdown a raportului tehnic detaliat (disponibil și ca document sursă LaTeX în [presentation.tex](file:///Users/mihneavicol/FACULTATE/CitySimulator/presentation.tex) pentru compilare ca PDF academic).

### 1. Introducere și Obiectivele Proiectului
Obiectivul principal al proiectului **Smart City Simulator** este dezvoltarea unei simulări urbane interactive în care un operator uman cooperează cu agenți AI pentru gestionarea infrastructurii unui oraș inteligent. Aplicația oferă o simulare de trafic dinamică, posibilitatea construirii și demolării drumurilor în timp real, apariția aleatorie sau manuală a incidentelor (coliziuni auto, incendii, drumuri inundate) și rezolvarea automată a acestora prin dispatch-ul unui vehicul de intervenție prioritizat (ambulanța).

### 2. Arhitectura și Componentele Sistemului
Aplicația este construită pe o structură hibridă **React + Vite**. Pentru a evita necesitatea unei configurări complicate de baze de date (SQLite/PostgreSQL) pe mașina asistentului de laborator care va evalua live demo-ul, am conceput o arhitectură serverless-hybrid prin scrierea unui middleware direct în configurarea serverului de dezvoltare Vite (`vite.config.js`). Acest mecanism interceptează cererile către `/api/*`, gestionând conturile utilizatorilor în mod securizat (`users.json`) și stocând logurile simulării în fișierul bază de date locală `history.json`.

### 3. Tehnici de Optimizare și Randare Grafică la 60 FPS (Fizică & Tranziții Line)
Pentru a obține o experiență vizuală premium, fluidă și lipsită de sacadare (rezolvând problema redării fragmentate de tip slideshow/„semi poze”), am implementat următoarele optimizări matematice și grafice:

- **Sistem de Animație pe bază de Delta Time ($dt$)**: Într-o buclă tradițională bazată exclusiv pe cadre, viteza depinde de rata de refresh a ecranului. Am configurat simulatorul să măsoare diferența de timp reală dintre cadre (`performance.now()`) pentru a scala proporțional deplasarea vehiculelor. Mișcarea devine perfect fluidă indiferent de fluctuațiile ratei de cadre ale browserului.
- **Interpolarea Congestiei Drumurilor (Smooth Color Fade)**: Anterior, străzile își schimbau culoarea (verde, galben, roșu) instantaneu, producând flash-uri inestetice. Am introdus o proprietate vizuală intermediară `visualCongestion` care aproximează exponențial valoarea logică reală ($C_{\text{vizual}} \leftarrow C_{\text{vizual}} + (C_{\text{real}} - C_{\text{vizual}}) \times (1 - e^{-0.008 \times dt})$). Tranziția culorilor se face lin printr-un gradient RGB continuu.
- **Deplasarea Continuă și Evitarea Blocajelor**: Am mutat logica de respawn a mașinilor direct în pasul de actualizare vizuală (la 60 FPS). Când un vehicul ajunge la finalul rutei sale, i se asignează instant o altă destinație, eliminând înghețarea mașinilor la intersecții.
- **Glow Neon Optimizat și Capsule Orientate**: Randarea strălucirii prin Canvas `shadowBlur` este extrem de costisitoare pentru performanță (filtru de blur Gaussian pe CPU). Am înlocuit acest proces prin desenarea a două capsule suprapuse cu transparență diferită. De asemenea, vehiculele sunt rotite automat folosind `Math.atan2(dy, dx)` în direcția de mers și sunt dotate cu faruri albe și stopuri roșii.
- **Flashing Sirene 60fps**: Ambulanța include semnale luminoase (sirene) care alternează roșu/albastru pe baza funcției de timp continuu `performance.now()`, generând un efect vizual modern.

### 4. Integrarea Agenților AI & Moduri LLM
Simulatorul rulează trei agenți software inteligenți specializați:
1. **Agentul de Trafic**: Monitorizează congestiile, ajustează semafoarele și aplică priorități de trafic.
2. **Agentul de Urgență**: Detectează incidentele active, trimite ambulanța cu pathfinding prioritar spre locul accidentului, eliberează carosabilul și returnează ambulanța la spital.
3. **Agentul de Energie**: Activează modul economic (Eco Mode), stingând luminile clădirilor și reducând iluminatul stradal când rețeaua este supraîncărcată de mașini.

Aplicația oferă **3 moduri de rulare LLM**:
- **Offline Smart Agent (Implicit)**:  Reguli euristice avansate cu generator local de explicații și rapoarte text.
- **Transformers.js**: Descarcă un model LLM mic direct în browser (e.g. `LaMini-78M`), rulând complet izolat prin WebAssembly/WebGPU.
- **Ollama**: Se conectează la un server local Ollama activ pe portul implicit `11434` al utilizatorului, utilizând modele mai mari pentru a genera răspunsuri complexe.

### 5. Testarea Automată și pipeline-ul CI/CD
Aplicația folosește **Vitest** pentru rularea celor 14 teste automate ce verifică pathfinding-ul dinamic în caz de străzi blocate/demolate. Pipeline-ul de Integrare Continuă (**GitHub Actions**) din `.github/workflows/ci.yml` rulează automat suita de teste unitare și build-ul de producție la fiecare Pull Request deschis către ramurile `dev` și `main`.
