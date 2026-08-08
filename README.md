# EcoGenome AI — Frontend

React + Vite frontend for SIH25042 (eDNA taxonomy & biodiversity). It talks to the
existing FastAPI backend and does not define any endpoints of its own.

## Run it

```bash
# 1. Backend, from the SIH25042-eDNA folder
python run.py            # serves http://127.0.0.1:8000

# 2. Frontend, from this folder
npm install
npm run dev              # serves http://localhost:5173
```

The API base URL lives in `.env`:

```
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

The backend already sets `allow_origins=["*"]`, so no proxy or CORS change is needed.

## What is built

| Route | Screen | Backend calls |
|---|---|---|
| `/` | Landing | `GET /health` |
| `/dashboard` | Sample overview | `GET /samples`, `GET /analysis/{id}/results` per card |
| `/samples` | Sample list, client-side search & filter | `GET /samples` |
| `/samples/new` | Register a sample | `POST /samples` |
| `/samples/:id` | Sample detail + file upload | `GET /samples/{id}`, `POST /upload` |
| `/analyze/:id` | Four-stage pipeline runner with live parameters | `POST .../preprocess`, `.../taxonomy`, `.../unknown-clusters`, `.../biodiversity` |
| `/results/:id` | Results dashboard | `GET /analysis/{id}/results` |
| `/species/:id` | Species table, grouped view, lineage tree, treemap | `GET /analysis/{id}/species` |
| `/biodiversity/:id` | Indices, evenness, abundance, rank-abundance | `GET /analysis/{id}/results` |
| `/unknown/:id` | Cluster cards + sequence viewer | `GET /analysis/{id}/unknown`, `GET /analysis/{id}/results` |
| `/reports` | PDF and CSV export | `POST /reports/{id}/pdf`, `GET /reports/{id}/csv` |

Verified end to end against a running backend: every response shape above was
checked with the seeded demo sample before the UI was wired to it.

## Demo data policy

No fabricated data is rendered anywhere. The only demo content in the app is the
sample the **backend itself** seeds at startup (`DEMO_eDNA_Ganges_Water_Sample_01`),
and the UI labels it "Seeded demo" wherever it appears.

## Folder map

```
src/
  api/         client.js (axios instance + error reader), endpoints.js (one fn per route)
  hooks/       useApi.js — the only data-fetching abstraction
  lib/         format.js — display helpers and stage derivation
               charts.js — shared Recharts palette and axis defaults
  components/
    brand/     Helix, Logo
    layout/    AppLayout, Sidebar, Header, BackendStatus
    ui/        Card, Button, Badge, StatTile, Field, PageHeader, States
    samples/   SampleCard
    upload/    FileDropzone
    analysis/  SampleSubNav, StageCard, ParamControl, SequenceViewer, CopyJson
  pages/       Landing, Dashboard, SampleList, CreateSample, SampleDetail,
               AnalysisRunner, Results, Species, Biodiversity, UnknownClusters,
               Reports, NotFound
```
