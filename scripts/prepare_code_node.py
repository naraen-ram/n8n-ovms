import numpy as np
from PIL import Image

img = Image.open("test_face.jpg").convert("RGB").resize((300, 300))
img_array = np.array(img, dtype=np.float32)
img_array = img_array.transpose(2, 0, 1)
img_array = np.expand_dims(img_array, axis=0)

values = img_array.flatten().tolist()

# Write as a JS file instead of CSV
with open("code_node.js", "w") as f:
    f.write("const tensor = [\n")
    f.write(','.join(map(str, values)))
    f.write("\n];\n\nreturn [{ json: { inputData: tensor.join(',') } }];")

print("Written to code_node.js")
print(f"File size: {len(open('code_node.js').read())} bytes")