import requests
import numpy as np
from PIL import Image
import json

OVMS_URL = "http://localhost:9001"
MODEL_NAME = "face-detection"

img = Image.open("test_face.jpg").convert("RGB").resize((300, 300))
img_array = np.array(img, dtype=np.float32)
img_array = img_array.transpose(2, 0, 1)
img_array = np.expand_dims(img_array, axis=0)

payload = {
    "inputs": [{
        "name": "data",
        "shape": [1, 3, 300, 300],
        "datatype": "FP32",
        "data": img_array.flatten().tolist()
    }]
}

response = requests.post(
    f"{OVMS_URL}/v2/models/{MODEL_NAME}/infer",
    json=payload
)

result = response.json()
detections = result['outputs'][0]['data']

print(f"Model: {result['model_name']} v{result['model_version']}")
print("\n=== Face Detections (confidence > 0.3) ===")
found = 0
for i in range(0, len(detections), 7):
    d = detections[i:i+7]
    confidence = d[2]
    if confidence > 0.3:
        found += 1
        print(f"  Face {found}:")
        print(f"    Confidence : {confidence:.4f}")
        print(f"    Bounding box: x1={d[3]:.3f}, y1={d[4]:.3f}, x2={d[5]:.3f}, y2={d[6]:.3f}")

if found == 0:
    print("  No faces detected above threshold")
else:
    print(f"\nTotal faces detected: {found}")