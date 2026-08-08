import json
import math
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.models import Sequence, TaxonomyAssignment, UnknownCluster, BiodiversityResult


def calculate_shannon_index(proportions: List[float]) -> float:
    """
    Calculates Shannon Diversity Index (H'): H' = - sum(p_i * ln(p_i))
    """
    h_prime = 0.0
    for p in proportions:
        if p > 0.0:
            h_prime -= p * math.log(p)
    return round(h_prime, 4)


def calculate_simpson_index(proportions: List[float]) -> float:
    """
    Calculates Simpson Diversity Index (Gini-Simpson 1 - D): 1 - sum(p_i^2)
    Ranging from 0 (low diversity) to 1 (high diversity).
    """
    sum_p_sq = sum(p ** 2 for p in proportions)
    simpson = 1.0 - sum_p_sq
    return round(simpson, 4)


def run_biodiversity_analysis(db: Session, sample_id: str) -> Dict[str, Any]:
    """
    Computes Species Richness, Shannon Diversity Index, Simpson Diversity Index,
    and Relative Abundances combining identified taxa and unknown sequence clusters.
    """
    # Fetch passed preprocessed sequences count
    total_seq_count = (
        db.query(Sequence)
        .filter(Sequence.sample_id == sample_id, Sequence.filter_status == "PASSED")
        .count()
    )

    if total_seq_count == 0:
        raise ValueError("No passed preprocessed sequences found for sample. Process sequences first.")

    # Fetch taxonomy assignments
    assignments = (
        db.query(TaxonomyAssignment)
        .filter(TaxonomyAssignment.sample_id == sample_id)
        .all()
    )

    # Fetch unknown clusters
    unknown_clusters = (
        db.query(UnknownCluster)
        .filter(UnknownCluster.sample_id == sample_id)
        .all()
    )

    # Aggregate counts for each known species
    taxa_counts: Dict[str, int] = {}
    for a in assignments:
        if a.is_known and a.species != "UNKNOWN":
            taxa_counts[a.species] = taxa_counts.get(a.species, 0) + 1

    # Aggregate counts for each unknown cluster
    for cluster in unknown_clusters:
        taxa_counts[cluster.cluster_tag] = cluster.cluster_size

    # Handle unassigned sequences if any
    assigned_total = sum(taxa_counts.values())
    if assigned_total < total_seq_count:
        unassigned_count = total_seq_count - assigned_total
        taxa_counts["Unclassified_Other"] = unassigned_count

    # Calculate relative abundance p_i = n_i / N
    taxa_abundance: Dict[str, Dict[str, float]] = {}
    proportions: List[float] = []

    for name, count in taxa_counts.items():
        p_i = count / total_seq_count
        proportions.append(p_i)
        taxa_abundance[name] = {
            "count": count,
            "relative_abundance": round(p_i, 4),
            "percentage": round(p_i * 100.0, 2),
        }

    species_richness = len(taxa_counts)
    shannon_idx = calculate_shannon_index(proportions)
    simpson_idx = calculate_simpson_index(proportions)

    identified_taxa_count = len([name for name in taxa_counts if not name.startswith("UNKNOWN_CLUSTER_") and name != "Unclassified_Other"])
    unknown_cluster_count = len(unknown_clusters)

    # Save or update BiodiversityResult in DB
    db.query(BiodiversityResult).filter(BiodiversityResult.sample_id == sample_id).delete()
    db.commit()

    bio_result = BiodiversityResult(
        sample_id=sample_id,
        total_sequences=total_seq_count,
        species_richness=species_richness,
        shannon_index=shannon_idx,
        simpson_index=simpson_idx,
        identified_taxa_count=identified_taxa_count,
        unknown_cluster_count=unknown_cluster_count,
        taxa_abundance_json=json.dumps(taxa_abundance),
    )
    db.add(bio_result)
    db.commit()

    return {
        "sample_id": sample_id,
        "total_sequences": total_seq_count,
        "species_richness": species_richness,
        "shannon_index": shannon_idx,
        "simpson_index": simpson_idx,
        "identified_taxa_count": identified_taxa_count,
        "unknown_cluster_count": unknown_cluster_count,
        "taxa_abundance": taxa_abundance,
    }
