import React from 'react';
import { ChickenEntity, CropStage, CropType } from '../types/farm';

/**
 * Calcula o ângulo de inclinação suave da brisa (em graus) baseado no tempo real (segundos)
 * e em uma fase única por planta/clump, evitando sincronização artificial.
 * A base (0,0) permanece 100% fixa no solo; apenas caules e pontas giram em torno de (0,0).
 */
export function computeBreezeAngle(
  timeSec: number,
  phaseSeed: number,
  windStrength: number = 1,
  maxAmplitudeDeg: number = 2.4
): number {
  const primaryWave = Math.sin(timeSec * 1.55 + phaseSeed * 2.3);
  const secondaryGust = Math.sin(timeSec * 0.68 + phaseSeed * 4.1) * 0.45;
  const microFlutter = Math.cos(timeSec * 2.9 + phaseSeed * 5.7) * 0.16;
  const directionalBias = 0.2 * windStrength;

  return (
    (primaryWave + secondaryGust + microFlutter + directionalBias) *
    maxAmplitudeDeg *
    windStrength
  );
}

interface CropVisualProps {
  cropType: CropType | null;
  stage: CropStage;
  cx: number;
  cy: number;
  timeSec: number;
  windStrength: number;
  isRaining: boolean;
  plotSeed: number;
}

/**
 * Renderizador Botânico 3D Estilizado em Camadas para cada Cultura (Milho, Trigo, Cenoura)
 * - Sulcos volumétricos de terra arada, torrões orgânicos e sombras de oclusão.
 * - Base 100% ancorada ao solo com sombra de contato.
 * - Volume isométrico em caules, folhas e frutos, com variações sutis de orientação.
 */
export const IsometricCropArtwork: React.FC<CropVisualProps> = ({
  cropType,
  stage,
  cx,
  cy,
  timeSec,
  windStrength,
  isRaining,
  plotSeed,
}) => {
  const soilDark = isRaining ? '#331C0A' : '#4E2E14';
  const soilMid = isRaining ? '#472810' : '#6B3F1D';
  const soilLight = isRaining ? '#5C3516' : '#8A5229';

  // Camada base de sulcos arados isométricos presente em todos os canteiros para integrar a planta ao solo
  const renderSoilFurrows = (dense: boolean) => (
    <g>
      {[
        { x1: -19, y1: -1.5, x2: 1, y2: -11.5 },
        { x1: -10, y1: 3.5, x2: 10, y2: -6.5 },
        { x1: -1, y1: 8.5, x2: 19, y2: -1.5 },
      ].map((f, i) => (
        <g key={i}>
          {/* Face iluminada do camalhão de terra */}
          <line
            x1={cx + f.x1}
            y1={cy + f.y1 + 1.4}
            x2={cx + f.x2}
            y2={cy + f.y2 + 1.4}
            stroke={soilLight}
            strokeWidth={dense ? '3.8' : '3.0'}
            strokeLinecap="round"
            opacity={dense ? '0.72' : '0.45'}
          />
          {/* Vala sombreada do sulco */}
          <line
            x1={cx + f.x1}
            y1={cy + f.y1}
            x2={cx + f.x2}
            y2={cy + f.y2}
            stroke={soilDark}
            strokeWidth={dense ? '2.6' : '2.0'}
            strokeLinecap="round"
            opacity={dense ? '0.88' : '0.62'}
          />
        </g>
      ))}
      {/* Pequenos torrões orgânicos e grãos de solo */}
      <ellipse cx={cx - 13} cy={cy + 1.5} rx="1.8" ry="1.1" fill={soilDark} opacity="0.75" />
      <ellipse cx={cx + 5} cy={cy - 4.5} rx="2.0" ry="1.2" fill={soilMid} opacity="0.7" />
      <ellipse cx={cx + 10} cy={cy + 4} rx="1.6" ry="1.0" fill={soilLight} opacity="0.75" />
      <circle cx={cx - 4} cy={cy - 6} r="1.1" fill={soilDark} opacity="0.6" />
    </g>
  );

  // Estágio 0: Terra preparada vazia com sulcos volumétricos
  if (!cropType || stage === CropStage.PREPARED_SOIL) {
    return renderSoilFurrows(true);
  }

  // Três tufos/plantas por canteiro distribuídos em perspectiva isométrica (ordenados por Y)
  const clumps = [
    { dx: 0, dy: -6.8, seed: plotSeed + 1.1, scale: 0.95, flip: 1 },
    { dx: -13.8, dy: 0.6, seed: plotSeed + 2.7, scale: 1.0, flip: -1 },
    { dx: 13.5, dy: 2.0, seed: plotSeed + 4.3, scale: 1.03, flip: 1 },
  ];

  return (
    <g>
      {renderSoilFurrows(false)}
      {clumps.map((clump, idx) => {
        const px = cx + clump.dx;
        const py = cy + clump.dy;
        const stemBend = computeBreezeAngle(timeSec, clump.seed, windStrength, 2.0);
        const leafBendLeft = computeBreezeAngle(
          timeSec + 0.35,
          clump.seed + 1.9,
          windStrength,
          3.1
        );
        const leafBendRight = computeBreezeAngle(
          timeSec + 0.7,
          clump.seed + 3.2,
          windStrength,
          3.1
        );

        // =========================================================================
        // CULTURA 1: MILHO DOCE (CORN)
        // =========================================================================
        if (cropType === CropType.CORN) {
          if (stage === CropStage.SEEDLING) {
            return (
              <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
                {/* Sombra de oclusão e monte de terra na base */}
                <ellipse cx="0" cy="2.2" rx="6.8" ry="3.0" fill="#241205" opacity="0.68" />
                <path
                  d="M-4.5,1.8 Q0,-0.8 4.5,1.8 Q0,3.2 -4.5,1.8 Z"
                  fill={soilMid}
                />
                <path d="M-1.6,1.6 L-1.1,-2.6 L1.1,-2.6 L1.6,1.6 Z" fill="#14532D" />

                <g transform={`translate(0, -2.2) rotate(${stemBend})`}>
                  {/* Caule central cilíndrico com luz lateral */}
                  <path d="M-1.2,0 L-0.3,-11.8 L0.9,-11.8 L1.2,0 Z" fill="#15803D" />
                  <path d="M0,0 L0.2,-11.5 L0.9,-11.5 L1.0,0 Z" fill="#4ADE80" opacity="0.75" />

                  <g transform={`translate(0, -3.2) rotate(${leafBendLeft})`}>
                    <path
                      d="M0,0 C-4.2,-4.8 -9.8,-4.2 -13,-0.6 C-9.2,-2.2 -4.5,-1.4 0,1.4 Z"
                      fill="#15803D"
                      stroke="#052E16"
                      strokeWidth="0.4"
                    />
                    <path
                      d="M0,0.2 C-4,-3.8 -8.5,-3.5 -11.5,-0.8"
                      stroke="#86EFAC"
                      strokeWidth="0.5"
                      fill="none"
                      opacity="0.6"
                    />
                  </g>

                  <g transform={`translate(0, -4.8) rotate(${leafBendRight})`}>
                    <path
                      d="M0,0 C4.2,-5.2 10,-4.4 13.5,-0.8 C9.5,-2.4 4.5,-1.5 0,1.4 Z"
                      fill="#22C55E"
                      stroke="#14532D"
                      strokeWidth="0.4"
                    />
                    <path
                      d="M0,0.2 C4,-4 8.8,-3.6 12,-0.9"
                      stroke="#BBF7D0"
                      strokeWidth="0.55"
                      fill="none"
                      opacity="0.7"
                    />
                  </g>
                </g>
              </g>
            );
          }

          if (stage === CropStage.GROWING) {
            return (
              <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
                <ellipse cx="0" cy="2.6" rx="8.2" ry="3.8" fill="#1F1004" opacity="0.72" />
                <path d="M-5.2,2.0 Q0,-1.2 5.2,2.0 Q0,3.6 -5.2,2.0 Z" fill={soilMid} />
                <path d="M-2.2,2.1 L-1.5,-4.2 L1.5,-4.2 L2.2,2.1 Z" fill="#14532D" />

                <g transform={`translate(0, -3.2) rotate(${stemBend})`}>
                  <path
                    d="M-1.7,0 L-1.0,-19.5 L1.0,-19.5 L1.7,0 Z"
                    fill="#15803D"
                    stroke="#052E16"
                    strokeWidth="0.5"
                  />
                  {/* Face iluminada do colmo */}
                  <path d="M0,0 L0.2,-19.2 L0.9,-19.2 L1.3,0 Z" fill="#4ADE80" opacity="0.55" />
                  <line x1="-1.4" y1="-6" x2="1.4" y2="-6" stroke="#86EFAC" strokeWidth="0.75" />
                  <line x1="-1.2" y1="-12.5" x2="1.2" y2="-12.5" stroke="#86EFAC" strokeWidth="0.75" />

                  <g transform={`translate(-1, -5.2) rotate(${leafBendLeft * 0.8})`}>
                    <path
                      d="M0,0 C-5.5,-5.2 -12,-4.5 -15.5,0.8 C-11.2,-1.8 -5.2,-1.2 0,1.6 Z"
                      fill="#14532D"
                    />
                    <path
                      d="M0,0.3 C-5,-4.2 -10.5,-3.6 -14,0.4"
                      stroke="#4ADE80"
                      strokeWidth="0.55"
                      fill="none"
                      opacity="0.65"
                    />
                  </g>
                  <g transform={`translate(1, -7.2) rotate(${leafBendRight * 0.8})`}>
                    <path
                      d="M0,0 C5.5,-5.8 12,-4.5 16,0.2 C11.5,-2.2 5.2,-1.4 0,1.6 Z"
                      fill="#16A34A"
                    />
                    <path
                      d="M0,0.3 C5,-4.5 10.5,-3.6 14.2,0"
                      stroke="#86EFAC"
                      strokeWidth="0.6"
                      fill="none"
                      opacity="0.7"
                    />
                  </g>

                  <g transform={`translate(-0.8, -13.2) rotate(${leafBendLeft})`}>
                    <path
                      d="M0,0 C-4.8,-6.2 -10.5,-6.5 -14,-2.4 C-9.8,-4 -4.5,-2.5 0,1.4 Z"
                      fill="#16A34A"
                    />
                  </g>
                  <g transform={`translate(0.8, -14.8) rotate(${leafBendRight})`}>
                    <path
                      d="M0,0 C4.8,-6.8 10.5,-6.5 14,-2.4 C9.8,-4 4.5,-2.5 0,1.4 Z"
                      fill="#22C55E"
                    />
                    <path
                      d="M0,0.2 C4.2,-5.5 9,-5.2 12.2,-2.2"
                      stroke="#BBF7D0"
                      strokeWidth="0.55"
                      fill="none"
                      opacity="0.75"
                    />
                  </g>
                </g>
              </g>
            );
          }

          // Estágio 3: Milho Adulto Pronto para Colheita
          return (
            <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
              <ellipse cx="0" cy="3.0" rx="9.6" ry="4.4" fill="#1C0E03" opacity="0.76" />
              <path d="M-5.8,2.2 Q0,-1.4 5.8,2.2 Q0,4.0 -5.8,2.2 Z" fill={soilMid} />
              <path d="M-2.3,2.3 L-1.6,-4.8 L1.6,-4.8 L2.3,2.3 Z" fill="#14532D" />

              <g transform={`translate(0, -4.2) rotate(${stemBend * 0.85})`}>
                <path
                  d="M-1.8,0 L-1.0,-24.5 L1.0,-24.5 L1.8,0 Z"
                  fill="#14532D"
                  stroke="#052E16"
                  strokeWidth="0.5"
                />
                <path d="M0,0 L0.2,-24.2 L0.9,-24.2 L1.4,0 Z" fill="#22C55E" opacity="0.6" />

                <g transform={`translate(-1.2, -6) rotate(${leafBendLeft * 0.7})`}>
                  <path d="M0,0 C-6,-5.2 -13.5,-4 -17,1.8 C-12,-1.5 -5.5,-1 0,2 Z" fill="#14532D" />
                </g>
                <g transform={`translate(1.2, -8) rotate(${leafBendRight * 0.7})`}>
                  <path d="M0,0 C6,-5.5 13.5,-4 17,1.8 C12,-1.5 5.5,-1 0,2 Z" fill="#15803D" />
                </g>
                <g transform={`translate(-1, -15.2) rotate(${leafBendLeft})`}>
                  <path d="M0,0 C-5.5,-6.2 -12,-6 -15.5,-1.5 C-10.5,-3.5 -5,-2 0,1.6 Z" fill="#16A34A" />
                </g>
                <g transform={`translate(1, -17.2) rotate(${leafBendRight})`}>
                  <path d="M0,0 C5.5,-6.2 12,-6 15.5,-1.5 C10.5,-3.5 5,-2 0,1.6 Z" fill="#22C55E" />
                </g>

                {/* Pendão florido dourado no topo */}
                <g transform={`translate(0, -24.5) rotate(${leafBendLeft * 1.1})`}>
                  <path
                    d="M0,0 L-3.8,-5.8 M0,0 L0,-7 M0,0 L3.8,-5.8"
                    stroke="#FDE047"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                  />
                </g>

                {/* Espiga Esquerda volumétrica */}
                <g transform="translate(-4.0, -12.5) rotate(-19)">
                  <ellipse cx="0" cy="0" rx="3.8" ry="7.4" fill="#EAB308" stroke="#713F12" strokeWidth="0.8" />
                  <ellipse cx="0.6" cy="-0.4" rx="2.4" ry="5.8" fill="#FEF08A" opacity="0.85" />
                  <line x1="-1.6" y1="-4" x2="1.6" y2="-4" stroke="#A16207" strokeWidth="0.7" />
                  <line x1="-2.1" y1="-1" x2="2.1" y2="-1" stroke="#A16207" strokeWidth="0.7" />
                  <line x1="-1.8" y1="2" x2="1.8" y2="2" stroke="#A16207" strokeWidth="0.7" />
                  <path
                    d="M-3.8,2.2 Q0,8.8 3.8,2.2 L2.0,7.0 L-2.0,7.0 Z"
                    fill="#16A34A"
                    stroke="#052E16"
                    strokeWidth="0.5"
                  />
                </g>

                {/* Espiga Direita volumétrica */}
                <g transform="translate(4.3, -16.2) rotate(19)">
                  <ellipse cx="0" cy="0" rx="3.5" ry="6.8" fill="#FACC15" stroke="#713F12" strokeWidth="0.8" />
                  <ellipse cx="0.5" cy="-0.5" rx="2.1" ry="5.2" fill="#FEF9C3" opacity="0.85" />
                  <line x1="-1.5" y1="-3.2" x2="1.5" y2="-3.2" stroke="#A16207" strokeWidth="0.7" />
                  <line x1="-1.9" y1="0" x2="1.9" y2="0" stroke="#A16207" strokeWidth="0.7" />
                  <line x1="-1.5" y1="3" x2="1.5" y2="3" stroke="#A16207" strokeWidth="0.7" />
                  <path
                    d="M-3.5,1.8 Q0,7.8 3.5,1.8 L1.6,6.2 L-1.6,6.2 Z"
                    fill="#22C55E"
                    stroke="#14532D"
                    strokeWidth="0.5"
                  />
                </g>
              </g>
            </g>
          );
        }

        // =========================================================================
        // CULTURA 2: TRIGO DOURADO (WHEAT)
        // =========================================================================
        if (cropType === CropType.WHEAT) {
          const stalks = [
            { xOff: -4.8, angleBase: -10, hScale: 0.88, phase: 0.2 },
            { xOff: -2.4, angleBase: -4.5, hScale: 0.96, phase: 0.6 },
            { xOff: 0, angleBase: 0, hScale: 1.05, phase: 1.1 },
            { xOff: 2.4, angleBase: 4.5, hScale: 0.95, phase: 1.5 },
            { xOff: 4.8, angleBase: 10, hScale: 0.86, phase: 2.0 },
          ];

          if (stage === CropStage.SEEDLING) {
            return (
              <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
                <ellipse cx="0" cy="2.1" rx="6.8" ry="2.8" fill="#241205" opacity="0.68" />
                <path d="M-5,1.8 Q0,-0.8 5,1.8 Q0,3.2 -5,1.8 Z" fill={soilMid} />
                {stalks.map((st, sIdx) => {
                  const sway = computeBreezeAngle(timeSec, clump.seed + st.phase, windStrength, 2.5);
                  const h = 11.5 * st.hScale;
                  return (
                    <g
                      key={sIdx}
                      transform={`translate(${st.xOff * 0.78}, 1.2) rotate(${st.angleBase + sway})`}
                    >
                      <path
                        d={`M-0.75,0 Q-0.35,${-h * 0.6} 0,${-h} Q0.55,${-h * 0.6} 0.75,0 Z`}
                        fill={sIdx % 2 === 0 ? '#65A30D' : '#84CC16'}
                      />
                    </g>
                  );
                })}
              </g>
            );
          }

          if (stage === CropStage.GROWING) {
            return (
              <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
                <ellipse cx="0" cy="2.5" rx="7.8" ry="3.4" fill="#1F1004" opacity="0.72" />
                <path d="M-5.5,2.0 Q0,-1 5.5,2.0 Q0,3.5 -5.5,2.0 Z" fill={soilMid} />
                {stalks.map((st, sIdx) => {
                  const sway = computeBreezeAngle(timeSec, clump.seed + st.phase, windStrength, 2.9);
                  const h = 19.5 * st.hScale;
                  return (
                    <g
                      key={sIdx}
                      transform={`translate(${st.xOff * 0.85}, 1.2) rotate(${st.angleBase * 0.8 + sway})`}
                    >
                      <path
                        d={`M0,0 Q${st.angleBase * 0.12},${-h * 0.5} 0,${-h}`}
                        stroke={sIdx % 2 === 0 ? '#4D7C0F' : '#65A30D'}
                        strokeWidth="1.7"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <path
                        d={`M0,${-h * 0.45} Q${sIdx % 2 === 0 ? -4.2 : 4.2},${-h * 0.65} ${
                          sIdx % 2 === 0 ? -5.8 : 5.8
                        },${-h * 0.55}`}
                        stroke="#84CC16"
                        strokeWidth="1.15"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <ellipse
                        cx="0"
                        cy={-h - 1.6}
                        rx="2.0"
                        ry="4.5"
                        fill="#84CC16"
                        stroke="#3F6212"
                        strokeWidth="0.65"
                      />
                      <ellipse cx="0.5" cy={-h - 2} rx="1" ry="3" fill="#BEF264" opacity="0.7" />
                    </g>
                  );
                })}
              </g>
            );
          }

          // Estágio 3: Trigo Dourado Maduro
          return (
            <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
              <ellipse cx="0" cy="2.9" rx="9.2" ry="4.0" fill="#1C0E03" opacity="0.76" />
              <path d="M-6,2.2 Q0,-1.2 6,2.2 Q0,3.8 -6,2.2 Z" fill={soilMid} />
              {stalks.map((st, sIdx) => {
                const sway = computeBreezeAngle(timeSec, clump.seed + st.phase, windStrength, 3.2);
                const h = 23.5 * st.hScale;
                return (
                  <g
                    key={sIdx}
                    transform={`translate(${st.xOff}, 1.4) rotate(${st.angleBase * 0.9 + sway})`}
                  >
                    <path
                      d={`M0,0 Q${st.angleBase * 0.15},${-h * 0.55} 0,${-h}`}
                      stroke={sIdx % 2 === 0 ? '#A16207' : '#CA8A04'}
                      strokeWidth="1.85"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M0,${-h - 5} L-2.2,${-h - 9.8} M0,${-h - 5.5} L0,${-h - 10.8} M0,${-h - 5} L2.2,${-h - 9.8}`}
                      stroke="#FEF08A"
                      strokeWidth="0.7"
                      strokeLinecap="round"
                    />
                    <ellipse
                      cx="0"
                      cy={-h - 2.2}
                      rx="2.6"
                      ry="6.0"
                      fill="#EAB308"
                      stroke="#713F12"
                      strokeWidth="0.8"
                    />
                    <circle cx="-0.8" cy={-h - 4.2} r="1.15" fill="#FEF08A" />
                    <circle cx="0.8" cy={-h - 2.6} r="1.15" fill="#FDE047" />
                    <circle cx="-0.8" cy={-h - 1.0} r="1.15" fill="#FEF08A" />
                    <circle cx="0.8" cy={-h + 0.5} r="1.15" fill="#FDE047" />
                  </g>
                );
              })}
            </g>
          );
        }

        // =========================================================================
        // CULTURA 3: CENOURA (CARROT)
        // =========================================================================
        const frondLeftSway = computeBreezeAngle(timeSec, clump.seed + 0.4, windStrength, 2.7);
        const frondCenterSway = computeBreezeAngle(
          timeSec + 0.4,
          clump.seed + 1.2,
          windStrength,
          2.3
        );
        const frondRightSway = computeBreezeAngle(
          timeSec + 0.8,
          clump.seed + 2.1,
          windStrength,
          2.7
        );

        if (stage === CropStage.SEEDLING) {
          return (
            <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
              <ellipse cx="0" cy="2.1" rx="6.4" ry="2.8" fill="#241205" opacity="0.68" />
              <path d="M-4.6,1.8 Q0,-0.8 4.6,1.8 Q0,3.2 -4.6,1.8 Z" fill={soilMid} />
              <ellipse cx="0" cy="1.1" rx="2.4" ry="1.2" fill="#EA580C" />

              <g transform={`translate(-1, 0.5) rotate(${-22 + frondLeftSway})`}>
                <path d="M0,0 L0,-7.8" stroke="#15803D" strokeWidth="1.05" strokeLinecap="round" />
                <circle cx="-1.8" cy="-3.6" r="1.55" fill="#16A34A" />
                <circle cx="1.6" cy="-4.6" r="1.45" fill="#22C55E" />
                <circle cx="-1.5" cy="-6.3" r="1.65" fill="#22C55E" />
                <circle cx="0" cy="-8.0" r="1.75" fill="#4ADE80" />
              </g>

              <g transform={`translate(0, 0.5) rotate(${frondCenterSway})`}>
                <path d="M0,0 L0,-9.2" stroke="#14532D" strokeWidth="1.15" strokeLinecap="round" />
                <circle cx="-2.1" cy="-4.3" r="1.65" fill="#16A34A" />
                <circle cx="2.1" cy="-4.3" r="1.65" fill="#22C55E" />
                <circle cx="-1.6" cy="-7.2" r="1.65" fill="#4ADE80" />
                <circle cx="1.6" cy="-7.2" r="1.65" fill="#4ADE80" />
                <circle cx="0" cy="-9.2" r="1.85" fill="#86EFAC" />
              </g>

              <g transform={`translate(1, 0.5) rotate(${22 + frondRightSway})`}>
                <path d="M0,0 L0,-7.8" stroke="#15803D" strokeWidth="1.05" strokeLinecap="round" />
                <circle cx="-1.6" cy="-4.6" r="1.45" fill="#16A34A" />
                <circle cx="1.8" cy="-3.6" r="1.55" fill="#22C55E" />
                <circle cx="1.5" cy="-6.3" r="1.65" fill="#4ADE80" />
                <circle cx="0" cy="-8.0" r="1.75" fill="#86EFAC" />
              </g>
            </g>
          );
        }

        if (stage === CropStage.GROWING) {
          return (
            <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
              <ellipse cx="0" cy="2.5" rx="7.8" ry="3.4" fill="#1F1004" opacity="0.72" />
              <path d="M-5.2,2.0 Q0,-1 5.2,2.0 Q0,3.5 -5.2,2.0 Z" fill={soilMid} />
              <path
                d="M-3.8,1.6 C-3.8,-2.2 3.8,-2.2 3.8,1.6 Z"
                fill="#EA580C"
                stroke="#9A3412"
                strokeWidth="0.8"
              />

              {[
                { rot: -26 + frondLeftSway, h: 13.2, col1: '#14532D', col2: '#16A34A' },
                { rot: frondCenterSway, h: 15.8, col1: '#15803D', col2: '#22C55E' },
                { rot: 26 + frondRightSway, h: 13.2, col1: '#15803D', col2: '#4ADE80' },
              ].map((fr, fIdx) => (
                <g key={fIdx} transform={`translate(0, -0.5) rotate(${fr.rot})`}>
                  <path
                    d={`M0,0 L0,${-fr.h}`}
                    stroke="#052E16"
                    strokeWidth="1.35"
                    strokeLinecap="round"
                  />
                  <ellipse
                    cx="-2.7"
                    cy={-fr.h * 0.38}
                    rx="2.7"
                    ry="1.45"
                    transform={`rotate(-20 -2.7 ${-fr.h * 0.38})`}
                    fill={fr.col1}
                  />
                  <ellipse
                    cx="2.7"
                    cy={-fr.h * 0.38}
                    rx="2.7"
                    ry="1.45"
                    transform={`rotate(20 2.7 ${-fr.h * 0.38})`}
                    fill={fr.col1}
                  />
                  <ellipse
                    cx="-2.9"
                    cy={-fr.h * 0.68}
                    rx="2.9"
                    ry="1.55"
                    transform={`rotate(-25 -2.9 ${-fr.h * 0.68})`}
                    fill={fr.col2}
                  />
                  <ellipse
                    cx="2.9"
                    cy={-fr.h * 0.68}
                    rx="2.9"
                    ry="1.55"
                    transform={`rotate(25 2.9 ${-fr.h * 0.68})`}
                    fill={fr.col2}
                  />
                  <circle cx="0" cy={-fr.h} r="2.35" fill={fr.col2} />
                </g>
              ))}
            </g>
          );
        }

        // Estágio 3: Cenoura Pronta para Colheita!
        return (
          <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
            <ellipse cx="0" cy="3.1" rx="8.8" ry="3.9" fill="#1C0E03" opacity="0.78" />

            <g transform="translate(0, -5.4)">
              {[
                { rot: -32 + frondLeftSway, h: 14.2, col1: '#14532D', col2: '#16A34A' },
                { rot: -11 + frondCenterSway * 0.9, h: 16.8, col1: '#15803D', col2: '#22C55E' },
                { rot: 11 + frondCenterSway * 1.1, h: 16.2, col1: '#15803D', col2: '#4ADE80' },
                { rot: 32 + frondRightSway, h: 14.2, col1: '#166534', col2: '#22C55E' },
              ].map((fr, fIdx) => (
                <g key={fIdx} transform={`rotate(${fr.rot})`}>
                  <path
                    d={`M0,0 L0,${-fr.h}`}
                    stroke="#052E16"
                    strokeWidth="1.35"
                    strokeLinecap="round"
                  />
                  <ellipse
                    cx="-2.8"
                    cy={-fr.h * 0.42}
                    rx="2.8"
                    ry="1.5"
                    transform={`rotate(-22 -2.8 ${-fr.h * 0.42})`}
                    fill={fr.col1}
                  />
                  <ellipse
                    cx="2.8"
                    cy={-fr.h * 0.42}
                    rx="2.8"
                    ry="1.5"
                    transform={`rotate(22 2.8 ${-fr.h * 0.42})`}
                    fill={fr.col1}
                  />
                  <ellipse
                    cx="-3"
                    cy={-fr.h * 0.72}
                    rx="3"
                    ry="1.6"
                    transform={`rotate(-25 -3 ${-fr.h * 0.72})`}
                    fill={fr.col2}
                  />
                  <ellipse
                    cx="3"
                    cy={-fr.h * 0.72}
                    rx="3"
                    ry="1.6"
                    transform={`rotate(25 3 ${-fr.h * 0.72})`}
                    fill={fr.col2}
                  />
                  <circle cx="0" cy={-fr.h} r="2.45" fill={fr.col2} />
                </g>
              ))}
            </g>

            {/* Corpo cônico 3D da cenoura com luz e sombra de volume */}
            <path
              d="M-5.6,-4.6 C-5.8,-8.0 5.8,-8.0 5.6,-4.6 L3.4,2.9 C1.6,4.4 -1.6,4.4 -3.4,2.9 Z"
              fill="#EA580C"
              stroke="#7C2D12"
              strokeWidth="1"
            />
            <path
              d="M-2.2,-5.8 C0.5,-6.6 3.5,-6.2 4.4,-4.6 L2.4,2.4 C0.8,3.2 -0.6,3.0 -1.4,2.2 Z"
              fill="#FB923C"
            />
            <ellipse cx="1.5" cy="-3.5" rx="1.2" ry="2.2" fill="#FDBA74" opacity="0.65" />
            <line
              x1="-3.5"
              y1="-3.2"
              x2="2.2"
              y2="-3.2"
              stroke="#FFEDD5"
              strokeWidth="0.85"
              strokeLinecap="round"
              opacity="0.75"
            />
            <line
              x1="-2.4"
              y1="-0.6"
              x2="2.8"
              y2="-0.6"
              stroke="#9A3412"
              strokeWidth="0.85"
              strokeLinecap="round"
              opacity="0.75"
            />
            {/* Colar de terra fofa abraçando a cenoura */}
            <path
              d="M-6.2,2.3 Q-3.0,0.5 0,2.3 Q3.0,0.5 6.2,2.3 Q3.2,4.4 -3.2,4.4 Z"
              fill={soilDark}
              opacity="0.9"
            />
          </g>
        );
      })}
    </g>
  );
};

interface ChickenVisualProps {
  chicken: ChickenEntity;
  screenX: number;
  screenY: number;
  timeSec: number;
}

/**
 * Renderizador 3D Estilizado das Galinhas (Pipoca e Canjica)
 * - Sombras suaves de contato, plumagem em camadas com brilho de topo e oclusão no peito.
 */
export const IsometricChickenArtwork: React.FC<ChickenVisualProps> = ({
  chicken,
  screenX,
  screenY,
  timeSec,
}) => {
  const isWalking = chicken.state === 'walking';
  const isPecking = chicken.state === 'pecking';
  const isLooking = chicken.state === 'looking';

  const stridePhase = chicken.walkDistance * 21;

  const leftLegAngle = isWalking ? Math.sin(stridePhase) * 28 : 0;
  const rightLegAngle = isWalking ? -Math.sin(stridePhase) * 28 : 0;
  const leftFootLift = isWalking ? Math.max(0, -Math.cos(stridePhase)) * 2.4 : 0;
  const rightFootLift = isWalking ? Math.max(0, Math.cos(stridePhase)) * 2.4 : 0;

  let peckProgress = 0;
  if (isPecking && chicken.stateDuration > 0) {
    const norm = 1 - chicken.stateTimer / chicken.stateDuration;
    peckProgress = Math.pow(Math.max(0, Math.sin(norm * Math.PI * 2)), 1.6);
  }

  const bodyBounceY = isWalking
    ? -Math.abs(Math.sin(stridePhase)) * 1.6
    : Math.sin(timeSec * 3.2 + chicken.seedOffset) * 0.4;

  const bodyPitchDeg = isPecking
    ? peckProgress * 26
    : isWalking
    ? Math.sin(stridePhase * 2) * 3.5
    : 0;

  const headBobDeg = isPecking
    ? peckProgress * 34
    : isWalking
    ? Math.cos(stridePhase) * 8
    : isLooking
    ? Math.sin(timeSec * 5 + chicken.seedOffset) * 10
    : Math.sin(timeSec * 2.2 + chicken.seedOffset) * 2.5;

  const tailWagDeg = isWalking
    ? Math.sin(stridePhase * 2) * 7
    : isPecking
    ? -peckProgress * 12
    : Math.sin(timeSec * 2.8 + chicken.seedOffset) * 3;

  const isWhite = chicken.featherColor === 'white';
  const bodyBase = isWhite ? '#FFFBEB' : '#F59E0B';
  const bodyHighlight = isWhite ? '#FFFFFF' : '#FDE68A';
  const bodyShade = isWhite ? '#CBD5E1' : '#B45309';
  const wingColor = isWhite ? '#E2E8F0' : '#D97706';
  const strokeCol = isWhite ? '#475569' : '#78350F';
  const flip = chicken.facingLeft ? -1 : 1;

  return (
    <g transform={`translate(${screenX}, ${screenY})`}>
      {/* Sombra de contato gradual sob a galinha */}
      <ellipse cx="0" cy="4.2" rx="11.2" ry="5.0" fill="#022C22" opacity="0.34" />
      <ellipse cx="0" cy="4.0" rx="7.2" ry="3.2" fill="#022C22" opacity="0.28" />

      <g transform={`scale(${flip}, 1)`}>
        {/* Perna Traseira */}
        <g
          transform={`translate(-2.2, -1.5) rotate(${leftLegAngle}) translate(0, ${-leftFootLift})`}
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="5.2"
            stroke="#C2410C"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M-1.5,5.2 L2.2,5.2 M0,5.2 L1.8,6.2"
            stroke="#C2410C"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>

        {/* Perna Frontal */}
        <g
          transform={`translate(2.2, -1.2) rotate(${rightLegAngle}) translate(0, ${-rightFootLift})`}
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="5.2"
            stroke="#EA580C"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M-1.5,5.2 L2.4,5.2 M0,5.2 L2,6.2"
            stroke="#EA580C"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </g>

        {/* Corpo Articulado */}
        <g transform={`translate(0, ${-5.6 + bodyBounceY}) rotate(${bodyPitchDeg})`}>
          {/* Cauda emplumada em leque */}
          <g transform={`translate(-7.5, -1) rotate(${tailWagDeg})`}>
            <path
              d="M0,1 C-4.2,-2.2 -7.0,-6.4 -5.8,-9.0 C-3,-7.2 -1,-4 1,-1 Z"
              fill={bodyShade}
              stroke={strokeCol}
              strokeWidth="0.85"
            />
            <path
              d="M0,2 C-4.8,0 -7.4,-3.2 -6.8,-5.8 C-3.5,-4.5 -1.5,-2 1,0 Z"
              fill={bodyBase}
              stroke={strokeCol}
              strokeWidth="0.85"
            />
          </g>

          {/* Volume principal do corpo */}
          <ellipse
            cx="0"
            cy="0"
            rx="9.4"
            ry="7.0"
            fill={bodyBase}
            stroke={strokeCol}
            strokeWidth="1.15"
          />
          {/* Brilho dorsal solar */}
          <ellipse cx="0.5" cy="-3.2" rx="6.2" ry="2.8" fill={bodyHighlight} opacity="0.65" />
          {/* Sombra inferior de volume */}
          <path
            d="M-8.2,2 C-4,6.9 5,6.9 8.6,1.5 C5,4.9 -4,4.9 -8.2,2 Z"
            fill={bodyShade}
            opacity="0.85"
          />

          {/* Asa lateral esculpida */}
          <g transform={`translate(-1, 0.3) rotate(${isWalking ? Math.sin(stridePhase) * 4.5 : 0})`}>
            <ellipse
              cx="0"
              cy="0"
              rx="5.4"
              ry="3.6"
              fill={wingColor}
              stroke={strokeCol}
              strokeWidth="0.9"
            />
            <path
              d="M-3.2,0.4 Q-1,2.2 2.4,1.1 M-2.2,-1.0 Q0,0.5 2.8,-0.2"
              stroke={strokeCol}
              strokeWidth="0.6"
              fill="none"
              opacity="0.55"
            />
          </g>

          {/* Pescoço e Cabeça Articulada */}
          <g transform={`translate(6.2, -4.3) rotate(${headBobDeg})`}>
            <ellipse cx="3.2" cy="2.7" rx="1.6" ry="2.3" fill="#DC2626" />
            <circle
              cx="0"
              cy="0"
              r="5.3"
              fill={bodyBase}
              stroke={strokeCol}
              strokeWidth="1.15"
            />
            <ellipse cx="0.6" cy="-2.2" rx="3.2" ry="1.8" fill={bodyHighlight} opacity="0.6" />
            <path
              d="M-2.6,-4.5 C-2.6,-8.8 0,-8.8 0.2,-5 C1,-9.0 3.4,-8.4 2.9,-4.5 C4.2,-7.2 5.4,-5.6 3.9,-3.2 Z"
              fill="#EF4444"
              stroke="#991B1B"
              strokeWidth="0.7"
            />
            <polygon
              points="4.2,-1.6 9.6,0.2 4.2,1.9"
              fill="#FACC15"
              stroke="#A16207"
              strokeWidth="0.75"
            />
            <circle cx="1.9" cy="-1.0" r="1.3" fill="#0F172A" />
            <circle cx="2.2" cy="-1.35" r="0.48" fill="#FFFFFF" />
          </g>
        </g>

        {isPecking && peckProgress > 0.72 && (
          <g transform="translate(13.5, 3.2)">
            <circle cx="0" cy="-1.5" r="1.15" fill="#78350F" opacity="0.85" />
            <circle cx="2.5" cy="-2.8" r="0.95" fill="#B45309" opacity="0.8" />
            <circle cx="-1.8" cy="-2.5" r="0.85" fill="#FACC15" opacity="0.9" />
          </g>
        )}
      </g>
    </g>
  );
};

export interface TreeRenderConfig {
  id: string;
  gx: number;
  gy: number;
  scale: number;
  kind: 'oak' | 'pine' | 'apple' | 'ornamental';
  variant: 0 | 1 | 2;
  lean: number;
  zone: string;
  seed: number;
}

interface IsometricTreeArtworkProps {
  tree: TreeRenderConfig;
  screenX: number;
  screenY: number;
  unlocked: boolean;
  timeSec: number;
  windStrength: number;
}

/**
 * Renderizador Botânico 3D Estilizado para as 4 Espécies de Árvores:
 * 1. 'oak' (Carvalho Frondoso): Copa assimétrica com múltiplas massas foliares irregulares, tronco robusto com casca sulcada e galhos aparentes.
 * 2. 'pine' (Pinheiro Campestre): Saias em camadas esculpidas e irregulares (sem triângulos rígidos), agulhas iluminadas à direita e tronco alto contínuo.
 * 3. 'apple' (Macieira Frutífera): Copa acolhedora verde-esmeralda com maçãs brilhantes e pequenas flores brancas entre as folhas.
 * 4. 'ornamental' (Árvore Ornamental Florada / Ipê-Cerejeira do Campo): Tronco esguio claro com galhos graciosos e folhagem em nuvens orgânicas floridas.
 *
 * Todas as curvas usam exclusivamente caminhos orgânicos Bézier (zero círculos geométricos perfeitos na copa).
 */
export const IsometricTreeArtwork: React.FC<IsometricTreeArtworkProps> = ({
  tree,
  screenX,
  screenY,
  unlocked,
  timeSec,
  windStrength,
}) => {
  const { kind, variant, lean, seed, scale } = tree;

  const swayLeft = computeBreezeAngle(timeSec, seed + 0.3, windStrength, 1.35);
  const swayRight = computeBreezeAngle(timeSec + 0.45, seed + 1.9, windStrength, 1.45);
  const swayTop = computeBreezeAngle(timeSec + 0.9, seed + 3.4, windStrength, 1.6);
  const swayFront = computeBreezeAngle(timeSec + 1.3, seed + 4.8, windStrength, 1.15);

  const leanX = lean * 3.8;

  // ===========================================================================
  // ESPÉCIE 1: PINHEIRO CAMPESTRE ESCULPIDO ('pine')
  // ===========================================================================
  if (kind === 'pine') {
    const hVar = variant === 0 ? 1.0 : variant === 1 ? 0.93 : 1.07;
    const wVar = variant === 0 ? 1.0 : variant === 1 ? 1.09 : 0.94;

    return (
      <g
        transform={`translate(${screenX}, ${screenY}) scale(${scale})`}
        opacity={unlocked ? 1 : 0.46}
      >
        {/* Sombra projetada suave + oclusão de contato sob as raízes */}
        <ellipse
          cx={3 + leanX * 0.4}
          cy="1.4"
          rx={19.5 * wVar}
          ry={8.8 * wVar}
          fill="#022C22"
          opacity="0.26"
        />
        <ellipse cx="0" cy="0.9" rx="9.2" ry="4.1" fill="#022C22" opacity="0.46" />
        <ellipse cx="0" cy="0.9" rx="7.4" ry="3.1" fill="#4A2C11" opacity="0.8" />

        {/* Camada profunda de agulhas atrás do tronco */}
        <g transform={`translate(${leanX * 0.25}, -14) rotate(${swayLeft * 0.4})`}>
          <path
            d={`M0,-16 C${-11 * wVar},-11 ${-22 * wVar},-3 ${-23 * wVar},3.5 C${-16 * wVar},6.5 ${-7 * wVar},6 0,4.5 C${7 * wVar},6 ${16 * wVar},6.5 ${23 * wVar},3.5 C${22 * wVar},-3 ${11 * wVar},-11 0,-16 Z`}
            fill="#064E3B"
          />
        </g>

        {/* Tronco contínuo avermelhado com raízes e galhos internos */}
        <g>
          <path
            d={`M-6.6,1.8 Q-4.0,-2 -3.3,-13 L${leanX - 1.2},${-48 * hVar} L${leanX + 1.2},${-48 * hVar} L3.3,-13 Q4.0,-2 6.6,1.8 Q0,3.0 -6.6,1.8 Z`}
            fill="#4A2511"
            stroke="#2E1508"
            strokeWidth="0.75"
          />
          <path
            d={`M-0.6,2.0 L-0.3,-13 L${leanX + 0.9},${-46 * hVar} L2.9,-13 Q3.6,-2 5.6,1.5 Q2,2.4 -0.6,2.0 Z`}
            fill="#7C3F1C"
          />
          <path
            d="M-5.8,1.3 Q-3.2,0.2 -1.5,1.9 M5.2,1.3 Q2.6,0.4 1.2,1.9"
            stroke="#2E1508"
            strokeWidth="0.85"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M-1.8,-14 Q-9,-12 ${-15 * wVar},-9.5 M1.8,-15 Q9,-13 ${15 * wVar},-10.5 M${leanX * 0.5 - 1.2},-26 Q-7,-24 ${-11.5 * wVar},-21.5 M${leanX * 0.5 + 1.2},-27 Q7,-25 ${11.5 * wVar},-22.5`}
            stroke="#3B1B06"
            strokeWidth="2.1"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* 1ª Saia Inferior (Lobos assimétricos orgânicos) */}
        <g transform={`translate(${leanX * 0.3}, -15.5) rotate(${swayLeft * 0.6})`}>
          <path
            d={`M-1,-12 C${-10 * wVar},-8.5 ${-20 * wVar},-1.5 ${-22 * wVar},4.2 C${-17 * wVar},7.5 ${-11 * wVar},5.2 ${-7 * wVar},6.2 C${-4 * wVar},6.8 -2,4.5 -1,2.8 Z`}
            fill="#114229"
            stroke="#052E16"
            strokeWidth="0.6"
          />
          <path
            d={`M1,-12 C${10 * wVar},-8.5 ${20 * wVar},-1.5 ${22 * wVar},4.2 C${17 * wVar},7.5 ${11 * wVar},5.2 ${7 * wVar},6.2 C${4 * wVar},6.8 2,4.5 1,2.8 Z`}
            fill="#165B36"
            stroke="#052E16"
            strokeWidth="0.6"
          />
          <path
            d={`M0,-12.5 C-5,-7.5 -9.5,0 -4.5,4.2 C-1,5.4 3,5.4 6.5,3.8 C11,0 7,-7.5 0,-12.5 Z`}
            fill="#1E7A46"
          />
          <path
            d={`M2,-9 C7,-5 14,0 17,3.5 C12,5 6,4 2,1.8 Z`}
            fill="#34A861"
            opacity="0.75"
          />
        </g>

        {/* 2ª Saia Intermediária */}
        <g transform={`translate(${leanX * 0.6}, ${-28.5 * hVar}) rotate(${swayRight * 0.8})`}>
          <path
            d={`M0,-14 C${-8.5 * wVar},-8.5 ${-17 * wVar},-1.5 ${-18 * wVar},4.2 C${-13 * wVar},7.2 ${-6 * wVar},5.2 -0.6,2.5 L0.8,2.5 C${6 * wVar},5.2 ${13 * wVar},7.2 ${18 * wVar},4.2 C${17 * wVar},-1.5 ${8.5 * wVar},-8.5 0,-14 Z`}
            fill="#165B36"
            stroke="#052E16"
            strokeWidth="0.6"
          />
          <path
            d={`M0,-14 C${4.5 * wVar},-9 ${13.5 * wVar},-2 ${15.5 * wVar},3.5 C${10.5 * wVar},5.6 ${4.5 * wVar},4.8 0,2.2 Z`}
            fill="#279253"
          />
          <path
            d="M-4,-2.5 C-1,1 4,1.2 8,-1.2 C5,-6.5 -1,-6.5 -4,-2.5 Z"
            fill="#4ADE80"
            opacity="0.65"
          />
        </g>

        {/* 3ª Saia Alta */}
        <g transform={`translate(${leanX * 0.85}, ${-39.5 * hVar}) rotate(${swayFront * 0.9})`}>
          <path
            d={`M0,-13 C${-6.5 * wVar},-8 ${-13.5 * wVar},-1.5 ${-14 * wVar},3.2 C${-9 * wVar},5.8 9,5.8 ${14 * wVar},3.2 C${13.5 * wVar},-1.5 ${6.5 * wVar},-8 0,-13 Z`}
            fill="#1E7A46"
            stroke="#052E16"
            strokeWidth="0.55"
          />
          <path
            d={`M0,-13 C${3.5 * wVar},-8 ${10.5 * wVar},-1.5 ${11.5 * wVar},2.8 C${7 * wVar},4.8 2,4.2 0,2.2 Z`}
            fill="#34A861"
          />
        </g>

        {/* Ponteira Cônica Esculpida */}
        <g transform={`translate(${leanX}, ${-49 * hVar}) rotate(${swayTop})`}>
          <path
            d={`M0,-13 C${-4.5 * wVar},-7.5 ${-8.5 * wVar},-1.5 ${-9 * wVar},2.5 C${-5 * wVar},4.8 5,4.8 ${9 * wVar},2.5 C${8.5 * wVar},-1.5 ${4.5 * wVar},-7.5 0,-13 Z`}
            fill="#279253"
            stroke="#114229"
            strokeWidth="0.55"
          />
          <path
            d={`M0,-13 C${2.8 * wVar},-7.5 ${6.8 * wVar},-1.5 ${7.2 * wVar},2.2 C${4 * wVar},3.8 1,3.5 0,1.8 Z`}
            fill="#6EE7B7"
            opacity="0.8"
          />
        </g>

        {/* Grama e raízes frontais */}
        <path
          d="M-3.8,1.9 L-5.2,-1.5 M-1.8,2.2 L-1.6,-1.2 M2.6,2.1 L4.0,-1.4"
          stroke="#15803D"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>
    );
  }

  // ===========================================================================
  // ESPÉCIE 2: PEQUENA ÁRVORE ORNAMENTAL FLORADA ('ornamental')
  // ===========================================================================
  if (kind === 'ornamental') {
    const leftBX = variant === 0 ? -11 : -12.5;
    const leftBY = -21;
    const rightBX = variant === 0 ? 11.5 : 10;
    const rightBY = -20;
    const topBX = leanX * 0.8;
    const topBY = -28.5;

    return (
      <g
        transform={`translate(${screenX}, ${screenY}) scale(${scale})`}
        opacity={unlocked ? 1 : 0.46}
      >
        <ellipse cx={2 + leanX * 0.4} cy="1.2" rx="17" ry="7.6" fill="#022C22" opacity="0.25" />
        <ellipse cx="0" cy="0.8" rx="7.8" ry="3.4" fill="#022C22" opacity="0.46" />
        <ellipse cx="0" cy="0.8" rx="6.4" ry="2.7" fill="#4A2C11" opacity="0.75" />

        {/* Folhagem profunda traseira */}
        <g transform={`translate(${leanX * 0.25}, -20) rotate(${swayLeft * 0.35})`}>
          <path
            d="M-16,3 C-19,-3 -15,-11 -8,-13 C-3,-16 5,-16 9,-13 C16,-11 19,-3 16,3 C12,8 5,9 0,8 C-5,9 -12,8 -16,3 Z"
            fill="#115E59"
          />
        </g>

        {/* Tronco esguio claro e galhos sinuosos */}
        <g>
          <path
            d={`M-5.4,1.5 C-3.6,-1 -2.8,-6 -2.6,-14.5 L${leftBX},${leftBY} L${leftBX + 1.8},${leftBY - 1.5} L-0.9,-16 L${topBX - 0.9},${topBY} L${topBX + 1.0},${topBY} L1.0,-16 L${rightBX - 1.6},${rightBY - 1.5} L${rightBX},${rightBY} L2.6,-14.5 C2.8,-6 3.6,-1 5.4,1.5 C2.4,2.4 -2.4,2.4 -5.4,1.5 Z`}
            fill="#6B4423"
            stroke="#3E2410"
            strokeWidth="0.7"
          />
          <path
            d={`M-0.4,1.8 L0,-15.5 L${topBX + 0.9},${topBY} L1.0,-16 L${rightBX - 0.4},${rightBY - 0.5} L2.4,-14 C2.6,-6 3.3,-1 4.8,1.3 C2.5,2.0 0.8,2.0 -0.4,1.8 Z`}
            fill="#9C6B3B"
          />
        </g>

        {/* Nuvem Esquerda de Folhagem e Flores */}
        <g transform={`translate(${leftBX}, ${leftBY}) rotate(${swayLeft})`}>
          <path
            d="M-8,4 C-12,0 -10,-7 -4,-9 C1,-11 7,-9 8,-4 C9,0 6,4 1,5 C-3,6 -6,5 -8,4 Z"
            fill="#0F766E"
            stroke="#042F2E"
            strokeWidth="0.55"
          />
          <path
            d="M-6,2 C-8,-2 -5,-6 0,-7.5 C4,-8 7,-5 6,-1 C5,2 0,3 -6,2 Z"
            fill="#14B8A6"
          />
          {unlocked && (
            <>
              <circle cx="-3.5" cy="-2.5" r="2.1" fill="#F472B6" />
              <circle cx="-3.5" cy="-2.5" r="0.8" fill="#FEF08A" />
              <circle cx="2" cy="-4.5" r="1.8" fill="#FBCFE8" />
            </>
          )}
        </g>

        {/* Nuvem Direita */}
        <g transform={`translate(${rightBX}, ${rightBY}) rotate(${swayRight})`}>
          <path
            d="M-7,4 C-9,0 -7,-6 -2,-8.5 C3,-11 9,-8 10,-3 C11,1 7,5 2,5.5 C-2,6 -5,5 -7,4 Z"
            fill="#0F766E"
            stroke="#042F2E"
            strokeWidth="0.55"
          />
          <path
            d="M-4,2 C-5,-2 -2,-6 3,-7 C7,-7 9,-3 8,0.5 C6,3 1,3.5 -4,2 Z"
            fill="#2DD4BF"
          />
          {unlocked && (
            <>
              <circle cx="3" cy="-2" r="2.2" fill="#F472B6" />
              <circle cx="3" cy="-2" r="0.8" fill="#FEF08A" />
              <circle cx="-1.5" cy="-4" r="1.7" fill="#F9A8D4" />
            </>
          )}
        </g>

        {/* Coroa Superior Florada */}
        <g transform={`translate(${topBX}, ${topBY}) rotate(${swayTop})`}>
          <path
            d="M-11,3.5 C-14,-2 -10,-9 -4,-10.5 C2,-13 9,-11 11.5,-6 C14,-2 11,4 6,5.5 C1,7 -7,6.5 -11,3.5 Z"
            fill="#0D9488"
            stroke="#042F2E"
            strokeWidth="0.55"
          />
          <path
            d="M-7,1.5 C-9,-3 -5,-8 1,-9 C6,-9.5 10,-6 9,-1.5 C8,2 2,3.5 -7,1.5 Z"
            fill="#5EEAD4"
            opacity="0.85"
          />
          {unlocked && (
            <>
              <circle cx="-2.5" cy="-3.5" r="2.3" fill="#EC4899" />
              <circle cx="-2.5" cy="-3.5" r="0.9" fill="#FEF08A" />
              <circle cx="4" cy="-5" r="2.0" fill="#F472B6" />
              <circle cx="4" cy="-5" r="0.7" fill="#FEF08A" />
              <circle cx="1" cy="-0.5" r="1.7" fill="#FBCFE8" />
            </>
          )}
        </g>

        {/* Tufos de grama e florzinhas caídas na base */}
        <circle cx="-5.5" cy="1.8" r="1.1" fill="#F472B6" opacity="0.85" />
        <circle cx="4.8" cy="2.1" r="0.9" fill="#FBCFE8" opacity="0.85" />
        <path
          d="M-2.8,2.0 L-3.8,-1.0 M2.2,2.0 L3.4,-1.0"
          stroke="#15803D"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </g>
    );
  }

  // ===========================================================================
  // ESPÉCIES 3 E 4: CARVALHO FRONDOSO ('oak') E MACIEIRA ('apple')
  // Silhuetas 100% esculpidas com curvas Bézier assimétricas (zero esferas perfeitas)
  // ===========================================================================
  const isApple = kind === 'apple';
  const leafShadow = isApple ? '#0F3F22' : '#064E3B';
  const leafDark = isApple ? '#14532D' : '#115E38';
  const leafMid = isApple ? '#16A34A' : '#229954';
  const leafLight = isApple ? '#4ADE80' : '#58D68D';
  const leafSun = isApple ? '#86EFAC' : '#A9DFBF';

  const leftBranchX = variant === 0 ? -13.5 : variant === 1 ? -15.5 : -12.0;
  const leftBranchY = variant === 0 ? -25.0 : variant === 1 ? -23.0 : -26.5;
  const rightBranchX = variant === 0 ? 14.0 : variant === 1 ? 12.0 : 15.5;
  const rightBranchY = variant === 0 ? -24.0 : variant === 1 ? -26.0 : -23.0;
  const topBranchX = leanX + (variant === 1 ? -1.8 : variant === 2 ? 2.0 : 0);
  const topBranchY = variant === 0 ? -34.5 : variant === 1 ? -33.0 : -36.0;

  return (
    <g
      transform={`translate(${screenX}, ${screenY}) scale(${scale})`}
      opacity={unlocked ? 1 : 0.46}
    >
      {/* 1. Sombra projetada suave + Sombra de oclusão firme sob o tronco */}
      <ellipse
        cx={3 + leanX * 0.5}
        cy="1.4"
        rx="21"
        ry="9.2"
        fill="#022C22"
        opacity="0.26"
      />
      <ellipse cx="0" cy="0.9" rx="9.5" ry="4.2" fill="#022C22" opacity="0.48" />

      {/* 2. Colar de solo orgânico, raízes e vegetação traseira */}
      <ellipse cx="0" cy="0.9" rx="7.8" ry="3.3" fill="#4A2C11" opacity="0.82" />
      <path
        d="M-7.2,0.4 L-9.0,-3.2 M7.0,0.4 L8.8,-3.0"
        stroke="#14532D"
        strokeWidth="1.25"
        strokeLinecap="round"
      />

      {/* 3. CAMADA DE FOLHAGEM TRASEIRA PROFUNDA (Silhueta orgânica lobada com curvas Bézier) */}
      <g transform={`translate(${leanX * 0.3}, -23.5) rotate(${swayLeft * 0.35})`}>
        <path
          d="M-20,4.5 C-24,-1 -22,-9 -16,-12.5 C-13,-17 -6,-19 0,-17.5 C6,-19 14,-17 17,-12 C23,-8.5 24,-0.5 19.5,4.5 C16,9.5 9,10.5 3,9.5 C-2,10.5 -15,9.5 -20,4.5 Z"
          fill={leafShadow}
          stroke="#052E16"
          strokeWidth="0.7"
        />
        <path
          d="M-18,3 C-20,-2 -16,-8 -9,-9 C-4,-6 -4,3 -10,5 C-14,6 -17,5 -18,3 Z"
          fill={leafDark}
        />
        <path
          d="M9,-9 C16,-8 20,-2 18,3 C17,5 14,6 10,5 C4,3 4,-6 9,-9 Z"
          fill={leafDark}
        />
      </g>

      {/* 4. TRONCO ESCULPIDO, CASCA TEXTURIZADA, NÓS DE MADEIRA E GALHOS RAMIFICADOS */}
      <g>
        <path
          d={`M-7.5,1.7 C-5.0,-1 -4.0,-7 -3.7,-16.8 L${leftBranchX},${leftBranchY} L${
            leftBranchX + 2.3
          },${leftBranchY - 1.9} L-1.3,-18.8 L${topBranchX - 1.2},${topBranchY} L${
            topBranchX + 1.3
          },${topBranchY} L1.5,-18.8 L${rightBranchX - 2.1},${rightBranchY - 1.9} L${rightBranchX},${rightBranchY} L3.7,-16.8 C4.0,-7 5.0,-1 7.5,1.7 C3.4,3.0 -3.4,3.0 -7.5,1.7 Z`}
          fill="#54280E"
          stroke="#2E1508"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />

        {/* Face direita iluminada pelo sol */}
        <path
          d={`M-0.6,2.2 C-0.4,-5 -0.2,-11 0.1,-17.8 L${topBranchX + 1.2},${topBranchY} L1.5,-18.8 L${
            rightBranchX - 0.5
          },${rightBranchY - 0.6} L3.4,-16.2 C3.7,-7 4.6,-1 6.6,1.5 C3.6,2.4 1.0,2.4 -0.6,2.2 Z`}
          fill="#8A4B19"
        />

        {/* Sub-galhos ramificados penetrando nos tufos de folhas */}
        <path
          d={`M${leftBranchX * 0.65},${leftBranchY * 0.85} L${leftBranchX * 0.55 - 3.5},${
            leftBranchY - 6.5
          } M${rightBranchX * 0.65},${rightBranchY * 0.85} L${rightBranchX * 0.55 + 3.5},${
            rightBranchY - 6.5
          }`}
          stroke="#3E1D0A"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Sulcos orgânicos da casca e pequeno nó de madeira */}
        <path
          d="M-2.3,1.2 C-1.9,-4 -1.7,-9 -1.9,-14.5 M1.7,1.4 C1.9,-3 1.7,-8 1.5,-13.5"
          stroke="#2E1508"
          strokeWidth="0.75"
          fill="none"
          strokeLinecap="round"
          opacity="0.75"
        />
        <ellipse cx="-1.2" cy="-8.5" rx="1.1" ry="1.6" fill="#3E1D0A" stroke="#7C3F1C" strokeWidth="0.4" />
        <path
          d="M-6.6,1.4 Q-3.6,0.2 -1.6,2.0 M6.0,1.3 Q3.3,0.3 1.5,2.0"
          stroke="#2E1508"
          strokeWidth="0.95"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* 5. MASSAS DE FOLHAGEM ESCULPIDAS NAS PONTAS DOS GALHOS */}

      {/* Massa Foliar Esquerda (Sombreada na base, iluminada no topo) */}
      <g transform={`translate(${leftBranchX}, ${leftBranchY}) rotate(${swayLeft})`}>
        <path
          d="M-10,5.2 C-14,1.5 -14,-5.5 -8.5,-9.5 C-4,-13 3,-12.5 7.5,-8.5 C11,-4.5 9.5,2.5 4.5,5.5 C0,7.5 -6,7.5 -10,5.2 Z"
          fill={leafDark}
          stroke="#052E16"
          strokeWidth="0.6"
        />
        <path
          d="M-8,2.2 C-10.5,-2 -8,-7.5 -2.5,-9.5 C2.5,-11 7.5,-8 7.5,-3.5 C7,0.8 1.5,3.2 -8,2.2 Z"
          fill={leafMid}
        />
        <path
          d="M-5,-3.5 C-3,-7.5 2,-8.5 5.5,-5.5 C6.5,-2.5 3,-0.5 -1,-0.5 C-4,-0.5 -6,-1.5 -5,-3.5 Z"
          fill={leafLight}
          opacity="0.75"
        />
        {isApple && unlocked && (
          <g transform="translate(-4.5, 0.8)">
            <circle cx="0" cy="0" r="2.8" fill="#DC2626" stroke="#7F1D1D" strokeWidth="0.5" />
            <circle cx="-0.7" cy="-0.8" r="0.85" fill="#FCA5A5" />
          </g>
        )}
      </g>

      {/* Massa Foliar Direita (Banho de luz solar direta) */}
      <g transform={`translate(${rightBranchX}, ${rightBranchY}) rotate(${swayRight})`}>
        <path
          d="M-8.5,5.2 C-11.5,0.5 -9.5,-7 -3.5,-10.5 C2.5,-13.5 10.5,-11 12.5,-4.5 C14,1.5 9.5,6.5 3.5,7.2 C-1.5,7.5 -5.5,7 -8.5,5.2 Z"
          fill={leafDark}
          stroke="#052E16"
          strokeWidth="0.6"
        />
        <path
          d="M-5.5,3 C-7.5,-2 -4.5,-8.5 2,-9.5 C7.5,-10.5 11.5,-5.5 10.5,0 C9.5,4.2 2,5.2 -5.5,3 Z"
          fill={leafMid}
        />
        <path
          d="M-2.5,-2 C0,-6.5 5.5,-7.5 8.5,-4.2 C9.5,-1 6.5,2.2 2,2.2 C-1,2.2 -3.5,0.2 -2.5,-2 Z"
          fill={leafLight}
          opacity="0.85"
        />
        <path
          d="M1,-4.5 C3,-6.5 6.5,-6 7.5,-3.5 C8,-1.5 5,0 2.5,-0.5 C0.5,-1 0,-3 1,-4.5 Z"
          fill={leafSun}
          opacity="0.65"
        />
        {isApple && unlocked && (
          <g transform="translate(4.2, 0.5)">
            <circle cx="0" cy="0" r="2.9" fill="#EF4444" stroke="#7F1D1D" strokeWidth="0.5" />
            <circle cx="-0.7" cy="-0.8" r="0.9" fill="#FECACA" />
          </g>
        )}
      </g>

      {/* Coroa Superior Esculpida */}
      <g transform={`translate(${topBranchX}, ${topBranchY}) rotate(${swayTop})`}>
        <path
          d="M-13.5,4.2 C-17,-1.5 -13.5,-10 -6,-12.5 C0.5,-15.5 9.5,-13.5 13.5,-8 C17,-3 14.5,4 8.5,6.2 C2.5,8.2 -8.5,8.2 -13.5,4.2 Z"
          fill={leafDark}
          stroke="#052E16"
          strokeWidth="0.6"
        />
        <path
          d="M-10.5,2 C-12.5,-3.5 -8.5,-9.5 -2,-11.2 C4.5,-12.5 11.5,-9.5 12.5,-4 C13.5,1.2 7.5,5.2 0,5.2 C-5.5,5.2 -8.5,4 -10.5,2 Z"
          fill={leafMid}
        />
        <path
          d="M-5.5,-3.2 C-3,-8.2 3.5,-9.5 8.5,-6.2 C10.5,-3 7.5,1.2 2,1.2 C-2,1.2 -6.5,0 -5.5,-3.2 Z"
          fill={leafLight}
          opacity="0.85"
        />
        <path
          d="M-1,-6 C1.5,-8.5 5.5,-8 7,-5.5 C7.5,-3.5 4.5,-1.5 1.5,-2 C-1,-2.5 -2.5,-4.2 -1,-6 Z"
          fill={leafSun}
          opacity="0.7"
        />
        {isApple && unlocked && (
          <>
            <g transform="translate(-3.2, -2.0)">
              <circle cx="0" cy="0" r="2.8" fill="#EF4444" stroke="#7F1D1D" strokeWidth="0.5" />
              <circle cx="-0.7" cy="-0.7" r="0.85" fill="#FECACA" />
            </g>
            <g transform="translate(5.5, -4.5)">
              <circle cx="0" cy="0" r="2.6" fill="#DC2626" stroke="#7F1D1D" strokeWidth="0.5" />
              <circle cx="-0.6" cy="-0.6" r="0.8" fill="#FCA5A5" />
            </g>
            {/* Pequena flor branca de macieira */}
            <circle cx="0.5" cy="-6.8" r="1.4" fill="#FFFBEB" />
            <circle cx="0.5" cy="-6.8" r="0.5" fill="#FACC15" />
          </>
        )}
      </g>

      {/* 6. Tufos Frontais Intermediários (abraçam os galhos preservando janelas na madeira) */}
      <g transform={`translate(${leanX * 0.4}, -17.8) rotate(${swayFront * 0.7})`}>
        <path
          d="M-11.5,2 C-13.5,-2 -9.5,-6.2 -4,-5.2 C-1,-4.2 -1,0 -3.2,2.2 C-6.2,3.2 -9.5,3 -11.5,2 Z"
          fill={leafMid}
        />
        <path
          d="M3.2,1.5 C1,-1 2.2,-5.2 6.2,-5.2 C10.2,-5.2 12.5,-1 10.2,2.2 C8.2,3.6 5.2,3 3.2,1.5 Z"
          fill={leafLight}
          opacity="0.88"
        />
      </g>

      {/* 7. Detalhes de solo na raiz: pedrinhas campestres, folhas caídas e tufos de grama */}
      <ellipse cx="-5.2" cy="1.9" rx="2.0" ry="1.0" fill="#64748B" opacity="0.8" />
      <ellipse cx="-5.4" cy="1.6" rx="1.2" ry="0.5" fill="#94A3B8" opacity="0.7" />
      <ellipse
        cx="5.8"
        cy="2.2"
        rx="1.6"
        ry="0.8"
        fill={isApple ? '#EF4444' : '#D97706'}
        opacity="0.75"
      />
      <path
        d="M-3.4,2.1 L-4.8,-1.2 M-1.4,2.3 L-1.2,-0.8 M2.4,2.2 L3.8,-1.2 M4.6,1.8 L6.4,-1"
        stroke="#15803D"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </g>
  );
};

interface ShrubVisualProps {
  id: string;
  screenX: number;
  screenY: number;
  scale: number;
  hasBerries: boolean;
  unlocked: boolean;
  timeSec: number;
  windStrength: number;
  seed: number;
}

/**
 * Arbusto e Moita Orgânica em Camadas com pedrinhas e flores silvestres
 */
export const IsometricShrubArtwork: React.FC<ShrubVisualProps> = ({
  screenX,
  screenY,
  scale,
  hasBerries,
  unlocked,
  timeSec,
  windStrength,
  seed,
}) => {
  const swayL = computeBreezeAngle(timeSec, seed + 0.5, windStrength, 1.4);
  const swayR = computeBreezeAngle(timeSec + 0.5, seed + 2.1, windStrength, 1.5);

  return (
    <g
      transform={`translate(${screenX}, ${screenY}) scale(${scale})`}
      opacity={unlocked ? 1 : 0.45}
    >
      <ellipse cx="0" cy="1.4" rx="12.5" ry="5.2" fill="#022C22" opacity="0.36" />
      {/* Pequena pedra campestre ao lado da moita */}
      <ellipse cx="-8.5" cy="1.5" rx="2.6" ry="1.4" fill="#64748B" />
      <ellipse cx="-8.8" cy="1.1" rx="1.6" ry="0.8" fill="#CBD5E1" opacity="0.75" />

      <path
        d="M-3,1 L-5.5,-3.2 M0,1.2 L0,-4.2 M3,1 L5.5,-3.2"
        stroke="#4A2511"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      <path
        d="M-10.5,0.6 C-12.5,-4 -8.5,-9.5 -2,-10 C3.5,-10.5 9.5,-8.5 11,-3.2 C11.5,0 8.5,2.2 0,2.2 C-6.5,2.2 -9.5,1.6 -10.5,0.6 Z"
        fill="#0F3F22"
      />

      <g transform={`translate(-3.8, -2.2) rotate(${swayL})`}>
        <path
          d="M-6.5,2.2 C-8.5,-2 -5.5,-6.5 0,-7 C4.5,-7 6.5,-3.2 5.2,1.2 C4.2,3.2 -3.2,3.2 -6.5,2.2 Z"
          fill="#15803D"
        />
        <path
          d="M-4,-1.5 C-2,-4.5 2,-4.5 3.5,-2 C4,0 1,1 -4,-1.5 Z"
          fill="#22C55E"
          opacity="0.75"
        />
      </g>

      <g transform={`translate(3.8, -2.6) rotate(${swayR})`}>
        <path
          d="M-4.2,2.2 C-5.2,-2 -2.2,-6.5 3.2,-6.5 C7.5,-6.5 9.5,-2.2 7.5,1.6 C5.5,3.2 -1,3.2 -4.2,2.2 Z"
          fill="#16A34A"
        />
        <path
          d="M-1,-2.5 C1,-5 5,-4.5 6,-2 C6.5,0 3,1 -1,-2.5 Z"
          fill="#4ADE80"
          opacity="0.8"
        />
        {hasBerries && unlocked && (
          <>
            <circle cx="-1" cy="-1.5" r="1.45" fill="#E11D48" />
            <circle cx="3.5" cy="-1" r="1.35" fill="#FB7185" />
            <circle cx="1.2" cy="-3.6" r="1.35" fill="#F43F5E" />
          </>
        )}
      </g>
    </g>
  );
};
