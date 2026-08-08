import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


def get_utc_now():
    return datetime.now(timezone.utc)


class Sample(Base):
    __tablename__ = "samples"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    collection_date = Column(String, nullable=False)
    sample_type = Column(String, nullable=False)  # e.g., Water, Soil, Sediment
    environmental_metadata = Column(Text, nullable=True)  # JSON string: temp, pH, depth, etc.
    created_at = Column(DateTime, default=get_utc_now)

    files = relationship("SequenceFile", back_populates="sample", cascade="all, delete-orphan")
    sequences = relationship("Sequence", back_populates="sample", cascade="all, delete-orphan")
    analysis_runs = relationship("AnalysisRun", back_populates="sample", cascade="all, delete-orphan")
    taxonomy_assignments = relationship("TaxonomyAssignment", back_populates="sample", cascade="all, delete-orphan")
    unknown_clusters = relationship("UnknownCluster", back_populates="sample", cascade="all, delete-orphan")
    biodiversity_results = relationship("BiodiversityResult", back_populates="sample", cascade="all, delete-orphan")


class SequenceFile(Base):
    __tablename__ = "sequence_files"

    id = Column(String, primary_key=True, default=generate_uuid)
    sample_id = Column(String, ForeignKey("samples.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # FASTA or FASTQ
    file_path = Column(String, nullable=False)
    upload_date = Column(DateTime, default=get_utc_now)
    status = Column(String, default="UPLOADED")  # UPLOADED, PREPROCESSED, ERROR

    sample = relationship("Sample", back_populates="files")
    sequences = relationship("Sequence", back_populates="file", cascade="all, delete-orphan")


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(String, primary_key=True, default=generate_uuid)
    sample_id = Column(String, ForeignKey("samples.id", ondelete="CASCADE"), nullable=False)
    run_date = Column(DateTime, default=get_utc_now)
    status = Column(String, default="PENDING")
    min_length = Column(Integer, default=50)
    max_length = Column(Integer, default=5000)
    min_quality = Column(Float, default=20.0)
    similarity_threshold = Column(Float, default=85.0)

    sample = relationship("Sample", back_populates="analysis_runs")


class Sequence(Base):
    __tablename__ = "sequences"

    id = Column(String, primary_key=True, default=generate_uuid)
    sample_id = Column(String, ForeignKey("samples.id", ondelete="CASCADE"), nullable=False)
    file_id = Column(String, ForeignKey("sequence_files.id", ondelete="CASCADE"), nullable=False)
    header = Column(String, nullable=False)
    sequence = Column(Text, nullable=False)
    quality_scores = Column(Text, nullable=True)  # JSON string of scores if FASTQ
    length = Column(Integer, nullable=False)
    gc_content = Column(Float, nullable=False)
    is_valid = Column(Boolean, default=True)
    filter_status = Column(String, default="PASSED")  # PASSED, REJECTED_LENGTH, REJECTED_QUALITY, REJECTED_INVALID_CHAR

    sample = relationship("Sample", back_populates="sequences")
    file = relationship("SequenceFile", back_populates="sequences")
    taxonomy_assignment = relationship("TaxonomyAssignment", back_populates="sequence", uselist=False, cascade="all, delete-orphan")


class ReferenceSequence(Base):
    __tablename__ = "reference_sequences"

    id = Column(String, primary_key=True, default=generate_uuid)
    header = Column(String, nullable=False)
    sequence = Column(Text, nullable=False)
    species = Column(String, nullable=False)
    genus = Column(String, nullable=False)
    family = Column(String, nullable=False)
    order = Column(String, nullable=False)
    class_name = Column(String, nullable=False)
    phylum = Column(String, nullable=False)
    is_demo = Column(Boolean, default=True)


class TaxonomyAssignment(Base):
    __tablename__ = "taxonomy_assignments"

    id = Column(String, primary_key=True, default=generate_uuid)
    sequence_id = Column(String, ForeignKey("sequences.id", ondelete="CASCADE"), nullable=False)
    sample_id = Column(String, ForeignKey("samples.id", ondelete="CASCADE"), nullable=False)
    is_known = Column(Boolean, nullable=False)
    species = Column(String, nullable=False, default="UNKNOWN")
    genus = Column(String, nullable=False, default="UNKNOWN")
    family = Column(String, nullable=False, default="UNKNOWN")
    order = Column(String, nullable=False, default="UNKNOWN")
    class_name = Column(String, nullable=False, default="UNKNOWN")
    phylum = Column(String, nullable=False, default="UNKNOWN")
    identity_percentage = Column(Float, nullable=False, default=0.0)
    reference_id = Column(String, ForeignKey("reference_sequences.id", ondelete="SET NULL"), nullable=True)

    sequence = relationship("Sequence", back_populates="taxonomy_assignment")
    sample = relationship("Sample", back_populates="taxonomy_assignments")
    reference = relationship("ReferenceSequence")


class UnknownCluster(Base):
    __tablename__ = "unknown_clusters"

    id = Column(String, primary_key=True, default=generate_uuid)
    sample_id = Column(String, ForeignKey("samples.id", ondelete="CASCADE"), nullable=False)
    cluster_tag = Column(String, nullable=False)  # e.g., UNKNOWN_CLUSTER_001
    cluster_size = Column(Integer, nullable=False)
    representative_sequence = Column(Text, nullable=False)
    avg_similarity = Column(Float, nullable=False, default=0.0)

    sample = relationship("Sample", back_populates="unknown_clusters")


class BiodiversityResult(Base):
    __tablename__ = "biodiversity_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    sample_id = Column(String, ForeignKey("samples.id", ondelete="CASCADE"), nullable=False)
    total_sequences = Column(Integer, nullable=False)
    species_richness = Column(Integer, nullable=False)
    shannon_index = Column(Float, nullable=False)
    simpson_index = Column(Float, nullable=False)
    identified_taxa_count = Column(Integer, nullable=False)
    unknown_cluster_count = Column(Integer, nullable=False)
    taxa_abundance_json = Column(Text, nullable=False)  # JSON dictionary of relative abundances

    sample = relationship("Sample", back_populates="biodiversity_results")
