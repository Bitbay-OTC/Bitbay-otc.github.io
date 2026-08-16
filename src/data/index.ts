/**
 * Adapter selection.
 *
 * Defaults to fixtures. Switch with `?data=chain` in the URL, or by setting
 * VITE_DESK_ADAPTER at build time. Keeping the choice here means no view
 * ever imports a concrete adapter.
 */

import type { DeskAdapter } from './adapter';
import { FixtureAdapter } from './fixtureAdapter';
import { ChainAdapter } from './chainAdapter';

export type AdapterKind = 'fixture' | 'chain';

/** BitBay double-deposit escrow, as deployed for the existing client. */
const DDE_CONTRACT = '0x572d0Da3aF6cdCAcB07F6e76b068E1De232DDE92';

function resolveKind(): AdapterKind {
  const fromUrl = new URLSearchParams(window.location.search).get('data');
  if (fromUrl === 'chain' || fromUrl === 'fixture') return fromUrl;

  const fromEnv = import.meta.env['VITE_DESK_ADAPTER'];
  if (fromEnv === 'chain' || fromEnv === 'fixture') return fromEnv;

  return 'fixture';
}

let instance: DeskAdapter | null = null;
let kind: AdapterKind = 'fixture';

export function getAdapter(): DeskAdapter {
  if (!instance) {
    kind = resolveKind();
    instance =
      kind === 'chain'
        ? new ChainAdapter({ contractAddress: DDE_CONTRACT, networkLabel: 'Polygon' })
        : new FixtureAdapter();
  }
  return instance;
}

export function getAdapterKind(): AdapterKind {
  getAdapter();
  return kind;
}

export { AdapterError } from './adapter';
export type { DeskAdapter } from './adapter';
