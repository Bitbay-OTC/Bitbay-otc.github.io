import {
  Compass,
  Eye,
  Waves,
  Sun,
  Orbit,
  Map as MapIcon,
  Rocket,
  Radio,
  Scale,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { IconName } from '../types';

export const iconMap: Record<IconName, LucideIcon> = {
  compass: Compass,
  eye: Eye,
  waves: Waves,
  sun: Sun,
  orbit: Orbit,
  map: MapIcon,
  rocket: Rocket,
  radio: Radio,
  scale: Scale,
  sparkles: Sparkles,
};
