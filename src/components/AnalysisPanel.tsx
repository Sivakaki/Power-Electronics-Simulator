import React, { useRef, useEffect } from 'react';
import Plotly from 'plotly.js-dist-min';
import { useSimStore, SimTab } from '../store/useSimStore';
import { CIRCUITS } from '../simulation/circuitsData';
import { 
  Gauge, 
  BarChart2, 
  Cpu, 
  BookOpen, 
  CheckCircle, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export const AnalysisPanel: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    simulationResult,
    currentTimeIndex,
    selectedCircuitId,
    params
  } = useSimStore();

  const fftChartRef = useRef<HTMLDivElement>(null);

  const circuitDef = CIRCUITS.find(c => c.id === selectedCircuitId) || CIRCUITS[0];
  const measurements = simulationResult?.measurements;
  const sample = simulationResult?.samples[currentTimeIndex] || simulationResult?.samples[0];
  const devices = sample?.devices || {};

  // Render FFT chart when active tab is FFT
  useEffect(() => {
    if (activeTab !== 'fft' || !fftChartRef.current || !measurements) return;

    const harmonics = measurements.currentHarmonics || [];
    const orders = harmonics.map(h => `h=${h.order} (${h.frequency}Hz)`);
    const percents = harmonics.map(h => h.percentFundamental);
    const rmsValues = harmonics.map(h => h.rms);

    const data = [
      {
        x: orders,
        y: percents,
        type: 'bar',
        name: '% of Fundamental',
        marker: {
          color: harmonics.map((h, i) => i === 0 ? '#38bdf8' : '#f59e0b'),
        },
        hovertemplate: '%{x}<br>Magnitude: %{y:.2f}%<br>RMS: %{text:.2f} A<extra></extra>',
        text: rmsValues
      }
    ];

    const layout = {
      paper_bgcolor: 'transparent',
      plot_bgcolor: '#030712',
      margin: { t: 20, r: 25, b: 60, l: 50 },
      xaxis: {
        title: { text: 'Harmonic Order', font: { color: '#64748b', size: 10, family: 'monospace' } },
        tickfont: { color: '#94a3b8', size: 9, family: 'monospace' },
        gridcolor: '#1e293b'
      },
      yaxis: {
        title: { text: '% of Fundamental', font: { color: '#f59e0b', size: 10, family: 'monospace' } },
        tickfont: { color: '#94a3b8', size: 9, family: 'monospace' },
        gridcolor: '#1e293b'
      }
    };

    const config = {
      responsive: true,
      displayModeBar: false
    };

    Plotly.react(fftChartRef.current, data, layout, config);
  }, [activeTab, measurements]);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between px-3 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('measurements')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 transition ${
              activeTab === 'measurements'
                ? 'border-sky-400 text-sky-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            Measurements
          </button>

          <button
            onClick={() => setActiveTab('fft')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 transition ${
              activeTab === 'fft'
                ? 'border-amber-400 text-amber-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            FFT & Harmonics
          </button>

          <button
            onClick={() => setActiveTab('deviceStates')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 transition ${
              activeTab === 'deviceStates'
                ? 'border-emerald-400 text-emerald-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Device States
          </button>

          <button
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 transition ${
              activeTab === 'theory'
                ? 'border-purple-400 text-purple-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Theory & Formulas
          </button>
        </div>

        {/* Quick status pill */}
        {measurements && (
          <div className="text-[11px] font-mono text-slate-400 hidden sm:flex items-center gap-3">
            <span>
              PF: <strong className="text-slate-200">{measurements.powerFactor.toFixed(3)}</strong>
            </span>
            <span>
              THD(I): <strong className="text-amber-400">{measurements.thdCurrent.toFixed(1)}%</strong>
            </span>
            <span>
              η: <strong className="text-emerald-400">{measurements.efficiency.toFixed(1)}%</strong>
            </span>
          </div>
        )}
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 p-3 overflow-y-auto bg-slate-950/60">
        {/* ========================================== */}
        {/* 1. MEASUREMENTS TAB */}
        {/* ========================================== */}
        {activeTab === 'measurements' && measurements && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {/* Vo Avg */}
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Average Output Vo</div>
              <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">
                {measurements.vAvg.toFixed(2)} <span className="text-xs font-normal">V</span>
              </div>
              <div className="text-[9px] font-mono text-slate-500 mt-1">
                Theory: {measurements.analyticalVavg.toFixed(1)} V
              </div>
            </div>

            {/* Vo RMS */}
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase">RMS Output Vo</div>
              <div className="text-lg font-mono font-bold text-amber-300 mt-0.5">
                {measurements.vRms.toFixed(2)} <span className="text-xs font-normal">V</span>
              </div>
              <div className="text-[9px] font-mono text-slate-500 mt-1">
                Theory: {measurements.analyticalVrms.toFixed(1)} V
              </div>
            </div>

            {/* Io Avg */}
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Average Current Io</div>
              <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
                {measurements.iAvg.toFixed(2)} <span className="text-xs font-normal">A</span>
              </div>
              <div className="text-[9px] font-mono text-slate-500 mt-1">
                DC component
              </div>
            </div>

            {/* Io RMS */}
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase">RMS Current Io</div>
              <div className="text-lg font-mono font-bold text-emerald-300 mt-0.5">
                {measurements.iRms.toFixed(2)} <span className="text-xs font-normal">A</span>
              </div>
              <div className="text-[9px] font-mono text-slate-500 mt-1">
                Total effective
              </div>
            </div>

            {/* Active Power P */}
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Active Power P</div>
              <div className="text-lg font-mono font-bold text-sky-400 mt-0.5">
                {measurements.pActive.toFixed(1)} <span className="text-xs font-normal">W</span>
              </div>
              <div className="text-[9px] font-mono text-slate-500 mt-1">
                Average real load power
              </div>
            </div>

            {/* Apparent Power S */}
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Apparent Power S</div>
              <div className="text-lg font-mono font-bold text-sky-300 mt-0.5">
                {measurements.sApparent.toFixed(1)} <span className="text-xs font-normal">VA</span>
              </div>
              <div className="text-[9px] font-mono text-slate-500 mt-1">
                Q = {measurements.qReactive.toFixed(1)} VAR
              </div>
            </div>

            {/* Power Factor */}
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Power Factor (PF)</div>
              <div className="text-lg font-mono font-bold text-white mt-0.5">
                {measurements.powerFactor.toFixed(3)}
              </div>
              <div className="text-[9px] font-mono text-slate-500 mt-1">
                DPF: {measurements.displacementPf.toFixed(3)}
              </div>
            </div>

            {/* Total Harmonic Distortion */}
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Current THD (Is)</div>
              <div className="text-lg font-mono font-bold text-red-400 mt-0.5">
                {measurements.thdCurrent.toFixed(1)} <span className="text-xs font-normal">%</span>
              </div>
              <div className="text-[9px] font-mono text-slate-500 mt-1">
                IEEE-519 Standard
              </div>
            </div>

            {/* Ripple Factor */}
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Ripple Factor (RF)</div>
              <div className="text-lg font-mono font-bold text-purple-400 mt-0.5">
                {measurements.rippleFactor.toFixed(3)}
              </div>
              <div className="text-[9px] font-mono text-slate-500 mt-1">
                RF = √(FF² - 1)
              </div>
            </div>

            {/* Form Factor */}
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Form Factor (FF)</div>
              <div className="text-lg font-mono font-bold text-purple-300 mt-0.5">
                {measurements.formFactor.toFixed(3)}
              </div>
              <div className="text-[9px] font-mono text-slate-500 mt-1">
                Vrms / Vavg
              </div>
            </div>

            {/* Rectification Efficiency */}
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Efficiency η</div>
              <div className="text-lg font-mono font-bold text-teal-400 mt-0.5">
                {measurements.efficiency.toFixed(1)} <span className="text-xs font-normal">%</span>
              </div>
              <div className="text-[9px] font-mono text-slate-500 mt-1">
                Pdc / Pac
              </div>
            </div>

            {/* Fundamental Current */}
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Fundamental I₁</div>
              <div className="text-lg font-mono font-bold text-cyan-400 mt-0.5">
                {measurements.fundamentalCurrentRms.toFixed(2)} <span className="text-xs font-normal">A</span>
              </div>
              <div className="text-[9px] font-mono text-slate-500 mt-1">
                at {params.frequency} Hz
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 2. FFT & HARMONICS TAB */}
        {/* ========================================== */}
        {activeTab === 'fft' && measurements && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full">
            {/* Bar chart container */}
            <div className="flex flex-col bg-slate-900/60 rounded border border-slate-800 p-2 min-h-[220px]">
              <div className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between mb-1 px-1">
                <span>Supply Current Harmonic Spectrum (Is)</span>
                <span className="text-red-400">THD: {measurements.thdCurrent.toFixed(1)}%</span>
              </div>
              <div ref={fftChartRef} className="flex-1 w-full min-h-[190px]" />
            </div>

            {/* Harmonic Orders Table */}
            <div className="bg-slate-900/60 rounded border border-slate-800 p-2 overflow-y-auto max-h-[240px]">
              <table className="w-full text-left text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-1 px-2">Order (h)</th>
                    <th className="py-1 px-2">Freq</th>
                    <th className="py-1 px-2">RMS (A)</th>
                    <th className="py-1 px-2">% Fund</th>
                    <th className="py-1 px-2">Phase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {measurements.currentHarmonics.slice(0, 15).map(h => (
                    <tr key={h.order} className={h.order === 1 ? 'bg-sky-500/10 font-bold text-sky-300' : ''}>
                      <td className="py-1 px-2">{h.order} {h.order === 1 && '(Fund)'}</td>
                      <td className="py-1 px-2">{h.frequency} Hz</td>
                      <td className="py-1 px-2">{h.rms.toFixed(2)} A</td>
                      <td className="py-1 px-2">{h.percentFundamental.toFixed(1)}%</td>
                      <td className="py-1 px-2">{h.phaseDeg.toFixed(1)}°</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 3. DEVICE STATES TAB */}
        {/* ========================================== */}
        {activeTab === 'deviceStates' && (
          <div className="space-y-3">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>Instantaneous Device Operating Points at t = {((sample?.t ?? 0) * 1000).toFixed(2)} ms</span>
              <span className="text-slate-500">Scrub cursor to inspect different conduction intervals</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {Object.entries(devices).map(([key, dev]) => (
                <div
                  key={key}
                  className={`p-3 rounded border font-mono transition-all ${
                    dev.isConduction
                      ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs">{dev.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        dev.isConduction
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {dev.isConduction ? 'ON (CONDUCTING)' : 'OFF (BLOCKING)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Voltage Drop:</div>
                      <div className={`font-bold ${dev.isConduction ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {dev.voltage.toFixed(2)} V
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Forward Current:</div>
                      <div className={`font-bold ${dev.isConduction ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {dev.current.toFixed(2)} A
                      </div>
                    </div>
                  </div>

                  {dev.type === 'scr' && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Gate Trigger Status:</span>
                      <span className={dev.isGated ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-500'}>
                        {dev.isGated ? 'PULSE ACTIVE' : 'NO PULSE'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 4. THEORY & HUMAN-INTERPRETED FORMULAS TAB */}
        {/* ========================================== */}
        {activeTab === 'theory' && (
          <div className="space-y-3 font-mono">
            {/* Summary */}
            <div className="p-3 bg-slate-900/90 rounded border border-slate-800 text-xs text-slate-300 leading-relaxed shadow-sm">
              <strong className="text-sky-400 font-semibold block mb-1">Principles of Operation:</strong>
              {circuitDef.theory.summary}
            </div>

            {/* Live Operational Inputs Header */}
            <div className="p-2.5 bg-sky-950/40 rounded border border-sky-800/60 text-xs flex flex-wrap items-center justify-between gap-3 text-sky-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span className="font-bold">Live Circuit Operating Parameters:</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-300">
                <span>V_rms = <strong className="text-sky-400 font-bold">{params.vRms} V</strong></span>
                <span>V_peak (Vm) = <strong className="text-amber-400 font-bold">{(Math.SQRT2 * params.vRms).toFixed(1)} V</strong></span>
                <span>f = <strong className="text-sky-400 font-bold">{params.frequency} Hz</strong></span>
                {circuitDef.paramConfigs.hasControl && (
                  <span>α = <strong className="text-amber-400 font-bold">{params.firingAngle}°</strong></span>
                )}
                <span>R = <strong className="text-emerald-400 font-bold">{params.rLoad} Ω</strong></span>
              </div>
            </div>

            {/* Human-Interpreted Formula Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {circuitDef.theory.formulas.map((item, idx) => {
                const Vm = Math.SQRT2 * params.vRms;
                const liveCalc = item.calculation ? item.calculation(params, Vm) : null;

                // Human plain-English interpreter for standard formulas if humanReadable wasn't provided
                const cleanFormula = item.formula
                  .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
                  .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
                  .replace(/\\approx/g, '≈')
                  .replace(/\\cos/g, 'cos')
                  .replace(/\\sin/g, 'sin')
                  .replace(/\\pi/g, 'π')
                  .replace(/\\alpha/g, 'α')
                  .replace(/\\beta/g, 'β')
                  .replace(/\\phi/g, 'φ')
                  .replace(/\\text\{([^}]+)\}/g, '$1')
                  .replace(/\\le/g, '≤')
                  .replace(/\\ge/g, '≥')
                  .replace(/V_m/g, 'Vm')
                  .replace(/V_\{avg\}/g, 'V_avg')
                  .replace(/V_\{rms\}/g, 'V_rms')
                  .replace(/V_\{m\(LL\)\}/g, 'Vm(LL)')
                  .replace(/[{}]/g, '');

                return (
                  <div key={idx} className="p-3 bg-slate-900/80 rounded border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.name}</span>
                        <span className="text-[9px] text-sky-400 bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800/70">Formula</span>
                      </div>

                      {/* Symbolic Mathematical Equation */}
                      <div className="my-1.5 p-2 bg-slate-950 rounded border border-slate-800/80 text-amber-300 font-bold text-xs tracking-wide">
                        {cleanFormula}
                      </div>

                      {/* Human Interpreted Plain-English Meaning */}
                      <div className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800/60 my-1.5 leading-snug">
                        <span className="text-emerald-400 font-semibold block text-[10px] uppercase mb-0.5">What this means:</span>
                        {item.humanReadable || item.explanation}
                      </div>
                    </div>

                    {/* Step-by-Step Numerical Substitution with Live Parameters */}
                    {liveCalc ? (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] bg-slate-950/70 p-2 rounded">
                        <div className="text-[9px] uppercase font-bold text-sky-400 mb-1">Live Calculation with Your Values:</div>
                        <div className="text-slate-400 text-[10px] truncate" title={liveCalc.expression}>
                          = {liveCalc.expression}
                        </div>
                        <div className="text-emerald-400 font-bold text-xs mt-0.5">
                          = {liveCalc.value} {liveCalc.unit}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5 mt-1 leading-normal">
                        {item.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Practical Laboratory & Design Insights */}
            <div className="p-3 bg-slate-900/60 rounded border border-slate-800 text-xs">
              <span className="font-semibold text-slate-200 block mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-400" />
                Practical Engineering Insights & Rules of Thumb:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {circuitDef.theory.notes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
