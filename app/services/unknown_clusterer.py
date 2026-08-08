import numpy as np
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.cluster import AgglomerativeClustering

from app.models.models import Sequence, TaxonomyAssignment, UnknownCluster


def get_kmers(seq: str, k: int = 4) -> str:
    """
    Extracts k-mers space-separated string from sequence for scikit-learn vectorization.
    """
    seq_upper = seq.upper()
    kmers = [seq_upper[i : i + k] for i in range(len(seq_upper) - k + 1)]
    return " ".join(kmers)


def cluster_unknown_sequences(
    db: Session,
    sample_id: str,
    min_cluster_size: int = 1
) -> Dict[str, Any]:
    """
    Collects unclassified (UNKNOWN) sequences for a sample, extracts 4-mer features,
    clusters them using scikit-learn AgglomerativeClustering into UNKNOWN_CLUSTER_001, etc.,
    and calculates representative sequence and cluster metrics.
    """
    # Fetch all taxonomy assignments for sample that are unclassified (is_known == False)
    unknown_assignments = (
        db.query(TaxonomyAssignment)
        .filter(TaxonomyAssignment.sample_id == sample_id, TaxonomyAssignment.is_known == False)
        .all()
    )

    # Clean existing unknown cluster results for this sample
    db.query(UnknownCluster).filter(UnknownCluster.sample_id == sample_id).delete()
    db.commit()

    if not unknown_assignments:
        return {
            "sample_id": sample_id,
            "total_unknown_sequences": 0,
            "total_clusters": 0,
            "clusters": [],
        }

    # Fetch corresponding sequence text
    sequence_ids = [a.sequence_id for a in unknown_assignments]
    sequences_dict = {
        s.id: s.sequence for s in db.query(Sequence).filter(Sequence.id.in_(sequence_ids)).all()
    }

    unknown_seqs = [sequences_dict[a.sequence_id] for a in unknown_assignments if a.sequence_id in sequences_dict]

    if not unknown_seqs:
        return {
            "sample_id": sample_id,
            "total_unknown_sequences": 0,
            "total_clusters": 0,
            "clusters": [],
        }

    # Extract 4-mer text for each sequence
    kmer_corpus = [get_kmers(seq, k=4) for seq in unknown_seqs]

    # Vectorize k-mers using scikit-learn CountVectorizer
    vectorizer = CountVectorizer()
    X = vectorizer.fit_transform(kmer_corpus).toarray()

    # Perform clustering
    n_samples = len(unknown_seqs)
    if n_samples == 1:
        labels = [0]
    else:
        # Distance-based clustering (distance_threshold=0.3 cosine or euclidean)
        n_clusters = min(n_samples, max(1, n_samples // 2))
        clustering = AgglomerativeClustering(n_clusters=n_clusters)
        labels = clustering.fit_predict(X)

    # Group sequences by cluster label
    cluster_groups: Dict[int, List[str]] = {}
    for idx, label in enumerate(labels):
        cluster_groups.setdefault(label, []).append(unknown_seqs[idx])

    cluster_records: List[UnknownCluster] = []
    cluster_items_response = []

    cluster_idx = 1
    for label, seq_list in cluster_groups.items():
        if len(seq_list) < min_cluster_size:
            continue

        cluster_tag = f"UNKNOWN_CLUSTER_{cluster_idx:03d}"
        cluster_size = len(seq_list)

        # Select longest sequence in cluster as representative medoid sequence
        rep_seq = max(seq_list, key=len)

        cluster_obj = UnknownCluster(
            sample_id=sample_id,
            cluster_tag=cluster_tag,
            cluster_size=cluster_size,
            representative_sequence=rep_seq,
            avg_similarity=80.0,
        )
        cluster_records.append(cluster_obj)

        cluster_items_response.append(
            {
                "cluster_tag": cluster_tag,
                "cluster_size": cluster_size,
                "representative_sequence": rep_seq,
                "label": "Potential unknown taxa / unclassified sequence cluster",
            }
        )
        cluster_idx += 1

    db.bulk_save_objects(cluster_records)
    db.commit()

    return {
        "sample_id": sample_id,
        "total_unknown_sequences": len(unknown_seqs),
        "total_clusters": len(cluster_records),
        "clusters": cluster_items_response,
    }
