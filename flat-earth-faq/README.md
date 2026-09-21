# Flat Earth FAQ

An interactive, diagram-driven FAQ that presents the flat earth model on its own terms.
Built with React 18, Vite, Tailwind CSS and Lucide icons.

## Run it

```bash
cd flat-earth-faq
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # typecheck, then emit a static bundle into dist/
npm run preview    # serve the built bundle
npm run typecheck  # tsc --noEmit on its own
```

`dist/` is a plain static bundle. `vite.config.ts` sets `base: './'`, so it works
served from a domain root, from a subpath, or opened straight off disk.

This project is self-contained and does not touch the OTC desk app at the repository
root, which has its own `package.json` and its own Pages workflow.

## What is in here

```
flat-earth-faq/
├── index.html                 Document shell, fonts, favicon
├── tailwind.config.js         Theme: deep-space palette, fonts, keyframes
├── postcss.config.js
├── vite.config.ts
└── src/
    ├── main.tsx               React root
    ├── App.tsx                Page composition, search/filter/open state
    ├── index.css              Tailwind layers and shared component classes
    ├── types.ts               FaqEntry, FaqCategory, QuickTopic, DiagramKey
    ├── data/
    │   └── faqs.ts            All 71 questions, grouped into 8 sections
    ├── lib/
    │   ├── icons.ts           Icon-name → Lucide component map
    │   ├── search.ts          Term filtering and relevance ranking
    │   ├── useAnimationFrame.ts
    │   └── useReducedMotion.ts
    └── components/
        ├── Navbar.tsx         Sticky header + mobile drawer
        ├── Hero.tsx           Headline and quick-jump cards
        ├── SearchBar.tsx      Filter field, "/" shortcut
        ├── FaqList.tsx        Section rail, grouping, empty state
        ├── FaqItem.tsx        Accordion row, deep links, copy link
        ├── Highlight.tsx      Search-term highlighting
        ├── Footer.tsx         Disclaimer, nav columns, share row
        ├── ShareButtons.tsx
        ├── BackToTop.tsx      Reading progress + scroll button
        ├── StarField.tsx
        └── diagrams/
            ├── DiagramFrame.tsx     Shared chrome for all five
            ├── HorizonEyeLevel.tsx  Altitude slider, flat/globe/compare
            ├── WaterLevel.tsx       Side-by-side laser test and basin fill
            ├── SunPath.tsx          Top-down disc, seasons, year spiral
            ├── IceWallMap.tsx       Azimuthal equidistant map, layer toggles
            ├── EclipseOcclusion.tsx Solar, lunar and selenelion views
            └── index.tsx            Diagram registry
```

## Editing the content

Everything readable lives in `src/data/faqs.ts`. Each entry is:

```ts
{
  id: 'ice-wall',            // also the deep-link hash: /#ice-wall
  category: 'maps',          // must match a FaqCategory id
  question: '…',
  summary: '…',              // one line, shown while collapsed
  keyPoints: ['…'],          // optional bullets above the body
  answer: ['…', '…'],        // one string per paragraph
  diagram: 'icewall',        // optional, one of the five DiagramKeys
  tags: ['ice wall', '…'],   // folded into the search index
}
```

Add a section by appending to `categories`, then using its `id` on entries.
Change the five cards on the landing page by editing `quickTopics`.

## Adding a diagram

1. Write a component in `src/components/diagrams/` that renders a `<DiagramFrame>`.
2. Add its key to `DiagramKey` in `src/types.ts`.
3. Register it in `src/components/diagrams/index.tsx`.
4. Set `diagram: '<key>'` on the FAQ entry.

`DiagramFrame` supplies the heading, control bar, drawing surface, legend and
footnote, so a new diagram matches the existing set without extra styling.

## Notes on behaviour

- **Accordions** animate with a `grid-template-rows: 0fr → 1fr` transition, so
  they ease to the content's real height without measuring it in JavaScript.
- **Diagrams mount only while their panel is open**, which keeps their sliders
  and buttons out of the tab order when collapsed.
- **Reduced motion** is respected: animated diagrams start paused and CSS
  animations are cut when `prefers-reduced-motion: reduce` is set.
- **Deep links** work both ways. Loading `/#eclipses` opens and scrolls to that
  question, and each panel has a copy-link button.
- **Search** requires every term to appear somewhere in an entry, then ranks
  matches in the question and tags above matches in the body.

## Disclaimer

The site presents the flat earth model's own arguments in its own voice. Those
conclusions contradict the scientific consensus in astronomy, physics and geodesy,
and nothing in the content has been independently verified here. The full note is
rendered on the page under **Disclaimer**, and the text lives in
`src/components/Footer.tsx`.

The diagrams illustrate what each argument asserts. They are schematics of a claim
rather than measurements, and each states where it departs from scale.
