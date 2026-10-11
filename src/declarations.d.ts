declare module 'plotly.js-dist-min' {
  const Plotly: any;
  export default Plotly;
}

declare module 'fft.js' {
  export default class FFT {
    constructor(size: number);
    fromComplexArray(complex: number[], output?: number[]): void;
    toComplexArray(input: number[], output?: number[]): void;
    realTransform(out: number[], data: number[]): void;
    completeSpectrum(out: number[]): void;
  }
}
