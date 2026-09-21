/** The five topics that ship with a custom interactive diagram. */
export type DiagramKey = 'horizon' | 'water' | 'sun' | 'icewall' | 'eclipse';

/** Icon names resolved to Lucide components in `src/lib/icons.ts`. */
export type IconName =
  | 'compass'
  | 'eye'
  | 'waves'
  | 'sun'
  | 'orbit'
  | 'map'
  | 'rocket'
  | 'radio'
  | 'scale'
  | 'sparkles';

export interface FaqCategory {
  /** Stable slug, used for filtering and as the section anchor. */
  id: string;
  label: string;
  /** One line describing what the group covers. */
  blurb: string;
  icon: IconName;
}

export interface FaqEntry {
  /** Stable slug, also the deep-link hash for this question. */
  id: string;
  /** Matches a `FaqCategory.id`. */
  category: string;
  question: string;
  /** A single-sentence takeaway rendered under the question when collapsed. */
  summary: string;
  /** Body copy, one string per paragraph. */
  answer: string[];
  /** Optional scannable bullets rendered above the body. */
  keyPoints?: string[];
  /** Renders the matching interactive diagram inside the expanded panel. */
  diagram?: DiagramKey;
  /** Extra words folded into the search index. */
  tags: string[];
}

export interface QuickTopic {
  faqId: string;
  title: string;
  teaser: string;
  icon: IconName;
  /** Drives the small accent treatment on the quick-jump card. */
  accent: 'gold' | 'glow';
}
