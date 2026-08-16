/**
 * Application entry point.
 *
 * Wires the router to the shell and dispatches views. Views are async and
 * own their own loading/error states, so the router never blocks.
 */

import './styles/tokens.css';
import './styles/app.css';

import { h, render } from './ui/dom';
import { Shell, viewHead } from './ui/shell';
import { emptyState } from './ui/components';
import { router } from './router';
import { getAdapter } from './data';
import { awaitsYou, STATUS_META } from './data/status';
import { dashboardView, balancesView } from './ui/views/dashboard';
import { marketView } from './ui/views/market';
import { openOfferDrawer, closeDrawer } from './ui/views/offer';
import { dealsView, historyView } from './ui/views/deals';
import { dealView } from './ui/views/deal';

const root = document.getElementById('app');
if (!root) throw new Error('#app host element is missing');

const shell = new Shell(root);
const adapter = getAdapter();

shell.setConnection(adapter.getConnection());
adapter.onConnectionChange((state) => shell.setConnection(state));

/** Keep the rail's badge counts in step with settlement state. */
async function refreshCounts(): Promise<void> {
  try {
    const deals = await adapter.listDeals();
    const active = deals.filter((d) => !STATUS_META[d.status].terminal);
    const queue = deals.filter(awaitsYou);
    shell.setCount('deals', active.length);
    shell.setCount('dashboard', queue.length, true);
  } catch {
    // Counts are advisory; a failure here must not blank the rail.
    shell.setCount('deals', null);
    shell.setCount('dashboard', null);
  }
}

/**
 * The offer drawer is a modal layered over the market board. Track whether
 * one is open so route changes can dismiss it rather than stacking.
 */
let drawerOpen = false;

router.start((route) => {
  shell.setActive(route.name);

  if (drawerOpen && route.name !== 'offer') {
    closeDrawer(false);
    drawerOpen = false;
  }

  switch (route.name) {
    case 'dashboard':
      void dashboardView(shell.outlet).then(refreshCounts);
      break;

    case 'market':
      void marketView(shell.outlet, route.query);
      break;

    case 'offer': {
      const offerId = route.params['offerId']!;
      // Render the board underneath, then layer the drawer on top.
      void marketView(shell.outlet, new URLSearchParams()).then(() => {
        drawerOpen = true;
        return openOfferDrawer(offerId);
      });
      break;
    }

    case 'deals':
      void dealsView(shell.outlet).then(refreshCounts);
      break;

    case 'deal':
      void dealView(shell.outlet, route.params['dealId']!).then(refreshCounts);
      break;

    case 'history':
      void historyView(shell.outlet);
      break;

    case 'balances':
      void balancesView(shell.outlet);
      break;

    default:
      render(
        shell.outlet,
        viewHead('Not found'),
        emptyState(
          'That page does not exist',
          'The link may be out of date. Return to the desk to continue.',
          h('button', {
            class: 'btn btn--primary',
            type: 'button',
            text: 'Go to desk',
            on: { click: () => router.go('/') },
          }),
        ),
      );
  }
});

void refreshCounts();
