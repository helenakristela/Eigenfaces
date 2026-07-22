"use client";

import { useEffect, useRef, useState } from "react";

export default function ImageCapture({ onImageReady, label }) {
  const [preview, setPreview] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const previewUrlRef = useRef(null);

  const updatePreview = (fileOrBlob) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const url = URL.createObjectURL(fileOrBlob);
    previewUrlRef.current = url;
    setPreview(url);
    onImageReady(fileOrBlob);
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    updatePreview(file);
  };

  const startCamera = async () => {
    setError(null);
    setCameraReady(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Browser tidak mendukung akses webcam.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      setStreaming(true);

      const video = videoRef.current;
      if (!video) throw new Error("Elemen video tidak tersedia.");

      video.srcObject = stream;

      video.onloadedmetadata = async () => {
        await video.play();
        setCameraReady(true);
      };
    } catch (err) {
      setStreaming(false);
      setError(`Tidak bisa mengakses kamera: ${err.message}`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStreaming(false);
    setCameraReady(false);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("Kamera belum siap. Tunggu sebentar lalu coba kembali.");
      return;
    }

    if (!canvas) {
      setError("Canvas tidak tersedia.");
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      setError("Gagal memproses gambar dari kamera.");
      return;
    }

    setError(null);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Gagal mengambil gambar.");
        return;
      }

      updatePreview(blob);
      stopCamera();
    }, "image/png");
  };

  const reset = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreview(null);
    setError(null);
    onImageReady(null);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {label && (
        <p className="text-sm text-zinc-500">
          {label}
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {!preview && !streaming && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-8 text-center">
          <h3 className="text-2xl font-semibold text-white">
            Pilih sumber gambar
          </h3>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-500">
            Unggah gambar dari perangkat atau ambil foto secara langsung menggunakan webcam.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <label className="neon-button cursor-pointer rounded-xl px-5 py-3 text-sm font-semibold text-white">
              Unggah Foto
              <input
                type="file"
                accept="image/*,.pgm,.ppm"
                className="hidden"
                onChange={handleFile}
              />
            </label>

            <button
              type="button"
              onClick={startCamera}
              className="rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white hover:bg-white/[0.08]"
            >
              Buka Webcam
            </button>
          </div>
        </div>
      )}

      <div className={streaming ? "flex flex-col gap-4" : "hidden"}>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black p-2 shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="aspect-video w-full max-w-2xl rounded-xl bg-black object-cover"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={capture}
            disabled={!cameraReady}
            className="neon-button rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            {cameraReady ? "Ambil Foto" : "Menyalakan kamera..."}
          </button>

          <button
            type="button"
            onClick={stopCamera}
            className="rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white hover:bg-white/[0.08]"
          >
            Batal
          </button>
        </div>
      </div>

      {preview && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
            <img
              src={preview}
              alt="Pratinjau foto wajah"
              className="max-h-[28rem] w-full object-contain"
            />
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.08]"
          >
            Ganti Foto
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}