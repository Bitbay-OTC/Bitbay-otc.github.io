import { ArrowRight, Search, Telescope } from 'lucide-react';
import { faqs, quickTopics, faqById } from '../data/faqs';
import { iconMap } from '../lib/icons';

interface HeroProps {
  /** Opens the matching FAQ entry and scrolls to it. */
  onJump: (faqId: string) => void;
}

export function Hero({ onJump }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-32">
      {/* Backdrop: a faint grid under two soft coloured washes. */}
      <div className="pointer-events-none absolute inset-0 bg-grid-faint bg-grid opacity-70" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-radial-hero" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-void-900"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-glow-400/30 bg-glow-400/5 px-3.5 py-1.5 text-xs font-medium text-glow-300">
            <Telescope className="h-3.5 w-3.5" strokeWidth={2} />
            {faqs.length} questions, answered from inside the model
          </span>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
            Look again at the{' '}
            <span className="bg-gradient-to-r from-gold-400 via-gold-500 to-glow-400 bg-clip-text text-transparent">
              horizon
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-steel-300 text-pretty sm:text-lg">
            This is the flat earth model explained on its own terms: what it claims, why its
            proponents find it convincing, and what each argument looks like drawn out. Every core
            topic comes with a diagram you can pull apart yourself.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#faq"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 px-6 py-3 text-sm font-semibold text-void-900 transition-all hover:bg-gold-400 active:scale-[0.98] sm:w-auto"
            >
              Start reading
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#search"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-steel-700 bg-void-700/60 px-6 py-3 text-sm font-semibold text-steel-200 transition-colors hover:border-steel-500 sm:w-auto"
            >
              <Search className="h-4 w-4" />
              Search a question
            </a>
          </div>
        </div>

        {/* Quick-jump cards into the five diagram topics. */}
        <div id="topics" className="mt-16 scroll-mt-28 sm:mt-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Start with these</p>
              <h2 className="mt-1.5 font-display text-xl font-bold tracking-tight text-steel-100 sm:text-2xl">
                The five that carry the model
              </h2>
            </div>
            <a href="#faq" className="hidden shrink-0 text-sm font-medium text-glow-300 hover:text-glow-400 sm:block">
              All {faqs.length} questions →
            </a>
          </div>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickTopics.map((topic, index) => {
              const Icon = iconMap[topic.icon];
              const entry = faqById.get(topic.faqId);
              const isGold = topic.accent === 'gold';
              return (
                <li key={topic.faqId} className="animate-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
                  <button
                    type="button"
                    onClick={() => onJump(topic.faqId)}
                    className="group relative flex h-full w-full flex-col items-start gap-3 overflow-hidden rounded-2xl border border-steel-700/70 bg-void-700/60 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-steel-500 hover:bg-void-600/60"
                  >
                    <span
                      className={`pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 ${
                        isGold ? 'bg-gold-500/25' : 'bg-glow-400/20'
                      }`}
                      aria-hidden
                    />
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl border ${
                        isGold
                          ? 'border-gold-500/35 bg-gold-500/10 text-gold-400'
                          : 'border-glow-400/30 bg-glow-400/10 text-glow-400'
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>

                    <span className="relative">
                      <span className="block font-display text-base font-semibold tracking-tight text-steel-100">
                        {topic.title}
                      </span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-steel-400">{topic.teaser}</span>
                    </span>

                    <span
                      className={`relative mt-auto inline-flex items-center gap-1.5 pt-2 text-xs font-semibold ${
                        isGold ? 'text-gold-400' : 'text-glow-300'
                      }`}
                    >
                      {entry?.diagram ? 'Open with diagram' : 'Read the answer'}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                </li>
              );
            })}

            <li className="animate-fade-up" style={{ animationDelay: '300ms' }}>
              <a
                href="#faq"
                className="group flex h-full flex-col items-start justify-center gap-2 rounded-2xl border border-dashed border-steel-700 p-5 transition-colors hover:border-glow-400/50"
              >
                <span className="font-display text-base font-semibold text-steel-200">
                  Everything else
                </span>
                <span className="text-sm leading-relaxed text-steel-400">
                  Gravity, satellites, maps, the moon missions, motive. {faqs.length - quickTopics.length} more
                  questions below.
                </span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-glow-300">
                  Go to the FAQ
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
