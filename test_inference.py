import requests
import json
import numpy as np

OVMS_URL = "http://localhost:9001"
MODEL_NAME = "face-detection"

# --- Step 1: Health check ---
print("=== Health Check ===")
health = requests.get(f"{OVMS_URL}/v2/health/ready")
print(f"Status: {health.status_code}")

# --- Step 2: Model metadata ---
print("\n=== Model Metadata ===")
meta = requests.get(f"{OVMS_URL}/v2/models/{MODEL_NAME}")
print(json.dumps(meta.json(), indent=2))

# --- Step 3: Inference with a blank image ---
print("\n=== Inference ===")
blank_image = np.zeros((1, 3, 300, 300), dtype=np.float32)

payload = {
    "inputs": [
        {
            "name": "data",
            "shape": [1, 3, 300, 300],
            "datatype": "FP32",
            "data": blank_image.flatten().tolist()
        }
    ]
}

response = requests.post(
    f"{OVMS_URL}/v2/models/{MODEL_NAME}/infer",
    json=payload
)

print(f"Status: {response.status_code}")
result = response.json()

print(f"Model: {result['model_name']} v{result['model_version']}")
print(f"Output shape: {result['outputs'][0]['shape']}")

detections = result['outputs'][0]['data']
print(f"\nTotal values in output: {len(detections)}")
print(f"Total possible detections: {len(detections) // 7}")

print("\n=== Detections with confidence > 0.3 ===")
found = 0
for i in range(0, len(detections), 7):
    d = detections[i:i+7]
    confidence = d[2]
    if confidence > 0.3:
        found += 1
        print(f"  Detection {found}:")
        print(f"    Confidence : {confidence:.4f}")
        print(f"    Bounding box: x1={d[3]:.3f}, y1={d[4]:.3f}, x2={d[5]:.3f}, y2={d[6]:.3f}")

if found == 0:
    print("  No detections above threshold (expected — input was a blank image)")

print("\n=== What the node should return to n8n ===")
node_output = {
    "model_name": result['model_name'],
    "model_version": result['model_version'],
    "executed_on": "CPU",
    "output_shape": result['outputs'][0]['shape'],
    "raw_output": result['outputs'][0]['data'][:14]
}
print(json.dumps(node_output, indent=2))