import os
import io
import numpy as np
from PIL import Image

IMG_WIDTH = 92
IMG_HEIGHT = 112
IMG_SIZE = (IMG_WIDTH, IMG_HEIGHT)
VARIANCE_THRESHOLD = 0.95
MAX_EIGENFACES = 120

def image_to_vector(img):
    img = img.convert("L").resize(IMG_SIZE, Image.LANCZOS)
    return np.asarray(img, dtype=np.float64).flatten()

def load_image_file(path):
    with Image.open(path) as img:
        return image_to_vector(img)

def load_image_bytes(data):
    with Image.open(io.BytesIO(data)) as img:
        return image_to_vector(img)

def vector_to_png_bytes(vector, width=IMG_WIDTH, height=IMG_HEIGHT, normalize=False):
    arr = vector.reshape(height, width).copy()
    if normalize:
        arr -= arr.min()
        maxv = arr.max()
        if maxv > 0:
            arr = arr / maxv * 255
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="PNG")
    return buf.getvalue()

class EigenfacesModel:
    def __init__(self, dataset_dir):
        self.dataset_dir = dataset_dir
        self.image_matrix = None
        self.labels = []
        self.image_paths = []
        self.mean_face = None
        self.eigenfaces = None
        self.eigenvalues = None
        self.projections = None
        self.k = 0
        self.threshold = None
        self.train()
    def _load_dataset(self):
        vectors = []
        labels = []
        paths = []
        subjects = sorted(os.listdir(self.dataset_dir))
        for subject in subjects:
            subject_dir = os.path.join(self.dataset_dir, subject)
            if not os.path.isdir(subject_dir):
                continue
            files = sorted(os.listdir(subject_dir))
            for fname in files:
                ext = os.path.splitext(fname)[1].lower()
                if ext not in (".pgm", ".png", ".jpg", ".jpeg"):
                    continue
                fpath = os.path.join(subject_dir, fname)
                vectors.append(load_image_file(fpath))
                labels.append(subject)
                paths.append(fpath)
        return np.array(vectors, dtype=np.float64), labels, paths
    def _compute_mean_and_center(self, X):
        mean_face = X.mean(axis=0)
        centered = X - mean_face
        return mean_face, centered
    def _compute_eigenfaces(self, centered):
        n = centered.shape[0]
        A = centered.T
        L = (A.T @ A) / n
        eigvals, eigvecs = np.linalg.eigh(L)
        order = np.argsort(eigvals)[::-1]
        eigvals = eigvals[order]
        eigvecs = eigvecs[:, order]
        eigvals = np.clip(eigvals, a_min=0, a_max=None)
        eigenfaces = A @ eigvecs
        norms = np.linalg.norm(eigenfaces, axis=0)
        norms[norms == 0] = 1
        eigenfaces = eigenfaces / norms
        return eigenfaces, eigvals
    def _select_k(self, eigvals):
        total = eigvals.sum()
        if total <= 0:
            return min(1, len(eigvals))
        ratio = np.cumsum(eigvals) / total
        k = int(np.searchsorted(ratio, VARIANCE_THRESHOLD) + 1)
        k = max(1, min(k, len(eigvals), MAX_EIGENFACES))
        return k
    def _project(self, centered_vector, eigenfaces):
        return eigenfaces.T @ centered_vector
    def _compute_threshold(self):
        n = self.projections.shape[0]
        nearest = np.zeros(n)
        for i in range(n):
            diffs = self.projections - self.projections[i]
            dists = np.linalg.norm(diffs, axis=1)
            dists[i] = np.inf
            nearest[i] = dists.min()
        return float(nearest.mean() + 2 * nearest.std())
    def train(self):
        X, labels, paths = self._load_dataset()
        if X.shape[0] == 0:
            raise RuntimeError("dataset kosong, tidak ada gambar untuk dilatih")
        mean_face, centered = self._compute_mean_and_center(X)
        eigenfaces, eigvals = self._compute_eigenfaces(centered)
        k = self._select_k(eigvals)
        eigenfaces_k = eigenfaces[:, :k]
        projections = (centered @ eigenfaces_k)
        self.image_matrix = X
        self.labels = labels
        self.image_paths = paths
        self.mean_face = mean_face
        self.eigenfaces = eigenfaces_k
        self.eigenvalues = eigvals[:k]
        self.projections = projections
        self.k = k
        self.threshold = self._compute_threshold()
    def recognize(self, vector):
        centered = vector - self.mean_face
        weights = self._project(centered, self.eigenfaces)
        diffs = self.projections - weights
        distances = np.linalg.norm(diffs, axis=1)
        best_idx = int(np.argmin(distances))
        best_distance = float(distances[best_idx])
        is_known = best_distance <= self.threshold
        return {
            "label": self.labels[best_idx] if is_known else None,
            "raw_label": self.labels[best_idx],
            "distance": best_distance,
            "threshold": self.threshold,
            "is_known": is_known,
            "match_image_path": self.image_paths[best_idx],
        }
    def add_subject(self, name, image_bytes_list):
        subject_dir = os.path.join(self.dataset_dir, name)
        os.makedirs(subject_dir, exist_ok=True)
        existing = [f for f in os.listdir(subject_dir) if f.lower().endswith((".pgm", ".png", ".jpg", ".jpeg"))]
        start_idx = len(existing) + 1
        for i, data in enumerate(image_bytes_list):
            img = Image.open(io.BytesIO(data)).convert("L").resize(IMG_SIZE, Image.LANCZOS)
            img.save(os.path.join(subject_dir, f"{start_idx + i}.png"))
        self.train()
    def gallery_data(self, max_faces=16):
        mean_png = vector_to_png_bytes(self.mean_face, normalize=False)
        faces = []
        count = min(max_faces, self.eigenfaces.shape[1])
        for i in range(count):
            png = vector_to_png_bytes(self.eigenfaces[:, i], normalize=True)
            faces.append(png)
        return mean_png, faces
    def subjects_summary(self):
        subjects = {}
        for label in self.labels:
            subjects[label] = subjects.get(label, 0) + 1
        return subjects