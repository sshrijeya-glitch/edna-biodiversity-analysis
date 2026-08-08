import numpy as np
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from Bio.Align import PairwiseAligner

from app.models.models import Sequence, ReferenceSequence, TaxonomyAssignment


def calculate_sequence_identity(seq1: str, seq2: str, aligner: PairwiseAligner) -> float:
    """
    Calculates pairwise alignment sequence identity percentage between two DNA sequences.
    """
    if not seq1 or not seq2:
        return 0.0

    seq1_upper = seq1.upper()
    seq2_upper = seq2.upper()

    # Exact match shortcut for fast performance
    if seq1_upper == seq2_upper:
        return 100.0

    if seq1_upper in seq2_upper or seq2_upper in seq1_upper:
        min_len = min(len(seq1_upper), len(seq2_upper))
        max_len = max(len(seq1_upper), len(seq2_upper))
        return round((min_len / max_len) * 100.0, 2)

    # Use Biopython PairwiseAligner for global alignment score
    try:
        score = aligner.score(seq1_upper, seq2_upper)
        max_possible_score = min(len(seq1_upper), len(seq2_upper))
        identity_pct = round((score / max_possible_score) * 100.0, 2)
        return min(max(identity_pct, 0.0), 100.0)
    except Exception:
        # Fallback simple k-mer similarity if alignment fails
        k = 4
        kmers1 = set(seq1_upper[i : i + k] for i in range(len(seq1_upper) - k + 1))
        kmers2 = set(seq2_upper[i : i + k] for i in range(len(seq2_upper) - k + 1))
        if not kmers1 or not kmers2:
            return 0.0
        jaccard = len(kmers1.intersection(kmers2)) / len(kmers1.union(kmers2))
        return round(jaccard * 100.0, 2)


def run_taxonomy_identification(
    db: Session,
    sample_id: str,
    similarity_threshold: float = 85.0
) -> Dict[str, Any]:
    """
    Compares preprocessed PASSED sequences for a sample against the local demo reference database.
    Assigns known taxonomy if match identity >= similarity_threshold; otherwise assigns UNKNOWN.
    """
    # Fetch all passed sequences for this sample
    passed_sequences = (
        db.query(Sequence)
        .filter(Sequence.sample_id == sample_id, Sequence.filter_status == "PASSED")
        .all()
    )

    if not passed_sequences:
        raise ValueError("No valid preprocessed sequences found for this sample. Run preprocessing first.")

    # Fetch reference database entries
    reference_db = db.query(ReferenceSequence).all()
    if not reference_db:
        raise ValueError("Local reference database is empty. Seed reference data first.")

    # Initialize Biopython Pairwise Aligner
    aligner = PairwiseAligner()
    aligner.mode = "global"
    aligner.match_score = 1.0
    aligner.mismatch_score = -0.5
    aligner.open_gap_score = -1.0
    aligner.extend_gap_score = -0.5

    # Remove previous taxonomy assignments for this sample
    db.query(TaxonomyAssignment).filter(TaxonomyAssignment.sample_id == sample_id).delete()
    db.commit()

    assignments: List[TaxonomyAssignment] = []
    known_count = 0
    unknown_count = 0
    species_summary: Dict[str, int] = {}

    for seq_obj in passed_sequences:
        best_match = None
        best_identity = 0.0

        for ref_obj in reference_db:
            identity = calculate_sequence_identity(seq_obj.sequence, ref_obj.sequence, aligner)
            if identity > best_identity:
                best_identity = identity
                best_match = ref_obj

        if best_match and best_identity >= similarity_threshold:
            is_known = True
            species = best_match.species
            genus = best_match.genus
            family = best_match.family
            order = best_match.order
            class_name = best_match.class_name
            phylum = best_match.phylum
            ref_id = best_match.id
            known_count += 1
            species_summary[species] = species_summary.get(species, 0) + 1
        else:
            is_known = False
            species = "UNKNOWN"
            genus = "UNKNOWN"
            family = "UNKNOWN"
            order = "UNKNOWN"
            class_name = "UNKNOWN"
            phylum = "UNKNOWN"
            ref_id = None
            unknown_count += 1

        assignment = TaxonomyAssignment(
            sequence_id=seq_obj.id,
            sample_id=sample_id,
            is_known=is_known,
            species=species,
            genus=genus,
            family=family,
            order=order,
            class_name=class_name,
            phylum=phylum,
            identity_percentage=best_identity,
            reference_id=ref_id,
        )
        assignments.append(assignment)

    db.bulk_save_objects(assignments)
    db.commit()

    return {
        "sample_id": sample_id,
        "total_analyzed": len(passed_sequences),
        "known_taxa_count": known_count,
        "unknown_count": unknown_count,
        "similarity_threshold_used": similarity_threshold,
        "identified_taxa_summary": species_summary,
    }
