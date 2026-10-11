export type CircuitCategory = 'single-phase' | 'three-phase' | 'ac-controller' | 'dual-converter';

export type LoadType = 'R' | 'RL' | 'RLE';

export interface CircuitParameters {
  // Source
  vRms: number;          // Volts RMS (e.g. 230)
  frequency: number;     // Hz (e.g. 50)
  sourcePhase: number;   // Degrees (e.g. 0)
  
  // Load
  loadType: LoadType;
  rLoad: number;         // Ohms (e.g. 10)
  lLoad: number;         // mH (e.g. 25)
  eLoad: number;         // Volts DC Back-EMF (e.g. 24)
  hasFreewheeling: boolean; // For single phase half wave / bridge
  
  // Control
  firingAngle: number;   // Degrees (0 - 180)
  firingAngle2?: number; // Degrees for dual converter bridge 2
  pulseWidth: number;    // Degrees (e.g. 10)
  gateDelay: number;     // ms (e.g. 0)
  dualMode?: 'circulating' | 'non-circulating';
  circulatingL?: number; // mH reactor inductance
  
  // Simulation
  cycles: number;        // Number of AC cycles to simulate (e.g. 5)
  timeStepUs: number;    // Microseconds per step (e.g. 20)
}

export interface DeviceState {
  id: string;
  name: string;
  type: 'diode' | 'scr' | 'switch';
  isConduction: boolean;
  isGated?: boolean;
  voltage: number;       // Instantaneous volts
  current: number;       // Instantaneous amperes
  conductionLoss?: number;
}

export interface SimulationSample {
  t: number;             // seconds
  vs: number;            // supply voltage v_s(t)
  vs_b?: number;         // supply voltage v_b(t) for 3-phase
  vs_c?: number;         // supply voltage v_c(t) for 3-phase
  vo: number;            // output voltage v_o(t)
  io: number;            // output load current i_o(t)
  is: number;            // input supply current i_s(t)
  is_b?: number;
  is_c?: number;
  vDevice1: number;      // voltage across device 1 (D1 or T1)
  iDevice1: number;      // current through device 1
  vDevice2?: number;
  iDevice2?: number;
  gatePulse1: number;    // gate pulse logic level (0 or 1)
  gatePulse2?: number;
  gatePulse3?: number;
  devices: Record<string, DeviceState>;
}

export interface HarmonicComponent {
  order: number;
  frequency: number;
  magnitude: number;     // Peak magnitude
  rms: number;           // RMS value
  percentFundamental: number;
  phaseDeg: number;
}

export interface SimulationMeasurements {
  vAvg: number;
  vRms: number;
  iAvg: number;
  iRms: number;
  pActive: number;       // Active power (W)
  sApparent: number;     // Apparent power (VA)
  qReactive: number;     // Reactive power (VAR)
  powerFactor: number;   // PF = P / S
  displacementPf: number;// cos(phi_1)
  thdCurrent: number;    // % THD of input current
  thdVoltage: number;    // % THD of output voltage
  formFactor: number;    // V_rms / V_avg
  rippleFactor: number;  // sqrt(FF^2 - 1)
  efficiency: number;    // P_dc / P_ac (%)
  fundamentalCurrentRms: number;
  currentHarmonics: HarmonicComponent[];
  voltageHarmonics: HarmonicComponent[];
  analyticalVavg: number;
  analyticalVrms: number;
}

export interface CircuitDefinition {
  id: string;
  category: CircuitCategory;
  name: string;
  shortDescription: string;
  badge: string;
  defaultParams: CircuitParameters;
  paramConfigs: {
    hasControl: boolean;
    hasFreewheelingOption: boolean;
    hasDualControl?: boolean;
    supportsBackEmf?: boolean;
    isThreePhase: boolean;
  };
  theory: {
    summary: string;
    formulas: {
      name: string;
      formula: string;              // Standard mathematical form
      humanReadable?: string;        // Plain human-interpreted English explanation
      calculation?: (params: CircuitParameters, Vm: number) => { expression: string; value: string; unit: string };
      explanation: string;
    }[];
    notes: string[];
  };
}
