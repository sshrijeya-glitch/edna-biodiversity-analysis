import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.schemas import SampleCreate, SampleResponse, SequenceFileResponse
from app.services import sample_service
from app.models.models import Sample

router = APIRouter(tags=["Sample Management & File Upload"])


@router.post("/samples", response_model=SampleResponse, status_code=status.HTTP_201_CREATED)
def create_sample(sample_in: SampleCreate, db: Session = Depends(get_db)):
    """
    Create a new eDNA sample with location, collection date, sample type, and environmental metadata.
    """
    db_sample = sample_service.create_sample(db, sample_in)
    return SampleResponse(
        id=db_sample.id,
        name=db_sample.name,
        location=db_sample.location,
        collection_date=db_sample.collection_date,
        sample_type=db_sample.sample_type,
        environmental_metadata=json.loads(db_sample.environmental_metadata or "{}"),
        created_at=db_sample.created_at,
    )


@router.get("/samples", response_model=List[SampleResponse])
def list_samples(db: Session = Depends(get_db)):
    """
    List all created eDNA samples.
    """
    samples = sample_service.get_all_samples(db)
    return [
        SampleResponse(
            id=s.id,
            name=s.name,
            location=s.location,
            collection_date=s.collection_date,
            sample_type=s.sample_type,
            environmental_metadata=json.loads(s.environmental_metadata or "{}"),
            created_at=s.created_at,
        )
        for s in samples
    ]


@router.get("/samples/{sample_id}", response_model=SampleResponse)
def get_sample(sample_id: str, db: Session = Depends(get_db)):
    """
    Get detailed information for a specific sample by sample_id.
    """
    db_sample = sample_service.get_sample_by_id(db, sample_id)
    if not db_sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample with ID '{sample_id}' not found.",
        )
    return SampleResponse(
        id=db_sample.id,
        name=db_sample.name,
        location=db_sample.location,
        collection_date=db_sample.collection_date,
        sample_type=db_sample.sample_type,
        environmental_metadata=json.loads(db_sample.environmental_metadata or "{}"),
        created_at=db_sample.created_at,
    )


@router.post("/upload", response_model=SequenceFileResponse, status_code=status.HTTP_201_CREATED)
async def upload_sequence_file(
    sample_id: str = Form(..., description="ID of the sample to associate this file with"),
    file: UploadFile = File(..., description="FASTA (.fasta, .fa) or FASTQ (.fastq, .fq) sequence file"),
    db: Session = Depends(get_db),
):
    """
    Upload a FASTA or FASTQ eDNA sequence file and associate it with an existing sample.
    Validates file format and stores file locally.
    """
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    try:
        seq_file = sample_service.store_uploaded_file(
            db=db,
            sample_id=sample_id,
            filename=file.filename,
            file_bytes=file_bytes,
        )
        return seq_file
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )
