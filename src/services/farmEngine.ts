import {
  CROP_CATALOG,
  INITIAL_ZONES,
  STORAGE_KEY,
  WEATHER_CATALOG,
  WEATHER_CYCLE_ORDER,
  calculateLevelFromXp,
  createInitialPlots,
} from '../constants/farmConfig';
import {
  CropPlot,
  CropStage,
  CropType,
  FarmState,
  WeatherType,
} from '../types/farm';

export function createDefaultFarmState(now: number = Date.now()): FarmState {
  return {
    version: 1,
    coins: 95,
    xp: 30,
    level: 1,
    selectedCrop: CropType.CARROT,
    autoReplant: false,
    weather: WeatherType.SUNNY,
    weatherChangedAt: now,
    plots: createInitialPlots(now),
    zones: INITIAL_ZONES.map((z) => ({ ...z })),
    lastUpdatedAt: now,
    totalHarvested: 0,
  };
}

/**
 * Calcula o estágio atual (0 a 3) e o progresso percentual (0 a 100) de um canteiro
 * com base na diferença entre `now` e `plantedAt` + `wateredBonusMs`.
 */
export function getPlotGrowthInfo(
  plot: CropPlot,
  now: number = Date.now(),
  activeWeather: WeatherType = WeatherType.SUNNY
): {
  stage: CropStage;
  progressPercent: number;
  remainingSeconds: number;
  isReady: boolean;
} {
  if (!plot.cropType || plot.plantedAt === null) {
    return {
      stage: CropStage.PREPARED_SOIL,
      progressPercent: 0,
      remainingSeconds: 0,
      isReady: false,
    };
  }

  const meta = CROP_CATALOG[plot.cropType];
  const weatherMeta = WEATHER_CATALOG[activeWeather] || WEATHER_CATALOG[WeatherType.SUNNY];
  const totalDurationMs = meta.growDurationSec * 1000;
  const elapsedMs = Math.max(0, now - plot.plantedAt + (plot.wateredBonusMs || 0));
  const ratio = Math.min(1, elapsedMs / totalDurationMs);
  const progressPercent = Math.round(ratio * 100);

  const remainingEffectiveMs = Math.max(0, totalDurationMs - elapsedMs);
  const remainingRealSeconds = Math.max(
    0,
    Math.ceil(remainingEffectiveMs / 1000 / weatherMeta.growthSpeedMultiplier)
  );

  if (ratio >= 1) {
    return {
      stage: CropStage.READY,
      progressPercent: 100,
      remainingSeconds: 0,
      isReady: true,
    };
  }

  if (ratio >= 0.5) {
    return {
      stage: CropStage.GROWING,
      progressPercent,
      remainingSeconds: remainingRealSeconds,
      isReady: false,
    };
  }

  return {
    stage: CropStage.SEEDLING,
    progressPercent,
    remainingSeconds: remainingRealSeconds,
    isReady: false,
  };
}

/**
 * Configura os canteiros iniciais para exibir lado a lado as 3 culturas (Milho, Trigo, Cenoura)
 * no estágio de Muda (Estágio 1) e Planta Crescendo (Estágio 2), permitindo inspecionar e comparar
 * visualmente os modelos botânicos distintos e o balanço orgânico da brisa.
 */
export function setupSeedlingShowcase(
  state: FarmState,
  now: number = Date.now()
): FarmState {
  const showcaseCrops: Array<{ crop: CropType; ratio: number }> = [
    { crop: CropType.CORN, ratio: 0.12 },    // Muda de Milho (caule central + folhas longas pontiagudas)
    { crop: CropType.WHEAT, ratio: 0.12 },   // Muda de Trigo (vários brotos finos verticais)
    { crop: CropType.CARROT, ratio: 0.12 },  // Muda de Cenoura (folhas recortadas baixas em roseta)
    { crop: CropType.CORN, ratio: 0.58 },    // Milho Crescendo
    { crop: CropType.WHEAT, ratio: 0.58 },   // Trigo Crescendo
    { crop: CropType.CARROT, ratio: 0.58 },  // Cenoura Crescendo
  ];

  let coreIdx = 0;
  const updatedPlots = state.plots.map((plot) => {
    if (plot.zoneId === 'zone_core' && coreIdx < showcaseCrops.length) {
      const item = showcaseCrops[coreIdx++];
      const durationMs = CROP_CATALOG[item.crop].growDurationSec * 1000;
      return {
        ...plot,
        cropType: item.crop,
        plantedAt: now - Math.round(durationMs * item.ratio),
        wateredBonusMs: 0,
      };
    }
    return plot;
  });

  return {
    ...state,
    plots: updatedPlots,
    lastUpdatedAt: now,
  };
}

/**
 * Aplica o efeito do clima dinâmico e alterna automaticamente o ciclo climático.
 */
export function tickWeatherAndGrowth(
  state: FarmState,
  now: number = Date.now()
): {
  nextState: FarmState;
  weatherChangedTo: WeatherType | null;
} {
  const currentWeather = state.weather || WeatherType.SUNNY;
  const weatherMeta = WEATHER_CATALOG[currentWeather] || WEATHER_CATALOG[WeatherType.SUNNY];
  const dtMs = Math.max(0, now - (state.lastUpdatedAt || now));

  const extraBonusMs = Math.round(dtMs * Math.max(0, weatherMeta.growthSpeedMultiplier - 1));

  const unlockedZoneIds = new Set(
    state.zones.filter((z) => z.unlocked).map((z) => z.id)
  );

  const updatedPlots =
    extraBonusMs > 0
      ? state.plots.map((plot) => {
          if (!unlockedZoneIds.has(plot.zoneId) || !plot.cropType) {
            return plot;
          }
          return {
            ...plot,
            wateredBonusMs: (plot.wateredBonusMs || 0) + extraBonusMs,
          };
        })
      : state.plots;

  const weatherElapsedSec = (now - (state.weatherChangedAt || now)) / 1000;
  let nextWeather = currentWeather;
  let nextWeatherChangedAt = state.weatherChangedAt || now;
  let weatherChangedTo: WeatherType | null = null;

  if (weatherElapsedSec >= weatherMeta.durationSec) {
    const currentIdx = WEATHER_CYCLE_ORDER.indexOf(currentWeather);
    nextWeather = WEATHER_CYCLE_ORDER[(currentIdx + 1) % WEATHER_CYCLE_ORDER.length];
    nextWeatherChangedAt = now;
    weatherChangedTo = nextWeather;
  }

  return {
    nextState: {
      ...state,
      weather: nextWeather,
      weatherChangedAt: nextWeatherChangedAt,
      plots: updatedPlots,
      lastUpdatedAt: now,
    },
    weatherChangedTo,
  };
}

export function changeFarmWeather(
  state: FarmState,
  targetWeather: WeatherType,
  now: number = Date.now()
): FarmState {
  return {
    ...state,
    weather: targetWeather,
    weatherChangedAt: now,
    lastUpdatedAt: now,
  };
}

export function plantCropInPlot(
  state: FarmState,
  plotId: string,
  cropType: CropType,
  now: number = Date.now(),
  freeForTest: boolean = false
): { nextState: FarmState; planted: boolean; reason?: string } {
  const unlockedZoneIds = new Set(
    state.zones.filter((z) => z.unlocked).map((z) => z.id)
  );
  const targetPlot = state.plots.find((p) => p.id === plotId);

  if (!targetPlot || !unlockedZoneIds.has(targetPlot.zoneId)) {
    return { nextState: state, planted: false, reason: 'Terreno bloqueado' };
  }

  if (targetPlot.cropType !== null) {
    return { nextState: state, planted: false, reason: 'Canteiro já ocupado' };
  }

  const meta = CROP_CATALOG[cropType];
  const cost = freeForTest ? 0 : meta.seedCost;

  if (state.coins < cost) {
    return { nextState: state, planted: false, reason: 'Moedas insuficientes' };
  }

  const updatedPlots = state.plots.map((p) =>
    p.id === plotId
      ? {
          ...p,
          cropType,
          plantedAt: now,
          wateredBonusMs: 0,
        }
      : p
  );

  return {
    nextState: {
      ...state,
      coins: state.coins - cost,
      plots: updatedPlots,
      lastUpdatedAt: now,
    },
    planted: true,
  };
}

export function plantAllEmptyPlots(
  state: FarmState,
  cropType: CropType,
  now: number = Date.now(),
  freeForTest: boolean = false
): { nextState: FarmState; plantedCount: number } {
  const unlockedZoneIds = new Set(
    state.zones.filter((z) => z.unlocked).map((z) => z.id)
  );

  let currentCoins = state.coins;
  let plantedCount = 0;
  const seedCost = freeForTest ? 0 : CROP_CATALOG[cropType].seedCost;

  const updatedPlots = state.plots.map((plot) => {
    if (!unlockedZoneIds.has(plot.zoneId)) return plot;
    if (plot.cropType !== null) return plot;
    if (currentCoins < seedCost) return plot;

    currentCoins -= seedCost;
    plantedCount += 1;
    return {
      ...plot,
      cropType,
      plantedAt: now,
      wateredBonusMs: 0,
    };
  });

  if (plantedCount === 0) {
    return { nextState: state, plantedCount: 0 };
  }

  return {
    nextState: {
      ...state,
      coins: currentCoins,
      plots: updatedPlots,
      lastUpdatedAt: now,
    },
    plantedCount,
  };
}

export function harvestPlot(
  state: FarmState,
  plotId: string,
  now: number = Date.now()
): {
  nextState: FarmState;
  harvested: boolean;
  coinsEarned: number;
  xpEarned: number;
  leveledUp: boolean;
  cropHarvested: CropType | null;
} {
  const unlockedZoneIds = new Set(
    state.zones.filter((z) => z.unlocked).map((z) => z.id)
  );
  const plot = state.plots.find((p) => p.id === plotId);

  if (!plot || !unlockedZoneIds.has(plot.zoneId) || !plot.cropType) {
    return {
      nextState: state,
      harvested: false,
      coinsEarned: 0,
      xpEarned: 0,
      leveledUp: false,
      cropHarvested: null,
    };
  }

  const growth = getPlotGrowthInfo(plot, now, state.weather);
  if (!growth.isReady) {
    return {
      nextState: state,
      harvested: false,
      coinsEarned: 0,
      xpEarned: 0,
      leveledUp: false,
      cropHarvested: null,
    };
  }

  const meta = CROP_CATALOG[plot.cropType];
  const coinsEarned = meta.harvestCoins;
  const xpEarned = meta.harvestXp;
  const newXp = state.xp + xpEarned;
  const { level: newLevel } = calculateLevelFromXp(newXp);
  const leveledUp = newLevel > state.level;

  const updatedPlots = state.plots.map((p) => {
    if (p.id !== plotId) return p;
    if (state.autoReplant) {
      return {
        ...p,
        cropType: plot.cropType,
        plantedAt: now,
        wateredBonusMs: 0,
      };
    }
    return {
      ...p,
      cropType: null,
      plantedAt: null,
      wateredBonusMs: 0,
    };
  });

  return {
    nextState: {
      ...state,
      coins: state.coins + coinsEarned,
      xp: newXp,
      level: newLevel,
      plots: updatedPlots,
      lastUpdatedAt: now,
      totalHarvested: state.totalHarvested + 1,
    },
    harvested: true,
    coinsEarned,
    xpEarned,
    leveledUp,
    cropHarvested: plot.cropType,
  };
}

export function harvestAllReadyPlots(
  state: FarmState,
  now: number = Date.now()
): {
  nextState: FarmState;
  harvestedPlots: CropPlot[];
  totalCoinsEarned: number;
  totalXpEarned: number;
  leveledUp: boolean;
} {
  const unlockedZoneIds = new Set(
    state.zones.filter((z) => z.unlocked).map((z) => z.id)
  );

  const harvestedPlots: CropPlot[] = [];
  let totalCoinsEarned = 0;
  let totalXpEarned = 0;

  const updatedPlots = state.plots.map((plot) => {
    if (!unlockedZoneIds.has(plot.zoneId) || !plot.cropType) {
      return plot;
    }

    const growth = getPlotGrowthInfo(plot, now, state.weather);
    if (!growth.isReady) {
      return plot;
    }

    const meta = CROP_CATALOG[plot.cropType];
    harvestedPlots.push(plot);
    totalCoinsEarned += meta.harvestCoins;
    totalXpEarned += meta.harvestXp;

    if (state.autoReplant) {
      return {
        ...plot,
        cropType: plot.cropType,
        plantedAt: now,
        wateredBonusMs: 0,
      };
    }

    return {
      ...plot,
      cropType: null,
      plantedAt: null,
      wateredBonusMs: 0,
    };
  });

  if (harvestedPlots.length === 0) {
    return {
      nextState: state,
      harvestedPlots: [],
      totalCoinsEarned: 0,
      totalXpEarned: 0,
      leveledUp: false,
    };
  }

  const newXp = state.xp + totalXpEarned;
  const { level: newLevel } = calculateLevelFromXp(newXp);
  const leveledUp = newLevel > state.level;

  return {
    nextState: {
      ...state,
      coins: state.coins + totalCoinsEarned,
      xp: newXp,
      level: newLevel,
      plots: updatedPlots,
      lastUpdatedAt: now,
      totalHarvested: state.totalHarvested + harvestedPlots.length,
    },
    harvestedPlots,
    totalCoinsEarned,
    totalXpEarned,
    leveledUp,
  };
}

export function advanceCropsGrowth(
  state: FarmState,
  advanceSeconds: number,
  now: number = Date.now()
): FarmState {
  const bonusMs = advanceSeconds * 1000;
  const unlockedZoneIds = new Set(
    state.zones.filter((z) => z.unlocked).map((z) => z.id)
  );

  const updatedPlots = state.plots.map((plot) => {
    if (!unlockedZoneIds.has(plot.zoneId) || !plot.cropType) {
      return plot;
    }
    return {
      ...plot,
      wateredBonusMs: (plot.wateredBonusMs || 0) + bonusMs,
    };
  });

  return {
    ...state,
    plots: updatedPlots,
    lastUpdatedAt: now,
  };
}

export function addFarmCoins(
  state: FarmState,
  amount: number,
  xpBonus: number = 0,
  now: number = Date.now()
): FarmState {
  const newXp = state.xp + xpBonus;
  const { level: newLevel } = calculateLevelFromXp(newXp);

  return {
    ...state,
    coins: Math.max(0, state.coins + amount),
    xp: newXp,
    level: newLevel,
    lastUpdatedAt: now,
  };
}

export function unlockExpansionZone(
  state: FarmState,
  zoneId?: string,
  freeOverride: boolean = false,
  now: number = Date.now()
): {
  nextState: FarmState;
  unlockedZone: string | null;
  reason?: string;
} {
  const targetZone = zoneId
    ? state.zones.find((z) => z.id === zoneId && !z.unlocked)
    : state.zones.find((z) => !z.unlocked);

  if (!targetZone) {
    return {
      nextState: state,
      unlockedZone: null,
      reason: 'Todos os terrenos já foram desbloqueados!',
    };
  }

  const cost = freeOverride ? 0 : targetZone.cost;
  if (!freeOverride && state.coins < cost) {
    return {
      nextState: state,
      unlockedZone: null,
      reason: `Precisa de ${cost} moedas para liberar ${targetZone.name}.`,
    };
  }

  const updatedZones = state.zones.map((z) =>
    z.id === targetZone.id ? { ...z, unlocked: true } : z
  );

  const updatedPlots = state.plots.map((p) =>
    p.zoneId === targetZone.id && p.cropType !== null
      ? { ...p, plantedAt: now - 15000, wateredBonusMs: 0 }
      : p
  );

  const newXp = state.xp + 45;
  const { level: newLevel } = calculateLevelFromXp(newXp);

  return {
    nextState: {
      ...state,
      coins: state.coins - cost,
      xp: newXp,
      level: newLevel,
      zones: updatedZones,
      plots: updatedPlots,
      lastUpdatedAt: now,
    },
    unlockedZone: targetZone.name,
  };
}

export function loadFarmStateFromStorage(now: number = Date.now()): {
  state: FarmState;
  elapsedAwaySeconds: number;
  readyCountOnReturn: number;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createDefaultFarmState(now);
      return { state: initial, elapsedAwaySeconds: 0, readyCountOnReturn: 2 };
    }

    const parsed = JSON.parse(raw) as FarmState;
    if (!parsed || !Array.isArray(parsed.plots) || !Array.isArray(parsed.zones)) {
      const initial = createDefaultFarmState(now);
      return { state: initial, elapsedAwaySeconds: 0, readyCountOnReturn: 2 };
    }

    const activeWeather = parsed.weather || WeatherType.SUNNY;
    const weatherMeta = WEATHER_CATALOG[activeWeather] || WEATHER_CATALOG[WeatherType.SUNNY];
    const awayMs = Math.max(0, now - (parsed.lastUpdatedAt || now));
    const elapsedAwaySeconds = Math.floor(awayMs / 1000);

    const extraWeatherBonusMs = Math.round(
      awayMs * Math.max(0, weatherMeta.growthSpeedMultiplier - 1)
    );

    const unlockedZoneIds = new Set(
      parsed.zones.filter((z) => z.unlocked).map((z) => z.id)
    );

    const updatedPlots = parsed.plots.map((p) => {
      if (!unlockedZoneIds.has(p.zoneId) || !p.cropType) return p;
      return {
        ...p,
        wateredBonusMs: (p.wateredBonusMs || 0) + extraWeatherBonusMs,
      };
    });

    const readyCountOnReturn = updatedPlots.filter(
      (p) => unlockedZoneIds.has(p.zoneId) && getPlotGrowthInfo(p, now, activeWeather).isReady
    ).length;

    const { level } = calculateLevelFromXp(parsed.xp || 0);

    return {
      state: {
        ...parsed,
        weather: activeWeather,
        weatherChangedAt: parsed.weatherChangedAt || now,
        plots: updatedPlots,
        level,
        lastUpdatedAt: now,
      },
      elapsedAwaySeconds,
      readyCountOnReturn,
    };
  } catch {
    const initial = createDefaultFarmState(now);
    return { state: initial, elapsedAwaySeconds: 0, readyCountOnReturn: 2 };
  }
}

export function saveFarmStateToStorage(state: FarmState): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        lastUpdatedAt: Date.now(),
      })
    );
  } catch {
    // Ignore storage quota errors in restricted frames
  }
}
