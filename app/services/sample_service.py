import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.models import Sample, SequenceFile
from app.schemas.schemas import SampleCreate
from app.config import UPLOAD_DIR


def create_sample(db: Session, sample_in: SampleCreate) -> Sample:
    """
    Creates a new eDNA sample in the database.
    """
    env_json = json.dumps(sample_in.environmental_metadata or {})
    db_sample = Sample(
        name=sample_in.name,
        location=sample_in.location,
        collection_date=sample_in.collection_date,
        sample_type=sample_in.sample_type,
        environmental_metadata=env_json,
    )
    db.add(db_sample)
    db.commit()
    db.refresh(db_sample)
    return db_sample


def get_sample_by_id(db: Session, sample_id: str) -> Optional[Sample]:
    """
    Retrieves a sample by ID.
    """
    return db.query(Sample).filter(Sample.id == sample_id).first()


def get_all_samples(db: Session) -> List[Sample]:
    """
    Retrieves all samples.
    """
    return db.query(Sample).order_by(Sample.created_at.desc()).all()


def store_uploaded_file(
    db: Session,
    sample_id: str,
    filename: str,
    file_bytes: bytes,
) -> SequenceFile:
    """
    Validates file extension (FASTA or FASTQ), saves file to storage/uploads/,
    and creates a SequenceFile record associated with sample_id.
    """
    sample = get_sample_by_id(db, sample_id)
    if not sample:
        raise ValueError(f"Sample with ID {sample_id} does not exist.")

    ext = Path(filename).suffix.lower()
    if ext in [".fasta", ".fa"]:
        file_type = "FASTA"
    elif ext in [".fastq", ".fq"]:
        file_type = "FASTQ"
    else:
        raise ValueError("Invalid file extension. Only .fasta, .fa, .fastq, and .fq files are allowed.")

    saved_filename = f"{sample_id[:8]}_{filename}"
    file_path = UPLOAD_DIR / saved_filename

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    seq_file = SequenceFile(
        sample_id=sample_id,
        filename=filename,
        file_type=file_type,
        file_path=str(file_path),
        status="UPLOADED",
    )
    db.add(seq_file)
    db.commit()
    db.refresh(seq_file)
    return seq_file
