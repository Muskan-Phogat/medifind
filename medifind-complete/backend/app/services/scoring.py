"""
Stock Confidence Score Calculation Module

Formula:
  freshness = max(0, 1 - minutes_since_confirmation / 240)
  source_weight = ping 1.0, manual 0.7, csv 0.5, unverified 0.2
  score = 100 * (0.5 * freshness * source_weight + 0.3 * pharmacy_accuracy + 0.2 * pharmacy_response_rate)

Labels:
  75 - 100 : "Confirmed recently"
  40 - 74  : "Likely available"
  < 40     : "Unverified"
"""

from datetime import datetime
from typing import Tuple

SOURCE_WEIGHTS = {
    "ping": 1.0,
    "manual": 0.7,
    "csv": 0.5,
    "unverified": 0.2,
}

CONFIRMED_RECENTLY_LABEL = "Confirmed recently"
LIKELY_AVAILABLE_LABEL = "Likely available"
UNVERIFIED_LABEL = "Unverified"


def calculate_freshness(minutes_since_confirmation: float) -> float:
    """Freshness decays linearly to 0 over 240 minutes (4 hours)."""
    if minutes_since_confirmation < 0:
        minutes_since_confirmation = 0.0
    return max(0.0, 1.0 - (minutes_since_confirmation / 240.0))


def get_source_weight(source: str) -> float:
    """Returns numerical weight according to data source."""
    return SOURCE_WEIGHTS.get(source.lower().strip(), 0.2)


def calculate_confidence_score(
    minutes_since_confirmation: float,
    source: str,
    pharmacy_accuracy: float,
    pharmacy_response_rate: float,
) -> float:
    """
    Computes confidence score (0 to 100).
    Pure function.
    """
    # Clamp accuracy and response rate between 0.0 and 1.0
    accuracy = max(0.0, min(1.0, float(pharmacy_accuracy)))
    response_rate = max(0.0, min(1.0, float(pharmacy_response_rate)))
    
    freshness = calculate_freshness(minutes_since_confirmation)
    source_weight = get_source_weight(source)

    raw_score = 100.0 * (
        (0.5 * freshness * source_weight) +
        (0.3 * accuracy) +
        (0.2 * response_rate)
    )
    return round(raw_score, 1)


def get_confidence_label(score: float) -> str:
    """
    Returns badge label based on confidence score.
    75 - 100: Confirmed recently
    40 - 74 : Likely available
    < 40    : Unverified
    """
    if score >= 75.0:
        return CONFIRMED_RECENTLY_LABEL
    elif score >= 40.0:
        return LIKELY_AVAILABLE_LABEL
    else:
        return UNVERIFIED_LABEL


def score_and_label(
    minutes_since_confirmation: float,
    source: str,
    pharmacy_accuracy: float,
    pharmacy_response_rate: float,
) -> Tuple[float, str]:
    """Helper returning both rounded score and label."""
    s = calculate_confidence_score(
        minutes_since_confirmation, source, pharmacy_accuracy, pharmacy_response_rate
    )
    l = get_confidence_label(s)
    return s, l


def parse_minutes_since(confirmed_at_str: str) -> int:
    """
    Calculates minutes elapsed between confirmed_at timestamp and current UTC time.
    """
    if not confirmed_at_str:
        return 9999
    
    clean_str = confirmed_at_str.replace("T", " ").split(".")[0]
    formats = ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"]
    dt = None
    for fmt in formats:
        try:
            dt = datetime.strptime(clean_str, fmt)
            break
        except ValueError:
            continue
            
    if not dt:
        return 9999
        
    diff = datetime.utcnow() - dt
    total_minutes = int(diff.total_seconds() / 60.0)
    return max(0, total_minutes)
