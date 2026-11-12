import asyncio
import logging
from typing import Optional
from app.config import USE_AI, GEMINI_API_KEY

logger = logging.getLogger(__name__)

async def normalize_query_with_ai(user_raw_query: str) -> str:
    """
    Optional Gemini Free-Tier query understanding helper.
    Feature-flagged behind USE_AI=False (default).
    
    SAFETY & PRODUCT BOUNDARIES:
    - Never gives medical advice.
    - Never recommends alternative drugs or substitutions.
    - Only corrects phonetic spelling errors or maps common phrasing
      (e.g., 'paracetmol fever tablets' -> 'paracetamol').
    - Times out strictly after 3.0 seconds.
    - On any exception, network timeout, or when disabled, falls back 100%
      to the raw query string for RapidFuzz fuzzy matching.
    """
    clean_query = (user_raw_query or "").strip()
    if not USE_AI or not GEMINI_API_KEY or not clean_query:
        return clean_query

    try:
        import google.generativeai as genai  # type: ignore

        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = (
            "You are a medicine search term normalizer for an Indian pharmacy search engine. "
            "Your ONLY role is to extract or correct the brand name or generic chemical salt name. "
            "Do NOT give medical advice. Do NOT recommend alternative medicines or substitutes. "
            "Return ONLY the corrected medicine name as plain text (maximum 4 words). Nothing else.\n\n"
            f"Query: {clean_query}"
        )

        # 3.0 second strict timeout
        response = await asyncio.wait_for(
            asyncio.to_thread(model.generate_content, prompt),
            timeout=3.0,
        )

        if response and response.text:
            normalized = response.text.strip().replace("\n", " ")
            return normalized if len(normalized) < 60 else clean_query

    except Exception as e:
        logger.debug(f"AI query normalization fallback triggered: {e}")

    return clean_query
