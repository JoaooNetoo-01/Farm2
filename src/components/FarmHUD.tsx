import React from 'react';
import {
  CloudRain,
  CloudSun,
  Coins,
  Eye,
  EyeOff,
  FastForward,
  Maximize2,
  RotateCcw,
  Smartphone,
  Sprout,
  Sun,
  Trophy,
  Volume2,
  VolumeX,
  Wheat,
} from 'lucide-react';
import {
  CROP_CATALOG,
  STAGE_LABELS,
  WEATHER_CATALOG,
  WEATHER_CYCLE_ORDER,
  calculateLevelFromXp,
} from '../constants/farmConfig';
import { getPlotGrowthInfo } from '../services/farmEngine';
import { ActivityEvent, CropStage, CropType, FarmState, WeatherType } from '../types/farm';

interface FarmHUDProps {
  state: FarmState;
  now: number;
  showTestPanel: boolean;
  isVerticalPreview: boolean;
  soundEnabled: boolean;
  recentEvents: ActivityEvent[];
  offlineBanner: { seconds: number; readyCount: number } | null;
  onDismissOfflineBanner: () => void;
  onSelectCrop: (crop: CropType) => void;
  onChangeWeather: (weather: WeatherType) => void;
  onToggleTestPanel: () => void;
  onToggleVerticalPreview: () => void;
  onToggleSound: () => void;
  onToggleAutoReplant: () => void;
  onHarvestAllReady: () => void;
  onPlantAllEmpty: (free?: boolean) => void;
  onAdvanceTime: (seconds: number) => void;
  onAddBonusCoins: (amount: number) => void;
  onUnlockNextExpansion: (freeOverride: boolean) => void;
  onShowcaseSeedlings: () => void;
  onResetFarm: () => void;
}

export const FarmHUD: React.FC<FarmHUDProps> = ({
  state,
  now,
  showTestPanel,
  isVerticalPreview,
  soundEnabled,
  recentEvents,
  offlineBanner,
  onDismissOfflineBanner,
  onSelectCrop,
  onChangeWeather,
  onToggleTestPanel,
  onToggleVerticalPreview,
  onToggleSound,
  onToggleAutoReplant,
  onHarvestAllReady,
  onPlantAllEmpty,
  onAdvanceTime,
  onAddBonusCoins,
  onUnlockNextExpansion,
  onShowcaseSeedlings,
  onResetFarm,
}) => {
  const levelInfo = calculateLevelFromXp(state.xp);
  const activeWeather = state.weather || WeatherType.SUNNY;
  const weatherMeta = WEATHER_CATALOG[activeWeather] || WEATHER_CATALOG[WeatherType.SUNNY];

  // Calcula quantos segundos faltam para a próxima mudança climática automática
  const weatherElapsedSec = Math.floor((now - (state.weatherChangedAt || now)) / 1000);
  const weatherRemainingSec = Math.max(0, weatherMeta.durationSec - weatherElapsedSec);

  const unlockedZoneIds = new Set(
    state.zones.filter((z) => z.unlocked).map((z) => z.id)
  );
  const activePlots = state.plots.filter((p) => unlockedZoneIds.has(p.zoneId));

  const readyPlotsCount = activePlots.filter(
    (p) => getPlotGrowthInfo(p, now, activeWeather).isReady
  ).length;
  const emptyPlotsCount = activePlots.filter((p) => p.cropType === null).length;
  const nextLockedZone = state.zones.find((z) => !z.unlocked);

  const stageCounts = activePlots.reduce(
    (acc, plot) => {
      const info = getPlotGrowthInfo(plot, now, activeWeather);
      acc[info.stage] = (acc[info.stage] || 0) + 1;
      return acc;
    },
    {
      [CropStage.PREPARED_SOIL]: 0,
      [CropStage.SEEDLING]: 0,
      [CropStage.GROWING]: 0,
      [CropStage.READY]: 0,
    } as Record<CropStage, number>
  );

  const renderWeatherIcon = (w: WeatherType, className = 'w-4 h-4') => {
    if (w === WeatherType.RAIN) return <CloudRain className={`${className} text-sky-300`} />;
    if (w === WeatherType.BREEZY) return <CloudSun className={`${className} text-emerald-300`} />;
    return <Sun className={`${className} text-amber-300`} />;
  };

  const handleCycleWeatherClick = () => {
    const idx = WEATHER_CYCLE_ORDER.indexOf(activeWeather);
    const nextW = WEATHER_CYCLE_ORDER[(idx + 1) % WEATHER_CYCLE_ORDER.length];
    onChangeWeather(nextW);
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4 z-20">
      {/* ================= TOPO: TÍTULO, MOEDAS, CLIMA E PROGRESSO ================= */}
      <div className="flex flex-col gap-2">
        <header className="pointer-events-auto flex items-center justify-between gap-2 sm:gap-3 bg-slate-900/85 backdrop-blur-md text-white px-3.5 sm:px-4 py-2.5 rounded-2xl border border-white/10 shadow-lg">
          {/* Identidade do Jogo */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-display font-extrabold text-lg shrink-0 shadow-sm">
              FG
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-base sm:text-lg leading-tight tracking-tight text-white truncate">
                Fazenda da Galera
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium">
                <span>Nível {levelInfo.level}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {levelInfo.currentLevelXp}/{levelInfo.nextLevelXp} XP
                </span>
              </div>
            </div>
          </div>

          {/* Moedas + Clima Ativo + Controles Rápidos */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Botão Interativo do Clima Atual com Bônus de Crescimento */}
            <button
              type="button"
              onClick={handleCycleWeatherClick}
              title={`${weatherMeta.subtitle} — Clique para alternar o clima`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeWeather === WeatherType.RAIN
                  ? 'bg-sky-500/20 border-sky-400/40 text-sky-200 hover:bg-sky-500/30'
                  : activeWeather === WeatherType.SUNNY
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-200 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30'
              }`}
            >
              {renderWeatherIcon(activeWeather, 'w-4 h-4 shrink-0')}
              <span className="hidden sm:inline">{weatherMeta.name}</span>
              <span className="font-mono text-[11px] opacity-90 tabular-nums">
                {weatherMeta.badgeText}
              </span>
            </button>

            {/* Contador de Moedas */}
            <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/30 px-2.5 sm:px-3 py-1.5 rounded-xl">
              <Coins className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-mono font-bold text-sm sm:text-base text-amber-300 tabular-nums">
                {state.coins}
              </span>
            </div>

            {/* Botão para alternar modo 9:16 TikTok / Tela Cheia */}
            <button
              type="button"
              onClick={onToggleVerticalPreview}
              title={
                isVerticalPreview
                  ? 'Expandir para tela inteira'
                  : 'Enquadrar em formato vertical 9:16 (TikTok LIVE)'
              }
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {isVerticalPreview ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Tela Cheia</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Modo 9:16</span>
                </>
              )}
            </button>

            {/* Botão de Som Existente (Controla SFX + Ambiente Dinâmico por Clima) */}
            <button
              type="button"
              onClick={onToggleSound}
              title={
                soundEnabled
                  ? `Som Ativo (${
                      activeWeather === WeatherType.SUNNY
                        ? 'Pássaros ao amanhecer'
                        : activeWeather === WeatherType.BREEZY
                        ? 'Vento suave na fazenda'
                        : 'Chuva suave no campo'
                    }) — Clique para silenciar`
                  : 'Ativar sons ambientes da fazenda e efeitos'
              }
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-300" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Botão Mostrar / Ocultar Painel de Teste */}
            <button
              type="button"
              onClick={onToggleTestPanel}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                showTestPanel
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {showTestPanel ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ocultar Painel</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Painel de Teste</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Barra fina de Progresso de Experiência (XP) + Status do Clima e Etapas */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2 bg-slate-900/75 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs text-slate-200">
          <div className="flex items-center gap-2 flex-1 min-w-[160px]">
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 to-amber-400 h-full transition-all duration-300"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-amber-300 tabular-nums shrink-0">
              {levelInfo.progressPercent}%
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono tabular-nums">
            <span>Terra: {stageCounts[CropStage.PREPARED_SOIL]}</span>
            <span aria-hidden="true">·</span>
            <span>Muda: {stageCounts[CropStage.SEEDLING]}</span>
            <span aria-hidden="true">·</span>
            <span>Crescendo: {stageCounts[CropStage.GROWING]}</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-300 font-semibold">
              Prontas: {stageCounts[CropStage.READY]}
            </span>
          </div>
        </div>

        {/* Aviso de Crescimento Offline */}
        {offlineBanner && offlineBanner.seconds >= 5 && (
          <div className="pointer-events-auto flex items-center justify-between gap-3 bg-amber-400 text-slate-950 px-4 py-2 rounded-xl shadow-md text-xs font-semibold">
            <span>
              ⏱️ Tempo transcorrido ({offlineBanner.seconds}s): suas plantações cresceram com o bônus do clima! ({offlineBanner.readyCount} prontas para colher)
            </span>
            <button
              type="button"
              onClick={onDismissOfflineBanner}
              className="px-2.5 py-1 rounded-lg bg-slate-950/15 hover:bg-slate-950/25 text-slate-950 font-bold cursor-pointer shrink-0"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* ================= RODAPÉ: SELETOR DE SEMENTES, CLIMA E PAINEL DE TESTE OCULTÁVEL ================= */}
      <div className="flex flex-col gap-2.5">
        {/* Feed discreto da última ação na fazenda */}
        {recentEvents.length > 0 && (
          <div className="self-start bg-slate-900/80 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl border border-white/10 text-xs flex items-center gap-2 shadow-sm">
            <Sprout className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[320px] sm:max-w-[520px]">
              {recentEvents[0].message}
            </span>
          </div>
        )}

        {/* Painel de Ações de Teste (Ocultável para transmissão limpa no TikTok LIVE) */}
        {showTestPanel && (
          <section className="pointer-events-auto bg-slate-900/90 backdrop-blur-md text-white p-3.5 rounded-2xl border border-white/15 shadow-xl flex flex-col gap-3">
            {/* Linha 1: Seleção da Cultura + Seletor de Clima Dinâmico */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {/* Sementes */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-slate-300">
                  Semente ativa (tempo já reduzido pelo clima {weatherMeta.name}):
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.values(CROP_CATALOG).map((crop) => {
                    const isSelected = state.selectedCrop === crop.id;
                    const effectiveSec = Math.ceil(
                      crop.growDurationSec / weatherMeta.growthSpeedMultiplier
                    );
                    return (
                      <button
                        key={crop.id}
                        type="button"
                        onClick={() => onSelectCrop(crop.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between gap-1.5 whitespace-nowrap ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        <span>{crop.name}</span>
                        <span
                          className={`font-mono text-[11px] tabular-nums ${
                            isSelected ? 'text-slate-900 font-bold' : 'text-amber-300'
                          }`}
                        >
                          {crop.seedCost}$ · ~{effectiveSec}s
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clima Dinâmico */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span>Clima da Fazenda (muda sozinho em {weatherRemainingSec}s):</span>
                  <span className="text-emerald-300 font-mono tabular-nums">
                    Velocidade {weatherMeta.growthSpeedMultiplier}x
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {WEATHER_CYCLE_ORDER.map((wType) => {
                    const wInfo = WEATHER_CATALOG[wType];
                    const isCurrent = activeWeather === wType;
                    return (
                      <button
                        key={wType}
                        type="button"
                        onClick={() => onChangeWeather(wType)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between gap-1.5 whitespace-nowrap ${
                          isCurrent
                            ? wType === WeatherType.RAIN
                              ? 'bg-sky-400 text-slate-950 shadow-sm'
                              : wType === WeatherType.SUNNY
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : 'bg-emerald-400 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          {renderWeatherIcon(
                            wType,
                            `w-3.5 h-3.5 ${isCurrent ? 'text-slate-950' : ''}`
                          )}
                          <span>{wInfo.name}</span>
                        </span>
                        <span
                          className={`font-mono text-[10px] tabular-nums ${
                            isCurrent ? 'text-slate-900 font-bold' : 'text-slate-400'
                          }`}
                        >
                          {wInfo.badgeText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Linha 2: Botões de Teste de Colheita, Plantio, Crescimento e Expansão */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={onHarvestAllReady}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  readyPlotsCount > 0
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Wheat className="w-4 h-4 shrink-0" />
                <span>Colher Prontas ({readyPlotsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => onPlantAllEmpty(true)}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sprout className="w-4 h-4 shrink-0" />
                <span>Plantar Vazios ({emptyPlotsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => onAdvanceTime(15)}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <FastForward className="w-4 h-4 shrink-0" />
                <span>Avançar +15s</span>
              </button>

              <button
                type="button"
                onClick={() => onUnlockNextExpansion(true)}
                disabled={!nextLockedZone}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  nextLockedZone
                    ? 'bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border border-amber-400/40 cursor-pointer'
                    : 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>
                  {nextLockedZone
                    ? `Expandir: ${nextLockedZone.badgeLabel}`
                    : 'Mapa 100% Aberto'}
                </span>
              </button>
            </div>

            {/* Linha 3: Controles auxiliares de teste */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onShowcaseSeedlings}
                  title="Planta Milho, Trigo e Cenoura lado a lado nos estágios de Muda e Crescimento para comparar os desenhos e a brisa"
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/35 font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  Comparar 3 Mudas
                </button>

                <button
                  type="button"
                  onClick={onToggleAutoReplant}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    state.autoReplant
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Replantio Automático: {state.autoReplant ? 'ATIVO' : 'OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => onAddBonusCoins(100)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  +100 Moedas
                </button>
              </div>

              <div className="flex items-center gap-3 text-slate-400">
                <span className="hidden sm:inline text-[11px]">
                  Estágios: {STAGE_LABELS[0]} → {STAGE_LABELS[1]} → {STAGE_LABELS[2]} → {STAGE_LABELS[3]}
                </span>
                <button
                  type="button"
                  onClick={onResetFarm}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 text-rose-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar Save</span>
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
