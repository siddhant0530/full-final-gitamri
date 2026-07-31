import { company } from "@/data/company";

export default function ComingSoonPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
        Coming Soon
      </span>
      <h1 className="mt-5 text-4xl font-black text-[#123524] md:text-5xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-md leading-7 text-zinc-600">{description}</p>
      <a
        href={`https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent(
          `Hi Gitamri Maaji, I'd like to know more about ${title.toLowerCase()}.`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-green-600 px-7 py-3.5 font-semibold text-white shadow-md transition hover:bg-green-700"
      >
        Message us on WhatsApp
      </a>
    </main>
  );
}
