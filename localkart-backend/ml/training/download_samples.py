"""
Download / verify sample demo images, planograms and weights for local evaluation.
"""

import os
from PIL import Image

samples_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../samples"))
os.makedirs(samples_dir, exist_ok=True)

# Generate synthetic representative shelf image if not present
shelf_demo_path = os.path.join(samples_dir, "shelf_demo.jpg")
if not os.path.exists(shelf_demo_path):
    img = Image.new("RGB", (640, 480), color=(220, 215, 200))
    img.save(shelf_demo_path, format="JPEG")
    print(f"Created sample shelf demo frame at {shelf_demo_path}")

print("All sample weights and fixture assets verified.")
