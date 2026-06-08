# Testarea Automată & Evaluarea Agenților

Proiectul Smart City Simulator dispune de o suită completă de teste automate rulate cu **Vitest**. Testele validează logica de mutare a vehiculelor, detecția blocajelor în trafic, deciziile agenților AI și funcționarea algoritmului dinamic de pathfinding.

## Executarea Testelor

Pentru a rula testele local, navighează în folderul `frontend` și rulează comanda:

```bash
npm test
```

Pentru a rula testele cu raport de acoperire (dacă este instalat vitest coverage):
```bash
npm run test -- --coverage
```

Toate testele sunt rulate automat la fiecare Push sau Pull Request pe ramurile `dev` și `main` în pipeline-ul de CI/CD (**GitHub Actions**).

---

## Structura Testelor Automate (14 teste în total)

### 1. Planificare Trasee (`src/__tests__/pathfinding.test.js`)
Testează motorul dinamic de rutare BFS:
- **Cale directă:** Verifică dacă se găsește o cale validă între două puncte pe hartă.
- **Evitare drumuri neconstruite:** Garantează că mașinile refuză să circule pe tronsoane de drum unde `built = false` (străzi neconstruite/demolate în mod Builder).
- **Ocolire accidente vs Ambulanță:** Verifică dacă mașinile civile ocolesc automat străzile blocate de accidente (`blocked = true`), în timp ce Ambulanța (cu prioritate) primește permisiunea de a trece pentru a soluționa cazul.

### 2. Motorul de Simulare (`src/__tests__/simulation.test.js`)
Verifică integritatea stării orașului:
- **Inițializare:** `initCity` creează o stare validă (8 mașini, ticks = 0, fără congestii inițiale).
- **Actualizare ticks:** `updateCity` incrementează timpul simulării.
- **Verificare margini:** Garantează că vehiculele rămân în limitele grid-ului (`0` și `GRID_SIZE`) și ricoșează corect la margini.
- **Detecție congestie:** Se activează congestia dacă pe un segment se adună cel puțin 3 vehicule.

### 3. Agentul de Trafic (`src/__tests__/trafficAgent.test.js`)
Evaluează deciziile Agentului de Trafic:
- **Congestie:** Dacă o stradă depășește nivelul de încărcare de 80%, agentul recomandă `DIVERT_TRAFFIC`.
- **Trafic normal:** Dacă încărcarea este sub prag, agentul recomandă `MAINTAIN`.

### 4. Agentul de Urgențe (`src/__tests__/emergencyAgent.test.js`)
Evaluează deciziile Agentului de Urgențe:
- **Incident activ:** Când apare un incident, agentul recomandă `DISPATCH_AMBULANCE` și solicită prioritate semafoare pe traseu (`requestTrafficPriority = true`).

---

## Integrare CI/CD (GitHub Actions)

Fișierul `.github/workflows/ci.yml` conține regulile automate de verificare:
1. Se descarcă codul pe o mașină Ubuntu virtuală.
2. Se instalează dependențele cu `npm ci`.
3. Se rulează suita de teste cu `npm test`.
4. Se compilează proiectul cu `npm run build` pentru a se asigura că nu există erori de bundling.