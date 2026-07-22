"use client";

import { useState } from "react";
import ImageCapture from "@/components/ImageCapture";
import { API_URL } from "@/lib/api";

export default function Home() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append("image", image, "capture.png");

    try {
      const res = await fetch(`${API_URL}/api/recognize`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengenali wajah.");
      }

      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/25 px-6 py-10 shadow-2xl sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-28 top-4 h-72 w-72 rounded-full bg-blue-600/25 blur-[100px]" />
        <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-purple-600/25 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-[-7rem] right-[20%] h-60 w-60 rounded-full bg-fuchsia-600/15 blur-[100px]" />

        <div className="relative max-w-3xl">
          <div className="mb-7 flex items-center gap-3">
            <span className="h-px w-9 bg-gradient-to-r from-blue-500 to-purple-500" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-300">
              Face Recognition
            </span>
          </div>

          <h1 className="neon-text text-balance text-5xl font-black uppercase leading-[0.93] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
            Kenali Wajah
            <br />
            dengan Eigenfaces
          </h1>

          <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-500 sm:text-base">
            Unggah foto atau gunakan webcam untuk mengenali wajah berdasarkan
            dataset yang telah disimpan.
          </p>
        </div>
      </section>

      <section className="glass-panel rounded-[1.75rem] p-5 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Masukkan foto wajah
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Gunakan foto yang jelas dan cukup terang agar hasil pengenalan lebih baik.
          </p>
        </div>

        <ImageCapture onImageReady={setImage} />

        <button
          type="button"
          onClick={analyze}
          disabled={!image || loading}
          className="neon-button mt-7 w-full rounded-xl px-6 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto"
        >
          {loading ? "Memproses..." : "Kenali Wajah"}
        </button>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {result && (
        <section className="glass-panel overflow-hidden rounded-[1.75rem]">
          <div className="border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-fuchsia-500/10 px-6 py-6 sm:px-8">
            <h2 className="text-2xl font-semibold text-white">
              {result.is_known
                ? `Dikenali sebagai ${result.label}`
                : "Wajah tidak dikenali"}
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              {result.is_known
                ? "Sistem menemukan kecocokan dalam dataset."
                : "Wajah tidak cocok dengan data yang tersedia."}
            </p>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["Subjek terdekat", result.closest_label],
                  ["Jarak", result.distance.toFixed(2)],
                  ["Threshold", result.threshold.toFixed(2)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/10 bg-white/[0.035] p-4"
                  >
                    <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Citra pembanding
              </p>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-2">
                <img
                  src={`data:image/png;base64,${result.match_image}`}
                  alt={`Citra pembanding ${result.closest_label}`}
                  className="h-40 w-40 rounded-2xl bg-black object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}