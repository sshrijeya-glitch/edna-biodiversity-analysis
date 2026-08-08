# SIH25042: Identifying Taxonomy and Assessing Biodiversity from eDNA Datasets

[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![Framework](https://img.shields.io/badge/framework-FastAPI-green.svg)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.io/badge/database-SQLite%20%7C%20SQLAlchemy-orange.svg)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)

A beginner-friendly, modular FastAPI backend built for **Smart India Hackathon (SIH25042)** to process Environmental DNA (eDNA) datasets (FASTA and FASTQ format), perform sequence quality control and length filtering, align reads against a local reference barcode database, group unclassified sequences into novel unknown clusters, compute ecological diversity indices (Species Richness, Shannon Index, Simpson Index), and generate automated downloadable PDF and CSV reports.

---

## Key Features

1. **Sample Management**: Create and track eDNA samples with collection date, location coordinates, sample matrix type (Water, Soil, Sediment), and environmental parameters (temperature, pH, depth, salinity).
2. **File Upload & Validation**: Upload FASTA (`.fasta`, `.fa`) and FASTQ (`.fastq`, `.fq`) files with format validation and sample association.
3. **Biopython Preprocessing**: Parse sequences, validate nucleotide composition (A, C, G, T, N), filter by configurable sequence length and Phred quality score (Q >= 20), and compute GC content percentage.
4. **Local Taxonomic Identification**: Perform pairwise alignment against a local reference barcode database (COI / 16S / 18S genes). Assigns reads to known taxa above identity cutoff or flags as `UNKNOWN`.
5. **Unknown Sequence Clustering**: Group unclassified reads into clusters (`UNKNOWN_CLUSTER_001`, `UNKNOWN_CLUSTER_002`) using 4-mer frequency vectorization and scikit-learn clustering.
   > **Note**: Unclassified clusters are explicitly labeled as *"Potential unknown taxa / unclassified sequence cluster"* to prevent false biological claims.
6. **Ecological Biodiversity Analysis**: Compute key ecological metrics:
   - **Species Richness ($S$)**: Count of distinct identified species + unknown clusters.
   - **Shannon Diversity Index ($H'$)**: $H' = -\sum_{i=1}^S p_i \ln(p_i)$
   - **Simpson Diversity Index ($D$)**: Gini-Simpson Index $D = 1 - \sum_{i=1}^S p_i^2$
   - **Relative Abundance ($p_i$)**: Proportion of reads per taxon/cluster.
7. **Automated Reporting**: Export detailed JSON results, CSV files, and styled ReportLab PDF reports.
8. **100% Offline Demo Ready**: Pre-loaded with demo reference database and demo FASTA/FASTQ datasets.

---

## Project Folder Structure

```text
SIH25042-eDNA/
├── app/
│   ├── main.py                  # FastAPI application entrypoint & OpenAPI setup
│   ├── config.py                # File paths & environment settings
│   ├── database.py              # SQLAlchemy engine & SQLite session setup
│   ├── models/                  # Database tables (SQLAlchemy)
│   │   ├── __init__.py
│   │   └── models.py            # Sample, SequenceFile, Sequence, TaxonomyAssignment, UnknownCluster, BiodiversityResult
│   ├── schemas/                 # Pydantic schemas for request/response validation
│   │   ├── __init__.py
│   │   └── schemas.py
│   ├── routers/                 # API route handlers
│   │   ├── __init__.py
│   │   ├── samples.py           # Sample management & file upload
│   │   ├── analysis.py          # Preprocessing, Taxonomy, Unknown clustering, Biodiversity
│   │   ├── reports.py           # JSON, CSV, PDF report endpoints
│   │   └── health.py            # Health check endpoint
│   ├── services/                # Biological processing engines
│   │   ├── __init__.py
│   │   ├── preprocessor.py      # Biopython parser & validator
│   │   ├── taxonomy_matcher.py  # Pairwise alignment & reference DB matcher
│   │   ├── unknown_clusterer.py # k-mer & scikit-learn clustering
│   │   ├── biodiversity.py      # Shannon, Simpson, and Species Richness metrics
│   │   ├── report_generator.py  # ReportLab PDF & CSV generator
│   │   ├── sample_service.py    # CRUD operations
│   │   └── seed_service.py      # Local reference DB & demo data seeder
│   └── storage/                 # Storage for uploads and generated reports
│       ├── uploads/
│       └── reports/
├── demo_data/                   # Demo reference sequences and sample files
│   ├── sample_demo.fasta
│   └── sample_demo.fastq
├── tests/                       # Automated Pytest suite
│   ├── test_api.py              # End-to-end integration test
│   ├── test_biodiversity.py     # Diversity index math verification
│   ├── test_clustering.py       # k-mer clustering tests
│   ├── test_parsing.py          # Biopython sequence parsing tests
│   └── test_taxonomy.py         # Alignment similarity tests
├── requirements.txt             # Dependencies
├── README.md                    # Project documentation
└── run.py                       # Helper script to launch local server
```

---

## Installation & Setup

### 1. Prerequisites
- Python 3.10+ installed on your system.

### 2. Install Dependencies
In your terminal, navigate to the project directory and install the required Python packages:

```bash
pip install -r requirements.txt
```

---

## How to Run the Backend

Launch the Uvicorn server using the included helper script:

```bash
python run.py
```

The server will start at:
- **Server Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## Step-by-Step Demo Workflow (Using Swagger UI)

Open `http://127.0.0.1:8000/docs` in your browser to execute the complete eDNA analysis pipeline interactively:

### Step 1: Health Check
- Execute `GET /api/v1/health` to confirm server status and SQLite database connection (`status: OK`).

### Step 2: Create a Sample
- Execute `POST /api/v1/samples`:
```json
{
  "name": "Ganges River eDNA Sample 01",
  "location": "Varanasi, Uttar Pradesh, India (25.3176° N, 82.9739° E)",
  "collection_date": "2026-08-01",
  "sample_type": "Water",
  "environmental_metadata": {
    "temperature_c": 27.5,
    "ph": 7.6,
    "depth_m": 2.0,
    "salinity_ppt": 0.1,
    "dissolved_oxygen_mg_l": 6.8
  }
}
```
- Copy the generated `id` (e.g., `3fa85f64-5717-4562-b3fc-2c963f66afa6`).

### Step 3: Upload a Sequence File
- Execute `POST /api/v1/upload`:
  - Form field `sample_id`: paste your sample ID.
  - Form field `file`: upload `demo_data/sample_demo.fasta` or `demo_data/sample_demo.fastq`.

### Step 4: Run Sequence Preprocessing
- Execute `POST /api/v1/analysis/{sample_id}/preprocess` with body:
```json
{
  "min_length": 50,
  "max_length": 5000,
  "min_quality": 20.0
}
```
- This parses reads with Biopython, filters invalid bases, and calculates average sequence length and GC content.

### Step 5: Run Taxonomic Identification
- Execute `POST /api/v1/analysis/{sample_id}/taxonomy` with body:
```json
{
  "similarity_threshold": 85.0
}
```
- Compares preprocessed reads against the local reference database and classifies sequences as known species or `UNKNOWN`.

### Step 6: Cluster Unknown Sequences
- Execute `POST /api/v1/analysis/{sample_id}/unknown-clusters` with body:
```json
{
  "min_cluster_size": 1
}
```
- Vectorizes unclassified sequences using 4-mers and groups them into `UNKNOWN_CLUSTER_001`, `UNKNOWN_CLUSTER_002`, etc.

### Step 7: Calculate Biodiversity Indices
- Execute `POST /api/v1/analysis/{sample_id}/biodiversity`.
- Calculates Species Richness ($S$), Shannon Index ($H'$), Simpson Index ($D$), and Relative Abundance ($p_i$).

### Step 8: View Combined Analysis Results
- Execute `GET /api/v1/analysis/{sample_id}/results` for full JSON summary.
- Execute `GET /api/v1/analysis/{sample_id}/species` for identified species list.
- Execute `GET /api/v1/analysis/{sample_id}/unknown` for unknown clusters.

### Step 9: Download PDF & CSV Reports
- Execute `POST /api/v1/reports/{sample_id}/pdf` to download the styled ReportLab PDF report.
- Execute `GET /api/v1/reports/{sample_id}/csv` to download the CSV data export.

---

## Summary of API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | System health check and database connection status |
| `POST` | `/api/v1/samples` | Create a new sample record with location & metadata |
| `GET` | `/api/v1/samples` | List all eDNA samples |
| `GET` | `/api/v1/samples/{sample_id}` | Retrieve details for a specific sample |
| `POST` | `/api/v1/upload` | Upload a FASTA/FASTQ sequence file for a sample |
| `POST` | `/api/v1/analysis/{sample_id}/preprocess` | Parse, validate, and filter sequences |
| `POST` | `/api/v1/analysis/{sample_id}/taxonomy` | Perform reference database alignment matching |
| `POST` | `/api/v1/analysis/{sample_id}/unknown-clusters` | Cluster unclassified reads using k-mers & scikit-learn |
| `POST` | `/api/v1/analysis/{sample_id}/biodiversity` | Calculate Shannon, Simpson, & Richness metrics |
| `GET` | `/api/v1/analysis/{sample_id}/results` | Fetch complete JSON analysis summary |
| `GET` | `/api/v1/analysis/{sample_id}/species` | List identified known taxa |
| `GET` | `/api/v1/analysis/{sample_id}/unknown` | List unclassified sequences and clusters |
| `POST` | `/api/v1/reports/{sample_id}/pdf` | Generate and download ReportLab PDF report |
| `GET` | `/api/v1/reports/{sample_id}/csv` | Download CSV export of taxonomy & cluster results |

---

## Running Automated Tests

Run the full pytest suite to verify all modules (sequence parsing, quality filtering, taxonomy alignment, unknown clustering, biodiversity metrics calculation, report generation, and API endpoints):

```bash
python -m pytest
```

---

## How Taxonomy Matching Works

1. **Pairwise Sequence Alignment**: The preprocessed DNA sequence is aligned against each entry in the local `ReferenceSequence` SQLite table using Biopython `Bio.Align.PairwiseAligner`.
2. **Identity Percentage Calculation**: The alignment score is normalized against the maximum achievable score to obtain an identity percentage ($0\% - 100\%$).
3. **Cutoff Evaluation**:
   - If `identity_percentage` $\ge$ `similarity_threshold` (default 85.0%): Classify sequence with reference metadata (`species`, `genus`, `family`, `order`, `class`, `phylum`).
   - If `identity_percentage` $<$ `similarity_threshold`: Classify sequence as `UNKNOWN`.

---

## System Limitations

1. **Demo Reference Database Size**: The local database contains ~5 demo barcode reference sequences for offline hackathon demonstration. It is not an exhaustive reference library.
2. **Single-Node Execution**: Sequence alignment runs sequentially in SQLite/Python; large-scale Next-Generation Sequencing (NGS) files (>1 million reads) require distributed workers (e.g. Celery / Ray) or C-accelerated tools (e.g. BLAST+ CLI).
3. **Single Barcode Region**: Current similarity matching assumes standard marker genes (e.g., COI or 16S rRNA).

---

## Integrating Real Biological Databases (NCBI / BLAST / BOLD)

For future production scale, this backend can be expanded with real global reference databases:

1. **Local BLAST+ Integration**:
   - Download pre-formatted NCBI NT/NR or SILVA/UNITE databases locally using `makeblastdb`.
   - Call local `blastn` via Python `subprocess` or Biopython `Bio.Blast.NCBIWWW` to align against millions of species in milliseconds.
2. **BOLD System (Barcode of Life Data System) API**:
   - Integrate BOLD REST API (`http://www.boldsystems.org/index.php/API_Public/specimen`) for species identification of COI animal sequences.
3. **QIIME2 / DADA2 Pipeline Integration**:
   - Wrap QIIME2 command-line interfaces to perform exact sequence variant (ASV) inference, chimera removal, and Naive Bayes taxonomic classification.
