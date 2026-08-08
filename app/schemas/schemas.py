from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# --- Sample Schemas ---
class SampleCreate(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Ganges eDNA Water Sample 01"})
    location: str = Field(..., json_schema_extra={"example": "Varanasi, India (25.3176° N, 82.9739° E)"})
    collection_date: str = Field(..., json_schema_extra={"example": "2026-08-01"})
    sample_type: str = Field(..., json_schema_extra={"example": "Water"})
    environmental_metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        json_schema_extra={"example": {"temperature_c": 26.5, "ph": 7.8, "depth_m": 1.5, "salinity_ppt": 0.2}}
    )


class SampleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    location: str
    collection_date: str
    sample_type: str
    environmental_metadata: Dict[str, Any]
    created_at: datetime


# --- File Schemas ---
class SequenceFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sample_id: str
    filename: str
    file_type: str
    file_path: str
    upload_date: datetime
    status: str


# --- Analysis Schemas ---
class PreprocessRequest(BaseModel):
    min_length: int = Field(default=50, ge=10, description="Minimum sequence length filter in bp")
    max_length: int = Field(default=5000, le=50000, description="Maximum sequence length filter in bp")
    min_quality: float = Field(default=20.0, ge=0.0, le=40.0, description="Minimum Phred quality score for FASTQ")


class PreprocessResponse(BaseModel):
    sample_id: str
    total_parsed: int
    total_valid: int
    total_passed: int
    total_rejected: int
    rejection_breakdown: Dict[str, int]
    avg_length: float
    avg_gc_content: float


class TaxonomyRequest(BaseModel):
    similarity_threshold: float = Field(
        default=85.0, ge=50.0, le=100.0, description="Percentage sequence identity cutoff for matching against local DB"
    )


class TaxonMatchDetail(BaseModel):
    sequence_id: str
    header: str
    is_known: bool
    species: str
    genus: str
    family: str
    order: str
    class_name: str
    phylum: str
    identity_percentage: float


class TaxonomyResponse(BaseModel):
    sample_id: str
    total_analyzed: int
    known_taxa_count: int
    unknown_count: int
    similarity_threshold_used: float
    identified_taxa_summary: Dict[str, int]


class UnknownClusterItem(BaseModel):
    cluster_tag: str
    cluster_size: int
    representative_sequence: str
    label: str = "Potential unknown taxa / unclassified sequence cluster"


class UnknownClusteringRequest(BaseModel):
    min_cluster_size: int = Field(default=1, ge=1)


class UnknownClusteringResponse(BaseModel):
    sample_id: str
    total_unknown_sequences: int
    total_clusters: int
    clusters: List[UnknownClusterItem]


class BiodiversityResponse(BaseModel):
    sample_id: str
    total_sequences: int
    species_richness: int
    shannon_index: float
    simpson_index: float
    identified_taxa_count: int
    unknown_cluster_count: int
    taxa_abundance: Dict[str, Dict[str, float]]  # {taxon_name: {"count": X, "relative_abundance": Y}}


class FullAnalysisResultResponse(BaseModel):
    sample: SampleResponse
    preprocessing_summary: Dict[str, Any]
    taxonomy_summary: Dict[str, Any]
    unknown_clusters: List[UnknownClusterItem]
    biodiversity_metrics: Dict[str, Any]


class HealthResponse(BaseModel):
    status: str
    database_connected: bool
    timestamp: datetime
