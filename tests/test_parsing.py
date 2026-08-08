import pytest
from app.services.preprocessor import validate_dna_sequence, calculate_gc_content


def test_dna_validation_valid():
    assert validate_dna_sequence("ATCGNATCGN") is True
    assert validate_dna_sequence("atcgn") is True


def test_dna_validation_invalid():
    assert validate_dna_sequence("ATCGXYZ") is False
    assert validate_dna_sequence("") is False


def test_gc_content_calculation():
    assert calculate_gc_content("GCGC") == 100.0
    assert calculate_gc_content("ATAT") == 0.0
    assert calculate_gc_content("ATGC") == 50.0
    assert calculate_gc_content("") == 0.0
