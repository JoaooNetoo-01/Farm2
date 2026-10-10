import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CROP_CATALOG, STAGE_LABELS, WEATHER_CATALOG } from '../constants/farmConfig';
import { getPlotGrowthInfo } from '../services/farmEngine';
import {
  ChickenEntity,
  CropPlot,
  CropType,
  ExpansionZone,
  FloatingFeedback,
  WeatherType,
} from '../types/farm';
import {
  AmbientBirdConfig,
  ButterflyFlightConfig,
  GroundFloraConfig,
  IsometricBirdArtwork,
  IsometricButterflyArtwork,
  IsometricChickenArtwork,
  IsometricCropArtwork,
  IsometricGroundFloraArtwork,
  IsometricPondArtwork,
  IsometricShrubArtwork,
  IsometricTreeArtwork,
  TreeRenderConfig,
  computeBreezeAngle,
  computeDayCycleLighting,
} from './FarmVisualElements';

interface IsometricFarmCanvasProps {
  plots: CropPlot[];
  zones: ExpansionZone[];
  selectedCrop: CropType;
  weather: WeatherType;
  now: number;
  floatingFeedbacks: FloatingFeedback[];
  onPlotClick: (plot: CropPlot) => void;
  onUnlockZoneClick: (zoneId: string) => void;
}

const TILE_W = 88;
const TILE_H = 44;
const ORIGIN_X = 500;
const ORIGIN_Y = 145;

export function gridToScreen(gx: number, gy: number): { x: number; y: number } {
  return {
    x: ORIGIN_X + (gx - gy) * (TILE_W / 2),
    y: ORIGIN_Y + (gx + gy) * (TILE_H / 2),
  };
}

function getPolygonPoints(
  gx: number,
  gy: number,
  w: number,
  h: number,
  yOffset: number = 0
): string {
  const p1 = gridToScreen(gx, gy);
  const p2 = gridToScreen(gx + w, gy);
  const p3 = gridToScreen(gx + w, gy + h);
  const p4 = gridToScreen(gx, gy + h);
  return `${p1.x},${p1.y + yOffset} ${p2.x},${p2.y + yOffset} ${p3.x},${p3.y + yOffset} ${p4.x},${p4.y + yOffset}`;
}

export const IsometricFarmCanvas: React.FC<IsometricFarmCanvasProps> = ({
  plots,
  zones,
  selectedCrop,
  weather,
  now,
  floatingFeedbacks,
  onPlotClick,
  onUnlockZoneClick,
}) => {
  const unlockedZoneIds = useMemo(
    () => new Set(zones.filter((z) => z.unlocked).map((z) => z.id)),
    [zones]
  );

  const unlockedCount = unlockedZoneIds.size;
  const isRaining = weather === WeatherType.RAIN;
  const isSunny = weather === WeatherType.SUNNY;
  const isBreezy = weather === WeatherType.BREEZY;
  const weatherMeta = WEATHER_CATALOG[weather] || WEATHER_CATALOG[WeatherType.SUNNY];

  const windStrength = isBreezy ? 1.35 : isRaining ? 1.2 : 0.85;

  const [animTimeSec, setAnimTimeSec] = useState<number>(0);

  // Ciclo visual contínuo de Manhã, Meio do Dia, Fim de Tarde e Noite integrado ao clima
  const dayLighting = useMemo(
    () => computeDayCycleLighting(animTimeSec, isRaining, isSunny, isBreezy),
    [animTimeSec, isRaining, isSunny, isBreezy]
  );

  // ================= MOVIMENTAÇÃO DA TELA ULTRA-FLUIDA (60FPS DIRETO NA GPU SEM RE-RENDER) =================
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cameraGroupRef = useRef<SVGGElement | null>(null);

  // Guardamos o deslocamento alvo e o atual em refs para interpolar suavemente (LERP) no requestAnimationFrame
  // sem disparar re-renderizações do React a cada pixel movido pelo dedo
  const targetPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const baseCameraRef = useRef<{ x: number; y: number; scale: number }>({
    x: 35,
    y: 38,
    scale: 1.16,
  });

  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    initialPanX: number;
    initialPanY: number;
    movedDistance: number;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
    movedDistance: 0,
  });

  const clampPan = useCallback((x: number, y: number) => {
    return {
      x: Math.max(-210, Math.min(210, x)),
      y: Math.max(-155, Math.min(155, y)),
    };
  }, []);

  // Atualiza a câmera base conforme os terrenos são desbloqueados
  const prevUnlockedCountRef = useRef<number>(unlockedCount);
  useEffect(() => {
    const hasEast = unlockedZoneIds.has('zone_east');
    const hasSouth = unlockedZoneIds.has('zone_south');
    const hasSE = unlockedZoneIds.has('zone_southeast');

    let baseX = 0;
    let baseY = -12;
    let baseScale = 0.94;

    if (!hasEast && !hasSouth && !hasSE) {
      baseX = 35;
      baseY = 38;
      baseScale = 1.16;
    } else if (hasEast && !hasSouth && !hasSE) {
      baseX = -25;
      baseY = 24;
      baseScale = 1.03;
    } else if (hasSouth && !hasEast) {
      baseX = 28;
      baseY = -10;
      baseScale = 1.02;
    }

    baseCameraRef.current = { x: baseX, y: baseY, scale: baseScale };

    if (unlockedCount !== prevUnlockedCountRef.current) {
      prevUnlockedCountRef.current = unlockedCount;
      targetPanRef.current = { x: 0, y: 0 };
    }
  }, [unlockedZoneIds, unlockedCount]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: targetPanRef.current.x,
      initialPanY: targetPanRef.current.y,
      movedDistance: 0,
    };
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const dist = Math.hypot(dx, dy);
    dragRef.current.movedDistance = Math.max(dragRef.current.movedDistance, dist);

    if (dragRef.current.movedDistance > 3) {
      // Sensibilidade suave (~0.45) atualizando apenas o targetPanRef (zero re-render no React)
      const panSpeed = 0.45;
      targetPanRef.current = clampPan(
        dragRef.current.initialPanX + dx * panSpeed,
        dragRef.current.initialPanY + dy * panSpeed
      );
    }
  };

  const handlePointerUpOrCancel = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  };

  const [chickens, setChickens] = useState<ChickenEntity[]>([
    {
      id: 'chk_1',
      name: 'Pipoca',
      x: 1.45,
      y: 3.85,
      targetX: 4.15,
      targetY: 2.25,
      facingLeft: false,
      state: 'walking',
      stateTimer: 0,
      stateDuration: 0,
      walkDistance: 0,
      seedOffset: 1.2,
      featherColor: 'white',
    },
    {
      id: 'chk_2',
      name: 'Canjica',
      x: 4.18,
      y: 4.25,
      targetX: 1.4,
      targetY: 4.45,
      facingLeft: true,
      state: 'pecking',
      stateTimer: 1.8,
      stateDuration: 1.8,
      walkDistance: 2.5,
      seedOffset: 4.7,
      featherColor: 'amber',
    },
  ]);

  const maxWalkBoundRef = useRef({ maxX: 4.6, maxY: 4.7 });
  useEffect(() => {
    const hasEast = unlockedZoneIds.has('zone_east');
    const hasSouth = unlockedZoneIds.has('zone_south');
    maxWalkBoundRef.current = {
      maxX: hasEast ? 7.8 : 4.6,
      maxY: hasSouth ? 7.8 : 4.7,
    };
  }, [unlockedZoneIds]);

  const pickNextChickenTarget = (currX: number, currY: number) => {
    const bounds = maxWalkBoundRef.current;
    for (let attempt = 0; attempt < 8; attempt++) {
      const tx = 0.85 + Math.random() * (bounds.maxX - 1.05);
      const ty = 1.35 + Math.random() * (bounds.maxY - 1.55);
      const insideBarn = tx < 2.0 && ty < 2.0;
      const dist = Math.hypot(tx - currX, ty - currY);
      if (!insideBarn && dist > 0.65 && dist < 3.6) {
        return { tx, ty };
      }
    }
    return { tx: 1.5, ty: 4.2 };
  };

  useEffect(() => {
    let animationFrameId: number;
    const startPerf = performance.now();
    let lastPerf = startPerf;
    let lastReactSyncPerf = startPerf;

    const tickScene = (currentPerf: number) => {
      const dt = Math.min(0.08, (currentPerf - lastPerf) / 1000);
      lastPerf = currentPerf;
      const elapsedSec = (currentPerf - startPerf) / 1000;

      // 1. Interpola a câmera diretamente no DOM a cada frame (60/120Hz) com amortecimento suave (LERP)
      const lerpFactor = 1 - Math.exp(-14 * dt);
      currentPanRef.current.x +=
        (targetPanRef.current.x - currentPanRef.current.x) * lerpFactor;
      currentPanRef.current.y +=
        (targetPanRef.current.y - currentPanRef.current.y) * lerpFactor;

      if (cameraGroupRef.current) {
        const { x: bx, y: by, scale: bScale } = baseCameraRef.current;
        const tx = (bx + currentPanRef.current.x).toFixed(2);
        const ty = (by + currentPanRef.current.y).toFixed(2);
        cameraGroupRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${bScale})`;
      }

      // 2. Sincroniza o estado das animações de plantas/galinhas a ~30fps para deixar a thread livre durante o arrasto
      if (currentPerf - lastReactSyncPerf >= 32) {
        const reactDt = Math.min(0.1, (currentPerf - lastReactSyncPerf) / 1000);
        lastReactSyncPerf = currentPerf;
        setAnimTimeSec(elapsedSec);

        setChickens((prevChickens) =>
          prevChickens.map((chk) => {
            if (chk.state !== 'walking') {
              const nextTimer = chk.stateTimer - reactDt;

              const shouldFlipDirection =
                chk.state === 'looking' &&
                Math.abs(nextTimer - chk.stateDuration * 0.5) < reactDt * 0.6;

              if (nextTimer <= 0) {
                const roll = Math.random();
                if (chk.state === 'idle' && roll < 0.42) {
                  const dur = 1.4 + Math.random() * 0.9;
                  return {
                    ...chk,
                    state: 'pecking',
                    stateTimer: dur,
                    stateDuration: dur,
                  };
                }
                if (chk.state === 'pecking' && roll < 0.32) {
                  const dur = 1.0 + Math.random() * 0.8;
                  return {
                    ...chk,
                    state: 'looking',
                    stateTimer: dur,
                    stateDuration: dur,
                  };
                }

                const { tx, ty } = pickNextChickenTarget(chk.x, chk.y);
                const screenCurr = gridToScreen(chk.x, chk.y);
                const screenNext = gridToScreen(tx, ty);

                return {
                  ...chk,
                  targetX: tx,
                  targetY: ty,
                  facingLeft: screenNext.x < screenCurr.x,
                  state: 'walking',
                  stateTimer: 0,
                  stateDuration: 0,
                };
              }

              return {
                ...chk,
                facingLeft: shouldFlipDirection ? !chk.facingLeft : chk.facingLeft,
                stateTimer: nextTimer,
              };
            }

            const dx = chk.targetX - chk.x;
            const dy = chk.targetY - chk.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 0.05) {
              const roll = Math.random();
              const nextState: ChickenEntity['state'] =
                roll < 0.55 ? 'pecking' : roll < 0.82 ? 'idle' : 'looking';
              const dur =
                nextState === 'pecking'
                  ? 1.5 + Math.random() * 1.1
                  : 1.1 + Math.random() * 1.2;

              return {
                ...chk,
                x: chk.targetX,
                y: chk.targetY,
                state: nextState,
                stateTimer: dur,
                stateDuration: dur,
              };
            }

            const speed = chk.id === 'chk_1' ? 0.54 : 0.48;
            const step = Math.min(dist, speed * reactDt);
            const nx = chk.x + (dx / dist) * step;
            const ny = chk.y + (dy / dist) * step;
            const nextWalkDist = chk.walkDistance + step;

            // Pausa curta natural no meio do caminho ("caminhar alguns passos e parar")
            // mantendo targetX/targetY para retomar a caminhada suavemente depois
            if (dist > 0.55 && Math.random() < 0.018) {
              const pauseDur = 0.65 + Math.random() * 0.55;
              return {
                ...chk,
                x: nx,
                y: ny,
                walkDistance: nextWalkDist,
                state: Math.random() < 0.55 ? 'idle' : 'looking',
                stateTimer: pauseDur,
                stateDuration: pauseDur,
              };
            }

            return {
              ...chk,
              x: nx,
              y: ny,
              walkDistance: nextWalkDist,
            };
          })
        );
      }

      animationFrameId = requestAnimationFrame(tickScene);
    };

    animationFrameId = requestAnimationFrame(tickScene);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Gotas de chuva mais suaves, delicadas e em duas camadas de velocidade/profundidade
  const rainDrops = useMemo(
    () =>
      Array.from({ length: 38 }).map((_, idx) => {
        const isForeground = idx % 3 === 0;
        return {
          id: `drop_${idx}`,
          x: 45 + ((idx * 27) % 920),
          y: -40 + ((idx * 39) % 180),
          delay: `${((idx * 0.17) % 2.1).toFixed(2)}s`,
          duration: `${(1.55 + (idx % 5) * 0.18).toFixed(2)}s`,
          length: isForeground ? 19 + (idx % 3) * 4 : 13 + (idx % 3) * 3,
          strokeWidth: isForeground ? 1.25 : 0.9,
          opacity: isForeground ? 0.52 : 0.34,
        };
      }),
    []
  );

  // Impactos de pingos fixos no solo isométrico (ancorados por translate(x,y) para nunca "andarem" pela tela)
  const rainSplashes = useMemo(
    () => [
      { id: 'sp_1', gx: 1.35, gy: 2.45, phase: 0.0, zone: 'zone_core' },
      { id: 'sp_2', gx: 2.45, gy: 1.55, phase: 0.28, zone: 'zone_core' },
      { id: 'sp_3', gx: 1.65, gy: 4.32, phase: 0.54, zone: 'zone_core' },
      { id: 'sp_4', gx: 3.45, gy: 3.15, phase: 0.81, zone: 'zone_core' },
      { id: 'sp_5', gx: 4.35, gy: 2.35, phase: 0.14, zone: 'zone_core' },
      { id: 'sp_6', gx: 4.25, gy: 4.42, phase: 0.67, zone: 'zone_core' },
      { id: 'sp_7', gx: 0.82, gy: 3.55, phase: 0.42, zone: 'zone_core' },
      { id: 'sp_8', gx: 5.85, gy: 2.25, phase: 0.19, zone: 'zone_east' },
      { id: 'sp_9', gx: 7.15, gy: 3.45, phase: 0.61, zone: 'zone_east' },
      { id: 'sp_10', gx: 6.45, gy: 1.35, phase: 0.88, zone: 'zone_east' },
      { id: 'sp_11', gx: 1.75, gy: 6.35, phase: 0.33, zone: 'zone_south' },
      { id: 'sp_12', gx: 3.65, gy: 6.85, phase: 0.74, zone: 'zone_south' },
      { id: 'sp_13', gx: 2.25, gy: 8.32, phase: 0.49, zone: 'zone_south' },
      { id: 'sp_14', gx: 6.25, gy: 6.45, phase: 0.12, zone: 'zone_southeast' },
      { id: 'sp_15', gx: 7.35, gy: 7.25, phase: 0.57, zone: 'zone_southeast' },
    ],
    []
  );

  // Vegetação baixa diversificada (margaridas, trevos, flores silvestres e tufos de grama)
  // distribuída em agrupamentos irregulares fora de caminhos, canteiros e limites de terreno
  const groundFlora = useMemo<GroundFloraConfig[]>(
    () => [
      {
        id: 'gf1',
        gx: 0.62,
        gy: 2.95,
        kind: 'daisy_cluster',
        colorPrimary: '#FEF08A',
        colorSecondary: '#FFFBEB',
        fallenLeaf: '#C26D1B',
        stone: true,
        scale: 1.0,
        seed: 1.1,
        zone: 'zone_core',
      },
      {
        id: 'gf2',
        gx: 0.78,
        gy: 3.22,
        kind: 'clover_patch',
        colorPrimary: '#FFFBEB',
        scale: 0.92,
        seed: 2.4,
        zone: 'zone_core',
      },
      {
        id: 'gf3',
        gx: 2.52,
        gy: 1.18,
        kind: 'daisy_cluster',
        colorPrimary: '#FFFBEB',
        colorSecondary: '#FEF08A',
        scale: 0.96,
        seed: 3.7,
        zone: 'zone_core',
      },
      {
        id: 'gf4',
        gx: 3.68,
        gy: 0.82,
        kind: 'wild_blossom',
        colorPrimary: '#BAE6FD',
        colorSecondary: '#7DD3FC',
        fallenLeaf: '#D97706',
        scale: 0.95,
        seed: 4.5,
        zone: 'zone_core',
      },
      {
        id: 'gf5',
        gx: 3.88,
        gy: 1.16,
        kind: 'clover_patch',
        colorPrimary: '#FBCFE8',
        scale: 0.9,
        seed: 5.2,
        zone: 'zone_core',
      },
      {
        id: 'gf6',
        gx: 4.82,
        gy: 3.48,
        kind: 'meadow_tuft',
        fallenLeaf: '#C26D1B',
        stone: true,
        scale: 1.0,
        seed: 6.1,
        zone: 'zone_core',
      },
      {
        id: 'gf7',
        gx: 0.68,
        gy: 4.18,
        kind: 'wild_blossom',
        colorPrimary: '#FBCFE8',
        colorSecondary: '#F472B6',
        scale: 0.94,
        seed: 7.3,
        zone: 'zone_core',
      },
      // Pomar Leste
      {
        id: 'gf8',
        gx: 5.62,
        gy: 1.32,
        kind: 'daisy_cluster',
        colorPrimary: '#BAE6FD',
        colorSecondary: '#FFFBEB',
        fallenLeaf: '#D97706',
        stone: true,
        scale: 0.98,
        seed: 8.4,
        zone: 'zone_east',
      },
      {
        id: 'gf9',
        gx: 5.84,
        gy: 1.52,
        kind: 'clover_patch',
        colorPrimary: '#FEF08A',
        scale: 0.88,
        seed: 9.1,
        zone: 'zone_east',
      },
      {
        id: 'gf10',
        gx: 7.45,
        gy: 4.35,
        kind: 'wild_blossom',
        colorPrimary: '#FBCFE8',
        colorSecondary: '#F9A8D4',
        scale: 0.96,
        seed: 10.2,
        zone: 'zone_east',
      },
      {
        id: 'gf11',
        gx: 7.85,
        gy: 2.65,
        kind: 'meadow_tuft',
        fallenLeaf: '#D97706',
        scale: 0.92,
        seed: 11.5,
        zone: 'zone_east',
      },
      // Vale Sul
      {
        id: 'gf12',
        gx: 0.65,
        gy: 5.82,
        kind: 'daisy_cluster',
        colorPrimary: '#FBCFE8',
        colorSecondary: '#FFFBEB',
        scale: 0.95,
        seed: 12.6,
        zone: 'zone_south',
      },
      {
        id: 'gf13',
        gx: 1.52,
        gy: 5.58,
        kind: 'clover_patch',
        colorPrimary: '#FEF08A',
        scale: 0.9,
        seed: 13.4,
        zone: 'zone_south',
      },
      {
        id: 'gf14',
        gx: 4.25,
        gy: 5.72,
        kind: 'wild_blossom',
        colorPrimary: '#FEF08A',
        colorSecondary: '#FDE047',
        fallenLeaf: '#C26D1B',
        scale: 0.98,
        seed: 14.8,
        zone: 'zone_south',
      },
      {
        id: 'gf15',
        gx: 0.62,
        gy: 7.82,
        kind: 'daisy_cluster',
        colorPrimary: '#FEF08A',
        colorSecondary: '#FFFBEB',
        fallenLeaf: '#C26D1B',
        stone: true,
        scale: 1.0,
        seed: 15.9,
        zone: 'zone_south',
      },
      // Colina Sudeste
      {
        id: 'gf16',
        gx: 5.62,
        gy: 8.15,
        kind: 'daisy_cluster',
        colorPrimary: '#FEF08A',
        colorSecondary: '#FFFBEB',
        stone: true,
        scale: 0.96,
        seed: 16.7,
        zone: 'zone_southeast',
      },
      {
        id: 'gf17',
        gx: 8.18,
        gy: 5.45,
        kind: 'clover_patch',
        colorPrimary: '#FBCFE8',
        stone: true,
        scale: 0.94,
        seed: 17.5,
        zone: 'zone_southeast',
      },
    ],
    []
  );

  // Manchas orgânicas de grama e luz filtrada para quebrar a uniformidade do terreno
  const meadowPatches = useMemo(
    () => [
      { id: 'mp1', gx: 2.55, gy: 0.88, rx: 38, ry: 18, color: '#8CC97E', opacity: 0.22 },
      { id: 'mp2', gx: 0.78, gy: 3.65, rx: 32, ry: 15, color: '#276332', opacity: 0.16 },
      { id: 'mp3', gx: 4.48, gy: 3.15, rx: 40, ry: 19, color: '#8CC97E', opacity: 0.19 },
      { id: 'mp4', gx: 6.35, gy: 1.42, rx: 36, ry: 17, color: '#276332', opacity: 0.15 },
      { id: 'mp5', gx: 2.48, gy: 5.55, rx: 42, ry: 20, color: '#8CC97E', opacity: 0.18 },
      { id: 'mp6', gx: 6.45, gy: 5.45, rx: 38, ry: 18, color: '#276332', opacity: 0.16 },
      { id: 'mp7', gx: 0.52, gy: 2.28, rx: 28, ry: 13, color: '#1F5229', opacity: 0.2 },
      { id: 'mp8', gx: 7.75, gy: 3.85, rx: 34, ry: 16, color: '#8CC97E', opacity: 0.17 },
      { id: 'mp9', gx: 4.35, gy: 7.85, rx: 34, ry: 16, color: '#276332', opacity: 0.17 },
    ],
    []
  );

  // 4 Espécies de Árvores: Carvalho Frondoso ('oak'), Pinheiro ('pine'), Macieira ('apple') e Ornamental Florada ('ornamental')
  const trees = useMemo<TreeRenderConfig[]>(
    () => [
      { id: 't1', gx: 0.42, gy: 0.52, scale: 1.07, kind: 'pine', variant: 0, lean: -0.45, zone: 'zone_core', seed: 0.8 },
      { id: 't2', gx: 4.48, gy: 0.44, scale: 1.0, kind: 'oak', variant: 0, lean: 0.55, zone: 'zone_core', seed: 2.1 },
      { id: 't3', gx: 0.34, gy: 2.32, scale: 1.04, kind: 'oak', variant: 1, lean: -0.6, zone: 'zone_core', seed: 3.4 },
      { id: 't4', gx: 0.44, gy: 4.48, scale: 0.96, kind: 'ornamental', variant: 0, lean: 0.4, zone: 'zone_core', seed: 4.9 },
      // Pomar Leste
      { id: 't5', gx: 7.38, gy: 0.58, scale: 1.08, kind: 'apple', variant: 0, lean: -0.5, zone: 'zone_east', seed: 1.5 },
      { id: 't6', gx: 8.32, gy: 1.84, scale: 0.98, kind: 'apple', variant: 1, lean: 0.65, zone: 'zone_east', seed: 2.9 },
      { id: 't7', gx: 8.34, gy: 3.92, scale: 1.02, kind: 'ornamental', variant: 1, lean: -0.4, zone: 'zone_east', seed: 5.2 },
      // Vale Sul
      { id: 't8', gx: 0.42, gy: 6.78, scale: 1.07, kind: 'pine', variant: 2, lean: 0.5, zone: 'zone_south', seed: 3.8 },
      { id: 't9', gx: 4.42, gy: 8.18, scale: 0.99, kind: 'oak', variant: 1, lean: -0.55, zone: 'zone_south', seed: 6.1 },
      // Colina Sudeste
      { id: 't10', gx: 8.32, gy: 6.38, scale: 1.03, kind: 'apple', variant: 2, lean: 0.45, zone: 'zone_southeast', seed: 2.4 },
      { id: 't11', gx: 7.82, gy: 8.28, scale: 1.1, kind: 'pine', variant: 0, lean: -0.5, zone: 'zone_southeast', seed: 4.3 },
    ],
    []
  );

  // Passarinhos campestres pousados em galhos específicos e mourões de cerca, com voos curtos desfasados
  const ambientBirds = useMemo<AmbientBirdConfig[]>(
    () => [
      {
        id: 'bird_1',
        perchGx: 4.48,
        perchGy: 0.44,
        perchHeightY: -31, // Pousado no galho direito do Carvalho t2 (Sede)
        flightArcDx: -38,
        flightArcDy: 24,
        cycleDurationSec: 23,
        phaseOffsetSec: 2.5,
        plumagePrimary: '#2563EB', // Azulão campestre suave
        plumageBreast: '#DBEAFE',
        plumageWing: '#1D4ED8',
        facingLeft: true,
        zone: 'zone_core',
        scale: 0.92,
      },
      {
        id: 'bird_2',
        perchGx: 0.44,
        perchGy: 4.48,
        perchHeightY: -26, // Pousado no patamar da Árvore Ornamental t4 (Sede)
        flightArcDx: 34,
        flightArcDy: 22,
        cycleDurationSec: 29,
        phaseOffsetSec: 14.0,
        plumagePrimary: '#78350F', // Pardal / Tico-tico de peito alaranjado
        plumageBreast: '#FDBA74',
        plumageWing: '#451A03',
        facingLeft: false,
        zone: 'zone_core',
        scale: 0.9,
      },
      {
        id: 'bird_3',
        perchGx: 7.38,
        perchGy: 0.58,
        perchHeightY: -33, // Pousado no galho da Macieira t5 (Pomar Leste)
        flightArcDx: -32,
        flightArcDy: 25,
        cycleDurationSec: 27,
        phaseOffsetSec: 8.2,
        plumagePrimary: '#D97706', // Canário-da-terra dourado
        plumageBreast: '#FEF08A',
        plumageWing: '#92400E',
        facingLeft: true,
        zone: 'zone_east',
        scale: 0.92,
      },
    ],
    []
  );

  const shrubs = useMemo(
    () => [
      { id: 'sh1', gx: 0.38, gy: 1.42, scale: 0.95, hasBerries: true, zone: 'zone_core', seed: 1.1 },
      { id: 'sh2', gx: 3.35, gy: 0.36, scale: 0.88, hasBerries: false, zone: 'zone_core', seed: 2.8 },
      { id: 'sh3', gx: 0.4, gy: 3.45, scale: 0.85, hasBerries: false, zone: 'zone_core', seed: 4.2 },
      { id: 'sh4', gx: 6.15, gy: 0.48, scale: 0.92, hasBerries: true, zone: 'zone_east', seed: 3.1 },
      { id: 'sh5', gx: 8.38, gy: 2.88, scale: 0.9, hasBerries: true, zone: 'zone_east', seed: 5.4 },
      { id: 'sh6', gx: 0.45, gy: 5.75, scale: 0.94, hasBerries: false, zone: 'zone_south', seed: 2.3 },
      { id: 'sh7', gx: 6.45, gy: 8.32, scale: 0.92, hasBerries: true, zone: 'zone_southeast', seed: 4.7 },
    ],
    []
  );

  // Renderizador do Celeiro Principal e Silo com fundação de pedra, telhas e madeira envelhecida acolhedora
  const renderBarn = () => {
    const pos = gridToScreen(1.0, 1.0);
    const bx = pos.x;
    const by = pos.y + 8;

    return (
      <g key="entity_barn" transform={`translate(${bx}, ${by})`}>
        {/* Sombra projetada gradual em 3 camadas e oclusão de contato */}
        <ellipse cx="-8" cy="20" rx="78" ry="34.5" fill="#0B2E1B" opacity="0.22" />
        <ellipse cx="-4" cy="18.5" rx="66" ry="29.5" fill="#072617" opacity="0.28" />
        <ellipse cx="0" cy="17" rx="55" ry="24.5" fill="#051B10" opacity="0.32" />

        {/* Fundação de pedra rústica aquecida na base do celeiro */}
        <polygon
          points="-53,7 0,33 0,27 -53,1"
          fill="#686259"
          stroke="#3F3B36"
          strokeWidth="1"
        />
        <polygon
          points="0,33 53,7 53,1 0,27"
          fill="#968F83"
          stroke="#3F3B36"
          strokeWidth="1"
        />

        {/* Parede Esquerda (Madeira vermelha sombreada com tábuas e veios) */}
        <polygon
          points="-52,3 0,29 0,-22 -52,-48"
          fill="#991B1B"
          stroke="#450A0A"
          strokeWidth="1.5"
        />
        {[-40, -28, -16, -6].map((xOff, i) => {
          const ratio = (xOff + 52) / 52;
          const yBot = 3 + ratio * 26;
          const yTop = -48 + ratio * 26;
          return (
            <line
              key={i}
              x1={xOff}
              y1={yBot}
              x2={xOff}
              y2={yTop}
              stroke="#7F1D1D"
              strokeWidth="1.1"
              opacity="0.8"
            />
          );
        })}

        {/* Parede Direita (Madeira aquecida pelo sol) */}
        <polygon
          points="0,29 52,3 52,-48 0,-22"
          fill="#C82828"
          stroke="#7F1D1D"
          strokeWidth="1.5"
        />
        {[12, 24, 36, 44].map((xOff, i) => {
          const ratio = xOff / 52;
          const yBot = 29 - ratio * 26;
          const yTop = -22 - ratio * 26;
          return (
            <line
              key={i}
              x1={xOff}
              y1={yBot}
              x2={xOff}
              y2={yTop}
              stroke="#991B1B"
              strokeWidth="1.1"
              opacity="0.65"
            />
          );
        })}

        {/* Oitão Frontal Direito */}
        <polygon
          points="0,-22 52,-48 26,-78"
          fill="#DC2626"
          stroke="#7F1D1D"
          strokeWidth="1.5"
        />

        {/* Sombra de oclusão sob o beiral do telhado */}
        <polygon points="-52,-44 0,-18 0,-22 -52,-48" fill="#450A0A" opacity="0.6" />
        <polygon points="0,-18 52,-44 52,-48 0,-22" fill="#450A0A" opacity="0.35" />

        {/* Telhado Esquerdo com fileiras de telhas de madeira */}
        <polygon
          points="-58,-45 -4,-19 26,-78 -28,-104"
          fill="#6D310F"
          stroke="#3E1B06"
          strokeWidth="2"
        />
        <line x1="-47" y1="-57" x2="7" y2="-31" stroke="#3E1B06" strokeWidth="1.3" opacity="0.6" />
        <line x1="-39" y1="-71" x2="15" y2="-45" stroke="#854D0E" strokeWidth="1.3" opacity="0.65" />
        <line x1="-32" y1="-86" x2="22" y2="-60" stroke="#3E1B06" strokeWidth="1.3" opacity="0.55" />

        {/* Telhado Direito iluminado */}
        <polygon
          points="-4,-19 26,-78 58,-45 28,-16"
          fill="#8C4215"
          stroke="#3E1B06"
          strokeWidth="2"
        />
        <line x1="6" y1="-39" x2="38" y2="-26" stroke="#A16207" strokeWidth="1.2" opacity="0.55" />

        {/* Beirais creme chanfrados com relevo */}
        <polyline
          points="-58,-45 -4,-19 26,-78 58,-45"
          fill="none"
          stroke="#FEF3C7"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Porta dupla tradicional com batente profundo e reforços em X */}
        <polygon
          points="11,24 41,9 41,-21 11,-6"
          fill="#450A0A"
        />
        <polygon
          points="12,23 40,9 40,-20 12,-6"
          fill="#7F1D1D"
          stroke="#FEF3C7"
          strokeWidth="2.4"
        />
        <line x1="12" y1="23" x2="40" y2="-20" stroke="#FEF3C7" strokeWidth="2" />
        <line x1="12" y1="-6" x2="40" y2="9" stroke="#FEF3C7" strokeWidth="2" />
        <line x1="26" y1="16" x2="26" y2="-13" stroke="#FEF3C7" strokeWidth="2" />

        {/* Fardos de feno dourados texturizados ao lado da entrada */}
        <g transform="translate(4, 28)">
          <ellipse cx="0" cy="4" rx="9.5" ry="4.6" fill="#022C22" opacity="0.38" />
          <rect x="-7" y="-4" width="14" height="8" rx="2" fill="#EAB308" stroke="#854D0E" strokeWidth="1" />
          <rect x="-6" y="-3.2" width="12" height="3" rx="1" fill="#FEF08A" opacity="0.7" />
          <line x1="-3" y1="-4" x2="-3" y2="4" stroke="#713F12" strokeWidth="0.9" />
          <line x1="3" y1="-4" x2="3" y2="4" stroke="#713F12" strokeWidth="0.9" />
        </g>

        {/* Janela iluminada do Sótão com moldura */}
        <polygon
          points="20,-42 32,-48 32,-60 20,-54"
          fill="#FDE68A"
          stroke="#FFFBEB"
          strokeWidth="2"
        />
        <line x1="26" y1="-45" x2="26" y2="-57" stroke="#92400E" strokeWidth="1" />

        {/* Silo cilíndrico metálico com brilho especular, anéis e escada lateral */}
        <g transform="translate(-54, -14)">
          <ellipse cx="0" cy="20" rx="19.5" ry="9.8" fill="#022C22" opacity="0.4" />
          {/* Base de pedra do silo */}
          <ellipse cx="0" cy="17.5" rx="17" ry="8.5" fill="#64748B" stroke="#334155" strokeWidth="1" />
          <path
            d="M-16,-35 L-16,16 A16,8 0 0,0 16,16 L16,-35 Z"
            fill="#E2E8F0"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Faixa vertical de brilho metálico */}
          <path d="M-9,-35 L-9,22 L-3,23.5 L-3,-35 Z" fill="#FFFFFF" opacity="0.65" />
          {/* Lado direito sombreado do cilindro */}
          <path d="M2,-35 L2,24 A16,8 0 0,0 16,16 L16,-35 Z" fill="#94A3B8" opacity="0.65" />

          {/* Anéis metálicos e rebites */}
          <path d="M-16,-22 A16,6 0 0,0 16,-22" fill="none" stroke="#64748B" strokeWidth="1.2" />
          <path d="M-16,-8 A16,6 0 0,0 16,-8" fill="none" stroke="#64748B" strokeWidth="1.2" />
          <path d="M-16,6 A16,6 0 0,0 16,6" fill="none" stroke="#64748B" strokeWidth="1.2" />

          {/* Escada metálica lateral do silo */}
          <line x1="-11" y1="-32" x2="-11" y2="16" stroke="#475569" strokeWidth="1.1" />
          <line x1="-7" y1="-32" x2="-7" y2="17" stroke="#475569" strokeWidth="1.1" />
          {[-26, -18, -10, -2, 6, 13].map((ry, idx) => (
            <line key={idx} x1="-11" y1={ry} x2="-7" y2={ry + 0.8} stroke="#475569" strokeWidth="1" />
          ))}

          {/* Cúpula vermelha do silo com reflexo */}
          <path
            d="M-16,-35 C-16,-55 16,-55 16,-35 Z"
            fill="#C82828"
            stroke="#7F1D1D"
            strokeWidth="1.5"
          />
          <path
            d="M-8,-36 C-6,-50 4,-50 7,-36 Z"
            fill="#EF4444"
            opacity="0.7"
          />
          <ellipse
            cx="0"
            cy="-35"
            rx="16"
            ry="6"
            fill="#DC2626"
            stroke="#7F1D1D"
            strokeWidth="1.2"
          />
          {/* Tufos de grama abraçando a base de pedra do silo */}
          <path
            d="M-13,20 L-15,15.5 M-4,23.5 L-4.5,19 M8,22.5 L10,18"
            stroke="#255E34"
            strokeWidth="1.15"
            strokeLinecap="round"
          />
        </g>

        {/* Tufos de grama e pedrinhas ancorando a fundação do celeiro ao solo */}
        <path
          d="M-38,15.5 L-40,11.5 M-16,26.5 L-17,22.2 M22,23.5 L23.5,19.2 M44,12.5 L46,8.5"
          stroke="#255E34"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>
    );
  };

  // Renderizador de um Canteiro de Plantação com bordas chanfradas 3D e indicador de colheita discreto
  const renderPlot = (plot: CropPlot, plotIndex: number) => {
    const isZoneUnlocked = unlockedZoneIds.has(plot.zoneId);
    if (!isZoneUnlocked) {
      return (
        <g key={plot.id} opacity="0.28">
          <polygon
            points={getPolygonPoints(
              plot.gridX + 0.08,
              plot.gridY + 0.08,
              0.84,
              0.84
            )}
            fill="#451A03"
            stroke="#78350F"
            strokeWidth="1.5"
          />
        </g>
      );
    }

    const growth = getPlotGrowthInfo(plot, now, weather);
    const center = gridToScreen(plot.gridX + 0.5, plot.gridY + 0.5);
    const cropMeta = plot.cropType ? CROP_CATALOG[plot.cropType] : null;
    const plotSeed = plotIndex * 1.73 + plot.gridX * 0.9 + plot.gridY * 1.3;

    const pLeft = gridToScreen(plot.gridX + 0.06, plot.gridY + 0.94);
    const pBottom = gridToScreen(plot.gridX + 0.94, plot.gridY + 0.94);
    const pRight = gridToScreen(plot.gridX + 0.94, plot.gridY + 0.06);

    return (
      <g
        key={plot.id}
        onClick={() => {
          if (dragRef.current.movedDistance > 6) return;
          onPlotClick(plot);
        }}
        className="cursor-pointer group"
      >
        {/* Sombra de contato externa em duas camadas graduais sob a moldura de madeira */}
        <polygon
          points={getPolygonPoints(
            plot.gridX + 0.01,
            plot.gridY + 0.02,
            0.96,
            0.96,
            6.8
          )}
          fill="#0B2E1B"
          opacity="0.22"
        />
        <polygon
          points={getPolygonPoints(
            plot.gridX + 0.04,
            plot.gridY + 0.04,
            0.92,
            0.92,
            5.8
          )}
          fill="#051B10"
          opacity="0.32"
        />

        {/* Faces laterais 3D da borda de contenção de madeira do canteiro */}
        <polygon
          points={`${pLeft.x},${pLeft.y} ${pBottom.x},${pBottom.y} ${pBottom.x},${pBottom.y + 5.5} ${pLeft.x},${pLeft.y + 5.5}`}
          fill="#43200B"
        />
        <polygon
          points={`${pBottom.x},${pBottom.y} ${pRight.x},${pRight.y} ${pRight.x},${pRight.y + 5.5} ${pBottom.x},${pBottom.y + 5.5}`}
          fill="#63310E"
        />

        {/* Superfície de terra fértil com borda chanfrada */}
        <polygon
          points={getPolygonPoints(
            plot.gridX + 0.06,
            plot.gridY + 0.06,
            0.88,
            0.88
          )}
          fill="url(#soilGradient)"
          stroke={
            growth.isReady
              ? '#EAB308'
              : isRaining
              ? '#38BDF8'
              : '#7C3F1C'
          }
          strokeWidth={growth.isReady ? '2.2' : '1.5'}
        />

        {/* Sombra interna da moldura superior do canteiro para dar profundidade real à caixa de terra */}
        <polyline
          points={`${gridToScreen(plot.gridX + 0.08, plot.gridY + 0.92).x},${
            gridToScreen(plot.gridX + 0.08, plot.gridY + 0.92).y
          } ${gridToScreen(plot.gridX + 0.08, plot.gridY + 0.08).x},${
            gridToScreen(plot.gridX + 0.08, plot.gridY + 0.08).y
          } ${gridToScreen(plot.gridX + 0.92, plot.gridY + 0.08).x},${
            gridToScreen(plot.gridX + 0.92, plot.gridY + 0.08).y
          }`}
          fill="none"
          stroke="#2A1205"
          strokeWidth="1.4"
          opacity="0.45"
        />

        {/* Pequenos fios de grama nas quinas inferiores integrando o canteiro ao gramado */}
        <path
          d={`M${pBottom.x - 6},${pBottom.y + 3.2} L${pBottom.x - 8},${pBottom.y - 0.5} M${
            pBottom.x + 6
          },${pBottom.y + 3.0} L${pBottom.x + 8},${pBottom.y - 0.6}`}
          stroke="#255E34"
          strokeWidth="1.05"
          strokeLinecap="round"
        />

        {/* Arte botânica específica da cultura */}
        <IsometricCropArtwork
          cropType={plot.cropType}
          stage={growth.stage}
          cx={center.x}
          cy={center.y}
          timeSec={animTimeSec}
          windStrength={windStrength}
          isRaining={isRaining}
          plotSeed={plotSeed}
        />

        {/* Indicador de Colheita Pronta elevado e compacto para NUNCA cobrir a planta */}
        {plot.cropType && (
          <g transform={`translate(${center.x}, ${center.y + 15})`}>
            {growth.isReady ? (
              <g className="animate-bounce-ready">
                {/* Pequena seta apontando para a planta pronta */}
                <polygon points="-3.5,-44 3.5,-44 0,-40" fill="#CA8A04" />
                <rect
                  x="-23"
                  y="-58"
                  width="46"
                  height="14"
                  rx="7"
                  fill="#FEF08A"
                  stroke="#CA8A04"
                  strokeWidth="1.3"
                />
                <text
                  x="0"
                  y="-48.5"
                  textAnchor="middle"
                  fill="#713F12"
                  fontSize="8.5"
                  fontWeight="800"
                >
                  COLHER!
                </text>
              </g>
            ) : (
              <g opacity="0.92">
                <rect
                  x="-20"
                  y="-2.5"
                  width="40"
                  height="5"
                  rx="2.5"
                  fill="#0F172A"
                  opacity="0.72"
                />
                <rect
                  x="-19"
                  y="-1.5"
                  width={Math.max(4, (38 * growth.progressPercent) / 100)}
                  height="3"
                  rx="1.5"
                  fill={
                    isRaining
                      ? '#38BDF8'
                      : cropMeta?.colorAccent || '#4ADE80'
                  }
                />
              </g>
            )}
          </g>
        )}

        {/* Dica visual em canteiro vazio */}
        {!plot.cropType && (
          <g
            transform={`translate(${center.x}, ${center.y})`}
            className="opacity-60 group-hover:opacity-100 transition-opacity"
          >
            <circle cx="0" cy="-2" r="8.5" fill="#FEF3C7" opacity="0.85" />
            <text
              x="0"
              y="2"
              textAnchor="middle"
              fontSize="11.5"
              fontWeight="700"
              fill="#78350F"
            >
              +
            </text>
          </g>
        )}

        <title>
          {plot.cropType
            ? `${CROP_CATALOG[plot.cropType].name} — ${STAGE_LABELS[growth.stage]} (${growth.progressPercent}% · ~${growth.remainingSeconds}s com ${weatherMeta.name})`
            : `Terra preparada — Clique para plantar ${CROP_CATALOG[selectedCrop].name}`}
        </title>
      </g>
    );
  };

  // Borboletas campestres estilizadas voando lentamente em trajetórias curvas próximas às flores e bordas verdes
  const butterflies = useMemo<ButterflyFlightConfig[]>(
    () => [
      {
        id: 'bf_1',
        baseGx: 0.72,
        baseGy: 3.35, // Próxima às margaridas e à Árvore Ornamental na borda oeste
        radiusX: 0.42,
        radiusY: 0.55,
        speed: 0.36,
        phase: 0.4,
        wingPrimary: '#FDE047',
        wingSecondary: '#FEF08A',
        wingEdge: '#B45309',
        scale: 0.95,
        zone: 'zone_core',
      },
      {
        id: 'bf_2',
        baseGx: 3.45,
        baseGy: 0.95, // Próxima às flores silvestres azuis e trevos no gramado norte
        radiusX: 0.58,
        radiusY: 0.36,
        speed: 0.31,
        phase: 2.7,
        wingPrimary: '#BAE6FD',
        wingSecondary: '#E0F2FE',
        wingEdge: '#0369A1',
        scale: 0.9,
        zone: 'zone_core',
      },
      {
        id: 'bf_3',
        baseGx: 5.75,
        baseGy: 1.25, // Próxima às flores do Pomar Leste
        radiusX: 0.48,
        radiusY: 0.44,
        speed: 0.34,
        phase: 4.9,
        wingPrimary: '#FBCFE8',
        wingSecondary: '#FCE7F3',
        wingEdge: '#BE185D',
        scale: 0.92,
        zone: 'zone_east',
      },
    ],
    []
  );

  const renderButterflies = () => {
    // Borboletas recolhem-se durante chuva ou noite profunda
    if (isRaining || dayLighting.nightWeight > 0.75) return null;
    const duskFade = Math.max(0.25, 1 - dayLighting.nightWeight * 1.2);

    return (
      <g className="pointer-events-none" opacity={duskFade}>
        {butterflies.map((bf, idx) => {
          if (!unlockedZoneIds.has(bf.zone)) return null;

          // Trajetória curva orgânica (Lissajous suave com harmônico secundário para mudanças delicadas de direção)
          const t = animTimeSec * bf.speed + bf.phase;
          const gx =
            bf.baseGx +
            Math.sin(t) * bf.radiusX +
            Math.cos(t * 1.7 + bf.phase) * (bf.radiusX * 0.25);
          const gy =
            bf.baseGy +
            Math.cos(t * 1.25) * bf.radiusY +
            Math.sin(t * 1.9 + bf.phase) * (bf.radiusY * 0.22);

          // Derivada aproximada para inclinar sutilmente a borboleta na direção da curva
          const dGx = Math.cos(t) * bf.radiusX;
          const dGy = -Math.sin(t * 1.25) * bf.radiusY * 1.25;
          const pos = gridToScreen(gx, gy);
          const nextPos = gridToScreen(gx + dGx * 0.1, gy + dGy * 0.1);
          const headingDeg =
            Math.atan2(nextPos.y - pos.y, nextPos.x - pos.x) * (180 / Math.PI);

          const flutterY = Math.sin(animTimeSec * 3.8 + bf.phase) * 3.2;
          const flapPhase = animTimeSec * (11.5 + idx * 1.2) + bf.phase * 3;

          return (
            <IsometricButterflyArtwork
              key={bf.id}
              screenX={pos.x}
              screenY={pos.y}
              headingDeg={headingDeg}
              flapPhase={flapPhase}
              flutterY={flutterY}
              wingPrimary={bf.wingPrimary}
              wingSecondary={bf.wingSecondary}
              wingEdge={bf.wingEdge}
              scale={bf.scale}
            />
          );
        })}
      </g>
    );
  };

  // Ordenação rigorosa de profundidade (Painter's Algorithm por gx + gy)
  const depthSortedElements = useMemo(() => {
    const items: Array<{ depth: number; node: React.ReactNode }> = [];

    items.push({
      depth: 2.1,
      node: renderBarn(),
    });

    plots.forEach((plot, idx) => {
      items.push({
        depth: plot.gridX + plot.gridY + 0.5,
        node: renderPlot(plot, idx),
      });
    });

    shrubs.forEach((sh) => {
      const pos = gridToScreen(sh.gx, sh.gy);
      items.push({
        depth: sh.gx + sh.gy + 0.08,
        node: (
          <IsometricShrubArtwork
            key={sh.id}
            id={sh.id}
            screenX={pos.x}
            screenY={pos.y}
            scale={sh.scale}
            hasBerries={sh.hasBerries}
            unlocked={unlockedZoneIds.has(sh.zone)}
            timeSec={animTimeSec}
            windStrength={windStrength}
            seed={sh.seed}
          />
        ),
      });
    });

    trees.forEach((t) => {
      const pos = gridToScreen(t.gx, t.gy);
      items.push({
        depth: t.gx + t.gy + 0.15,
        node: (
          <IsometricTreeArtwork
            key={t.id}
            tree={t}
            screenX={pos.x}
            screenY={pos.y}
            unlocked={unlockedZoneIds.has(t.zone)}
            timeSec={animTimeSec}
            windStrength={windStrength}
            isRaining={isRaining}
            isSunny={isSunny}
            dayLighting={dayLighting}
          />
        ),
      });
    });

    // Passarinhos ordenados logo à frente da árvore onde pousam para ficarem visíveis no galho
    ambientBirds.forEach((b) => {
      const pos = gridToScreen(b.perchGx, b.perchGy);
      items.push({
        depth: b.perchGx + b.perchGy + 0.18,
        node: (
          <IsometricBirdArtwork
            key={b.id}
            bird={b}
            baseScreenX={pos.x}
            baseScreenY={pos.y}
            unlocked={unlockedZoneIds.has(b.zone)}
            timeSec={animTimeSec}
            isRaining={isRaining || dayLighting.nightWeight > 0.65}
          />
        ),
      });
    });

    chickens.forEach((chk) => {
      const pos = gridToScreen(chk.x, chk.y);
      items.push({
        depth: chk.x + chk.y + 0.1,
        node: (
          <IsometricChickenArtwork
            key={chk.id}
            chicken={chk}
            screenX={pos.x}
            screenY={pos.y}
            timeSec={animTimeSec}
          />
        ),
      });
    });

    return items.sort((a, b, ) => a.depth - b.depth);
  }, [
    plots,
    shrubs,
    trees,
    ambientBirds,
    chickens,
    animTimeSec,
    now,
    weather,
    unlockedZoneIds,
    selectedCrop,
    windStrength,
    isRaining,
    isSunny,
    dayLighting,
  ]);

  // Pequeno conjunto estático de estrelas discretas no céu superior (zero animações individuais pesadas)
  const nightStars = useMemo(
    () => [
      { cx: 95, cy: 48, r: 1.35, op: 0.85 },
      { cx: 185, cy: 32, r: 1.1, op: 0.7 },
      { cx: 290, cy: 62, r: 1.4, op: 0.9 },
      { cx: 410, cy: 36, r: 1.15, op: 0.75 },
      { cx: 540, cy: 28, r: 1.3, op: 0.8 },
      { cx: 665, cy: 52, r: 1.2, op: 0.72 },
      { cx: 760, cy: 34, r: 1.45, op: 0.88 },
      { cx: 910, cy: 64, r: 1.2, op: 0.78 },
      { cx: 140, cy: 92, r: 1.05, op: 0.65 },
      { cx: 835, cy: 96, r: 1.15, op: 0.68 },
    ],
    []
  );

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onPointerLeave={handlePointerUpOrCancel}
      style={{ touchAction: 'none' }}
      className="relative w-full h-full flex items-center justify-center overflow-hidden select-none cursor-grab"
    >
      {/* Fundo atmosférico contínuo combinando o horário do dia (manhã, dia, fim de tarde, noite) com o clima */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${dayLighting.skyTop} 0%, ${dayLighting.skyMid} 54%, ${dayLighting.skyHorizon} 100%)`,
        }}
      />

      <svg
        viewBox="0 0 1000 720"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full max-w-[1100px] max-h-full relative z-0"
      >
        <defs>
          {/* Paleta de grama campestre naturalista com transição suave entre manhã, meio-dia, fim de tarde e noite */}
          <linearGradient id="islandGrass" x1="78%" y1="6%" x2="22%" y2="96%">
            <stop offset="0%" stopColor={dayLighting.grassTop} />
            <stop offset="48%" stopColor={dayLighting.grassMid} />
            <stop offset="100%" stopColor={dayLighting.grassBottom} />
          </linearGradient>
          {/* Luz direcional suave no quadrante nordeste (dourada de dia/tarde, prateada-azulada à noite) */}
          <radialGradient id="terrainSunGlow" cx="72%" cy="22%" r="64%">
            <stop
              offset="0%"
              stopColor={dayLighting.sunGlowColor}
              stopOpacity={dayLighting.sunGlowOpacity}
            />
            <stop
              offset="55%"
              stopColor={dayLighting.sunGlowMidColor}
              stopOpacity={dayLighting.sunGlowOpacity * 0.35}
            />
            <stop offset="100%" stopColor="#166534" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="soilGradient" x1="80%" y1="0%" x2="20%" y2="100%">
            <stop offset="0%" stopColor={isRaining ? '#5C3516' : '#854D22'} />
            <stop offset="100%" stopColor={isRaining ? '#3B200B' : '#562F12'} />
          </linearGradient>
          <radialGradient id="pondWater" cx="46%" cy="42%" r="64%">
            <stop offset="0%" stopColor={dayLighting.pondDeep} />
            <stop offset="58%" stopColor={dayLighting.pondMid} />
            <stop offset="100%" stopColor={dayLighting.pondShallow} />
          </radialGradient>
          <radialGradient id="sunBurst" cx="82%" cy="14%" r="52%">
            <stop
              offset="0%"
              stopColor={dayLighting.sunBurstColor}
              stopOpacity={dayLighting.sunBurstOpacity}
            />
            <stop
              offset="50%"
              stopColor={dayLighting.sunGlowColor}
              stopOpacity={dayLighting.sunBurstOpacity * 0.32}
            />
            <stop offset="100%" stopColor={dayLighting.sunGlowColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ================= CÉU NOTURNO DISCRETO: PEQUENAS ESTRELAS E LUA ESTILIZADA ================= */}
        {dayLighting.starOpacity > 0.02 && (
          <g className="pointer-events-none" opacity={dayLighting.starOpacity}>
            {nightStars.map((st, idx) => (
              <circle
                key={idx}
                cx={st.cx}
                cy={st.cy}
                r={st.r}
                fill="#F8FAFC"
                opacity={st.op}
              />
            ))}
          </g>
        )}

        {dayLighting.moonOpacity > 0.02 && (
          <g
            className="pointer-events-none"
            opacity={dayLighting.moonOpacity}
            transform={`translate(838, ${74 - dayLighting.nightWeight * 16})`}
          >
            {/* Halo luar muito suave sem filtro blur pesado */}
            <circle cx="0" cy="0" r="26" fill="#BAE6FD" opacity="0.12" />
            <circle cx="0" cy="0" r="18" fill="#E0F2FE" opacity="0.2" />
            {/* Lua crescente estilizada aconchegante */}
            <path
              d="M -4,-11 A 11.5,11.5 0 1,0 9,8 A 9.2,9.2 0 1,1 -4,-11 Z"
              fill="#FEF9C3"
            />
          </g>
        )}

        <g
          ref={cameraGroupRef}
          style={{
            transformOrigin: '500px 360px',
            willChange: 'transform',
          }}
        >
          {/* ================= PLATAFORMA BASE DA MAQUETE ISOMÉTRICA (9x9) ================= */}
          <polygon
            points={getPolygonPoints(0, 0, 9, 9, 36)}
            fill="#022C22"
            opacity="0.46"
          />

          {/* Laterais estratificadas da plataforma (Solo, Subsolo de Argila, Rocha e Borda de Grama) */}
          {(() => {
            const pLeft = gridToScreen(0, 9);
            const pBottom = gridToScreen(9, 9);
            const pRight = gridToScreen(9, 0);
            return (
              <>
                {/* Camada profunda de rocha/subsolo */}
                <polygon
                  points={`${pLeft.x},${pLeft.y + 15} ${pBottom.x},${pBottom.y + 15} ${pBottom.x},${pBottom.y + 28} ${pLeft.x},${pLeft.y + 28}`}
                  fill="#4A2511"
                />
                <polygon
                  points={`${pBottom.x},${pBottom.y + 15} ${pRight.x},${pRight.y + 15} ${pRight.x},${pRight.y + 28} ${pBottom.x},${pBottom.y + 28}`}
                  fill="#633216"
                />
                {/* Camada média de terra rica */}
                <polygon
                  points={`${pLeft.x},${pLeft.y} ${pBottom.x},${pBottom.y} ${pBottom.x},${pBottom.y + 16} ${pLeft.x},${pLeft.y + 16}`}
                  fill="#6E3B19"
                />
                <polygon
                  points={`${pBottom.x},${pBottom.y} ${pRight.x},${pRight.y} ${pRight.x},${pRight.y + 16} ${pBottom.x},${pBottom.y + 16}`}
                  fill="#8A4B22"
                />
                {/* Pedras quentes incrustadas na lateral do terreno */}
                <ellipse cx={(pLeft.x + pBottom.x) * 0.52} cy={(pLeft.y + pBottom.y) * 0.52 + 16} rx="8" ry="4" fill="#686259" opacity="0.72" />
                <ellipse cx={(pBottom.x + pRight.x) * 0.45} cy={(pBottom.y + pRight.y) * 0.45 + 14} rx="9" ry="4.2" fill="#968F83" opacity="0.68" />

                {/* Sombra fina projetada pelo lábio de grama sobre o barranco de terra */}
                <polygon
                  points={`${pLeft.x},${pLeft.y + 7} ${pBottom.x},${pBottom.y + 7} ${pBottom.x},${pBottom.y + 10.5} ${pLeft.x},${pLeft.y + 10.5}`}
                  fill="#2A1205"
                  opacity="0.45"
                />
                <polygon
                  points={`${pBottom.x},${pBottom.y + 7} ${pRight.x},${pRight.y + 7} ${pRight.x},${pRight.y + 10.5} ${pBottom.x},${pBottom.y + 10.5}`}
                  fill="#2A1205"
                  opacity="0.35"
                />

                {/* Borda espessa de grama viva no topo da falésia */}
                <polygon
                  points={`${pLeft.x},${pLeft.y} ${pBottom.x},${pBottom.y} ${pBottom.x},${pBottom.y + 7.5} ${pLeft.x},${pLeft.y + 7.5}`}
                  fill="#236839"
                />
                <polygon
                  points={`${pBottom.x},${pBottom.y} ${pRight.x},${pRight.y} ${pRight.x},${pRight.y + 7.5} ${pBottom.x},${pBottom.y + 7.5}`}
                  fill="#2E7D47"
                />
              </>
            );
          })()}

          {/* Superfície Principal de Grama Campestre Equilibrada */}
          <polygon
            points={getPolygonPoints(0, 0, 9, 9)}
            fill="url(#islandGrass)"
            stroke={dayLighting.grassStroke}
            strokeWidth="1.6"
          />

          {/* Banho sutil de luz solar direcional sobre o relevo do gramado */}
          <polygon
            points={getPolygonPoints(0, 0, 9, 9)}
            fill="url(#terrainSunGlow)"
          />

          {/* Manchas sutis de variação orgânica no gramado */}
          {meadowPatches.map((mp) => {
            const pt = gridToScreen(mp.gx, mp.gy);
            return (
              <ellipse
                key={mp.id}
                cx={pt.x}
                cy={pt.y}
                rx={mp.rx}
                ry={mp.ry}
                fill={mp.color}
                opacity={mp.opacity}
              />
            );
          })}

          {/* Ladrilhos da grade isométrica com variações discretas de subtom */}
          {Array.from({ length: 9 }).map((_, gx) =>
            Array.from({ length: 9 }).map((__, gy) => {
              const isAlt = (gx + gy) % 2 === 0;
              const isSubtleWarm = (gx * 3 + gy * 5) % 4 === 0;
              const isEastZone = gx >= 5 && gy < 5;
              const isSouthZone = gx < 5 && gy >= 5;
              const isSEZone = gx >= 5 && gy >= 5;

              const zoneUnlocked =
                (!isEastZone && !isSouthZone && !isSEZone) ||
                (isEastZone && unlockedZoneIds.has('zone_east')) ||
                (isSouthZone && unlockedZoneIds.has('zone_south')) ||
                (isSEZone && unlockedZoneIds.has('zone_southeast'));

              return (
                <polygon
                  key={`tile_${gx}_${gy}`}
                  points={getPolygonPoints(gx, gy, 1, 1)}
                  fill={
                    !zoneUnlocked
                      ? '#0A3F28'
                      : isAlt
                      ? isSubtleWarm
                        ? '#6FB85F'
                        : '#63B05B'
                      : '#367E39'
                  }
                  fillOpacity={!zoneUnlocked ? 0.34 : isRaining ? 0.14 : 0.19}
                  stroke="#164A25"
                  strokeOpacity="0.1"
                  strokeWidth="0.9"
                />
              );
            })
          )}

          {/* ================= CAMINHOS DE TERRA COM BORDAS ORGÂNICAS SUAVES E SEIXOS ================= */}
          {[
            { gx: 1, gy: 2, w: 1, h: 3 },
            { gx: 1, gy: 4, w: 3, h: 1 },
            { gx: 4, gy: 2, w: 1, h: 3 },
          ].map((path, idx) => (
            <g key={`path_core_${idx}`}>
              {/* Transição externa escura entre grama e terra batida */}
              <polygon
                points={getPolygonPoints(
                  path.gx + 0.06,
                  path.gy + 0.06,
                  path.w - 0.12,
                  path.h - 0.12
                )}
                fill="#2D5A27"
                fillOpacity="0.28"
              />
              <polygon
                points={getPolygonPoints(
                  path.gx + 0.1,
                  path.gy + 0.1,
                  path.w - 0.2,
                  path.h - 0.2
                )}
                fill="#78350F"
                fillOpacity="0.34"
              />
              {/* Leito principal de terra batida sem contorno rígido */}
              <polygon
                points={getPolygonPoints(
                  path.gx + 0.14,
                  path.gy + 0.14,
                  path.w - 0.28,
                  path.h - 0.28
                )}
                fill={isRaining ? '#854D0E' : '#B87333'}
                fillOpacity="0.66"
              />
              {/* Centro levemente mais claro onde há pisoteio */}
              <polygon
                points={getPolygonPoints(
                  path.gx + 0.22,
                  path.gy + 0.22,
                  path.w - 0.44,
                  path.h - 0.44
                )}
                fill={isRaining ? '#A16207' : '#D49452'}
                fillOpacity="0.32"
              />
            </g>
          ))}

          {/* Pedrinhas decorativas embutidas nos caminhos */}
          {[
            { gx: 1.3, gy: 2.6 },
            { gx: 1.7, gy: 3.8 },
            { gx: 2.8, gy: 4.5 },
            { gx: 4.4, gy: 2.8 },
            { gx: 4.5, gy: 4.2 },
          ].map((st, idx) => {
            const pt = gridToScreen(st.gx, st.gy);
            return (
              <g key={`pebble_${idx}`}>
                <ellipse cx={pt.x - 0.3} cy={pt.y + 0.3} rx="2.7" ry="1.45" fill="#451A03" opacity="0.28" />
                <ellipse cx={pt.x} cy={pt.y} rx="2.4" ry="1.25" fill="#8C5828" opacity="0.52" />
              </g>
            );
          })}

          {unlockedZoneIds.has('zone_east') && (
            <g>
              <polygon
                points={getPolygonPoints(4.08, 2.18, 1.84, 0.84)}
                fill="#78350F"
                fillOpacity="0.28"
              />
              <polygon
                points={getPolygonPoints(4.14, 2.24, 1.72, 0.72)}
                fill={isRaining ? '#854D0E' : '#B87333'}
                fillOpacity="0.64"
              />
            </g>
          )}

          {/* Agrupamentos irregulares de flores silvestres, trevos, tufos de grama, pedrinhas e folhas caídas */}
          {groundFlora.map((gf) => {
            const pt = gridToScreen(gf.gx, gf.gy);
            return (
              <IsometricGroundFloraArtwork
                key={gf.id}
                flora={gf}
                screenX={pt.x}
                screenY={pt.y}
                unlocked={unlockedZoneIds.has(gf.zone)}
                timeSec={animTimeSec}
                windStrength={windStrength}
              />
            );
          })}

          {/* Lagoa campestre orgânica na Zona Sul com profundidade, margens naturais, plantas aquáticas e ondulações */}
          {(() => {
            const pPond = gridToScreen(2.25, 8.32);
            return (
              <IsometricPondArtwork
                centerScreenX={pPond.x}
                centerScreenY={pPond.y}
                unlocked={unlockedZoneIds.has('zone_south')}
                timeSec={animTimeSec}
                windStrength={windStrength}
                isRaining={isRaining}
                isSunny={isSunny}
                isBreezy={isBreezy}
                dayLighting={dayLighting}
              />
            );
          })()}

          {/* ================= CERCAS DE MADEIRA 3D COM ESPESSURA, SOMBRAS E BASE DE GRAMA ================= */}
          {(() => {
            const fencePosts = [
              { gx: 0.2, gy: 0.2 },
              { gx: 1.5, gy: 0.2 },
              { gx: 3.0, gy: 0.2 },
              { gx: 4.8, gy: 0.2 },
              { gx: 0.2, gy: 1.6 },
              { gx: 0.2, gy: 3.2 },
              { gx: 0.2, gy: 4.8 },
            ];
            return (
              <g>
                {/* Sombra projetada da cerca para a esquerda-baixo */}
                <line
                  x1={gridToScreen(0.2, 0.2).x - 1.5}
                  y1={gridToScreen(0.2, 0.2).y + 2.5}
                  x2={gridToScreen(4.8, 0.2).x - 1.5}
                  y2={gridToScreen(4.8, 0.2).y + 2.5}
                  stroke="#072617"
                  strokeWidth="4.2"
                  strokeLinecap="round"
                  opacity="0.26"
                />
                <line
                  x1={gridToScreen(0.2, 0.2).x - 1.5}
                  y1={gridToScreen(0.2, 0.2).y + 2.5}
                  x2={gridToScreen(0.2, 4.8).x - 1.5}
                  y2={gridToScreen(0.2, 4.8).y + 2.5}
                  stroke="#072617"
                  strokeWidth="4.2"
                  strokeLinecap="round"
                  opacity="0.26"
                />

                {/* Trilhos de madeira com face superior iluminada e inferior sombreada */}
                <line
                  x1={gridToScreen(0.2, 0.2).x}
                  y1={gridToScreen(0.2, 0.2).y - 10}
                  x2={gridToScreen(4.8, 0.2).x}
                  y2={gridToScreen(4.8, 0.2).y - 10}
                  stroke="#78350F"
                  strokeWidth="3.6"
                />
                <line
                  x1={gridToScreen(0.2, 0.2).x}
                  y1={gridToScreen(0.2, 0.2).y - 11}
                  x2={gridToScreen(4.8, 0.2).x}
                  y2={gridToScreen(4.8, 0.2).y - 11}
                  stroke="#D97706"
                  strokeWidth="1.4"
                />
                <line
                  x1={gridToScreen(0.2, 0.2).x}
                  y1={gridToScreen(0.2, 0.2).y - 4}
                  x2={gridToScreen(4.8, 0.2).x}
                  y2={gridToScreen(4.8, 0.2).y - 4}
                  stroke="#78350F"
                  strokeWidth="3.2"
                />

                <line
                  x1={gridToScreen(0.2, 0.2).x}
                  y1={gridToScreen(0.2, 0.2).y - 10}
                  x2={gridToScreen(0.2, 4.8).x}
                  y2={gridToScreen(0.2, 4.8).y - 10}
                  stroke="#78350F"
                  strokeWidth="3.6"
                />
                <line
                  x1={gridToScreen(0.2, 0.2).x}
                  y1={gridToScreen(0.2, 0.2).y - 11}
                  x2={gridToScreen(0.2, 4.8).x}
                  y2={gridToScreen(0.2, 4.8).y - 11}
                  stroke="#D97706"
                  strokeWidth="1.4"
                />
                <line
                  x1={gridToScreen(0.2, 0.2).x}
                  y1={gridToScreen(0.2, 0.2).y - 4}
                  x2={gridToScreen(0.2, 4.8).x}
                  y2={gridToScreen(0.2, 4.8).y - 4}
                  stroke="#78350F"
                  strokeWidth="3.2"
                />

                {fencePosts.map((fp, i) => {
                  const pt = gridToScreen(fp.gx, fp.gy);
                  return (
                    <g key={i}>
                      <ellipse cx={pt.x - 0.6} cy={pt.y + 1.6} rx="4.6" ry="2.1" fill="#072617" opacity="0.34" />
                      <ellipse cx={pt.x} cy={pt.y + 1.2} rx="3.4" ry="1.4" fill="#4A2C14" opacity="0.65" />
                      <rect
                        x={pt.x - 2.8}
                        y={pt.y - 15}
                        width="5.6"
                        height="16"
                        rx="1.5"
                        fill="#5C2D0C"
                        stroke="#3B1B06"
                        strokeWidth="0.7"
                      />
                      <rect
                        x={pt.x}
                        y={pt.y - 14.5}
                        width="2.2"
                        height="15"
                        rx="0.8"
                        fill="#9A5B25"
                      />
                      {/* Topo chanfrado claro do mourão */}
                      <ellipse cx={pt.x} cy={pt.y - 14.5} rx="2.6" ry="1.2" fill="#FDE68A" />
                      {/* Fios de grama na base do mourão */}
                      <path
                        d={`M${pt.x - 2.2},${pt.y + 1.5} L${pt.x - 3.4},${pt.y - 1.2} M${
                          pt.x + 2.0
                        },${pt.y + 1.5} L${pt.x + 3.2},${pt.y - 1.0}`}
                        stroke="#255E34"
                        strokeWidth="0.95"
                        strokeLinecap="round"
                      />
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {/* ================= ELEMENTOS ORDENADOS POR PROFUNDIDADE ISOMÉTRICA ================= */}
          {depthSortedElements.map((item) => item.node)}

          {/* ================= BORBOLETAS CAMPESTRES OCASIONAIS ================= */}
          {renderButterflies()}

          {/* ================= RESPINGOS E ONDAS DE CHUVA FIXOS NO SOLO ISOMÉTRICO ================= */}
          {isRaining &&
            rainSplashes.map((sp) => {
              if (!unlockedZoneIds.has(sp.zone)) return null;
              const pt = gridToScreen(sp.gx, sp.gy);
              // Ciclo lento e natural de 1.85s por pingo no solo (fixo na coordenada exata pt.x, pt.y)
              const cycle = (animTimeSec * 0.54 + sp.phase) % 1;
              // Nos primeiros 65% do ciclo o pingo bate no chão e abre uma pequena onda concêntrica;
              // nos 35% finais há uma breve pausa antes do próximo pingo cair naquele ponto
              if (cycle > 0.68) return null;
              const p = cycle / 0.68; // 0..1 durante o impacto
              const ringRx = 1.2 + p * 5.8;
              const ringRy = 0.55 + p * 2.5;
              const ringOpacity = (1 - p) * 0.46;
              const crownOpacity = p < 0.45 ? (1 - p / 0.45) * 0.58 : 0;
              const bounceY = Math.sin(Math.min(1, p * 2.2) * Math.PI) * 3.2;

              return (
                <g
                  key={sp.id}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  className="pointer-events-none"
                >
                  {/* Pequeno anel de água se expandindo no exato ponto de impacto no chão (sem sair do lugar) */}
                  <ellipse
                    cx="0"
                    cy="0"
                    rx={ringRx}
                    ry={ringRy}
                    fill="none"
                    stroke="#E0F2FE"
                    strokeWidth="0.95"
                    opacity={ringOpacity}
                  />
                  {/* Micro-gotículas do respingo subindo levemente no instante em que a gota toca o solo */}
                  {crownOpacity > 0.02 && (
                    <g opacity={crownOpacity}>
                      <line
                        x1="-0.8"
                        y1="-0.2"
                        x2={-1.8 - p * 1.4}
                        y2={-0.6 - bounceY}
                        stroke="#E0F2FE"
                        strokeWidth="0.85"
                        strokeLinecap="round"
                      />
                      <line
                        x1="0.8"
                        y1="-0.2"
                        x2={1.6 + p * 1.4}
                        y2={-0.5 - bounceY * 0.9}
                        stroke="#E0F2FE"
                        strokeWidth="0.85"
                        strokeLinecap="round"
                      />
                      <circle cx="0" cy={-0.4 - bounceY * 0.7} r="0.65" fill="#F0F9FF" />
                    </g>
                  )}
                </g>
              );
            })}

          {/* ================= PLACAS DE EXPANSÃO NOS TERRENOS BLOQUEADOS ================= */}
          {zones
            .filter((z) => !z.unlocked)
            .map((zone) => {
              const pos = gridToScreen(zone.centerGridX, zone.centerGridY);
              const boundsMap: Record<
                string,
                { gx: number; gy: number; w: number; h: number }
              > = {
                zone_east: { gx: 5.2, gy: 0.6, w: 3.4, h: 4.1 },
                zone_south: { gx: 0.6, gy: 5.2, w: 4.1, h: 3.4 },
                zone_southeast: { gx: 5.2, gy: 5.2, w: 3.4, h: 3.4 },
              };
              const rect = boundsMap[zone.id];

              return (
                <g
                  key={zone.id}
                  onClick={() => {
                    if (dragRef.current.movedDistance > 6) return;
                    onUnlockZoneClick(zone.id);
                  }}
                  className="cursor-pointer group"
                >
                  {rect && (
                    <polygon
                      points={getPolygonPoints(rect.gx, rect.gy, rect.w, rect.h)}
                      fill="#064E3B"
                      fillOpacity="0.32"
                      stroke="#FEF08A"
                      strokeWidth="2"
                      strokeDasharray="7 5"
                    />
                  )}

                  <g transform={`translate(${pos.x}, ${pos.y - 10})`}>
                    <ellipse cx="0" cy="18" rx="34" ry="12" fill="#022C22" opacity="0.4" />
                    <rect
                      x="-68"
                      y="-28"
                      width="136"
                      height="44"
                      rx="12"
                      fill="#0F172A"
                      fillOpacity="0.88"
                      stroke="#F59E0B"
                      strokeWidth="2"
                    />
                    <text
                      x="0"
                      y="-10"
                      textAnchor="middle"
                      fill="#FEF3C7"
                      fontSize="11.5"
                      fontWeight="700"
                    >
                      🔒 {zone.name}
                    </text>
                    <text
                      x="0"
                      y="7"
                      textAnchor="middle"
                      fill="#FCD34D"
                      fontSize="10.5"
                      fontWeight="600"
                    >
                      +{zone.plotsCount} Canteiros · {zone.cost} Moedas
                    </text>
                  </g>
                </g>
              );
            })}

          {/* ================= FEEDBACK FLUTUANTE DE MOEDAS E XP ================= */}
          {floatingFeedbacks.map((fb) => {
            const pos = gridToScreen(fb.gridX, fb.gridY);
            const fillCol =
              fb.color === 'amber'
                ? '#FEF08A'
                : fb.color === 'emerald'
                ? '#A7F3D0'
                : '#BAE6FD';
            return (
              <g
                key={fb.id}
                transform={`translate(${pos.x}, ${pos.y - 26})`}
                className="animate-float-up pointer-events-none"
              >
                <rect
                  x="-54"
                  y="-18"
                  width="108"
                  height="24"
                  rx="8"
                  fill="#0F172A"
                  fillOpacity="0.85"
                />
                <text
                  x="0"
                  y="-2"
                  textAnchor="middle"
                  fill={fillCol}
                  fontSize="11.5"
                  fontWeight="800"
                >
                  {fb.text}
                </text>
              </g>
            );
          })}
        </g>

        {/* ================= EFEITOS ATMOSFÉRICOS DE HORÁRIO E CLIMA NO SVG ================= */}
        <g className="pointer-events-none">
          {/* Brilho atmosférico superior-direito (solar na manhã/dia/tarde, luar suave à noite) */}
          {dayLighting.sunBurstOpacity > 0.01 && (
            <rect x="0" y="0" width="1000" height="720" fill="url(#sunBurst)" />
          )}

          {/* Feixes sutis de luz diagonal quando ensolarado */}
          {isSunny && dayLighting.rayOpacity > 0.01 && (
            <>
              <polygon
                points="640,0 790,0 490,720 340,720"
                fill={dayLighting.rayColor}
                opacity={dayLighting.rayOpacity}
              />
              <polygon
                points="820,0 960,0 680,720 550,720"
                fill={dayLighting.rayColor}
                opacity={dayLighting.rayOpacity * 0.78}
              />
            </>
          )}

          {/* Véu atmosférico suave de fim de tarde, noite ou chuva (nunca escurece demais nem cobre a UI) */}
          {dayLighting.ambientTintOpacity > 0.005 && (
            <rect
              x="0"
              y="0"
              width="1000"
              height="720"
              fill={dayLighting.ambientTintColor}
              opacity={dayLighting.ambientTintOpacity}
            />
          )}
        </g>

        {isRaining && (
          <g className="pointer-events-none">
            {rainDrops.map((drop) => (
              <line
                key={drop.id}
                x1={drop.x}
                y1={drop.y}
                x2={drop.x - drop.length * 0.22}
                y2={drop.y + drop.length}
                stroke="#E0F2FE"
                strokeWidth={drop.strokeWidth}
                strokeOpacity={drop.opacity}
                strokeLinecap="round"
                className="animate-rain-drop"
                style={{
                  animationDelay: drop.delay,
                  animationDuration: drop.duration,
                }}
              />
            ))}
          </g>
        )}
      </svg>

      {/* Indicador discreto de terreno, período do dia e clima no canto inferior esquerdo */}
      <div className="absolute bottom-3 left-3 pointer-events-none hidden sm:flex items-center gap-2 text-xs font-medium text-emerald-950/90 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm">
        <span>Terrenos: {unlockedCount}/4</span>
        <span aria-hidden="true">·</span>
        <span>
          {dayLighting.icon} {dayLighting.label}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {isRaining ? '🌧️' : isSunny ? '☀️' : isBreezy ? '⛅' : '☀️'} {weatherMeta.name} ({weatherMeta.badgeText})
        </span>
      </div>
    </div>
  );
};
