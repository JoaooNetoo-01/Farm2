import { WeatherType } from '../types/farm';

/**
 * Sistema integrado de Efeitos Sonoros (SFX) e Paisagem Sonora Ambiente (Ambient Soundscape)
 * gerado via Web Audio API.
 *
 * Paisagens sonoras dinâmicas por clima:
 * - SUNNY (Sol Radiante): Fauna de pássaros leves e distantes no fundo (trinados rápidos e suaves com filtragem acústica, sem assobios eletrônicos) + ar campestre leve.
 * - BREEZY (Brisa Amena): Sopro orgânico de vento campestre modulando pelas folhas + pássaros distantes ocasionais.
 * - RAIN (Chuva Fértil): Barulho contínuo e relaxante de chuva suave na terra + pingos d'água delicados.
 */
class SoundFXService {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private currentWeather: WeatherType = WeatherType.SUNNY;
  private isAmbientRunning: boolean = false;

  // Nós contínuos de ruído filtrado (vento/folhagem e chuva)
  private masterAmbientGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;

  // Timers de eventos orgânicos da fauna e vento
  private ambientIntervalId: number | null = null;
  private windLfoIntervalId: number | null = null;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * Cria um buffer de ruído rosa suave em loop para modelar ar do campo, folhagem e chuva
   */
  private createPinkNoiseBuffer(ctx: AudioContext, durationSec: number = 4): AudioBuffer {
    const bufferSize = ctx.sampleRate * durationSec;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    return buffer;
  }

  /**
   * Inicializa ou retoma a paisagem sonora ambiente caso o som esteja ativado
   */
  public startAmbientSoundscape(weather: WeatherType = this.currentWeather): void {
    this.currentWeather = weather;
    if (!this.enabled) return;

    const ctx = this.getContext();
    if (!ctx) return;

    if (!this.isAmbientRunning) {
      this.setupContinuousNodes(ctx);
      this.setupOrganicEventLoop();
      this.isAmbientRunning = true;
    }

    this.applyWeatherMix(weather);
  }

  private setupContinuousNodes(ctx: AudioContext): void {
    const noiseBuffer = this.createPinkNoiseBuffer(ctx, 4);

    this.masterAmbientGain = ctx.createGain();
    this.masterAmbientGain.gain.setValueAtTime(this.enabled ? 1 : 0, ctx.currentTime);
    this.masterAmbientGain.connect(ctx.destination);

    // 1. Canal de Ar Campestre / Folhagem Suave
    const windSource = ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(320, ctx.currentTime);
    this.windFilter.Q.setValueAtTime(1.6, ctx.currentTime);

    this.windGain = ctx.createGain();
    this.windGain.gain.setValueAtTime(0.015, ctx.currentTime);

    windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterAmbientGain);
    windSource.start(0);

    // 2. Canal de Chuva Suave no Campo
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    this.rainFilter = ctx.createBiquadFilter();
    this.rainFilter.type = 'bandpass';
    this.rainFilter.frequency.setValueAtTime(1100, ctx.currentTime);
    this.rainFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    this.rainGain = ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.0001, ctx.currentTime);

    rainSource.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterAmbientGain);
    rainSource.start(0);
  }

  /**
   * Ajusta suavemente (crossfade) os volumes e filtros conforme o clima
   */
  public setAmbientWeather(weather: WeatherType): void {
    this.currentWeather = weather;
    if (!this.enabled) return;
    if (!this.isAmbientRunning) {
      this.startAmbientSoundscape(weather);
      return;
    }
    this.applyWeatherMix(weather);
  }

  private applyWeatherMix(weather: WeatherType): void {
    if (!this.ctx || !this.windGain || !this.rainGain || !this.windFilter) return;

    const now = this.ctx.currentTime;
    const fadeSec = 1.4;

    if (weather === WeatherType.SUNNY) {
      // Sol Radiante: ambiência de ar calmo nas árvores + fauna leve de pássaros ao fundo
      this.windGain.gain.setTargetAtTime(0.022, now, fadeSec);
      this.windFilter.frequency.setTargetAtTime(290, now, fadeSec);
      this.rainGain.gain.setTargetAtTime(0.0001, now, fadeSec);
    } else if (weather === WeatherType.BREEZY) {
      // Brisa Amena: vento suave passeando pelas árvores e plantações
      this.windGain.gain.setTargetAtTime(0.095, now, fadeSec);
      this.windFilter.frequency.setTargetAtTime(430, now, fadeSec);
      this.rainGain.gain.setTargetAtTime(0.0001, now, fadeSec);
    } else if (weather === WeatherType.RAIN) {
      // Chuva Fértil: chuva contínua na terra + vento fresco
      this.windGain.gain.setTargetAtTime(0.055, now, fadeSec);
      this.windFilter.frequency.setTargetAtTime(360, now, fadeSec);
      this.rainGain.gain.setTargetAtTime(0.15, now, fadeSec);
    }
  }

  /**
   * Agenda sons orgânicos de fauna no fundo (pássaros leves distantes no Sol Radiante,
   * brisa modulada e pingos na Chuva Fértil), sem qualquer assobio agudo artificial.
   */
  private setupOrganicEventLoop(): void {
    if (this.ambientIntervalId !== null) {
      window.clearInterval(this.ambientIntervalId);
    }
    if (this.windLfoIntervalId !== null) {
      window.clearInterval(this.windLfoIntervalId);
    }

    // Modulação lenta da frequência do vento nas folhas
    this.windLfoIntervalId = window.setInterval(() => {
      if (!this.enabled || !this.ctx || !this.windFilter || this.ctx.state !== 'running') {
        return;
      }
      const baseFreq =
        this.currentWeather === WeatherType.BREEZY
          ? 420
          : this.currentWeather === WeatherType.RAIN
          ? 350
          : 280;
      const gustVariation = (Math.random() - 0.45) * 140;
      this.windFilter.frequency.setTargetAtTime(
        Math.max(180, baseFreq + gustVariation),
        this.ctx.currentTime,
        1.2
      );
    }, 1900);

    // Loop de fauna de fundo a cada 1.8s
    this.ambientIntervalId = window.setInterval(() => {
      if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;

      const roll = Math.random();

      if (this.currentWeather === WeatherType.SUNNY) {
        // Sol Radiante: Fauna constante e leve de pássaros distantes nas árvores ao fundo
        if (roll < 0.82) {
          this.playSoftFaunaBirds();
          // Às vezes um segundo passarinho responde ao longe alguns milissegundos depois
          if (Math.random() < 0.45) {
            window.setTimeout(() => {
              if (this.enabled && this.currentWeather === WeatherType.SUNNY) {
                this.playSoftFaunaBirds(true);
              }
            }, 380 + Math.random() * 320);
          }
        }
      } else if (this.currentWeather === WeatherType.BREEZY) {
        // Brisa Amena: Pássaros bem ocasionais ao longe junto com o vento
        if (roll < 0.35) {
          this.playSoftFaunaBirds(true);
        }
      } else if (this.currentWeather === WeatherType.RAIN) {
        // Chuva Fértil: Pingos d'água suaves nas folhas
        if (roll < 0.72) {
          this.playRaindropPatter();
        }
      }
    }, 1800);
  }

  /**
   * Sintetiza o som natural e leve de pequenos pássaros de fauna no fundo (pardais/bem-te-vis/canários distantes).
   * Usa micro-sílabas muito curtas (25ms-40ms) com trinado rápido de frequência (vibrato de siringe)
   * e filtro passa-baixa para soar suave, orgânico e distante no campo — eliminando qualquer efeito de "assobio".
   */
  private playSoftFaunaBirds(distantResponse: boolean = false): void {
    if (!this.ctx || !this.masterAmbientGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Filtro acústico para suavizar e dar sensação de distância no bosque ao redor da fazenda
    const distanceFilter = ctx.createBiquadFilter();
    distanceFilter.type = 'bandpass';
    distanceFilter.frequency.setValueAtTime(distantResponse ? 2600 : 3100, now);
    distanceFilter.Q.setValueAtTime(1.4, now);
    distanceFilter.connect(this.masterAmbientGain);

    // Volume bem delicado de fundo (background fauna)
    const peakGain = distantResponse ? 0.0045 : 0.0075;

    // Escolhe um padrão de gorjeio curto de passarinho (3 a 5 micro-notas rápidas articuladas)
    const patternType = Math.floor(Math.random() * 3);
    const syllableCount = patternType === 0 ? 4 : patternType === 1 ? 3 : 5;
    const basePitch = (distantResponse ? 2700 : 2950) + (Math.random() - 0.5) * 350;

    for (let i = 0; i < syllableCount; i++) {
      const syllableDur = 0.032 + (i % 2) * 0.008; // Sílabas curtíssimas (32-40ms) para não soar como assobio
      const gap = 0.052 + (i % 2) * 0.012;
      const tStart = now + i * gap;
      const tEnd = tStart + syllableDur;

      const carrier = ctx.createOscillator();
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      const env = ctx.createGain();

      // Trinado de siringe (modulação rápida de 55Hz) que dá textura de ave real em vez de tom puro
      vibrato.type = 'sine';
      vibrato.frequency.setValueAtTime(52 + (i % 3) * 8, tStart);
      vibratoGain.gain.setValueAtTime(140, tStart);

      vibrato.connect(vibratoGain);
      vibratoGain.connect(carrier.frequency);

      carrier.type = 'sine';
      const noteFreq = basePitch + (i % 2 === 0 ? 0 : 260) + i * 45;
      carrier.frequency.setValueAtTime(noteFreq, tStart);
      carrier.frequency.exponentialRampToValueAtTime(noteFreq * 1.12, tStart + syllableDur * 0.5);
      carrier.frequency.exponentialRampToValueAtTime(noteFreq * 0.94, tEnd);

      // Envelope percussivo suave de ataque e queda rápida
      env.gain.setValueAtTime(0.0001, tStart);
      env.gain.linearRampToValueAtTime(peakGain, tStart + 0.007);
      env.gain.exponentialRampToValueAtTime(0.0001, tEnd);

      carrier.connect(env);
      env.connect(distanceFilter);

      vibrato.start(tStart);
      carrier.start(tStart);
      vibrato.stop(tEnd + 0.005);
      carrier.stop(tEnd + 0.005);
    }
  }

  /**
   * Sintetiza pingos suaves de chuva caindo sobre a lagoa e folhas
   */
  private playRaindropPatter(): void {
    if (!this.ctx || !this.masterAmbientGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const drops = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < drops; i++) {
      const t = now + i * (0.09 + Math.random() * 0.11);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = 950 + Math.random() * 500;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.35, t + 0.032);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.008, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.036);

      osc.connect(gain);
      gain.connect(this.masterAmbientGain);

      osc.start(t);
      osc.stop(t + 0.04);
    }
  }

  /**
   * Liga ou desliga simultaneamente os efeitos sonoros e a paisagem sonora ambiente,
   * mantendo o controle de som único existente.
   */
  public setSoundEnabled(enabled: boolean, currentWeather?: WeatherType): void {
    this.enabled = enabled;
    if (currentWeather) {
      this.currentWeather = currentWeather;
    }

    if (!enabled) {
      if (this.ctx && this.masterAmbientGain) {
        this.masterAmbientGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15);
      }
      return;
    }

    const ctx = this.getContext();
    if (!ctx) return;

    if (!this.isAmbientRunning) {
      this.startAmbientSoundscape(this.currentWeather);
    } else if (this.masterAmbientGain) {
      this.masterAmbientGain.gain.setTargetAtTime(1, ctx.currentTime, 0.25);
      this.applyWeatherMix(this.currentWeather);
    }
  }

  public playPlant(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    if (!this.isAmbientRunning) this.startAmbientSoundscape(this.currentWeather);

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.09);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playHarvest(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    if (!this.isAmbientRunning) this.startAmbientSoundscape(this.currentWeather);

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);

      gain.gain.setValueAtTime(0.09, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.16);
    });
  }

  public playExpand(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    if (!this.isAmbientRunning) this.startAmbientSoundscape(this.currentWeather);

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.11, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.25);
    });
  }

  public playWeatherChange(isRain: boolean): void {
    const ctx = this.getContext();
    if (!ctx) return;
    if (!this.isAmbientRunning) this.startAmbientSoundscape(this.currentWeather);

    const now = ctx.currentTime;
    const freqs = isRain ? [392, 493.88, 587.33] : [523.25, 659.25, 783.99];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.06, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.22);
    });
  }
}

export const soundFX = new SoundFXService();
