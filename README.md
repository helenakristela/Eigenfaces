# Eigenfaces Face Recognition

Aplikasi web pengenalan wajah menggunakan pendekatan Eigenfaces. Backend Flask
menghitung mean face, eigenface, dan proyeksi dari dataset AT&T (ORL), lalu mengenali wajah baru
lewat jarak Euclidean pada ruang eigenface. Frontend Next.js menyediakan upload/webcam capture,
hasil pengenalan, penambahan subjek baru, dan gallery eigenfaces.

## Cara Menjalankan

### Backend

```
cd backend
uv sync
uv run app.py
```

Server berjalan di `http://localhost:5000`. Saat start, backend otomatis memuat dataset dari
folder `backend/dataset`, menghitung mean face dan eigenfaces, lalu menyalakan API.

### Frontend

```
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Buka `http://localhost:3000`. Variabel `NEXT_PUBLIC_API_URL` di `.env.local` menunjuk ke alamat
backend (default `http://localhost:5000`).

## Sumber Dataset

AT&T (ORL) Database of Faces, 40 subjek x 10 citra grayscale 92x112 piksel, format PGM. Dataset
sudah disertakan langsung di `backend/dataset/s1` sampai `backend/dataset/s40` sehingga program
bisa langsung jalan tanpa perlu diunduh ulang.

## Penjelasan Pendekatan

**Representasi matriks.** Setiap citra grayscale 92x112 diubah menjadi vektor berdimensi
D=10304. Seluruh dataset (N=400 citra) disusun sebagai matriks X berukuran (N, D), satu baris
per citra.

**Mean-centering.** Mean face ψ dihitung sebagai rata-rata seluruh baris X. Setiap citra
dikurangi ψ sehingga didapat matriks tersentralisasi A (tersimpan dalam bentuk transpose, D x N).

**Pemilihan jumlah eigenfaces (k).** Karena D jauh lebih besar dari N, kovarians matriks asli
(D x D) tidak dihitung langsung. Sebagai gantinya, dipakai trik dimensi kecil L = AᵀA / N
berukuran (N, N), lalu `numpy.linalg.eigh` dipanggil pada L untuk mendapatkan eigenvector v.
Eigenface u didapat lewat u = A v, lalu dinormalisasi jadi vektor satuan. Eigenvalue diurutkan
menurun, dan k dipilih otomatis sebagai jumlah komponen minimum yang mencakup 95% variansi
kumulatif, dibatasi maksimum 120 komponen agar biaya komputasi proyeksi tetap ringan.

**Proyeksi.** Wajah (baik data training maupun input baru) diproyeksikan ke ruang eigenface
berdimensi k lewat perkalian (citra - ψ) dengan matriks eigenface, menghasilkan vektor bobot.

**Pengukuran kecocokan.** Jarak Euclidean dihitung antara vektor bobot wajah input dengan seluruh
vektor bobot wajah training. Subjek dari wajah training dengan jarak terkecil dijadikan hasil
pengenalan. Threshold "unknown" dihitung otomatis dari statistik dataset. Untuk setiap citra
training, dicari jarak ke tetangga terdekatnya lalu threshold = rata-rata + 2 x
standar deviasi dari jarak-jarak tersebut. Jika jarak wajah input ke tetangga terdekat melebihi
threshold ini, wajah dianggap tidak dikenali.

**Tambah subjek  retrain.** Saat subjek baru ditambahkan lewat UI, citra disimpan ke folder
`backend/dataset/<nama_subjek>`, lalu seluruh pipeline (mean face, eigenfaces, proyeksi,
threshold) dihitung ulang dari awal secara otomatis di memori, tanpa perlu restart server.

**Batasan & asumsi.**
- Citra input diasumsikan telah memuat wajah secara jelas dan proporsional (mengikuti gaya foto dataset ORL yakni
  posisi frontal, jarak wajah dominan pada bingkai). Tidak ada deteksi/cropping wajah otomatis.
- Semua citra diubah ukurannya secara paksa ke 92x112 sebelum diproses, tanpa mempertahankan rasio aspek asli.
- Retrain penuh dilakukan setiap kali subjek baru ditambahkan, untuk dataset ORL yang kecil (~400+ citra)
  prosesnya berlangsung dalam hitungan detik.
- Model disimpan di memori proses backend. Jika server di restart, model dilatih ulang otomatis
  dari isi folder `dataset` yang sudah bertambah, sehingga subjek yang pernah ditambahkan tetap
  dikenali.

## Fitur Bonus yang Diimplementasikan

- **Eigenfaces Gallery** (`/gallery`): menampilkan mean face dan visualisasi top 16 eigenfaces
  beserta eigenvaluenya.
- **Threshold unknown face**: dijelaskan di atas, ditampilkan juga di hasil pengenalan pada UI.

## Link Demo Video

(menyusul)