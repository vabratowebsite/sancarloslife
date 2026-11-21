// Milestone 1 placeholder. Shows the design tokens in use; replaced by the
// real home page in milestone 22.

const swatches = [
  { name: "Teal 700", className: "bg-teal-700", hex: "#1F7A7A", use: "Buttons, links, top bar" },
  { name: "Teal 500", className: "bg-teal-500", hex: "#2E9C9C", use: "Hover, accents, icons" },
  { name: "Teal 50", className: "bg-teal-50", hex: "#E6F4F4", use: "Section backgrounds, cards" },
  { name: "Sand 100", className: "bg-sand-100", hex: "#F6F1E8", use: "Alternate bands" },
  { name: "Ink 900", className: "bg-ink-900", hex: "#1C2B2B", use: "Body text" },
  { name: "Ink 500", className: "bg-ink-500", hex: "#5B6B6B", use: "Secondary text" },
  { name: "Coral 500", className: "bg-coral-500", hex: "#E0735A", use: "Open house, New" },
];

export default function Home() {
  return (
    <>

      <section className="bg-teal-50 py-20">
        <div className="container-site">
          <p className="eyebrow text-teal-700">The new San Carlos Life is on its way</p>
          <h1 className="mt-3 max-w-3xl text-h1">
            Events, food, parks and homes in the City of Good Living
          </h1>
          <p className="mt-5 max-w-2xl text-ink-500">
            We are rebuilding sancarloslife.com to be faster and easier to use. Every page you know
            keeps its address.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/events/"
              className="eyebrow rounded-button border-2 border-teal-700 bg-teal-700 px-6 py-3 text-white transition-colors hover:border-teal-500 hover:bg-teal-500"
            >
              See this week&rsquo;s events
            </a>
            <a
              href="/subscribe/"
              className="eyebrow rounded-button border-2 border-teal-700 px-6 py-3 text-teal-700 transition-colors hover:bg-white"
            >
              Subscribe
            </a>
          </div>
        </div>
      </section>

      <section className="bg-sand-100 py-16" aria-labelledby="tokens-heading">
        <div className="container-site">
          <h2 id="tokens-heading" className="text-h2">
            Design tokens
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
            {swatches.map((s) => (
              <li key={s.name} className="overflow-hidden rounded-card bg-white shadow-card">
                <div className={`h-20 ${s.className}`} aria-hidden="true" />
                <div className="p-4">
                  <p className="font-bold">{s.name}</p>
                  <p className="text-small text-ink-500">
                    {s.hex} · {s.use}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-12 grid gap-2">
            <p className="font-heading text-h1">Heading 48</p>
            <p className="font-heading text-h2">Heading 36</p>
            <p className="font-heading text-h3">Heading 28</p>
            <p className="font-heading text-h4">Heading 22</p>
            <p className="text-body">Body 18 on 1.6, set in Lato.</p>
            <p className="text-small text-ink-500">Small 16, for captions.</p>
            <p className="eyebrow text-teal-700">Label, Oswald 500 uppercase</p>
          </div>
        </div>
      </section>
    </>
  );
}
