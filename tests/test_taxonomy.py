from Bio.Align import PairwiseAligner
from app.services.taxonomy_matcher import calculate_sequence_identity


def test_calculate_sequence_identity_exact():
    aligner = PairwiseAligner()
    seq = "ATGCTAGCTAGCGATCGATCGATC"
    identity = calculate_sequence_identity(seq, seq, aligner)
    assert identity == 100.0


def test_calculate_sequence_identity_mismatch():
    aligner = PairwiseAligner()
    seq1 = "ATGCTAGCTAGCGATCGATCGATC"
    seq2 = "ATGCTAGCTAGCGATCGATCGATT"
    identity = calculate_sequence_identity(seq1, seq2, aligner)
    assert identity > 90.0
