import React, { useState } from 'react';
import { useSimStore } from '../store/useSimStore';
import { CIRCUITS } from '../simulation/circuitsData';
import { CircuitLibrary } from './CircuitLibrary';
import { 
  Cpu, 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Activity, 
  Sparkles, 
  Info, 
  FolderGit2 
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    selectedCircuitId,
    setCircuit,
    simulationResult,
    isRunning,
    togglePlayPause,
    resetToDefaults,
    runSimNow,
    currentTimeIndex
  } = useSimStore();

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);

  const currentCircuit = CIRCUITS.find(c => c.id === selectedCircuitId) || CIRCUITS[0];
  const sample = simulationResult?.samples[currentTimeIndex] || simulationResult?.samples[0];
  const currentMs = sample ? (sample.t * 1000).toFixed(2) : '0.00';
  const totalMs = simulationResult?.samples.length 
    ? (simulationResult.samples[simulationResult.samples.length - 1].t * 1000).toFixed(2) 
    : '0.00';

  return (
    <>
      <header className="min-h-[50px] py-1 bg-slate-950 border-b border-slate-800 px-3 flex items-center justify-between text-xs font-mono select-none flex-none">
        {/* Brand & Circuit Select */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 flex-shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 font-bold text-slate-100 text-xs tracking-tight leading-none">
                <span className="text-[13px] tracking-tight">PowerSim</span>
                <span className="text-[9px] text-sky-400 bg-sky-950/80 px-1 py-0.5 rounded border border-sky-800/80 font-normal">
                  Virtual Lab
                </span>
              </div>
              <div className="text-[10px] text-slate-400 tracking-tight leading-tight flex items-center gap-1.5 mt-0.5">
                <span className="text-amber-400 font-mono font-semibold">24EE10061</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-200 font-medium font-sans">K Siva Rama Krishna</span>
              </div>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Circuit Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCircuitId}
              onChange={(e) => setCircuit(e.target.value)}
              className="bg-slate-900 border border-slate-700 hover:border-slate-600 rounded px-2.5 py-1 text-slate-200 text-xs font-medium focus:outline-none focus:border-sky-500 cursor-pointer transition max-w-[240px] md:max-w-[320px] truncate"
            >
              <optgroup label="Single Phase Converters" className="bg-slate-900 text-slate-400 font-bold">
                {CIRCUITS.filter(c => c.category === 'single-phase').map(c => (
                  <option key={c.id} value={c.id} className="text-slate-100 font-normal">
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Three Phase Converters" className="bg-slate-900 text-slate-400 font-bold">
                {CIRCUITS.filter(c => c.category === 'three-phase').map(c => (
                  <option key={c.id} value={c.id} className="text-slate-100 font-normal">
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="AC Controllers (TCR)" className="bg-slate-900 text-slate-400 font-bold">
                {CIRCUITS.filter(c => c.category === 'ac-controller').map(c => (
                  <option key={c.id} value={c.id} className="text-slate-100 font-normal">
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Dual Converters (4-Quadrant)" className="bg-slate-900 text-slate-400 font-bold">
                {CIRCUITS.filter(c => c.category === 'dual-converter').map(c => (
                  <option key={c.id} value={c.id} className="text-slate-100 font-normal">
                    {c.name}
                  </option>
                ))}
              </optgroup>
            </select>

            <button
              onClick={() => setShowLibraryModal(true)}
              className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 hover:text-sky-300 bg-slate-900 hover:bg-slate-850 px-2 py-1 rounded border border-slate-800 transition"
              title="Open full circuit catalog and descriptions"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Library</span>
            </button>
          </div>
        </div>

        {/* Center: Playback & Action Controls */}
        <div className="flex items-center gap-2">
          {/* Animate / Pause */}
          <button
            onClick={togglePlayPause}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium border text-xs transition ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-sky-600 text-white border-sky-500 hover:bg-sky-500 shadow-sm shadow-sky-600/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Animate</span>
              </>
            )}
          </button>

          {/* Recalculate */}
          <button
            onClick={runSimNow}
            title="Recalculate simulation numerical states"
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded text-xs transition"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Compute</span>
          </button>

          {/* Reset */}
          <button
            onClick={resetToDefaults}
            title="Reset to default circuit parameters"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white rounded transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right side: Simulation Time & Export Tools */}
        <div className="flex items-center gap-2.5">
          {/* Time display */}
          <div className="hidden lg:flex items-center gap-1.5 text-slate-400 text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            <Clock className="w-3 h-3 text-sky-400" />
            <span>t:</span>
            <span className="text-slate-200 font-bold">{currentMs} ms</span>
            <span className="text-slate-600">/</span>
            <span>{totalMs} ms</span>
          </div>

          {/* Help / Guide */}
          <button
            onClick={() => setShowInfoModal(true)}
            title="Lab guide and theory"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Circuit Library Slideout / Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-mono">
          <div className="w-full max-w-xl h-[85vh] max-h-[700px] shadow-2xl">
            <CircuitLibrary onClose={() => setShowLibraryModal(false)} />
          </div>
        </div>
      )}

      {/* Lab Guide Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-mono">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-xl w-full p-5 space-y-4 shadow-2xl text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
                <Sparkles className="w-4 h-4 text-sky-400" />
                PowerSim Virtual Laboratory Guide
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-white text-base px-2 py-0.5 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 leading-relaxed">
              <p>
                <strong>PowerSim</strong> is an interactive educational simulation platform designed for power electronics courses and engineering practice.
              </p>
              
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5">
                <div className="font-semibold text-sky-400">Key Features:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li><strong>Real Numerical ODE Solvers:</strong> Calculates stiff electrical differential equations (L di/dt) and thyristor/diode commutations.</li>
                  <li><strong>Active Schematics:</strong> Visualizes real-time diode and SCR conduction states (ON/OFF), current flow direction, and firing pulses.</li>
                  <li><strong>Circuit Components Dropdown:</strong> Directly inspect each component's instantaneous voltage, current, and state.</li>
                  <li><strong>Separate vs Single Waveforms:</strong> Toggle between individual stacked waveform subplots or a unified multi-channel oscilloscope.</li>
                  <li><strong>Harmonic FFT:</strong> Synchronous Fourier analysis with fundamental RMS, harmonic orders, and IEEE Total Harmonic Distortion (THD).</li>
                </ul>
              </div>

              <p className="text-slate-400">
                To inspect device states at any precise moment, pause playback and scrub the time slider below the schematic or click any point along the waveforms.
              </p>
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
