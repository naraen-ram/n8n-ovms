import numpy as np
from PIL import Image

img = Image.open("test_face.jpg").convert("RGB").resize((300, 300))
img_array = np.array(img, dtype=np.float32)
img_array = img_array.transpose(2, 0, 1)
img_array = np.expand_dims(img_array, axis=0)

tensor_values = img_array.flatten().tolist()
with open("tensor_output.txt", "w") as f:
    f.write(','.join(map(str, tensor_values)))

print(f"Shape: {img_array.shape}")
print(f"Value range: {img_array.min():.1f} to {img_array.max():.1f}")
print("Saved to tensor_output.txt")