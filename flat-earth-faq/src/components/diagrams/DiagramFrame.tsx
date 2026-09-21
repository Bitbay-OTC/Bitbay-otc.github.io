import type { ReactNode } from 'react';

interface LegendItem {
  label: string;
  /** Any CSS colour; rendered as the swatch fill. */
  color: string;
  dashed?: boolean;
}

interface DiagramFrameProps {
  title: string;
  /** Sentence under the title explaining what the reader is looking at. */
  caption: string;
  /** Toggle and play buttons, rendered in the control bar. */
  controls?: ReactNode;
  /** Numeric readouts rendered to the right of the controls. */
  readout?: ReactNode;
  legend?: LegendItem[];
  /** A note about where the drawing departs from scale. */
  footnote?: string;
  children: ReactNode;
}

/**
 * Shared chrome for all five diagrams: a heading, a control bar, the drawing
 * surface and an optional legend, so the set reads as one system.
 */
export function DiagramFrame({
  title,
  caption,
  controls,
  readout,
  legend,
  footnote,
  children,
}: DiagramFrameProps) {
  return (
    <figure className="panel-inset my-6 overflow-hidden">
      <div className="border-b border-steel-700/60 px-4 py-3 sm:px-5">
        <h4 className="font-display text-sm font-semibold tracking-tight text-steel-200">{title}</h4>
        <p className="mt-1 text-xs leading-relaxed text-steel-400">{caption}</p>
      </div>

      {(controls || readout) && (
        <div className="flex flex-col gap-3 border-b border-steel-700/60 bg-void-900/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          {controls && <div className="flex flex-wrap items-center gap-2">{controls}</div>}
          {readout && <div className="flex flex-wrap items-center gap-x-5 gap-y-2">{readout}</div>}
        </div>
      )}

      <div className="bg-void-900/60 bg-grid-faint bg-grid p-3 sm:p-4">{children}</div>

      {(legend || footnote) && (
        <figcaption className="flex flex-col gap-2 border-t border-steel-700/60 px-4 py-3 sm:px-5">
          {legend && (
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {legend.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-[0.7rem] text-steel-400">
                  {item.dashed ? (
                    <span
                      className="h-0 w-4 border-t-2 border-dashed"
                      style={{ borderColor: item.color }}
                      aria-hidden
                    />
                  ) : (
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden
                    />
                  )}
                  {item.label}
                </li>
              ))}
            </ul>
          )}
          {footnote && <p className="text-[0.68rem] italic text-steel-500">{footnote}</p>}
        </figcaption>
      )}
    </figure>
  );
}

/** A labelled number in the control bar. */
export function Readout({
  label,
  value,
  accent = 'steel',
}: {
  label: string;
  value: string;
  accent?: 'steel' | 'gold' | 'glow';
}) {
  const tone =
    accent === 'gold' ? 'text-gold-400' : accent === 'glow' ? 'text-glow-300' : 'text-steel-200';
  return (
    <div className="leading-tight">
      <div className="text-[0.62rem] uppercase tracking-[0.16em] text-steel-500">{label}</div>
      <div className={`font-mono text-sm font-semibold ${tone}`}>{value}</div>
    </div>
  );
}
