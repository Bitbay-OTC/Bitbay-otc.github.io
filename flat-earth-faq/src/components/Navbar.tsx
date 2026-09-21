import { useEffect, useState } from 'react';
import { Menu, X, Globe2 } from 'lucide-react';
import { categories } from '../data/faqs';
import { iconMap } from '../lib/icons';

const PRIMARY_LINKS = [
  { href: '#top', label: 'Start here' },
  { href: '#topics', label: 'Topics' },
  { href: '#faq', label: 'The FAQ' },
  { href: '#disclaimer', label: 'Disclaimer' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock the page behind the drawer and let Escape close it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-steel-700/70 bg-void-900/85 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" className="group flex items-center gap-2.5">
            <span className="relative grid h-9 w-9 place-items-center rounded-xl border border-glow-400/30 bg-void-700">
              <Globe2 className="h-[1.125rem] w-[1.125rem] text-glow-400" strokeWidth={1.8} />
              <span className="absolute inset-0 rounded-xl shadow-glow opacity-60 transition-opacity group-hover:opacity-100" />
            </span>
            <span className="font-display text-base font-bold tracking-tight text-steel-200">
              Flat Earth <span className="text-glow-400">FAQ</span>
            </span>
          </a>

          <div className="hidden items-center gap-1 md:flex">
            {PRIMARY_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-steel-300 transition-colors hover:bg-void-700/60 hover:text-steel-100"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#faq"
              className="ml-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-void-900 transition-colors hover:bg-gold-400"
            >
              Browse questions
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-steel-700 text-steel-300 transition-colors hover:text-steel-100 md:hidden"
            aria-label="Open navigation"
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </header>

      {/* Mobile drawer. */}
      <div
        className={`fixed inset-0 z-[60] md:hidden ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-void-900/80 backdrop-blur-sm transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col border-l border-steel-700 bg-void-800 shadow-panel transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-steel-700/70 px-4">
            <span className="font-display text-sm font-semibold text-steel-200">Navigate</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-steel-700 text-steel-300"
              aria-label="Close navigation"
            >
              <X className="h-[1.125rem] w-[1.125rem]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {PRIMARY_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-steel-200 transition-colors hover:bg-void-700"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <p className="eyebrow mt-6 px-3">Sections</p>
            <ul className="mt-2 space-y-1">
              {categories.map((category) => {
                const Icon = iconMap[category.icon];
                return (
                  <li key={category.id}>
                    <a
                      href={`#cat-${category.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-void-700"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-glow-400" strokeWidth={1.8} />
                      <span>
                        <span className="block text-sm font-medium text-steel-200">{category.label}</span>
                        <span className="mt-0.5 block text-xs leading-snug text-steel-500">{category.blurb}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-steel-700/70 p-4">
            <a
              href="#faq"
              onClick={() => setOpen(false)}
              className="block rounded-lg bg-gold-500 px-4 py-2.5 text-center text-sm font-semibold text-void-900"
            >
              Browse questions
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
