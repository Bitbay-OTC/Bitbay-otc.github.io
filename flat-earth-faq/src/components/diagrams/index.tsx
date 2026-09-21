import type { DiagramKey } from '../../types';
import { HorizonEyeLevel } from './HorizonEyeLevel';
import { WaterLevel } from './WaterLevel';
import { SunPath } from './SunPath';
import { IceWallMap } from './IceWallMap';
import { EclipseOcclusion } from './EclipseOcclusion';

const registry: Record<DiagramKey, () => JSX.Element> = {
  horizon: HorizonEyeLevel,
  water: WaterLevel,
  sun: SunPath,
  icewall: IceWallMap,
  eclipse: EclipseOcclusion,
};

/** Renders the diagram registered for a FAQ entry, if it has one. */
export function Diagram({ name }: { name: DiagramKey }) {
  const Component = registry[name];
  return <Component />;
}

export { HorizonEyeLevel, WaterLevel, SunPath, IceWallMap, EclipseOcclusion };
