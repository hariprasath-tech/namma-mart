"""
Lost Demand Normalization and Aggregator.
Groups zero-stock search logs and customer item inquiries.
Applies Tamil/English transliteration normalization and ranks unmet demand.
"""

import re
from typing import List, Dict, Any
from app.schemas import LostDemandItem

# Common Tamil transliteration mappings to standard English terms
TRANSLITERATION_MAP = {
    "arisi": "rice",
    "nellu": "paddy rice",
    "paruppu": "dal",
    "thuvaram paruppu": "toor dal",
    "enna": "oil",
    "ennai": "oil",
    "nallennai": "sesame oil",
    "kadugu": "mustard seeds",
    "seeragam": "cumin seeds",
    "milagu": "black pepper",
    "thengai": "coconut",
    "sakkarai": "sugar",
    "vellam": "jaggery",
    "paal": "milk",
    "ney": "ghee",
    "thool": "powder",
    "teathool": "tea powder",
    "kaapi": "coffee",
}


def normalize_query(query: str) -> str:
    """Normalizes search query: lowercases, strips punctuation, and maps Tamil transliterations."""
    clean = query.lower().strip()
    clean = re.sub(r"[^\w\s]", "", clean)
    clean = re.sub(r"\s+", " ", clean)

    # Check dictionary transliterations - match longest phrases first
    for tamil_term, english_equiv in sorted(TRANSLITERATION_MAP.items(), key=lambda x: len(x[0]), reverse=True):
        if tamil_term in clean:
            clean = clean.replace(tamil_term, english_equiv)

    # Common aliases (groups variants like LED bulb and 40W together)
    if "led" in clean and "bulb" in clean:
        clean = "led bulb"
    if "aavin" in clean and "milk" in clean:
        clean = "aavin milk green magic"

    return clean.strip()


def aggregate_lost_demand(
    search_logs: List[Dict[str, Any]],
    item_requests: List[Dict[str, Any]]
) -> List[LostDemandItem]:
    """
    Groups zero-stock searches and unmet customer requests.
    Returns ranked LostDemandItem list.
    """
    counts: Dict[str, Dict[str, Any]] = {}

    for s in search_logs:
        q_norm = normalize_query(s.get("query", ""))
        if not q_norm:
            continue
        if q_norm not in counts:
            counts[q_norm] = {"searches": 0, "requests": 0, "category": s.get("category", "General")}
        counts[q_norm]["searches"] += 1

    for r in item_requests:
        title = r.get("itemTitle") or r.get("title", "")
        q_norm = normalize_query(title)
        if not q_norm:
            continue
        if q_norm not in counts:
            counts[q_norm] = {"searches": 0, "requests": 0, "category": r.get("category", "General")}
        counts[q_norm]["requests"] += 1

    items: List[LostDemandItem] = []
    for q, data in counts.items():
        total_score = (data["searches"] * 1) + (data["requests"] * 3)
        items.append(
            LostDemandItem(
                query=q.title(),
                category=data["category"],
                searchCount=data["searches"],
                requestCount=data["requests"],
                totalScore=total_score,
                trending=total_score >= 5
            )
        )

    # Sort descending by total score
    items.sort(key=lambda x: x.totalScore, reverse=True)
    return items
