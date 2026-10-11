import React from 'react';
import { useSimStore } from '../store/useSimStore';
import { CIRCUITS } from '../simulation/circuitsData';
import { 
  Sliders, 
  RotateCcw, 
  Sparkles, 
  Zap, 
  Clock, 
  Layers,
  Activity,
  Flame
} from 'lucide-react';

export const ParameterPanel: React.FC = () => {
  const {
    params,
    updateParam,
    resetToDefaults,
    applyPreset,
    selectedCircuitId
  } = useSimStore();

  const circuitDef = CIRCUITS.find(c => c.id === selectedCircuitId) || CIRCUITS[0];
  const { hasControl, hasFreewheelingOption, hasDualControl, supportsBackEmf } = circuitDef.paramConfigs;

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden text-xs font-mono">
      {/* Parameter Panel Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/90">
        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-sky-400" />
          Circuit Parameters
        </span>
        <button
          onClick={resetToDefaults}
          title="Reset all parameters to default"
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-700 transition"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 p-3 overflow-y-auto space-y-4">
        {/* Quick Educational Presets */}
        <div>
          <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Lab Presets
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => applyPreset('resistive')}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded text-left text-[10px] text-slate-300 transition"
            >
              Pure Resistive
            </button>
            <button
              onClick={() => applyPreset('highly-inductive')}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded text-left text-[10px] text-slate-300 transition"
            >
              High Inductive (RL)
            </button>
            <button
              onClick={() => applyPreset('discontinuous')}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded text-left text-[10px] text-slate-300 transition"
            >
              Discontinuous Mode
            </button>
            {supportsBackEmf && (
              <button
                onClick={() => applyPreset('inverter-mode')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded text-left text-[10px] text-slate-300 transition"
              >
                Inverter Mode (α &gt; 90°)
              </button>
            )}
          </div>
        </div>

        {/* 1. SOURCE PARAMETERS */}
        <div className="border-t border-slate-800/80 pt-3">
          <div className="text-[10px] uppercase text-sky-400 font-bold tracking-wider mb-2 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            AC Source
          </div>

          <div className="space-y-2.5">
            {/* Voltage RMS */}
            <div>
              <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                <span>RMS Voltage:</span>
                <span className="text-sky-400 font-bold">{params.vRms} V</span>
              </div>
              <input
                type="range"
                min="24"
                max="480"
                step="2"
                value={params.vRms}
                onChange={(e) => updateParam('vRms', parseFloat(e.target.value))}
                className="w-full accent-sky-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>

            {/* Frequency */}
            <div>
              <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                <span>Frequency:</span>
                <span className="text-sky-400 font-bold">{params.frequency} Hz</span>
              </div>
              <input
                type="range"
                min="10"
                max="400"
                step="5"
                value={params.frequency}
                onChange={(e) => updateParam('frequency', parseFloat(e.target.value))}
                className="w-full accent-sky-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>

            {/* Phase Angle */}
            <div>
              <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                <span>Initial Phase:</span>
                <span className="text-sky-400 font-bold">{params.sourcePhase}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="5"
                value={params.sourcePhase}
                onChange={(e) => updateParam('sourcePhase', parseFloat(e.target.value))}
                className="w-full accent-sky-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 2. LOAD CONFIGURATION */}
        <div className="border-t border-slate-800/80 pt-3">
          <div className="text-[10px] uppercase text-emerald-400 font-bold tracking-wider mb-2 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            Load Configuration
          </div>

          {/* Load Type Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded border border-slate-800 mb-2.5">
            {(['R', 'RL', ...(supportsBackEmf ? ['RLE'] : [])] as any[]).map((type) => (
              <button
                key={type}
                onClick={() => updateParam('loadType', type)}
                className={`flex-1 py-1 rounded text-center text-[10px] font-bold transition ${
                  params.loadType === type
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {/* Resistance R */}
            <div>
              <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                <span>Resistance (R):</span>
                <span className="text-emerald-400 font-bold">{params.rLoad} Ω</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={params.rLoad}
                onChange={(e) => updateParam('rLoad', parseFloat(e.target.value))}
                className="w-full accent-emerald-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>

            {/* Inductance L */}
            {(params.loadType === 'RL' || params.loadType === 'RLE' || selectedCircuitId.includes('tcr')) && (
              <div>
                <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                  <span>Inductance (L):</span>
                  <span className="text-violet-400 font-bold">{params.lLoad} mH</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="200"
                  step="2"
                  value={params.lLoad}
                  onChange={(e) => updateParam('lLoad', parseFloat(e.target.value))}
                  className="w-full accent-violet-400 h-1 bg-slate-800 rounded cursor-pointer"
                />
              </div>
            )}

            {/* Back-EMF E */}
            {params.loadType === 'RLE' && (
              <div>
                <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                  <span>DC Back-EMF (E):</span>
                  <span className="text-amber-400 font-bold">{params.eLoad} V</span>
                </div>
                <input
                  type="range"
                  min="-150"
                  max="150"
                  step="5"
                  value={params.eLoad}
                  onChange={(e) => updateParam('eLoad', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1 bg-slate-800 rounded cursor-pointer"
                />
              </div>
            )}

            {/* Freewheeling Diode Checkbox */}
            {hasFreewheelingOption && (
              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={params.hasFreewheeling}
                  onChange={(e) => updateParam('hasFreewheeling', e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                />
                <span className="text-[11px]">Freewheeling Diode (DFW)</span>
              </label>
            )}
          </div>
        </div>

        {/* 3. CONTROL PARAMETERS (FIRING ANGLE ALPHA) */}
        {hasControl && (
          <div className="border-t border-slate-800/80 pt-3">
            <div className="text-[10px] uppercase text-amber-400 font-bold tracking-wider mb-2 flex items-center gap-1">
              <Flame className="w-3 h-3" />
              Thyristor Gating (Control)
            </div>

            <div className="space-y-2.5">
              {/* Firing Angle Alpha */}
              <div>
                <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                  <span>Firing Angle α:</span>
                  <span className="text-amber-400 font-bold">{params.firingAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="175"
                  step="1"
                  value={params.firingAngle}
                  onChange={(e) => updateParam('firingAngle', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1 bg-slate-800 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                  <span>0° (Full On)</span>
                  <span>90° (Boundary)</span>
                  <span>180° (Off/Inv)</span>
                </div>
              </div>

              {/* Dual Converter alpha 2 */}
              {hasDualControl && (
                <div>
                  <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                    <span>Bridge 2 Firing α₂:</span>
                    <span className="text-amber-300 font-bold">
                      {params.firingAngle2 || (180 - params.firingAngle)}°
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Linked condition: α₁ + α₂ = 180°
                  </div>
                </div>
              )}

              {/* Gate Pulse Width */}
              <div>
                <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                  <span>Gate Pulse Width:</span>
                  <span className="text-slate-300">{params.pulseWidth}°</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={params.pulseWidth}
                  onChange={(e) => updateParam('pulseWidth', parseFloat(e.target.value))}
                  className="w-full accent-slate-400 h-1 bg-slate-800 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. NUMERICAL SIMULATION SETTINGS */}
        <div className="border-t border-slate-800/80 pt-3">
          <div className="text-[10px] uppercase text-purple-400 font-bold tracking-wider mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Simulation Engine
          </div>

          <div className="space-y-2.5">
            {/* Number of Cycles */}
            <div>
              <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                <span>AC Cycles:</span>
                <span className="text-purple-400 font-bold">{params.cycles}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={params.cycles}
                onChange={(e) => updateParam('cycles', parseInt(e.target.value, 10))}
                className="w-full accent-purple-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>

            {/* Time step */}
            <div>
              <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                <span>Time Step (dt):</span>
                <span className="text-purple-300">{params.timeStepUs} µs</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={params.timeStepUs}
                onChange={(e) => updateParam('timeStepUs', parseInt(e.target.value, 10))}
                className="w-full accent-purple-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
