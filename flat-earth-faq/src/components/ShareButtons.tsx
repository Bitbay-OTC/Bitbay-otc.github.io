import { useState } from 'react';
import { Link2, Check, Mail, MessageCircle, Share2 } from 'lucide-react';

const SHARE_TEXT = 'Flat Earth FAQ — the model explained on its own terms, with interactive diagrams.';

export function ShareButtons() {
  const [copied, setCopied] = useState(false);

  const currentUrl = () => (typeof window === 'undefined' ? '' : window.location.href);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard permission can be refused; nothing else to do here.
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({ title: 'Flat Earth FAQ', text: SHARE_TEXT, url: currentUrl() });
    } catch {
      // The user dismissed the sheet.
    }
  };

  const links = [
    {
      label: 'Share on X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(currentUrl())}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      label: 'Share on Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl())}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94z" />
        </svg>
      ),
    },
    {
      label: 'Share on Reddit',
      href: `https://www.reddit.com/submit?url=${encodeURIComponent(currentUrl())}&title=${encodeURIComponent('Flat Earth FAQ')}`,
      icon: <MessageCircle className="h-4 w-4" strokeWidth={1.9} />,
    },
    {
      label: 'Share by email',
      href: `mailto:?subject=${encodeURIComponent('Flat Earth FAQ')}&body=${encodeURIComponent(`${SHARE_TEXT}\n\n${currentUrl()}`)}`,
      icon: <Mail className="h-4 w-4" strokeWidth={1.9} />,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          title={link.label}
          aria-label={link.label}
          className="grid h-9 w-9 place-items-center rounded-lg border border-steel-700 bg-void-700/60 text-steel-400 transition-all hover:-translate-y-0.5 hover:border-glow-400/50 hover:text-glow-300"
        >
          {link.icon}
        </a>
      ))}

      <button
        type="button"
        onClick={copy}
        title="Copy link"
        aria-label="Copy link to this page"
        className="grid h-9 w-9 place-items-center rounded-lg border border-steel-700 bg-void-700/60 text-steel-400 transition-all hover:-translate-y-0.5 hover:border-glow-400/50 hover:text-glow-300"
      >
        {copied ? <Check className="h-4 w-4 text-glow-400" /> : <Link2 className="h-4 w-4" strokeWidth={1.9} />}
      </button>

      <button
        type="button"
        onClick={nativeShare}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-steel-700 bg-void-700/60 px-3 text-xs font-semibold text-steel-300 transition-all hover:-translate-y-0.5 hover:border-glow-400/50 hover:text-glow-300 sm:hidden"
      >
        <Share2 className="h-4 w-4" strokeWidth={1.9} />
        Share
      </button>
    </div>
  );
}
