import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Eigenfaces Recognition",
  description: "Pengenalan wajah berbasis Eigenfaces",
};

const navigation = [
  { href: "/", label: "Kenali Wajah" },
  { href: "/add", label: "Tambah Subjek" },
  { href: "/gallery", label: "Galeri" },
];

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <div className="pointer-events-none fixed left-[-8rem] top-32 -z-10 h-72 w-72 rounded-full bg-blue-600/15 blur-[110px]" />
        <div className="pointer-events-none fixed right-[-8rem] top-10 -z-10 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />

        <header className="sticky top-0 z-50 border-b border-white/8 bg-[#05050a]/75 backdrop-blur-2xl">
          <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
            <Link href="/" className="shrink-0">
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-white">
                Eigenfaces
              </span>
            </Link>

            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.035] p-1.5 shadow-inner shadow-black/25">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-2 text-xs font-medium text-zinc-500 hover:bg-white/[0.08] hover:text-white sm:px-4"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
          {children}
        </main>

        <footer className="mt-10 h-8" />
      </body>
    </html>
  );
}