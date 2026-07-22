"use client";

import { useState } from "react";
import ImageCapture from "@/components/ImageCapture";
import { API_URL } from "@/lib/api";

export default function AddSubject() {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(null);
  const [images, setImages] = useState([]);
  const [captureKey, setCaptureKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const addToList = () => {
    if (!pending) return;

    const url = URL.createObjectURL(pending);

    setImages((prev) => [
      ...prev,
      {
        blob: pending,
        url,
      },
    ]);

    setPending(null);
    setCaptureKey((prev) => prev + 1);
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const selected = prev[index];
      if (selected?.url) {
        URL.revokeObjectURL(selected.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const submit = async () => {
    if (!name.trim() || images.length === 0) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = new FormData();
    form.append("name", name.trim());

    images.forEach((image, index) => {
      form.append("images", image.blob, `${index + 1}.png`);
    });

    try {
      const res = await fetch(`${API_URL}/api/subjects`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menambahkan subjek.");
      }

      images.forEach((image) => URL.revokeObjectURL(image.url));

      setSuccess(data);
      setName("");
      setImages([]);
      setPending(null);
      setCaptureKey((prev) => prev + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = name.trim() && images.length > 0 && !loading;

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/25 px-6 py-10 sm:px-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-purple-600/25 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-[-8rem] left-14 h-56 w-56 rounded-full bg-blue-600/20 blur-[100px]" />

        <div className="relative max-w-3xl">
          <h1 className="neon-text text-4xl font-black uppercase tracking-[-0.035em] sm:text-5xl">
            Tambah Subjek Baru
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
            Tambahkan nama dan beberapa foto wajah untuk dimasukkan ke dataset.
          </p>
        </div>
      </section>

      <section className="glass-panel rounded-[1.75rem] p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-white">
          Informasi subjek
        </h2>

        <div className="mt-5 max-w-md">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Masukkan nama subjek"
            className="w-full rounded-xl border border-white/12 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none focus:border-purple-400/60 focus:ring-4 focus:ring-purple-500/10"
          />
        </div>
      </section>

      <section className="glass-panel rounded-[1.75rem] p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-white">
          Tambahkan foto
        </h2>

        <div className="mt-6">
          <ImageCapture key={captureKey} onImageReady={setPending} />
        </div>

        {pending && (
          <button
            type="button"
            onClick={addToList}
            className="neon-button mt-5 rounded-xl px-5 py-3 text-sm font-semibold text-white"
          >
            Tambahkan ke Daftar
          </button>
        )}

        {images.length > 0 && (
          <div className="mt-8 border-t border-white/10 pt-7">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold text-white">Daftar foto</h3>

              <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-purple-300">
                {images.length} Foto
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {images.map((image, index) => (
                <article
                  key={image.url}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/30"
                >
                  <img
                    src={image.url}
                    alt={`Foto training ${index + 1}`}
                    className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                  />

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-8">
                    <p className="text-xs font-medium text-white">
                      Foto {index + 1}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label={`Hapus foto ${index + 1}`}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/65 text-sm text-white backdrop-blur hover:bg-red-500/70"
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="glass-panel rounded-[1.75rem] p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Simpan data
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Pastikan nama dan minimal satu foto sudah ditambahkan.
            </p>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="neon-button w-full rounded-xl px-6 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-purple-400/20 bg-purple-500/10 px-5 py-4 text-sm text-purple-100">
          Subjek <strong>{success.subject}</strong> berhasil ditambahkan. Total
          gambar sekarang <strong>{success.total_images}</strong>, dengan k ={" "}
          <strong>{success.k}</strong>.
        </div>
      )}
    </div>
  );
}