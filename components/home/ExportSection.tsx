export default function ExportSection() {
  const pillars = [
    {
      icon: "🌍",
      title: "Export Ready",
      text: "Prepared with consistent quality to serve customers across India and global markets.",
    },
    {
      icon: "📦",
      title: "Secure Packaging",
      text: "Thoughtfully packed to help preserve freshness during storage and transport.",
    },
    {
      icon: "🏆",
      title: "Premium Quality Standards",
      text: "Every batch reflects our commitment to authenticity, quality and consistency.",
    },
    {
      icon: "🤝",
      title: "Trusted Partnerships",
      text: "Supporting distributors and retail partners with dependable products and service.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#fff7ec] via-white to-[#fffaf3] py-16 md:py-20">
      <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl"></div>
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-orange-200/20 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-amber-200 bg-white/80 px-5 py-2 text-xs font-bold uppercase tracking-[0.4em] text-amber-700">
            Global Presence
          </span>

          <h2 className="mt-8 text-4xl font-extrabold tracking-tight text-zinc-900 md:text-6xl">
            From Indian Kitchens
            <span className="block bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 bg-clip-text text-transparent">
              To Global Tables
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-zinc-600">
            Crafted with authentic recipes, carefully selected ingredients and premium quality,
            bringing the taste of India to families around the world.
          </p>

          <div className="mx-auto mt-10 h-1 w-28 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600"></div>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {pillars.map((item) => (
            <div
              key={item.title}
              className="group rounded-[30px] border border-amber-100 bg-white/80 p-8 shadow-xl backdrop-blur transition-all duration-500 hover:-translate-y-3 hover:border-amber-300 hover:shadow-2xl"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-4xl group-hover:scale-110 transition">
                {item.icon}
              </div>

              <h3 className="text-2xl font-bold text-zinc-900">{item.title}</h3>

              <p className="mt-4 leading-8 text-zinc-600">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="text-2xl font-semibold text-zinc-900">
            Bringing Authentic Indian Flavours Beyond Borders.
          </p>
        </div>
      </div>
    </section>
  );
}
