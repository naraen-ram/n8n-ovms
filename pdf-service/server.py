import os
import tempfile
import subprocess
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image

app = Flask(__name__)

TARGET_W = 1280
TARGET_H = 768


def pdf_to_images(pdf_path, output_prefix):
    subprocess.run([
        "pdftoppm",
        "-png",
        "-r", "300",  
        pdf_path,
        output_prefix
    ], check=True)


def image_to_tensor(image_path):
    img = Image.open(image_path).convert("RGB")
    img = img.resize((TARGET_W, TARGET_H))

    arr = np.array(img).astype(np.float32)

    arr = arr 

    return arr.flatten().tolist()


@app.route("/process", methods=["POST"])
def process():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    with tempfile.TemporaryDirectory() as tmpdir:
        pdf_path = os.path.join(tmpdir, "input.pdf")
        file.save(pdf_path)

        prefix = os.path.join(tmpdir, "page")

        pdf_to_images(pdf_path, prefix)

        first_image = None

        for fname in sorted(os.listdir(tmpdir)):
            if fname.endswith(".png"):
                first_image = os.path.join(tmpdir, fname)
                break

        if not first_image:
            return jsonify({"error": "No images generated from PDF"}), 500

        tensor = image_to_tensor(first_image)

        return jsonify({
            "tensor": tensor,
            "shape": [1, TARGET_H, TARGET_W, 3],
            "source_image": os.path.basename(first_image)
        })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)