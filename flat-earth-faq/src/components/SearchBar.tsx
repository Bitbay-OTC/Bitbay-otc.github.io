import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
}

export function SearchBar({ value, onChange, resultCount, totalCount }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses the field the way most documentation sites behave.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && /^(input|textarea|select)$/i.test(target.tagName);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape' && document.activeElement === inputRef.current) {
        onChange('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onChange]);

  return (
    <div className="relative">
      <label htmlFor="faq-search" className="sr-only">
        Search the FAQ
      </label>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500"
        aria-hidden
      />
      <input
        ref={inputRef}
        id="faq-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search: refraction, ice wall, Michelson, satellites…"
        autoComplete="off"
        className="w-full rounded-xl border border-steel-700 bg-void-700/70 py-3.5 pl-11 pr-28 text-sm text-steel-100 placeholder:text-steel-500 transition-colors hover:border-steel-600 focus:border-glow-400/60 [&::-webkit-search-cancel-button]:hidden"
      />

      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="grid h-7 w-7 place-items-center rounded-lg text-steel-400 transition-colors hover:bg-void-600 hover:text-steel-200"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="hidden rounded border border-steel-700 bg-void-800 px-1.5 py-0.5 font-mono text-[0.65rem] text-steel-500 sm:block">
            /
          </kbd>
        )}
      </div>

      <p aria-live="polite" className="mt-2 px-1 text-xs text-steel-500">
        {value
          ? `${resultCount} of ${totalCount} question${resultCount === 1 ? '' : 's'} match “${value}”.`
          : `${totalCount} questions. Press / to search, or filter by section below.`}
      </p>
    </div>
  );
}
