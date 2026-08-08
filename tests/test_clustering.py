from app.services.unknown_clusterer import get_kmers


def test_get_kmers():
    seq = "ATGC"
    kmers = get_kmers(seq, k=3)
    assert kmers == "ATG TGC"
