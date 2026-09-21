import { Globe2, Info } from 'lucide-react';
import { categories } from '../data/faqs';
import { ShareButtons } from './ShareButtons';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-steel-700/70 bg-void-800/60">
      <div className="pointer-events-none absolute inset-0 bg-grid-faint bg-grid opacity-40" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Disclaimer. */}
        <section id="disclaimer" className="scroll-mt-28 py-12">
          <div className="panel p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-gold-500/30 bg-gold-500/10 text-gold-400">
                <Info className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold tracking-tight text-steel-100">
                  Disclaimer and reading notes
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-steel-400">
                  <p>
                    This site sets out the flat earth model on its own terms. The answers below are
                    the arguments its proponents make, written in their voice, and they are presented
                    as the model&apos;s claims rather than as settled findings.
                  </p>
                  <p>
                    These conclusions contradict the scientific consensus and the body of evidence
                    accepted in astronomy, physics and geodesy. Nothing here has been independently
                    verified by this site, and readers who want to settle any of it should go to the
                    primary sources on both sides and, where possible, run the experiments themselves.
                    That invitation is the one thing everyone quoted here agrees on.
                  </p>
                  <p>
                    Named people, agencies and companies are discussed as subjects of argument.
                    Claims about their conduct are the claims of the authors cited, not established
                    fact. Figures such as the 8 inches per mile squared approximation are quoted as
                    the model uses them.
                  </p>
                  <p>
                    The diagrams illustrate what each argument asserts. They are schematics of a
                    claim, not measurements, and each one says where it departs from scale.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Link columns. */}
        <div className="grid gap-10 border-t border-steel-700/60 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <a href="#top" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-glow-400/30 bg-void-700">
                <Globe2 className="h-[1.125rem] w-[1.125rem] text-glow-400" strokeWidth={1.8} />
              </span>
              <span className="font-display text-base font-bold tracking-tight text-steel-200">
                Flat Earth <span className="text-glow-400">FAQ</span>
              </span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-steel-400">
              Questions answered from inside the model, with interactive diagrams for the horizon,
              water level, the sun&apos;s path, the ice rim and eclipses.
            </p>
            <div className="mt-5">
              <p className="eyebrow mb-2.5">Share this page</p>
              <ShareButtons />
            </div>
          </div>

          <nav aria-label="Sections">
            <p className="eyebrow">Sections</p>
            <ul className="mt-3 space-y-2">
              {categories.slice(0, 4).map((category) => (
                <li key={category.id}>
                  <a
                    href={`#cat-${category.id}`}
                    className="text-sm text-steel-400 transition-colors hover:text-glow-300"
                  >
                    {category.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="More sections">
            <p className="eyebrow">More</p>
            <ul className="mt-3 space-y-2">
              {categories.slice(4).map((category) => (
                <li key={category.id}>
                  <a
                    href={`#cat-${category.id}`}
                    className="text-sm text-steel-400 transition-colors hover:text-glow-300"
                  >
                    {category.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#disclaimer" className="text-sm text-steel-400 transition-colors hover:text-glow-300">
                  Disclaimer
                </a>
              </li>
              <li>
                <a href="#search" className="text-sm text-steel-400 transition-colors hover:text-glow-300">
                  Search
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-steel-700/60 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-steel-500">© {year} Flat Earth FAQ. Text may be quoted with attribution.</p>
          <p className="text-xs text-steel-500">
            Built with React, Tailwind CSS and Lucide icons. No trackers, no analytics.
          </p>
        </div>
      </div>
    </footer>
  );
}
