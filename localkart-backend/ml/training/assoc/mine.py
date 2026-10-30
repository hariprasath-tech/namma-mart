"""
Mine product association rules using FP-Growth.
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from app.services.associator import mine_product_associations

print("Mining Market Basket Association Rules using FP-Growth...")
baskets = [
    ["Ponni Rice 5kg", "Cold Pressed Groundnut Oil 1L", "Toor Dal 1kg"],
    ["Ponni Rice 5kg", "Pure Ghee 500ml", "Cold Pressed Groundnut Oil 1L"],
    ["Toor Dal 1kg", "Cold Pressed Groundnut Oil 1L", "Mustard Seeds 100g"],
    ["Aavin Green Magic Milk 500ml", "AVT Premium Tea Dust 500g", "White Sugar 1kg"],
    ["Aavin Green Magic Milk 500ml", "AVT Premium Tea Dust 500g"],
    ["Organic Country Sugar 1kg", "AVT Premium Tea Dust 500g"],
    ["Ponni Rice 5kg", "Toor Dal 1kg", "Cumin Seeds 100g"],
    ["Ponni Rice 5kg", "Cold Pressed Groundnut Oil 1L"],
]

pairs = mine_product_associations(baskets, min_support=0.15, min_confidence=0.3)
print(f"[OK] Discovered {len(pairs)} association rules with lift > 1.0.")
for p in pairs[:3]:
    print(f"   -> {p.productA} + {p.productB} (Lift: {p.lift}x, Conf: {p.frequency}%)")
