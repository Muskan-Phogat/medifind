from typing import List, Dict, Any, Optional
from app.db import query_all

def get_unmet_demand_insights(
    pharmacy_id: Optional[int] = None,
    limit: int = 15,
    db_path: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Returns aggregated unmet demand from view_unmet_demand,
    prioritizing medicines with high search counts and unfulfilled pings/out-of-stock reports.
    If pharmacy_id is supplied, can flag if that pharmacy carries it or is out of stock.
    """
    if pharmacy_id:
        sql = """
            SELECT 
                v.medicine_id,
                v.medicine_name,
                v.generic_name,
                v.strength,
                v.form,
                v.search_count,
                v.unfulfilled,
                v.last_searched_at,
                COALESCE(i.status, 'not_carried') AS local_stock_status
            FROM view_unmet_demand v
            LEFT JOIN inventory i ON i.medicine_id = v.medicine_id AND i.pharmacy_id = ?
            WHERE v.search_count > 0
            ORDER BY v.unfulfilled DESC, v.search_count DESC
            LIMIT ?
        """
        rows = query_all(sql, (pharmacy_id, limit), db_path=db_path)
    else:
        sql = """
            SELECT 
                medicine_id,
                medicine_name,
                generic_name,
                strength,
                form,
                search_count,
                unfulfilled,
                last_searched_at
            FROM view_unmet_demand
            WHERE search_count > 0
            ORDER BY unfulfilled DESC, search_count DESC
            LIMIT ?
        """
        rows = query_all(sql, (limit,), db_path=db_path)

    items = []
    for r in rows:
        items.append({
            "medicine_id": r["medicine_id"],
            "medicine_name": r["medicine_name"],
            "generic_name": r["generic_name"],
            "strength": r["strength"],
            "form": r["form"],
            "search_count": r["search_count"],
            "unfulfilled": r["unfulfilled"],
            "last_searched_at": r["last_searched_at"],
            **({"local_stock_status": r["local_stock_status"]} if pharmacy_id else {})
        })
    return items
