import { Fragment, useMemo } from 'react';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Wraps every occurrence of the search terms in a highlight span. */
export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const pattern = useMemo(() => {
    const usable = terms.filter((term) => term.length > 1).map(escapeRegExp);
    if (usable.length === 0) return null;
    return new RegExp(`(${usable.join('|')})`, 'gi');
  }, [terms]);

  if (!pattern) return <>{text}</>;

  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="rounded bg-gold-500/25 px-0.5 text-gold-400">
            {part}
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
