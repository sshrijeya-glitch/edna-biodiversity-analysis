import json
import numpy as np
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from Bio import SeqIO

from app.models.models import Sequence, SequenceFile, AnalysisRun


VALID_DNA_CHARACTERS = set("ACGTNacgtn")


def validate_dna_sequence(seq_str: str) -> bool:
    """
    Validates if sequence contains only standard nucleotide characters (A, C, G, T, N).
    """
    if not seq_str:
        return False
    return set(seq_str).issubset(VALID_DNA_CHARACTERS)


def calculate_gc_content(seq_str: str) -> float:
    """
    Calculates GC content percentage of a DNA sequence.
    """
    if not seq_str:
        return 0.0
    seq_upper = seq_str.upper()
    g_count = seq_upper.count("G")
    c_count = seq_upper.count("C")
    return round(((g_count + c_count) / len(seq_str)) * 100.0, 2)


def process_sequence_file(
    db: Session,
    sample_id: str,
    file_record: SequenceFile,
    min_length: int = 50,
    max_length: int = 5000,
    min_quality: float = 20.0,
) -> Dict[str, Any]:
    """
    Parses FASTA/FASTQ sequence file using Biopython, validates nucleotides,
    applies length and quality filters, calculates GC content, and saves to DB.
    """
    file_path = file_record.file_path
    file_format = file_record.file_type.lower()  # 'fasta' or 'fastq'

    total_parsed = 0
    total_valid = 0
    total_passed = 0

    rejection_breakdown = {
        "REJECTED_INVALID_CHAR": 0,
        "REJECTED_LENGTH": 0,
        "REJECTED_QUALITY": 0,
    }

    seq_objects: List[Sequence] = []
    lengths: List[int] = []
    gc_contents: List[float] = []

    # Clean existing sequences for this sample/file if re-running
    db.query(Sequence).filter(Sequence.file_id == file_record.id).delete()
    db.commit()

    try:
        records = list(SeqIO.parse(file_path, file_format))
    except Exception as e:
        file_record.status = "ERROR"
        db.commit()
        raise ValueError(f"Failed to parse {file_record.file_type} file: {str(e)}")

    for record in records:
        total_parsed += 1
        raw_seq = str(record.seq)
        seq_len = len(raw_seq)
        header = str(record.id) if record.id else f"seq_{total_parsed}"

        # 1. Nucleotide Validation
        is_dna_valid = validate_dna_sequence(raw_seq)
        if not is_dna_valid:
            rejection_breakdown["REJECTED_INVALID_CHAR"] += 1
            filter_status = "REJECTED_INVALID_CHAR"
        else:
            total_valid += 1
            filter_status = "PASSED"

        # 2. FASTQ Quality Check
        quality_scores_json = None
        if file_format == "fastq" and "phred_quality" in record.letter_annotations:
            qual_scores = record.letter_annotations["phred_quality"]
            quality_scores_json = json.dumps(qual_scores)
            avg_qual = float(np.mean(qual_scores)) if qual_scores else 0.0
            if filter_status == "PASSED" and avg_qual < min_quality:
                rejection_breakdown["REJECTED_QUALITY"] += 1
                filter_status = "REJECTED_QUALITY"

        # 3. Length Filtering
        if filter_status == "PASSED" and (seq_len < min_length or seq_len > max_length):
            rejection_breakdown["REJECTED_LENGTH"] += 1
            filter_status = "REJECTED_LENGTH"

        gc = calculate_gc_content(raw_seq)
        is_passed = filter_status == "PASSED"

        if is_passed:
            total_passed += 1
            lengths.append(seq_len)
            gc_contents.append(gc)

        seq_entry = Sequence(
            sample_id=sample_id,
            file_id=file_record.id,
            header=header,
            sequence=raw_seq,
            quality_scores=quality_scores_json,
            length=seq_len,
            gc_content=gc,
            is_valid=is_dna_valid,
            filter_status=filter_status,
        )
        seq_objects.append(seq_entry)

    # Bulk save to SQLite
    db.bulk_save_objects(seq_objects)
    file_record.status = "PREPROCESSED"
    db.commit()

    avg_length = round(float(np.mean(lengths)), 2) if lengths else 0.0
    avg_gc = round(float(np.mean(gc_contents)), 2) if gc_contents else 0.0

    return {
        "sample_id": sample_id,
        "total_parsed": total_parsed,
        "total_valid": total_valid,
        "total_passed": total_passed,
        "total_rejected": total_parsed - total_passed,
        "rejection_breakdown": rejection_breakdown,
        "avg_length": avg_length,
        "avg_gc_content": avg_gc,
    }
