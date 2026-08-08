import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OK"
    assert data["database_connected"] is True


def test_full_analysis_workflow_api():
    # 1. Create Sample
    sample_payload = {
        "name": "Pytest Test eDNA Sample",
        "location": "Yamuna River, Delhi (28.6139° N, 77.2090° E)",
        "collection_date": "2026-08-05",
        "sample_type": "Water",
        "environmental_metadata": {"temperature_c": 28.0, "ph": 7.5},
    }
    create_res = client.post("/api/v1/samples", json=sample_payload)
    assert create_res.status_code == 201
    sample_data = create_res.json()
    sample_id = sample_data["id"]
    assert sample_data["name"] == "Pytest Test eDNA Sample"

    # 2. List Samples
    list_res = client.get("/api/v1/samples")
    assert list_res.status_code == 200
    assert any(s["id"] == sample_id for s in list_res.json())

    # 3. Get Sample by ID
    get_res = client.get(f"/api/v1/samples/{sample_id}")
    assert get_res.status_code == 200

    # 4. Upload Sequence FASTA File
    fasta_content = b""">seq1_Salmo_salar_match
ATGCTAGCTAGCTAGCTAGCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATC
>seq2_Unknown_Cluster_Read
AAAAAAAAAAAAAAAAAAAAAAAAATTTTTTTTTTTTTTTTTTTTTTTTTGGGGGGGGGGGGGGGGGGGGGGGGCCCCCC
"""
    upload_res = client.post(
        "/api/v1/upload",
        data={"sample_id": sample_id},
        files={"file": ("test_seqs.fasta", io.BytesIO(fasta_content), "application/octet-stream")},
    )
    assert upload_res.status_code == 201
    file_data = upload_res.json()
    assert file_data["filename"] == "test_seqs.fasta"

    # 5. Preprocess Sequences
    prep_res = client.post(
        f"/api/v1/analysis/{sample_id}/preprocess",
        json={"min_length": 30, "max_length": 1000, "min_quality": 20.0},
    )
    assert prep_res.status_code == 200
    prep_data = prep_res.json()
    assert prep_data["total_passed"] == 2

    # 6. Taxonomic Identification
    tax_res = client.post(
        f"/api/v1/analysis/{sample_id}/taxonomy",
        json={"similarity_threshold": 80.0},
    )
    assert tax_res.status_code == 200
    tax_data = tax_res.json()
    assert tax_data["total_analyzed"] == 2
    assert tax_data["known_taxa_count"] >= 1
    assert tax_data["unknown_count"] >= 1

    # 7. Unknown Sequence Clustering
    cluster_res = client.post(
        f"/api/v1/analysis/{sample_id}/unknown-clusters",
        json={"min_cluster_size": 1},
    )
    assert cluster_res.status_code == 200
    cluster_data = cluster_res.json()
    assert cluster_data["total_unknown_sequences"] >= 1
    assert len(cluster_data["clusters"]) >= 1
    assert "UNKNOWN_CLUSTER_" in cluster_data["clusters"][0]["cluster_tag"]

    # 8. Biodiversity Calculation
    bio_res = client.post(f"/api/v1/analysis/{sample_id}/biodiversity")
    assert bio_res.status_code == 200
    bio_data = bio_res.json()
    assert bio_data["species_richness"] >= 2
    assert bio_data["shannon_index"] > 0
    assert bio_data["simpson_index"] > 0

    # 9. Get Combined Results
    results_res = client.get(f"/api/v1/analysis/{sample_id}/results")
    assert results_res.status_code == 200

    # 10. Generate PDF Report
    pdf_res = client.post(f"/api/v1/reports/{sample_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"

    # 11. Download CSV Report
    csv_res = client.get(f"/api/v1/reports/{sample_id}/csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
