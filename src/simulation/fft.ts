import FFT from 'fft.js';
import { HarmonicComponent } from '../types/circuit';

/**
 * Calculates Fourier harmonics using synchronous integration over exact integer periods.
 * In power electronics, synchronous Fourier analysis over steady-state fundamental cycles
 * provides vastly superior accuracy over non-integer windowed FFTs.
 */
export function calculateHarmonics(
  signal: number[],
  time: number[],
  fundamentalFreq: number,
  maxOrder: number = 25
): {
  dc: number;
  fundamentalRms: number;
  thdPercent: number;
  harmonics: HarmonicComponent[];
} {
  const n = signal.length;
  if (n < 4) {
    return { dc: 0, fundamentalRms: 0, thdPercent: 0, harmonics: [] };
  }

  const tStart = time[0];
  const tEnd = time[n - 1];
  const totalDuration = tEnd - tStart;
  const T0 = 1 / fundamentalFreq;

  // We analyze the last complete steady-state cycle to avoid turn-on transients
  const numCycles = Math.max(1, Math.floor(totalDuration / T0));
  const steadyStartCycle = Math.max(0, numCycles - 2); // use the last 1 or 2 cycles
  const analysisStartTime = tStart + steadyStartCycle * T0;
  const analysisEndTime = tStart + numCycles * T0;

  // Filter indices within the steady-state integer cycle window
  let startIdx = 0;
  let endIdx = n - 1;
  for (let i = 0; i < n; i++) {
    if (time[i] >= analysisStartTime) {
      startIdx = i;
      break;
    }
  }
  for (let i = startIdx; i < n; i++) {
    if (time[i] >= analysisEndTime) {
      endIdx = i;
      break;
    }
  }

  const windowLen = endIdx - startIdx;
  if (windowLen < 10) {
    return { dc: 0, fundamentalRms: 0, thdPercent: 0, harmonics: [] };
  }

  const actualDuration = time[endIdx] - time[startIdx];
  const omega0 = (2 * Math.PI) / actualDuration;

  // Compute DC component
  let sumDc = 0;
  for (let i = startIdx; i < endIdx; i++) {
    const dt = time[i + 1] - time[i];
    sumDc += 0.5 * (signal[i] + signal[i + 1]) * dt;
  }
  const dc = sumDc / actualDuration;

  // Compute harmonics via trapezoidal quadrature
  const harmonics: HarmonicComponent[] = [];
  let fundamentalPeak = 0;
  let fundamentalRms = 0;
  let sumHarmonicSq = 0;

  for (let h = 1; h <= maxOrder; h++) {
    let an = 0; // cosine coeff
    let bn = 0; // sine coeff

    for (let i = startIdx; i < endIdx; i++) {
      const dt = time[i + 1] - time[i];
      const t1 = time[i] - time[startIdx];
      const t2 = time[i + 1] - time[startIdx];
      
      const v1 = signal[i];
      const v2 = signal[i + 1];

      const cos1 = Math.cos(h * omega0 * t1);
      const cos2 = Math.cos(h * omega0 * t2);
      const sin1 = Math.sin(h * omega0 * t1);
      const sin2 = Math.sin(h * omega0 * t2);

      an += 0.5 * (v1 * cos1 + v2 * cos2) * dt;
      bn += 0.5 * (v1 * sin1 + v2 * sin2) * dt;
    }

    an = (2 / actualDuration) * an;
    bn = (2 / actualDuration) * bn;

    const magnitude = Math.sqrt(an * an + bn * bn);
    const rms = magnitude / Math.SQRT2;
    const phaseDeg = (Math.atan2(bn, an) * 180) / Math.PI;

    if (h === 1) {
      fundamentalPeak = magnitude;
      fundamentalRms = rms;
    } else {
      sumHarmonicSq += rms * rms;
    }

    harmonics.push({
      order: h,
      frequency: h * fundamentalFreq,
      magnitude,
      rms,
      percentFundamental: 0, // will compute after fundamental is found
      phaseDeg,
    });
  }

  // Normalize percentages
  for (const item of harmonics) {
    item.percentFundamental = fundamentalRms > 1e-4 
      ? (item.rms / fundamentalRms) * 100 
      : 0;
  }

  const thdPercent = fundamentalRms > 1e-4 
    ? (Math.sqrt(sumHarmonicSq) / fundamentalRms) * 100 
    : 0;

  return {
    dc,
    fundamentalRms,
    thdPercent,
    harmonics,
  };
}

/**
 * Fast Fourier Transform utility using fft.js for power spectrum
 */
export function computeFftSpectrum(signal: number[], sampleRate: number): { freqs: number[]; magnitudes: number[] } {
  // Find nearest power of 2
  let size = 256;
  while (size * 2 <= signal.length && size < 4096) {
    size *= 2;
  }

  try {
    const f = new FFT(size);
    const out = new Array(size * 2).fill(0);
    const inputSlice = signal.slice(signal.length - size);
    
    // Windowing: Hann window to reduce edge discontinuity
    const windowed = inputSlice.map((val, idx) => {
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * idx) / (size - 1)));
      return val * w;
    });

    if (typeof f.realTransform === 'function') {
      f.realTransform(out, windowed);
    } else {
      // standard complex transform
      const complexIn = new Array(size * 2).fill(0);
      for (let i = 0; i < size; i++) {
        complexIn[2 * i] = windowed[i];
        complexIn[2 * i + 1] = 0;
      }
      f.fromComplexArray(complexIn, out);
    }

    const half = size / 2;
    const freqs = new Array(half);
    const magnitudes = new Array(half);

    for (let i = 0; i < half; i++) {
      freqs[i] = (i * sampleRate) / size;
      const re = out[2 * i];
      const im = out[2 * i + 1];
      magnitudes[i] = (Math.sqrt(re * re + im * im) * 2) / size;
    }

    return { freqs, magnitudes };
  } catch (err) {
    return { freqs: [], magnitudes: [] };
  }
}
