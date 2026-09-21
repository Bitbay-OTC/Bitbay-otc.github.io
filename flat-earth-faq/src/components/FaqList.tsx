import { SearchX, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import type { FaqEntry } from '../types';
import { categories } from '../data/faqs';
import { iconMap } from '../lib/icons';
import { FaqItem } from './FaqItem';

interface FaqListProps {
  entries: FaqEntry[];
  terms: string[];
  openIds: Set<string>;
  onToggle: (id: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  activeCategory: string | null;
  onCategoryChange: (id: string | null) => void;
  /** True while a search query is narrowing the list. */
  searching: boolean;
  onClearSearch: () => void;
}

export function FaqList({
  entries,
  terms,
  openIds,
  onToggle,
  onExpandAll,
  onCollapseAll,
  activeCategory,
  onCategoryChange,
  searching,
  onClearSearch,
}: FaqListProps) {
  const visibleCategories = categories.filter((category) =>
    entries.some((entry) => entry.category === category.id),
  );

  return (
    <div className="mt-6">
      {/* Section filter rail. */}
      <div className="flex items-center gap-3">
        <div className="scrollbar-none -mx-1 flex flex-1 gap-2 overflow-x-auto px-1 py-1">
          <button
            type="button"
            onClick={() => onCategoryChange(null)}
            aria-pressed={activeCategory === null}
            className={`chip shrink-0 ${activeCategory === null ? 'chip-active' : 'hover:border-steel-500'}`}
          >
            All sections
          </button>
          {categories.map((category) => {
            const Icon = iconMap[category.icon];
            const active = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(active ? null : category.id)}
                aria-pressed={active}
                className={`chip shrink-0 ${active ? 'chip-active' : 'hover:border-steel-500'}`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
                {category.label}
              </button>
            );
          })}
        </div>

        <div className="hidden shrink-0 gap-2 sm:flex">
          <button type="button" onClick={onExpandAll} className="diagram-btn" title="Expand every visible question">
            <ChevronsUpDown className="h-3.5 w-3.5" />
            Expand
          </button>
          <button type="button" onClick={onCollapseAll} className="diagram-btn" title="Collapse everything">
            <ChevronsDownUp className="h-3.5 w-3.5" />
            Collapse
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="panel mt-8 flex flex-col items-center gap-3 px-6 py-16 text-center">
          <SearchX className="h-8 w-8 text-steel-500" strokeWidth={1.5} />
          <p className="font-display text-lg font-semibold text-steel-200">Nothing matched that</p>
          <p className="max-w-sm text-sm leading-relaxed text-steel-400">
            Try a single keyword instead of a phrase. Terms like refraction, parallax, Antarctic, buoyancy
            or Michelson all land somewhere.
          </p>
          <button
            type="button"
            onClick={onClearSearch}
            className="mt-1 rounded-lg border border-steel-700 px-4 py-2 text-sm font-medium text-steel-200 transition-colors hover:border-steel-500"
          >
            Clear the search
          </button>
        </div>
      ) : searching ? (
        // A flat, relevance-ranked list reads better than groups while searching.
        <ul className="mt-6 space-y-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <FaqItem entry={entry} open={openIds.has(entry.id)} onToggle={onToggle} terms={terms} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 space-y-12">
          {visibleCategories.map((category) => {
            const Icon = iconMap[category.icon];
            const group = entries.filter((entry) => entry.category === category.id);
            return (
              <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-28">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-steel-700 bg-void-700/70 text-glow-400">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold tracking-tight text-steel-100">
                      {category.label}
                      <span className="ml-2 align-middle text-xs font-medium text-steel-500">
                        {group.length}
                      </span>
                    </h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-steel-400">{category.blurb}</p>
                  </div>
                </div>

                <ul className="mt-4 space-y-3">
                  {group.map((entry) => (
                    <li key={entry.id}>
                      <FaqItem entry={entry} open={openIds.has(entry.id)} onToggle={onToggle} terms={terms} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
