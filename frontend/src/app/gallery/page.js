"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

export default function Gallery() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGallery = async () => {
      try {
        setError(null);

        const res = await fetch(`${API_URL}/api/gallery`);
        const responseData = await res.json();

        if (!res.ok) {
          throw new Error(responseData.error || "Gagal memuat galeri.");
        }

        setData(responseData);
      } catch (err) {
        setError(err.message || "Gagal memuat galeri.");
      }
    };

    loadGallery();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/25 px-6 py-10 sm:px-10">
        <div className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-[-10rem] left-[20%] h-72 w-72 rounded-full bg-blue-600/20 blur-[110px]" />

        <div className="relative">
          <h1 className="neon-text text-4xl font-black uppercase tracking-[-0.04em] sm:text-5xl">
            Galeri Eigenfaces
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
            Visualisasi mean face dan eigenfaces dari dataset yang digunakan.
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="glass-panel flex min-h-64 items-center justify-center rounded-[1.75rem]">
          <p className="text-sm text-zinc-500">Memuat...</p>
        </div>
      )}

      {data && (
        <>
          <section className="glass-panel overflow-hidden rounded-[1.75rem]">
            <div className="grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[auto_1fr]">
              <div className="relative">
                <div className="relative rounded-[1.5rem] border border-white/15 bg-black/40 p-3">
                  <img
                    src={`data:image/png;base64,${data.mean_face}`}
                    alt="Mean face"
                    className="h-52 w-52 rounded-[1.1rem] object-cover"
                  />
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-white">
                  Mean Face
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
                  Mean face merupakan rata-rata seluruh citra wajah pada dataset.
                </p>
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-[1.75rem] p-6 sm:p-8">
            <div className="border-b border-white/10 pb-6">
              <h2 className="text-2xl font-semibold text-white">
                Eigenfaces
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Menampilkan {data.eigenfaces.length} eigenfaces dari total k = {data.k}.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {data.eigenfaces.map((face, index) => (
                <article
                  key={index}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-black/25 transition duration-300 hover:-translate-y-1 hover:border-purple-400/30"
                >
                  <div className="overflow-hidden bg-black/40 p-2">
                    <img
                      src={`data:image/png;base64,${face}`}
                      alt={`Eigenface ${index + 1}`}
                      className="aspect-square w-full rounded-xl object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="border-t border-white/10 px-4 py-3">
                    <p className="text-xs font-semibold text-white">
                      Eigenface {index + 1}
                    </p>

                    <p className="mt-1 truncate text-[10px] uppercase tracking-wide text-zinc-500">
                      λ{index + 1} = {data.eigenvalues[index]?.toFixed(0) ?? "N/A"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}