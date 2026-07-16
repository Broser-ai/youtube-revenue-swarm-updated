# Projektstatus: Cirkel-Projektet (Cirkel Link)
*Sidst opdateret: 10. juli 2026*

Dette dokument giver en fuld, gennemsigtig status over udviklingen af Cirkel-projektet baseret på en udtømmende lokal filsystems- og terminal-audit af `/app/applet` (/ projektroden). 

---

## 📊 1. Modenhedskort (Trin 3 Domæner)

Nedenstående tabel viser den aktuelle status for de enkelte funktionelle domæner i kildekoden. Alle angivne statusser er understøttet af konkrete filstier og linjenumre:

| Domæne | Status | Bevis (Filstier & Linjer) | Beskrivelse / Bemærkninger |
| :--- | :--- | :--- | :--- |
| **Identitet & Autentificering** | **Delvist implementeret** | `/src/components/MitIDAuth.tsx` (L15, L25, L37)<br>`/src/lib/firebase.ts` (L61-L106) | Simuleret OIDC/PKCE-flow i frontend med code verifier og challenge. Firebase Auth understøtter både ægte login og en simuleret gæste-session som fallback, hvis API-nøgler mangler. |
| **Produkt-/varekatalog** | **Implementeret** | `/server.ts` (L36-L164)<br>`/src/components/ScanTab.tsx` (L118-L249) | Integreret med Gemini 3.5 AI (`/api/scan`) til materialescan samt en fuldt funktionel lokal faldgruppe (GS1/GTIN-stregkoder for mælk, sodavand, øl). |
| **Return-point registry** | **Implementeret** | `/src/components/ScanTab.tsx` (L472)<br>`/src/components/RecyclingCenterMap.tsx` | Definerer præcise geografiske lokationer for "Cirkel IoT Smart-Spande" i Aarhus og København, understøttet af et interaktivt kortmodul. |
| **Return-orkestrering** | **Implementeret** | `/src/components/ScanTab.tsx` (L1566) | Fuldt "scan-til-retur"-flow med kamera/upload, detaljeret AR-materiale-split, points/kroner tildeling, og udrulning til wallet. Understøtter en offline-kø (`pendingScans`). |
| **Risk/fraud-engine** | **Implementeret** | `/src/components/ScanTab.tsx` (L1386, L481) | Forhindrer snyd ved at tjekke billede-hash (`getImageHash`) mod tidligere scanninger. Beregner desuden geografisk afstand til smarte spande vha. `getDistanceKm` (Haversine). |
| **Ledger/wallet/payout** | **Implementeret / Delvist simuleret** | `/supabase_schema.sql` (L59-L120)<br>`/src/components/wallet/WalletTab.tsx` | Supabase indeholder et færdigt kryptografisk chainskema med automatisk SHA-256 hashberegning. Payout (udbetaling) til MobilePay i DKK simuleres sikkert i frontenden mod `localStorage`. |
| **Case management** | **Ikke fundet i kodebasen** | *Ingen filer fundet* | Der er ikke implementeret et system til manuel sagsbehandling, reviews eller tvist-håndtering i den nuværende kode. |
| **Audit/evidence-lag** | **Implementeret** | `/src/components/ScanTab.tsx` (L1350, L540-L650) | Live kamera-feed opsamling og konvertering til base64-billedstrømme til verifikation. AR-opdeling af emballagedele (f.eks. låg, krave, karton) giver synligt audit-bevis. |
| **Reporting & Dashboards** | **Implementeret** | `/src/components/SystemsTab.tsx` (L51-L90)<br>`/src/components/CO2Calculator.tsx` | B2B/Kommune rapportering med interaktive diagrammer i `Recharts` (Area, Pie, Bar) samt en avanceret interaktiv CO2- og milepælsberegner til klimaindsatsen. |
| **Databaseskema** | **Implementeret** | `/supabase_schema.sql` (L16-L75)<br>`/firebase-blueprint.json` (L1-L71) | Komplet relationsskema for PostgreSQL/Supabase (`profiles`, `scans`, `ledger`) samt et NoSQL skema til Firestore med tilhørende adgangsregler (`firestore.rules`). |
| **API-endepunkter** | **Implementeret** | `/server.ts` (L37, L167, L339) | Tre fuldt fungerende Express API-endepunkter: `/api/scan` (materialescan via Gemini), `/api/b2b-advisor` (ESG/EPR rådgivning) og `/api/chat` (AI Sorteringsassistent). |
| **Frontend/app-skærme** | **Implementeret** | `/src/App.tsx` (L21) | Robust Single Page Application med fire primære skærme (tabs): Scan, Wallet, Profil og Systems (B2B/Admin). |
| **Tests** | **Ikke fundet i kodebasen** | *Ingen testfiler fundet* | Projektet har i øjeblikket ingen enhedstests, integrationstests eller testafhængigheder konfigureret i `package.json`. |
| **CI/CD & Infrastruktur** | **Delvist implementeret** | `/package.json` (L6-L12) | Scripting til lokal afvikling og pakning (`tsx server.ts`, `vite build`, `esbuild`) er defineret. Ingen Dockerfiles eller GitHub Actions er dog gemt i mappen (orkestreres eksternt af Cloud Run-platformen). |

---

## 🕒 2. Tidslinje-fortælling og arkitektonisk udvikling

Analysen af projektmappen og mappen `/src/backup` (der indeholder tidligere versioner af `App.tsx`, `ScanTab.tsx`, `WalletTab.tsx`, `server.ts` og `types.ts`) giver os et spændende indblik i projektets historiske udvikling:

1. **Fase 1: Den Enkle Prototype (Historisk fundament)**
   De oprindelige filer i `/src/backup` viser, at projektet startede som en enkel borgerrettet genbrugsapp. Den fokuserede primært på simple scanninger (`ScanTab`), en basal oversigt over opsparet pant (`WalletTab`) og en lokal brugerprofil (`ProfilTab`), som kørte rent lokalt uden store serverkrav.
   
2. **Fase 2: Full-Stack & AI Integration (Juni/Juli 2026)**
   Projektet blev udvidet med en Express-server i `/server.ts` og integreret med den moderne `@google/genai` SDK (`gemini-3.5-flash`). Dette gjorde det muligt at udføre avanceret, dynamisk materialescan og AI-drevet sorteringsvejledning. Forbindelsen til henholdsvis Firebase (Firestore) og Supabase (PostgreSQL) blev etableret som robuste databaser, begge forberedt med mock-fallbacks til offline-udvikling.

3. **Fase 3: B2B, ESG & Systemadministration (Juli 2026)**
   Udvidet producentansvar (EPR) og EU-regulativer (PPWR/CSRD) blev indarbejdet som kernekomponenter. `SystemsTab.tsx` (en massiv administrations- og B2B-portal med simuleret IoT-overvågning og pointsystem-tilpasning) samt en strategisk AI B2B Advisor (`/api/b2b-advisor`) blev tilføjet for at imødekomme kommuner og emballageproducenter.

4. **Fase 4: CO2-beregner og Milepæle (Seneste tilføjelse, 10. juli 2026)**
   Det seneste modul, `/src/components/CO2Calculator.tsx`, blev installeret direkte i `ScanTab.tsx` for at give borgerne en interaktiv adfærds-beregner. Modulet fejrer brugerens fremskridt med haptisk feedback, festsound (Web Audio API) og kaskader af confetti ved opnåelse af grønne milepæle.

---

## 📂 3. Repo-oversigt og Git-status
- **Lokal Git-status**: Der er **ikke** initialiseret et lokalt Git-repositorium i `/app/applet` eller dets overliggende kataloger. Kommandoen `git status` returnerer `fatal: not a git repository`.
- **VS Code-specifikke konfigurationer**: Ingen `.vscode/settings.json`, `.vscode/launch.json` eller `.code-workspace` filer er til stede i projektroden. Projektet afvikles i et rent, standardiseret container-miljø.

---

## 🛠️ 4. Eksterne afhængigheder (Package.json)

De eksterne biblioteker i `/package.json` fordeler sig således på funktionelle områder:

- **AI/ML**: `@google/genai` (^1.29.0) — API-opslag til Gemini 3.5.
- **Database**: `@supabase/supabase-js` (^2.108.1), `firebase` (^12.12.0) — Data-synkronisering.
- **Grafik & UI-diagrammer**: `recharts` (^3.8.1) — Interaktive ESG- og adfærdsgrafer.
- **Styling & Animationer**: `tailwindcss` (^4.1.14), `motion` (^12.23.24) — Flydende overgange.
- **Utility & Interaktivitet**: `canvas-confetti` (^1.9.4), `jsqr` (^1.4.0) — QR-afkodning og fejring.
- **Server**: `express` (^4.21.2), `dotenv` (^17.2.3), `tsx` (^4.21.0), `esbuild` (^0.28.0).

*Bemærk: Alle integrationskald mod Supabase og Firebase er kildekodemæssigt beskyttet med dual-mode logik, således at de automatisk og fejlfrit skifter til en simuleret lokal emulator, hvis de påkrævede miljøvariabler ikke er defineret i miljøet.*

---

## ⚠️ 5. Teknisk skyld, huller og TODOs

En scanning af kildekoden viser følgende primære områder med uafsluttet kode, placeholders eller TODOs:

1. **Plads til integrationer (TODOs/Mocks)**:
   - I `/src/lib/firebase.ts` og `/src/lib/supabase.ts` anvendes simulerede klienter/brugerprofiler i stor stil som faldgrube. For at køre i produktion kræves der oprettelse og tilslutning af de faktiske cloud-instanser (særligt Supabase til det kryptografiske ledger).
   - `/server.ts` bruger mock-svar, hvis `GEMINI_API_KEY` mangler.
2. **Case Management**:
   - Ingen kildekode er dedikeret til manuel review af tvister eller sagsbehandling (Case Management). Dette er i øjeblikket et 100% ubebygget domæne.
3. **Mangel på testdækning**:
   - Der er absolut ingen testfiler eller testværktøjer installeret.

---

## 🚀 6. De 5 mest oplagte næste skridt

For at modne Cirkel-systemet fra en højt poleret full-stack prototype til en produktionsklar løsning, anbefales følgende fem næste skridt:

1. **Opsætning af ægte Firebase Auth og Firestore**:
   Etablere en live cloud-forbindelse ved at konfigurere `firebase-applet-config.json` med gyldige projektparametre, for at flytte brugerne væk fra simulerede profiler i `localStorage`.
2. **Aktivering af det kryptografiske Ledger på Supabase**:
   Køre SQL-migrationen fra `/supabase_schema.sql` på en live Supabase-instans, så det append-only transaktionsregister (med automatisk SHA-256 hashkæde) kører ægte i skyen i stedet for blot at være et simuleret array i frontenden.
3. **Etablering af en Case Management administrationsskærm**:
   Bygge et administrativt panel til kommunale sagsbehandlere, hvor mistænkelige scanninger (markeret af svindel-detektoren under lav tillid) kan tages til manuel vurdering.
4. **Implementering af testsuite (Vitest)**:
   Installere `vitest` som devDependency og skrive enhedstests til kritiske funktioner – særligt den kryptografiske hash-beregner, Haversine afstandsformlen og pointberegneren.
5. **CI/CD pipeline og containerisering**:
   Oprette en `Dockerfile` i projektroden samt en GitHub Actions-workflow, der automatisk linter, tester og bygger appen til Cloud Run ved hvert push.
