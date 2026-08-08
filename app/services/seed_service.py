import json
from pathlib import Path
from sqlalchemy.orm import Session

from app.models.models import ReferenceSequence, Sample, SequenceFile
from app.config import DEMO_DIR, UPLOAD_DIR


# DEMO REFERENCE TAXONOMY BARCODES (Clearly labeled as DEMO DATA)
DEMO_REFERENCE_TAXA = [
    {
        "header": "DEMO_REF_001_Salmo_salar",
        "sequence": "ATGCTAGCTAGCTAGCTAGCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATC",
        "species": "Salmo salar",
        "genus": "Salmo",
        "family": "Salmonidae",
        "order": "Salmoniformes",
        "class_name": "Actinopterygii",
        "phylum": "Chordata",
    },
    {
        "header": "DEMO_REF_002_Daphnia_magna",
        "sequence": "GCTAGCTAGCTAGCTAGCGAATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG",
        "species": "Daphnia magna",
        "genus": "Daphnia",
        "family": "Daphniidae",
        "order": "Diplostraca",
        "class_name": "Branchiopoda",
        "phylum": "Arthropoda",
    },
    {
        "header": "DEMO_REF_003_Escherichia_coli",
        "sequence": "CGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGAT",
        "species": "Escherichia coli",
        "genus": "Escherichia",
        "family": "Enterobacteriaceae",
        "order": "Enterobacterales",
        "class_name": "Gammaproteobacteria",
        "phylum": "Proteobacteria",
    },
    {
        "header": "DEMO_REF_004_Panthera_tigris",
        "sequence": "TAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC",
        "species": "Panthera tigris",
        "genus": "Panthera",
        "family": "Felidae",
        "order": "Carnivora",
        "class_name": "Mammalia",
        "phylum": "Chordata",
    },
    {
        "header": "DEMO_REF_005_Gadus_morhua",
        "sequence": "ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG",
        "species": "Gadus morhua",
        "genus": "Gadus",
        "family": "Gadidae",
        "order": "Gadiformes",
        "class_name": "Actinopterygii",
        "phylum": "Chordata",
    },
]


def seed_demo_reference_db(db: Session):
    """
    Seeds the local reference database table with demo barcode sequences.
    """
    existing_count = db.query(ReferenceSequence).count()
    if existing_count == 0:
        ref_objects = [
            ReferenceSequence(
                header=item["header"],
                sequence=item["sequence"],
                species=item["species"],
                genus=item["genus"],
                family=item["family"],
                order=item["order"],
                class_name=item["class_name"],
                phylum=item["phylum"],
                is_demo=True,
            )
            for item in DEMO_REFERENCE_TAXA
        ]
        db.bulk_save_objects(ref_objects)
        db.commit()


def create_demo_files():
    """
    Generates demo FASTA and FASTQ dataset files in demo_data/ and app/storage/uploads/.
    Contains known matching sequences + novel unclassified sequences for testing unknown clustering.
    """
    fasta_path = DEMO_DIR / "sample_demo.fasta"
    fastq_path = DEMO_DIR / "sample_demo.fastq"

    # FASTA content
    fasta_content = """>DEMODATA_seq1_Salmo_salar_match
ATGCTAGCTAGCTAGCTAGCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATC
>DEMODATA_seq2_Daphnia_magna_match
GCTAGCTAGCTAGCTAGCGAATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG
>DEMODATA_seq3_Ecoli_match
CGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGAT
>DEMODATA_seq4_Unknown_Novel_A1
AAAAAAAAAAAAAAAAAAAAAAAAATTTTTTTTTTTTTTTTTTTTTTTTTGGGGGGGGGGGGGGGGGGGGGGGGCCCCCC
>DEMODATA_seq5_Unknown_Novel_A2
AAAAAAAAAAAAAAAAAAAAAAAAATTTTTTTTTTTTTTTTTTTTTTTTTGGGGGGGGGGGGGGGGGGGGGGGGCCCCCA
>DEMODATA_seq6_Unknown_Novel_B1
TTTTTTTTTTTTTTTTTTTTTTTTTGCCCCCCCCCCCCCCCCCCCCCCCGGGGGGGGGGGGGGGGGGGGGGGGAAAAAA
"""

    with open(fasta_path, "w", encoding="utf-8") as f:
        f.write(fasta_content)

    # FASTQ content (with quality scores: 'I' = Phred quality 40)
    fastq_content = """@DEMODATA_fastq_seq1_Salmo_salar_match
ATGCTAGCTAGCTAGCTAGCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATC
+
IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
@DEMODATA_fastq_seq2_Panthera_tigris_match
TAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC
+
IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
@DEMODATA_fastq_seq3_Unknown_Novel_C1
CCCCCCCCCCCCCCCCCCCCCCCCCGGGGGGGGGGGGGGGGGGGGGGGGTTTTTTTTTTTTTTTTTTTTTTTTAAAAAAA
+
IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
"""

    with open(fastq_path, "w", encoding="utf-8") as f:
        f.write(fastq_content)

    return str(fasta_path), str(fastq_path)


def seed_demo_sample(db: Session) -> Sample:
    """
    Creates a pre-populated demo sample with uploaded FASTA file for instant testing.
    """
    seed_demo_reference_db(db)
    fasta_path, fastq_path = create_demo_files()

    demo_sample = (
        db.query(Sample)
        .filter(Sample.name == "DEMO_eDNA_Ganges_Water_Sample_01")
        .first()
    )

    if not demo_sample:
        demo_sample = Sample(
            name="DEMO_eDNA_Ganges_Water_Sample_01",
            location="Ganges River, Varanasi, India (25.3176° N, 82.9739° E)",
            collection_date="2026-08-01",
            sample_type="Water",
            environmental_metadata=json.dumps({
                "temperature_c": 27.2,
                "ph": 7.6,
                "depth_m": 2.0,
                "salinity_ppt": 0.1,
                "dissolved_oxygen_mg_l": 6.8,
                "note": "DEMO DATA dataset for SIH25042 evaluation"
            }),
        )
        db.add(demo_sample)
        db.commit()
        db.refresh(demo_sample)

        # Attach FASTA file record
        dest_fasta = UPLOAD_DIR / f"demo_{demo_sample.id[:8]}.fasta"
        with open(fasta_path, "r") as src, open(dest_fasta, "w") as dst:
            dst.write(src.read())

        file_rec = SequenceFile(
            sample_id=demo_sample.id,
            filename="sample_demo.fasta",
            file_type="FASTA",
            file_path=str(dest_fasta),
            status="UPLOADED",
        )
        db.add(file_rec)
        db.commit()

    return demo_sample
