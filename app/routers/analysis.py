import json
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.schemas import (
    PreprocessRequest,
    PreprocessResponse,
    TaxonomyRequest,
    TaxonomyResponse,
    UnknownClusteringRequest,
    UnknownClusteringResponse,
    UnknownClusterItem,
    BiodiversityResponse,
    SampleResponse,
    FullAnalysisResultResponse,
)
from app.models.models import Sample, SequenceFile, Sequence, TaxonomyAssignment, UnknownCluster, BiodiversityResult
from app.services import preprocessor, taxonomy_matcher, unknown_clusterer, biodiversity

router = APIRouter(prefix="/analysis", tags=["Sequence Analysis & Biodiversity"])


@router.post("/{sample_id}/preprocess", response_model=PreprocessResponse)
def preprocess_sequences(
    sample_id: str,
    req: PreprocessRequest = PreprocessRequest(),
    db: Session = Depends(get_db),
):
    """
    Parse FASTA/FASTQ sequence files using Biopython for a given sample.
    Validates nucleotide characters, filters by min/max length and FASTQ Phred quality score,
    and calculates GC content statistics.
    """
    files = db.query(SequenceFile).filter(SequenceFile.sample_id == sample_id).all()
    if not files:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No uploaded sequence files found for sample '{sample_id}'. Upload a FASTA/FASTQ file first.",
        )

    # Process all sequence files associated with this sample
    aggregated_parsed = 0
    aggregated_valid = 0
    aggregated_passed = 0
    rejection_breakdown = {
        "REJECTED_INVALID_CHAR": 0,
        "REJECTED_LENGTH": 0,
        "REJECTED_QUALITY": 0,
    }

    for f in files:
        res = preprocessor.process_sequence_file(
            db=db,
            sample_id=sample_id,
            file_record=f,
            min_length=req.min_length,
            max_length=req.max_length,
            min_quality=req.min_quality,
        )
        aggregated_parsed += res["total_parsed"]
        aggregated_valid += res["total_valid"]
        aggregated_passed += res["total_passed"]
        for k, v in res["rejection_breakdown"].items():
            rejection_breakdown[k] += v

    # Calculate overall avg length & GC content for passed sequences
    passed_seqs = db.query(Sequence).filter(Sequence.sample_id == sample_id, Sequence.filter_status == "PASSED").all()
    avg_len = float(sum(s.length for s in passed_seqs) / len(passed_seqs)) if passed_seqs else 0.0
    avg_gc = float(sum(s.gc_content for s in passed_seqs) / len(passed_seqs)) if passed_seqs else 0.0

    return PreprocessResponse(
        sample_id=sample_id,
        total_parsed=aggregated_parsed,
        total_valid=aggregated_valid,
        total_passed=aggregated_passed,
        total_rejected=aggregated_parsed - aggregated_passed,
        rejection_breakdown=rejection_breakdown,
        avg_length=round(avg_len, 2),
        avg_gc_content=round(avg_gc, 2),
    )


@router.post("/{sample_id}/taxonomy", response_model=TaxonomyResponse)
def identify_taxonomy(
    sample_id: str,
    req: TaxonomyRequest = TaxonomyRequest(),
    db: Session = Depends(get_db),
):
    """
    Compare preprocessed sequences against the local reference barcode database.
    Classifies reads as KNOWN taxon if identity >= similarity_threshold; otherwise marks as UNKNOWN.
    """
    try:
        res = taxonomy_matcher.run_taxonomy_identification(
            db=db,
            sample_id=sample_id,
            similarity_threshold=req.similarity_threshold,
        )
        return TaxonomyResponse(**res)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )


@router.post("/{sample_id}/unknown-clusters", response_model=UnknownClusteringResponse)
def cluster_unknown(
    sample_id: str,
    req: UnknownClusteringRequest = UnknownClusteringRequest(),
    db: Session = Depends(get_db),
):
    """
    Group unclassified (UNKNOWN) sequences into sequence clusters (e.g. UNKNOWN_CLUSTER_001).
    Uses 4-mer frequency vectorization and scikit-learn clustering.
    Labels clusters as 'Potential unknown taxa / unclassified sequence cluster'.
    """
    try:
        res = unknown_clusterer.cluster_unknown_sequences(
            db=db,
            sample_id=sample_id,
            min_cluster_size=req.min_cluster_size,
        )
        return UnknownClusteringResponse(**res)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )


@router.post("/{sample_id}/biodiversity", response_model=BiodiversityResponse)
def calculate_biodiversity(
    sample_id: str,
    db: Session = Depends(get_db),
):
    """
    Calculate ecological biodiversity metrics:
    Species Richness (S), Shannon Diversity Index (H'), Simpson Diversity Index (1-D), and Relative Abundances.
    """
    try:
        res = biodiversity.run_biodiversity_analysis(db=db, sample_id=sample_id)
        return BiodiversityResponse(**res)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )


@router.get("/{sample_id}/results", response_model=FullAnalysisResultResponse)
def get_full_analysis_results(sample_id: str, db: Session = Depends(get_db)):
    """
    Retrieve comprehensive combined analysis results (metadata, preprocessing, taxonomy, unknown clusters, biodiversity).
    """
    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise HTTPException(status_code=404, detail=f"Sample '{sample_id}' not found.")

    sample_resp = SampleResponse(
        id=sample.id,
        name=sample.name,
        location=sample.location,
        collection_date=sample.collection_date,
        sample_type=sample.sample_type,
        environmental_metadata=json.loads(sample.environmental_metadata or "{}"),
        created_at=sample.created_at,
    )

    passed_seqs = db.query(Sequence).filter(Sequence.sample_id == sample_id, Sequence.filter_status == "PASSED").all()
    preprocessing_summary = {
        "total_passed_sequences": len(passed_seqs),
        "avg_length": round(float(sum(s.length for s in passed_seqs) / len(passed_seqs)), 2) if passed_seqs else 0.0,
        "avg_gc_content": round(float(sum(s.gc_content for s in passed_seqs) / len(passed_seqs)), 2) if passed_seqs else 0.0,
    }

    assignments = db.query(TaxonomyAssignment).filter(TaxonomyAssignment.sample_id == sample_id).all()
    known_count = len([a for a in assignments if a.is_known])
    unknown_count = len([a for a in assignments if not a.is_known])

    species_summary: Dict[str, int] = {}
    for a in assignments:
        if a.is_known and a.species != "UNKNOWN":
            species_summary[a.species] = species_summary.get(a.species, 0) + 1

    taxonomy_summary = {
        "total_analyzed": len(assignments),
        "known_taxa_count": known_count,
        "unknown_count": unknown_count,
        "identified_species": species_summary,
    }

    cluster_objs = db.query(UnknownCluster).filter(UnknownCluster.sample_id == sample_id).all()
    unknown_clusters = [
        UnknownClusterItem(
            cluster_tag=c.cluster_tag,
            cluster_size=c.cluster_size,
            representative_sequence=c.representative_sequence,
            label="Potential unknown taxa / unclassified sequence cluster",
        )
        for c in cluster_objs
    ]

    bio_obj = db.query(BiodiversityResult).filter(BiodiversityResult.sample_id == sample_id).first()
    biodiversity_metrics = (
        {
            "species_richness": bio_obj.species_richness,
            "shannon_index": bio_obj.shannon_index,
            "simpson_index": bio_obj.simpson_index,
            "identified_taxa_count": bio_obj.identified_taxa_count,
            "unknown_cluster_count": bio_obj.unknown_cluster_count,
            "taxa_abundance": json.loads(bio_obj.taxa_abundance_json or "{}"),
        }
        if bio_obj
        else {}
    )

    return FullAnalysisResultResponse(
        sample=sample_resp,
        preprocessing_summary=preprocessing_summary,
        taxonomy_summary=taxonomy_summary,
        unknown_clusters=unknown_clusters,
        biodiversity_metrics=biodiversity_metrics,
    )


@router.get("/{sample_id}/species")
def get_identified_species(sample_id: str, db: Session = Depends(get_db)):
    """
    Retrieve list of identified known species and taxonomy details for a sample.
    """
    assignments = (
        db.query(TaxonomyAssignment)
        .filter(TaxonomyAssignment.sample_id == sample_id, TaxonomyAssignment.is_known == True)
        .all()
    )

    results = [
        {
            "sequence_id": a.sequence_id,
            "species": a.species,
            "genus": a.genus,
            "family": a.family,
            "order": a.order,
            "class_name": a.class_name,
            "phylum": a.phylum,
            "identity_percentage": a.identity_percentage,
        }
        for a in assignments
    ]

    return {
        "sample_id": sample_id,
        "total_identified_known_taxa": len(results),
        "identified_species": results,
    }


@router.get("/{sample_id}/unknown")
def get_unknown_sequences(sample_id: str, db: Session = Depends(get_db)):
    """
    Retrieve unclassified (UNKNOWN) sequence details and cluster assignments for a sample.
    """
    assignments = (
        db.query(TaxonomyAssignment)
        .filter(TaxonomyAssignment.sample_id == sample_id, TaxonomyAssignment.is_known == False)
        .all()
    )

    cluster_objs = db.query(UnknownCluster).filter(UnknownCluster.sample_id == sample_id).all()

    clusters_list = [
        {
            "cluster_tag": c.cluster_tag,
            "cluster_size": c.cluster_size,
            "representative_sequence": c.representative_sequence,
            "note": "Potential unknown taxa / unclassified sequence cluster",
        }
        for c in cluster_objs
    ]

    return {
        "sample_id": sample_id,
        "total_unknown_sequences": len(assignments),
        "total_unknown_clusters": len(clusters_list),
        "clusters": clusters_list,
        "unknown_sequence_ids": [a.sequence_id for a in assignments],
    }
