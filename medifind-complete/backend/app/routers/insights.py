from typing import Optional
from fastapi import APIRouter, Query
from app.services.insights import get_unmet_demand_insights
from app.models import UnmetDemandResponse

router = APIRouter(tags=["Insights"])

@router.get("/insights/unmet-demand", response_model=UnmetDemandResponse)
def get_market_unmet_demand(
    pharmacy_id: Optional[int] = Query(default=None, description="Optional pharmacy ID to see localized deficit"),
    limit: int = Query(default=15, ge=1, le=50),
):
    """
    Returns weekly aggregated zero-result searches and inventory deficit metrics
    from view_unmet_demand to help pharmacies stock high-demand medicines.
    """
    items = get_unmet_demand_insights(pharmacy_id=pharmacy_id, limit=limit)
    return {"unmet_demands": items}
