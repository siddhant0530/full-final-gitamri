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
    <main className="bg-gradient-to-b from-[#F8F5EC] via-white to-[#E7EDE2]">
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <span className="inline-block rounded-full bg-gold-100 px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-gold-700">
          Gitamri Maaji
        </span>
        <h1 className="mt-6 text-4xl font-black leading-tight text-[#263526] md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-sm text-zinc-500">Last updated: {updated}</p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="space-y-8 rounded-3xl border border-gold-100 bg-white/80 p-8 shadow-xl backdrop-blur-md md:p-12">
          {children}
        </div>
      </section>
    </main>
  );
}
