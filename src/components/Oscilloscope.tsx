import React, { useEffect, useRef, useState, useMemo } from 'react';
import Plotly from 'plotly.js-dist-min';
import { useSimStore, ChannelVisibility } from '../store/useSimStore';
import { SimulationSample } from '../types/circuit';
import { 
  Activity, 
  Layers, 
  SplitSquareVertical, 
  TrendingUp,
  Clock,
  Sparkles,
  Sliders
} from 'lucide-react';

interface ChannelConfig {
  id: keyof ChannelVisibility;
  label: string;
  fullName: string;
  unit: string;
  color: string;
  bgColor: string;
  borderColor: string;
  isAvailable?: (circuitId: string) => boolean;
}

const CHANNELS: ChannelConfig[] = [
  {
    id: 'vs',
    label: 'CH1: Vs',
    fullName: 'Supply Voltage vs(t)',
    unit: 'V',
    color: '#38bdf8',
    bgColor: 'bg-sky-500/20 text-sky-300',
    borderColor: 'border-sky-500/40'
  },
  {
    id: 'vo',
    label: 'CH2: Vo',
    fullName: 'Output Load Voltage vo(t)',
    unit: 'V',
    color: '#f59e0b',
    bgColor: 'bg-amber-500/20 text-amber-300',
    borderColor: 'border-amber-500/40'
  },
  {
    id: 'io',
    label: 'CH3: Io',
    fullName: 'Output Load Current io(t)',
    unit: 'A',
    color: '#10b981',
    bgColor: 'bg-emerald-500/20 text-emerald-300',
    borderColor: 'border-emerald-500/40'
  },
  {
    id: 'is',
    label: 'CH4: Is',
    fullName: 'Supply Current is(t)',
    unit: 'A',
    color: '#ec4899',
    bgColor: 'bg-pink-500/20 text-pink-300',
    borderColor: 'border-pink-500/40'
  },
  {
    id: 'vDev',
    label: 'CH5: V_dev',
    fullName: 'Device Voltage Drop v_AK(t)',
    unit: 'V',
    color: '#a855f7',
    bgColor: 'bg-purple-500/20 text-purple-300',
    borderColor: 'border-purple-500/40'
  },
  {
    id: 'gate',
    label: 'CH6: Gate',
    fullName: 'SCR Gate Trigger Pulse',
    unit: 'Logic',
    color: '#ef4444',
    bgColor: 'bg-red-500/20 text-red-300',
    borderColor: 'border-red-500/40',
    isAvailable: (circuitId: string) => 
      circuitId.includes('controlled') || circuitId.includes('tcr') || circuitId.includes('dual')
  }
];

// Single separate waveform card component with bulletproof direct vector rendering
const SeparateTraceCard: React.FC<{
  channel: ChannelConfig;
  samples: SimulationSample[];
  tMs: number[];
  cursorTimeMs: number;
  currentValue: number;
  circuitId: string;
  onTimeClick: (timeMs: number) => void;
}> = ({ channel, samples, tMs, cursorTimeMs, currentValue, circuitId, onTimeClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useFallbackSvg, setUseFallbackSvg] = useState<boolean>(false);

  // Extract series values
  const seriesValues = useMemo(() => {
    if (channel.id === 'vs') return samples.map(s => s.vs);
    if (channel.id === 'vo') return samples.map(s => s.vo);
    if (channel.id === 'io') return samples.map(s => s.io);
    if (channel.id === 'is') return samples.map(s => s.is);
    if (channel.id === 'vDev') return samples.map(s => s.vDevice1);
    if (channel.id === 'gate') return samples.map(s => s.gatePulse1);
    return [];
  }, [channel.id, samples]);

  // Compute stats for this channel
  const stats = useMemo(() => {
    if (seriesValues.length === 0) return { min: 0, max: 0, rms: 0, avg: 0 };
    const min = Math.min(...seriesValues);
    const max = Math.max(...seriesValues);
    const avg = seriesValues.reduce((a, b) => a + b, 0) / seriesValues.length;
    const rms = Math.sqrt(seriesValues.reduce((a, b) => a + b * b, 0) / seriesValues.length);
    return { min, max, rms, avg };
  }, [seriesValues]);

  // Direct crisp SVG polyline path coordinates for guaranteed instant visibility
  const svgPoints = useMemo(() => {
    if (samples.length === 0 || seriesValues.length === 0) return '';
    const width = 800;
    const height = 110;
    const padding = 12;

    const tMin = tMs[0] || 0;
    const tMax = tMs[tMs.length - 1] || 1;
    const tSpan = Math.max(1e-5, tMax - tMin);

    let yMin = stats.min;
    let yMax = stats.max;

    // Handle flat or zero lines
    if (Math.abs(yMax - yMin) < 1e-4) {
      yMin = -1;
      yMax = 1;
    } else {
      const margin = (yMax - yMin) * 0.12;
      yMin -= margin;
      yMax += margin;
    }
    const ySpan = Math.max(1e-5, yMax - yMin);

    // Generate downsampled or full polyline
    const stride = Math.max(1, Math.floor(samples.length / 500));
    const pts: string[] = [];

    for (let i = 0; i < samples.length; i += stride) {
      const x = ((tMs[i] - tMin) / tSpan) * width;
      const yNorm = (seriesValues[i] - yMin) / ySpan;
      const y = height - padding - yNorm * (height - 2 * padding);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    // Always include end point
    if (samples.length > 0) {
      const lastIdx = samples.length - 1;
      const x = width;
      const yNorm = (seriesValues[lastIdx] - yMin) / ySpan;
      const y = height - padding - yNorm * (height - 2 * padding);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    return pts.join(' ');
  }, [samples, seriesValues, tMs, stats]);

  // Compute cursor X position in SVG
  const cursorX = useMemo(() => {
    if (tMs.length === 0) return 0;
    const tMin = tMs[0];
    const tMax = tMs[tMs.length - 1];
    const span = Math.max(1e-5, tMax - tMin);
    return Math.max(0, Math.min(800, ((cursorTimeMs - tMin) / span) * 800));
  }, [cursorTimeMs, tMs]);

  // Mount Plotly with graceful fallback
  useEffect(() => {
    if (!containerRef.current || samples.length === 0) return;

    try {
      const traces: any[] = [];

      if (channel.id === 'vs') {
        traces.push({
          x: tMs,
          y: samples.map(s => s.vs),
          name: 'Phase A',
          type: 'scatter',
          mode: 'lines',
          line: { color: channel.color, width: 2.2 },
          hovertemplate: '%{y:.1f} V<extra>Va</extra>'
        });

        if (circuitId.includes('tp-') && samples[0].vs_b !== undefined) {
          traces.push({
            x: tMs,
            y: samples.map(s => s.vs_b || 0),
            name: 'Phase B',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#fbbf24', width: 1.5, dash: 'dot' },
            hovertemplate: '%{y:.1f} V<extra>Vb</extra>'
          });
          traces.push({
            x: tMs,
            y: samples.map(s => s.vs_c || 0),
            name: 'Phase C',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#818cf8', width: 1.5, dash: 'dot' },
            hovertemplate: '%{y:.1f} V<extra>Vc</extra>'
          });
        }
      } else if (channel.id === 'vo') {
        traces.push({
          x: tMs,
          y: samples.map(s => s.vo),
          name: 'Vo',
          type: 'scatter',
          mode: 'lines',
          line: { color: channel.color, width: 2.5 },
          hovertemplate: '%{y:.1f} V<extra>Vo</extra>'
        });
      } else if (channel.id === 'io') {
        traces.push({
          x: tMs,
          y: samples.map(s => s.io),
          name: 'Io',
          type: 'scatter',
          mode: 'lines',
          line: { color: channel.color, width: 2.2 },
          hovertemplate: '%{y:.2f} A<extra>Io</extra>'
        });
      } else if (channel.id === 'is') {
        traces.push({
          x: tMs,
          y: samples.map(s => s.is),
          name: 'Is',
          type: 'scatter',
          mode: 'lines',
          line: { color: channel.color, width: 2 },
          hovertemplate: '%{y:.2f} A<extra>Is</extra>'
        });
      } else if (channel.id === 'vDev') {
        traces.push({
          x: tMs,
          y: samples.map(s => s.vDevice1),
          name: 'V_dev',
          type: 'scatter',
          mode: 'lines',
          line: { color: channel.color, width: 2 },
          hovertemplate: '%{y:.1f} V<extra>V_dev</extra>'
        });
      } else if (channel.id === 'gate') {
        traces.push({
          x: tMs,
          y: samples.map(s => s.gatePulse1),
          name: 'Gate Pulse',
          type: 'scatter',
          mode: 'lines',
          line: { color: channel.color, width: 2.5 },
          hovertemplate: '%{y:.0f}<extra>Pulse</extra>'
        });
      }

      const layout = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: '#030712',
        margin: { t: 6, r: 25, b: 22, l: 45 },
        showlegend: traces.length > 1,
        legend: {
          orientation: 'h',
          x: 0,
          y: 1.25,
          font: { color: '#94a3b8', size: 9, family: 'monospace' },
          bgcolor: 'rgba(15, 23, 42, 0.6)'
        },
        xaxis: {
          gridcolor: '#1e293b',
          zerolinecolor: '#334155',
          tickfont: { color: '#94a3b8', size: 9, family: 'monospace' },
          showgrid: true,
          nticks: 10
        },
        yaxis: {
          gridcolor: '#1e293b',
          zerolinecolor: '#475569',
          zerolinewidth: 1.5,
          tickfont: { color: channel.color, size: 9, family: 'monospace' },
          showgrid: true,
          autorange: true
        },
        shapes: [
          {
            type: 'line',
            x0: cursorTimeMs,
            x1: cursorTimeMs,
            y0: 0,
            y1: 1,
            yref: 'paper',
            line: { color: '#e2e8f0', width: 1.5, dash: 'dot' }
          }
        ],
        hovermode: 'x unified',
        hoverlabel: {
          bgcolor: '#0f172a',
          bordercolor: '#334155',
          font: { family: 'monospace', size: 10, color: '#f8fafc' }
        }
      };

      const config = {
        responsive: true,
        displayModeBar: false
      };

      Plotly.react(containerRef.current, traces, layout, config).catch(() => {
        setUseFallbackSvg(true);
      });

      const plotElem: any = containerRef.current;
      if (plotElem && plotElem.on) {
        plotElem.removeAllListeners?.('plotly_click');
        plotElem.on('plotly_click', (data: any) => {
          if (data && data.points && data.points[0]) {
            onTimeClick(data.points[0].x);
          }
        });
      }
    } catch {
      setUseFallbackSvg(true);
    }
  }, [channel, samples, tMs, cursorTimeMs, circuitId, onTimeClick]);

  return (
    <div className="flex flex-col bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden transition shadow-sm">
      {/* Subplot Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-950/90 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: channel.color }} />
          <span className="font-bold text-slate-200">{channel.fullName}</span>
          <span className="text-slate-500 font-normal">[{channel.unit}]</span>
        </div>

        {/* Real-time stats */}
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-slate-400">
            t={(cursorTimeMs).toFixed(1)}ms: <strong className="font-bold text-slate-100" style={{ color: channel.color }}>
              {currentValue.toFixed(channel.unit === 'A' ? 2 : 1)} {channel.unit}
            </strong>
          </span>
          <span className="text-slate-500 hidden sm:inline">
            Pk: <span className="text-slate-300">{stats.max.toFixed(1)}</span>
          </span>
          <span className="text-slate-500 hidden sm:inline">
            RMS: <span className="text-slate-300">{stats.rms.toFixed(1)}</span>
          </span>
        </div>
      </div>

      {/* Plot Canvas */}
      <div className="h-[120px] w-full bg-[#030712] relative overflow-hidden select-none">
        {/* Interactive Plotly Canvas */}
        <div 
          ref={containerRef} 
          className="w-full h-full"
          style={{ opacity: useFallbackSvg ? 0 : 1 }} 
        />

        {/* Fallback Vector SVG overlay so waveforms are 100% visible under any browser conditions */}
        {useFallbackSvg && (
          <svg 
            viewBox="0 0 800 110" 
            preserveAspectRatio="none" 
            className="absolute inset-0 w-full h-full cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickFraction = (e.clientX - rect.left) / rect.width;
              const tMin = tMs[0] || 0;
              const tMax = tMs[tMs.length - 1] || 1;
              onTimeClick(tMin + clickFraction * (tMax - tMin));
            }}
          >
            {/* Grid lines */}
            <line x1="0" y1="20" x2="800" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="0" y1="55" x2="800" y2="55" stroke="#334155" strokeWidth="1.2" />
            <line x1="0" y1="90" x2="800" y2="90" stroke="#1e293b" strokeDasharray="3 3" />

            {/* Waveform curve */}
            <polyline
              fill="none"
              stroke={channel.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={svgPoints}
            />

            {/* Time Cursor */}
            <line
              x1={cursorX}
              y1="0"
              x2={cursorX}
              y2="110"
              stroke="#f8fafc"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </svg>
        )}
      </div>
    </div>
  );
};

export const Oscilloscope: React.FC = () => {
  const combinedPlotRef = useRef<HTMLDivElement>(null);
  const {
    simulationResult,
    currentTimeIndex,
    setTimeIndex,
    activeChannels,
    toggleChannel,
    setAllChannels,
    selectedCircuitId,
    waveformViewMode,
    setWaveformViewMode
  } = useSimStore();

  const [dualYAxis, setDualYAxis] = useState<boolean>(true);

  if (!simulationResult || simulationResult.samples.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 font-mono text-xs">
        No simulation data available
      </div>
    );
  }

  const samples = simulationResult.samples;
  const tMs = samples.map(s => s.t * 1000);
  const currentSample = samples[currentTimeIndex] || samples[0];
  const cursorTimeMs = currentSample.t * 1000;

  // Filter channels available in current circuit
  const availableChannels = CHANNELS.filter(c => !c.isAvailable || c.isAvailable(selectedCircuitId));
  const activeChannelList = availableChannels.filter(c => activeChannels[c.id]);

  // Click on plot handler to jump cursor
  const handleTimeClick = (clickedMs: number) => {
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < samples.length; i++) {
      const diff = Math.abs(samples[i].t * 1000 - clickedMs);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    setTimeIndex(closestIdx);
  };

  // Render Combined Plot when waveformViewMode === 'single'
  useEffect(() => {
    if (waveformViewMode !== 'single' || !combinedPlotRef.current || samples.length === 0) return;

    const traces: any[] = [];

    // CH1: Source Voltage
    if (activeChannels.vs) {
      traces.push({
        x: tMs,
        y: samples.map(s => s.vs),
        name: 'Vs (Supply)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#38bdf8', width: 2 },
        yaxis: 'y1',
        hovertemplate: '%{y:.1f} V<extra>Vs</extra>'
      });

      if (selectedCircuitId.includes('tp-') && samples[0].vs_b !== undefined) {
        traces.push({
          x: tMs,
          y: samples.map(s => s.vs_b || 0),
          name: 'Vb',
          type: 'scatter',
          mode: 'lines',
          line: { color: '#fbbf24', width: 1.5, dash: 'dot' },
          yaxis: 'y1',
          hovertemplate: '%{y:.1f} V<extra>Vb</extra>'
        });
        traces.push({
          x: tMs,
          y: samples.map(s => s.vs_c || 0),
          name: 'Vc',
          type: 'scatter',
          mode: 'lines',
          line: { color: '#818cf8', width: 1.5, dash: 'dot' },
          yaxis: 'y1',
          hovertemplate: '%{y:.1f} V<extra>Vc</extra>'
        });
      }
    }

    // CH2: Output Voltage
    if (activeChannels.vo) {
      traces.push({
        x: tMs,
        y: samples.map(s => s.vo),
        name: 'Vo (Load)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#f59e0b', width: 2.2 },
        yaxis: 'y1',
        hovertemplate: '%{y:.1f} V<extra>Vo</extra>'
      });
    }

    // CH3: Output Current
    if (activeChannels.io) {
      traces.push({
        x: tMs,
        y: samples.map(s => s.io),
        name: 'Io (Load)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#10b981', width: 2.2 },
        yaxis: dualYAxis ? 'y2' : 'y1',
        hovertemplate: '%{y:.2f} A<extra>Io</extra>'
      });
    }

    // CH4: Supply Current
    if (activeChannels.is) {
      traces.push({
        x: tMs,
        y: samples.map(s => s.is),
        name: 'Is (Supply)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#ec4899', width: 1.8, dash: 'dash' },
        yaxis: dualYAxis ? 'y2' : 'y1',
        hovertemplate: '%{y:.2f} A<extra>Is</extra>'
      });
    }

    // CH5: Device Voltage
    if (activeChannels.vDev) {
      traces.push({
        x: tMs,
        y: samples.map(s => s.vDevice1),
        name: 'V_dev (v_AK)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#a855f7', width: 1.8 },
        yaxis: 'y1',
        hovertemplate: '%{y:.1f} V<extra>V_dev</extra>'
      });
    }

    // CH6: Gate Pulse
    if (activeChannels.gate && samples[0].gatePulse1 !== undefined) {
      const maxV = Math.max(...samples.map(s => s.vo));
      const pulseScale = maxV > 0 ? maxV * 0.25 : 10;
      traces.push({
        x: tMs,
        y: samples.map(s => s.gatePulse1 * pulseScale),
        name: 'Gate Trigger',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#ef4444', width: 2 },
        yaxis: 'y1',
        hovertemplate: '%{y:.0f}<extra>Gate</extra>'
      });
    }

    const layout: any = {
      paper_bgcolor: 'transparent',
      plot_bgcolor: '#030712',
      margin: { t: 10, r: dualYAxis ? 50 : 20, b: 30, l: 50 },
      showlegend: true,
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.15,
        font: { color: '#cbd5e1', size: 10, family: 'monospace' },
        bgcolor: 'rgba(15, 23, 42, 0.7)'
      },
      xaxis: {
        title: { text: 'Time (ms)', font: { color: '#94a3b8', size: 10, family: 'monospace' } },
        gridcolor: '#1e293b',
        zerolinecolor: '#334155',
        tickfont: { color: '#94a3b8', size: 10, family: 'monospace' },
        showgrid: true,
        nticks: 12
      },
      yaxis: {
        title: { text: 'Voltage (V)', font: { color: '#38bdf8', size: 11, family: 'monospace' } },
        gridcolor: '#1e293b',
        zerolinecolor: '#475569',
        zerolinewidth: 1.5,
        tickfont: { color: '#38bdf8', size: 10, family: 'monospace' },
        showgrid: true,
        autorange: true
      },
      shapes: [
        {
          type: 'line',
          x0: cursorTimeMs,
          x1: cursorTimeMs,
          y0: 0,
          y1: 1,
          yref: 'paper',
          line: { color: '#f8fafc', width: 1.5, dash: 'dot' }
        }
      ],
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: '#0f172a',
        bordercolor: '#334155',
        font: { family: 'monospace', size: 11, color: '#f8fafc' }
      }
    };

    if (dualYAxis) {
      layout.yaxis2 = {
        title: { text: 'Current (A)', font: { color: '#10b981', size: 11, family: 'monospace' } },
        overlaying: 'y',
        side: 'right',
        gridcolor: 'transparent',
        zeroline: false,
        tickfont: { color: '#10b981', size: 10, family: 'monospace' }
      };
    }

    const config = {
      responsive: true,
      displayModeBar: false
    };

    Plotly.react(combinedPlotRef.current, traces, layout, config);

    const plotElem: any = combinedPlotRef.current;
    if (plotElem && plotElem.on) {
      plotElem.removeAllListeners?.('plotly_click');
      plotElem.on('plotly_click', (data: any) => {
        if (data && data.points && data.points[0]) {
          handleTimeClick(data.points[0].x);
        }
      });
    }
  }, [waveformViewMode, samples, tMs, cursorTimeMs, activeChannels, dualYAxis, selectedCircuitId]);

  const getCurrentChannelValue = (channelId: keyof ChannelVisibility): number => {
    switch (channelId) {
      case 'vs': return currentSample.vs;
      case 'vo': return currentSample.vo;
      case 'io': return currentSample.io;
      case 'is': return currentSample.is;
      case 'vDev': return currentSample.vDevice1;
      case 'gate': return currentSample.gatePulse1;
      default: return 0;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900/90 text-xs gap-2 flex-none">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200 font-mono flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            Waveforms
          </span>
          <span className="text-slate-500 font-mono">·</span>

          {/* VIEW MODE TOGGLE (Separate Waveforms vs Single Combined Overlay) */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 font-mono">
            <button
              onClick={() => setWaveformViewMode('different')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition ${
                waveformViewMode === 'different'
                  ? 'bg-sky-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="View each channel in its own separate waveform subplot"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Separate Waveforms (Different)</span>
            </button>

            <button
              onClick={() => setWaveformViewMode('single')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition ${
                waveformViewMode === 'single'
                  ? 'bg-sky-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Overlay all channels onto a single combined oscilloscope screen"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Single Plot (Combined)</span>
            </button>
          </div>
        </div>

        {/* Channel Selection Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {availableChannels.map(channel => {
            const isActive = activeChannels[channel.id];
            return (
              <button
                key={channel.id}
                onClick={() => toggleChannel(channel.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border transition ${
                  isActive
                    ? `${channel.bgColor} ${channel.borderColor} shadow-sm font-bold`
                    : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
                }`}
              >
                {channel.label}
              </button>
            );
          })}

          <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-800">
            <button
              onClick={() => setAllChannels(true)}
              className="text-[10px] text-slate-400 hover:text-sky-300 px-1 font-mono"
              title="Turn on all channels"
            >
              All
            </button>
            <span className="text-slate-600 text-[10px]">/</span>
            <button
              onClick={() => setAllChannels(false)}
              className="text-[10px] text-slate-400 hover:text-red-300 px-1 font-mono"
              title="Clear all channels"
            >
              None
            </button>
          </div>

          {waveformViewMode === 'single' && (
            <button
              onClick={() => setDualYAxis(prev => !prev)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                dualYAxis
                  ? 'bg-slate-700 text-slate-200 border-slate-600'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-300'
              }`}
              title="Toggle Dual Y-Axis (Voltage Left / Current Right)"
            >
              Dual Y: {dualYAxis ? 'ON' : 'OFF'}
            </button>
          )}
        </div>
      </div>

      {/* Waveforms Display Area */}
      <div className="flex-1 overflow-y-auto p-2 bg-[#030712]">
        {waveformViewMode === 'different' ? (
          /* SEPARATE WAVEFORMS: Stack of individual, dedicated subplot cards */
          <div className="space-y-1.5">
            {activeChannelList.length === 0 ? (
              <div className="flex h-36 items-center justify-center text-slate-500 font-mono text-xs">
                Select one or more channels above to view waveforms
              </div>
            ) : (
              activeChannelList.map(channel => (
                <SeparateTraceCard
                  key={channel.id}
                  channel={channel}
                  samples={samples}
                  tMs={tMs}
                  cursorTimeMs={cursorTimeMs}
                  currentValue={getCurrentChannelValue(channel.id)}
                  circuitId={selectedCircuitId}
                  onTimeClick={handleTimeClick}
                />
              ))
            )}
          </div>
        ) : (
          /* SINGLE PLOT: Combined oscilloscope container */
          <div className="h-full min-h-[220px] w-full">
            <div ref={combinedPlotRef} className="w-full h-full min-h-[220px]" />
          </div>
        )}
      </div>
    </div>
  );
};
