import { useCallback, useEffect, useState } from 'react';
import { FarmHUD } from './components/FarmHUD';
import { IsometricFarmCanvas } from './components/IsometricFarmCanvas';
import { CROP_CATALOG, WEATHER_CATALOG } from './constants/farmConfig';
import {
  addFarmCoins,
  advanceCropsGrowth,
  changeFarmWeather,
  createDefaultFarmState,
  getPlotGrowthInfo,
  harvestAllReadyPlots,
  harvestPlot,
  loadFarmStateFromStorage,
  plantAllEmptyPlots,
  plantCropInPlot,
  saveFarmStateToStorage,
  setupSeedlingShowcase,
  tickWeatherAndGrowth,
  unlockExpansionZone,
} from './services/farmEngine';
import { soundFX } from './services/soundEffects';
import {
  ActivityEvent,
  CropPlot,
  CropType,
  FarmState,
  FloatingFeedback,
  WeatherType,
} from './types/farm';

export default function App() {
  const [farmState, setFarmState] = useState<FarmState>(() => {
    const loaded = loadFarmStateFromStorage(Date.now());
    return loaded.state;
  });

  const [now, setNow] = useState<number>(() => Date.now());
  const [showTestPanel, setShowTestPanel] = useState<boolean>(true);
  const [isVerticalPreview, setIsVerticalPreview] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [floatingFeedbacks, setFloatingFeedbacks] = useState<FloatingFeedback[]>([]);
  const [recentEvents, setRecentEvents] = useState<ActivityEvent[]>([
    {
      id: 'init_evt',
      message: 'Fazenda da Galera pronta! O clima dinâmico acelera suas plantações.',
      timestamp: Date.now(),
      type: 'weather',
    },
  ]);
  const [offlineBanner, setOfflineBanner] = useState<{
    seconds: number;
    readyCount: number;
  } | null>(null);

  const pushEvent = useCallback((message: string, type: ActivityEvent['type']) => {
    setRecentEvents((prev) => [
      {
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        message,
        timestamp: Date.now(),
        type,
      },
      ...prev.slice(0, 7),
    ]);
  }, []);

  const spawnFloatingFeedback = useCallback(
    (gridX: number, gridY: number, text: string, color: FloatingFeedback['color'] = 'amber') => {
      const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setFloatingFeedbacks((prev) => [
        ...prev,
        { id, gridX, gridY, text, color, createdAt: Date.now() },
      ]);
      setTimeout(() => {
        setFloatingFeedbacks((prev) => prev.filter((item) => item.id !== id));
      }, 1350);
    },
    []
  );

  // Verifica se houve tempo offline ao abrir o app pela primeira vez
  useEffect(() => {
    const loaded = loadFarmStateFromStorage(Date.now());
    if (loaded.elapsedAwaySeconds >= 5) {
      setOfflineBanner({
        seconds: loaded.elapsedAwaySeconds,
        readyCount: loaded.readyCountOnReturn,
      });
    }
  }, []);

  // Inicializa o áudio ambiente na primeira interação do usuário com a janela (requisito de autoplay dos navegadores)
  useEffect(() => {
    const unlockAmbientAudio = () => {
      if (soundFX.enabled) {
        soundFX.startAmbientSoundscape(farmState.weather || WeatherType.SUNNY);
      }
    };

    window.addEventListener('pointerdown', unlockAmbientAudio, { once: true });
    window.addEventListener('keydown', unlockAmbientAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAmbientAudio);
      window.removeEventListener('keydown', unlockAmbientAudio);
    };
  }, [farmState.weather]);

  // Mantém a paisagem sonora ambiente sincronizada sempre que o clima mudar
  useEffect(() => {
    soundFX.setAmbientWeather(farmState.weather || WeatherType.SUNNY);
  }, [farmState.weather]);

  // Loop de tempo real (250ms) que aplica o bônus contínuo do clima e alterna o ciclo climático
  useEffect(() => {
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);

      setFarmState((prev) => {
        const { nextState, weatherChangedTo } = tickWeatherAndGrowth(prev, currentNow);
        if (weatherChangedTo) {
          const wMeta = WEATHER_CATALOG[weatherChangedTo];
          soundFX.setAmbientWeather(weatherChangedTo);
          soundFX.playWeatherChange(weatherChangedTo === WeatherType.RAIN);
          setRecentEvents((evts) => [
            {
              id: `evt_w_${currentNow}`,
              message: `Mudança climática: ${wMeta.name} (${wMeta.badgeText})!`,
              timestamp: currentNow,
              type: 'weather',
            },
            ...evts.slice(0, 7),
          ]);
        }
        return nextState;
      });
    }, 250);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentNow = Date.now();
        setNow(currentNow);
        setFarmState((prev) => {
          const awaySec = Math.floor((currentNow - prev.lastUpdatedAt) / 1000);
          const { nextState } = tickWeatherAndGrowth(prev, currentNow);
          if (awaySec >= 6) {
            const unlockedIds = new Set(
              nextState.zones.filter((z) => z.unlocked).map((z) => z.id)
            );
            const readyCount = nextState.plots.filter(
              (p) =>
                unlockedIds.has(p.zoneId) &&
                getPlotGrowthInfo(p, currentNow, nextState.weather).isReady
            ).length;
            setOfflineBanner({ seconds: awaySec, readyCount });
          }
          return nextState;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  // Salva automaticamente no localStorage
  useEffect(() => {
    saveFarmStateToStorage(farmState);
  }, [farmState]);

  // Troca manual de clima pelo topo ou painel de teste
  const handleChangeWeather = useCallback(
    (targetWeather: WeatherType) => {
      const currentNow = Date.now();
      setNow(currentNow);
      const wMeta = WEATHER_CATALOG[targetWeather];
      soundFX.setAmbientWeather(targetWeather);
      soundFX.playWeatherChange(targetWeather === WeatherType.RAIN);
      setFarmState((prev) => changeFarmWeather(prev, targetWeather, currentNow));
      spawnFloatingFeedback(
        3.5,
        2.5,
        `${wMeta.name} (${wMeta.badgeText})`,
        targetWeather === WeatherType.RAIN ? 'sky' : 'amber'
      );
      pushEvent(`Clima alterado para ${wMeta.name}: ${wMeta.subtitle}.`, 'weather');
    },
    [pushEvent, spawnFloatingFeedback]
  );

  // Handler de clique direto em um canteiro na fazenda isométrica
  const handlePlotClick = useCallback(
    (plot: CropPlot) => {
      const currentNow = Date.now();
      setNow(currentNow);

      const growth = getPlotGrowthInfo(plot, currentNow, farmState.weather);

      // Se estiver pronta para colher, colhe imediatamente
      if (growth.isReady) {
        const res = harvestPlot(farmState, plot.id, currentNow);
        if (res.harvested && res.cropHarvested) {
          soundFX.playHarvest();
          setFarmState(res.nextState);
          const cropName = CROP_CATALOG[res.cropHarvested].name;
          spawnFloatingFeedback(
            plot.gridX + 0.5,
            plot.gridY + 0.5,
            `+${res.coinsEarned}$ · +${res.xpEarned}XP`,
            'amber'
          );
          pushEvent(
            `Colheu ${cropName}: +${res.coinsEarned} moedas e +${res.xpEarned} XP!`,
            'harvest'
          );
        }
        return;
      }

      // Se o canteiro estiver vazio (Terra preparada), planta a semente selecionada
      if (plot.cropType === null) {
        const res = plantCropInPlot(
          farmState,
          plot.id,
          farmState.selectedCrop,
          currentNow,
          false
        );
        if (res.planted) {
          soundFX.playPlant();
          setFarmState(res.nextState);
          const cropName = CROP_CATALOG[farmState.selectedCrop].name;
          spawnFloatingFeedback(
            plot.gridX + 0.5,
            plot.gridY + 0.5,
            `Plantou ${cropName}`,
            'emerald'
          );
          pushEvent(`Plantou ${cropName} no canteiro.`, 'plant');
        } else if (res.reason) {
          pushEvent(res.reason, 'plant');
        }
        return;
      }

      // Se ainda estiver crescendo, clicar dá um pequeno impulso de rega (+4s)
      const boosted = advanceCropsGrowth(
        {
          ...farmState,
          plots: farmState.plots.map((p) =>
            p.id === plot.id
              ? { ...p, wateredBonusMs: (p.wateredBonusMs || 0) + 4000 }
              : p
          ),
        },
        0,
        currentNow
      );
      soundFX.playPlant();
      setFarmState(boosted);
      spawnFloatingFeedback(plot.gridX + 0.5, plot.gridY + 0.5, '💧 Regou (-4s)', 'sky');
    },
    [farmState, pushEvent, spawnFloatingFeedback]
  );

  // Botão de Teste: Colher todas as plantações prontas
  const handleHarvestAllReady = useCallback(() => {
    const currentNow = Date.now();
    setNow(currentNow);
    const res = harvestAllReadyPlots(farmState, currentNow);

    if (res.harvestedPlots.length === 0) {
      pushEvent('Nenhuma plantação pronta no momento. Use "Avançar +15s" ou ative Chuva Fértil!', 'harvest');
      return;
    }

    soundFX.playHarvest();
    setFarmState(res.nextState);

    res.harvestedPlots.forEach((p) => {
      const meta = p.cropType ? CROP_CATALOG[p.cropType] : null;
      if (meta) {
        spawnFloatingFeedback(
          p.gridX + 0.5,
          p.gridY + 0.5,
          `+${meta.harvestCoins}$`,
          'amber'
        );
      }
    });

    pushEvent(
      `Colheita em massa: ${res.harvestedPlots.length} canteiros renderam +${res.totalCoinsEarned} moedas e +${res.totalXpEarned} XP!`,
      'harvest'
    );
  }, [farmState, pushEvent, spawnFloatingFeedback]);

  // Botão de Teste: Plantar em todos os canteiros vazios
  const handlePlantAllEmpty = useCallback(
    (free: boolean = true) => {
      const currentNow = Date.now();
      setNow(currentNow);
      const res = plantAllEmptyPlots(
        farmState,
        farmState.selectedCrop,
        currentNow,
        free
      );

      if (res.plantedCount === 0) {
        pushEvent('Todos os canteiros desbloqueados já estão plantados!', 'plant');
        return;
      }

      soundFX.playPlant();
      setFarmState(res.nextState);
      const cropName = CROP_CATALOG[farmState.selectedCrop].name;
      pushEvent(
        `Plantou ${cropName} em ${res.plantedCount} canteiro(s) preparado(s).`,
        'plant'
      );
    },
    [farmState, pushEvent]
  );

  // Botão de Teste: Avançar tempo de crescimento
  const handleAdvanceTime = useCallback(
    (seconds: number) => {
      const currentNow = Date.now();
      setNow(currentNow);
      const next = advanceCropsGrowth(farmState, seconds, currentNow);
      soundFX.playPlant();
      setFarmState(next);
      pushEvent(
        `Tempo avançado em +${seconds}s! As plantações evoluíram de estágio.`,
        'plant'
      );
    },
    [farmState, pushEvent]
  );

  // Botão de Teste: Adicionar moedas
  const handleAddBonusCoins = useCallback(
    (amount: number) => {
      const currentNow = Date.now();
      const next = addFarmCoins(farmState, amount, 25, currentNow);
      soundFX.playHarvest();
      setFarmState(next);
      spawnFloatingFeedback(2.5, 2.5, `+${amount} Moedas`, 'amber');
      pushEvent(`Recebeu +${amount} moedas e +25 XP de bônus de teste!`, 'harvest');
    },
    [farmState, pushEvent, spawnFloatingFeedback]
  );

  // Desbloquear novo terreno
  const handleUnlockZone = useCallback(
    (zoneId?: string, freeOverride: boolean = false) => {
      const currentNow = Date.now();
      const res = unlockExpansionZone(farmState, zoneId, freeOverride, currentNow);
      if (!res.unlockedZone) {
        if (res.reason) pushEvent(res.reason, 'expand');
        return;
      }

      soundFX.playExpand();
      setFarmState(res.nextState);
      pushEvent(
        `Novo terreno desbloqueado: ${res.unlockedZone}! Câmera ajustada para a fazenda maior.`,
        'expand'
      );
    },
    [farmState, pushEvent]
  );

  const handleShowcaseSeedlings = useCallback(() => {
    const currentNow = Date.now();
    setNow(currentNow);
    soundFX.playPlant();
    setFarmState((prev) => setupSeedlingShowcase(prev, currentNow));
    pushEvent(
      'Modo Comparação: Milho, Trigo e Cenoura posicionados lado a lado nos estágios de Muda e Crescimento!',
      'plant'
    );
  }, [pushEvent]);

  const handleResetFarm = useCallback(() => {
    const fresh = createDefaultFarmState(Date.now());
    setFarmState(fresh);
    saveFarmStateToStorage(fresh);
    setOfflineBanner(null);
    pushEvent('Progresso da fazenda reiniciado para o estado inicial.', 'plant');
  }, [pushEvent]);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundFX.setSoundEnabled(next, farmState.weather || WeatherType.SUNNY);
      return next;
    });
  }, [farmState.weather]);

  return (
    <main className="w-screen h-screen bg-slate-950 flex items-center justify-center overflow-hidden">
      <div
        className={`relative w-full h-full overflow-hidden transition-all duration-300 ${
          isVerticalPreview
            ? 'max-w-[430px] max-h-[860px] aspect-[9/16] rounded-3xl border-4 border-slate-800 shadow-2xl'
            : ''
        }`}
      >
        <IsometricFarmCanvas
          plots={farmState.plots}
          zones={farmState.zones}
          selectedCrop={farmState.selectedCrop}
          weather={farmState.weather || WeatherType.SUNNY}
          now={now}
          floatingFeedbacks={floatingFeedbacks}
          onPlotClick={handlePlotClick}
          onUnlockZoneClick={(zoneId) => handleUnlockZone(zoneId, true)}
        />

        <FarmHUD
          state={farmState}
          now={now}
          showTestPanel={showTestPanel}
          isVerticalPreview={isVerticalPreview}
          soundEnabled={soundEnabled}
          recentEvents={recentEvents}
          offlineBanner={offlineBanner}
          onDismissOfflineBanner={() => setOfflineBanner(null)}
          onSelectCrop={(crop: CropType) =>
            setFarmState((prev) => ({ ...prev, selectedCrop: crop }))
          }
          onChangeWeather={handleChangeWeather}
          onToggleTestPanel={() => setShowTestPanel((prev) => !prev)}
          onToggleVerticalPreview={() => setIsVerticalPreview((prev) => !prev)}
          onToggleSound={handleToggleSound}
          onToggleAutoReplant={() =>
            setFarmState((prev) => ({ ...prev, autoReplant: !prev.autoReplant }))
          }
          onHarvestAllReady={handleHarvestAllReady}
          onPlantAllEmpty={handlePlantAllEmpty}
          onAdvanceTime={handleAdvanceTime}
          onAddBonusCoins={handleAddBonusCoins}
          onUnlockNextExpansion={(free) => handleUnlockZone(undefined, free)}
          onShowcaseSeedlings={handleShowcaseSeedlings}
          onResetFarm={handleResetFarm}
        />
      </div>
    </main>
  );
}
