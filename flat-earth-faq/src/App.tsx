import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SearchBar } from './components/SearchBar';
import { FaqList } from './components/FaqList';
import { Footer } from './components/Footer';
import { BackToTop } from './components/BackToTop';
import { StarField } from './components/StarField';
import { faqs, faqById } from './data/faqs';
import { searchFaqs } from './lib/search';

export default function App() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  const terms = useMemo(
    () =>
      query
        .toLowerCase()
        .split(/[^a-z0-9']+/)
        .filter((term) => term.length > 1),
    [query],
  );

  const searching = query.trim().length > 0;

  const entries = useMemo(() => {
    const scoped = activeCategory ? faqs.filter((entry) => entry.category === activeCategory) : faqs;
    return searching ? searchFaqs(scoped, query) : scoped;
  }, [activeCategory, query, searching]);

  const toggle = useCallback((id: string) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /** Opens an entry, clears anything hiding it, then scrolls it into view. */
  const jumpTo = useCallback((id: string) => {
    const entry = faqById.get(id);
    if (!entry) return;
    setQuery('');
    setActiveCategory(null);
    setOpenIds((current) => new Set(current).add(id));
    window.history.replaceState(null, '', `#${id}`);
    // Wait a frame so the entry is rendered and expanded before scrolling.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }, []);

  // Honour a deep link on first paint, and respond to later hash changes.
  useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.replace('#', '');
      if (id && faqById.has(id)) jumpTo(id);
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, [jumpTo]);

  return (
    <div className="relative min-h-screen">
      <StarField />
      <Navbar />
      <BackToTop />

      <main>
        <Hero onJump={jumpTo} />

        <section id="faq" className="relative scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="text-center">
              <p className="eyebrow">The questions</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
                Everything people ask, answered in full
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-steel-400 sm:text-base">
                Expand any question to read the model&apos;s answer. Five of them open with an
                interactive diagram you can drive yourself.
              </p>
            </div>

            <div id="search" className="mt-8 scroll-mt-28">
              <SearchBar
                value={query}
                onChange={setQuery}
                resultCount={entries.length}
                totalCount={activeCategory ? faqs.filter((e) => e.category === activeCategory).length : faqs.length}
              />
            </div>

            <FaqList
              entries={entries}
              terms={terms}
              openIds={openIds}
              onToggle={toggle}
              onExpandAll={() => setOpenIds(new Set(entries.map((entry) => entry.id)))}
              onCollapseAll={() => setOpenIds(new Set())}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              searching={searching}
              onClearSearch={() => setQuery('')}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
