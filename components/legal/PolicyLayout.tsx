import { ReactNode } from "react";

export default function PolicyLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-gradient-to-b from-[#FFF8EA] via-white to-[#F5F8F2]">
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <span className="inline-block rounded-full bg-amber-100 px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
          Gitamri Maaji
        </span>
        <h1 className="mt-6 text-4xl font-black leading-tight text-[#123524] md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-sm text-zinc-500">Last updated: {updated}</p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="space-y-8 rounded-3xl border border-amber-100 bg-white/80 p-8 shadow-xl backdrop-blur-md md:p-12">
          {children}
        </div>
      </section>
    </main>
  );
}
