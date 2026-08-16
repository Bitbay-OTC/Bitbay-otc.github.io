# BitBay OTC Desk

A purpose-built trading interface for peer-to-peer OTC settlement between
USD, EUR and crypto.

Built from scratch as a vanilla TypeScript application — no UI framework.
It ships as static files and deploys to GitHub Pages unchanged.

```bash
npm install
npm run dev        # development server
npm run build      # typecheck + production build to dist/
npm run typecheck  # types only
```

Open <http://localhost:5173>. No wallet is required: the desk runs on
fixture data by default.

## Architecture

```
src/
  data/          domain — knows nothing about the DOM
    types.ts        settlement model (offers, deals, counterparties, balances)
    money.ts        minor-unit BigInt arithmetic
    status.ts       status vocabulary, colour bands, "whose move is it"
    adapter.ts      the DeskAdapter interface
    fixtureAdapter.ts   in-memory implementation
    chainAdapter.ts     escrow-contract implementation (unfinished — see below)
    fixtures.ts     deterministic sample data
    index.ts        adapter selection
  ui/            presentation — never talks to a backend directly
    dom.ts          h() element builder
    format.ts       display formatting
    components.ts   status chips, trust card, tables, empty/error states
    shell.ts        top bar, navigation rail, theme
    views/          desk, market, offer, deals, deal, balances
  styles/
    tokens.css      design tokens (light + dark)
    app.css         application styles
  router.ts      hash routing
  main.ts        entry point
```

The dependency rule is one-directional: `ui/` may import from `data/`,
never the reverse. Money arithmetic lives in `data/money.ts` precisely
because fixtures and adapters need it as much as views do.

### The adapter seam

Every view talks to a `DeskAdapter` and nothing else:

| Adapter | Status | Use |
| --- | --- | --- |
| `FixtureAdapter` | Complete | Development, design review, demos. Writes mutate in-memory state, so accepting an offer really does produce a deal that advances through settlement. |
| `ChainAdapter` | **Not implemented** | The wiring point for the BitBay double-deposit escrow contract. |

Select with `?data=chain` in the URL or `VITE_DESK_ADAPTER=chain` at build
time. The default is fixtures.

`ChainAdapter` throws `NOT_SUPPORTED` from every method rather than
returning plausible-looking data. A half-wired adapter that invents numbers
is worse than one that refuses, because the UI cannot tell the difference.

## Money

Every amount is a **minor-unit integer string** — cents for fiat, base
units for crypto — and all arithmetic goes through `data/money.ts` using
BigInt. No amount is ever parsed into a JS number; a float would silently
misprice an eight-decimal notional.

Fixtures follow the same rule: a deal's crypto leg and both escrow deposits
are *derived* from its fiat notional, rate and deposit percentage rather
than written by hand, and escrow balances are summed from the deals that
are actually open. Hand-written amounts drift from their own rate, which is
exactly the error a settlement screen must not contain.

## Settlement model

`DealStatus` is explicit about who owes the next action, because that is
the first question a desk operator asks:

| Status | Band | Next action |
| --- | --- | --- |
| `OPEN` | open | — |
| `ACCEPTED` | active | Escrow funding |
| `AWAITING_PAYMENT` | attention | Fiat sender sends payment |
| `PAYMENT_SENT` | attention | Fiat receiver confirms |
| `CRYPTO_RELEASED` | active | Final sign-off |
| `COMPLETE` | settled | — |
| `CANCELLED` / `EXPIRED` | closed | — |
| `DISPUTED` | danger | Review |

`nextAction(deal)` resolves this from the deal's direction and which side
you are on, and drives the dashboard queue, the deal banner and the rail
badge counts.

## What is not wired, and why

These are surfaced in the interface but have no source in the existing
escrow contract:

- **Rate, spread and fiat currency.** The contract stores a token and an
  amount; it has no concept of a fiat leg or a reference price.
- **Payment method and region.**
- **Counterparty trade count, completion rate, response time and
  verification tier.**

Serving them from chain needs a structured offer payload (JSON in the offer
message or its IPFS document) plus an indexer deriving counterparty
statistics from settled history. Until both exist, a chain adapter can
serve offers, deals, balances and the full settlement lifecycle, but must
report trust and spread fields as unknown. The model already permits that:
`alias` and `medianResponseMinutes` are nullable, and `riskFlags` carries
`NEW_COUNTERPARTY` when there is no history.

## Conventions

- **Theme** is driven by `data-theme` on `:root`, with a third "system"
  state that follows `prefers-color-scheme`.
- **Filters live in the URL.** A filtered market board is shareable and
  survives reload.
- **Text is set via `textContent`, never `innerHTML`** — the `h()` helper
  has no `html` escape hatch, so nothing a counterparty types can become
  markup.
- **Routing is hash-based** so deep links resolve on a static host with no
  rewrite rules.

## Deployment

`npm run build` emits `dist/`. Publish that directory to GitHub Pages.
`public/.nojekyll` is included so Jekyll does not process the output.

`vite.config.ts` sets `base: '/'`, correct for an organisation site served
from the domain root. For a project page, set `base` to `'/<repo>/'`; the
hash routes are unaffected.
