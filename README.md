# BitBay OTC Desk — frontend

A purpose-built OTC trading interface for peer-to-peer fiat ↔ crypto settlement,
running on the existing BitBay double-deposit escrow contracts.

This repository contains a **frontend skin only**. The application logic, the
Solidity contract ABIs (`DDEABI.js`, `ERC20.js`), the web3 wiring, the IPFS
document flow, escrow state transitions and every business rule are carried over
from the upstream BitBay Markets client unchanged.

## Layout

```
index.html            Application shell + all application logic (unchanged from upstream)
assets/otc-desk.css   The design system — this is the redesign
*.js, *.png, *.css    Vendored upstream runtime assets (web3, sweetalert2, fonts, icons…)
```

The upstream client kept its entire stylesheet in a ~3,000-line inline `<style>`
block. That block was removed and replaced with a single linked stylesheet,
`assets/otc-desk.css`. No other structural change was made to the runtime.

## Design system

`assets/otc-desk.css` is organised in twelve numbered sections — tokens, base,
app shell, market board, deal book, account, reference, dialogs, status/trust,
loaders, responsive, accessibility.

Theming is driven entirely by CSS custom properties with a light and a dark
palette. Both are defined up front; the dark palette is applied via
`body[data-theme="dark"]`.

> **Do not theme off a class on `<body>`.** The theme toggle calls
> `body.removeAttribute("class")`, which wipes any class applied to the body
> element. `data-theme` is the only durable hook.

### Settlement status

The escrow contract exposes a status pair (`status[0],status[1]`). The upstream
client mapped those pairs to English descriptions in `combinedStatusDescriptions`.
The desk adds `deskStatusMap`, which re-expresses the *same* pairs in settlement
language and assigns each a colour band:

| Contract state                          | Desk label                    | Band      |
| --------------------------------------- | ----------------------------- | --------- |
| Offer / Public Offer / Private Offer     | Open offer / Private offer    | open      |
| Mutually Accepted                        | In settlement                 | pending   |
| Completed by one party, awaiting closure | Awaiting counterparty release | pending   |
| Cancelled by one party, awaiting closure | Cancellation pending          | pending   |
| Fully Completed                          | Settlement complete           | settled   |
| Mutually Agreed Cancellation             | Cancelled by agreement        | cancelled |
| Expired and Closed                       | Expired and closed            | cancelled |

No status is invented. An unrecognised pair falls back to the upstream
description text rather than guessing.

## Constraints this redesign respected

- No backend, contract, ABI, RPC or authentication change.
- No route, form, action or handler removed or renamed.
- Every existing market category (Goods, Services, Barter) is still reachable;
  the OTC and currency filters were **added** alongside them and drive the same
  `changeSearchText` → `searchListings` path.
- UI copy is translated by `t-id`, so rewording the English source is safe —
  non-English lookups still resolve by id.

## Known behavioural notes

- `centerPopup()` positions dialogs imperatively with px `top`/`left`. The
  `.swal2-popup` rule therefore **must** keep `position: fixed` and the
  neutralised `transform`/`animation`. This is a contract, not decoration.
- Deal rows compute a change hash from their own generated markup
  (`keccak256(li.innerHTML)`). Adding the status chip changes that hash once, so
  existing users see a single "updated" notification per open deal on first load
  after deploy. Subsequent diffs behave normally — and now correctly reflect
  status transitions, which previously did not alter the row markup.

## Running locally

```
python3 -m http.server 8000
```

Then open <http://localhost:8000>. A web3 wallet is required for the market
board, offers and settlements to populate; without one the desk renders its
connect-wallet states.
