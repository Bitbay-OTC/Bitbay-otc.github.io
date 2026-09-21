import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      setVisible(window.scrollY > 700);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const circumference = 2 * Math.PI * 20;

  return (
    <>
      {/* Reading progress along the very top of the viewport. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5" aria-hidden>
        <div
          className="h-full bg-gradient-to-r from-glow-400 to-gold-500 transition-[width] duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        className={`fixed bottom-5 right-5 z-50 grid h-12 w-12 place-items-center rounded-full border border-steel-700 bg-void-800/90 text-steel-300 backdrop-blur transition-all duration-300 hover:border-glow-400/60 hover:text-glow-300 ${
          visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
          <circle cx="24" cy="24" r="20" fill="none" stroke="#1b2540" strokeWidth="2" />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="#38e0ff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>
        <ArrowUp className="relative h-4 w-4" strokeWidth={2.2} />
      </button>
    </>
  );
}
