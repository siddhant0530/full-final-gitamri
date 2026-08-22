import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn the story behind Gitamri Maaji — traditional Indian foods made with organic ingredients, farm-sourced quality, and honest values.",
  alternates: { canonical: "/about" },
};

const promises = [
  { icon: "🌿", text: "100% Organic Ingredients" },
  { icon: "🌾", text: "Carefully Selected Farm Sources" },
  { icon: "❤️", text: "No Compromise on Quality" },
  { icon: "🏡", text: "Traditional Taste, Modern Standards" },
  { icon: "🤝", text: "Honest Food. Honest Values." },
];

export default function AboutPage() {
  return (
    <main className="bg-gradient-to-b from-[#F8F5EC] via-white to-[#E7EDE2]">
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <span className="inline-block rounded-full bg-gold-100 px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-gold-700">
          About Gitamri
        </span>
        <h1 className="mt-6 text-4xl font-black leading-tight text-[#263526] md:text-5xl">
          Bringing Back the Purity We Once Knew
        </h1>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="space-y-6 text-lg leading-8 text-zinc-700">
          <p>
            At Gitamri Premium Foods, we believe food should do more than satisfy
            hunger—it should nourish the body, strengthen families, and preserve
            the traditions our grandparents cherished.
          </p>

          <p>
            Our journey began with one mission:
            <br />
            To bring back 100% Organic, naturally grown, preservative-free foods
            that people can trust with confidence.
          </p>

          <p>
            In today&apos;s world, many foods are produced with a focus on
            quantity and lower costs. Along the way, purity, authenticity, and
            nutrition have often been compromised.
          </p>

          <p>We chose a different path.</p>

          <p>
            After months of research and countless visits to farms, we partnered
            with farmers who share our vision of growing crops with care and
            integrity. Although organically grown ingredients cost more than
            conventional alternatives, we believe health and quality should never
            be sacrificed for higher profits.
          </p>

          <p>
            Every ingredient we select reflects our commitment to authenticity,
            purity, and uncompromising quality. We believe the true value of food
            lies not in how cheaply it can be produced, but in how honestly it is
            grown and how confidently it can be served to our own families.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="rounded-3xl border border-gold-200 bg-white/80 p-10 shadow-xl backdrop-blur-md">
          <p className="text-center text-lg font-semibold text-[#263526]">
            At Gitamri, every product carries a promise:
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {promises.map((item) => (
              <div
                key={item.text}
                className="flex flex-col items-center gap-3 rounded-2xl border border-gold-100 bg-gold-50/50 p-6 text-center transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="text-3xl">{item.icon}</span>
                <span className="text-sm font-semibold leading-6 text-zinc-800">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
        <p className="text-xl leading-8 text-zinc-700">
          We are not simply building a food brand.
          <br />
          We are building a movement to bring pure, wholesome, and trustworthy
          food back to every Indian home.
        </p>

        <p className="mt-8 text-2xl font-bold text-[#263526]">
          Because a healthier future begins with what we eat today.
        </p>

        <p className="mt-10 text-lg font-semibold uppercase tracking-[0.2em] text-gold-700">
          From Maaji&apos;s HANDS to Your Home.
        </p>
      </section>
    </main>
  );
}
