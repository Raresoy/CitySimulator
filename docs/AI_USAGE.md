# Utilizarea Instrumentelor de AI în Dezvoltare

Acest document descrie modul în care instrumentele de Inteligență Artificială (Gemini 3.5 Flash, Copilot) au fost utilizate pe parcursul dezvoltării proiectului Smart City Simulator pentru a asigura respectarea integrală a cerințelor MDS.

## Instrumente AI utilizate
- **Gemini 3.5 Flash (Antigravity)**: Utilizat ca agent principal pentru refactorizarea arhitecturii, scrierea codului de frontend, configurarea middleware-ului Vite și scrierea testelor automate.
- **ChatGPT / Github Copilot**: Utilizate pentru asistență în scrierea codului inițial și documentare.

## Cum a fost utilizat AI în fiecare Etapă

### 1. Definire Cerințe și Backlog
- AI a generat ideea de proiect (Simulator urban inteligent cu agenți de trafic, urgențe și energie).
- A ajutat la structurarea a 10 User Stories descrise în format standard (As a... I want to... So that...).

### 2. Refactorizare Arhitecturală (Upgrade la React + Vite)
- **Problemă**: Codul inițial rula ca o pagină simplă HTML cu un script inline de 1000 de linii, fără a folosi cu adevărat React sau Vite.
- **Soluție propusă de AI**: Migrarea completă în componente React (`App`, `CityMap`, `Dashboard`, `ControlPanel`, `AICenter`, `LearningCenter`).
- **Optimizare AI**: AI a sugerat păstrarea stării simulării 60 FPS în referințe `useRef` pentru a preveni re-randarea DOM-ului virtual React la fiecare cadru, obținând 60 FPS stabili.

### 3. Dezvoltare Backend Serverless (Vite Connect Middleware)
- AI a generat codul de middleware din `vite.config.js` care extinde serverul de dezvoltare Vite pentru a procesa apeluri API de înregistrare, autentificare, salvare istoric în fișiere JSON locale și proxy-uri AI de localhost.

### 4. Conectarea Agenților AI locali și Evals
- AI a scris codul care conectează simulatorul cu o instanță locală de Ollama (rulând Gemma:2b sau Llama 3) și a implementat "Offline Smart Agent" ca o alternativă locală robustă cu niveluri configurabile de halucinație.

### 5. Testare Automată
- AI a generat fișierul de teste unitare `src/__tests__/pathfinding.test.js` pentru validarea algoritmului BFS, testarea restricțiilor pe segmente neconstruite și prioritatea ambulanței în trafic.
- Toate cele 14 teste trec cu succes în Vitest.

## Verificare Umană (Human-in-the-loop)
Toate sugestiile generate de AI au fost testate local de echipă. S-a verificat că aplicația compilează fără erori cu `npm run build`, rulează la 60 FPS și că testele automate sunt integrate în pipeline-ul CI/CD.