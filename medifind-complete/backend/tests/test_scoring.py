import pytest
from app.services.scoring import (
    calculate_freshness,
    get_source_weight,
    calculate_confidence_score,
    get_confidence_label,
    score_and_label,
    CONFIRMED_RECENTLY_LABEL,
    LIKELY_AVAILABLE_LABEL,
    UNVERIFIED_LABEL,
)


def test_fresh_ping_high_confidence():
    """
    Fresh verification via live ping (5 mins ago), high accuracy chemist.
    Freshness: 1 - 5/240 = 0.979
    Source weight: 1.0
    Accuracy: 0.95, Response Rate: 0.92
    Expected: >= 75 ("Confirmed recently").
    """
    mins = 5.0
    source = "ping"
    accuracy = 0.95
    resp_rate = 0.92

    score = calculate_confidence_score(mins, source, accuracy, resp_rate)
    label = get_confidence_label(score)

    assert score >= 75.0
    assert score <= 100.0
    assert label == CONFIRMED_RECENTLY_LABEL


def test_stale_manual_update():
    """
    Manual chemist toggle older than 240 minutes (freshness decays to 0.0).
    Freshness: 0.0
    Source weight: 0.7
    Accuracy: 0.90, Response Rate: 0.85
    Score: 100 * (0.0 + 0.27 + 0.17) = 44.0
    Expected: 40 - 74 ("Likely available").
    """
    mins = 300.0
    source = "manual"
    accuracy = 0.90
    resp_rate = 0.85

    score = calculate_confidence_score(mins, source, accuracy, resp_rate)
    label = get_confidence_label(score)

    assert score == 44.0
    assert label == LIKELY_AVAILABLE_LABEL


def test_unverified_stale_low_confidence():
    """
    Unverified record with stale timestamp.
    Freshness: 0.0
    Source weight: 0.2
    Accuracy: 0.70, Response Rate: 0.65
    Score: 100 * (0.0 + 0.21 + 0.13) = 34.0
    Expected: < 40 ("Unverified").
    """
    mins = 2880.0
    source = "unverified"
    accuracy = 0.70
    resp_rate = 0.65

    score = calculate_confidence_score(mins, source, accuracy, resp_rate)
    label = get_confidence_label(score)

    assert score < 40.0
    assert label == UNVERIFIED_LABEL


def test_freshness_decay_boundaries():
    """Test boundary conditions for 240-minute freshness decay."""
    # Instant confirmation (0 minutes)
    assert calculate_freshness(0.0) == 1.0
    # Negative minutes clamps to 0
    assert calculate_freshness(-10.0) == 1.0
    # Halfway (120 minutes)
    assert calculate_freshness(120.0) == 0.5
    # Exact expiry (240 minutes)
    assert calculate_freshness(240.0) == 0.0
    # Past expiry (400 minutes)
    assert calculate_freshness(400.0) == 0.0


def test_source_weights():
    """Verifies all four weighted sources from spec."""
    assert get_source_weight("ping") == 1.0
    assert get_source_weight("manual") == 0.7
    assert get_source_weight("csv") == 0.5
    assert get_source_weight("unverified") == 0.2
    assert get_source_weight("unknown_junk") == 0.2


def test_score_and_label_helper():
    score, label = score_and_label(10, "ping", 0.98, 0.95)
    assert isinstance(score, float)
    assert label in (CONFIRMED_RECENTLY_LABEL, LIKELY_AVAILABLE_LABEL, UNVERIFIED_LABEL)
