from typing import List
from fastapi import APIRouter, Query
from app.services.search import suggest_medicines
from app.services.ai_query import normalize_query_with_ai
from app.models import MedicineSuggestion

router = APIRouter(tags=["Medicines"])

@router.get("/medicines/suggest", response_model=List[MedicineSuggestion])
async def autocomplete_medicines(
    q: str = Query(..., min_length=1, description="Medicine brand name or generic salt query")
):
    """
    Typo-tolerant autocomplete across medicines using RapidFuzz.
    Optionally normalized by AI (with safe fallback). Returns top 8 matches.
    """
    # Attempt AI normalization if feature flag is active; falls back to q on error
    normalized_q = await normalize_query_with_ai(q)
    results = suggest_medicines(normalized_q, limit=8)
    return results
