import React, { useState } from 'react';
import { useSimStore } from '../store/useSimStore';
import { 
  AcSourceSymbol, 
  DcSourceSymbol, 
  DiodeSymbol, 
  ScrSymbol, 
  ResistorSymbol, 
  InductorSymbol, 
  GroundSymbol,
  TransformerCtSymbol,
  SvgGlowFilters 
} from './ElectricalSymbols';
import { 
  Eye, 
  Zap, 
  Play, 
  Pause, 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  ZoomIn, 
  ZoomOut, 
  Crosshair, 
  CheckCircle2
} from 'lucide-react';

// ==========================================
// DEDICATED CURRENT FLOW STREAM COMPONENT
// ==========================================
interface CurrentFlowPathProps {
  d: string;
  active: boolean;
  reverse?: boolean;
  color?: 'emerald' | 'cyan' | 'amber';
}

const CurrentFlowPath: React.FC<CurrentFlowPathProps> = ({ 
  d, 
  active, 
  reverse = false, 
  color = 'emerald' 
}) => {
  if (!active || !d) return null;
  const strokeClass = color === 'cyan' 
    ? 'stroke-cyan-400 current-path-cyan' 
    : color === 'amber' 
      ? 'stroke-amber-400 current-path-amber' 
      : reverse 
        ? 'stroke-sky-400 current-path-reverse' 
        : 'stroke-emerald-400 current-path-active';
  return (
    <path
      d={d}
      fill="none"
      className={`${strokeClass} stroke-[3] pointer-events-none`}
    />
  );
};

// ==========================================
// REUSABLE LOAD BRANCH WITH CONTINUOUS TRUNKS
// ==========================================
interface LoadBranchProps {
  x: number;
  yTop: number;
  yBot: number;
  loadType: 'R' | 'RL' | 'RLE';
  rLoad: number;
  lLoad: number;
  eLoad: number;
  highlightClass: (id: string) => string;
  onSelect: (id: string) => void;
}

const LoadBranch: React.FC<LoadBranchProps> = ({
  x,
  yTop,
  yBot,
  loadType,
  rLoad,
  lLoad,
  eLoad,
  highlightClass,
  onSelect
}) => {
  if (loadType === 'R') {
    const yR = Math.round((yTop + yBot) / 2 - 40);
    return (
      <g>
        <path d={`M ${x} ${yTop} L ${x} ${yR}`} className="stroke-slate-600 stroke-2" />
        <g transform={`translate(${x - 40}, ${yR})`} className={highlightClass('load-r')} onClick={() => onSelect('load-r')}>
          <ResistorSymbol value={`${rLoad}Ω`} orientation="v" />
        </g>
        <path d={`M ${x} ${yR + 80} L ${x} ${yBot}`} className="stroke-slate-600 stroke-2" />
      </g>
    );
  }

  if (loadType === 'RL') {
    const mid = (yTop + yBot) / 2;
    const yR = Math.round(mid - 80);
    const yL = yR + 80;
    return (
      <g>
        <path d={`M ${x} ${yTop} L ${x} ${yR}`} className="stroke-slate-600 stroke-2" />
        <g transform={`translate(${x - 40}, ${yR})`} className={highlightClass('load-r')} onClick={() => onSelect('load-r')}>
          <ResistorSymbol value={`${rLoad}Ω`} orientation="v" />
        </g>
        <g transform={`translate(${x - 40}, ${yL})`} className={highlightClass('load-l')} onClick={() => onSelect('load-l')}>
          <InductorSymbol value={`${lLoad}mH`} orientation="v" />
        </g>
        <path d={`M ${x} ${yL + 80} L ${x} ${yBot}`} className="stroke-slate-600 stroke-2" />
      </g>
    );
  }

  // RLE: Resistor + Inductor + Back-EMF (E)
  const yR = yTop + 10;
  const yL = yR + 75;
  const yE = yL + 75;
  return (
    <g>
      <path d={`M ${x} ${yTop} L ${x} ${yR}`} className="stroke-slate-600 stroke-2" />
      <g transform={`translate(${x - 40}, ${yR})`} className={highlightClass('load-r')} onClick={() => onSelect('load-r')}>
        <ResistorSymbol value={`${rLoad}Ω`} orientation="v" />
      </g>
      <g transform={`translate(${x - 40}, ${yL})`} className={highlightClass('load-l')} onClick={() => onSelect('load-l')}>
        <InductorSymbol value={`${lLoad}mH`} orientation="v" />
      </g>
      <g transform={`translate(${x - 40}, ${yE})`} className={highlightClass('load-e')} onClick={() => onSelect('load-e')}>
        <DcSourceSymbol label="DC Machine (E)" value={`${eLoad}V`} />
      </g>
      <path d={`M ${x} ${yE + 80} L ${x} ${yBot}`} className="stroke-slate-600 stroke-2" />
    </g>
  );
};

// ==========================================
// REUSABLE FREEWHEELING DIODE BRANCH
// ==========================================
interface FreewheelingBranchProps {
  x: number;
  yTop: number;
  yBot: number;
  dfw: { isConduction: boolean; voltage: number; current: number };
  showDeviceStates: boolean;
  highlightClass: (id: string) => string;
  onSelect: (id: string) => void;
}

const FreewheelingBranch: React.FC<FreewheelingBranchProps> = ({
  x,
  yTop,
  yBot,
  dfw,
  showDeviceStates,
  highlightClass,
  onSelect
}) => {
  const yD = Math.round((yTop + yBot) / 2 - 40);
  return (
    <g>
      <circle cx={x} cy={yTop} r="3.5" className="fill-amber-400" />
      <path d={`M ${x} ${yTop} L ${x} ${yD}`} className="stroke-slate-600 stroke-2" />
      <g transform={`translate(${x - 40}, ${yD})`} className={highlightClass('DFW')} onClick={() => onSelect('DFW')}>
        {/* Rotation 270: Cathode at top (x, yD), Anode at bottom (x, yD + 80) */}
        <DiodeSymbol 
          id="DFW" 
          name="D_FW" 
          isConduction={showDeviceStates && dfw.isConduction} 
          voltage={dfw.voltage} 
          current={dfw.current} 
          rotation={270} 
        />
      </g>
      <path d={`M ${x} ${yD + 80} L ${x} ${yBot}`} className="stroke-slate-600 stroke-2" />
      <circle cx={x} cy={yBot} r="3.5" className="fill-slate-400" />
    </g>
  );
};

export const SchematicView: React.FC = () => {
  const {
    selectedCircuitId,
    params,
    simulationResult,
    currentTimeIndex,
    setTimeIndex,
    isRunning,
    togglePlayPause,
    stepForward,
    stepBackward,
    showDeviceStates,
    setShowDeviceStates,
    showCurrentAnimation,
    setShowCurrentAnimation,
    toggleChannel,
    selectedComponentId,
    setSelectedComponentId,
    simSpeed,
    setSimSpeed
  } = useSimStore();

  const [zoomLevel, setZoomLevel] = useState<number>(1);

  if (!simulationResult || simulationResult.samples.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 font-mono text-xs">
        No simulation data available
      </div>
    );
  }

  const sample = simulationResult.samples[currentTimeIndex] || simulationResult.samples[0];
  const omegaTdeg = ((sample.t * params.frequency * 360) % 360).toFixed(1);
  const devices = sample.devices || {};

  // Current flow active states
  const isIoFlowing = Math.abs(sample.io) > 0.05 && showCurrentAnimation;

  // Highlight helper
  const isSelected = (id: string) => selectedComponentId === id;
  const highlightClass = (id: string) => isSelected(id) ? 'stroke-amber-400 stroke-[3] filter drop-shadow(0 0 8px #f59e0b)' : '';

  // Get active component details for HUD
  const getSelectedComponentInfo = () => {
    if (!selectedComponentId) return null;

    if (selectedComponentId === 'source') {
      return {
        name: selectedCircuitId.includes('tp-') ? '3-Phase AC Supply' : '1-Phase AC Supply',
        type: 'Voltage Source',
        state: 'Active Generator',
        voltage: `${sample.vs.toFixed(1)} V (RMS: ${params.vRms} V)`,
        current: `${sample.is.toFixed(2)} A`,
        detail: `f = ${params.frequency} Hz, Phase = ${params.sourcePhase}°`
      };
    }

    if (selectedComponentId === 'load-r') {
      const v = sample.vo;
      const i = sample.io;
      return {
        name: 'Load Resistor (R)',
        type: 'Passive Dissipative Load',
        state: Math.abs(i) > 0.01 ? 'Conducting Current' : 'Idle',
        voltage: `${v.toFixed(1)} V`,
        current: `${i.toFixed(2)} A`,
        detail: `Resistance = ${params.rLoad} Ω, Power = ${(v * i).toFixed(1)} W`
      };
    }

    if (selectedComponentId === 'load-l') {
      return {
        name: 'Load Inductor (L)',
        type: 'Energy Storage Reactor',
        state: Math.abs(sample.io) > 0.01 ? 'Energized' : 'Discharged',
        voltage: `VL = L di/dt`,
        current: `${sample.io.toFixed(2)} A`,
        detail: `Inductance = ${params.lLoad} mH`
      };
    }

    if (selectedComponentId === 'load-e') {
      return {
        name: 'DC Machine / Back-EMF (E)',
        type: 'Active DC Source / Battery',
        state: 'Active',
        voltage: `${params.eLoad} V`,
        current: `${sample.io.toFixed(2)} A`,
        detail: 'Represents motor counter-EMF or charging battery'
      };
    }

    const dev = devices[selectedComponentId];
    if (dev) {
      return {
        name: dev.name,
        type: dev.type === 'scr' ? 'Thyristor (SCR)' : 'Diode',
        state: dev.isConduction ? 'ON (Conducting)' : (dev.isGated ? 'GATE PULSED' : 'OFF (Blocking)'),
        voltage: `${dev.voltage.toFixed(2)} V (V_ak)`,
        current: `${dev.current.toFixed(2)} A`,
        detail: dev.type === 'scr' 
          ? `Firing Delay α = ${params.firingAngle}°, Gate Pulse: ${dev.isGated ? 'Active' : 'Idle'}`
          : 'Natural line commutation'
      };
    }

    return null;
  };

  const selectedInfo = getSelectedComponentInfo();

  // List of components for dropdown
  const getCircuitComponentsList = () => {
    const list: { id: string; label: string; group: string }[] = [
      { id: 'source', label: selectedCircuitId.includes('tp-') ? '3-Phase AC Source' : 'AC Voltage Source', group: 'Sources' }
    ];

    Object.keys(devices).forEach(key => {
      list.push({
        id: key,
        label: devices[key].name,
        group: 'Semiconductors'
      });
    });

    list.push({ id: 'load-r', label: `Load Resistor (${params.rLoad}Ω)`, group: 'Load' });
    if (params.loadType === 'RL' || params.loadType === 'RLE' || selectedCircuitId.includes('tcr')) {
      list.push({ id: 'load-l', label: `Load Inductor (${params.lLoad}mH)`, group: 'Load' });
    }
    if (params.loadType === 'RLE' || selectedCircuitId.includes('dual')) {
      list.push({ id: 'load-e', label: `DC Back-EMF (${params.eLoad}V)`, group: 'Load' });
    }

    return list;
  };

  const componentsList = getCircuitComponentsList();

  // ==========================================
  // TEXTBOOK-ACCURATE SCHEMATICS & CURRENT LOOPS
  // ==========================================
  const renderCircuitGraphic = () => {
    switch (selectedCircuitId) {
      // ----------------------------------------------------
      // 1. Single Phase Half Wave Rectifier
      // ----------------------------------------------------
      case 'sp-half-wave': {
        const d1 = devices['D1'] || { isConduction: false, voltage: 0, current: 0 };
        const dfw = devices['DFW'] || { isConduction: false, voltage: 0, current: 0 };
        const isMainCond = d1.isConduction && isIoFlowing;
        const isFwCond = dfw.isConduction && isIoFlowing;

        return (
          <svg viewBox="0 0 860 380" className="w-full h-full max-h-[380px] select-none block" style={{ minHeight: '280px', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <SvgGlowFilters />
            {/* Base circuit wires */}
            <path d="M 140 120 L 260 120" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 340 120 L 580 120" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 580 280 L 140 280 L 140 200" className="stroke-slate-600 stroke-2 fill-none" />

            {/* AC Source: at (100, 120). Pins: (140, 120) and (140, 200) */}
            <g transform="translate(100, 120)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <AcSourceSymbol label="AC Supply" sublabel={`${params.vRms}V ${params.frequency}Hz`} orientation="v" />
            </g>

            {/* Diode D1: at (260, 80). Left pin (260, 120), Right pin (340, 120) */}
            <g transform="translate(260, 80)" className={highlightClass('D1')} onClick={() => setSelectedComponentId('D1')}>
              <DiodeSymbol id="D1" name="Diode D1" isConduction={showDeviceStates && d1.isConduction} voltage={d1.voltage} current={d1.current} rotation={0} />
            </g>

            {/* Freewheeling Diode Branch */}
            {params.hasFreewheeling && (
              <FreewheelingBranch 
                x={440} 
                yTop={120} 
                yBot={280} 
                dfw={dfw} 
                showDeviceStates={showDeviceStates} 
                highlightClass={highlightClass} 
                onSelect={setSelectedComponentId} 
              />
            )}

            {/* Load at x = 580 */}
            <LoadBranch
              x={580}
              yTop={120}
              yBot={280}
              loadType={params.loadType}
              rLoad={params.rLoad}
              lLoad={params.lLoad}
              eLoad={params.eLoad}
              highlightClass={highlightClass}
              onSelect={setSelectedComponentId}
            />

            {/* DYNAMIC CURRENT FLOW PATH OVERLAYS */}
            {/* Main Conduction Loop: Source(+) -> D1 -> Load -> Source(-) */}
            <CurrentFlowPath
              d="M 140 120 L 260 120 L 340 120 L 580 120 L 580 280 L 140 280 L 140 200"
              active={isMainCond}
              color="emerald"
            />
            {/* Freewheeling Conduction Loop: DFW -> Load -> DFW */}
            <CurrentFlowPath
              d="M 440 280 L 440 160 L 440 120 L 580 120 L 580 280 L 440 280"
              active={isFwCond}
              color="amber"
            />

            {/* Probes & Ground */}
            <circle cx="200" cy="120" r="4.5" className="fill-sky-400 cursor-pointer" onClick={() => toggleChannel('vs')} />
            <text x="200" y="105" textAnchor="middle" className="text-[10px] font-mono fill-sky-400 font-bold">Vs</text>
            <circle cx="580" cy="105" r="4.5" className="fill-amber-400 cursor-pointer" onClick={() => toggleChannel('vo')} />
            <text x="580" y="90" textAnchor="middle" className="text-[10px] font-mono fill-amber-400 font-bold">Vo (+)</text>
            <g transform="translate(100, 280)"><GroundSymbol /></g>
          </svg>
        );
      }

      // ----------------------------------------------------
      // 2. Full Wave Center-Tapped Rectifier
      // ----------------------------------------------------
      case 'sp-full-wave-ct': {
        const d1 = devices['D1'] || { isConduction: false, voltage: 0, current: 0 };
        const d2 = devices['D2'] || { isConduction: false, voltage: 0, current: 0 };
        const isD1Cond = d1.isConduction && isIoFlowing;
        const isD2Cond = d2.isConduction && isIoFlowing;

        return (
          <svg viewBox="0 0 860 380" className="w-full h-full max-h-[380px] select-none block" style={{ minHeight: '280px', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <SvgGlowFilters />
            {/* Primary Source */}
            <g transform="translate(60, 120)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <AcSourceSymbol label="AC Supply" sublabel={`${params.vRms}V 50Hz`} orientation="v" />
            </g>

            {/* Primary Wires */}
            <path d="M 100 120 L 120 120 L 120 100 L 160 100" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 100 200 L 120 200 L 120 280 L 160 280" className="stroke-slate-600 stroke-2 fill-none" />

            {/* Transformer */}
            <g transform="translate(160, 70)">
              <TransformerCtSymbol vPri={`${params.vRms}V`} vSec={`${(params.vRms * 0.5).toFixed(0)}V CT`} />
            </g>

            {/* Secondary base wires */}
            <path d="M 280 100 L 320 100" className="stroke-slate-600 stroke-2" />
            <g transform="translate(320, 60)" className={highlightClass('D1')} onClick={() => setSelectedComponentId('D1')}>
              <DiodeSymbol id="D1" name="D1 (+Half)" isConduction={showDeviceStates && d1.isConduction} voltage={d1.voltage} current={d1.current} rotation={0} />
            </g>

            <path d="M 280 280 L 320 280" className="stroke-slate-600 stroke-2" />
            <g transform="translate(320, 240)" className={highlightClass('D2')} onClick={() => setSelectedComponentId('D2')}>
              <DiodeSymbol id="D2" name="D2 (-Half)" isConduction={showDeviceStates && d2.isConduction} voltage={d2.voltage} current={d2.current} rotation={0} />
            </g>

            {/* Common DC+ bus */}
            <path d="M 400 100 L 450 100 L 450 140 L 600 140" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 400 280 L 450 280 L 450 140" className="stroke-slate-600 stroke-2 fill-none" />
            <circle cx="450" cy="140" r="3.5" className="fill-amber-400" />

            {/* Center Tap Neutral Wire to Load (-) */}
            <path d="M 280 190 L 520 190 L 520 280 L 600 280" className="stroke-slate-600 stroke-2 fill-none" />
            <circle cx="280" cy="190" r="3.5" className="fill-slate-300" />
            <circle cx="600" cy="280" r="3.5" className="fill-slate-400" />

            {/* Load at x = 600 */}
            <LoadBranch
              x={600}
              yTop={140}
              yBot={280}
              loadType={params.loadType}
              rLoad={params.rLoad}
              lLoad={params.lLoad}
              eLoad={params.eLoad}
              highlightClass={highlightClass}
              onSelect={setSelectedComponentId}
            />

            {/* CURRENT FLOW STREAM: D1 Conduction Loop */}
            <CurrentFlowPath
              d="M 280 100 L 400 100 L 450 100 L 450 140 L 600 140 L 600 280 L 520 280 L 520 190 L 280 190"
              active={isD1Cond}
              color="emerald"
            />
            {/* Primary current for D1 */}
            <CurrentFlowPath
              d="M 100 120 L 120 120 L 120 100 L 160 100 L 160 280 L 120 280 L 120 200 L 100 200"
              active={isD1Cond}
              color="emerald"
            />

            {/* CURRENT FLOW STREAM: D2 Conduction Loop */}
            <CurrentFlowPath
              d="M 280 280 L 400 280 L 450 280 L 450 140 L 600 140 L 600 280 L 520 280 L 520 190 L 280 190"
              active={isD2Cond}
              color="cyan"
            />
            {/* Primary current for D2 (reverse) */}
            <CurrentFlowPath
              d="M 100 200 L 120 200 L 120 280 L 160 280 L 160 100 L 120 100 L 120 120 L 100 120"
              active={isD2Cond}
              color="cyan"
            />

            <circle cx="600" cy="120" r="4.5" className="fill-amber-400 cursor-pointer" onClick={() => toggleChannel('vo')} />
            <text x="600" y="105" textAnchor="middle" className="text-[10px] font-mono fill-amber-400 font-bold">+ Vo</text>
          </svg>
        );
      }

      // ----------------------------------------------------
      // 3. Single Phase Diode Bridge Rectifier
      // ----------------------------------------------------
      case 'sp-diode-bridge': {
        const d1 = devices['D1'] || { isConduction: false, voltage: 0, current: 0 };
        const d2 = devices['D2'] || { isConduction: false, voltage: 0, current: 0 };
        const d3 = devices['D3'] || { isConduction: false, voltage: 0, current: 0 };
        const d4 = devices['D4'] || { isConduction: false, voltage: 0, current: 0 };
        const dfw = devices['DFW'] || { isConduction: false, voltage: 0, current: 0 };

        const isPair1 = (d1.isConduction || sample.vs >= 0) && isIoFlowing && !dfw.isConduction;
        const isPair2 = (d3.isConduction || sample.vs < 0) && isIoFlowing && !dfw.isConduction;
        const isFw = dfw.isConduction && isIoFlowing;

        return (
          <svg viewBox="0 0 860 380" className="w-full h-full max-h-[380px] select-none block" style={{ minHeight: '280px', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <SvgGlowFilters />
            {/* Base AC Source */}
            <g transform="translate(60, 130)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <AcSourceSymbol label="AC Supply" sublabel={`${params.vRms}V 50Hz`} orientation="v" />
            </g>

            {/* Base leg 1 */}
            <g transform="translate(220, 60)" className={highlightClass('D1')} onClick={() => setSelectedComponentId('D1')}>
              <DiodeSymbol id="D1" name="D1" isConduction={showDeviceStates && d1.isConduction} voltage={d1.voltage} current={d1.current} rotation={270} />
            </g>
            <path d="M 260 140 L 260 200" className="stroke-slate-600 stroke-2" />
            <circle cx="260" cy="170" r="3.5" className="fill-sky-400" />
            <g transform="translate(220, 200)" className={highlightClass('D4')} onClick={() => setSelectedComponentId('D4')}>
              <DiodeSymbol id="D4" name="D4" isConduction={showDeviceStates && d4.isConduction} voltage={d4.voltage} current={d4.current} rotation={270} />
            </g>

            {/* Base leg 2 */}
            <g transform="translate(340, 60)" className={highlightClass('D3')} onClick={() => setSelectedComponentId('D3')}>
              <DiodeSymbol id="D3" name="D3" isConduction={showDeviceStates && d3.isConduction} voltage={d3.voltage} current={d3.current} rotation={270} />
            </g>
            <path d="M 380 140 L 380 200" className="stroke-slate-600 stroke-2" />
            <circle cx="380" cy="170" r="3.5" className="fill-sky-400" />
            <g transform="translate(340, 200)" className={highlightClass('D2')} onClick={() => setSelectedComponentId('D2')}>
              <DiodeSymbol id="D2" name="D2" isConduction={showDeviceStates && d2.isConduction} voltage={d2.voltage} current={d2.current} rotation={270} />
            </g>

            {/* Base AC supply lines */}
            <path d="M 100 130 L 100 110 L 200 110 L 200 170 L 260 170" fill="none" className="stroke-slate-600 stroke-2" />
            <path d="M 100 210 L 100 230 L 160 230 L 160 250 L 320 250 L 320 170 L 380 170" fill="none" className="stroke-slate-600 stroke-2" />

            {/* Base Top and Bottom DC rails */}
            <path d="M 260 60 L 380 60 L 580 60" className="stroke-slate-600 stroke-2" />
            <path d="M 260 280 L 380 280 L 580 280" className="stroke-slate-600 stroke-2" />
            <circle cx="260" cy="60" r="3.5" className="fill-amber-400" />
            <circle cx="380" cy="60" r="3.5" className="fill-amber-400" />
            <circle cx="260" cy="280" r="3.5" className="fill-slate-400" />
            <circle cx="380" cy="280" r="3.5" className="fill-slate-400" />

            {/* Freewheeling Diode */}
            {params.hasFreewheeling && (
              <FreewheelingBranch 
                x={480} 
                yTop={60} 
                yBot={280} 
                dfw={dfw} 
                showDeviceStates={showDeviceStates} 
                highlightClass={highlightClass} 
                onSelect={setSelectedComponentId} 
              />
            )}

            {/* DC Load Branch */}
            <LoadBranch
              x={580}
              yTop={60}
              yBot={280}
              loadType={params.loadType}
              rLoad={params.rLoad}
              lLoad={params.lLoad}
              eLoad={params.eLoad}
              highlightClass={highlightClass}
              onSelect={setSelectedComponentId}
            />

            {/* DYNAMIC CURRENT FLOW: Pair 1 (D1 + D2) in Positive Half Cycle */}
            <CurrentFlowPath
              d="M 100 130 L 100 110 L 200 110 L 200 170 L 260 170 L 260 60 L 580 60 L 580 280 L 380 280 L 380 170 L 320 170 L 320 250 L 160 250 L 160 230 L 100 230 L 100 210"
              active={isPair1}
              color="emerald"
            />

            {/* DYNAMIC CURRENT FLOW: Pair 2 (D3 + D4) in Negative Half Cycle */}
            <CurrentFlowPath
              d="M 100 210 L 100 230 L 160 230 L 160 250 L 320 250 L 320 170 L 380 170 L 380 60 L 580 60 L 580 280 L 260 280 L 260 170 L 200 170 L 200 110 L 100 110 L 100 130"
              active={isPair2}
              color="cyan"
            />

            {/* DYNAMIC CURRENT FLOW: Freewheeling Loop */}
            <CurrentFlowPath
              d="M 480 280 L 480 60 L 580 60 L 580 280 L 480 280"
              active={isFw}
              color="amber"
            />

            <circle cx="580" cy="45" r="4.5" className="fill-amber-400 cursor-pointer" onClick={() => toggleChannel('vo')} />
            <text x="580" y="32" textAnchor="middle" className="text-[10px] font-mono fill-amber-400 font-bold">+ Vo</text>
          </svg>
        );
      }

      // ----------------------------------------------------
      // 4. Single Phase Fully Controlled Bridge
      // ----------------------------------------------------
      case 'sp-full-controlled': {
        const t1 = devices['T1'] || { isConduction: false, isGated: false, voltage: 0, current: 0 };
        const t2 = devices['T2'] || { isConduction: false, isGated: false, voltage: 0, current: 0 };
        const t3 = devices['T3'] || { isConduction: false, isGated: false, voltage: 0, current: 0 };
        const t4 = devices['T4'] || { isConduction: false, isGated: false, voltage: 0, current: 0 };
        const dfw = devices['DFW'] || { isConduction: false, voltage: 0, current: 0 };

        const isPair1 = (t1.isConduction || t2.isConduction) && isIoFlowing && !dfw.isConduction;
        const isPair2 = (t3.isConduction || t4.isConduction) && isIoFlowing && !dfw.isConduction;
        const isFw = dfw.isConduction && isIoFlowing;

        return (
          <svg viewBox="0 0 860 380" className="w-full h-full max-h-[380px] select-none block" style={{ minHeight: '280px', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <SvgGlowFilters />
            <g transform="translate(60, 130)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <AcSourceSymbol label="AC Supply" sublabel={`${params.vRms}V α=${params.firingAngle}°`} orientation="v" />
            </g>

            {/* Leg 1: T1 & T4 */}
            <g transform="translate(220, 60)" className={highlightClass('T1')} onClick={() => setSelectedComponentId('T1')}>
              <ScrSymbol id="T1" name="T1" isConduction={showDeviceStates && t1.isConduction} isGated={t1.isGated} voltage={t1.voltage} current={t1.current} rotation={270} />
            </g>
            <path d="M 260 140 L 260 200" className="stroke-slate-600 stroke-2" />
            <circle cx="260" cy="170" r="3.5" className="fill-sky-400" />
            <g transform="translate(220, 200)" className={highlightClass('T4')} onClick={() => setSelectedComponentId('T4')}>
              <ScrSymbol id="T4" name="T4" isConduction={showDeviceStates && t4.isConduction} isGated={t4.isGated} voltage={t4.voltage} current={t4.current} rotation={270} />
            </g>

            {/* Leg 2: T3 & T2 */}
            <g transform="translate(340, 60)" className={highlightClass('T3')} onClick={() => setSelectedComponentId('T3')}>
              <ScrSymbol id="T3" name="T3" isConduction={showDeviceStates && t3.isConduction} isGated={t3.isGated} voltage={t3.voltage} current={t3.current} rotation={270} />
            </g>
            <path d="M 380 140 L 380 200" className="stroke-slate-600 stroke-2" />
            <circle cx="380" cy="170" r="3.5" className="fill-sky-400" />
            <g transform="translate(340, 200)" className={highlightClass('T2')} onClick={() => setSelectedComponentId('T2')}>
              <ScrSymbol id="T2" name="T2" isConduction={showDeviceStates && t2.isConduction} isGated={t2.isGated} voltage={t2.voltage} current={t2.current} rotation={270} />
            </g>

            {/* AC Lines */}
            <path d="M 100 130 L 100 110 L 200 110 L 200 170 L 260 170" fill="none" className="stroke-slate-600 stroke-2" />
            <path d="M 100 210 L 100 230 L 160 230 L 160 250 L 320 250 L 320 170 L 380 170" fill="none" className="stroke-slate-600 stroke-2" />

            {/* Top and Bottom DC Rails */}
            <path d="M 260 60 L 380 60 L 580 60" className="stroke-slate-600 stroke-2" />
            <path d="M 260 280 L 380 280 L 580 280" className="stroke-slate-600 stroke-2" />
            <circle cx="260" cy="60" r="3.5" className="fill-amber-400" />
            <circle cx="380" cy="60" r="3.5" className="fill-amber-400" />
            <circle cx="260" cy="280" r="3.5" className="fill-slate-400" />
            <circle cx="380" cy="280" r="3.5" className="fill-slate-400" />

            {/* Freewheeling Diode */}
            {params.hasFreewheeling && (
              <FreewheelingBranch 
                x={480} 
                yTop={60} 
                yBot={280} 
                dfw={dfw} 
                showDeviceStates={showDeviceStates} 
                highlightClass={highlightClass} 
                onSelect={setSelectedComponentId} 
              />
            )}

            {/* DC Load Branch */}
            <LoadBranch
              x={580}
              yTop={60}
              yBot={280}
              loadType={params.loadType}
              rLoad={params.rLoad}
              lLoad={params.lLoad}
              eLoad={params.eLoad}
              highlightClass={highlightClass}
              onSelect={setSelectedComponentId}
            />

            {/* DYNAMIC CURRENT FLOW: Pair 1 (T1 + T2) */}
            <CurrentFlowPath
              d="M 100 130 L 100 110 L 200 110 L 200 170 L 260 170 L 260 60 L 580 60 L 580 280 L 380 280 L 380 170 L 320 170 L 320 250 L 160 250 L 160 230 L 100 230 L 100 210"
              active={isPair1}
              color="emerald"
            />

            {/* DYNAMIC CURRENT FLOW: Pair 2 (T3 + T4) */}
            <CurrentFlowPath
              d="M 100 210 L 100 230 L 160 230 L 160 250 L 320 250 L 320 170 L 380 170 L 380 60 L 580 60 L 580 280 L 260 280 L 260 170 L 200 170 L 200 110 L 100 110 L 100 130"
              active={isPair2}
              color="cyan"
            />

            {/* DYNAMIC CURRENT FLOW: Freewheeling Loop */}
            <CurrentFlowPath
              d="M 480 280 L 480 60 L 580 60 L 580 280 L 480 280"
              active={isFw}
              color="amber"
            />

            <circle cx="580" cy="45" r="4.5" className="fill-amber-400 cursor-pointer" onClick={() => toggleChannel('vo')} />
            <text x="580" y="32" textAnchor="middle" className="text-[10px] font-mono fill-amber-400 font-bold">+ Vo</text>
          </svg>
        );
      }

      // ----------------------------------------------------
      // 5. Single Phase Semi-Controlled Bridge
      // ----------------------------------------------------
      case 'sp-semi-controlled': {
        const t1 = devices['T1'] || { isConduction: false, isGated: false, voltage: 0, current: 0 };
        const t2 = devices['T2'] || { isConduction: false, isGated: false, voltage: 0, current: 0 };
        const d1 = devices['D1'] || { isConduction: false, voltage: 0, current: 0 };
        const d2 = devices['D2'] || { isConduction: false, voltage: 0, current: 0 };
        const dfw = devices['DFW'] || { isConduction: false, voltage: 0, current: 0 };

        const isT1D2 = (t1.isConduction || d2.isConduction) && isIoFlowing && !dfw.isConduction;
        const isT2D1 = (t2.isConduction || d1.isConduction) && isIoFlowing && !dfw.isConduction;
        const isFw = dfw.isConduction && isIoFlowing;

        return (
          <svg viewBox="0 0 860 380" className="w-full h-full max-h-[380px] select-none block" style={{ minHeight: '280px', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <SvgGlowFilters />
            <g transform="translate(60, 130)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <AcSourceSymbol label="AC Supply" sublabel={`${params.vRms}V α=${params.firingAngle}°`} orientation="v" />
            </g>

            {/* Leg 1: T1 & D1 */}
            <g transform="translate(220, 60)" className={highlightClass('T1')} onClick={() => setSelectedComponentId('T1')}>
              <ScrSymbol id="T1" name="SCR T1" isConduction={showDeviceStates && t1.isConduction} isGated={t1.isGated} voltage={t1.voltage} current={t1.current} rotation={270} />
            </g>
            <path d="M 260 140 L 260 200" className="stroke-slate-600 stroke-2" />
            <circle cx="260" cy="170" r="3.5" className="fill-sky-400" />
            <g transform="translate(220, 200)" className={highlightClass('D1')} onClick={() => setSelectedComponentId('D1')}>
              <DiodeSymbol id="D1" name="Diode D1" isConduction={showDeviceStates && d1.isConduction} voltage={d1.voltage} current={d1.current} rotation={270} />
            </g>

            {/* Leg 2: T2 & D2 */}
            <g transform="translate(340, 60)" className={highlightClass('T2')} onClick={() => setSelectedComponentId('T2')}>
              <ScrSymbol id="T2" name="SCR T2" isConduction={showDeviceStates && t2.isConduction} isGated={t2.isGated} voltage={t2.voltage} current={t2.current} rotation={270} />
            </g>
            <path d="M 380 140 L 380 200" className="stroke-slate-600 stroke-2" />
            <circle cx="380" cy="170" r="3.5" className="fill-sky-400" />
            <g transform="translate(340, 200)" className={highlightClass('D2')} onClick={() => setSelectedComponentId('D2')}>
              <DiodeSymbol id="D2" name="Diode D2" isConduction={showDeviceStates && d2.isConduction} voltage={d2.voltage} current={d2.current} rotation={270} />
            </g>

            {/* AC Lines */}
            <path d="M 100 130 L 100 110 L 200 110 L 200 170 L 260 170" fill="none" className="stroke-slate-600 stroke-2" />
            <path d="M 100 210 L 100 230 L 160 230 L 160 250 L 320 250 L 320 170 L 380 170" fill="none" className="stroke-slate-600 stroke-2" />

            {/* Top and Bottom DC Rails */}
            <path d="M 260 60 L 380 60 L 580 60" className="stroke-slate-600 stroke-2" />
            <path d="M 260 280 L 380 280 L 580 280" className="stroke-slate-600 stroke-2" />
            <circle cx="260" cy="60" r="3.5" className="fill-amber-400" />
            <circle cx="380" cy="60" r="3.5" className="fill-amber-400" />
            <circle cx="260" cy="280" r="3.5" className="fill-slate-400" />
            <circle cx="380" cy="280" r="3.5" className="fill-slate-400" />

            {/* Freewheeling Diode */}
            {params.hasFreewheeling && (
              <FreewheelingBranch 
                x={480} 
                yTop={60} 
                yBot={280} 
                dfw={dfw} 
                showDeviceStates={showDeviceStates} 
                highlightClass={highlightClass} 
                onSelect={setSelectedComponentId} 
              />
            )}

            {/* DC Load Branch */}
            <LoadBranch
              x={580}
              yTop={60}
              yBot={280}
              loadType={params.loadType}
              rLoad={params.rLoad}
              lLoad={params.lLoad}
              eLoad={params.eLoad}
              highlightClass={highlightClass}
              onSelect={setSelectedComponentId}
            />

            {/* DYNAMIC CURRENT FLOW: T1 + D2 (Positive Half Cycle) */}
            <CurrentFlowPath
              d="M 100 130 L 100 110 L 200 110 L 200 170 L 260 170 L 260 60 L 580 60 L 580 280 L 380 280 L 380 170 L 320 170 L 320 250 L 160 250 L 160 230 L 100 230 L 100 210"
              active={isT1D2}
              color="emerald"
            />

            {/* DYNAMIC CURRENT FLOW: T2 + D1 (Negative Half Cycle) */}
            <CurrentFlowPath
              d="M 100 210 L 100 230 L 160 230 L 160 250 L 320 250 L 320 170 L 380 170 L 380 60 L 580 60 L 580 280 L 260 280 L 260 170 L 200 170 L 200 110 L 100 110 L 100 130"
              active={isT2D1}
              color="cyan"
            />

            {/* DYNAMIC CURRENT FLOW: Freewheeling Loop */}
            <CurrentFlowPath
              d="M 480 280 L 480 60 L 580 60 L 580 280 L 480 280"
              active={isFw}
              color="amber"
            />

            <circle cx="580" cy="45" r="4.5" className="fill-amber-400" />
            <text x="580" y="32" textAnchor="middle" className="text-[10px] font-mono fill-amber-400 font-bold">+ Vo</text>
          </svg>
        );
      }

      // ----------------------------------------------------
      // 6. Three Phase Half Wave Rectifier
      // ----------------------------------------------------
      case 'tp-half-wave': {
        const da = devices['Da'] || { isConduction: false, voltage: 0, current: 0 };
        const db = devices['Db'] || { isConduction: false, voltage: 0, current: 0 };
        const dc = devices['Dc'] || { isConduction: false, voltage: 0, current: 0 };

        return (
          <svg viewBox="0 0 860 380" className="w-full h-full max-h-[380px] select-none block" style={{ minHeight: '280px', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <SvgGlowFilters />
            {/* 3-Phase Sources */}
            <g transform="translate(40, 60)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <circle cx="20" cy="20" r="15" className="fill-red-950 stroke-red-500 stroke-2" />
              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-red-400 font-mono">Va</text>
            </g>
            <g transform="translate(40, 130)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <circle cx="20" cy="20" r="15" className="fill-amber-950 stroke-amber-500 stroke-2" />
              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-amber-400 font-mono">Vb</text>
            </g>
            <g transform="translate(40, 200)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <circle cx="20" cy="20" r="15" className="fill-blue-950 stroke-blue-500 stroke-2" />
              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-blue-400 font-mono">Vc</text>
            </g>
            <g transform="translate(40, 270)">
              <circle cx="20" cy="20" r="15" className="fill-slate-900 stroke-slate-500 stroke-2" />
              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-slate-300 font-mono">N</text>
            </g>

            {/* Base lines to diodes */}
            <path d="M 60 80 L 220 80" className="stroke-slate-600 stroke-2" />
            <path d="M 60 150 L 220 150" className="stroke-slate-600 stroke-2" />
            <path d="M 60 220 L 220 220" className="stroke-slate-600 stroke-2" />

            {/* Diodes */}
            <g transform="translate(220, 40)" className={highlightClass('Da')} onClick={() => setSelectedComponentId('Da')}>
              <DiodeSymbol id="Da" name="Diode Da" isConduction={showDeviceStates && da.isConduction} voltage={da.voltage} current={da.current} />
            </g>
            <g transform="translate(220, 110)" className={highlightClass('Db')} onClick={() => setSelectedComponentId('Db')}>
              <DiodeSymbol id="Db" name="Diode Db" isConduction={showDeviceStates && db.isConduction} voltage={db.voltage} current={db.current} />
            </g>
            <g transform="translate(220, 180)" className={highlightClass('Dc')} onClick={() => setSelectedComponentId('Dc')}>
              <DiodeSymbol id="Dc" name="Diode Dc" isConduction={showDeviceStates && dc.isConduction} voltage={dc.voltage} current={dc.current} />
            </g>

            {/* Common Cathode Bus */}
            <path d="M 300 80 L 400 80 L 400 120 L 580 120" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 300 150 L 400 150" className="stroke-slate-600 stroke-2" />
            <path d="M 300 220 L 400 220 L 400 120" className="stroke-slate-600 stroke-2 fill-none" />
            <circle cx="400" cy="80" r="3" className="fill-amber-400" />
            <circle cx="400" cy="150" r="3" className="fill-amber-400" />
            <circle cx="400" cy="220" r="3" className="fill-amber-400" />
            <circle cx="400" cy="120" r="3.5" className="fill-amber-400" />

            {/* Load at x = 580 */}
            <LoadBranch
              x={580}
              yTop={120}
              yBot={290}
              loadType={params.loadType}
              rLoad={params.rLoad}
              lLoad={params.lLoad}
              eLoad={params.eLoad}
              highlightClass={highlightClass}
              onSelect={setSelectedComponentId}
            />

            {/* Return to neutral */}
            <path d="M 580 290 L 60 290" className="stroke-slate-600 stroke-2 fill-none" />
            <circle cx="60" cy="290" r="3" className="fill-slate-300" />
            <circle cx="580" cy="290" r="3" className="fill-slate-300" />

            {/* DYNAMIC CURRENT STREAMS */}
            <CurrentFlowPath
              d="M 60 80 L 220 80 L 300 80 L 400 80 L 400 120 L 580 120 L 580 290 L 60 290"
              active={da.isConduction && isIoFlowing}
              color="emerald"
            />
            <CurrentFlowPath
              d="M 60 150 L 220 150 L 300 150 L 400 150 L 400 120 L 580 120 L 580 290 L 60 290"
              active={db.isConduction && isIoFlowing}
              color="amber"
            />
            <CurrentFlowPath
              d="M 60 220 L 220 220 L 300 220 L 400 220 L 400 120 L 580 120 L 580 290 L 60 290"
              active={dc.isConduction && isIoFlowing}
              color="cyan"
            />

            <circle cx="580" cy="100" r="4.5" className="fill-amber-400" />
            <text x="580" y="85" textAnchor="middle" className="text-[10px] font-mono fill-amber-400 font-bold">+ Vo</text>
          </svg>
        );
      }

      // ----------------------------------------------------
      // 7. Three Phase Six-Pulse Diode Bridge
      // ----------------------------------------------------
      case 'tp-six-pulse-diode': {
        const d1 = devices['D1']?.isConduction;
        const d3 = devices['D3']?.isConduction;
        const d5 = devices['D5']?.isConduction;
        const d4 = devices['D4']?.isConduction;
        const d6 = devices['D6']?.isConduction;
        const d2 = devices['D2']?.isConduction;

        return (
          <svg viewBox="0 0 860 380" className="w-full h-full max-h-[380px] select-none block" style={{ minHeight: '280px', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <SvgGlowFilters />
            {/* 3-Phase Sources */}
            <g transform="translate(40, 70)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <circle cx="20" cy="20" r="15" className="fill-red-950 stroke-red-500 stroke-2" />
              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-red-400 font-mono">Va</text>
            </g>
            <g transform="translate(40, 150)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <circle cx="20" cy="20" r="15" className="fill-amber-950 stroke-amber-500 stroke-2" />
              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-amber-400 font-mono">Vb</text>
            </g>
            <g transform="translate(40, 230)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <circle cx="20" cy="20" r="15" className="fill-blue-950 stroke-blue-500 stroke-2" />
              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-blue-400 font-mono">Vc</text>
            </g>

            {/* Leg A */}
            <g transform="translate(180, 60)" className={highlightClass('D1')} onClick={() => setSelectedComponentId('D1')}>
              <DiodeSymbol id="D1" name="D1 (Top A)" isConduction={showDeviceStates && d1} rotation={270} />
            </g>
            <path d="M 220 140 L 220 200" className="stroke-slate-600 stroke-2" />
            <circle cx="220" cy="170" r="3.5" className="fill-red-400" />
            <g transform="translate(180, 200)" className={highlightClass('D4')} onClick={() => setSelectedComponentId('D4')}>
              <DiodeSymbol id="D4" name="D4 (Bot A)" isConduction={showDeviceStates && d4} rotation={270} />
            </g>

            {/* Leg B */}
            <g transform="translate(300, 60)" className={highlightClass('D3')} onClick={() => setSelectedComponentId('D3')}>
              <DiodeSymbol id="D3" name="D3 (Top B)" isConduction={showDeviceStates && d3} rotation={270} />
            </g>
            <path d="M 340 140 L 340 200" className="stroke-slate-600 stroke-2" />
            <circle cx="340" cy="170" r="3.5" className="fill-amber-400" />
            <g transform="translate(300, 200)" className={highlightClass('D6')} onClick={() => setSelectedComponentId('D6')}>
              <DiodeSymbol id="D6" name="D6 (Bot B)" isConduction={showDeviceStates && d6} rotation={270} />
            </g>

            {/* Leg C */}
            <g transform="translate(420, 60)" className={highlightClass('D5')} onClick={() => setSelectedComponentId('D5')}>
              <DiodeSymbol id="D5" name="D5 (Top C)" isConduction={showDeviceStates && d5} rotation={270} />
            </g>
            <path d="M 460 140 L 460 200" className="stroke-slate-600 stroke-2" />
            <circle cx="460" cy="170" r="3.5" className="fill-blue-400" />
            <g transform="translate(420, 200)" className={highlightClass('D2')} onClick={() => setSelectedComponentId('D2')}>
              <DiodeSymbol id="D2" name="D2 (Bot C)" isConduction={showDeviceStates && d2} rotation={270} />
            </g>

            {/* Lines into midpoints */}
            <path d="M 60 90 L 170 90 L 170 170 L 220 170" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 60 170 L 340 170" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 60 250 L 150 250 L 150 260 L 410 260 L 410 170 L 460 170" className="stroke-slate-600 stroke-2 fill-none" />

            {/* DC rails */}
            <path d="M 220 60 L 460 60 L 640 60" className="stroke-slate-600 stroke-2" />
            <circle cx="220" cy="60" r="3.5" className="fill-amber-400" />
            <circle cx="340" cy="60" r="3.5" className="fill-amber-400" />
            <circle cx="460" cy="60" r="3.5" className="fill-amber-400" />

            <path d="M 220 280 L 460 280 L 640 280" className="stroke-slate-600 stroke-2" />
            <circle cx="220" cy="280" r="3.5" className="fill-slate-400" />
            <circle cx="340" cy="280" r="3.5" className="fill-slate-400" />
            <circle cx="460" cy="280" r="3.5" className="fill-slate-400" />

            {/* Load */}
            <LoadBranch
              x={640}
              yTop={60}
              yBot={280}
              loadType={params.loadType}
              rLoad={params.rLoad}
              lLoad={params.lLoad}
              eLoad={params.eLoad}
              highlightClass={highlightClass}
              onSelect={setSelectedComponentId}
            />

            {/* 3-PHASE ACTIVE CONDUCTION STREAMS */}
            {/* Phase A Top feeding into load */}
            <CurrentFlowPath
              d="M 60 90 L 170 90 L 170 170 L 220 170 L 220 60 L 640 60 L 640 280"
              active={d1 && isIoFlowing}
              color="emerald"
            />
            {/* Phase B Top feeding into load */}
            <CurrentFlowPath
              d="M 60 170 L 340 170 L 340 60 L 640 60 L 640 280"
              active={d3 && isIoFlowing}
              color="emerald"
            />
            {/* Phase C Top feeding into load */}
            <CurrentFlowPath
              d="M 60 250 L 150 250 L 150 260 L 410 260 L 410 170 L 460 170 L 460 60 L 640 60 L 640 280"
              active={d5 && isIoFlowing}
              color="emerald"
            />

            {/* Return streams from load bottom into return phase */}
            {/* Return to Phase A */}
            <CurrentFlowPath
              d="M 640 280 L 220 280 L 220 170 L 170 170 L 170 90 L 60 90"
              active={d4 && isIoFlowing}
              color="cyan"
            />
            {/* Return to Phase B */}
            <CurrentFlowPath
              d="M 640 280 L 340 280 L 340 170 L 60 170"
              active={d6 && isIoFlowing}
              color="cyan"
            />
            {/* Return to Phase C */}
            <CurrentFlowPath
              d="M 640 280 L 460 280 L 460 170 L 410 170 L 410 260 L 150 260 L 150 250 L 60 250"
              active={d2 && isIoFlowing}
              color="cyan"
            />

            <circle cx="640" cy="45" r="4.5" className="fill-amber-400" />
            <text x="640" y="32" textAnchor="middle" className="text-[10px] font-mono fill-amber-400 font-bold">+ Vo</text>
          </svg>
        );
      }

      // ----------------------------------------------------
      // 8. Three Phase Fully Controlled Bridge
      // ----------------------------------------------------
      case 'tp-full-controlled': {
        const t1 = devices['T1']?.isConduction;
        const t3 = devices['T3']?.isConduction;
        const t5 = devices['T5']?.isConduction;
        const t4 = devices['T4']?.isConduction;
        const t6 = devices['T6']?.isConduction;
        const t2 = devices['T2']?.isConduction;

        return (
          <svg viewBox="0 0 860 380" className="w-full h-full max-h-[380px] select-none block" style={{ minHeight: '280px', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <SvgGlowFilters />
            {/* 3-Phase Sources */}
            <g transform="translate(40, 70)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <circle cx="20" cy="20" r="15" className="fill-red-950 stroke-red-500 stroke-2" />
              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-red-400 font-mono">Va</text>
            </g>
            <g transform="translate(40, 150)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <circle cx="20" cy="20" r="15" className="fill-amber-950 stroke-amber-500 stroke-2" />
              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-amber-400 font-mono">Vb</text>
            </g>
            <g transform="translate(40, 230)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <circle cx="20" cy="20" r="15" className="fill-blue-950 stroke-blue-500 stroke-2" />
              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-blue-400 font-mono">Vc</text>
            </g>

            {/* Leg A: T1 & T4 */}
            <g transform="translate(180, 60)" className={highlightClass('T1')} onClick={() => setSelectedComponentId('T1')}>
              <ScrSymbol id="T1" name="T1 [1]" isConduction={showDeviceStates && t1} isGated={devices['T1']?.isGated} rotation={270} />
            </g>
            <path d="M 220 140 L 220 200" className="stroke-slate-600 stroke-2" />
            <circle cx="220" cy="170" r="3.5" className="fill-red-400" />
            <g transform="translate(180, 200)" className={highlightClass('T4')} onClick={() => setSelectedComponentId('T4')}>
              <ScrSymbol id="T4" name="T4 [4]" isConduction={showDeviceStates && t4} isGated={devices['T4']?.isGated} rotation={270} />
            </g>

            {/* Leg B: T3 & T6 */}
            <g transform="translate(300, 60)" className={highlightClass('T3')} onClick={() => setSelectedComponentId('T3')}>
              <ScrSymbol id="T3" name="T3 [3]" isConduction={showDeviceStates && t3} isGated={devices['T3']?.isGated} rotation={270} />
            </g>
            <path d="M 340 140 L 340 200" className="stroke-slate-600 stroke-2" />
            <circle cx="340" cy="170" r="3.5" className="fill-amber-400" />
            <g transform="translate(300, 200)" className={highlightClass('T6')} onClick={() => setSelectedComponentId('T6')}>
              <ScrSymbol id="T6" name="T6 [6]" isConduction={showDeviceStates && t6} isGated={devices['T6']?.isGated} rotation={270} />
            </g>

            {/* Leg C: T5 & T2 */}
            <g transform="translate(420, 60)" className={highlightClass('T5')} onClick={() => setSelectedComponentId('T5')}>
              <ScrSymbol id="T5" name="T5 [5]" isConduction={showDeviceStates && t5} isGated={devices['T5']?.isGated} rotation={270} />
            </g>
            <path d="M 460 140 L 460 200" className="stroke-slate-600 stroke-2" />
            <circle cx="460" cy="170" r="3.5" className="fill-blue-400" />
            <g transform="translate(420, 200)" className={highlightClass('T2')} onClick={() => setSelectedComponentId('T2')}>
              <ScrSymbol id="T2" name="T2 [2]" isConduction={showDeviceStates && t2} isGated={devices['T2']?.isGated} rotation={270} />
            </g>

            {/* Lines into midpoints */}
            <path d="M 60 90 L 170 90 L 170 170 L 220 170" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 60 170 L 340 170" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 60 250 L 150 250 L 150 260 L 410 260 L 410 170 L 460 170" className="stroke-slate-600 stroke-2 fill-none" />

            {/* DC rails */}
            <path d="M 220 60 L 460 60 L 640 60" className="stroke-slate-600 stroke-2" />
            <circle cx="220" cy="60" r="3.5" className="fill-amber-400" />
            <circle cx="340" cy="60" r="3.5" className="fill-amber-400" />
            <circle cx="460" cy="60" r="3.5" className="fill-amber-400" />

            <path d="M 220 280 L 460 280 L 640 280" className="stroke-slate-600 stroke-2" />
            <circle cx="220" cy="280" r="3.5" className="fill-slate-400" />
            <circle cx="340" cy="280" r="3.5" className="fill-slate-400" />
            <circle cx="460" cy="280" r="3.5" className="fill-slate-400" />

            {/* Load */}
            <LoadBranch
              x={640}
              yTop={60}
              yBot={280}
              loadType={params.loadType}
              rLoad={params.rLoad}
              lLoad={params.lLoad}
              eLoad={params.eLoad}
              highlightClass={highlightClass}
              onSelect={setSelectedComponentId}
            />

            {/* 3-PHASE ACTIVE CONDUCTION STREAMS */}
            <CurrentFlowPath
              d="M 60 90 L 170 90 L 170 170 L 220 170 L 220 60 L 640 60 L 640 280"
              active={t1 && isIoFlowing}
              color="emerald"
            />
            <CurrentFlowPath
              d="M 60 170 L 340 170 L 340 60 L 640 60 L 640 280"
              active={t3 && isIoFlowing}
              color="emerald"
            />
            <CurrentFlowPath
              d="M 60 250 L 150 250 L 150 260 L 410 260 L 410 170 L 460 170 L 460 60 L 640 60 L 640 280"
              active={t5 && isIoFlowing}
              color="emerald"
            />

            {/* Return streams */}
            <CurrentFlowPath
              d="M 640 280 L 220 280 L 220 170 L 170 170 L 170 90 L 60 90"
              active={t4 && isIoFlowing}
              color="cyan"
            />
            <CurrentFlowPath
              d="M 640 280 L 340 280 L 340 170 L 60 170"
              active={t6 && isIoFlowing}
              color="cyan"
            />
            <CurrentFlowPath
              d="M 640 280 L 460 280 L 460 170 L 410 170 L 410 260 L 150 260 L 150 250 L 60 250"
              active={t2 && isIoFlowing}
              color="cyan"
            />

            <circle cx="640" cy="45" r="4.5" className="fill-amber-400" />
            <text x="640" y="32" textAnchor="middle" className="text-[10px] font-mono fill-amber-400 font-bold">+ Vo</text>
          </svg>
        );
      }

      // ----------------------------------------------------
      // 9. Three Phase Semi-Controlled Bridge
      // ----------------------------------------------------
      case 'tp-semi-controlled': {
        const t1 = devices['T1']?.isConduction;
        const t3 = devices['T3']?.isConduction;
        const t5 = devices['T5']?.isConduction;
        const d4 = devices['D4']?.isConduction;
        const d6 = devices['D6']?.isConduction;
        const d2 = devices['D2']?.isConduction;
        const dfw = devices['DFW'] || { isConduction: false, voltage: 0, current: 0 };

        return (
          <svg viewBox="0 0 860 380" className="w-full h-full max-h-[380px] select-none block" style={{ minHeight: '280px', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <SvgGlowFilters />
            {/* 3-Phase Sources */}
            <g transform="translate(40, 70)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <circle cx="20" cy="20" r="15" className="fill-red-950 stroke-red-500 stroke-2" />
              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-red-400 font-mono">Va</text>
            </g>
            <g transform="translate(40, 150)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <circle cx="20" cy="20" r="15" className="fill-amber-950 stroke-amber-500 stroke-2" />
              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-amber-400 font-mono">Vb</text>
            </g>
            <g transform="translate(40, 230)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <circle cx="20" cy="20" r="15" className="fill-blue-950 stroke-blue-500 stroke-2" />
              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-blue-400 font-mono">Vc</text>
            </g>

            {/* Leg A: Top SCR T1, Bot Diode D4 */}
            <g transform="translate(180, 60)" className={highlightClass('T1')} onClick={() => setSelectedComponentId('T1')}>
              <ScrSymbol id="T1" name="T1 (SCR)" isConduction={showDeviceStates && t1} rotation={270} />
            </g>
            <path d="M 220 140 L 220 200" className="stroke-slate-600 stroke-2" />
            <circle cx="220" cy="170" r="3.5" className="fill-red-400" />
            <g transform="translate(180, 200)" className={highlightClass('D4')} onClick={() => setSelectedComponentId('D4')}>
              <DiodeSymbol id="D4" name="D4 (Diode)" isConduction={showDeviceStates && d4} rotation={270} />
            </g>

            {/* Leg B: Top SCR T3, Bot Diode D6 */}
            <g transform="translate(300, 60)" className={highlightClass('T3')} onClick={() => setSelectedComponentId('T3')}>
              <ScrSymbol id="T3" name="T3 (SCR)" isConduction={showDeviceStates && t3} rotation={270} />
            </g>
            <path d="M 340 140 L 340 200" className="stroke-slate-600 stroke-2" />
            <circle cx="340" cy="170" r="3.5" className="fill-amber-400" />
            <g transform="translate(300, 200)" className={highlightClass('D6')} onClick={() => setSelectedComponentId('D6')}>
              <DiodeSymbol id="D6" name="D6 (Diode)" isConduction={showDeviceStates && d6} rotation={270} />
            </g>

            {/* Leg C: Top SCR T5, Bot Diode D2 */}
            <g transform="translate(420, 60)" className={highlightClass('T5')} onClick={() => setSelectedComponentId('T5')}>
              <ScrSymbol id="T5" name="T5 (SCR)" isConduction={showDeviceStates && t5} rotation={270} />
            </g>
            <path d="M 460 140 L 460 200" className="stroke-slate-600 stroke-2" />
            <circle cx="460" cy="170" r="3.5" className="fill-blue-400" />
            <g transform="translate(420, 200)" className={highlightClass('D2')} onClick={() => setSelectedComponentId('D2')}>
              <DiodeSymbol id="D2" name="D2 (Diode)" isConduction={showDeviceStates && d2} rotation={270} />
            </g>

            {/* Midpoints */}
            <path d="M 60 90 L 170 90 L 170 170 L 220 170" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 60 170 L 340 170" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 60 250 L 150 250 L 150 260 L 410 260 L 410 170 L 460 170" className="stroke-slate-600 stroke-2 fill-none" />

            {/* DC rails */}
            <path d="M 220 60 L 460 60 L 640 60" className="stroke-slate-600 stroke-2" />
            <circle cx="220" cy="60" r="3.5" className="fill-amber-400" />
            <circle cx="340" cy="60" r="3.5" className="fill-amber-400" />
            <circle cx="460" cy="60" r="3.5" className="fill-amber-400" />

            <path d="M 220 280 L 460 280 L 640 280" className="stroke-slate-600 stroke-2" />
            <circle cx="220" cy="280" r="3.5" className="fill-slate-400" />
            <circle cx="340" cy="280" r="3.5" className="fill-slate-400" />
            <circle cx="460" cy="280" r="3.5" className="fill-slate-400" />

            {/* Freewheeling Diode */}
            {params.hasFreewheeling && (
              <FreewheelingBranch 
                x={540} 
                yTop={60} 
                yBot={280} 
                dfw={dfw} 
                showDeviceStates={showDeviceStates} 
                highlightClass={highlightClass} 
                onSelect={setSelectedComponentId} 
              />
            )}

            {/* Load */}
            <LoadBranch
              x={640}
              yTop={60}
              yBot={280}
              loadType={params.loadType}
              rLoad={params.rLoad}
              lLoad={params.lLoad}
              eLoad={params.eLoad}
              highlightClass={highlightClass}
              onSelect={setSelectedComponentId}
            />

            {/* Flow paths */}
            <CurrentFlowPath
              d="M 60 90 L 170 90 L 170 170 L 220 170 L 220 60 L 640 60 L 640 280"
              active={t1 && isIoFlowing}
              color="emerald"
            />
            <CurrentFlowPath
              d="M 60 170 L 340 170 L 340 60 L 640 60 L 640 280"
              active={t3 && isIoFlowing}
              color="emerald"
            />
            <CurrentFlowPath
              d="M 60 250 L 150 250 L 150 260 L 410 260 L 410 170 L 460 170 L 460 60 L 640 60 L 640 280"
              active={t5 && isIoFlowing}
              color="emerald"
            />
            <CurrentFlowPath
              d="M 640 280 L 220 280 L 220 170 L 170 170 L 170 90 L 60 90"
              active={d4 && isIoFlowing}
              color="cyan"
            />
            <CurrentFlowPath
              d="M 640 280 L 340 280 L 340 170 L 60 170"
              active={d6 && isIoFlowing}
              color="cyan"
            />
            <CurrentFlowPath
              d="M 640 280 L 460 280 L 460 170 L 410 170 L 410 260 L 150 260 L 150 250 L 60 250"
              active={d2 && isIoFlowing}
              color="cyan"
            />

            <circle cx="640" cy="45" r="4.5" className="fill-amber-400" />
            <text x="640" y="32" textAnchor="middle" className="text-[10px] font-mono fill-amber-400 font-bold">+ Vo</text>
          </svg>
        );
      }

      // ----------------------------------------------------
      // 10. Single Phase TCR / AC Voltage Controller
      // ----------------------------------------------------
      case 'sp-tcr': {
        const t1 = devices['T1'] || { isConduction: false, voltage: 0, current: 0 };
        const t2 = devices['T2'] || { isConduction: false, voltage: 0, current: 0 };
        const isFwd = t1.isConduction && isIoFlowing;
        const isRev = t2.isConduction && isIoFlowing;

        return (
          <svg viewBox="0 0 860 380" className="w-full h-full max-h-[380px] select-none block" style={{ minHeight: '280px', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <SvgGlowFilters />
            {/* AC Supply */}
            <g transform="translate(80, 130)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <AcSourceSymbol label="AC Supply" sublabel={`${params.vRms}V 50Hz`} orientation="v" />
            </g>

            {/* Base wires */}
            <path d="M 120 130 L 120 110 L 220 110" className="stroke-slate-600 stroke-2" />
            <path d="M 220 110 L 240 110 L 240 70 L 260 70" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 220 110 L 240 110 L 240 150 L 260 150" className="stroke-slate-600 stroke-2 fill-none" />
            <circle cx="240" cy="110" r="3.5" className="fill-sky-400" />

            {/* Forward T1 */}
            <g transform="translate(260, 30)" className={highlightClass('T1')} onClick={() => setSelectedComponentId('T1')}>
              <ScrSymbol id="T1" name="T1 (Fwd)" isConduction={showDeviceStates && t1.isConduction} isGated={t1.isGated} voltage={t1.voltage} current={t1.current} rotation={0} />
            </g>

            {/* Reverse T2 */}
            <g transform="translate(260, 110)" className={highlightClass('T2')} onClick={() => setSelectedComponentId('T2')}>
              <ScrSymbol id="T2" name="T2 (Rev)" isConduction={showDeviceStates && t2.isConduction} isGated={t2.isGated} voltage={t2.voltage} current={t2.current} rotation={180} />
            </g>

            {/* Rejoin */}
            <path d="M 340 70 L 360 70 L 360 110 L 400 110" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 340 150 L 360 150 L 360 110" className="stroke-slate-600 stroke-2 fill-none" />
            <circle cx="360" cy="110" r="3.5" className="fill-emerald-400" />

            {/* Series Reactor + Resistor */}
            <g transform="translate(400, 70)" className={highlightClass('load-l')} onClick={() => setSelectedComponentId('load-l')}>
              <InductorSymbol value={`${params.lLoad}mH`} orientation="h" />
            </g>
            <g transform="translate(480, 70)" className={highlightClass('load-r')} onClick={() => setSelectedComponentId('load-r')}>
              <ResistorSymbol value={`${params.rLoad}Ω`} orientation="h" />
            </g>

            {/* Return Path */}
            <path d="M 560 110 L 620 110 L 620 260 L 120 260 L 120 210" className="stroke-slate-600 stroke-2 fill-none" />
            <circle cx="560" cy="110" r="3.5" className="fill-amber-400" />
            <text x="560" y="95" textAnchor="middle" className="text-[10px] font-mono fill-amber-400 font-bold">Vo (+)</text>

            {/* DYNAMIC FORWARD LOOP (T1) */}
            <CurrentFlowPath
              d="M 120 130 L 120 110 L 240 110 L 240 70 L 340 70 L 360 70 L 360 110 L 400 110 L 560 110 L 620 110 L 620 260 L 120 260 L 120 210"
              active={isFwd}
              color="emerald"
            />

            {/* DYNAMIC REVERSE LOOP (T2) */}
            <CurrentFlowPath
              d="M 120 210 L 120 260 L 620 260 L 620 110 L 560 110 L 400 110 L 360 110 L 360 150 L 240 150 L 240 110 L 120 110 L 120 130"
              active={isRev}
              color="cyan"
            />
          </svg>
        );
      }

      // ----------------------------------------------------
      // 11. Three Phase TCR / AC Voltage Controller
      // ----------------------------------------------------
      case 'tp-tcr': {
        const tA = devices['T1A']?.isConduction && isIoFlowing;
        const tB = devices['T1B']?.isConduction && isIoFlowing;
        const tC = devices['T1C']?.isConduction && isIoFlowing;

        return (
          <svg viewBox="0 0 860 380" className="w-full h-full max-h-[380px] select-none block" style={{ minHeight: '280px', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <SvgGlowFilters />
            {/* 3-Phase Sources */}
            <g transform="translate(40, 70)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <circle cx="20" cy="20" r="15" className="fill-red-950 stroke-red-500 stroke-2" />
              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-red-400 font-mono">Va</text>
            </g>
            <g transform="translate(40, 150)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <circle cx="20" cy="20" r="15" className="fill-amber-950 stroke-amber-500 stroke-2" />
              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-amber-400 font-mono">Vb</text>
            </g>
            <g transform="translate(40, 230)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <circle cx="20" cy="20" r="15" className="fill-blue-950 stroke-blue-500 stroke-2" />
              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-blue-400 font-mono">Vc</text>
            </g>

            {/* Phase A */}
            <path d="M 60 90 L 160 90" className="stroke-slate-600 stroke-2" />
            <g transform="translate(160, 50)" className={highlightClass('T1A')} onClick={() => setSelectedComponentId('T1A')}>
              <ScrSymbol id="T1A" name="TCR A" isConduction={showDeviceStates && devices['T1A']?.isConduction} rotation={0} />
            </g>
            <path d="M 240 90 L 280 90" className="stroke-slate-600 stroke-2" />
            <g transform="translate(280, 50)">
              <InductorSymbol value={`${params.lLoad}mH`} orientation="h" />
            </g>
            <g transform="translate(360, 50)" className={highlightClass('load-r')} onClick={() => setSelectedComponentId('load-r')}>
              <ResistorSymbol value={`${params.rLoad}Ω`} orientation="h" />
            </g>
            <path d="M 440 90 L 520 90 L 520 170" className="stroke-slate-600 stroke-2 fill-none" />

            {/* Phase B */}
            <path d="M 60 170 L 160 170" className="stroke-slate-600 stroke-2" />
            <g transform="translate(160, 130)" className={highlightClass('T1B')} onClick={() => setSelectedComponentId('T1B')}>
              <ScrSymbol id="T1B" name="TCR B" isConduction={showDeviceStates && devices['T1B']?.isConduction} rotation={0} />
            </g>
            <path d="M 240 170 L 280 170" className="stroke-slate-600 stroke-2" />
            <g transform="translate(280, 130)">
              <InductorSymbol value={`${params.lLoad}mH`} orientation="h" />
            </g>
            <g transform="translate(360, 130)" className={highlightClass('load-r')} onClick={() => setSelectedComponentId('load-r')}>
              <ResistorSymbol value={`${params.rLoad}Ω`} orientation="h" />
            </g>
            <path d="M 440 170 L 520 170" className="stroke-slate-600 stroke-2" />

            {/* Phase C */}
            <path d="M 60 250 L 160 250" className="stroke-slate-600 stroke-2" />
            <g transform="translate(160, 210)" className={highlightClass('T1C')} onClick={() => setSelectedComponentId('T1C')}>
              <ScrSymbol id="T1C" name="TCR C" isConduction={showDeviceStates && devices['T1C']?.isConduction} rotation={0} />
            </g>
            <path d="M 240 250 L 280 250" className="stroke-slate-600 stroke-2" />
            <g transform="translate(280, 210)">
              <InductorSymbol value={`${params.lLoad}mH`} orientation="h" />
            </g>
            <g transform="translate(360, 210)" className={highlightClass('load-r')} onClick={() => setSelectedComponentId('load-r')}>
              <ResistorSymbol value={`${params.rLoad}Ω`} orientation="h" />
            </g>
            <path d="M 440 250 L 520 250 L 520 170" className="stroke-slate-600 stroke-2 fill-none" />

            <circle cx="520" cy="170" r="4" className="fill-slate-200" />
            <text x="545" y="174" className="text-[11px] font-mono fill-slate-300 font-bold">Neutral Star (N)</text>

            {/* FLOW STREAMS */}
            <CurrentFlowPath
              d="M 60 90 L 240 90 L 440 90 L 520 90 L 520 170"
              active={tA}
              color="emerald"
            />
            <CurrentFlowPath
              d="M 60 170 L 240 170 L 440 170 L 520 170"
              active={tB}
              color="amber"
            />
            <CurrentFlowPath
              d="M 60 250 L 240 250 L 440 250 L 520 250 L 520 170"
              active={tC}
              color="cyan"
            />
          </svg>
        );
      }

      // ----------------------------------------------------
      // 12. Single Phase Dual Converter
      // ----------------------------------------------------
      case 'sp-dual-converter': {
        const b1t1 = devices['B1_T1'] || { isConduction: false, voltage: 0, current: 0 };
        const b2t1 = devices['B2_T1'] || { isConduction: false, voltage: 0, current: 0 };
        const isPosDrive = (b1t1.isConduction || sample.io > 0.05) && isIoFlowing;
        const isNegDrive = (b2t1.isConduction || sample.io < -0.05) && isIoFlowing;

        return (
          <svg viewBox="0 0 860 380" className="w-full h-full max-h-[380px] select-none block" style={{ minHeight: '280px', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <SvgGlowFilters />
            {/* Input AC Supply */}
            <g transform="translate(40, 130)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <AcSourceSymbol label="AC Supply" sublabel={`${params.vRms}V 50Hz`} orientation="v" />
            </g>

            {/* Feeds */}
            <path d="M 80 130 L 80 80 L 180 80" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 80 210 L 80 260 L 180 260" className="stroke-slate-600 stroke-2 fill-none" />

            {/* BRIDGE 1 */}
            <g transform="translate(180, 30)">
              <rect x="0" y="0" width="180" height="95" rx="6" className={`fill-slate-900/90 stroke-2 ${b1t1.isConduction ? 'stroke-sky-400 shadow-md shadow-sky-400/20' : 'stroke-slate-700'}`} />
              <text x="90" y="22" textAnchor="middle" className="text-[11px] font-mono font-bold fill-sky-300">CONVERTER 1 (+Io)</text>
              <text x="90" y="40" textAnchor="middle" className="text-[9px] font-mono fill-slate-400">SCRs T1, T2, T3, T4</text>
              <text x="90" y="58" textAnchor="middle" className="text-[9px] font-mono fill-amber-400">α₁ = {params.firingAngle}°</text>
              <text x="90" y="78" textAnchor="middle" className={`text-[10px] font-mono font-bold ${b1t1.isConduction ? 'fill-emerald-400' : 'fill-slate-500'}`}>
                {b1t1.isConduction ? '● CONDUCTING (+Io)' : '○ STANDBY'}
              </text>
            </g>

            {/* BRIDGE 2 */}
            <g transform="translate(180, 210)">
              <rect x="0" y="0" width="180" height="95" rx="6" className={`fill-slate-900/90 stroke-2 ${b2t1.isConduction ? 'stroke-purple-400 shadow-md shadow-purple-400/20' : 'stroke-slate-700'}`} />
              <text x="90" y="22" textAnchor="middle" className="text-[11px] font-mono font-bold fill-purple-300">CONVERTER 2 (-Io)</text>
              <text x="90" y="40" textAnchor="middle" className="text-[9px] font-mono fill-slate-400">SCRs T1&apos;, T2&apos;, T3&apos;, T4&apos;</text>
              <text x="90" y="58" textAnchor="middle" className="text-[9px] font-mono fill-amber-400">α₂ = {params.firingAngle2 || (180 - params.firingAngle)}°</text>
              <text x="90" y="78" textAnchor="middle" className={`text-[10px] font-mono font-bold ${b2t1.isConduction ? 'fill-emerald-400' : 'fill-slate-500'}`}>
                {b2t1.isConduction ? '● CONDUCTING (-Io)' : '○ STANDBY'}
              </text>
            </g>

            {/* Circulating Reactor Lr */}
            <path d="M 360 80 L 440 80 L 440 120" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 360 260 L 440 260 L 440 200" className="stroke-slate-600 stroke-2 fill-none" />
            <g transform="translate(400, 120)">
              <InductorSymbol value="Lr Reactor" orientation="v" />
            </g>

            {/* Center Tap to Load */}
            <path d="M 440 160 L 580 160 L 580 80" className="stroke-slate-600 stroke-2 fill-none" />
            <circle cx="440" cy="160" r="4" className="fill-amber-400" />

            {/* DC Machine Load */}
            <LoadBranch
              x={580}
              yTop={80}
              yBot={280}
              loadType="RLE"
              rLoad={params.rLoad}
              lLoad={params.lLoad}
              eLoad={params.eLoad}
              highlightClass={highlightClass}
              onSelect={setSelectedComponentId}
            />

            {/* Common negative return */}
            <path d="M 580 280 L 500 280 L 500 320 L 360 320 L 360 290" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 500 320 L 500 15 L 360 15 L 360 45" className="stroke-slate-600 stroke-2 fill-none" />
            <circle cx="580" cy="280" r="3.5" className="fill-slate-400" />

            {/* DYNAMIC FORWARD MOTORING LOOP (Converter 1) */}
            <CurrentFlowPath
              d="M 80 130 L 80 80 L 180 80 L 360 80 L 440 80 L 440 160 L 580 160 L 580 280 L 500 280 L 500 15 L 360 15 L 360 45 L 180 45 L 80 80 L 80 130"
              active={isPosDrive}
              color="emerald"
            />

            {/* DYNAMIC REVERSE BRAKING/MOTORING LOOP (Converter 2) */}
            <CurrentFlowPath
              d="M 80 210 L 80 260 L 180 260 L 360 260 L 440 260 L 440 160 L 580 160 L 580 280 L 500 280 L 500 320 L 360 320 L 360 290 L 180 290 L 80 260 L 80 210"
              active={isNegDrive}
              color="cyan"
            />

            <circle cx="580" cy="65" r="4.5" className="fill-amber-400" />
            <text x="580" y="50" textAnchor="middle" className="text-[10px] font-mono fill-amber-400 font-bold">± Vo (4-Quadrant)</text>
          </svg>
        );
      }

      // ----------------------------------------------------
      // 13. Three Phase Dual Converter
      // ----------------------------------------------------
      case 'tp-dual-converter': {
        const isPosDrive = sample.io > 0.05 && isIoFlowing;
        const isNegDrive = sample.io < -0.05 && isIoFlowing;

        return (
          <svg viewBox="0 0 860 380" className="w-full h-full max-h-[380px] select-none block" style={{ minHeight: '280px', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            <SvgGlowFilters />
            {/* 3-Phase Source Box */}
            <g transform="translate(40, 120)" className={highlightClass('source')} onClick={() => setSelectedComponentId('source')}>
              <rect x="0" y="0" width="80" height="105" rx="6" className="fill-slate-900 border stroke-sky-500 stroke-2" />
              <text x="40" y="24" textAnchor="middle" className="text-[10px] font-mono font-bold fill-sky-300">3-Phase AC</text>
              <text x="40" y="46" textAnchor="middle" className="text-[10px] font-mono fill-red-400">Va: 230V</text>
              <text x="40" y="68" textAnchor="middle" className="text-[10px] font-mono fill-amber-400">Vb: 230V</text>
              <text x="40" y="90" textAnchor="middle" className="text-[10px] font-mono fill-blue-400">Vc: 230V</text>
            </g>

            {/* Feeds */}
            <path d="M 120 150 L 160 150 L 160 85 L 200 85" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 160 150 L 160 255 L 200 255" className="stroke-slate-600 stroke-2 fill-none" />

            {/* Positive Converter */}
            <g transform="translate(200, 35)" className={highlightClass('PosBridge')} onClick={() => setSelectedComponentId('PosBridge')}>
              <rect x="0" y="0" width="180" height="95" rx="6" className="fill-slate-900/90 stroke-2 stroke-sky-400 shadow-md shadow-sky-400/20" />
              <text x="90" y="22" textAnchor="middle" className="text-[11px] font-mono font-bold fill-sky-300">POSITIVE 6-PULSE BRIDGE</text>
              <text x="90" y="40" textAnchor="middle" className="text-[9px] font-mono fill-slate-400">6 SCRs (T1-T6)</text>
              <text x="90" y="58" textAnchor="middle" className="text-[9px] font-mono fill-amber-400">α₁ = {params.firingAngle}°</text>
              <text x="90" y="78" textAnchor="middle" className="text-[10px] font-mono font-bold fill-emerald-400">QUADRANT I / IV</text>
            </g>

            {/* Negative Converter */}
            <g transform="translate(200, 210)" className={highlightClass('NegBridge')} onClick={() => setSelectedComponentId('NegBridge')}>
              <rect x="0" y="0" width="180" height="95" rx="6" className="fill-slate-900/90 stroke-2 stroke-purple-400 shadow-md shadow-purple-400/20" />
              <text x="90" y="22" textAnchor="middle" className="text-[11px] font-mono font-bold fill-purple-300">NEGATIVE 6-PULSE BRIDGE</text>
              <text x="90" y="40" textAnchor="middle" className="text-[9px] font-mono fill-slate-400">6 SCRs (T1&apos;-T6&apos;)</text>
              <text x="90" y="58" textAnchor="middle" className="text-[9px] font-mono fill-amber-400">α₂ = {params.firingAngle2 || (180 - params.firingAngle)}°</text>
              <text x="90" y="78" textAnchor="middle" className="text-[10px] font-mono font-bold fill-purple-400">QUADRANT II / III</text>
            </g>

            {/* Circulating Reactor */}
            <path d="M 380 85 L 460 85 L 460 125" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 380 255 L 460 255 L 460 205" className="stroke-slate-600 stroke-2 fill-none" />
            <g transform="translate(420, 125)">
              <InductorSymbol value="Lr Reactor" orientation="v" />
            </g>

            {/* Load from Center Tap */}
            <path d="M 460 165 L 580 165 L 580 80" className="stroke-slate-600 stroke-2 fill-none" />
            <circle cx="460" cy="165" r="4" className="fill-amber-400" />

            {/* DC Machine Load */}
            <LoadBranch
              x={580}
              yTop={80}
              yBot={280}
              loadType="RLE"
              rLoad={params.rLoad}
              lLoad={params.lLoad}
              eLoad={params.eLoad}
              highlightClass={highlightClass}
              onSelect={setSelectedComponentId}
            />

            {/* Return bus */}
            <path d="M 580 280 L 500 280 L 500 320 L 380 320 L 380 290" className="stroke-slate-600 stroke-2 fill-none" />
            <path d="M 500 320 L 500 15 L 380 15 L 380 45" className="stroke-slate-600 stroke-2 fill-none" />

            {/* FLOW STREAMS */}
            <CurrentFlowPath
              d="M 120 150 L 160 150 L 160 85 L 200 85 L 380 85 L 460 85 L 460 165 L 580 165 L 580 280 L 500 280 L 500 15 L 380 15 L 380 45 L 200 45 L 160 85 L 120 150"
              active={isPosDrive}
              color="emerald"
            />
            <CurrentFlowPath
              d="M 120 150 L 160 150 L 160 255 L 200 255 L 380 255 L 460 255 L 460 165 L 580 165 L 580 280 L 500 280 L 500 320 L 380 320 L 380 290 L 200 290 L 160 255 L 120 150"
              active={isNegDrive}
              color="cyan"
            />

            <circle cx="580" cy="65" r="4.5" className="fill-amber-400" />
            <text x="580" y="50" textAnchor="middle" className="text-[10px] font-mono fill-amber-400 font-bold">± Vo (Heavy Motor Drive)</text>
          </svg>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 border border-slate-800 rounded-lg overflow-hidden">
      {/* Top Schematic Control Toolbar with Component Dropdown */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/90 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200 font-mono flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-sky-400" />
            Schematic
          </span>
          <span className="text-slate-500 font-mono">·</span>

          {/* CIRCUIT COMPONENT DROPDOWN */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded px-2 py-0.5">
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 text-[10px] uppercase font-bold font-mono">Component:</span>
            <select
              value={selectedComponentId || ''}
              onChange={(e) => setSelectedComponentId(e.target.value || null)}
              className="bg-transparent text-slate-200 font-mono text-[11px] font-medium focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-400">All Components</option>
              {componentsList.map(comp => (
                <option key={comp.id} value={comp.id} className="bg-slate-900 text-slate-200">
                  {comp.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Options & Playback Controls */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={showDeviceStates}
              onChange={(e) => setShowDeviceStates(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 focus:ring-offset-0"
            />
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>Device States</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={showCurrentAnimation}
              onChange={(e) => setShowCurrentAnimation(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0"
            />
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Current Flow Paths</span>
          </label>

          <div className="h-4 w-px bg-slate-700" />

          {/* Stepper Buttons & Animation Playback */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded border border-slate-700">
            <button
              onClick={stepBackward}
              title="Step backward"
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={togglePlayPause}
              title={isRunning ? 'Pause animation' : 'Run live animation'}
              className={`p-1 rounded transition ${
                isRunning 
                  ? 'text-amber-400 hover:text-amber-300 bg-amber-500/20' 
                  : 'text-sky-400 hover:text-sky-300 hover:bg-slate-700'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={stepForward}
              title="Step forward"
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-800/80 rounded border border-slate-700 p-0.5 text-[10px] font-mono">
            <button
              onClick={() => setSimSpeed(0.5)}
              className={`px-1.5 py-0.5 rounded transition ${simSpeed === 0.5 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              0.5x
            </button>
            <button
              onClick={() => setSimSpeed(1)}
              className={`px-1.5 py-0.5 rounded transition ${simSpeed === 1 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              1x
            </button>
            <button
              onClick={() => setSimSpeed(2)}
              className={`px-1.5 py-0.5 rounded transition ${simSpeed === 2 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              2x
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomLevel(z => Math.max(0.7, z - 0.1))}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.1))}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Schematic Canvas with Dot Matrix Background */}
      <div 
        className="relative flex-1 min-h-[300px] w-full flex items-center justify-center p-2 overflow-hidden bg-[#0b1120]"
        style={{
          backgroundImage: 'radial-gradient(#334155 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px'
        }}
      >
        <div
          className="w-full h-full min-h-[280px] flex items-center justify-center transition-transform duration-100"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {renderCircuitGraphic()}
        </div>

        {/* COMPONENT INSPECTOR HUD CARD */}
        {selectedInfo && (
          <div className="absolute top-3 left-3 bg-slate-900/95 backdrop-blur-md border border-amber-500/50 rounded-lg p-3 shadow-2xl max-w-xs font-mono text-xs z-20 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                {selectedInfo.name}
              </span>
              <button
                onClick={() => setSelectedComponentId(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">State</span>
                <span className="font-bold text-emerald-400">{selectedInfo.state}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Voltage Drop</span>
                <span className="font-bold text-sky-400">{selectedInfo.voltage}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Current</span>
                <span className="font-bold text-amber-400">{selectedInfo.current}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Type</span>
                <span className="text-slate-300">{selectedInfo.type}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 leading-tight">
              {selectedInfo.detail}
            </div>
          </div>
        )}

        {/* Status / Animation Indicator */}
        <div className="absolute bottom-2 left-3 flex items-center gap-3 bg-slate-900/90 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded text-[10px] font-mono text-slate-400 shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span>ON (Conducting)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span>OFF (Blocking)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Gate Trigger</span>
          </div>
          {isRunning && (
            <div className="flex items-center gap-1 text-emerald-400 font-bold ml-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE ANIMATION ({simSpeed}x)</span>
            </div>
          )}
        </div>

        {/* Instantaneous Values Tag */}
        <div className="absolute bottom-2 right-3 bg-slate-900/90 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded text-[10px] font-mono shadow-lg text-slate-300 flex items-center gap-3">
          <span>
            <strong className="text-sky-400">vs:</strong> {sample.vs.toFixed(1)} V
          </span>
          <span>
            <strong className="text-amber-400">vo:</strong> {sample.vo.toFixed(1)} V
          </span>
          <span>
            <strong className="text-emerald-400">io:</strong> {sample.io.toFixed(2)} A
          </span>
        </div>
      </div>

      {/* Time Scrubber Slider */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-900/80 border-t border-slate-800 text-[11px] font-mono">
        <span className="text-slate-400 select-none">Time Scrub:</span>
        <input
          type="range"
          min={0}
          max={simulationResult.samples.length - 1}
          value={currentTimeIndex}
          onChange={(e) => setTimeIndex(parseInt(e.target.value, 10))}
          className="flex-1 accent-sky-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
        />
        <span className="text-sky-400 w-24 text-right font-medium">
          {(sample.t * 1000).toFixed(2)} ms ({omegaTdeg}°)
        </span>
      </div>
    </div>
  );
};
