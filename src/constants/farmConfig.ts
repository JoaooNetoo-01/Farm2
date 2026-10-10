import {
  CropMetadata,
  CropPlot,
  CropType,
  ExpansionZone,
  WeatherMetadata,
  WeatherType,
} from '../types/farm';

export const STORAGE_KEY = 'fazenda_da_galera_save_v1';

export const WEATHER_CYCLE_ORDER: WeatherType[] = [
  WeatherType.SUNNY,
  WeatherType.BREEZY,
  WeatherType.RAIN,
];

export const WEATHER_CATALOG: Record<WeatherType, WeatherMetadata> = {
  [WeatherType.SUNNY]: {
    id: WeatherType.SUNNY,
    name: 'Sol Radiante',
    subtitle: 'Fotossíntese acelerada (+35% velocidade de cultivo)',
    growthSpeedMultiplier: 1.35,
    durationSec: 45,
    badgeText: '+35% Cultivo',
  },
  [WeatherType.BREEZY]: {
    id: WeatherType.BREEZY,
    name: 'Brisa Amena',
    subtitle: 'Clima fresco de campo (+15% velocidade de cultivo)',
    growthSpeedMultiplier: 1.15,
    durationSec: 40,
    badgeText: '+15% Cultivo',
  },
  [WeatherType.RAIN]: {
    id: WeatherType.RAIN,
    name: 'Chuva Fértil',
    subtitle: 'Irrigação natural constante (+85% velocidade de cultivo)',
    growthSpeedMultiplier: 1.85,
    durationSec: 40,
    badgeText: '+85% Cultivo',
  },
};

export const CROP_CATALOG: Record<CropType, CropMetadata> = {
  [CropType.CARROT]: {
    id: CropType.CARROT,
    name: 'Cenoura',
    growDurationSec: 24, // 8s por etapa (Muda -> Crescendo -> Pronta)
    seedCost: 5,
    harvestCoins: 18,
    harvestXp: 12,
    colorAccent: '#F97316',
    description: 'Crescimento rápido, ideal para manter a galera engajada.',
  },
  [CropType.WHEAT]: {
    id: CropType.WHEAT,
    name: 'Trigo Dourado',
    growDurationSec: 36, // 12s por etapa
    seedCost: 10,
    harvestCoins: 32,
    harvestXp: 22,
    colorAccent: '#EAB308',
    description: 'Equilíbrio certeiro entre tempo de cultivo e moedas.',
  },
  [CropType.CORN]: {
    id: CropType.CORN,
    name: 'Milho Doce',
    growDurationSec: 48, // 16s por etapa
    seedCost: 16,
    harvestCoins: 52,
    harvestXp: 35,
    colorAccent: '#F59E0B',
    description: 'Espigas valiosas que rendem alto retorno na colheita.',
  },
};

export const STAGE_LABELS: Record<number, string> = {
  0: 'Terra preparada',
  1: 'Muda brotando',
  2: 'Planta crescendo',
  3: 'Colheita pronta',
};

export const INITIAL_ZONES: ExpansionZone[] = [
  {
    id: 'zone_core',
    name: 'Sede da Fazenda',
    subtitle: 'Celeiro central e horta principal',
    unlocked: true,
    cost: 0,
    requiredLevel: 1,
    badgeLabel: 'Inicial',
    centerGridX: 3.5,
    centerGridY: 3.5,
    plotsCount: 6,
    decorDescription: 'Celeiro vermelho, cercas de madeira e 6 canteiros férteis.',
  },
  {
    id: 'zone_east',
    name: 'Pomar do Sol',
    subtitle: 'Expansão Leste (+4 canteiros e macieiras)',
    unlocked: false,
    cost: 120,
    requiredLevel: 1,
    badgeLabel: 'Terreno Leste',
    centerGridX: 6.5,
    centerGridY: 3.5,
    plotsCount: 4,
    decorDescription: 'Adiciona 4 canteiros de solo rico e árvores frutíferas.',
  },
  {
    id: 'zone_south',
    name: 'Vale dos Ventos',
    subtitle: 'Expansão Sul (+6 canteiros e lagoa)',
    unlocked: false,
    cost: 240,
    requiredLevel: 2,
    badgeLabel: 'Terreno Sul',
    centerGridX: 3.5,
    centerGridY: 6.6,
    plotsCount: 6,
    decorDescription: 'Adiciona 6 novos canteiros irrigados e uma lagoa cristalina.',
  },
  {
    id: 'zone_southeast',
    name: 'Colina Dourada',
    subtitle: 'Expansão Sudeste (+4 canteiros e moinho)',
    unlocked: false,
    cost: 420,
    requiredLevel: 3,
    badgeLabel: 'Terreno Sudeste',
    centerGridX: 6.5,
    centerGridY: 6.6,
    plotsCount: 4,
    decorDescription: 'Completa a grande fazenda com moinho de vento e 4 canteiros.',
  },
];

export function createInitialPlots(now: number = Date.now()): CropPlot[] {
  return [
    // Zona Inicial (zone_core): 6 canteiros em 2 colunas x 3 linhas (X: 2..3, Y: 2..4)
    // Começamos com as 3 culturas já demonstrando diferentes estágios para encantar de imediato
    {
      id: 'plot_core_1',
      gridX: 2,
      gridY: 2,
      zoneId: 'zone_core',
      cropType: CropType.CORN,
      plantedAt: now - 49 * 1000, // Já pronta para colher!
      wateredBonusMs: 0,
    },
    {
      id: 'plot_core_2',
      gridX: 3,
      gridY: 2,
      zoneId: 'zone_core',
      cropType: CropType.WHEAT,
      plantedAt: now - 26 * 1000, // Planta crescendo (estágio 2)
      wateredBonusMs: 0,
    },
    {
      id: 'plot_core_3',
      gridX: 2,
      gridY: 3,
      zoneId: 'zone_core',
      cropType: CropType.CARROT,
      plantedAt: now - 9 * 1000, // Muda (estágio 1)
      wateredBonusMs: 0,
    },
    {
      id: 'plot_core_4',
      gridX: 3,
      gridY: 3,
      zoneId: 'zone_core',
      cropType: CropType.CARROT,
      plantedAt: now - 25 * 1000, // Pronta para colher!
      wateredBonusMs: 0,
    },
    {
      id: 'plot_core_5',
      gridX: 2,
      gridY: 4,
      zoneId: 'zone_core',
      cropType: CropType.WHEAT,
      plantedAt: now - 10 * 1000, // Muda
      wateredBonusMs: 0,
    },
    {
      id: 'plot_core_6',
      gridX: 3,
      gridY: 4,
      zoneId: 'zone_core',
      cropType: null, // Terra preparada vazia para mostrar visualmente o estágio 0
      plantedAt: null,
      wateredBonusMs: 0,
    },

    // Zona Leste (zone_east): 4 canteiros (X: 6..7, Y: 2..3)
    {
      id: 'plot_east_1',
      gridX: 6,
      gridY: 2,
      zoneId: 'zone_east',
      cropType: CropType.CORN,
      plantedAt: now,
      wateredBonusMs: 0,
    },
    {
      id: 'plot_east_2',
      gridX: 7,
      gridY: 2,
      zoneId: 'zone_east',
      cropType: CropType.CARROT,
      plantedAt: now,
      wateredBonusMs: 0,
    },
    {
      id: 'plot_east_3',
      gridX: 6,
      gridY: 3,
      zoneId: 'zone_east',
      cropType: null,
      plantedAt: null,
      wateredBonusMs: 0,
    },
    {
      id: 'plot_east_4',
      gridX: 7,
      gridY: 3,
      zoneId: 'zone_east',
      cropType: null,
      plantedAt: null,
      wateredBonusMs: 0,
    },

    // Zona Sul (zone_south): 6 canteiros (X: 1..3, Y: 6..7)
    {
      id: 'plot_south_1',
      gridX: 1,
      gridY: 6,
      zoneId: 'zone_south',
      cropType: CropType.WHEAT,
      plantedAt: now,
      wateredBonusMs: 0,
    },
    {
      id: 'plot_south_2',
      gridX: 2,
      gridY: 6,
      zoneId: 'zone_south',
      cropType: CropType.WHEAT,
      plantedAt: now,
      wateredBonusMs: 0,
    },
    {
      id: 'plot_south_3',
      gridX: 3,
      gridY: 6,
      zoneId: 'zone_south',
      cropType: null,
      plantedAt: null,
      wateredBonusMs: 0,
    },
    {
      id: 'plot_south_4',
      gridX: 1,
      gridY: 7,
      zoneId: 'zone_south',
      cropType: null,
      plantedAt: null,
      wateredBonusMs: 0,
    },
    {
      id: 'plot_south_5',
      gridX: 2,
      gridY: 7,
      zoneId: 'zone_south',
      cropType: null,
      plantedAt: null,
      wateredBonusMs: 0,
    },
    {
      id: 'plot_south_6',
      gridX: 3,
      gridY: 7,
      zoneId: 'zone_south',
      cropType: null,
      plantedAt: null,
      wateredBonusMs: 0,
    },

    // Zona Sudeste (zone_southeast): 4 canteiros (X: 6..7, Y: 6..7)
    {
      id: 'plot_se_1',
      gridX: 6,
      gridY: 6,
      zoneId: 'zone_southeast',
      cropType: CropType.CORN,
      plantedAt: now,
      wateredBonusMs: 0,
    },
    {
      id: 'plot_se_2',
      gridX: 7,
      gridY: 6,
      zoneId: 'zone_southeast',
      cropType: CropType.CORN,
      plantedAt: now,
      wateredBonusMs: 0,
    },
    {
      id: 'plot_se_3',
      gridX: 6,
      gridY: 7,
      zoneId: 'zone_southeast',
      cropType: null,
      plantedAt: null,
      wateredBonusMs: 0,
    },
    {
      id: 'plot_se_4',
      gridX: 7,
      gridY: 7,
      zoneId: 'zone_southeast',
      cropType: null,
      plantedAt: null,
      wateredBonusMs: 0,
    },
  ];
}

export function getXpForNextLevel(level: number): number {
  return level * 100;
}

export function calculateLevelFromXp(totalXp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  let level = 1;
  let remainingXp = totalXp;

  while (remainingXp >= getXpForNextLevel(level)) {
    remainingXp -= getXpForNextLevel(level);
    level += 1;
  }

  const nextLevelXp = getXpForNextLevel(level);
  const progressPercent = Math.min(100, Math.round((remainingXp / nextLevelXp) * 100));

  return {
    level,
    currentLevelXp: remainingXp,
    nextLevelXp,
    progressPercent,
  };
}
