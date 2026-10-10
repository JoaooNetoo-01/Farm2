export enum CropType {
  CORN = 'corn',
  WHEAT = 'wheat',
  CARROT = 'carrot',
}

export enum CropStage {
  PREPARED_SOIL = 0, // Terra preparada
  SEEDLING = 1,      // Muda
  GROWING = 2,       // Planta crescendo
  READY = 3,         // Colheita pronta
}

export interface CropMetadata {
  id: CropType;
  name: string;
  growDurationSec: number; // Tempo total até colheita pronta
  seedCost: number;
  harvestCoins: number;
  harvestXp: number;
  colorAccent: string;
  description: string;
}

export interface CropPlot {
  id: string;
  gridX: number;
  gridY: number;
  zoneId: string;
  cropType: CropType | null;
  plantedAt: number | null; // Timestamp (ms) de quando foi plantado
  wateredBonusMs: number;   // Bônus de tempo acumulado (ex: avanço de tempo de teste ou chuva)
}

export interface ExpansionZone {
  id: string;
  name: string;
  subtitle: string;
  unlocked: boolean;
  cost: number;
  requiredLevel: number;
  badgeLabel: string;
  centerGridX: number;
  centerGridY: number;
  plotsCount: number;
  decorDescription: string;
}

export interface ChickenEntity {
  id: string;
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  facingLeft: boolean;
  state: 'walking' | 'idle' | 'pecking' | 'looking';
  stateTimer: number;
  stateDuration: number;
  walkDistance: number;
  seedOffset: number;
  featherColor: 'white' | 'amber';
}

export interface FloatingFeedback {
  id: string;
  gridX: number;
  gridY: number;
  text: string;
  subtext?: string;
  color: 'amber' | 'emerald' | 'sky';
  createdAt: number;
}

export enum WeatherType {
  SUNNY = 'sunny',
  BREEZY = 'breezy',
  RAIN = 'rain',
}

export interface WeatherMetadata {
  id: WeatherType;
  name: string;
  subtitle: string;
  growthSpeedMultiplier: number; // ex: 1.0 (normal), 1.35 (sol radiante), 1.85 (chuva fértil)
  durationSec: number;
  badgeText: string;
}

export interface ActivityEvent {
  id: string;
  message: string;
  timestamp: number;
  type: 'harvest' | 'plant' | 'expand' | 'level' | 'offline' | 'weather';
}

export interface FarmState {
  version: number;
  coins: number;
  xp: number;
  level: number;
  selectedCrop: CropType;
  autoReplant: boolean;
  weather: WeatherType;
  weatherChangedAt: number;
  plots: CropPlot[];
  zones: ExpansionZone[];
  lastUpdatedAt: number;
  totalHarvested: number;
}
