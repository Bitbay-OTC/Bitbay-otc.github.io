import { useState } from 'react';
import { ChevronDown, Link2, Check, Shapes } from 'lucide-react';
import type { FaqEntry } from '../types';
import { Diagram } from './diagrams';
import { Highlight } from './Highlight';

interface FaqItemProps {
  entry: FaqEntry;
  open: boolean;
  onToggle: (id: string) => void;
  /** Lower-cased search terms, used to highlight matches. */
  terms: string[];
}

export function FaqItem({ entry, open, onToggle, terms }: FaqItemProps) {
  const [copied, setCopied] = useState(false);
  const panelId = `panel-${entry.id}`;
  const buttonId = `q-${entry.id}`;

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${entry.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard access can be refused; the hash update below still works.
    }
    window.history.replaceState(null, '', `#${entry.id}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article
      id={entry.id}
      className={`scroll-mt-28 overflow-hidden rounded-2xl border transition-colors duration-300 ${
        open
          ? 'border-glow-400/35 bg-void-700/80 shadow-panel'
          : 'border-steel-700/70 bg-void-700/40 hover:border-steel-600'
      }`}
    >
      <h3>
        <button
          type="button"
          id={buttonId}
          onClick={() => onToggle(entry.id)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-start gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
        >
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-display text-[0.98rem] font-semibold leading-snug tracking-tight text-steel-100 sm:text-lg">
                <Highlight text={entry.question} terms={terms} />
              </span>
              {entry.diagram && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gold-500/30 bg-gold-500/10 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-gold-400">
                  <Shapes className="h-3 w-3" />
                  Diagram
                </span>
              )}
            </span>
            {/* On a narrow screen the summary is removed when open, so the
                expanded panel does not sit under a band of dead space. */}
            <span
              className={`mt-1.5 text-sm leading-relaxed text-steel-400 ${
                open ? 'hidden sm:block' : 'block'
              }`}
            >
              <Highlight text={entry.summary} terms={terms} />
            </span>
          </span>

          <span
            className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-all duration-300 ${
              open
                ? 'rotate-180 border-glow-400/50 bg-glow-400/10 text-glow-300'
                : 'border-steel-700 text-steel-400'
            }`}
            aria-hidden
          >
            <ChevronDown className="h-4 w-4" />
          </span>
        </button>
      </h3>

      {/* The 0fr → 1fr grid trick animates to the content's natural height. */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-steel-700/60 px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
            {entry.keyPoints && entry.keyPoints.length > 0 && (
              <ul className="mb-5 space-y-2 rounded-xl border border-steel-700/60 bg-void-800/60 p-4">
                {entry.keyPoints.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-steel-300">
                    <span
                      className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-glow-400"
                      aria-hidden
                    />
                    <span>
                      <Highlight text={point} terms={terms} />
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Mounted only while open, so its controls stay out of the tab order. */}
            {open && entry.diagram && <Diagram name={entry.diagram} />}

            <div className="space-y-4">
              {entry.answer.map((paragraph, index) => (
                <p key={index} className="text-[0.94rem] leading-[1.75] text-steel-300 text-pretty">
                  <Highlight text={paragraph} terms={terms} />
                </p>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-steel-700/50 pt-4">
              {entry.tags.slice(0, 5).map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
              <button
                type="button"
                onClick={copyLink}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-steel-700 px-3 py-1.5 text-xs font-medium text-steel-400 transition-colors hover:border-steel-500 hover:text-steel-200"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-glow-400" /> : <Link2 className="h-3.5 w-3.5" />}
                {copied ? 'Link copied' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
