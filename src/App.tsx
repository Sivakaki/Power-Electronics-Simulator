import React, { useEffect, useRef } from 'react';
import { useSimStore } from './store/useSimStore';
import { Header } from './components/Header';
import { CircuitLibrary } from './components/CircuitLibrary';
import { SchematicView } from './components/SchematicView';
import { ParameterPanel } from './components/ParameterPanel';
import { Oscilloscope } from './components/Oscilloscope';
import { AnalysisPanel } from './components/AnalysisPanel';

export default function App() {
  const { isRunning, simulationResult, currentTimeIndex, setTimeIndex } = useSimStore();
  const animFrameRef = useRef<number | null>(null);

  // Playback animation loop
  useEffect(() => {
    if (!isRunning || !simulationResult || simulationResult.samples.length === 0) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTimestamp = performance.now();
    const totalSamples = simulationResult.samples.length;

    const loop = (now: number) => {
      const elapsed = now - lastTimestamp;
      if (elapsed > 20) { // ~50fps step rate
        lastTimestamp = now;
        const speed = useSimStore.getState().simSpeed || 1;
        const step = Math.max(1, Math.round(3 * speed));
        const nextIdx = (useSimStore.getState().currentTimeIndex + step) % totalSamples;
        setTimeIndex(nextIdx);
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, simulationResult, setTimeIndex]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header */}
      <Header />

      {/* Main Workspace Grid */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-hidden p-2 gap-2 bg-[#090d16]">
        {/* Top Split: Circuit Library | Schematic | Parameters */}
        <div className="flex-none lg:flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 min-h-[380px] lg:min-h-0">
          {/* Left: Circuit Library (2.5 cols) */}
          <div className="lg:col-span-3 xl:col-span-2 h-[340px] lg:h-full">
            <CircuitLibrary />
          </div>

          {/* Center: Circuit Schematic (6.5 cols) */}
          <div className="lg:col-span-6 xl:col-span-7 h-[360px] lg:h-full">
            <SchematicView />
          </div>

          {/* Right: Parameter Panel (3 cols) */}
          <div className="lg:col-span-3 xl:col-span-3 h-[380px] lg:h-full">
            <ParameterPanel />
          </div>
        </div>

        {/* Bottom Split: Oscilloscope & Analysis Panel */}
        <div className="flex-none lg:flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 min-h-[360px] lg:min-h-0">
          {/* Oscilloscope Waveforms (7 cols) */}
          <div className="lg:col-span-7 h-[340px] lg:h-full">
            <Oscilloscope />
          </div>

          {/* Measurements / FFT / Device States / Theory (5 cols) */}
          <div className="lg:col-span-5 h-[340px] lg:h-full">
            <AnalysisPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
