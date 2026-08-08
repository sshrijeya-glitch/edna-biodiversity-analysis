from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, SessionLocal
from app.routers import health, samples, analysis, reports
from app.services import seed_service

# Initialize database tables
Base.metadata.create_all(bind=engine)

def initialize_database():
    db = SessionLocal()
    try:
        seed_service.seed_demo_reference_db(db)
        seed_service.seed_demo_sample(db)
    finally:
        db.close()

initialize_database()

app = FastAPI(
    title="SIH25042: eDNA Taxonomy & Biodiversity Assessment API",
    description="""
## Smart India Hackathon Project SIH25042 Backend API

This backend application processes environmental DNA (eDNA) sequence datasets (FASTA and FASTQ files),
validates and filters sequences, identifies known taxa against a local reference database,
clusters unclassified sequences into potential unknown taxa, calculates ecological biodiversity indices
(Species Richness, Shannon Index, Simpson Index), and generates downloadable CSV and PDF reports.
""",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API router endpoints under /api/v1
app.include_router(health.router, prefix="/api/v1")
app.include_router(samples.router, prefix="/api/v1")
app.include_router(analysis.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")


@app.get("/", include_in_schema=False)
def root_redirect():
    return {
        "message": "Welcome to SIH25042 eDNA Backend API. Visit /docs for Swagger UI documentation.",
        "docs_url": "/docs",
    }
