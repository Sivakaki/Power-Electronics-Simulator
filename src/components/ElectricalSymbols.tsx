import React from 'react';

// ==========================================
// AC VOLTAGE SOURCE
// ==========================================
export const AcSourceSymbol: React.FC<{ 
  label?: string; 
  sublabel?: string;
  orientation?: 'v' | 'h';
}> = ({ 
  label = 'AC Source', 
  sublabel = '230V 50Hz',
  orientation = 'v'
}) => {
  return (
    <g className="select-none">
      {orientation === 'v' ? (
        <>
          <line x1="40" y1="0" x2="40" y2="16" className="stroke-sky-400 stroke-2" />
          <line x1="40" y1="64" x2="40" y2="80" className="stroke-sky-400 stroke-2" />
          <circle cx="40" cy="0" r="2.5" className="fill-sky-400" />
          <circle cx="40" cy="80" r="2.5" className="fill-sky-400" />
        </>
      ) : (
        <>
          <line x1="0" y1="40" x2="16" y2="40" className="stroke-sky-400 stroke-2" />
          <line x1="64" y1="40" x2="80" y2="40" className="stroke-sky-400 stroke-2" />
          <circle cx="0" cy="40" r="2.5" className="fill-sky-400" />
          <circle cx="80" cy="40" r="2.5" className="fill-sky-400" />
        </>
      )}
      <circle cx="40" cy="40" r="24" className="fill-slate-900/90 stroke-sky-400 stroke-2" />
      {/* Sine curve inside */}
      <path
        d="M 26 40 Q 33 26 40 40 T 54 40"
        fill="none"
        className="stroke-sky-300 stroke-2"
        strokeLinecap="round"
      />
      <text x="40" y="74" textAnchor="middle" className="text-[10px] font-mono fill-sky-200 font-semibold">
        {label}
      </text>
      <text x="40" y="86" textAnchor="middle" className="text-[9px] font-mono fill-slate-400">
        {sublabel}
      </text>
    </g>
  );
};

// ==========================================
// DC VOLTAGE SOURCE (BACK EMF / BATTERY)
// ==========================================
export const DcSourceSymbol: React.FC<{ label?: string; value?: string }> = ({ 
  label = 'E (DC)', 
  value = '24V' 
}) => {
  return (
    <g className="select-none">
      {/* Top terminal lead */}
      <line x1="40" y1="0" x2="40" y2="28" className="stroke-emerald-400 stroke-2" />
      {/* Long line (positive) */}
      <line x1="20" y1="28" x2="60" y2="28" className="stroke-emerald-400 stroke-2" />
      {/* Short line (negative) */}
      <line x1="28" y1="44" x2="52" y2="44" className="stroke-emerald-400 stroke-[3]" />
      {/* Bottom terminal lead */}
      <line x1="40" y1="44" x2="40" y2="80" className="stroke-emerald-400 stroke-2" />
      <circle cx="40" cy="0" r="2.5" className="fill-emerald-400" />
      <circle cx="40" cy="80" r="2.5" className="fill-emerald-400" />

      <text x="40" y="20" textAnchor="middle" className="text-[10px] font-mono fill-emerald-300 font-bold">+</text>
      <text x="40" y="56" textAnchor="middle" className="text-[10px] font-mono fill-slate-400">-</text>
      <text x="40" y="70" textAnchor="middle" className="text-[9px] font-mono fill-emerald-200">{label}</text>
      <text x="40" y="80" textAnchor="middle" className="text-[9px] font-mono fill-slate-400">{value}</text>
    </g>
  );
};

// ==========================================
// DIODE SYMBOL (80x80 bounding box, leads span 0..80)
// ==========================================
interface DiodeProps {
  id: string;
  name: string;
  isConduction: boolean;
  voltage?: number;
  current?: number;
  rotation?: number; // 0 = right, 90 = down, 180 = left, 270 = up
  showInfo?: boolean;
}

export const DiodeSymbol: React.FC<DiodeProps> = ({
  name,
  isConduction,
  voltage,
  current,
  rotation = 0,
  showInfo = true
}) => {
  const strokeColor = isConduction ? '#10b981' : '#64748b'; // Emerald if ON, slate if OFF
  const fillColor = isConduction ? '#10b981' : 'transparent';
  const glowFilter = isConduction ? 'url(#glow-green)' : 'none';

  return (
    <g transform={`rotate(${rotation} 40 40)`} className="select-none transition-colors duration-150">
      {/* Triangle (Anode -> Cathode) */}
      <polygon
        points="22,26 22,54 50,40"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinejoin="round"
        filter={glowFilter}
      />
      {/* Cathode bar */}
      <line
        x1="50"
        y1="24"
        x2="50"
        y2="56"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Connecting leads extending all the way to border edges (0 and 80) */}
      <line x1="0" y1="40" x2="22" y2="40" stroke={strokeColor} strokeWidth="2" />
      <line x1="50" y1="40" x2="80" y2="40" stroke={strokeColor} strokeWidth="2" />
      <circle cx="0" cy="40" r="2.5" fill={strokeColor} />
      <circle cx="80" cy="40" r="2.5" fill={strokeColor} />

      {/* Counter-rotate label info so text is always readable */}
      {showInfo && (
        <g transform={`rotate(${-rotation} 40 40)`}>
          <text
            x="40"
            y="14"
            textAnchor="middle"
            className={`text-[10px] font-mono font-bold ${isConduction ? 'fill-emerald-400' : 'fill-slate-400'}`}
          >
            {name}
          </text>
          <text
            x="40"
            y="68"
            textAnchor="middle"
            className="text-[8px] font-mono fill-slate-300"
          >
            {isConduction ? `ON · ${(current || 0).toFixed(1)}A` : `OFF · ${(voltage || 0).toFixed(0)}V`}
          </text>
        </g>
      )}
    </g>
  );
};

// ==========================================
// SCR / THYRISTOR SYMBOL (80x80 box, leads span 0..80)
// ==========================================
interface ScrProps {
  id: string;
  name: string;
  isConduction: boolean;
  isGated?: boolean;
  voltage?: number;
  current?: number;
  rotation?: number;
  showInfo?: boolean;
}

export const ScrSymbol: React.FC<ScrProps> = ({
  name,
  isConduction,
  isGated = false,
  voltage,
  current,
  rotation = 0,
  showInfo = true
}) => {
  const strokeColor = isConduction ? '#38bdf8' : '#64748b'; // Cyan if ON, slate if OFF
  const fillColor = isConduction ? '#38bdf8' : 'transparent';
  const gateColor = isGated ? '#f59e0b' : '#94a3b8'; // Amber pulse if gated
  const glowFilter = isConduction ? 'url(#glow-cyan)' : 'none';

  return (
    <g transform={`rotate(${rotation} 40 40)`} className="select-none transition-colors duration-150">
      {/* Triangle */}
      <polygon
        points="22,26 22,54 50,40"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinejoin="round"
        filter={glowFilter}
      />
      {/* Cathode bar */}
      <line
        x1="50"
        y1="24"
        x2="50"
        y2="56"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Gate Terminal */}
      <path
        d="M 50 48 L 62 58 L 62 70"
        fill="none"
        stroke={gateColor}
        strokeWidth={isGated ? '3' : '2'}
        strokeLinecap="round"
      />
      {isGated && (
        <circle cx="62" cy="70" r="3.5" className="fill-amber-400 animate-ping" />
      )}
      {/* Leads extending to edges (0 and 80) */}
      <line x1="0" y1="40" x2="22" y2="40" stroke={strokeColor} strokeWidth="2" />
      <line x1="50" y1="40" x2="80" y2="40" stroke={strokeColor} strokeWidth="2" />
      <circle cx="0" cy="40" r="2.5" fill={strokeColor} />
      <circle cx="80" cy="40" r="2.5" fill={strokeColor} />

      {/* Info labels counter-rotated */}
      {showInfo && (
        <g transform={`rotate(${-rotation} 40 40)`}>
          <text
            x="40"
            y="14"
            textAnchor="middle"
            className={`text-[10px] font-mono font-bold ${isConduction ? 'fill-sky-400' : 'fill-slate-400'}`}
          >
            {name}
          </text>
          <text
            x="40"
            y="76"
            textAnchor="middle"
            className="text-[8px] font-mono fill-slate-300"
          >
            {isConduction ? `ON · ${(current || 0).toFixed(1)}A` : `OFF · ${(voltage || 0).toFixed(0)}V`}
          </text>
          {isGated && (
            <text x="70" y="68" className="text-[8px] font-mono fill-amber-400 font-bold">GATE</text>
          )}
        </g>
      )}
    </g>
  );
};

// ==========================================
// RESISTOR SYMBOL (0..80 leads)
// ==========================================
export const ResistorSymbol: React.FC<{ value: string; orientation?: 'h' | 'v' }> = ({
  value,
  orientation = 'v'
}) => {
  return (
    <g
      transform={orientation === 'v' ? 'rotate(90 40 40)' : ''}
      className="select-none"
    >
      <line x1="0" y1="40" x2="22" y2="40" className="stroke-slate-400 stroke-2" />
      {/* Zigzag */}
      <path
        d="M 22 40 L 26 30 L 32 50 L 38 30 L 44 50 L 50 30 L 54 40"
        fill="none"
        className="stroke-amber-400 stroke-2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="54" y1="40" x2="80" y2="40" className="stroke-slate-400 stroke-2" />
      <circle cx="0" cy="40" r="2.5" className="fill-slate-400" />
      <circle cx="80" cy="40" r="2.5" className="fill-slate-400" />
      <g transform={orientation === 'v' ? 'rotate(-90 40 40)' : ''}>
        <text x="40" y="24" textAnchor="middle" className="text-[10px] font-mono fill-amber-300 font-medium">
          R = {value}
        </text>
      </g>
    </g>
  );
};

// ==========================================
// INDUCTOR SYMBOL (0..80 leads)
// ==========================================
export const InductorSymbol: React.FC<{ value: string; orientation?: 'h' | 'v' }> = ({
  value,
  orientation = 'v'
}) => {
  return (
    <g
      transform={orientation === 'v' ? 'rotate(90 40 40)' : ''}
      className="select-none"
    >
      <line x1="0" y1="40" x2="20" y2="40" className="stroke-slate-400 stroke-2" />
      {/* Coils */}
      <path
        d="M 20 40 C 20 28, 30 28, 30 40 C 30 28, 40 28, 40 40 C 40 28, 50 28, 50 40 C 50 28, 60 28, 60 40"
        fill="none"
        className="stroke-violet-400 stroke-2"
        strokeLinecap="round"
      />
      <line x1="60" y1="40" x2="80" y2="40" className="stroke-slate-400 stroke-2" />
      <circle cx="0" cy="40" r="2.5" className="fill-slate-400" />
      <circle cx="80" cy="40" r="2.5" className="fill-slate-400" />
      <g transform={orientation === 'v' ? 'rotate(-90 40 40)' : ''}>
        <text x="40" y="22" textAnchor="middle" className="text-[10px] font-mono fill-violet-300 font-medium">
          L = {value}
        </text>
      </g>
    </g>
  );
};

// ==========================================
// CAPACITOR SYMBOL (0..80 leads)
// ==========================================
export const CapacitorSymbol: React.FC<{ value: string; orientation?: 'h' | 'v' }> = ({
  value,
  orientation = 'v'
}) => {
  return (
    <g
      transform={orientation === 'v' ? 'rotate(90 40 40)' : ''}
      className="select-none"
    >
      <line x1="0" y1="40" x2="34" y2="40" className="stroke-slate-400 stroke-2" />
      <line x1="34" y1="24" x2="34" y2="56" className="stroke-cyan-400 stroke-[2.5]" strokeLinecap="round" />
      <line x1="46" y1="24" x2="46" y2="56" className="stroke-cyan-400 stroke-[2.5]" strokeLinecap="round" />
      <line x1="46" y1="40" x2="80" y2="40" className="stroke-slate-400 stroke-2" />
      <circle cx="0" cy="40" r="2.5" className="fill-slate-400" />
      <circle cx="80" cy="40" r="2.5" className="fill-slate-400" />
      <g transform={orientation === 'v' ? 'rotate(-90 40 40)' : ''}>
        <text x="40" y="20" textAnchor="middle" className="text-[10px] font-mono fill-cyan-300 font-medium">
          C = {value}
        </text>
      </g>
    </g>
  );
};

// ==========================================
// GROUND SYMBOL (pin at (40, 0))
// ==========================================
export const GroundSymbol: React.FC = () => {
  return (
    <g className="select-none">
      <line x1="40" y1="0" x2="40" y2="24" className="stroke-slate-400 stroke-2" />
      <line x1="22" y1="24" x2="58" y2="24" className="stroke-slate-400 stroke-2" />
      <line x1="28" y1="30" x2="52" y2="30" className="stroke-slate-400 stroke-2" />
      <line x1="34" y1="36" x2="46" y2="36" className="stroke-slate-400 stroke-2" />
      <circle cx="40" cy="0" r="2.5" className="fill-slate-400" />
    </g>
  );
};

// ==========================================
// CENTER-TAPPED TRANSFORMER SYMBOL
// Pins:
// - Primary top: (0, 30)
// - Primary bottom: (0, 210)
// - Secondary top: (120, 30)
// - Center Tap: (120, 120)
// - Secondary bottom: (120, 210)
// ==========================================
export const TransformerCtSymbol: React.FC<{ vPri?: string; vSec?: string }> = ({
  vPri = '230V',
  vSec = '115V-0-115V'
}) => {
  return (
    <g className="select-none">
      {/* Primary terminals */}
      <line x1="0" y1="30" x2="30" y2="30" className="stroke-sky-400 stroke-2" />
      <line x1="0" y1="210" x2="30" y2="210" className="stroke-sky-400 stroke-2" />
      <circle cx="0" cy="30" r="3" className="fill-sky-400" />
      <circle cx="0" cy="210" r="3" className="fill-sky-400" />

      {/* Primary Coils */}
      <path
        d="M 30 30 C 45 30, 45 60, 30 60 C 45 60, 45 90, 30 90 C 45 90, 45 120, 30 120 C 45 120, 45 150, 30 150 C 45 150, 45 180, 30 180 C 45 180, 45 210, 30 210"
        fill="none"
        className="stroke-sky-400 stroke-2"
      />

      {/* Magnetic Core (Parallel lamination bars) */}
      <line x1="56" y1="20" x2="56" y2="220" className="stroke-slate-500 stroke-2" strokeDasharray="6 2" />
      <line x1="62" y1="20" x2="62" y2="220" className="stroke-slate-500 stroke-2" strokeDasharray="6 2" />

      {/* Secondary Upper Coil */}
      <path
        d="M 90 30 C 75 30, 75 60, 90 60 C 75 60, 75 90, 90 90 C 75 90, 75 120, 90 120"
        fill="none"
        className="stroke-amber-400 stroke-2"
      />
      {/* Secondary Lower Coil */}
      <path
        d="M 90 120 C 75 120, 75 150, 90 150 C 75 150, 75 180, 90 180 C 75 180, 75 210, 90 210"
        fill="none"
        className="stroke-amber-400 stroke-2"
      />

      {/* Secondary Terminals */}
      <line x1="90" y1="30" x2="120" y2="30" className="stroke-amber-400 stroke-2" />
      <line x1="90" y1="120" x2="120" y2="120" className="stroke-slate-300 stroke-2" />
      <line x1="90" y1="210" x2="120" y2="210" className="stroke-amber-400 stroke-2" />
      <circle cx="120" cy="30" r="3" className="fill-amber-400" />
      <circle cx="120" cy="120" r="3.5" className="fill-slate-200" />
      <circle cx="120" cy="210" r="3" className="fill-amber-400" />

      {/* Labels */}
      <text x="18" y="18" className="text-[9px] font-mono fill-sky-300 font-bold">PRI ({vPri})</text>
      <text x="105" y="18" className="text-[9px] font-mono fill-amber-300 font-bold">SEC</text>
      <text x="125" y="115" className="text-[9px] font-mono fill-slate-300 font-bold">CT (0V)</text>
      <text x="125" y="26" className="text-[8px] font-mono fill-amber-300">+v_s</text>
      <text x="125" y="215" className="text-[8px] font-mono fill-amber-300">-v_s</text>
    </g>
  );
};

// ==========================================
// SVG FILTERS FOR GLOWING CONDUCTION
// ==========================================
export const SvgGlowFilters: React.FC = () => {
  return (
    <defs>
      <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <pattern id="grid-dots" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="#334155" opacity="0.4" />
      </pattern>
    </defs>
  );
};
