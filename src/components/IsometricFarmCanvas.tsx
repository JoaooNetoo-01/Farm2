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
  IsometricChickenArtwork,
  IsometricCropArtwork,
  IsometricShrubArtwork,
  IsometricTreeArtwork,
  TreeRenderConfig,
  computeBreezeAngle,
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

  // ================= MOVIMENTAÇÃO DA TELA COM O DEDO / ARRASTO (SEM ALTERAR TAMANHO/ZOOM) =================
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

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

  // Quando um novo terreno é desbloqueado, reposiciona suavemente no enquadramento padrão
  const prevUnlockedCountRef = useRef<number>(unlockedCount);
  useEffect(() => {
    if (unlockedCount !== prevUnlockedCountRef.current) {
      prevUnlockedCountRef.current = unlockedCount;
      setPanOffset({ x: 0, y: 0 });
    }
  }, [unlockedCount]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: panOffset.x,
      initialPanY: panOffset.y,
      movedDistance: 0,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const dist = Math.hypot(dx, dy);
    dragRef.current.movedDistance = Math.max(dragRef.current.movedDistance, dist);

    if (dist > 5 && !isDragging) {
      setIsDragging(true);
    }

    if (dragRef.current.movedDistance > 5) {
      // Sensibilidade reduzida (~0.42) para um movimento bem mais sutil, devagar e controlado
      const panSpeed = 0.42;
      const nextPan = clampPan(
        dragRef.current.initialPanX + dx * panSpeed,
        dragRef.current.initialPanY + dy * panSpeed
      );
      setPanOffset(nextPan);
    }
  };

  const handlePointerUpOrCancel = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsDragging(false);
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

    const tickScene = (currentPerf: number) => {
      const dt = Math.min(0.08, (currentPerf - lastPerf) / 1000);
      lastPerf = currentPerf;
      const elapsedSec = (currentPerf - startPerf) / 1000;

      setAnimTimeSec(elapsedSec);

      setChickens((prevChickens) =>
        prevChickens.map((chk) => {
          if (chk.state !== 'walking') {
            const nextTimer = chk.stateTimer - dt;

            const shouldFlipDirection =
              chk.state === 'looking' &&
              Math.abs(nextTimer - chk.stateDuration * 0.5) < dt * 0.6;

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
          const step = Math.min(dist, speed * dt);
          const nx = chk.x + (dx / dist) * step;
          const ny = chk.y + (dy / dist) * step;

          return {
            ...chk,
            x: nx,
            y: ny,
            walkDistance: chk.walkDistance + step,
          };
        })
      );

      animationFrameId = requestAnimationFrame(tickScene);
    };

    animationFrameId = requestAnimationFrame(tickScene);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const rainDrops = useMemo(
    () =>
      Array.from({ length: 42 }).map((_, idx) => ({
        id: `drop_${idx}`,
        x: 60 + ((idx * 23) % 900),
        y: (idx * 37) % 520,
        delay: `${((idx * 0.13) % 1.15).toFixed(2)}s`,
        duration: `${(0.85 + (idx % 4) * 0.12).toFixed(2)}s`,
        length: 18 + (idx % 3) * 6,
      })),
    []
  );

  const rainSplashes = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, idx) => {
        const gx = 0.8 + ((idx * 1.7) % 7.4);
        const gy = 0.8 + ((idx * 2.3) % 7.4);
        const pt = gridToScreen(gx, gy);
        return {
          id: `splash_${idx}`,
          x: pt.x,
          y: pt.y,
          delay: `${((idx * 0.19) % 1.4).toFixed(2)}s`,
        };
      }),
    []
  );

  // Vegetação rasteira, flores silvestres, folhas caídas e pedrinhas distribuídas organicamente
  const grassTufts = useMemo(
    () => [
      { id: 'gt1', gx: 0.72, gy: 3.12, flower: '#FEF08A', fallenLeaf: '#D97706' },
      { id: 'gt2', gx: 1.34, gy: 5.12, flower: null, fallenLeaf: null },
      { id: 'gt3', gx: 4.42, gy: 1.48, flower: '#FBCFE8', fallenLeaf: '#EA580C' },
      { id: 'gt4', gx: 4.62, gy: 3.58, flower: null, fallenLeaf: '#D97706' },
      { id: 'gt5', gx: 2.52, gy: 1.18, flower: '#FEF08A', fallenLeaf: null },
      { id: 'gt6', gx: 5.62, gy: 1.32, flower: '#BAE6FD', fallenLeaf: '#D97706' },
      { id: 'gt7', gx: 7.22, gy: 4.48, flower: '#FBCFE8', fallenLeaf: null },
      { id: 'gt8', gx: 2.24, gy: 5.42, flower: '#FEF08A', fallenLeaf: '#EA580C' },
      { id: 'gt9', gx: 5.32, gy: 7.42, flower: '#FEF08A', fallenLeaf: null },
      { id: 'gt10', gx: 3.85, gy: 4.82, flower: '#BAE6FD', fallenLeaf: '#D97706' },
      { id: 'gt11', gx: 1.08, gy: 4.88, flower: '#FBCFE8', fallenLeaf: null },
    ],
    []
  );

  // Manchas suaves de grama natural e trevos para quebrar a uniformidade do solo
  const meadowPatches = useMemo(
    () => [
      { id: 'mp1', gx: 2.6, gy: 0.9, rx: 32, ry: 15, color: '#86EFAC', opacity: 0.16 },
      { id: 'mp2', gx: 0.8, gy: 3.6, rx: 28, ry: 13, color: '#15803D', opacity: 0.14 },
      { id: 'mp3', gx: 4.5, gy: 3.2, rx: 36, ry: 17, color: '#86EFAC', opacity: 0.15 },
      { id: 'mp4', gx: 6.4, gy: 1.4, rx: 34, ry: 16, color: '#15803D', opacity: 0.13 },
      { id: 'mp5', gx: 2.5, gy: 5.6, rx: 38, ry: 18, color: '#86EFAC', opacity: 0.14 },
      { id: 'mp6', gx: 6.5, gy: 5.5, rx: 35, ry: 16, color: '#15803D', opacity: 0.14 },
    ],
    []
  );

  const cameraTransform = useMemo(() => {
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

    return `translate(${baseX + panOffset.x}px, ${baseY + panOffset.y}px) scale(${baseScale})`;
  }, [unlockedZoneIds, panOffset.x, panOffset.y]);

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
        {/* Sombra projetada suave e oclusão de contato */}
        <ellipse cx="-6" cy="19" rx="74" ry="33" fill="#022C22" opacity="0.38" />
        <ellipse cx="0" cy="17" rx="58" ry="26" fill="#022C22" opacity="0.32" />

        {/* Fundação de pedra rústica na base do celeiro */}
        <polygon
          points="-53,7 0,33 0,27 -53,1"
          fill="#64748B"
          stroke="#334155"
          strokeWidth="1"
        />
        <polygon
          points="0,33 53,7 53,1 0,27"
          fill="#94A3B8"
          stroke="#334155"
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
        </g>
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
        {/* Sombra de contato externa da moldura de madeira */}
        <polygon
          points={getPolygonPoints(
            plot.gridX + 0.03,
            plot.gridY + 0.03,
            0.94,
            0.94,
            6.5
          )}
          fill="#022C22"
          opacity="0.34"
        />

        {/* Faces laterais 3D da borda de contenção de madeira do canteiro */}
        <polygon
          points={`${pLeft.x},${pLeft.y} ${pBottom.x},${pBottom.y} ${pBottom.x},${pBottom.y + 5.5} ${pLeft.x},${pLeft.y + 5.5}`}
          fill="#3E1D0A"
        />
        <polygon
          points={`${pBottom.x},${pBottom.y} ${pRight.x},${pRight.y} ${pRight.x},${pRight.y + 5.5} ${pBottom.x},${pBottom.y + 5.5}`}
          fill="#5C2D0C"
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
              ? '#FACC15'
              : isRaining
              ? '#38BDF8'
              : '#7C3F1C'
          }
          strokeWidth={growth.isReady ? '2.4' : '1.6'}
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

  // Duas borboletas campestres delicadas voando suavemente em dias sem chuva
  const renderButterflies = () => {
    if (isRaining) return null;

    const butterflies = [
      {
        id: 'bf_1',
        baseGx: 2.8,
        baseGy: 2.8,
        radiusX: 1.3,
        radiusY: 0.9,
        speed: 0.55,
        phase: 0.4,
        wingColor: '#FDE047',
        wingEdge: '#D97706',
      },
      {
        id: 'bf_2',
        baseGx: 4.2,
        baseGy: 3.4,
        radiusX: 1.1,
        radiusY: 1.2,
        speed: 0.48,
        phase: 3.1,
        wingColor: '#BAE6FD',
        wingEdge: '#0284C7',
      },
    ];

    return (
      <g className="pointer-events-none">
        {butterflies.map((bf) => {
          const t = animTimeSec * bf.speed + bf.phase;
          const gx = bf.baseGx + Math.sin(t) * bf.radiusX;
          const gy = bf.baseGy + Math.cos(t * 1.3) * bf.radiusY;
          const pos = gridToScreen(gx, gy);
          const flutterY = Math.sin(animTimeSec * 4.5 + bf.phase) * 4.5;
          const wingScale = 0.35 + Math.abs(Math.sin(animTimeSec * 14 + bf.phase)) * 0.65;

          return (
            <g key={bf.id} transform={`translate(${pos.x}, ${pos.y})`}>
              {/* Sombra pequenina no chão */}
              <ellipse cx="0" cy="4" rx="3.2" ry="1.4" fill="#022C22" opacity="0.22" />
              {/* Borboleta voando acima das plantas */}
              <g transform={`translate(0, ${-26 + flutterY})`}>
                <g transform={`scale(1, ${wingScale})`}>
                  <ellipse
                    cx="-2.6"
                    cy="-1.2"
                    rx="3.2"
                    ry="2.2"
                    transform="rotate(-24 -2.6 -1.2)"
                    fill={bf.wingColor}
                    stroke={bf.wingEdge}
                    strokeWidth="0.45"
                  />
                  <ellipse
                    cx="2.6"
                    cy="-1.2"
                    rx="3.2"
                    ry="2.2"
                    transform="rotate(24 2.6 -1.2)"
                    fill={bf.wingColor}
                    stroke={bf.wingEdge}
                    strokeWidth="0.45"
                  />
                </g>
                <line x1="0" y1="-2.5" x2="0" y2="1.5" stroke="#1E293B" strokeWidth="0.8" strokeLinecap="round" />
              </g>
            </g>
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

    return items.sort((a, b) => a.depth - b.depth);
  }, [plots, shrubs, trees, chickens, animTimeSec, now, weather, unlockedZoneIds, selectedCrop, windStrength]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onPointerLeave={handlePointerUpOrCancel}
      style={{ touchAction: 'none' }}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Fundo atmosférico equilibrado e acolhedor */}
      <div
        className={`absolute inset-0 transition-colors duration-1000 pointer-events-none ${
          isRaining
            ? 'bg-gradient-to-b from-slate-800 via-sky-900/80 to-emerald-950'
            : isSunny
            ? 'bg-gradient-to-b from-amber-100 via-sky-200/75 to-emerald-900'
            : 'bg-gradient-to-b from-sky-200 via-emerald-100/55 to-emerald-900'
        }`}
      />

      {/* OVERLAY SUTIL DE SOL RADIANTE */}
      {isSunny && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
          <div className="animate-sun-pulse absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-200/35 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-100/10 to-amber-200/20" />
        </div>
      )}

      {/* OVERLAY SUTIL DE CHUVA FÉRTIL */}
      {isRaining && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
          <div className="absolute inset-0 bg-sky-950/25 backdrop-blur-[0.5px] transition-opacity duration-700" />
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-slate-900/45 to-transparent" />
        </div>
      )}

      <svg
        viewBox="0 0 1000 720"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full max-w-[1100px] max-h-full drop-shadow-xl relative z-0"
      >
        <defs>
          {/* Paleta de grama natural, equilibrada e sem saturação neon excessiva */}
          <linearGradient id="islandGrass" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor={isRaining ? '#2E7D47' : '#58B359'} />
            <stop offset="52%" stopColor={isRaining ? '#236839' : '#3F9644'} />
            <stop offset="100%" stopColor={isRaining ? '#184F2A' : '#2D7834'} />
          </linearGradient>
          <linearGradient id="soilGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isRaining ? '#5C3516' : '#854D21'} />
            <stop offset="100%" stopColor={isRaining ? '#3D220C' : '#5E3414'} />
          </linearGradient>
          <linearGradient id="pondWater" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <radialGradient id="sunBurst" cx="82%" cy="14%" r="48%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#FDE047" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g
          style={{
            transform: cameraTransform,
            transformOrigin: '500px 360px',
            transition: isDragging
              ? 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)'
              : 'transform 750ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* ================= PLATAFORMA BASE DA MAQUETE ISOMÉTRICA (9x9) ================= */}
          <polygon
            points={getPolygonPoints(0, 0, 9, 9, 36)}
            fill="#022C22"
            opacity="0.48"
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
                {/* Pedras incrustadas na lateral do terreno */}
                <ellipse cx={(pLeft.x + pBottom.x) * 0.52} cy={(pLeft.y + pBottom.y) * 0.52 + 16} rx="8" ry="4" fill="#64748B" opacity="0.7" />
                <ellipse cx={(pBottom.x + pRight.x) * 0.45} cy={(pBottom.y + pRight.y) * 0.45 + 14} rx="9" ry="4.2" fill="#94A3B8" opacity="0.65" />

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
            stroke={isRaining ? '#34D399' : '#86EFAC'}
            strokeWidth="2"
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

          {/* Ladrilhos da grade isométrica com tonalidades suaves e naturais */}
          {Array.from({ length: 9 }).map((_, gx) =>
            Array.from({ length: 9 }).map((__, gy) => {
              const isAlt = (gx + gy) % 2 === 0;
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
                      ? '#064E3B'
                      : isAlt
                      ? '#68C164'
                      : '#36873B'
                  }
                  fillOpacity={!zoneUnlocked ? 0.36 : isRaining ? 0.16 : 0.22}
                  stroke="#14532D"
                  strokeOpacity="0.13"
                  strokeWidth="1"
                />
              );
            })
          )}

          {/* ================= CAMINHOS DE TERRA COM BORDAS SUAVES E SEIXOS ================= */}
          {[
            { gx: 1, gy: 2, w: 1, h: 3 },
            { gx: 1, gy: 4, w: 3, h: 1 },
            { gx: 4, gy: 2, w: 1, h: 3 },
          ].map((path, idx) => (
            <g key={`path_core_${idx}`}>
              <polygon
                points={getPolygonPoints(
                  path.gx + 0.08,
                  path.gy + 0.08,
                  path.w - 0.16,
                  path.h - 0.16
                )}
                fill="#78350F"
                fillOpacity="0.32"
              />
              <polygon
                points={getPolygonPoints(
                  path.gx + 0.13,
                  path.gy + 0.13,
                  path.w - 0.26,
                  path.h - 0.26
                )}
                fill={isRaining ? '#854D0E' : '#C27832'}
                fillOpacity="0.68"
                stroke="#92400E"
                strokeWidth="1"
                strokeOpacity="0.4"
              />
            </g>
          ))}

          {/* Pedrinhas decorativas ao longo dos caminhos */}
          {[
            { gx: 1.3, gy: 2.6 },
            { gx: 1.7, gy: 3.8 },
            { gx: 2.8, gy: 4.5 },
            { gx: 4.4, gy: 2.8 },
            { gx: 4.5, gy: 4.2 },
          ].map((st, idx) => {
            const pt = gridToScreen(st.gx, st.gy);
            return (
              <ellipse
                key={`pebble_${idx}`}
                cx={pt.x}
                cy={pt.y}
                rx="2.6"
                ry="1.4"
                fill="#92400E"
                opacity="0.48"
              />
            );
          })}

          {unlockedZoneIds.has('zone_east') && (
            <polygon
              points={getPolygonPoints(4.1, 2.2, 1.8, 0.8)}
              fill={isRaining ? '#854D0E' : '#C27832'}
              fillOpacity="0.68"
            />
          )}

          {/* Tufos de vegetação rasteira, flores silvestres e folhas caídas */}
          {grassTufts.map((gt, idx) => {
            const pt = gridToScreen(gt.gx, gt.gy);
            const sway = computeBreezeAngle(animTimeSec, idx * 1.7, windStrength, 2.1);
            return (
              <g key={gt.id} transform={`translate(${pt.x}, ${pt.y})`}>
                {gt.fallenLeaf && (
                  <ellipse
                    cx="-4.5"
                    cy="1.5"
                    rx="1.8"
                    ry="0.9"
                    transform="rotate(-18 -4.5 1.5)"
                    fill={gt.fallenLeaf}
                    opacity="0.8"
                  />
                )}
                <g transform={`rotate(${sway})`}>
                  <path
                    d="M0,0 L-3,-5 M0,0 L0,-6.2 M0,0 L3,-5"
                    stroke="#14532D"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                  {gt.flower && (
                    <>
                      <circle cx="0" cy="-6.8" r="2.0" fill={gt.flower} />
                      <circle cx="0" cy="-6.8" r="0.7" fill="#D97706" />
                    </>
                  )}
                </g>
              </g>
            );
          })}

          {/* Lagoa cristalina na Zona Sul com borda de pedras e plantas aquáticas */}
          <g opacity={unlockedZoneIds.has('zone_south') ? 1 : 0.35}>
            <polygon
              points={getPolygonPoints(1.15, 7.95, 2.3, 0.9)}
              fill="#64748B"
              opacity="0.6"
            />
            <polygon
              points={getPolygonPoints(1.2, 8.0, 2.2, 0.8)}
              fill="url(#pondWater)"
              stroke="#BAE6FD"
              strokeWidth="2"
            />
          </g>

          {/* ================= CERCAS DE MADEIRA 3D COM ESPESSURA E SOMBRAS ================= */}
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
                {/* Sombra projetada da cerca */}
                <line
                  x1={gridToScreen(0.2, 0.2).x}
                  y1={gridToScreen(0.2, 0.2).y + 2.5}
                  x2={gridToScreen(4.8, 0.2).x}
                  y2={gridToScreen(4.8, 0.2).y + 2.5}
                  stroke="#022C22"
                  strokeWidth="4"
                  opacity="0.3"
                />
                <line
                  x1={gridToScreen(0.2, 0.2).x}
                  y1={gridToScreen(0.2, 0.2).y + 2.5}
                  x2={gridToScreen(0.2, 4.8).x}
                  y2={gridToScreen(0.2, 4.8).y + 2.5}
                  stroke="#022C22"
                  strokeWidth="4"
                  opacity="0.3"
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
                      <ellipse cx={pt.x} cy={pt.y + 1.5} rx="4.2" ry="2.0" fill="#022C22" opacity="0.38" />
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

          {/* ================= RESPINGOS DE CHUVA NO SOLO ISOMÉTRICO ================= */}
          {isRaining &&
            rainSplashes.map((sp) => (
              <ellipse
                key={sp.id}
                cx={sp.x}
                cy={sp.y}
                rx="7"
                ry="3.5"
                fill="none"
                stroke="#BAE6FD"
                strokeWidth="1.4"
                className="animate-rain-splash pointer-events-none"
                style={{ animationDelay: sp.delay }}
              />
            ))}

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

        {/* ================= EFEITOS ATMOSFÉRICOS DE TELA CHEIA NO SVG ================= */}
        {isSunny && (
          <g className="pointer-events-none">
            <rect x="0" y="0" width="1000" height="720" fill="url(#sunBurst)" />
            <polygon
              points="640,0 790,0 490,720 340,720"
              fill="#FEF08A"
              opacity="0.08"
            />
            <polygon
              points="820,0 960,0 680,720 550,720"
              fill="#FEF08A"
              opacity="0.06"
            />
          </g>
        )}

        {isRaining && (
          <g className="pointer-events-none">
            {rainDrops.map((drop) => (
              <line
                key={drop.id}
                x1={drop.x}
                y1={drop.y}
                x2={drop.x - drop.length * 0.35}
                y2={drop.y + drop.length}
                stroke="#BAE6FD"
                strokeWidth="1.6"
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

      {/* Indicador discreto de clima e escala da câmera no canto inferior esquerdo */}
      <div className="absolute bottom-3 left-3 pointer-events-none hidden sm:flex items-center gap-2 text-xs font-medium text-emerald-950/90 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm">
        <span>Terrenos: {unlockedCount}/4</span>
        <span aria-hidden="true">·</span>
        <span>
          {isRaining ? '🌧️' : isSunny ? '☀️' : isBreezy ? '⛅' : '☀️'} {weatherMeta.name} ({weatherMeta.badgeText})
        </span>
      </div>
    </div>
  );
};
