import type { FaqEntry } from '../types';

/** Words too common to be worth matching on. */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'of', 'to', 'in', 'on', 'for',
  'and', 'or', 'do', 'does', 'how', 'what', 'why', 'it', 'that', 'this', 'we',
]);

function haystack(entry: FaqEntry): string {
  return [entry.question, entry.summary, ...(entry.keyPoints ?? []), ...entry.answer, ...entry.tags]
    .join(' ')
    .toLowerCase();
}

const cache = new WeakMap<FaqEntry, string>();

function cachedHaystack(entry: FaqEntry): string {
  let value = cache.get(entry);
  if (value === undefined) {
    value = haystack(entry);
    cache.set(entry, value);
  }
  return value;
}

/**
 * Filters and ranks entries against a free-text query. Every non-trivial term
 * must appear somewhere in the entry; matches in the question or tags rank
 * above matches buried in the body.
 */
export function searchFaqs(entries: FaqEntry[], query: string): FaqEntry[] {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term));

  if (terms.length === 0) return entries;

  const scored: Array<{ entry: FaqEntry; score: number }> = [];

  for (const entry of entries) {
    const body = cachedHaystack(entry);
    const question = entry.question.toLowerCase();
    const tags = entry.tags.join(' ').toLowerCase();

    let score = 0;
    let matchedAll = true;

    for (const term of terms) {
      if (!body.includes(term)) {
        matchedAll = false;
        break;
      }
      if (question.includes(term)) score += 6;
      if (tags.includes(term)) score += 4;
      if (entry.summary.toLowerCase().includes(term)) score += 2;
      score += 1;
    }

    if (matchedAll) scored.push({ entry, score });
  }

  return scored.sort((a, b) => b.score - a.score).map((item) => item.entry);
}
