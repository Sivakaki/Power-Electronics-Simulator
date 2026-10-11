import { create } from 'zustand';
import { 
  CircuitParameters, 
  SimulationSample, 
  SimulationMeasurements 
} from '../types/circuit';
import { CIRCUITS } from '../simulation/circuitsData';
import { runSimulation } from '../simulation/solver';

export type SimTab = 'measurements' | 'fft' | 'deviceStates' | 'theory';

export interface ChannelVisibility {
  vs: boolean;
  vo: boolean;
  io: boolean;
  is: boolean;
  vDev: boolean;
  gate: boolean;
}

interface SimState {
  selectedCircuitId: string;
  params: CircuitParameters;
  simulationResult: { samples: SimulationSample[]; measurements: SimulationMeasurements } | null;
  isRunning: boolean;
  currentTimeIndex: number;
  showDeviceStates: boolean;
  showCurrentAnimation: boolean;
  showProbes: boolean;
  activeChannels: ChannelVisibility;
  activeTab: SimTab;
  isComputing: boolean;
  selectedComponentId: string | null;
  simSpeed: number;
  waveformViewMode: 'different' | 'single';

  // Actions
  setCircuit: (id: string) => void;
  setSelectedComponentId: (id: string | null) => void;
  setSimSpeed: (speed: number) => void;
  setWaveformViewMode: (mode: 'different' | 'single') => void;
  updateParam: <K extends keyof CircuitParameters>(key: K, value: CircuitParameters[K]) => void;
  updateMultipleParams: (partial: Partial<CircuitParameters>) => void;
  resetToDefaults: () => void;
  runSimNow: () => void;
  togglePlayPause: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  setTimeIndex: (index: number) => void;
  toggleChannel: (channelKey: keyof ChannelVisibility) => void;
  setAllChannels: (enable: boolean) => void;
  setShowDeviceStates: (show: boolean) => void;
  setShowCurrentAnimation: (show: boolean) => void;
  setShowProbes: (show: boolean) => void;
  setActiveTab: (tab: SimTab) => void;
  applyPreset: (presetKey: string) => void;
}

const initialCircuit = CIRCUITS[2]; // Single Phase Diode Bridge as initial pleasant visual circuit

export const useSimStore = create<SimState>((set, get) => {
  // Initial compute
  const initialResult = runSimulation(initialCircuit.id, initialCircuit.defaultParams);

  return {
    selectedCircuitId: initialCircuit.id,
    params: { ...initialCircuit.defaultParams },
    simulationResult: initialResult,
    isRunning: false,
    currentTimeIndex: Math.floor(initialResult.samples.length * 0.75), // mid-steady state
    showDeviceStates: true,
    showCurrentAnimation: true,
    showProbes: true,
    activeChannels: {
      vs: true,
      vo: true,
      io: true,
      is: false,
      vDev: false,
      gate: true
    },
    activeTab: 'measurements',
    isComputing: false,
    selectedComponentId: null,
    simSpeed: 1,
    waveformViewMode: 'different',

    setSimSpeed: (speed: number) => set({ simSpeed: speed }),
    setSelectedComponentId: (id: string | null) => set({ selectedComponentId: id }),
    setWaveformViewMode: (mode: 'different' | 'single') => set({ waveformViewMode: mode }),

    setCircuit: (id: string) => {
      const found = CIRCUITS.find(c => c.id === id) || CIRCUITS[0];
      const newParams = { ...found.defaultParams };
      const newResult = runSimulation(found.id, newParams);
      set({
        selectedCircuitId: id,
        params: newParams,
        simulationResult: newResult,
        currentTimeIndex: Math.floor(newResult.samples.length * 0.75),
        isRunning: false,
        selectedComponentId: null
      });
    },

    updateParam: (key, value) => {
      const currentParams = get().params;
      const newParams = { ...currentParams, [key]: value };
      const circuitId = get().selectedCircuitId;
      const newResult = runSimulation(circuitId, newParams);
      const newIndex = Math.min(get().currentTimeIndex, newResult.samples.length - 1);

      set({
        params: newParams,
        simulationResult: newResult,
        currentTimeIndex: Math.max(0, newIndex)
      });
    },

    updateMultipleParams: (partial) => {
      const currentParams = get().params;
      const newParams = { ...currentParams, ...partial };
      const circuitId = get().selectedCircuitId;
      const newResult = runSimulation(circuitId, newParams);
      const newIndex = Math.min(get().currentTimeIndex, newResult.samples.length - 1);

      set({
        params: newParams,
        simulationResult: newResult,
        currentTimeIndex: Math.max(0, newIndex)
      });
    },

    resetToDefaults: () => {
      const circuitId = get().selectedCircuitId;
      const found = CIRCUITS.find(c => c.id === circuitId) || CIRCUITS[0];
      const newParams = { ...found.defaultParams };
      const newResult = runSimulation(circuitId, newParams);
      set({
        params: newParams,
        simulationResult: newResult,
        currentTimeIndex: Math.floor(newResult.samples.length * 0.75),
        isRunning: false
      });
    },

    runSimNow: () => {
      const { selectedCircuitId, params } = get();
      const newResult = runSimulation(selectedCircuitId, params);
      set({
        simulationResult: newResult,
        currentTimeIndex: Math.floor(newResult.samples.length * 0.75)
      });
    },

    togglePlayPause: () => {
      set(state => ({ isRunning: !state.isRunning }));
    },

    stepForward: () => {
      const { simulationResult, currentTimeIndex } = get();
      if (!simulationResult) return;
      const next = (currentTimeIndex + 5) % simulationResult.samples.length;
      set({ currentTimeIndex: next, isRunning: false });
    },

    stepBackward: () => {
      const { simulationResult, currentTimeIndex } = get();
      if (!simulationResult) return;
      const prev = (currentTimeIndex - 5 + simulationResult.samples.length) % simulationResult.samples.length;
      set({ currentTimeIndex: prev, isRunning: false });
    },

    setTimeIndex: (index: number) => {
      const { simulationResult } = get();
      if (!simulationResult) return;
      const clamped = Math.max(0, Math.min(simulationResult.samples.length - 1, index));
      set({ currentTimeIndex: clamped });
    },

    toggleChannel: (channelKey) => {
      set(state => ({
        activeChannels: {
          ...state.activeChannels,
          [channelKey]: !state.activeChannels[channelKey]
        }
      }));
    },

    setAllChannels: (enable: boolean) => {
      set({
        activeChannels: {
          vs: enable,
          vo: enable,
          io: enable,
          is: enable,
          vDev: enable,
          gate: enable
        }
      });
    },

    setShowDeviceStates: (show) => set({ showDeviceStates: show }),
    setShowCurrentAnimation: (show) => set({ showCurrentAnimation: show }),
    setShowProbes: (show) => set({ showProbes: show }),
    setActiveTab: (tab) => set({ activeTab: tab }),

    applyPreset: (presetKey: string) => {
      const { selectedCircuitId } = get();
      if (presetKey === 'resistive') {
        get().updateMultipleParams({ loadType: 'R', rLoad: 15 });
      } else if (presetKey === 'highly-inductive') {
        get().updateMultipleParams({ loadType: 'RL', rLoad: 5, lLoad: 80, hasFreewheeling: true });
      } else if (presetKey === 'discontinuous') {
        get().updateMultipleParams({ loadType: 'RL', rLoad: 25, lLoad: 5, firingAngle: 60 });
      } else if (presetKey === 'inverter-mode') {
        get().updateMultipleParams({ loadType: 'RLE', rLoad: 5, lLoad: 40, eLoad: 120, firingAngle: 120 });
      } else if (presetKey === 'high-frequency') {
        get().updateMultipleParams({ frequency: 400 });
      }
    }
  };
});
