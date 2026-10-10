import React from 'react';
import { ChickenEntity, CropStage, CropType } from '../types/farm';

/**
 * Helper determinístico leve para produzir variações orgânicas estáveis
 * entre árvores, arbustos e plantas sem aleatoriedade em tempo de execução.
 */
function seededUnit(seed: number, offset: number = 0): number {
  const x = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Calcula o ângulo de inclinação suave da brisa (em graus) baseado no tempo real (segundos),
 * propagando uma onda espacial coerente pelo cenário para que árvores, arbustos, flores e
 * plantações reajam à mesma brisa natural com diferenças orgânicas de fase e amplitude.
 * A base (0,0) permanece 100% fixa no solo; apenas caules, copas e pontas giram suavemente.
 */
export function computeBreezeAngle(
  timeSec: number,
  phaseSeed: number,
  windStrength: number = 1,
  maxAmplitudeDeg: number = 2.1
): number {
  const spatialPhase = phaseSeed * 1.85;
  const primaryWave = Math.sin(timeSec * 1.32 - spatialPhase);
  const secondaryGust = Math.sin(timeSec * 0.56 - spatialPhase * 0.65 + 1.4) * 0.44;
  const microFlutter = Math.cos(timeSec * 2.38 + phaseSeed * 3.9) * 0.12;
  const directionalBias = 0.22 * windStrength;

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
 * - Paleta naturalista aconchegante sem contornos pretos pesados nem verdes fluorescentes.
 * - Variação determinística por canteiro e por planta (inclinação, curvatura e altura).
 * - Sulcos volumétricos de terra arada, torrões orgânicos e sombras de contato suaves.
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
  const soilDeep = isRaining ? '#2E1909' : '#462812';
  const soilDark = isRaining ? '#3D220D' : '#593418';
  const soilMid = isRaining ? '#522E13' : '#734421';
  const soilLight = isRaining ? '#683B1A' : '#8F562C';

  // Camada base de sulcos arados isométricos com iluminação superior-direita consistente
  const renderSoilFurrows = (dense: boolean) => (
    <g>
      {[
        { x1: -19.5, y1: -1.6, x2: 1.2, y2: -11.8 },
        { x1: -10.2, y1: 3.4, x2: 10.2, y2: -6.6 },
        { x1: -1.2, y1: 8.4, x2: 19.5, y2: -1.6 },
      ].map((f, i) => (
        <g key={i}>
          {/* Sombra suave da vala */}
          <line
            x1={cx + f.x1}
            y1={cy + f.y1 - 0.5}
            x2={cx + f.x2}
            y2={cy + f.y2 - 0.5}
            stroke={soilDeep}
            strokeWidth={dense ? '3.4' : '2.6'}
            strokeLinecap="round"
            opacity={dense ? '0.78' : '0.54'}
          />
          {/* Crista iluminada do camalhão de terra */}
          <line
            x1={cx + f.x1}
            y1={cy + f.y1 + 1.1}
            x2={cx + f.x2}
            y2={cy + f.y2 + 1.1}
            stroke={soilLight}
            strokeWidth={dense ? '3.2' : '2.4'}
            strokeLinecap="round"
            opacity={dense ? '0.68' : '0.42'}
          />
        </g>
      ))}
      {/* Torrões de terra orgânicos com variação determinística */}
      <ellipse
        cx={cx - 12.5 + (seededUnit(plotSeed, 1) - 0.5) * 3}
        cy={cy + 1.6}
        rx="2.1"
        ry="1.15"
        fill={soilDark}
        opacity="0.72"
      />
      <ellipse
        cx={cx + 5.2 + (seededUnit(plotSeed, 2) - 0.5) * 3}
        cy={cy - 4.4}
        rx="2.2"
        ry="1.2"
        fill={soilMid}
        opacity="0.7"
      />
      <ellipse
        cx={cx + 9.8}
        cy={cy + 3.8}
        rx="1.8"
        ry="1.0"
        fill={soilLight}
        opacity="0.72"
      />
      <circle cx={cx - 4.2} cy={cy - 5.8} r="1.1" fill={soilDeep} opacity="0.58" />
    </g>
  );

  // Estágio 0: Terra preparada vazia
  if (!cropType || stage === CropStage.PREPARED_SOIL) {
    return renderSoilFurrows(true);
  }

  // Três plantas/tufos por canteiro ordenados rigorosamente por profundidade de tela (py = cy + dy)
  // Cada exemplar tem posição, escala e inclinação bem espaçadas para evitar sobreposição visual de espigas/folhas
  const clumps = [
    {
      dx: (seededUnit(plotSeed, 10) - 0.5) * 1.8,
      dy: -7.4 + (seededUnit(plotSeed, 11) - 0.5) * 0.8,
      seed: plotSeed + 1.13,
      scale: 0.91 + seededUnit(plotSeed, 12) * 0.06,
      tilt: (seededUnit(plotSeed, 13) - 0.5) * 3.8,
      curl: 0.92 + seededUnit(plotSeed, 14) * 0.16,
    },
    {
      dx: -14.8 + (seededUnit(plotSeed, 20) - 0.5) * 1.6,
      dy: 0.8 + (seededUnit(plotSeed, 21) - 0.5) * 0.8,
      seed: plotSeed + 2.79,
      scale: 0.95 + seededUnit(plotSeed, 22) * 0.07,
      tilt: -1.6 + (seededUnit(plotSeed, 23) - 0.5) * 3.2,
      curl: 0.9 + seededUnit(plotSeed, 24) * 0.18,
    },
    {
      dx: 14.8 + (seededUnit(plotSeed, 30) - 0.5) * 1.6,
      dy: 2.4 + (seededUnit(plotSeed, 31) - 0.5) * 0.8,
      seed: plotSeed + 4.41,
      scale: 0.97 + seededUnit(plotSeed, 32) * 0.07,
      tilt: 1.6 + (seededUnit(plotSeed, 33) - 0.5) * 3.2,
      curl: 0.92 + seededUnit(plotSeed, 34) * 0.16,
    },
  ];

  return (
    <g>
      {renderSoilFurrows(false)}
      {clumps.map((clump, idx) => {
        const px = cx + clump.dx;
        const py = cy + clump.dy;
        const stemBend =
          clump.tilt * 0.45 + computeBreezeAngle(timeSec, clump.seed, windStrength, 1.55);
        const leafBendLeft = computeBreezeAngle(
          timeSec + 0.35,
          clump.seed + 1.9,
          windStrength,
          2.1
        );
        const leafBendRight = computeBreezeAngle(
          timeSec + 0.72,
          clump.seed + 3.2,
          windStrength,
          2.1
        );

        // =========================================================================
        // CULTURA 1: MILHO DOCE (CORN) — Folhas arqueadas orgânicas e espigas naturais
        // =========================================================================
        if (cropType === CropType.CORN) {
          const leafSpanL = 10.6 * clump.curl;
          const leafSpanR = 11.0 * (2 - clump.curl);

          if (stage === CropStage.SEEDLING) {
            return (
              <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
                {/* Sombra de contato projetada para a esquerda-baixo (luz vinda do topo-direita) */}
                <ellipse cx="-0.8" cy="2.1" rx="6.4" ry="2.7" fill="#1F1105" opacity="0.48" />
                <path
                  d="M-4.8,1.9 C-2.4,-0.8 2.4,-0.8 4.8,1.9 C2.2,3.2 -2.2,3.2 -4.8,1.9 Z"
                  fill={soilMid}
                />
                <path
                  d="M-3.2,2.1 C-1.4,0.6 1.4,0.6 3.2,2.1 C1.5,2.9 -1.5,2.9 -3.2,2.1 Z"
                  fill={soilDark}
                />

                <g transform={`translate(0, -1.8) rotate(${stemBend})`}>
                  {/* Bainha basal e caule jovem com iluminação lateral suave */}
                  <path d="M-1.3,2.2 L-0.7,-10.8 L0.8,-10.8 L1.3,2.2 Z" fill="#2E6F3E" />
                  <path d="M0,2.2 L0.2,-10.6 L0.8,-10.6 L1.0,2.2 Z" fill="#68B66B" opacity="0.8" />

                  {/* Folha esquerda arqueada com nervura central clara */}
                  <g transform={`translate(-0.4, -3.4) rotate(${leafBendLeft})`}>
                    <path
                      d={`M0,0 C-3.8,-4.5 ${-leafSpanL * 0.75},-4.2 ${-leafSpanL},-0.4 C${
                        -leafSpanL * 0.68
                      },-2.1 -3.6,-1.1 0,1.5 Z`}
                      fill="#255E34"
                    />
                    <path
                      d={`M-0.2,0.2 C-3.5,-3.4 ${-leafSpanL * 0.65},-3.2 ${-leafSpanL * 0.88},-0.6`}
                      stroke="#7BC67E"
                      strokeWidth="0.55"
                      fill="none"
                      strokeLinecap="round"
                      opacity="0.7"
                    />
                  </g>

                  {/* Folha direita recebendo luz solar */}
                  <g transform={`translate(0.4, -5.0) rotate(${leafBendRight})`}>
                    <path
                      d={`M0,0 C3.8,-4.8 ${leafSpanR * 0.76},-4.4 ${leafSpanR},-0.6 C${
                        leafSpanR * 0.68
                      },-2.3 3.6,-1.2 0,1.5 Z`}
                      fill="#3B8A4C"
                    />
                    <path
                      d={`M0.2,0.2 C3.6,-3.7 ${leafSpanR * 0.66},-3.4 ${leafSpanR * 0.88},-0.8`}
                      stroke="#A8E09E"
                      strokeWidth="0.6"
                      fill="none"
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                  </g>

                  {/* Broto central apontando para cima */}
                  <path
                    d="M-0.5,-8.5 C-0.8,-12.5 0.6,-14.2 1.4,-15.2 C1.2,-12.2 0.8,-9.8 0.4,-8.2 Z"
                    fill="#54A85B"
                  />
                </g>
              </g>
            );
          }

          if (stage === CropStage.GROWING) {
            return (
              <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
                <ellipse cx="-1.0" cy="2.5" rx="7.6" ry="3.3" fill="#1F1105" opacity="0.52" />
                <path
                  d="M-5.4,2.1 C-2.6,-1.0 2.6,-1.0 5.4,2.1 C2.6,3.6 -2.6,3.6 -5.4,2.1 Z"
                  fill={soilMid}
                />
                <path
                  d="M-3.6,2.3 C-1.6,0.8 1.6,0.8 3.6,2.3 C1.8,3.2 -1.8,3.2 -3.6,2.3 Z"
                  fill={soilDark}
                />

                <g transform={`translate(0, -2.6) rotate(${stemBend})`}>
                  {/* Colmo principal segmentado com nós naturais */}
                  <path
                    d="M-1.7,2.4 L-1.0,-19.8 L1.0,-19.8 L1.7,2.4 Z"
                    fill="#255E34"
                  />
                  <path
                    d="M-0.1,2.4 L0.2,-19.5 L0.95,-19.5 L1.35,2.4 Z"
                    fill="#54A85B"
                    opacity="0.78"
                  />
                  {/* Nós do colmo */}
                  <ellipse cx="0" cy="-5.8" rx="1.5" ry="0.55" fill="#7BC67E" opacity="0.75" />
                  <ellipse cx="0" cy="-12.4" rx="1.25" ry="0.5" fill="#7BC67E" opacity="0.75" />

                  {/* Par inferior de folhas longas e curvadas */}
                  <g transform={`translate(-0.9, -5.2) rotate(${leafBendLeft * 0.82})`}>
                    <path
                      d={`M0,0 C-5.2,-4.8 ${-leafSpanL * 0.95},-4.2 ${-leafSpanL * 1.22},1.4 C${
                        -leafSpanL * 0.88
                      },-1.6 -4.8,-1.0 0,1.8 Z`}
                      fill="#1E4D2B"
                    />
                    <path
                      d={`M-0.3,0.3 C-4.8,-3.6 ${-leafSpanL * 0.82},-3.0 ${-leafSpanL * 1.08},0.8`}
                      stroke="#54A85B"
                      strokeWidth="0.55"
                      fill="none"
                      opacity="0.75"
                    />
                  </g>

                  <g transform={`translate(0.9, -7.2) rotate(${leafBendRight * 0.82})`}>
                    <path
                      d={`M0,0 C5.2,-5.4 ${leafSpanR * 0.95},-4.2 ${leafSpanR * 1.24},0.8 C${
                        leafSpanR * 0.88
                      },-2.0 4.8,-1.2 0,1.8 Z`}
                      fill="#2E6F3E"
                    />
                    <path
                      d={`M0.3,0.3 C4.8,-4.2 ${leafSpanR * 0.82},-3.2 ${leafSpanR * 1.1},0.4`}
                      stroke="#8FD18E"
                      strokeWidth="0.6"
                      fill="none"
                      opacity="0.8"
                    />
                  </g>

                  {/* Par superior de folhas */}
                  <g transform={`translate(-0.7, -13.2) rotate(${leafBendLeft})`}>
                    <path
                      d={`M0,0 C-4.6,-6.0 ${-leafSpanL * 0.85},-6.2 ${-leafSpanL * 1.12},-2.0 C${
                        -leafSpanL * 0.76
                      },-3.8 -4.2,-2.2 0,1.5 Z`}
                      fill="#2E6F3E"
                    />
                    <path
                      d={`M-0.2,0.2 C-4.2,-4.8 ${-leafSpanL * 0.72},-4.8 ${-leafSpanL * 0.96},-1.8`}
                      stroke="#7BC67E"
                      strokeWidth="0.5"
                      fill="none"
                      opacity="0.7"
                    />
                  </g>

                  <g transform={`translate(0.7, -14.8) rotate(${leafBendRight})`}>
                    <path
                      d={`M0,0 C4.6,-6.5 ${leafSpanR * 0.85},-6.2 ${leafSpanR * 1.12},-2.0 C${
                        leafSpanR * 0.76
                      },-3.8 4.2,-2.2 0,1.5 Z`}
                      fill="#3B8A4C"
                    />
                    <path
                      d={`M0.2,0.2 C4.2,-5.2 ${leafSpanR * 0.72},-5.0 ${leafSpanR * 0.96},-1.8`}
                      stroke="#B4E8A8"
                      strokeWidth="0.55"
                      fill="none"
                      opacity="0.8"
                    />
                  </g>

                  {/* Folha ponteira central */}
                  <path
                    d="M-0.7,-18.5 C-1.2,-22.5 0.5,-24.8 1.8,-25.8 C1.6,-22.5 1.0,-19.8 0.6,-18.2 Z"
                    fill="#54A85B"
                  />
                </g>
              </g>
            );
          }

          // Estágio 3: Milho Adulto Pronto para Colheita
          return (
            <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
              <ellipse cx="-1.2" cy="2.9" rx="8.8" ry="3.8" fill="#1C0F04" opacity="0.56" />
              <path
                d="M-5.8,2.2 C-2.8,-1.2 2.8,-1.2 5.8,2.2 C2.8,3.9 -2.8,3.9 -5.8,2.2 Z"
                fill={soilMid}
              />
              <path
                d="M-3.8,2.4 C-1.8,0.9 1.8,0.9 3.8,2.4 C1.9,3.4 -1.9,3.4 -3.8,2.4 Z"
                fill={soilDark}
              />

              <g transform={`translate(0, -3.4) rotate(${stemBend * 0.85})`}>
                {/* Colmo robusto */}
                <path
                  d="M-1.8,2.6 L-1.0,-24.5 L1.0,-24.5 L1.8,2.6 Z"
                  fill="#235730"
                />
                <path
                  d="M-0.1,2.6 L0.2,-24.2 L0.95,-24.2 L1.4,2.6 Z"
                  fill="#4E9E55"
                  opacity="0.72"
                />

                {/* Folhas basais e médias */}
                <g transform={`translate(-1.1, -6.2) rotate(${leafBendLeft * 0.72})`}>
                  <path
                    d={`M0,0 C-5.8,-5.0 ${-leafSpanL * 1.05},-3.8 ${-leafSpanL * 1.32},2.0 C${
                      -leafSpanL * 0.92
                    },-1.4 -5.2,-0.8 0,2.0 Z`}
                    fill="#1E4D2B"
                  />
                </g>
                <g transform={`translate(1.1, -8.2) rotate(${leafBendRight * 0.72})`}>
                  <path
                    d={`M0,0 C5.8,-5.4 ${leafSpanR * 1.05},-3.8 ${leafSpanR * 1.32},1.8 C${
                      leafSpanR * 0.92
                    },-1.4 5.2,-0.8 0,2.0 Z`}
                    fill="#2B693A"
                  />
                </g>
                <g transform={`translate(-0.9, -15.4) rotate(${leafBendLeft})`}>
                  <path
                    d={`M0,0 C-5.2,-6.0 ${-leafSpanL * 0.94},-5.8 ${-leafSpanL * 1.22},-1.2 C${
                      -leafSpanL * 0.82
                    },-3.4 -4.8,-1.8 0,1.6 Z`}
                    fill="#2E6F3E"
                  />
                </g>
                <g transform={`translate(0.9, -17.2) rotate(${leafBendRight})`}>
                  <path
                    d={`M0,0 C5.2,-6.0 ${leafSpanR * 0.94},-5.8 ${leafSpanR * 1.22},-1.2 C${
                      leafSpanR * 0.82
                    },-3.4 4.8,-1.8 0,1.6 Z`}
                    fill="#3B8A4C"
                  />
                </g>

                {/* Pendão florido dourado naturalista no topo */}
                <g transform={`translate(0, -24.5) rotate(${leafBendLeft * 1.05})`}>
                  <path
                    d="M0,0 Q-2.2,-3.5 -4.2,-5.6 M0,0 L0,-7.2 M0,0 Q2.2,-3.5 4.2,-5.6"
                    stroke="#D99B26"
                    strokeWidth="1.2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M-0.2,-1.2 Q-1.6,-3.8 -3.2,-5.4 M0.2,-1.2 L0.2,-6.8 M0.4,-1.2 Q1.8,-3.8 3.4,-5.4"
                    stroke="#FDE68A"
                    strokeWidth="0.75"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>

                {/* Espiga Esquerda entreaberta na palha verde */}
                <g transform="translate(-3.9, -12.6) rotate(-18)">
                  {/* Corpo de grãos dourados */}
                  <ellipse
                    cx="0"
                    cy="0"
                    rx="3.6"
                    ry="7.1"
                    fill="#E5A00D"
                    stroke="#85510A"
                    strokeWidth="0.65"
                  />
                  <ellipse cx="0.6" cy="-0.5" rx="2.2" ry="5.5" fill="#FDE047" opacity="0.88" />
                  <ellipse cx="1.0" cy="-1.5" rx="1.1" ry="3.4" fill="#FEF9C3" opacity="0.75" />
                  {/* Fileiras sutis de grãos */}
                  <path
                    d="M-1.8,-3.5 Q0,-4.0 1.8,-3.5 M-2.2,-0.8 Q0,-1.3 2.2,-0.8 M-1.9,1.8 Q0,1.3 1.9,1.8"
                    stroke="#A16207"
                    strokeWidth="0.65"
                    fill="none"
                    opacity="0.75"
                  />
                  {/* Cabelo do milho no topo da espiga */}
                  <path
                    d="M-0.8,-6.8 Q-1.5,-8.4 -2.2,-8.8 M0.4,-7.0 Q1.0,-8.5 1.6,-9.0"
                    stroke="#B45309"
                    strokeWidth="0.65"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {/* Palha abraçando a base da espiga */}
                  <path
                    d="M-3.7,1.4 C-2.2,5.6 2.2,5.6 3.7,1.4 L2.1,6.8 C0.8,7.6 -0.8,7.6 -2.1,6.8 Z"
                    fill="#2E6F3E"
                  />
                  <path
                    d="M-1.2,3.0 C0.6,5.2 2.4,4.4 3.4,1.6 L1.9,6.6 L-0.6,6.6 Z"
                    fill="#54A85B"
                  />
                </g>

                {/* Espiga Direita iluminada */}
                <g transform="translate(4.1, -16.2) rotate(19)">
                  <ellipse
                    cx="0"
                    cy="0"
                    rx="3.4"
                    ry="6.6"
                    fill="#F5B118"
                    stroke="#85510A"
                    strokeWidth="0.65"
                  />
                  <ellipse cx="0.5" cy="-0.6" rx="2.1" ry="5.0" fill="#FEF08A" opacity="0.9" />
                  <path
                    d="M-1.6,-3.0 Q0,-3.5 1.6,-3.0 M-2.0,-0.4 Q0,-0.9 2.0,-0.4 M-1.6,2.2 Q0,1.7 1.6,2.2"
                    stroke="#A16207"
                    strokeWidth="0.65"
                    fill="none"
                    opacity="0.72"
                  />
                  <path
                    d="M-3.5,1.2 C-2.0,5.2 2.0,5.2 3.5,1.2 L1.8,6.2 C0.6,7.0 -0.6,7.0 -1.8,6.2 Z"
                    fill="#3B8A4C"
                  />
                </g>
              </g>
            </g>
          );
        }

        // =========================================================================
        // CULTURA 2: TRIGO DOURADO (WHEAT) — Hastes finas orgânicas e espigas trançadas
        // =========================================================================
        if (cropType === CropType.WHEAT) {
          const stalks = [
            { xOff: -4.2, angleBase: -8.5 + clump.tilt * 0.4, hScale: 0.87 * clump.curl, phase: 0.2 },
            { xOff: -2.1, angleBase: -3.8 + clump.tilt * 0.25, hScale: 0.96, phase: 0.65 },
            { xOff: 0, angleBase: clump.tilt * 0.3, hScale: 1.05, phase: 1.1 },
            { xOff: 2.1, angleBase: 3.8 + clump.tilt * 0.25, hScale: 0.95, phase: 1.55 },
            { xOff: 4.2, angleBase: 8.5 + clump.tilt * 0.4, hScale: 0.86 * (2 - clump.curl), phase: 2.05 },
          ];

          if (stage === CropStage.SEEDLING) {
            return (
              <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
                <ellipse cx="-0.8" cy="2.0" rx="6.4" ry="2.6" fill="#1F1105" opacity="0.46" />
                <path
                  d="M-5.0,1.8 C-2.4,-0.8 2.4,-0.8 5.0,1.8 C2.4,3.1 -2.4,3.1 -5.0,1.8 Z"
                  fill={soilMid}
                />
                {stalks.map((st, sIdx) => {
                  const sway = computeBreezeAngle(
                    timeSec,
                    clump.seed + st.phase,
                    windStrength,
                    1.65
                  );
                  const h = 11.4 * st.hScale;
                  const curve = st.angleBase * 0.14;
                  return (
                    <g
                      key={sIdx}
                      transform={`translate(${st.xOff * 0.78}, 1.2) rotate(${st.angleBase + sway})`}
                    >
                      <path
                        d={`M-0.75,0 Q${curve - 0.3},${-h * 0.58} ${curve},${-h} Q${
                          curve + 0.55
                        },${-h * 0.58} 0.75,0 Z`}
                        fill={sIdx % 2 === 0 ? '#558B2F' : '#7CB342'}
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
                <ellipse cx="-1.0" cy="2.4" rx="7.4" ry="3.2" fill="#1F1105" opacity="0.52" />
                <path
                  d="M-5.5,2.0 C-2.6,-1.0 2.6,-1.0 5.5,2.0 C2.6,3.4 -2.6,3.4 -5.5,2.0 Z"
                  fill={soilMid}
                />
                {stalks.map((st, sIdx) => {
                  const sway = computeBreezeAngle(
                    timeSec,
                    clump.seed + st.phase,
                    windStrength,
                    1.9
                  );
                  const h = 19.2 * st.hScale;
                  const curveX = st.angleBase * 0.15;
                  return (
                    <g
                      key={sIdx}
                      transform={`translate(${st.xOff * 0.85}, 1.2) rotate(${
                        st.angleBase * 0.78 + sway
                      })`}
                    >
                      {/* Haste flexível */}
                      <path
                        d={`M0,0 Q${curveX},${-h * 0.52} 0,${-h}`}
                        stroke={sIdx % 2 === 0 ? '#4B7A28' : '#689F38'}
                        strokeWidth="1.55"
                        fill="none"
                        strokeLinecap="round"
                      />
                      {/* Folha bandeira arqueada */}
                      <path
                        d={`M0,${-h * 0.46} Q${sIdx % 2 === 0 ? -3.4 : 3.4},${-h * 0.64} ${
                          sIdx % 2 === 0 ? -4.8 : 4.8
                        },${-h * 0.52}`}
                        stroke={sIdx % 2 === 0 ? '#689F38' : '#8BC34A'}
                        strokeWidth="1.05"
                        fill="none"
                        strokeLinecap="round"
                      />
                      {/* Espiga jovem verde-limão com grãos imbricados */}
                      <ellipse
                        cx="0"
                        cy={-h - 1.8}
                        rx="1.85"
                        ry="4.2"
                        fill="#7CB342"
                        stroke="#33691E"
                        strokeWidth="0.45"
                      />
                      <ellipse cx="0.45" cy={-h - 2.1} rx="0.95" ry="2.9" fill="#AED581" opacity="0.82" />
                    </g>
                  );
                })}
              </g>
            );
          }

          // Estágio 3: Trigo Dourado Maduro com espigas ricas em grãos e aristas suaves
          return (
            <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
              <ellipse cx="-1.2" cy="2.8" rx="8.6" ry="3.6" fill="#1C0F04" opacity="0.56" />
              <path
                d="M-6.0,2.2 C-2.8,-1.1 2.8,-1.1 6.0,2.2 C2.8,3.7 -2.8,3.7 -6.0,2.2 Z"
                fill={soilMid}
              />
              {stalks.map((st, sIdx) => {
                const sway = computeBreezeAngle(
                  timeSec,
                  clump.seed + st.phase,
                  windStrength,
                  2.1
                );
                const h = 23.0 * st.hScale;
                const curveX = st.angleBase * 0.14;
                return (
                  <g
                    key={sIdx}
                    transform={`translate(${st.xOff}, 1.4) rotate(${st.angleBase * 0.85 + sway})`}
                  >
                    {/* Colmo dourado */}
                    <path
                      d={`M0,0 Q${curveX},${-h * 0.55} 0,${-h}`}
                      stroke={sIdx % 2 === 0 ? '#9E6B14' : '#C68B1E'}
                      strokeWidth="1.65"
                      fill="none"
                      strokeLinecap="round"
                    />
                    {/* Folha seca dourada na metade do colmo */}
                    <path
                      d={`M0,${-h * 0.42} Q${sIdx % 2 === 0 ? -3.6 : 3.6},${-h * 0.56} ${
                        sIdx % 2 === 0 ? -5.0 : 5.0
                      },${-h * 0.44}`}
                      stroke="#D99B26"
                      strokeWidth="0.95"
                      fill="none"
                      strokeLinecap="round"
                      opacity="0.85"
                    />
                    {/* Aristas finas no topo da espiga */}
                    <path
                      d={`M-0.4,${-h - 5.2} L-2.1,${-h - 9.6} M0,${-h - 5.8} L0,${-h - 10.6} M0.4,${
                        -h - 5.2
                      } L2.1,${-h - 9.6}`}
                      stroke="#FDE68A"
                      strokeWidth="0.6"
                      strokeLinecap="round"
                      opacity="0.9"
                    />
                    {/* Base sombreada da espiga */}
                    <ellipse
                      cx="0"
                      cy={-h - 2.3}
                      rx="2.45"
                      ry="5.8"
                      fill="#D9900F"
                      stroke="#784408"
                      strokeWidth="0.6"
                    />
                    {/* Grãos trançados iluminados à direita */}
                    <ellipse cx="-0.75" cy={-h - 4.4} rx="1.15" ry="1.45" transform={`rotate(-18 -0.75 ${-h - 4.4})`} fill="#F5B82E" />
                    <ellipse cx="0.75" cy={-h - 3.6} rx="1.15" ry="1.45" transform={`rotate(18 0.75 ${-h - 3.6})`} fill="#FEF08A" />
                    <ellipse cx="-0.75" cy={-h - 2.0} rx="1.2" ry="1.5" transform={`rotate(-18 -0.75 ${-h - 2.0})`} fill="#F5B82E" />
                    <ellipse cx="0.75" cy={-h - 1.2} rx="1.2" ry="1.5" transform={`rotate(18 0.75 ${-h - 1.2})`} fill="#FEF08A" />
                    <ellipse cx="-0.65" cy={-h + 0.3} rx="1.1" ry="1.35" transform={`rotate(-18 -0.65 ${-h + 0.3})`} fill="#E09F1F" />
                    <ellipse cx="0.65" cy={-h + 0.9} rx="1.1" ry="1.35" transform={`rotate(18 0.65 ${-h + 0.9})`} fill="#FDE047" />
                  </g>
                );
              })}
            </g>
          );
        }

        // =========================================================================
        // CULTURA 3: CENOURA (CARROT) — Folhagem plumosa recortada e raiz integrada à terra
        // =========================================================================
        const frondLeftSway = computeBreezeAngle(timeSec, clump.seed + 0.4, windStrength, 2.3);
        const frondCenterSway = computeBreezeAngle(
          timeSec + 0.4,
          clump.seed + 1.2,
          windStrength,
          1.95
        );
        const frondRightSway = computeBreezeAngle(
          timeSec + 0.8,
          clump.seed + 2.1,
          windStrength,
          2.3
        );

        // Renderiza uma rama plumosa de cenoura com folíolos orgânicos em vez de bolinhas soltas
        const renderCarrotFrond = (
          rot: number,
          height: number,
          darkCol: string,
          lightCol: string,
          keyNum: number
        ) => (
          <g key={keyNum} transform={`rotate(${rot})`}>
            <path
              d={`M0,0 Q${rot * 0.03},${-height * 0.5} 0,${-height}`}
              stroke="#1E4D2B"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Folíolo inferior esquerdo e direito */}
            <path
              d={`M0,${-height * 0.36} C-2.4,${-height * 0.42} -4.8,${-height * 0.56} -4.2,${
                -height * 0.66
              } C-2.8,${-height * 0.68} -1.0,${-height * 0.54} 0,${-height * 0.46} Z`}
              fill={darkCol}
            />
            <path
              d={`M0,${-height * 0.38} C2.4,${-height * 0.44} 4.8,${-height * 0.58} 4.2,${
                -height * 0.68
              } C2.8,${-height * 0.7} 1.0,${-height * 0.56} 0,${-height * 0.48} Z`}
              fill={lightCol}
            />
            {/* Folíolo superior esquerdo e direito */}
            <path
              d={`M0,${-height * 0.66} C-2.6,${-height * 0.74} -5.0,${-height * 0.88} -4.0,${
                -height * 0.98
              } C-2.5,${-height * 1.0} -0.8,${-height * 0.85} 0,${-height * 0.76} Z`}
              fill={darkCol}
            />
            <path
              d={`M0,${-height * 0.68} C2.6,${-height * 0.76} 5.0,${-height * 0.9} 4.0,${
                -height * 1.0
              } C2.5,${-height * 1.02} 0.8,${-height * 0.87} 0,${-height * 0.78} Z`}
              fill={lightCol}
            />
            {/* Ponteira trilobada delicada */}
            <path
              d={`M0,${-height * 0.88} C-2.0,${-height * 1.04} -1.2,${-height * 1.18} 0,${
                -height * 1.16
              } C1.2,${-height * 1.18} 2.0,${-height * 1.04} 0,${-height * 0.88} Z`}
              fill={lightCol}
            />
          </g>
        );

        if (stage === CropStage.SEEDLING) {
          return (
            <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
              <ellipse cx="-0.7" cy="2.0" rx="6.0" ry="2.5" fill="#1F1105" opacity="0.48" />
              <path
                d="M-4.6,1.8 C-2.2,-0.8 2.2,-0.8 4.6,1.8 C2.2,3.1 -2.2,3.1 -4.6,1.8 Z"
                fill={soilMid}
              />
              <ellipse cx="0" cy="1.1" rx="2.2" ry="1.05" fill="#D95D1E" />

              <g transform="translate(0, 0.6)">
                {renderCarrotFrond(-21 + frondLeftSway, 7.6 * clump.curl, '#255E34', '#3B8A4C', 1)}
                {renderCarrotFrond(frondCenterSway, 9.0, '#2E6F3E', '#54A85B', 2)}
                {renderCarrotFrond(21 + frondRightSway, 7.5 * (2 - clump.curl), '#2E6F3E', '#68B66B', 3)}
              </g>
            </g>
          );
        }

        if (stage === CropStage.GROWING) {
          return (
            <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
              <ellipse cx="-0.9" cy="2.4" rx="7.4" ry="3.2" fill="#1F1105" opacity="0.52" />
              <path
                d="M-5.2,2.0 C-2.5,-1.0 2.5,-1.0 5.2,2.0 C2.5,3.4 -2.5,3.4 -5.2,2.0 Z"
                fill={soilMid}
              />
              {/* Ombro laranja da cenoura despontando da terra */}
              <path
                d="M-3.8,1.6 C-3.8,-2.1 3.8,-2.1 3.8,1.6 Z"
                fill="#E05A19"
                stroke="#8C310B"
                strokeWidth="0.65"
              />
              <path d="M-1.2,1.4 C0,-1.4 2.4,-1.2 3.1,1.4 Z" fill="#F68B42" opacity="0.85" />

              <g transform="translate(0, -0.5)">
                {renderCarrotFrond(-24 + frondLeftSway, 12.4 * clump.curl, '#1E4D2B', '#2E6F3E', 1)}
                {renderCarrotFrond(frondCenterSway, 14.5, '#255E34', '#469950', 2)}
                {renderCarrotFrond(24 + frondRightSway, 12.3 * (2 - clump.curl), '#2E6F3E', '#62B366', 3)}
              </g>

              {/* Torrão frontal abraçando o colo da raiz */}
              <path
                d="M-4.6,1.9 Q0,0.6 4.6,1.9 Q0,3.3 -4.6,1.9 Z"
                fill={soilDark}
                opacity="0.88"
              />
            </g>
          );
        }

        // Estágio 3: Cenoura Pronta para Colheita!
        return (
          <g key={idx} transform={`translate(${px}, ${py}) scale(${clump.scale})`}>
            <ellipse cx="-1.1" cy="2.9" rx="8.4" ry="3.6" fill="#1C0F04" opacity="0.58" />
            {/* Montículo traseiro de terra fofa onde a cenoura está fincada */}
            <path
              d="M-5.8,2.0 C-2.8,-1.1 2.8,-1.1 5.8,2.0 C2.8,3.6 -2.8,3.6 -5.8,2.0 Z"
              fill={soilMid}
            />

            <g transform="translate(0, -5.2)">
              {renderCarrotFrond(-28 + frondLeftSway, 13.2 * clump.curl, '#1E4D2B', '#2E6F3E', 1)}
              {renderCarrotFrond(-9 + frondCenterSway * 0.9, 15.6, '#255E34', '#3B8A4C', 2)}
              {renderCarrotFrond(10 + frondCenterSway * 1.05, 15.2, '#2E6F3E', '#54A85B', 3)}
              {renderCarrotFrond(28 + frondRightSway, 13.0 * (2 - clump.curl), '#2E6F3E', '#68B66B', 4)}
            </g>

            {/* Raiz cônica volumétrica erguida da terra fofa */}
            <path
              d="M-5.4,-4.4 C-5.6,-7.7 5.6,-7.7 5.4,-4.4 L3.2,2.7 C1.5,4.1 -1.5,4.1 -3.2,2.7 Z"
              fill="#DF5817"
              stroke="#7A2908"
              strokeWidth="0.7"
            />
            {/* Iluminação quente à direita */}
            <path
              d="M-1.7,-5.6 C0.8,-6.4 3.5,-5.9 4.4,-4.4 L2.3,2.3 C0.8,3.1 -0.5,2.9 -1.2,2.1 Z"
              fill="#F7823B"
            />
            <ellipse cx="1.6" cy="-3.4" rx="1.15" ry="2.1" fill="#FDBA74" opacity="0.7" />
            {/* Anéis horizontais orgânicos típicos da cenoura */}
            <path
              d="M-3.3,-3.1 Q-0.5,-2.6 2.1,-3.1 M-2.1,-0.6 Q0.4,-0.1 2.6,-0.6"
              stroke="#9A3412"
              strokeWidth="0.7"
              fill="none"
              strokeLinecap="round"
              opacity="0.68"
            />
            {/* Colar frontal de terra fofa abraçando a base da raiz */}
            <path
              d="M-6.0,2.2 C-3.2,0.7 0,2.2 0,2.2 C0,2.2 3.2,0.7 6.0,2.2 C3.4,4.2 -3.4,4.2 -6.0,2.2 Z"
              fill={soilDark}
              opacity="0.92"
            />
            <ellipse cx="-2.4" cy="2.6" rx="1.6" ry="0.85" fill={soilLight} opacity="0.65" />
            <ellipse cx="2.6" cy="2.5" rx="1.5" ry="0.8" fill={soilMid} opacity="0.75" />
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
  const isIdle = chicken.state === 'idle';

  const stridePhase = chicken.walkDistance * 21;

  // Movimento natural de ciscar o chão com a patinha durante a fase de ciscar ('pecking')
  const scratchWave = isPecking ? Math.sin(timeSec * 15 + chicken.seedOffset) : 0;
  const isScratchingFoot = isPecking && scratchWave > 0.25;

  const leftLegAngle = isWalking ? Math.sin(stridePhase) * 24 : 0;
  const rightLegAngle = isWalking
    ? -Math.sin(stridePhase) * 24
    : isScratchingFoot
    ? -20 + scratchWave * 32
    : 0;
  const leftFootLift = isWalking ? Math.max(0, -Math.cos(stridePhase)) * 1.9 : 0;
  const rightFootLift = isWalking
    ? Math.max(0, Math.cos(stridePhase)) * 1.9
    : isScratchingFoot
    ? 1.15
    : 0;

  // Calcula a posição aproximada dos pés no solo para ancorar sombras individuais sob cada patinha
  const leftFootGroundX = -2.2 - Math.sin((leftLegAngle * Math.PI) / 180) * 5.0;
  const rightFootGroundX = 2.2 - Math.sin((rightLegAngle * Math.PI) / 180) * 5.0;

  let peckProgress = 0;
  if (isPecking && chicken.stateDuration > 0) {
    const norm = 1 - chicken.stateTimer / chicken.stateDuration;
    // Duas bicadas rápidas seguidas de uma pausa curta de observação
    const multiPeckWave = Math.sin(norm * Math.PI * 3);
    peckProgress = Math.pow(Math.max(0, multiPeckWave), 1.5);
  }

  // Pequeno agito discreto e ocasional das asas quando parada ou olhando ao redor
  const wingFlutter =
    (isIdle || isLooking) && Math.sin(timeSec * 2.4 + chicken.seedOffset * 1.7) > 0.78
      ? Math.sin(timeSec * 24 + chicken.seedOffset) * 9.5
      : 0;

  const bodyBounceY = isWalking
    ? -Math.abs(Math.sin(stridePhase)) * 1.45
    : Math.sin(timeSec * 3.2 + chicken.seedOffset) * 0.35;

  const bodyPitchDeg = isPecking
    ? 8 + peckProgress * 22
    : isWalking
    ? Math.sin(stridePhase * 2) * 3.2
    : isLooking
    ? -2.5
    : 0;

  // Na pausa ('idle') e em 'looking', abaixa e levanta a cabeça suavemente de forma natural
  const headBobDeg = isPecking
    ? 10 + peckProgress * 30
    : isWalking
    ? Math.cos(stridePhase) * 8
    : isLooking
    ? Math.sin(timeSec * 4.6 + chicken.seedOffset) * 11
    : Math.sin(timeSec * 2.4 + chicken.seedOffset) * 5.5;

  const tailWagDeg = isWalking
    ? Math.sin(stridePhase * 2) * 7
    : isPecking
    ? -peckProgress * 12 + scratchWave * 3.5
    : Math.sin(timeSec * 2.8 + chicken.seedOffset) * 3;

  const isWhite = chicken.featherColor === 'white';
  const bodyBase = isWhite ? '#FFFBEB' : '#F59E0B';
  const bodyHighlight = isWhite ? '#FFFFFF' : '#FDE68A';
  const bodyShade = isWhite ? '#D6D3D1' : '#B45309';
  const wingColor = isWhite ? '#E7E5E4' : '#D97706';
  const strokeCol = isWhite ? '#78716C' : '#78350F';
  const flip = chicken.facingLeft ? -1 : 1;

  return (
    <g transform={`translate(${screenX}, ${screenY})`}>
      {/* Sombra de contato gradual em 3 níveis sob a galinha (penumbra externa, sombra média e núcleo sob o corpo) */}
      <ellipse cx="-1.2" cy="4.2" rx="11.6" ry="4.9" fill="#0B2E1B" opacity="0.18" />
      <ellipse cx="-0.6" cy="4.1" rx="8.2" ry="3.5" fill="#072617" opacity="0.24" />
      <ellipse cx="-0.2" cy="4.0" rx="5.2" ry="2.2" fill="#051B10" opacity="0.22" />

      <g transform={`scale(${flip}, 1)`}>
        {/* Sombras de contato individuais exatamente sob cada patinha no chão */}
        <ellipse
          cx={leftFootGroundX}
          cy="4.1"
          rx={2.3 - leftFootLift * 0.35}
          ry={0.95 - leftFootLift * 0.15}
          fill="#051B10"
          opacity={0.36 - leftFootLift * 0.08}
        />
        <ellipse
          cx={rightFootGroundX}
          cy="4.3"
          rx={2.4 - rightFootLift * 0.35}
          ry={1.0 - rightFootLift * 0.15}
          fill="#051B10"
          opacity={0.4 - rightFootLift * 0.08}
        />

        {/* Perna Traseira: eleva o quadril primeiro e gira a canela mantendo os dedos horizontais ao solo */}
        <g transform={`translate(-2.2, ${-1.4 - leftFootLift})`}>
          <g transform={`rotate(${leftLegAngle})`}>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="5.1"
              stroke="#B45309"
              strokeWidth="1.55"
              strokeLinecap="round"
            />
            <g transform={`translate(0, 5.1) rotate(${-leftLegAngle * 0.82})`}>
              <path
                d="M-1.5,0 L2.2,0 M0,0 L1.8,0.85"
                stroke="#B45309"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </g>
          </g>
        </g>

        {/* Perna Frontal (com dedos articulados paralelos ao chão e movimento de ciscar) */}
        <g transform={`translate(2.2, ${-1.1 - rightFootLift})`}>
          <g transform={`rotate(${rightLegAngle})`}>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="5.1"
              stroke="#EA580C"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <g transform={`translate(0, 5.1) rotate(${-rightLegAngle * 0.82})`}>
              <path
                d="M-1.5,0 L2.4,0 M0,0 L2.0,0.85"
                stroke="#EA580C"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </g>
          </g>
        </g>

        {/* Corpo Articulado */}
        <g transform={`translate(0, ${-5.6 + bodyBounceY}) rotate(${bodyPitchDeg})`}>
          {/* Cauda emplumada em leque */}
          <g transform={`translate(-7.5, -1) rotate(${tailWagDeg})`}>
            <path
              d="M0,1 C-4.2,-2.2 -7.0,-6.4 -5.8,-9.0 C-3,-7.2 -1,-4 1,-1 Z"
              fill={bodyShade}
              stroke={strokeCol}
              strokeWidth="0.75"
            />
            <path
              d="M0,2 C-4.8,0 -7.4,-3.2 -6.8,-5.8 C-3.5,-4.5 -1.5,-2 1,0 Z"
              fill={bodyBase}
              stroke={strokeCol}
              strokeWidth="0.75"
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
            strokeWidth="0.95"
          />
          {/* Brilho dorsal solar */}
          <ellipse cx="0.5" cy="-3.2" rx="6.2" ry="2.8" fill={bodyHighlight} opacity="0.7" />
          {/* Sombra inferior de volume */}
          <path
            d="M-8.2,2 C-4,6.9 5,6.9 8.6,1.5 C5,4.9 -4,4.9 -8.2,2 Z"
            fill={bodyShade}
            opacity="0.82"
          />

          {/* Asa lateral esculpida com movimento discreto na caminhada ou ao sacudir as penas */}
          <g
            transform={`translate(-1, 0.3) rotate(${
              isWalking ? Math.sin(stridePhase) * 4.5 : wingFlutter
            })`}
          >
            <ellipse
              cx="0"
              cy="0"
              rx="5.4"
              ry="3.6"
              fill={wingColor}
              stroke={strokeCol}
              strokeWidth="0.8"
            />
            <path
              d="M-3.2,0.4 Q-1,2.2 2.4,1.1 M-2.2,-1.0 Q0,0.5 2.8,-0.2"
              stroke={strokeCol}
              strokeWidth="0.55"
              fill="none"
              opacity="0.5"
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
              strokeWidth="0.95"
            />
            <ellipse cx="0.6" cy="-2.2" rx="3.2" ry="1.8" fill={bodyHighlight} opacity="0.65" />
            <path
              d="M-2.6,-4.5 C-2.6,-8.8 0,-8.8 0.2,-5 C1,-9.0 3.4,-8.4 2.9,-4.5 C4.2,-7.2 5.4,-5.6 3.9,-3.2 Z"
              fill="#EF4444"
              stroke="#991B1B"
              strokeWidth="0.6"
            />
            <polygon
              points="4.2,-1.6 9.6,0.2 4.2,1.9"
              fill="#FACC15"
              stroke="#A16207"
              strokeWidth="0.7"
            />
            <circle cx="1.9" cy="-1.0" r="1.3" fill="#0F172A" />
            <circle cx="2.2" cy="-1.35" r="0.48" fill="#FFFFFF" />
          </g>
        </g>

        {/* Grãozinhos e terra levantada ao bicar ou ciscar o chão */}
        {isPecking && (peckProgress > 0.65 || isScratchingFoot) && (
          <g transform="translate(12.2, 3.4)">
            <circle cx="0" cy="-1.4" r="1.1" fill="#78350F" opacity="0.82" />
            <circle cx="2.4" cy="-2.6" r="0.9" fill="#B45309" opacity="0.78" />
            <circle cx="-1.8" cy="-2.3" r="0.85" fill="#FACC15" opacity="0.88" />
            {isScratchingFoot && (
              <circle cx="-10.5" cy="-0.4" r="0.95" fill="#78350F" opacity="0.7" />
            )}
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
  isRaining?: boolean;
  isSunny?: boolean;
}

/**
 * Renderizador Botânico 3D Estilizado de Alta Qualidade para as 4 Espécies de Árvores:
 * - Direção única de luz solar vinda do topo-direita.
 * - Sem contornos pretos pesados: separação dos volumes de folhas feita por sombras internas de oclusão e subtons suaves.
 * - Reação sutil de iluminação, calor solar e contraste de sombra conforme o clima (Sol, Brisa, Chuva).
 * - Variações determinísticas por `seed` e `variant` para que nenhuma árvore pareça copiada e colada.
 * - Integração orgânica da base do tronco com raízes aparentes, musgo sutil, terra e tufos de grama.
 */
export const IsometricTreeArtwork: React.FC<IsometricTreeArtworkProps> = ({
  tree,
  screenX,
  screenY,
  unlocked,
  timeSec,
  windStrength,
  isRaining = false,
  isSunny = true,
}) => {
  const { kind, variant, lean, seed, scale } = tree;

  // Variações determinísticas estáveis baseadas na seed de cada árvore
  const u1 = seededUnit(seed, 1);
  const u2 = seededUnit(seed, 2);
  const u3 = seededUnit(seed, 3);
  const u4 = seededUnit(seed, 4);

  const canopyWidthMod = 0.94 + u1 * 0.14;
  const canopyHeightMod = 0.94 + u2 * 0.14;
  const asymLeft = (u3 - 0.5) * 3.4;
  const asymRight = (u4 - 0.5) * 3.4;
  const shadowContrast = isSunny ? 1.08 : isRaining ? 0.78 : 0.94;
  const sunWarmthOpacity = isSunny ? 0.9 : isRaining ? 0.6 : 0.8;

  // Oscilações de brisa independentes por agrupamento foliar (tronco permanece 100% imóvel)
  const swayBack = computeBreezeAngle(timeSec, seed + 0.2, windStrength, 0.82);
  const swayLeft = computeBreezeAngle(timeSec + 0.3, seed + 1.4, windStrength, 1.38);
  const swayRight = computeBreezeAngle(timeSec + 0.7, seed + 2.7, windStrength, 1.48);
  const swayTop = computeBreezeAngle(timeSec + 1.1, seed + 3.9, windStrength, 1.62);
  const swayFront = computeBreezeAngle(timeSec + 1.5, seed + 5.1, windStrength, 1.18);

  const leanX = lean * 3.8;

  // ===========================================================================
  // ESPÉCIE 1: PINHEIRO CAMPESTRE NATURALISTA ('pine')
  // Galhos irregulares em leques de agulhas com comprimentos e inclinações variados
  // (sem aparência de triângulos empilhados ou contornos escuros rígidos)
  // ===========================================================================
  if (kind === 'pine') {
    const hVar = (variant === 0 ? 1.0 : variant === 1 ? 0.94 : 1.06) * canopyHeightMod;
    const wVar = (variant === 0 ? 1.0 : variant === 1 ? 1.08 : 0.95) * canopyWidthMod;

    // Paleta de pinheiro alpino/campestre: sombra azul-esverdeada profunda até verde-oliva solar
    const pineDeep = '#0E3828';
    const pineDark = '#174E36';
    const pineMid = '#236B48';
    const pineLight = isRaining ? '#317F55' : '#388E5E';
    const pineSun = isSunny ? '#6BC082' : isRaining ? '#4E9E69' : '#62B57A';

    return (
      <g
        transform={`translate(${screenX}, ${screenY}) scale(${scale})`}
        opacity={unlocked ? 1 : 0.46}
      >
        {/* 1. Sombra projetada em 3 camadas graduais (penumbra da copa, sombra média e oclusão de raízes) */}
        <ellipse
          cx={-5.2 + leanX * 0.35}
          cy="2.4"
          rx={22.8 * wVar}
          ry={10.0 * wVar}
          fill="#0B2E1B"
          opacity={0.16 * shadowContrast}
        />
        <ellipse
          cx={-2.6 + leanX * 0.2}
          cy="1.8"
          rx={15.2 * wVar}
          ry={6.6 * wVar}
          fill="#072617"
          opacity={0.24 * shadowContrast}
        />
        <ellipse cx="-0.6" cy="1.2" rx="9.8" ry="4.2" fill="#051B10" opacity={0.38 * shadowContrast} />
        {/* Base de grama sombreada e terra integradas ao solo */}
        <ellipse cx="0" cy="1.1" rx="8.8" ry="3.6" fill="#21542C" opacity="0.55" />
        <ellipse cx="0" cy="0.9" rx="7.2" ry="2.9" fill="#4A2C14" opacity="0.72" />

        {/* Agulhas secas e pedrinha campestre quente ao pé do pinheiro */}
        <ellipse cx="-5.8" cy="1.7" rx="2.1" ry="0.9" fill="#8C5828" opacity="0.65" />
        <ellipse cx="5.2" cy="1.9" rx="1.8" ry="0.8" fill="#78716C" opacity="0.72" />

        {/* 2. Folhagem traseira de fundo (dá volume atrás do tronco) */}
        <g transform={`translate(${leanX * 0.25}, ${-16 * hVar}) rotate(${swayBack})`}>
          <path
            d={`M0,-22 C${-9 * wVar},-16 ${-18 * wVar},-8 ${-23 * wVar},1.5 C${-19 * wVar},5.5 ${
              -12 * wVar
            },6.5 ${-5 * wVar},5.2 C2,6.2 ${12 * wVar},6.8 ${22 * wVar},2.2 C${19 * wVar},-7 ${
              10 * wVar
            },-15 0,-22 Z`}
            fill={pineDeep}
          />
        </g>

        {/* 3. Tronco avermelhado contínuo com casca em placas, raízes ancoradas e galhos conectados */}
        <g>
          <path
            d={`M-6.8,1.9 C-4.4,-1.5 -3.4,-9 -3.0,-16 L${leanX - 1.1},${-50 * hVar} L${
              leanX + 1.1
            },${-50 * hVar} L3.0,-16 C3.4,-9 4.4,-1.5 6.8,1.9 C3.2,3.1 -3.2,3.1 -6.8,1.9 Z`}
            fill="#4E2712"
          />
          {/* Face direita do tronco aquecida pela luz solar */}
          <path
            d={`M-0.4,2.2 L-0.2,-16 L${leanX + 0.95},${-48 * hVar} L2.7,-16 C3.1,-9 4.0,-1.5 5.9,1.6 C3.2,2.4 0.8,2.4 -0.4,2.2 Z`}
            fill="#7E4320"
          />
          {/* Textura sutil da casca e raízes penetrando na terra */}
          <path
            d="M-2.1,1.4 L-1.6,-12 M1.4,1.5 L1.2,-14 M-5.8,1.5 Q-3.2,0.3 -1.4,2.1 M5.4,1.4 Q2.8,0.4 1.2,2.1"
            stroke="#331809"
            strokeWidth="0.8"
            fill="none"
            strokeLinecap="round"
            opacity="0.72"
          />
          {/* Galhos lenhosos principais contidos dentro das massas de agulhas (sem pontas soltas no ar) */}
          <path
            d={`M-1.8,-13.5 Q${-6.5 * wVar},-14.2 ${-12.5 * wVar},${-15.0 * hVar} M1.8,-14.0 Q${
              6.5 * wVar
            },-14.6 ${12.8 * wVar},${-15.4 * hVar} M${leanX * 0.45 - 1.2},${-24.5 * hVar} Q${
              -5.5 * wVar
            },${-25.5 * hVar} ${-10.2 * wVar},${-26.2 * hVar} M${leanX * 0.45 + 1.2},${
              -25.0 * hVar
            } Q${5.5 * wVar},${-26.0 * hVar} ${10.5 * wVar},${-26.8 * hVar}`}
            stroke="#3B1C0B"
            strokeWidth="1.95"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* 4. Galhos Inferiores Assimétricos (tufos orgânicos de agulhas em diferentes inclinações) */}
        <g transform={`translate(${leanX * 0.3}, ${-15.5 * hVar}) rotate(${swayLeft * 0.65})`}>
          {/* Ramo inferior esquerdo sombreado com pontas recortadas */}
          <path
            d={`M-1,-11 C${-8 * wVar},-8.5 ${-15 * wVar},-4.5 ${-23.5 * wVar + asymLeft * 0.4},2.2 C${
              -20 * wVar
            },5.2 ${-16.5 * wVar},3.6 ${-14 * wVar},5.8 C${-10 * wVar},7.2 ${-6.5 * wVar},4.8 ${
              -3.5 * wVar
            },5.6 C-1.5,5.2 -0.5,3.2 -1,-11 Z`}
            fill={pineDark}
          />
          {/* Ramo inferior direito alongado e iluminado */}
          <path
            d={`M0.5,-11.5 C${8.5 * wVar},-8.8 ${16.5 * wVar},-4.2 ${
              24 * wVar + asymRight * 0.4
            },1.8 C${20.5 * wVar},4.8 ${17 * wVar},3.4 ${14.5 * wVar},5.6 C${10.5 * wVar},6.8 ${
              6.5 * wVar
            },4.4 ${3 * wVar},5.2 C1,4.8 0,2.8 0.5,-11.5 Z`}
            fill={pineMid}
          />
          {/* Tufos frontais intermediários com sombra interna de separação */}
          <path
            d={`M-12,3.2 C-8,6.5 -2,6.8 4,5.4 C9,6.4 14,4.8 16,2.2 C11,4.2 4,4.6 -3,4.2 C-7,4.2 -10,3.8 -12,3.2 Z`}
            fill={pineDeep}
            opacity="0.55"
          />
          <path
            d={`M-8,-6.5 C-11,-1.5 -10,3.5 -4.5,4.6 C-1,5.2 2.5,3.2 4.5,4.4 C9,4.8 12,1.2 9,-4.5 C6,-8.5 -4,-9.5 -8,-6.5 Z`}
            fill={pineMid}
          />
          {/* Realces solares nos tufos da direita */}
          <path
            d={`M1.5,-8.5 C7.5,-5.8 15,-1.5 19.5,1.8 C16,3.8 12.5,2.4 9.5,3.8 C6,4.2 2.5,2.2 1.5,-8.5 Z`}
            fill={pineLight}
          />
          <path
            d="M4,-5.5 C8.5,-3.2 13.5,-0.2 16,1.6 C12.5,2.6 8.5,1.8 5.5,0.4 Z"
            fill={pineSun}
            opacity="0.75"
          />
        </g>

        {/* 5. Galhos Médios Inferiores (Desalinhados para quebrar simetria) */}
        <g
          transform={`translate(${leanX * 0.52 + asymLeft * 0.18}, ${-26.5 * hVar}) rotate(${
            swayRight * 0.78
          })`}
        >
          {/* Sombra projetada sobre a camada de baixo */}
          <path
            d={`M${-16 * wVar},3.2 C${-8 * wVar},6.8 ${8 * wVar},6.8 ${16.5 * wVar},2.8 C${
              11 * wVar
            },4.8 ${-11 * wVar},4.8 ${-16 * wVar},3.2 Z`}
            fill={pineDeep}
            opacity="0.68"
          />
          <path
            d={`M-0.5,-13.5 C${-7 * wVar},-9.5 ${-15.5 * wVar},-3.5 ${-19.5 * wVar},2.4 C${
              -15.5 * wVar
            },5.0 ${-12 * wVar},3.2 ${-9 * wVar},5.0 C${-5 * wVar},5.8 -1.5,3.5 0,2.8 C2,3.8 ${
              6.5 * wVar
            },5.5 ${10.5 * wVar},4.5 C${14 * wVar},3.0 ${17 * wVar},4.4 ${19.8 * wVar},1.8 C${
              16 * wVar
            },-4.2 ${7.5 * wVar},-9.8 -0.5,-13.5 Z`}
            fill={pineDark}
          />
          <path
            d={`M-0.2,-13.2 C${5 * wVar},-9.2 ${13.5 * wVar},-3.2 ${17.8 * wVar},1.6 C${
              14 * wVar
            },3.8 ${10.5 * wVar},2.4 ${7.5 * wVar},4.0 C3.5,4.6 -1.5,3.4 -4.5,2.2 C-3,-3.5 -2,-8.5 -0.2,-13.2 Z`}
            fill={pineMid}
          />
          <path
            d={`M1.5,-10.2 C${6.2 * wVar},-6.8 ${12.2 * wVar},-2.0 ${15.2 * wVar},1.4 C${
              11.5 * wVar
            },3.0 ${7 * wVar},2.2 3.2,1.2 C1.5,-2.5 1,-6.5 1.5,-10.2 Z`}
            fill={pineLight}
          />
          <path
            d="M3.2,-7.2 C7.2,-4.5 11.2,-1.2 13.2,1.0 C10.2,2.0 6.5,1.2 4.0,-0.4 Z"
            fill={pineSun}
            opacity="0.82"
          />
        </g>

        {/* 6. Galhos Médios Superiores */}
        <g
          transform={`translate(${leanX * 0.76 + asymRight * 0.15}, ${-37.5 * hVar}) rotate(${
            swayFront * 0.88
          })`}
        >
          <path
            d={`M${-12.5 * wVar},2.6 C${-6 * wVar},5.6 ${6 * wVar},5.6 ${13 * wVar},2.4 C${
              8 * wVar
            },4.0 ${-8 * wVar},4.0 ${-12.5 * wVar},2.6 Z`}
            fill={pineDeep}
            opacity="0.65"
          />
          <path
            d={`M0,-13.2 C${-5.8 * wVar},-8.8 ${-12.5 * wVar},-2.8 ${-15.2 * wVar},2.2 C${
              -11.5 * wVar
            },4.4 ${-8.5 * wVar},2.8 ${-5.5 * wVar},4.2 C-2,4.8 2,4.8 ${6 * wVar},4.0 C${
              9.5 * wVar
            },2.6 ${12.5 * wVar},3.8 ${15.4 * wVar},1.6 C${12.5 * wVar},-3.2 ${
              5.8 * wVar
            },-8.8 0,-13.2 Z`}
            fill={pineMid}
          />
          <path
            d={`M0,-13.0 C${4.2 * wVar},-8.5 ${10.5 * wVar},-2.5 ${13.4 * wVar},1.5 C${
              9.8 * wVar
            },3.4 ${5.5 * wVar},2.6 1.2,2.2 C-1,-2.8 -0.8,-8.2 0,-13.0 Z`}
            fill={pineLight}
          />
          <path
            d={`M1.5,-9.5 C5.2,-6.0 9.5,-1.5 11.2,1.2 C8.2,2.4 4.5,1.8 2.0,0.5 Z`}
            fill={pineSun}
            opacity="0.85"
          />
        </g>

        {/* 7. Ponteira / Líder Natural do Pinheiro */}
        <g transform={`translate(${leanX}, ${-48.2 * hVar}) rotate(${swayTop})`}>
          <path
            d={`M0,-14.2 C${-3.8 * wVar},-8.5 ${-7.8 * wVar},-2.2 ${-9.6 * wVar},2.2 C${
              -6.5 * wVar
            },4.2 ${-3 * wVar},3.2 0,3.8 C${3.5 * wVar},3.2 ${6.8 * wVar},4.0 ${
              9.8 * wVar
            },1.8 C${7.8 * wVar},-2.5 ${3.8 * wVar},-8.5 0,-14.2 Z`}
            fill={pineMid}
          />
          <path
            d={`M0,-14.0 C${2.8 * wVar},-8.2 ${6.4 * wVar},-2.2 ${8.2 * wVar},1.5 C${
              5.2 * wVar
            },3.2 2,2.8 0,2.2 Z`}
            fill={pineLight}
          />
          <path
            d={`M0.4,-11.8 C2.4,-7.2 5.2,-2.2 6.5,1.0 C4.2,2.1 1.8,1.8 0.5,1.0 Z`}
            fill={pineSun}
            opacity="0.9"
          />
        </g>

        {/* 8. Tufos de grama campestre abraçando as raízes */}
        <path
          d="M-4.2,2.0 L-5.6,-1.4 M-1.8,2.3 L-1.5,-1.1 M2.4,2.2 L3.8,-1.3 M4.8,1.8 L6.2,-0.8"
          stroke="#2E6F3E"
          strokeWidth="1.15"
          strokeLinecap="round"
        />
      </g>
    );
  }

  // ===========================================================================
  // ESPÉCIE 2: ÁRVORE ORNAMENTAL DO CAMPO ('ornamental' — Ipê-Rosa / Cerejeira Silvestre)
  // Tronco claro bifurcado em patamares horizontais fluidos com folhagem delicada e flores
  // ===========================================================================
  if (kind === 'ornamental') {
    const leftBX = (variant === 0 ? -12.0 : -13.5) + asymLeft * 0.4;
    const leftBY = -20.5 * canopyHeightMod;
    const rightBX = (variant === 0 ? 12.2 : 10.8) + asymRight * 0.4;
    const rightBY = -19.5 * canopyHeightMod;
    const topBX = leanX * 0.85 + (u1 - 0.5) * 2.2;
    const topBY = -29.2 * canopyHeightMod;

    // Paleta própria: folhagem verde-jade suave com subtons quentes e floração rosa-coral/creme
    const ornDeep = '#1B4D3E';
    const ornDark = '#266853';
    const ornMid = '#388E70';
    const ornLight = '#5BB391';
    const ornSun = '#8CE0BC';

    return (
      <g
        transform={`translate(${screenX}, ${screenY}) scale(${scale})`}
        opacity={unlocked ? 1 : 0.46}
      >
        {/* Sombra projetada em 3 camadas graduais e oclusão de solo */}
        <ellipse
          cx={-4.8 + leanX * 0.35}
          cy="2.1"
          rx={19.8 * canopyWidthMod}
          ry={8.6 * canopyWidthMod}
          fill="#0B2E1B"
          opacity={0.16 * shadowContrast}
        />
        <ellipse
          cx={-2.2 + leanX * 0.2}
          cy="1.5"
          rx={13.2 * canopyWidthMod}
          ry={5.8 * canopyWidthMod}
          fill="#072617"
          opacity={0.23 * shadowContrast}
        />
        <ellipse cx="-0.5" cy="1.0" rx="8.0" ry="3.4" fill="#051B10" opacity={0.36 * shadowContrast} />
        <ellipse cx="0" cy="1.0" rx="7.2" ry="3.0" fill="#21542C" opacity="0.52" />
        <ellipse cx="0" cy="0.8" rx="6.0" ry="2.5" fill="#523318" opacity="0.68" />

        {/* Camada foliar traseira unificadora com contornos lobados suaves */}
        <g transform={`translate(${leanX * 0.3}, -21.2) rotate(${swayBack})`}>
          <path
            d="M-17.5,2.6 C-21.2,-1.8 -18.5,-8.8 -12.2,-11.2 C-8.2,-15.4 -1.5,-16.4 3.5,-14.8 C8.8,-16.2 15.2,-13.2 17.8,-8.2 C20.8,-3.2 18.8,2.5 14.5,5.2 C9.8,7.8 3.5,7.8 -2.5,6.8 C-8.8,7.8 -14.2,6.4 -17.5,2.6 Z"
            fill={ornDeep}
          />
        </g>

        {/* Tronco esguio de casca clara aveludada e galhos sinuosos */}
        <g>
          <path
            d={`M-5.2,1.6 C-3.5,-1.2 -2.6,-6.5 -2.4,-14.2 L${leftBX},${leftBY} L${
              leftBX + 1.9
            },${leftBY - 1.5} L-0.8,-15.8 L${topBX - 0.9},${topBY} L${
              topBX + 1.0
            },${topBY} L1.0,-15.8 L${rightBX - 1.7},${rightBY - 1.5} L${rightBX},${rightBY} L2.4,-14.2 C2.6,-6.5 3.5,-1.2 5.2,1.6 C2.2,2.5 -2.2,2.5 -5.2,1.6 Z`}
            fill="#6E4B2A"
          />
          {/* Luz lateral sobre o tronco */}
          <path
            d={`M-0.3,1.8 L0.1,-15.2 L${topBX + 0.9},${topBY} L1.0,-15.8 L${
              rightBX - 0.4
            },${rightBY - 0.5} L2.2,-13.8 C2.4,-6.5 3.2,-1.2 4.6,1.4 C2.4,2.1 0.8,2.1 -0.3,1.8 Z`}
            fill="#9E7147"
          />
          <path
            d="M-4.4,1.3 Q-2.2,0.3 -0.9,1.8 M4.0,1.2 Q2.0,0.3 0.9,1.8"
            stroke="#422B15"
            strokeWidth="0.75"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* Patamar Esquerdo — Nuvem foliar orgânica multi-lobada */}
        <g transform={`translate(${leftBX}, ${leftBY}) rotate(${swayLeft})`}>
          <path
            d="M-11.2,2.8 C-14.2,-0.2 -12.8,-5.8 -7.8,-8.2 C-4.2,-11.2 1.8,-11.0 5.5,-8.2 C9.2,-6.5 10.6,-1.8 8.2,2.2 C5.8,5.2 0.8,5.6 -3.5,4.8 C-7.2,5.5 -9.5,4.5 -11.2,2.8 Z"
            fill={ornDark}
          />
          <path
            d="M-8.2,1.4 C-10.2,-2.0 -7.5,-6.5 -2.2,-7.8 C2.8,-8.8 7.5,-6.2 7.2,-2.0 C6.8,1.6 1.5,3.0 -3.2,2.2 C-5.8,2.5 -7.2,2.2 -8.2,1.4 Z"
            fill={ornMid}
          />
          <path
            d="M-4.2,-2.2 C-2.2,-5.8 2.8,-6.5 5.6,-3.8 C6.2,-1.2 3.2,0.8 -1.2,0.4 C-3.5,0 -4.8,-1.0 -4.2,-2.2 Z"
            fill={ornLight}
            opacity="0.88"
          />
          {/* Cachos florais compostos por pequenas pétalas agrupadas (sem aparência de adesivo oval) */}
          {unlocked && (
            <>
              <g transform="translate(-4.0, -2.2)">
                <circle cx="-1.1" cy="0.3" r="1.35" fill="#EC4899" />
                <circle cx="1.0" cy="-0.2" r="1.45" fill="#F472B6" />
                <circle cx="0" cy="-1.1" r="1.25" fill="#F9A8D4" />
                <circle cx="0.1" cy="-0.3" r="0.65" fill="#FEF3C7" />
              </g>
              <g transform="translate(2.4, -4.2)">
                <circle cx="-0.9" cy="0.2" r="1.15" fill="#F472B6" />
                <circle cx="0.9" cy="-0.2" r="1.25" fill="#F9A8D4" />
                <circle cx="0.1" cy="-0.9" r="1.1" fill="#FBCFE8" />
                <circle cx="0.1" cy="-0.2" r="0.55" fill="#FEF3C7" />
              </g>
            </>
          )}
        </g>

        {/* Patamar Direito — Banho de luz solar */}
        <g transform={`translate(${rightBX}, ${rightBY}) rotate(${swayRight})`}>
          <path
            d="M-8.8,3.2 C-11.4,-0.2 -9.2,-6.0 -3.8,-8.5 C0.8,-11.2 6.8,-10.2 10.2,-6.5 C12.8,-3.2 11.8,2.2 7.8,4.6 C3.8,6.2 -1.2,5.4 -4.5,4.6 C-6.8,4.8 -7.8,4.2 -8.8,3.2 Z"
            fill={ornDark}
          />
          <path
            d="M-5.2,1.6 C-6.8,-2.4 -3.2,-7.0 2.6,-7.8 C7.5,-8.2 10.5,-4.4 9.4,-0.2 C8.2,3.0 2.0,3.6 -5.2,1.6 Z"
            fill={ornMid}
          />
          <path
            d="M-1.5,-2.4 C1.2,-5.8 5.8,-6.2 8.2,-3.2 C8.8,-0.5 5.8,1.8 1.8,1.5 C-1.2,1.2 -2.8,-0.8 -1.5,-2.4 Z"
            fill={ornLight}
          />
          <path
            d="M1.8,-4.0 C3.8,-5.5 6.5,-5.0 7.2,-3.0 C7.5,-1.5 5.0,-0.4 2.8,-0.8 Z"
            fill={ornSun}
            opacity="0.75"
          />
          {unlocked && (
            <>
              <g transform="translate(3.2, -1.8)">
                <circle cx="-1.1" cy="0.3" r="1.4" fill="#DB2777" />
                <circle cx="1.1" cy="-0.2" r="1.5" fill="#EC4899" />
                <circle cx="0.2" cy="-1.2" r="1.3" fill="#F472B6" />
                <circle cx="0.2" cy="-0.3" r="0.65" fill="#FEF3C7" />
              </g>
              <g transform="translate(-1.5, -4.2)">
                <circle cx="-0.8" cy="0.2" r="1.15" fill="#EC4899" />
                <circle cx="0.9" cy="-0.2" r="1.25" fill="#F9A8D4" />
                <circle cx="0.1" cy="-0.2" r="0.55" fill="#FEF3C7" />
              </g>
            </>
          )}
        </g>

        {/* Tufo Frontal Central na Bifurcação (integra os galhos à copa sem parecer árvore oca) */}
        <g transform={`translate(${leanX * 0.45}, ${-17.2 * canopyHeightMod}) rotate(${swayFront * 0.7})`}>
          <path
            d="M-6.8,1.8 C-8.2,-1.2 -5.8,-4.5 -1.8,-4.8 C2.2,-5.0 5.8,-2.4 5.2,1.2 C4.2,3.2 -3.8,3.4 -6.8,1.8 Z"
            fill={ornMid}
          />
          <path
            d="M-3.2,-0.8 C-1.2,-3.2 2.5,-3.2 3.8,-1.0 C4.2,0.8 1.2,1.6 -3.2,-0.8 Z"
            fill={ornLight}
            opacity="0.88"
          />
        </g>

        {/* Coroa Superior Esculpida em Nuvem Florada Multi-Lobada */}
        <g transform={`translate(${topBX}, ${topBY}) rotate(${swayTop})`}>
          {/* Sombra interna sobre os patamares inferiores */}
          <path
            d="M-11.5,3.8 C-5,6.8 6,6.8 11.5,3.5 C7,5.2 -6,5.2 -11.5,3.8 Z"
            fill={ornDeep}
            opacity="0.6"
          />
          <path
            d="M-12.8,3.0 C-15.8,-1.2 -13.2,-7.8 -7.5,-10.2 C-3.5,-13.8 3.2,-14.2 8.2,-11.5 C13.2,-10.2 15.8,-4.5 13.8,0.8 C11.8,5.2 6.2,6.4 0.5,5.5 C-5.2,6.6 -10.2,5.5 -12.8,3.0 Z"
            fill={ornDark}
          />
          <path
            d="M-9.2,1.4 C-11.2,-3.2 -6.8,-8.8 0.2,-10.0 C6.2,-10.8 11.8,-7.5 11.2,-2.2 C10.5,2.2 4.2,4.0 -3.2,3.4 C-6.5,3.0 -8.2,2.4 -9.2,1.4 Z"
            fill={ornMid}
          />
          <path
            d="M-4.2,-2.8 C-1.5,-7.2 4.8,-8.2 8.8,-5.2 C10.2,-2.2 7.5,1.2 2.4,1.2 C-1.8,1.2 -5.4,-0.5 -4.2,-2.8 Z"
            fill={ornLight}
          />
          <path
            d="M0.2,-5.4 C2.8,-7.4 6.5,-6.8 7.8,-4.5 C8.2,-2.8 5.5,-1.2 2.5,-1.6 C0,-2.0 -1.2,-3.8 0.2,-5.4 Z"
            fill={ornSun}
            opacity="0.82"
          />
          {unlocked && (
            <>
              <g transform="translate(-3.0, -3.4)">
                <circle cx="-1.2" cy="0.3" r="1.45" fill="#DB2777" />
                <circle cx="1.1" cy="-0.2" r="1.55" fill="#EC4899" />
                <circle cx="0.1" cy="-1.2" r="1.35" fill="#F9A8D4" />
                <circle cx="0.1" cy="-0.3" r="0.7" fill="#FEF3C7" />
              </g>
              <g transform="translate(3.8, -5.0)">
                <circle cx="-1.0" cy="0.2" r="1.3" fill="#EC4899" />
                <circle cx="1.0" cy="-0.2" r="1.4" fill="#F472B6" />
                <circle cx="0.1" cy="-1.0" r="1.2" fill="#FBCFE8" />
                <circle cx="0.1" cy="-0.2" r="0.6" fill="#FEF3C7" />
              </g>
              <g transform="translate(1.2, -0.3)">
                <circle cx="-0.8" cy="0.2" r="1.15" fill="#F472B6" />
                <circle cx="0.8" cy="-0.1" r="1.2" fill="#F9A8D4" />
              </g>
            </>
          )}
        </g>

        {/* Pétalas caídas e tufos de grama na base */}
        {unlocked && (
          <>
            <ellipse cx="-5.8" cy="1.9" rx="1.4" ry="0.75" fill="#F472B6" opacity="0.82" />
            <ellipse cx="4.9" cy="2.2" rx="1.2" ry="0.65" fill="#FBCFE8" opacity="0.85" />
            <ellipse cx="-1.8" cy="2.6" rx="1.1" ry="0.6" fill="#F9A8D4" opacity="0.78" />
          </>
        )}
        <path
          d="M-3.2,2.0 L-4.4,-1.1 M2.2,2.0 L3.4,-1.1"
          stroke="#2E6F3E"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </g>
    );
  }

  // ===========================================================================
  // ESPÉCIES 3 E 4: CARVALHO FRONDOSO ('oak') E MACIEIRA ('apple')
  // Copas volumosas, orgânicas e assimétricas com profundidade em 3 planos
  // (traseiro, médio e frontal), sem contornos pretos pesados nem bolas repetidas.
  // ===========================================================================
  const isApple = kind === 'apple';

  // Paleta naturalista: Carvalho (verdes-floresta quentes e dourados no sol) vs Macieira (verdes-pomar frescos e ricos)
  const leafDeep = isApple ? '#0E3A22' : '#113821';
  const leafShadow = isApple ? '#164F2E' : '#1B4D2B';
  const leafDark = isApple ? '#206B3E' : '#286A3A';
  const leafMid = isApple ? '#2F8A50' : '#3C894B';
  const leafLight = isRaining
    ? isApple
      ? '#439B5D'
      : '#539957'
    : isApple
    ? '#4FAD6A'
    : '#61AB64';
  const leafSun = isSunny
    ? isApple
      ? '#8AD89A'
      : '#A0D690'
    : isRaining
    ? isApple
      ? '#6AB87B'
      : '#7CB874'
    : isApple
    ? '#82CF92'
    : '#96CE8A';

  const leftBranchX =
    ((variant === 0 ? -13.8 : variant === 1 ? -15.6 : -12.2) + asymLeft * 0.45) * canopyWidthMod;
  const leftBranchY =
    ((variant === 0 ? -24.8 : variant === 1 ? -22.8 : -26.2) + (u2 - 0.5) * 1.8) * canopyHeightMod;

  const rightBranchX =
    ((variant === 0 ? 14.2 : variant === 1 ? 12.4 : 15.8) + asymRight * 0.45) * canopyWidthMod;
  const rightBranchY =
    ((variant === 0 ? -23.8 : variant === 1 ? -25.8 : -22.8) + (u3 - 0.5) * 1.8) * canopyHeightMod;

  const topBranchX =
    leanX + (variant === 1 ? -1.9 : variant === 2 ? 2.1 : 0) + (u1 - 0.5) * 2.0;
  const topBranchY =
    (variant === 0 ? -34.8 : variant === 1 ? -33.2 : -36.2) * canopyHeightMod;

  // Helper para renderizar maçãs integradas à folhagem (com cabinho/pedúnculo, cálice e folha protetora)
  const renderAppleFruit = (
    fx: number,
    fy: number,
    r: number,
    isTucked: boolean,
    keyId: string
  ) => (
    <g key={keyId} transform={`translate(${fx}, ${fy})`}>
      {/* Sombra suave da maçã sobre as folhas abaixo */}
      <ellipse cx="-0.3" cy={r * 0.48} rx={r * 1.05} ry={r * 0.85} fill={leafDeep} opacity="0.52" />
      {/* Corpo da fruta com leve indentação orgânica no topo */}
      <circle cx="0" cy="0" r={r} fill={isTucked ? '#B91C1C' : '#DC2626'} />
      {!isTucked && (
        <>
          <circle cx="0.35" cy="-0.2" r={r * 0.78} fill="#EF4444" />
          <ellipse cx="0.75" cy={-r * 0.35} rx={r * 0.34} ry={r * 0.24} fill="#FCA5A5" />
          {/* Cabinho lenhoso e folhinha conectando a maçã ao ramo */}
          <path
            d={`M0,${-r * 0.72} Q0.4,${-r * 1.25} 0.9,${-r * 1.45}`}
            stroke="#4E2712"
            strokeWidth="0.65"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M0,${-r * 0.85} C${-r * 0.7},${-r * 1.35} ${-r * 1.15},${-r * 0.85} ${-r * 0.2},${-r * 0.65} Z`}
            fill={leafLight}
          />
        </>
      )}
      {isTucked && (
        /* Folha da copa cobrindo o topo da maçã para integrá-la perfeitamente ao volume foliar */
        <path
          d={`M${-r * 1.2},${-r * 0.2} C${-r * 0.45},${-r * 1.3} ${r * 0.75},${-r * 1.2} ${
            r * 1.2
          },${-r * 0.15} C${r * 0.4},${-r * 0.55} ${-r * 0.4},${-r * 0.55} ${-r * 1.2},${
            -r * 0.2
          } Z`}
          fill={leafMid}
        />
      )}
    </g>
  );

  return (
    <g
      transform={`translate(${screenX}, ${screenY}) scale(${scale})`}
      opacity={unlocked ? 1 : 0.46}
    >
      {/* 1. Sombra projetada em 3 camadas graduais (penumbra da copa, sombra média e oclusão firme sob o tronco) */}
      <ellipse
        cx={-5.2 + leanX * 0.35}
        cy="2.3"
        rx={23.6 * canopyWidthMod}
        ry={10.2 * canopyWidthMod}
        fill="#0B2E1B"
        opacity={0.17 * shadowContrast}
      />
      <ellipse
        cx={-2.4 + leanX * 0.2}
        cy="1.6"
        rx={15.8 * canopyWidthMod}
        ry={6.8 * canopyWidthMod}
        fill="#072617"
        opacity={0.24 * shadowContrast}
      />
      <ellipse cx="-0.6" cy="1.1" rx="9.6" ry="4.1" fill="#051B10" opacity={0.39 * shadowContrast} />

      {/* 2. Colar de grama sombreada, terra, raízes aparentes e vegetação rasteira traseira */}
      <ellipse cx="0" cy="1.1" rx="8.8" ry="3.7" fill="#21542C" opacity="0.55" />
      <ellipse cx="0" cy="0.9" rx="7.4" ry="3.1" fill="#4A2C14" opacity="0.74" />
      <path
        d="M-7.4,0.5 L-9.2,-3.0 M7.2,0.5 L9.0,-2.8"
        stroke="#255E34"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* 3. PLANO TRASEIRO DA COPA (Silhueta orgânica recortada com múltiplos lobos irregulares) */}
      <g transform={`translate(${leanX * 0.3}, -23.8) rotate(${swayBack})`}>
        <path
          d={`M${-21.5 * canopyWidthMod},4.2 C${-25.5 * canopyWidthMod},-0.5 ${
            -24.0 * canopyWidthMod
          },-7.8 ${-18.2 * canopyWidthMod},-11.5 C${-16.5 * canopyWidthMod},-16.8 ${
            -9.5 * canopyWidthMod
          },-19.5 ${-2.5 * canopyWidthMod},-18.2 C${3.5 * canopyWidthMod},-20.2 ${
            11.8 * canopyWidthMod
          },-18.5 ${16.5 * canopyWidthMod},-13.2 C${22.8 * canopyWidthMod},-10.2 ${
            24.8 * canopyWidthMod
          },-2.2 ${20.8 * canopyWidthMod},3.8 C${17.5 * canopyWidthMod},8.8 ${
            10.5 * canopyWidthMod
          },10.2 ${3.5 * canopyWidthMod},9.2 C${-3.5 * canopyWidthMod},10.5 ${
            -16.5 * canopyWidthMod
          },9.0 ${-21.5 * canopyWidthMod},4.2 Z`}
          fill={leafDeep}
        />
        {/* Subvolumes traseiros esquerdo e direito */}
        <path
          d={`M${-19.5 * canopyWidthMod},2.8 C${-22.2 * canopyWidthMod},-2.2 ${
            -18.2 * canopyWidthMod
          },-8.8 ${-11.2 * canopyWidthMod},-10.2 C-5.5,-7.5 -5.0,2.2 -11.5,4.8 C-15.5,5.8 -18.2,4.8 ${
            -19.5 * canopyWidthMod
          },2.8 Z`}
          fill={leafShadow}
        />
        <path
          d={`M10.5,-10.2 C17.8,-9.2 21.8,-2.5 19.2,2.8 C17.8,5.2 14.5,6.0 10.5,4.8 C4.5,2.5 4.8,-7.2 10.5,-10.2 Z`}
          fill={leafShadow}
        />
      </g>

      {/* 4. TRONCO ESCULPIDO, RAÍZES ORGÂNICAS, CASCA TEXTURIZADA E GALHOS RAMIFICADOS */}
      <g>
        <path
          d={`M-7.8,1.8 C-5.2,-1.2 -4.1,-7.2 -3.8,-16.8 L${leftBranchX},${leftBranchY} L${
            leftBranchX + 2.4
          },${leftBranchY - 1.9} L-1.3,-18.8 L${topBranchX - 1.2},${topBranchY} L${
            topBranchX + 1.3
          },${topBranchY} L1.5,-18.8 L${rightBranchX - 2.1},${
            rightBranchY - 1.9
          } L${rightBranchX},${rightBranchY} L3.8,-16.8 C4.1,-7.2 5.2,-1.2 7.8,1.8 C3.6,3.2 -3.6,3.2 -7.8,1.8 Z`}
          fill="#542A10"
        />

        {/* Face direita do tronco e galhos aquecida pela luz solar */}
        <path
          d={`M-0.5,2.3 C-0.3,-5.0 -0.1,-11.0 0.2,-17.8 L${
            topBranchX + 1.2
          },${topBranchY} L1.5,-18.8 L${rightBranchX - 0.5},${
            rightBranchY - 0.6
          } L3.5,-16.2 C3.8,-7.0 4.8,-1.2 6.8,1.6 C3.8,2.5 1.0,2.5 -0.5,2.3 Z`}
          fill="#884B1E"
        />

        {/* Pequena mancha de musgo suave na base sombreada esquerda do tronco */}
        <path
          d="M-6.6,1.5 C-5.2,-1.2 -4.2,-3.8 -3.6,-5.8 C-2.8,-3.5 -3.0,0.2 -4.2,1.9 C-5.2,2.1 -6.0,1.9 -6.6,1.5 Z"
          fill="#2E6F3E"
          opacity="0.55"
        />

        {/* Galhos secundários penetrando na folhagem */}
        <path
          d={`M${leftBranchX * 0.64},${leftBranchY * 0.84} L${leftBranchX * 0.54 - 3.6},${
            leftBranchY - 6.4
          } M${rightBranchX * 0.64},${rightBranchY * 0.84} L${rightBranchX * 0.54 + 3.6},${
            rightBranchY - 6.4
          }`}
          stroke="#3E1E0A"
          strokeWidth="1.65"
          strokeLinecap="round"
        />

        {/* Sulcos naturais da casca e raízes ancoradas */}
        <path
          d="M-2.2,1.3 C-1.8,-4.0 -1.6,-9.0 -1.8,-14.5 M1.6,1.4 C1.8,-3.2 1.6,-8.2 1.4,-13.5"
          stroke="#331707"
          strokeWidth="0.75"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
        <ellipse
          cx="-1.1"
          cy="-8.6"
          rx="1.05"
          ry="1.5"
          fill="#3B1B08"
          stroke="#7A4119"
          strokeWidth="0.4"
        />
        <path
          d="M-6.8,1.5 Q-3.8,0.2 -1.6,2.1 M6.2,1.4 Q3.4,0.3 1.5,2.1"
          stroke="#331707"
          strokeWidth="0.9"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* 5. AGRUPAMENTOS FOLIARES INTERMEDIÁRIOS E SUPERIORES (Volume orgânico em camadas) */}

      {/* Agrupamento Foliar Esquerdo */}
      <g transform={`translate(${leftBranchX}, ${leftBranchY}) rotate(${swayLeft})`}>
        {/* Sombra de oclusão inferior da massa esquerda */}
        <path
          d="M-11.2,4.8 C-15.2,1.2 -14.8,-5.8 -9.2,-9.8 C-5.5,-13.2 2.2,-13.2 6.8,-9.2 C10.8,-5.2 9.8,2.2 4.8,5.6 C0.2,7.8 -6.8,7.6 -11.2,4.8 Z"
          fill={leafShadow}
        />
        {/* Volume médio com recortes foliares naturais nas bordas */}
        <path
          d="M-9.8,3.2 C-13.2,0.2 -12.2,-5.8 -7.2,-9.2 C-3.2,-12.5 3.5,-11.8 7.2,-7.8 C10.2,-4.2 8.8,1.8 4.2,4.2 C0.5,5.8 -6.2,5.5 -9.8,3.2 Z"
          fill={leafDark}
        />
        <path
          d="M-7.5,1.2 C-9.8,-2.5 -7.2,-7.8 -1.8,-9.5 C3.2,-10.8 7.8,-7.8 7.5,-3.2 C7.0,0.8 1.8,2.8 -4.5,2.2 C-6.2,2.0 -6.8,1.8 -7.5,1.2 Z"
          fill={leafMid}
        />
        <path
          d="M-4.2,-3.8 C-2.2,-7.6 2.8,-8.4 5.8,-5.4 C6.8,-2.6 3.5,-0.4 -0.8,-0.6 C-3.5,-0.8 -5.2,-2.0 -4.2,-3.8 Z"
          fill={leafLight}
          opacity="0.86"
        />
        {isApple && unlocked && (
          <>
            {renderAppleFruit(-5.2, 0.8, 2.55, false, 'ap_l1')}
            {renderAppleFruit(1.4, 2.2, 2.25, true, 'ap_l2')}
          </>
        )}
      </g>

      {/* Agrupamento Foliar Direito (Banho de luz solar direta do topo-direita) */}
      <g transform={`translate(${rightBranchX}, ${rightBranchY}) rotate(${swayRight})`}>
        <path
          d="M-9.2,5.2 C-12.2,0.5 -10.2,-6.8 -4.0,-10.5 C2.2,-13.8 10.5,-11.5 13.0,-4.8 C14.8,1.2 10.2,6.6 3.8,7.4 C-1.5,7.8 -5.8,7.2 -9.2,5.2 Z"
          fill={leafShadow}
        />
        <path
          d="M-7.5,3.8 C-10.2,-0.5 -8.0,-7.2 -2.2,-10.0 C3.5,-12.8 10.8,-10.2 12.4,-4.2 C13.6,1.2 9.2,5.6 3.2,6.2 C-1.5,6.5 -5.2,5.5 -7.5,3.8 Z"
          fill={leafDark}
        />
        <path
          d="M-5.0,2.2 C-6.8,-2.4 -3.8,-8.4 2.4,-9.5 C7.8,-10.4 11.8,-5.5 10.8,0.2 C9.8,4.2 2.4,5.0 -5.0,2.2 Z"
          fill={leafMid}
        />
        <path
          d="M-2.0,-2.2 C0.4,-6.8 6.0,-7.8 9.0,-4.4 C10.0,-1.0 7.0,2.4 2.2,2.2 C-1.0,2.0 -3.2,0.2 -2.0,-2.2 Z"
          fill={leafLight}
        />
        <path
          d="M1.4,-4.8 C3.6,-6.8 7.2,-6.2 8.2,-3.6 C8.6,-1.6 5.5,0.2 2.8,-0.4 C0.8,-0.8 0.2,-3.0 1.4,-4.8 Z"
          fill={leafSun}
          opacity="0.82"
        />
        {isApple && unlocked && (
          <>
            {renderAppleFruit(4.6, 0.6, 2.7, false, 'ap_r1')}
            {renderAppleFruit(-1.8, -1.6, 2.35, true, 'ap_r2')}
          </>
        )}
      </g>

      {/* Coroa Superior Principal (Assimétrica, lobada e iluminada no topo-direito) */}
      <g transform={`translate(${topBranchX}, ${topBranchY}) rotate(${swayTop})`}>
        {/* Sombra interna projetada pela coroa superior sobre os tufos abaixo */}
        <path
          d="M-13.5,5.2 C-6.5,8.6 6.5,8.6 13.5,4.8 C8.5,6.8 -7.5,6.8 -13.5,5.2 Z"
          fill={leafDeep}
          opacity="0.62"
        />
        <path
          d="M-14.2,4.2 C-18.0,-1.2 -14.8,-9.8 -7.2,-12.5 C-1.2,-16.2 8.8,-14.8 13.8,-9.0 C17.8,-3.8 15.6,3.8 9.2,6.2 C3.2,8.4 -8.8,8.2 -14.2,4.2 Z"
          fill={leafDark}
        />
        <path
          d="M-11.0,2.0 C-13.4,-3.5 -9.2,-9.8 -2.4,-11.6 C4.2,-13.2 11.8,-10.2 13.2,-4.4 C14.2,1.0 8.2,5.2 0.4,5.2 C-5.2,5.2 -8.8,4.0 -11.0,2.0 Z"
          fill={leafMid}
        />
        <path
          d="M-5.8,-3.2 C-3.2,-8.4 3.6,-9.8 8.8,-6.6 C11.2,-3.2 8.2,1.2 2.4,1.4 C-2.0,1.4 -6.8,0.2 -5.8,-3.2 Z"
          fill={leafLight}
        />
        <path
          d="M-0.8,-6.2 C1.8,-8.8 6.2,-8.4 7.8,-5.6 C8.4,-3.4 5.2,-1.4 1.8,-1.8 C-0.8,-2.2 -2.2,-4.2 -0.8,-6.2 Z"
          fill={leafSun}
          opacity={sunWarmthOpacity}
        />
        {isApple && unlocked && (
          <>
            {renderAppleFruit(-3.8, -1.8, 2.65, false, 'ap_t1')}
            {renderAppleFruit(5.6, -4.4, 2.45, false, 'ap_t2')}
            {renderAppleFruit(0.8, 2.0, 2.25, true, 'ap_t3')}
            {/* Pequenas flores campestres da macieira */}
            <circle cx="0.6" cy="-7.2" r="1.35" fill="#FFFBEB" />
            <circle cx="0.6" cy="-7.2" r="0.5" fill="#FACC15" />
            <circle cx="-7.2" cy="-4.6" r="1.15" fill="#FFFBEB" opacity="0.9" />
            <circle cx="-7.2" cy="-4.6" r="0.45" fill="#FACC15" />
          </>
        )}
      </g>

      {/* 6. PLANO FRONTAL INTERMEDIÁRIO (Tufos que abraçam a bifurcação deixando parte dos galhos visível) */}
      <g transform={`translate(${leanX * 0.4}, -18.0) rotate(${swayFront * 0.72})`}>
        <path
          d="M-12.2,2.4 C-14.2,-1.8 -10.2,-6.4 -4.4,-5.4 C-1.2,-4.4 -1.0,0.2 -3.4,2.5 C-6.4,3.6 -9.8,3.4 -12.2,2.4 Z"
          fill={leafDark}
        />
        <path
          d="M-10.2,1.4 C-11.5,-1.5 -8.5,-4.8 -4.2,-4.2 C-2.0,-3.5 -1.8,-0.2 -3.8,1.5 C-6.2,2.4 -8.6,2.2 -10.2,1.4 Z"
          fill={leafMid}
        />
        <path
          d="M3.0,1.8 C0.8,-0.8 2.0,-5.4 6.2,-5.5 C10.4,-5.5 12.8,-1.2 10.5,2.2 C8.4,3.8 5.2,3.2 3.0,1.8 Z"
          fill={leafMid}
        />
        <path
          d="M4.2,0.6 C2.8,-1.2 3.8,-4.2 6.8,-4.2 C9.6,-4.2 11.0,-1.4 9.4,1.0 C7.8,2.2 5.6,1.8 4.2,0.6 Z"
          fill={leafLight}
          opacity="0.92"
        />
        {isApple && unlocked && renderAppleFruit(6.4, 0.4, 2.35, false, 'ap_f1')}
      </g>

      {/* 7. Integração ao solo: pedrinha campestre quente, fruto/folha caída e tufos de grama */}
      <ellipse cx="-5.4" cy="2.1" rx="2.3" ry="1.1" fill="#072617" opacity="0.28" />
      <ellipse cx="-5.4" cy="1.9" rx="2.1" ry="1.05" fill="#78716C" opacity="0.85" />
      <ellipse cx="-5.6" cy="1.6" rx="1.25" ry="0.55" fill="#D6D3D1" opacity="0.72" />
      {isApple && unlocked ? (
        <g transform="translate(5.8, 2.1)">
          <ellipse cx="-0.2" cy="0.6" rx="1.8" ry="0.8" fill="#072617" opacity="0.38" />
          <circle cx="0" cy="0" r="1.65" fill="#DC2626" />
          <circle cx="0.4" cy="-0.4" r="0.55" fill="#FCA5A5" />
        </g>
      ) : (
        <ellipse
          cx="5.8"
          cy="2.2"
          rx="1.7"
          ry="0.8"
          transform="rotate(-14 5.8 2.2)"
          fill="#C26D1B"
          opacity="0.76"
        />
      )}
      <path
        d="M-3.5,2.1 L-4.9,-1.2 M-1.4,2.3 L-1.2,-0.8 M2.4,2.2 L3.8,-1.2 M4.6,1.8 L6.4,-1.0"
        stroke="#255E34"
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
 * Arbusto e Moita Orgânica em Camadas com pedrinhas, bagas silvestres e iluminação suave
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
  const swayL = computeBreezeAngle(timeSec, seed + 0.5, windStrength, 1.25);
  const swayR = computeBreezeAngle(timeSec + 0.5, seed + 2.1, windStrength, 1.35);
  const u = seededUnit(seed, 7);
  const wScale = 0.94 + u * 0.14;

  return (
    <g
      transform={`translate(${screenX}, ${screenY}) scale(${scale * wScale}, ${scale})`}
      opacity={unlocked ? 1 : 0.45}
    >
      {/* Sombra de contato gradual em 3 camadas projetada suavemente para a esquerda-baixo */}
      <ellipse cx="-1.6" cy="1.8" rx="14.2" ry="5.6" fill="#0B2E1B" opacity="0.18" />
      <ellipse cx="-0.8" cy="1.4" rx="10.5" ry="4.2" fill="#072617" opacity="0.25" />
      <ellipse cx="-0.2" cy="1.1" rx="6.8" ry="2.7" fill="#051B10" opacity="0.3" />

      {/* Pequena pedra campestre quente ao lado da moita com sombra de assento */}
      <ellipse cx="-8.9" cy="1.9" rx="2.9" ry="1.5" fill="#072617" opacity="0.28" />
      <ellipse cx="-8.8" cy="1.6" rx="2.7" ry="1.45" fill="#78716C" />
      <ellipse cx="-9.1" cy="1.15" rx="1.65" ry="0.8" fill="#D6D3D1" opacity="0.76" />

      {/* Galhinhos internos da moita */}
      <path
        d="M-3,1 L-5.5,-3.2 M0,1.2 L0,-4.2 M3,1 L5.5,-3.2"
        stroke="#4E2712"
        strokeWidth="1.35"
        strokeLinecap="round"
      />

      {/* Volume foliar de fundo */}
      <path
        d="M-11.0,0.8 C-13.2,-3.8 -9.2,-9.6 -2.2,-10.2 C3.8,-10.8 9.8,-8.8 11.4,-3.4 C12.0,0 8.8,2.4 0,2.4 C-6.8,2.4 -9.8,1.8 -11.0,0.8 Z"
        fill="#133E24"
      />

      {/* Tufo Esquerdo */}
      <g transform={`translate(-3.8, -2.2) rotate(${swayL})`}>
        <path
          d="M-7.0,2.2 C-9.2,-1.8 -6.2,-6.8 -0.2,-7.4 C4.4,-7.4 6.6,-3.4 5.4,1.2 C4.2,3.2 -3.4,3.2 -7.0,2.2 Z"
          fill="#1E5D34"
        />
        <path
          d="M-4.4,-1.6 C-2.2,-4.8 2.2,-4.8 3.8,-2.0 C4.4,0.2 1.2,1.2 -4.4,-1.6 Z"
          fill="#35864B"
          opacity="0.88"
        />
      </g>

      {/* Tufo Direito iluminado */}
      <g transform={`translate(3.8, -2.6) rotate(${swayR})`}>
        <path
          d="M-4.4,2.2 C-5.4,-2.0 -2.2,-6.8 3.2,-6.8 C7.8,-6.8 9.8,-2.4 7.8,1.6 C5.8,3.2 -1.0,3.2 -4.4,2.2 Z"
          fill="#287340"
        />
        <path
          d="M-1.2,-2.6 C1.0,-5.2 5.2,-4.8 6.4,-2.0 C6.8,0.2 3.2,1.2 -1.2,-2.6 Z"
          fill="#54A862"
          opacity="0.9"
        />
        <path
          d="M1.2,-3.8 C2.8,-5.0 5.0,-4.5 5.6,-2.8 C5.8,-1.5 3.6,-0.8 1.2,-3.8 Z"
          fill="#85CF8E"
          opacity="0.72"
        />
        {hasBerries && unlocked && (
          <>
            <circle cx="-1.2" cy="-1.4" r="1.45" fill="#DC2626" />
            <circle cx="-0.9" cy="-1.7" r="0.45" fill="#FCA5A5" />
            <circle cx="3.6" cy="-0.9" r="1.35" fill="#E11D48" />
            <circle cx="3.9" cy="-1.2" r="0.4" fill="#FDA4AF" />
            <circle cx="1.2" cy="-3.6" r="1.35" fill="#EF4444" />
            <circle cx="1.5" cy="-3.9" r="0.4" fill="#FCA5A5" />
          </>
        )}
      </g>

      {/* Grama rasteira frontal integrando o arbusto ao chão */}
      <path
        d="M-4.5,2.1 L-5.8,-0.6 M0.8,2.3 L1.4,-0.4 M5.2,1.9 L6.6,-0.6"
        stroke="#255E34"
        strokeWidth="1.05"
        strokeLinecap="round"
      />
    </g>
  );
};

// ============================================================================
// VIDA AMBIENTAL 1: VEGETAÇÃO RASTEIRA, TREVOS E FLORES SILVESTRES EM AGRUPAMENTOS
// ============================================================================
export interface GroundFloraConfig {
  id: string;
  gx: number;
  gy: number;
  kind: 'daisy_cluster' | 'clover_patch' | 'wild_blossom' | 'meadow_tuft';
  colorPrimary?: string;
  colorSecondary?: string;
  fallenLeaf?: string | null;
  stone?: boolean;
  scale: number;
  seed: number;
  zone: string;
}

interface GroundFloraArtworkProps {
  flora: GroundFloraConfig;
  screenX: number;
  screenY: number;
  unlocked: boolean;
  timeSec: number;
  windStrength: number;
}

/**
 * Renderizador de Flores Silvestres, Trevos e Tufos de Grama Rasteira
 * - Agrupamentos irregulares determinísticos (margaridas, trevos de 3 folhas, flores campestres e tufos).
 * - Balanço sutil ao vento compartilhando o mesmo ciclo de animação da fazenda.
 */
export const IsometricGroundFloraArtwork: React.FC<GroundFloraArtworkProps> = ({
  flora,
  screenX,
  screenY,
  unlocked,
  timeSec,
  windStrength,
}) => {
  const { kind, colorPrimary = '#FEF08A', colorSecondary = '#FDE047', fallenLeaf, stone, scale, seed } =
    flora;

  const sway = computeBreezeAngle(timeSec, seed, windStrength, 1.65);
  const tilt = (seededUnit(seed, 3) - 0.5) * 8;

  return (
    <g
      transform={`translate(${screenX}, ${screenY}) scale(${scale})`}
      opacity={unlocked ? 1 : 0.38}
      className="pointer-events-none"
    >
      {/* Sombra de contato suave projetada para a esquerda-baixo */}
      <ellipse cx="-0.7" cy="0.95" rx="4.6" ry="1.85" fill="#072617" opacity="0.2" />

      {/* Pedrinha campestre quente opcional com sombra de assento */}
      {stone && (
        <g transform="translate(4.4, 1.2)">
          <ellipse cx="-0.1" cy="0.25" rx="2.25" ry="1.1" fill="#072617" opacity="0.25" />
          <ellipse cx="0" cy="0" rx="2.1" ry="1.05" fill="#78716C" opacity="0.86" />
          <ellipse cx="-0.25" cy="-0.3" rx="1.2" ry="0.55" fill="#D6D3D1" opacity="0.74" />
        </g>
      )}

      {/* Folha caída opcional */}
      {fallenLeaf && (
        <ellipse
          cx="-4.6"
          cy="1.4"
          rx="1.8"
          ry="0.85"
          transform="rotate(-18 -4.6 1.4)"
          fill={fallenLeaf}
          opacity="0.78"
        />
      )}

      {/* ESPÉCIE A: Manchinha de Trevos Campestres (Clover Patch) */}
      {kind === 'clover_patch' && (
        <g transform={`rotate(${tilt * 0.4 + sway * 0.55})`}>
          {[
            { cx: -2.6, cy: -0.6, s: 0.92, col: '#256B37', light: '#489E58' },
            { cx: 1.8, cy: -1.1, s: 1.0, col: '#2E7D42', light: '#62B66F' },
            { cx: -0.2, cy: 0.8, s: 0.85, col: '#1E562B', light: '#3C894B' },
          ].map((cl, i) => (
            <g key={i} transform={`translate(${cl.cx}, ${cl.cy}) scale(${cl.s})`}>
              <ellipse cx="-1.1" cy="-0.6" rx="1.25" ry="0.85" transform="rotate(-25 -1.1 -0.6)" fill={cl.col} />
              <ellipse cx="1.1" cy="-0.6" rx="1.25" ry="0.85" transform="rotate(25 1.1 -0.6)" fill={cl.light} />
              <ellipse cx="0" cy="0.65" rx="1.15" ry="0.8" fill={cl.col} />
              <circle cx="0" cy="-0.15" r="0.35" fill="#A7F3D0" opacity="0.65" />
            </g>
          ))}
          {colorPrimary && (
            <g transform="translate(0.4, -2.4)">
              <circle cx="-0.7" cy="0" r="0.9" fill={colorPrimary} />
              <circle cx="0.7" cy="0" r="0.9" fill={colorPrimary} />
              <circle cx="0" cy="-0.7" r="0.9" fill={colorPrimary} />
              <circle cx="0" cy="0.7" r="0.9" fill={colorPrimary} />
              <circle cx="0" cy="0" r="0.6" fill="#F59E0B" />
            </g>
          )}
        </g>
      )}

      {/* ESPÉCIE B: Agrupamento Irregular de Margaridas / Flores do Campo (Daisy Cluster) */}
      {kind === 'daisy_cluster' && (
        <g transform={`rotate(${tilt + sway})`}>
          <path
            d="M-0.8,0.4 Q-2.6,-2.8 -3.8,-5.4 M0,0.5 L0.2,-6.8 M0.8,0.4 Q2.6,-2.5 3.6,-4.8"
            stroke="#1E562B"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Flor principal mais alta */}
          <g transform="translate(0.2, -7.1)">
            <circle cx="-1.1" cy="0" r="1.1" fill={colorPrimary} />
            <circle cx="1.1" cy="0" r="1.1" fill={colorPrimary} />
            <circle cx="0" cy="-1.0" r="1.1" fill={colorPrimary} />
            <circle cx="0" cy="1.0" r="1.1" fill={colorPrimary} />
            <circle cx="0" cy="0" r="0.85" fill="#D97706" />
          </g>
          {/* Flor secundária menor à esquerda */}
          <g transform="translate(-3.8, -5.5) scale(0.82)">
            <circle cx="-1.0" cy="0" r="1.0" fill={colorSecondary} />
            <circle cx="1.0" cy="0" r="1.0" fill={colorSecondary} />
            <circle cx="0" cy="-0.9" r="1.0" fill={colorSecondary} />
            <circle cx="0" cy="0.9" r="1.0" fill={colorSecondary} />
            <circle cx="0" cy="0" r="0.75" fill="#B45309" />
          </g>
        </g>
      )}

      {/* ESPÉCIE C: Flor Silvestre Lavanda/Azul em Espiga (Wild Blossom) */}
      {kind === 'wild_blossom' && (
        <g transform={`rotate(${tilt + sway * 1.05})`}>
          <path
            d="M-0.5,0.4 Q-2.1,-2.6 -3.1,-5.0 M0.2,0.5 Q0.8,-3.5 1.1,-7.2 M0.7,0.4 Q2.5,-2.2 3.8,-4.2"
            stroke="#236332"
            strokeWidth="1.15"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="1.0" cy="-7.2" rx="1.2" ry="1.6" fill={colorPrimary} />
          <ellipse cx="0.8" cy="-5.2" rx="1.35" ry="1.4" fill={colorSecondary} />
          <circle cx="1.1" cy="-7.5" r="0.55" fill="#FEF9C3" />
          <circle cx="-3.1" cy="-5.2" r="1.25" fill={colorPrimary} />
          <circle cx="-3.1" cy="-5.2" r="0.5" fill="#F59E0B" />
        </g>
      )}

      {/* ESPÉCIE D: Tufo Orgânico de Grama Campestre (Meadow Tuft) */}
      {kind === 'meadow_tuft' && (
        <g transform={`rotate(${tilt + sway * 0.9})`}>
          <path
            d="M-1.2,0.4 Q-2.8,-2.4 -4.2,-4.8 M-0.2,0.5 Q-0.6,-3.2 -0.9,-6.2 M0.6,0.5 Q1.8,-2.8 2.8,-5.6 M1.4,0.3 Q3.2,-1.6 4.5,-3.4"
            stroke="#1E562B"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M-0.1,0.4 Q0.4,-2.8 0.8,-5.6 M1.0,0.4 Q2.4,-2.0 3.4,-4.2"
            stroke="#469950"
            strokeWidth="0.9"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  );
};

// ============================================================================
// VIDA AMBIENTAL 2: BORBOLETAS ESTILIZADAS COM ASAS DUPLAS E VOO CURVO NATURAL
// ============================================================================
export interface ButterflyFlightConfig {
  id: string;
  baseGx: number;
  baseGy: number;
  radiusX: number;
  radiusY: number;
  speed: number;
  phase: number;
  wingPrimary: string;
  wingSecondary: string;
  wingEdge: string;
  scale: number;
  zone: string;
}

interface IsometricButterflyArtworkProps {
  screenX: number;
  screenY: number;
  headingDeg: number;
  flapPhase: number;
  flutterY: number;
  wingPrimary: string;
  wingSecondary: string;
  wingEdge: string;
  scale: number;
}

/**
 * Renderizador de Borboleta Campestre Estilizada
 * - Asas anteriores e posteriores distintas (nunca parece um ponto sem forma).
 * - Batimento suave com variação entre planeio e batida delicada.
 */
export const IsometricButterflyArtwork: React.FC<IsometricButterflyArtworkProps> = ({
  screenX,
  screenY,
  headingDeg,
  flapPhase,
  flutterY,
  wingPrimary,
  wingSecondary,
  wingEdge,
  scale,
}) => {
  // Combina batimento suave com breves momentos de planeio aberto
  const glideMod = 0.75 + 0.25 * Math.sin(flapPhase * 0.22);
  const wingOpen = 0.28 + Math.abs(Math.sin(flapPhase)) * 0.72 * glideMod;

  return (
    <g
      transform={`translate(${screenX}, ${screenY}) scale(${scale})`}
      className="pointer-events-none"
    >
      {/* Sombra discreta no gramado para ancorar a altura de voo na perspectiva isométrica */}
      <ellipse cx="-1.0" cy="3.8" rx="3.2" ry="1.35" fill="#072617" opacity="0.2" />

      {/* Corpo e asas suspensos suavemente acima das flores */}
      <g transform={`translate(0, ${-21 + flutterY}) rotate(${headingDeg * 0.22})`}>
        <g transform={`scale(1, ${wingOpen})`}>
          {/* Asas Posteriores (Menores e arredondadas) */}
          <path
            d="M-0.4,0.2 C-3.2,0.8 -5.4,2.8 -4.2,4.4 C-2.8,5.4 -0.8,3.6 -0.2,1.2 Z"
            fill={wingSecondary}
            stroke={wingEdge}
            strokeWidth="0.45"
          />
          <path
            d="M0.4,0.2 C3.2,0.8 5.4,2.8 4.2,4.4 C2.8,5.4 0.8,3.6 0.2,1.2 Z"
            fill={wingSecondary}
            stroke={wingEdge}
            strokeWidth="0.45"
          />

          {/* Asas Anteriores (Maiores e recortadas com detalhe interno claro) */}
          <path
            d="M-0.3,-0.6 C-3.6,-4.4 -7.4,-3.8 -6.6,-0.4 C-6.0,1.8 -2.8,1.6 -0.3,0.4 Z"
            fill={wingPrimary}
            stroke={wingEdge}
            strokeWidth="0.5"
          />
          <path
            d="M0.3,-0.6 C3.6,-4.4 7.4,-3.8 6.6,-0.4 C6.0,1.8 2.8,1.6 0.3,0.4 Z"
            fill={wingPrimary}
            stroke={wingEdge}
            strokeWidth="0.5"
          />

          {/* Pinta luminosa delicada nas asas anteriores */}
          <circle cx="-3.8" cy="-1.4" r="0.85" fill="#FFFBEB" opacity="0.85" />
          <circle cx="3.8" cy="-1.4" r="0.85" fill="#FFFBEB" opacity="0.85" />
        </g>

        {/* Tórax/Abdômen e antenas finas */}
        <ellipse cx="0" cy="0.4" rx="0.7" ry="2.4" fill="#1E293B" />
        <path
          d="M-0.2,-1.6 Q-1.2,-3.2 -2.0,-3.4 M0.2,-1.6 Q1.2,-3.2 2.0,-3.4"
          stroke="#1E293B"
          strokeWidth="0.4"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
};

// ============================================================================
// VIDA AMBIENTAL 3: PASSARINHOS CAMPESTRES (POUSADOS EM GALHOS E VOO OCASIONAL)
// ============================================================================
export interface AmbientBirdConfig {
  id: string;
  perchGx: number;
  perchGy: number;
  perchHeightY: number; // Offset vertical do galho/apoio em relação à base (screenY)
  flightArcDx: number;  // Deslocamento lateral suave no arco de voo curto
  flightArcDy: number;  // Elevação adicional no ápice do voo
  cycleDurationSec: number;
  phaseOffsetSec: number;
  plumagePrimary: string;
  plumageBreast: string;
  plumageWing: string;
  facingLeft: boolean;
  zone: string;
  scale: number;
}

interface IsometricBirdArtworkProps {
  bird: AmbientBirdConfig;
  baseScreenX: number;
  baseScreenY: number;
  unlocked: boolean;
  timeSec: number;
  isRaining: boolean;
}

/**
 * Renderizador de Passarinho Campestre Isométrico
 * - Permanece pousado no galho na maior parte do tempo com movimentos sutis de cabeça, cauda e asas.
 * - Ocasionalmente faz um voo curto em arco suave acima da copa e retorna ao pouso (desfasado entre indivíduos).
 */
export const IsometricBirdArtwork: React.FC<IsometricBirdArtworkProps> = ({
  bird,
  baseScreenX,
  baseScreenY,
  unlocked,
  timeSec,
  isRaining,
}) => {
  if (!unlocked) return null;

  const {
    perchHeightY,
    flightArcDx,
    flightArcDy,
    cycleDurationSec,
    phaseOffsetSec,
    plumagePrimary,
    plumageBreast,
    plumageWing,
    facingLeft,
    scale,
  } = bird;

  const cycleTime = (timeSec + phaseOffsetSec) % cycleDurationSec;
  // O voo dura apenas ~4.2 segundos dentro de um ciclo longo (ex: 23s a 31s), e não ocorre sob chuva forte
  const flightDuration = 4.2;
  const isFlying = !isRaining && cycleTime < flightDuration;

  let offsetX = 0;
  let offsetY = perchHeightY;
  let dirFlip = facingLeft ? -1 : 1;
  let wingFlapDeg = 0;
  let headTiltDeg = 0;
  let bodyHopY = 0;
  let tailBobDeg = 0;

  if (isFlying) {
    // p vai de 0 a 1 durante o voo de ida e volta ao galho
    const p = cycleTime / flightDuration;
    const smoothLoop = Math.sin(p * Math.PI); // 0 -> 1 -> 0
    const figureEight = Math.sin(p * Math.PI * 2); // + na ida, - na volta

    offsetX = flightArcDx * smoothLoop + figureEight * 14;
    offsetY = perchHeightY - Math.sin(p * Math.PI) * flightArcDy - Math.abs(figureEight) * 6;

    // Olha para a direção do deslocamento horizontal atual
    const vx =
      flightArcDx * Math.cos(p * Math.PI) * Math.PI +
      14 * Math.cos(p * Math.PI * 2) * Math.PI * 2;
    dirFlip = vx < 0 ? -1 : 1;
    wingFlapDeg = Math.sin(timeSec * 32 + phaseOffsetSec) * 38;
    tailBobDeg = Math.sin(timeSec * 16) * 8;
  } else {
    // Comportamento natural pousado no galho: olha ao redor, dá pequenos pulinhos raros e ajeita a asa
    const perchTime = cycleTime - flightDuration;
    const lookWave = Math.sin(perchTime * 2.1 + phaseOffsetSec);
    headTiltDeg = lookWave > 0.35 ? 14 : lookWave < -0.45 ? -12 : 0;

    // Vira de lado ocasionalmente enquanto está pousado
    if (Math.sin(perchTime * 0.55 + phaseOffsetSec) < -0.35) {
      dirFlip = -dirFlip;
    }

    // Pequeno ajuste discreto de asa quando pousado
    const twitchWindow = Math.sin(perchTime * 1.8 + phaseOffsetSec * 2.3);
    if (twitchWindow > 0.86) {
      wingFlapDeg = Math.sin(timeSec * 26) * 12;
      bodyHopY = -0.9;
    }

    tailBobDeg = Math.sin(timeSec * 3.4 + phaseOffsetSec) * 4.5;
  }

  return (
    <g
      transform={`translate(${baseScreenX + offsetX}, ${baseScreenY + offsetY + bodyHopY}) scale(${scale})`}
      className="pointer-events-none"
    >
      {/* Sombra de contato discreta sob as patinhas apenas quando pousado no galho */}
      {!isFlying && (
        <ellipse cx="0" cy="1.8" rx="3.4" ry="1.2" fill="#072617" opacity="0.32" />
      )}

      <g transform={`scale(${dirFlip}, 1)`}>
        {/* Patinhas finas ancoradas ao galho quando pousado */}
        {!isFlying && (
          <path
            d="M-0.8,0.2 L-1.1,1.8 M0.8,0.2 L0.6,1.8"
            stroke="#78350F"
            strokeWidth="0.75"
            strokeLinecap="round"
          />
        )}

        {/* Cauda estreita articulada */}
        <g transform={`translate(-3.4, -0.6) rotate(${tailBobDeg})`}>
          <path d="M0,0 L-4.2,-1.6 L-3.6,0.6 Z" fill={plumageWing} />
        </g>

        {/* Corpo roliço do passarinho */}
        <ellipse cx="0" cy="-1.2" rx="3.8" ry="2.5" fill={plumagePrimary} />
        {/* Peito macio aquecido pela luz */}
        <path
          d="M-1.2,-0.8 C0.8,-0.8 2.8,-1.8 3.5,-0.5 C3.2,1.1 0.8,1.5 -1.6,0.8 Z"
          fill={plumageBreast}
        />

        {/* Asa em movimento (aberta no voo ou recolhida com leve agito no pouso) */}
        <g transform={`translate(-0.4, -1.6) rotate(${wingFlapDeg})`}>
          {isFlying ? (
            <path
              d="M-1.5,0 C-2.2,-4.6 1.8,-6.2 3.2,-1.2 C1.5,0.4 -0.5,0.4 -1.5,0 Z"
              fill={plumageWing}
            />
          ) : (
            <ellipse
              cx="-0.2"
              cy="0.2"
              rx="2.5"
              ry="1.35"
              transform="rotate(-10)"
              fill={plumageWing}
            />
          )}
        </g>

        {/* Cabeça articulada, olhinho vivo e bico cônico */}
        <g transform={`translate(2.6, -2.8) rotate(${headTiltDeg})`}>
          <circle cx="0" cy="0" r="2.15" fill={plumagePrimary} />
          <circle cx="0.65" cy="-0.35" r="0.55" fill="#0F172A" />
          <circle cx="0.8" cy="-0.5" r="0.2" fill="#FFFFFF" />
          <polygon points="1.8,-0.5 4.0,0.1 1.8,0.65" fill="#F59E0B" />
        </g>
      </g>
    </g>
  );
};

// ============================================================================
// ELEMENTO AMBIENTAL 4: LAGOA NATURAL COM PROFUNDIDADE, MARGENS ORGÂNICAS,
// VEGETAÇÃO AQUÁTICA E ONDULAÇÕES SUAVES DE ÁGUA
// ============================================================================
export interface IsometricPondArtworkProps {
  centerScreenX: number;
  centerScreenY: number;
  unlocked: boolean;
  timeSec: number;
  windStrength: number;
  isRaining: boolean;
  isSunny: boolean;
  isBreezy: boolean;
}

/**
 * Lagoa Campestre Natural 3D Isométrica
 * - Preserva exatamente a mesma localização e proporção na Zona Sul (gx ~ 2.25, gy ~ 8.32).
 * - Transição gradual de profundidade: margem rasa translúcida -> água intermediária esmeralda/turquesa -> centro profundo.
 * - Borda terrosa úmida, pedras parcialmente submersas, pequenos juncos/taboas que balançam à brisa e vitórias-régias flutuantes.
 * - Ondulações concêntricas sutis, reflexos de luz ambiental dinâmicos conforme o clima e anéis de pingos quando chove.
 */
export const IsometricPondArtwork: React.FC<IsometricPondArtworkProps> = ({
  centerScreenX,
  centerScreenY,
  unlocked,
  timeSec,
  windStrength,
  isRaining,
  isSunny,
  isBreezy,
}) => {
  // Deslocamentos suaves e discretos das linhas d'água e reflexos (reutilizando timeSec sem criar loops extras)
  const wavePhase1 = Math.sin(timeSec * (isBreezy ? 2.05 : 1.42));
  const wavePhase2 = Math.cos(timeSec * (isBreezy ? 1.7 : 1.15) + 1.3);
  const shimmerScale = 0.94 + Math.sin(timeSec * 1.8) * 0.06;

  // Balanço suave dos juncos/plantas aquáticas da margem acompanhando a brisa da fazenda
  const reedSwayLeft = computeBreezeAngle(timeSec, 9.2, windStrength, 2.2);
  const reedSwayRight = computeBreezeAngle(timeSec + 0.4, 14.6, windStrength, 2.0);
  const lilyBob = Math.sin(timeSec * 1.55 + 0.8) * 0.35;

  // Cores da superfície e reflexos moduladas suavemente pelo clima atual
  const shallowWaterColor = isRaining
    ? '#38BDF8'
    : isSunny
    ? '#5EEAD4'
    : '#4FD1C5';
  const midWaterColor = isRaining
    ? '#0284C7'
    : isSunny
    ? '#0D9488'
    : '#0EA5E9';
  const deepWaterColor = isRaining
    ? '#0C4A6E'
    : isSunny
    ? '#115E59'
    : '#0369A1';
  const skyReflectionColor = isSunny
    ? '#FEF9C3'
    : isRaining
    ? '#BAE6FD'
    : '#E0F2FE';
  const specularOpacity = isSunny ? 0.56 : isRaining ? 0.25 : 0.42;

  return (
    <g
      transform={`translate(${centerScreenX}, ${centerScreenY})`}
      opacity={unlocked ? 0.98 : 0.38}
      className="pointer-events-none"
    >
      {/* 1. Halo externo de gramado úmido e sombreado ao redor da bacia da lagoa */}
      <path
        d="M-49,2.8 C-53,-9.5 -31,-20 -2,-21 C27,-22 51,-11.5 49,1.8 C47,14.5 23,21.5 -4,20.5 C-31,19.5 -46,13.5 -49,2.8 Z"
        fill="#143D23"
        opacity="0.36"
      />

      {/* 2. Margem de terra úmida e cascalho orgânico (transição suave entre grama e água) */}
      <path
        d="M-45,2.2 C-49,-8.5 -29,-17.8 -2,-18.8 C25,-19.8 47,-10.2 45,1.2 C43,12.8 21,18.8 -4,17.8 C-29,16.8 -42,11.5 -45,2.2 Z"
        fill={isRaining ? '#4A2C16' : '#5E3D22'}
        opacity="0.86"
      />
      <path
        d="M-42,1.8 C-46,-7.8 -27,-16.4 -2,-17.2 C23,-18.0 44,-9.2 42,1.2 C40,11.8 19,17.2 -4,16.2 C-27,15.2 -39,10.2 -42,1.8 Z"
        fill="#825632"
        opacity="0.62"
      />

      {/* 3. Camada de água rasa nas bordas (translúcida, deixando perceber o fundo arenoso/pedregoso) */}
      <path
        d="M-40,1.2 C-43,-7.2 -25,-14.8 -2,-15.6 C21.5,-16.4 41,-8.2 39,1.2 C37,10.6 17.5,15.6 -4,14.6 C-25.5,13.6 -37,8.4 -40,1.2 Z"
        fill={shallowWaterColor}
        opacity="0.82"
      />

      {/* Seixos submersos visíveis na água rasa próxima à borda */}
      <ellipse cx="-26" cy="6.2" rx="3.2" ry="1.5" fill="#0F4C5C" opacity="0.28" />
      <ellipse cx="24" cy="-5.4" rx="2.8" ry="1.3" fill="#0F4C5C" opacity="0.25" />
      <ellipse cx="12" cy="9.2" rx="2.5" ry="1.2" fill="#0F4C5C" opacity="0.24" />

      {/* 4. Camada intermediária da lagoa (tom esmeralda/turquesa natural) */}
      <path
        d="M-35,1.0 C-38,-6.2 -21,-12.8 -1.5,-13.5 C18.5,-14.2 35,-7.0 33.5,1.0 C32,9.0 15,13.2 -3.5,12.4 C-22,11.6 -32,7.2 -35,1.0 Z"
        fill="url(#pondWater)"
        opacity="0.94"
      />
      <path
        d="M-31,0.8 C-33,-5.4 -18,-11.0 -1,-11.6 C16,-12.2 30.5,-6.0 29,0.8 C27.5,7.8 13,11.4 -3,10.8 C-19,10.2 -28,6.2 -31,0.8 Z"
        fill={midWaterColor}
        opacity="0.38"
      />

      {/* 5. Leito central mais profundo (mais escuro e sereno no meio da lagoa) */}
      <path
        d="M-23,0.4 C-25,-4.4 -13,-8.6 0,-8.8 C13.5,-9.0 24.5,-4.0 23,0.8 C21.5,5.6 9.5,8.4 -2.8,7.8 C-15,7.4 -21,4.6 -23,0.4 Z"
        fill={deepWaterColor}
        opacity="0.52"
      />

      {/* 6. Sombra interna da margem superior-direita projetada na água rasa (profundidade 3D) */}
      <path
        d="M-37,-2.2 C-31,-9.2 -14,-14.4 4,-14.6 C22,-14.8 36,-8.2 37,-0.5 C32,-5.8 19,-10.8 2,-11.2 C-15,-11.6 -29,-7.4 -37,-2.2 Z"
        fill="#063946"
        opacity="0.32"
      />

      {/* 7. Reflexo suave da vegetação próxima e do céu na superfície da água */}
      <path
        d="M-28,2.5 C-24,-1.8 -12,-4.5 -1,-3.8 C9,-3.2 16,0.8 13,4.8 C10,8.4 -4,9.8 -16,8.4 C-24,7.2 -30,4.8 -28,2.5 Z"
        fill="#134E4A"
        opacity="0.22"
      />
      <ellipse
        cx={6 + wavePhase1 * 1.4}
        cy={-2.5 + wavePhase2 * 0.45}
        rx={15 * shimmerScale}
        ry={4.6 * shimmerScale}
        transform="rotate(-8 6 -2.5)"
        fill={skyReflectionColor}
        opacity={specularOpacity * 0.42}
      />

      {/* 8. Ondulações orgânicas suaves e reflexos especulares da luz solar/ambiental */}
      <path
        d={`M ${-18 + wavePhase1 * 1.6},${-3.8 + wavePhase2 * 0.4} Q ${-5 + wavePhase1 * 1.1},${-7.2 + wavePhase2 * 0.45} ${8 + wavePhase1 * 1.5},${-4.0 + wavePhase2 * 0.4}`}
        stroke={skyReflectionColor}
        strokeWidth="1.25"
        fill="none"
        strokeLinecap="round"
        opacity={specularOpacity}
      />
      <path
        d={`M ${-10 - wavePhase2 * 1.5},${3.8 - wavePhase1 * 0.4} Q ${4 - wavePhase2 * 1.1},${1.2 - wavePhase1 * 0.4} ${19 - wavePhase2 * 1.5},${4.2 - wavePhase1 * 0.4}`}
        stroke="#E0F2FE"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
        opacity={specularOpacity * 0.85}
      />
      <path
        d={`M ${-23 + wavePhase2 * 1.1},${5.6} Q ${-12 + wavePhase2 * 0.9},${3.8} ${-2 + wavePhase2 * 1.1},${5.8}`}
        stroke="#BAE6FD"
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
        opacity={specularOpacity * 0.68}
      />

      {/* Pequenos brilhos solares pontuais na água em tempo ensolarado */}
      {isSunny && (
        <g opacity={0.45 + Math.sin(timeSec * 2.6) * 0.2}>
          <ellipse cx={11 + wavePhase1 * 1.1} cy="-4.6" rx="2.0" ry="0.75" fill="#FEF9C3" />
          <ellipse cx={2 - wavePhase2 * 0.9} cy="-1.0" rx="1.5" ry="0.55" fill="#FFFFFF" />
          <ellipse cx={16 + wavePhase2 * 0.8} cy="1.2" rx="1.3" ry="0.5" fill="#FEF9C3" />
        </g>
      )}

      {/* 9. Anéis concêntricos sutis de gotas de chuva na superfície da lagoa (apenas durante chuva) */}
      {isRaining && (
        <g>
          {[
            { rx: -15, ry: 1.0, phase: 0.0 },
            { rx: 9, ry: -2.5, phase: 0.38 },
            { rx: -3, ry: 5.2, phase: 0.72 },
          ].map((ring, idx) => {
            const p = (timeSec * 0.95 + ring.phase) % 1;
            const radiusX = 1.8 + p * 8.5;
            const radiusY = 0.8 + p * 3.8;
            const ringOpacity = (1 - p) * 0.55;
            return (
              <ellipse
                key={idx}
                cx={ring.rx}
                cy={ring.ry}
                rx={radiusX}
                ry={radiusY}
                fill="none"
                stroke="#E0F2FE"
                strokeWidth="0.95"
                opacity={ringOpacity}
              />
            );
          })}
        </g>
      )}

      {/* 10. Folhas aquáticas flutuantes (vitórias-régias discretas com pequena flor de lótus campestre) */}
      <g transform={`translate(${-11 + wavePhase1 * 0.45}, ${-1.2 + lilyBob})`}>
        <ellipse cx="-0.3" cy="0.6" rx="4.9" ry="2.35" fill="#063946" opacity="0.32" />
        <path
          d="M 0,0 L 4.2,-1.0 A 4.8,2.3 0 1,0 4.4,0.6 Z"
          fill="#2E8540"
        />
        <path
          d="M -0.4,-0.15 L 3.2,-0.8 A 3.6,1.7 0 1,0 3.3,0.35 Z"
          fill="#4E9A53"
          opacity="0.85"
        />
        {/* Flor de ninfeia/lótus delicada */}
        <circle cx="-0.6" cy="-0.7" r="1.35" fill="#FCE7F3" />
        <circle cx="0.6" cy="-0.6" r="1.25" fill="#FBCFE8" />
        <circle cx="0" cy="-1.2" r="1.25" fill="#FFF1F2" />
        <circle cx="0" cy="-0.7" r="0.55" fill="#FDE047" />
      </g>

      <g transform={`translate(${10 + wavePhase2 * 0.4}, ${2.2 - lilyBob * 0.8})`}>
        <ellipse cx="-0.25" cy="0.5" rx="3.8" ry="1.8" fill="#063946" opacity="0.28" />
        <path
          d="M 0,0 L -3.4,-0.7 A 3.6,1.7 0 1,1 -3.5,0.6 Z"
          fill="#3FA34D"
        />
      </g>

      {/* 11. Pedras naturais nas margens (algumas parcialmente submersas com linha d'água suave) */}
      {[
        { sx: -35, sy: -4.2, rx: 5.4, ry: 2.6, sub: true },
        { sx: -28, sy: -9.2, rx: 3.8, ry: 1.9, sub: false },
        { sx: 26, sy: -10.5, rx: 4.8, ry: 2.3, sub: true },
        { sx: 36, sy: -2.8, rx: 4.2, ry: 2.0, sub: false },
        { sx: 32, sy: 6.2, rx: 4.8, ry: 2.3, sub: true },
        { sx: -19, sy: 12.4, rx: 4.2, ry: 2.0, sub: false },
      ].map((st, idx) => (
        <g key={idx} transform={`translate(${st.sx}, ${st.sy})`}>
          {/* Sombra de contato/submersão da pedra */}
          <ellipse cx="-0.4" cy="0.9" rx={st.rx * 1.08} ry={st.ry * 1.08} fill="#072617" opacity="0.32" />
          {/* Base da pedra campestre quente */}
          <ellipse cx="0" cy="0" rx={st.rx} ry={st.ry} fill="#78716C" />
          {/* Topo iluminado pelo sol do topo-direito */}
          <ellipse
            cx={st.rx * 0.14}
            cy={-st.ry * 0.24}
            rx={st.rx * 0.62}
            ry={st.ry * 0.54}
            fill="#D6D3D1"
            opacity="0.8"
          />
          {/* Reflexo úmido na base das pedras parcialmente submersas */}
          {st.sub && (
            <path
              d={`M ${-st.rx * 0.82},${st.ry * 0.55} Q 0,${st.ry * 1.02} ${st.rx * 0.82},${st.ry * 0.55}`}
              stroke="#BAE6FD"
              strokeWidth="0.75"
              fill="none"
              strokeLinecap="round"
              opacity="0.55"
            />
          )}
        </g>
      ))}

      {/* 12. Pequenos juncos, taboas e tufos de grama úmida nas margens reagindo à brisa */}
      <g transform={`translate(-31, -6.5) rotate(${reedSwayLeft})`}>
        <ellipse cx="-0.3" cy="1.0" rx="3.4" ry="1.3" fill="#072617" opacity="0.25" />
        <path
          d="M-1.8,0.6 Q-3.0,-4.8 -4.0,-10.2 M0,0.8 Q-0.3,-5.8 -0.6,-12.2 M1.5,0.6 Q2.8,-4.4 3.8,-9.0"
          stroke="#1E562B"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M-0.6,0.6 Q0.6,-4.2 1.4,-8.6"
          stroke="#469950"
          strokeWidth="0.95"
          fill="none"
          strokeLinecap="round"
        />
        {/* Espiga marrom aveludada de taboa (cattail) */}
        <ellipse
          cx="-0.5"
          cy="-9.4"
          rx="1.05"
          ry="2.6"
          transform="rotate(-4 -0.5 -9.4)"
          fill="#5C2D16"
        />
        <ellipse
          cx="-0.35"
          cy="-9.6"
          rx="0.45"
          ry="1.9"
          transform="rotate(-4 -0.35 -9.6)"
          fill="#854D27"
        />
      </g>

      <g transform={`translate(33, 4.5) rotate(${reedSwayRight})`}>
        <ellipse cx="-0.3" cy="0.8" rx="3.0" ry="1.2" fill="#072617" opacity="0.22" />
        <path
          d="M-1.4,0.5 Q-2.5,-3.6 -3.4,-7.4 M0,0.6 Q0.3,-4.2 0.6,-8.8 M1.3,0.4 Q2.5,-3.2 3.4,-6.4"
          stroke="#236332"
          strokeWidth="1.15"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="0.6" cy="-9.0" r="1.25" fill="#FEF08A" />
        <circle cx="0.6" cy="-9.0" r="0.5" fill="#D97706" />
      </g>

      {/* Pequenos tufos rasteiros integrando a margem inferior ao gramado */}
      <path
        d="M-12,15.8 L-13.2,12.8 M-9.8,16.2 L-9.5,13.2 M10,15.0 L11.2,12.2 M12.4,14.5 L13.8,12.0"
        stroke="#255E34"
        strokeWidth="1.0"
        strokeLinecap="round"
      />
    </g>
  );
};

