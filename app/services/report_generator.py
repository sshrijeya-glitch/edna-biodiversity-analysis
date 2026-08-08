import csv
import json
import io
from pathlib import Path
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.models.models import (
    Sample,
    Sequence,
    TaxonomyAssignment,
    UnknownCluster,
    BiodiversityResult,
)
from app.config import REPORT_DIR


def generate_csv_report(db: Session, sample_id: str) -> str:
    """
    Generates a CSV report file containing all sequence records, taxonomy assignments,
    and unknown sequence clusters for a sample.
    """
    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise ValueError(f"Sample with ID {sample_id} not found.")

    assignments = (
        db.query(TaxonomyAssignment)
        .filter(TaxonomyAssignment.sample_id == sample_id)
        .all()
    )

    sequences = {
        s.id: s for s in db.query(Sequence).filter(Sequence.sample_id == sample_id).all()
    }

    # Map unknown sequence IDs to cluster tags
    clusters = (
        db.query(UnknownCluster).filter(UnknownCluster.sample_id == sample_id).all()
    )

    csv_filename = f"sample_{sample_id[:8]}_report.csv"
    file_path = REPORT_DIR / csv_filename

    with open(file_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        # Header
        writer.writerow([
            "Sample ID",
            "Sample Name",
            "Sequence Header",
            "Length (bp)",
            "GC Content (%)",
            "Is Known",
            "Species",
            "Genus",
            "Family",
            "Order",
            "Class",
            "Phylum",
            "Identity (%)",
        ])

        for assign in assignments:
            seq = sequences.get(assign.sequence_id)
            header = seq.header if seq else "N/A"
            length = seq.length if seq else 0
            gc = seq.gc_content if seq else 0.0

            writer.writerow([
                sample.id,
                sample.name,
                header,
                length,
                gc,
                assign.is_known,
                assign.species,
                assign.genus,
                assign.family,
                assign.order,
                assign.class_name,
                assign.phylum,
                assign.identity_percentage,
            ])

    return str(file_path)


def generate_pdf_report(db: Session, sample_id: str) -> str:
    """
    Generates a PDF analysis report for a sample using ReportLab.
    Includes sample metadata, sequence statistics, biodiversity metrics,
    and taxonomy summary.
    """
    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise ValueError(f"Sample with ID {sample_id} not found.")

    biodiversity = (
        db.query(BiodiversityResult)
        .filter(BiodiversityResult.sample_id == sample_id)
        .first()
    )

    assignments = (
        db.query(TaxonomyAssignment)
        .filter(TaxonomyAssignment.sample_id == sample_id)
        .all()
    )

    clusters = (
        db.query(UnknownCluster)
        .filter(UnknownCluster.sample_id == sample_id)
        .all()
    )

    pdf_filename = f"sample_{sample_id[:8]}_analysis_report.pdf"
    pdf_path = REPORT_DIR / pdf_filename

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=6,
    )

    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#475569"),
        spaceAfter=15,
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=12,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )

    story = []

    # Title & Header
    story.append(Paragraph("SIH25042 eDNA Biodiversity & Taxonomy Report", title_style))
    story.append(
        Paragraph(
            "Automated Environmental DNA Identification & Ecological Diversity Assessment",
            subtitle_style,
        )
    )
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563eb"), spaceAfter=15))

    # 1. Sample Metadata Table
    story.append(Paragraph("1. Sample Information", section_heading))
    
    meta_dict = json.loads(sample.environmental_metadata) if sample.environmental_metadata else {}
    env_str = ", ".join([f"{k}: {v}" for k, v in meta_dict.items()]) if meta_dict else "None"

    sample_table_data = [
        [Paragraph("<b>Sample Name:</b>", body_style), Paragraph(sample.name, body_style),
         Paragraph("<b>Sample ID:</b>", body_style), Paragraph(sample.id, body_style)],
        [Paragraph("<b>Location:</b>", body_style), Paragraph(sample.location, body_style),
         Paragraph("<b>Collection Date:</b>", body_style), Paragraph(sample.collection_date, body_style)],
        [Paragraph("<b>Sample Type:</b>", body_style), Paragraph(sample.sample_type, body_style),
         Paragraph("<b>Environmental Metadata:</b>", body_style), Paragraph(env_str, body_style)],
    ]

    sample_table = Table(sample_table_data, colWidths=[110, 160, 110, 160])
    sample_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("PADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(sample_table)
    story.append(Spacer(1, 15))

    # 2. Biodiversity Metrics Summary Cards
    story.append(Paragraph("2. Biodiversity Metrics Summary", section_heading))
    if biodiversity:
        shannon = biodiversity.shannon_index
        simpson = biodiversity.simpson_index
        richness = biodiversity.species_richness
        total_seqs = biodiversity.total_sequences
        known_taxa = biodiversity.identified_taxa_count
        unknown_clusters = biodiversity.unknown_cluster_count
    else:
        shannon = simpson = richness = total_seqs = known_taxa = unknown_clusters = 0

    bio_table_data = [
        [
            Paragraph("<b>Total Sequences Analyzed</b>", body_style),
            Paragraph("<b>Species Richness (S)</b>", body_style),
            Paragraph("<b>Shannon Index (H')</b>", body_style),
            Paragraph("<b>Simpson Index (1-D)</b>", body_style),
        ],
        [
            Paragraph(f"<font size=12><b>{total_seqs}</b></font>", body_style),
            Paragraph(f"<font size=12><b>{richness}</b></font>", body_style),
            Paragraph(f"<font size=12><b>{shannon}</b></font>", body_style),
            Paragraph(f"<font size=12><b>{simpson}</b></font>", body_style),
        ],
        [
            Paragraph(f"Identified Taxa: <b>{known_taxa}</b>", body_style),
            Paragraph(f"Unknown Clusters: <b>{unknown_clusters}</b>", body_style),
            Paragraph("Log-e base diversity", body_style),
            Paragraph("0 (low) to 1 (high)", body_style),
        ]
    ]

    bio_table = Table(bio_table_data, colWidths=[135, 135, 135, 135])
    bio_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eff6ff")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#bfdbfe")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dbeafe")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("PADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(bio_table)
    story.append(Spacer(1, 15))

    # 3. Identified Taxa Breakdown
    story.append(Paragraph("3. Identified Taxonomy Breakdown", section_heading))
    taxa_table_data = [
        [
            Paragraph("<b>Species</b>", body_style),
            Paragraph("<b>Genus</b>", body_style),
            Paragraph("<b>Family</b>", body_style),
            Paragraph("<b>Phylum</b>", body_style),
            Paragraph("<b>Match Identity</b>", body_style),
        ]
    ]

    known_assignments = [a for a in assignments if a.is_known][:15]  # top 15
    if known_assignments:
        for a in known_assignments:
            taxa_table_data.append([
                Paragraph(f"<i>{a.species}</i>", body_style),
                Paragraph(a.genus, body_style),
                Paragraph(a.family, body_style),
                Paragraph(a.phylum, body_style),
                Paragraph(f"{a.identity_percentage:.1f}%", body_style),
            ])
    else:
        taxa_table_data.append([
            Paragraph("<i>No confirmed taxa identified above threshold</i>", body_style),
            Paragraph("-", body_style), Paragraph("-", body_style), Paragraph("-", body_style), Paragraph("-", body_style)
        ])

    taxa_table = Table(taxa_table_data, colWidths=[130, 100, 110, 110, 90])
    taxa_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("PADDING", (0, 0), (-1, -1), 5),
        ])
    )
    story.append(taxa_table)
    story.append(Spacer(1, 15))

    # 4. Unknown Sequence Clusters
    story.append(Paragraph("4. Potential Unknown Taxa / Unclassified Clusters", section_heading))
    cluster_table_data = [
        [
            Paragraph("<b>Cluster Tag</b>", body_style),
            Paragraph("<b>Sequence Count</b>", body_style),
            Paragraph("<b>Representative Sequence (First 35bp)</b>", body_style),
            Paragraph("<b>Status Note</b>", body_style),
        ]
    ]

    if clusters:
        for cl in clusters:
            rep_snippet = cl.representative_sequence[:35] + "..." if len(cl.representative_sequence) > 35 else cl.representative_sequence
            cluster_table_data.append([
                Paragraph(f"<b>{cl.cluster_tag}</b>", body_style),
                Paragraph(str(cl.cluster_size), body_style),
                Paragraph(f"<code>{rep_snippet}</code>", body_style),
                Paragraph("<font color='#d97706'>Potential unknown taxon</font>", body_style),
            ])
    else:
        cluster_table_data.append([
            Paragraph("<i>No unclassified clusters detected</i>", body_style),
            Paragraph("-", body_style), Paragraph("-", body_style), Paragraph("-", body_style)
        ])

    cluster_table = Table(cluster_table_data, colWidths=[120, 90, 200, 130])
    cluster_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fef3c7")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#fde68a")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fef3c7")),
            ("PADDING", (0, 0), (-1, -1), 5),
        ])
    )
    story.append(cluster_table)

    # Build document
    doc.build(story)

    return str(pdf_path)
