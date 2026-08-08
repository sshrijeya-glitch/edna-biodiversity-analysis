import math
import pytest
from app.services.biodiversity import calculate_shannon_index, calculate_simpson_index


def test_shannon_index():
    # Equal abundance of 4 species: p = [0.25, 0.25, 0.25, 0.25]
    # H' = - 4 * (0.25 * ln(0.25)) = ln(4) approx 1.3863
    props = [0.25, 0.25, 0.25, 0.25]
    h_prime = calculate_shannon_index(props)
    assert abs(h_prime - round(math.log(4), 4)) < 0.001


def test_shannon_index_single_species():
    # 100% single species: p = [1.0] -> H' = 0
    assert calculate_shannon_index([1.0]) == 0.0


def test_simpson_index():
    # Equal abundance of 4 species: p = [0.25, 0.25, 0.25, 0.25]
    # D = 1 - (4 * 0.0625) = 1 - 0.25 = 0.75
    props = [0.25, 0.25, 0.25, 0.25]
    d_simpson = calculate_simpson_index(props)
    assert d_simpson == 0.75


def test_simpson_index_single_species():
    # Single species -> D = 1 - 1 = 0
    assert calculate_simpson_index([1.0]) == 0.0
