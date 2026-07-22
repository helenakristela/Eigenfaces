import os
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from eigenfaces import EigenfacesModel, load_image_bytes
from PIL import Image
import io

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")

app = Flask(__name__)
CORS(app)

model = EigenfacesModel(DATASET_DIR)

def png_to_b64(data):
    return base64.b64encode(data).decode("ascii")

def file_to_b64(path):
    with open(path, "rb") as f:
        raw = f.read()
    img = Image.open(io.BytesIO(raw)).convert("L")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return png_to_b64(buf.getvalue())

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/api/dataset", methods=["GET"])
def dataset_info():
    return jsonify({
        "subjects": model.subjects_summary(),
        "total_images": len(model.labels),
        "k": model.k,
        "threshold": model.threshold,
    })

@app.route("/api/gallery", methods=["GET"])
def gallery():
    mean_png, faces = model.gallery_data(max_faces=16)
    return jsonify({
        "mean_face": png_to_b64(mean_png),
        "eigenfaces": [png_to_b64(f) for f in faces],
        "k": model.k,
        "eigenvalues": model.eigenvalues[:16].tolist(),
    })

@app.route("/api/recognize", methods=["POST"])
def recognize():
    if "image" not in request.files:
        return jsonify({"error": "field 'image' wajib diisi"}), 400
    file = request.files["image"]
    data = file.read()
    if not data:
        return jsonify({"error": "file gambar kosong"}), 400
    try:
        vector = load_image_bytes(data)
    except Exception:
        return jsonify({"error": "gagal membaca gambar"}), 400
    result = model.recognize(vector)
    match_b64 = file_to_b64(result["match_image_path"])
    return jsonify({
        "label": result["label"],
        "closest_label": result["raw_label"],
        "distance": result["distance"],
        "threshold": result["threshold"],
        "is_known": result["is_known"],
        "match_image": match_b64,
    })

@app.route("/api/subjects", methods=["POST"])
def add_subject():
    name = request.form.get("name", "").strip()
    if not name:
        return jsonify({"error": "nama subjek wajib diisi"}), 400
    if not name.replace("_", "").replace("-", "").isalnum():
        return jsonify({"error": "nama subjek hanya boleh huruf, angka, - dan _"}), 400
    files = request.files.getlist("images")
    if not files:
        return jsonify({"error": "minimal satu gambar wajib diunggah"}), 400
    image_bytes_list = [b for b in (f.read() for f in files) if b]
    if not image_bytes_list:
        return jsonify({"error": "gambar tidak valid"}), 400
    try:
        model.add_subject(name, image_bytes_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify({
        "status": "ok",
        "subject": name,
        "total_images": len(model.labels),
        "k": model.k,
        "threshold": model.threshold,
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)