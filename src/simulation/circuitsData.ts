import { CircuitDefinition } from '../types/circuit';

export const CIRCUITS: CircuitDefinition[] = [
  // ==========================================
  // SINGLE PHASE
  // ==========================================
  {
    id: 'sp-half-wave',
    category: 'single-phase',
    name: 'Half Wave Rectifier',
    shortDescription: 'Basic single-diode converter converting alternating positive half-cycles into pulsating DC.',
    badge: '1-Phase · 1 Diode',
    defaultParams: {
      vRms: 230,
      frequency: 50,
      sourcePhase: 0,
      loadType: 'RL',
      rLoad: 15,
      lLoad: 30,
      eLoad: 0,
      hasFreewheeling: true,
      firingAngle: 0,
      pulseWidth: 10,
      gateDelay: 0,
      cycles: 4,
      timeStepUs: 20
    },
    paramConfigs: {
      hasControl: false,
      hasFreewheelingOption: true,
      supportsBackEmf: true,
      isThreePhase: false
    },
    theory: {
      summary: 'Conducts during positive half cycles (vs > 0). With an RL load without freewheeling diode, conduction continues into the negative half cycle until current drops to zero. Adding a freewheeling diode clamps the negative voltage to zero and dissipates stored inductor energy.',
      formulas: [
        { 
          name: 'Average Output DC Voltage (V_avg)', 
          formula: 'V_avg = Vm / π ≈ 0.318 × Vm', 
          humanReadable: 'The average DC voltage is roughly 31.8% of the peak AC input voltage (Vm = √2 × Vrms) across a resistive load.',
          calculation: (p, Vm) => ({
            expression: `${Vm.toFixed(1)} V / 3.1416`,
            value: (Vm / Math.PI).toFixed(1),
            unit: 'V'
          }),
          explanation: 'Average DC output over full 2π period.' 
        },
        { 
          name: 'RMS Output Voltage (V_rms)', 
          formula: 'V_rms = Vm / 2 = 0.5 × Vm', 
          humanReadable: 'Effective thermal heating voltage is exactly half (50%) of the peak AC voltage.',
          calculation: (p, Vm) => ({
            expression: `${Vm.toFixed(1)} V / 2`,
            value: (Vm / 2).toFixed(1),
            unit: 'V'
          }),
          explanation: 'Root mean square output voltage.' 
        },
        { 
          name: 'Peak Inverse Voltage (PIV)', 
          formula: 'PIV = Vm', 
          humanReadable: 'The diode must withstand the maximum negative AC peak voltage without breaking down.',
          calculation: (p, Vm) => ({
            expression: `√2 × ${p.vRms} V`,
            value: Vm.toFixed(1),
            unit: 'V'
          }),
          explanation: 'Maximum reverse voltage across the diode during negative half cycle.' 
        }
      ],
      notes: [
        'Freewheeling diode prevents negative output voltage spikes.',
        'High ripple factor (RF ≈ 1.21 for R load).',
        'Causes DC saturation in supply transformers due to net DC current.'
      ]
    }
  },
  {
    id: 'sp-full-wave-ct',
    category: 'single-phase',
    name: 'Center-Tapped Full Wave Rectifier',
    shortDescription: 'Two-diode full-wave rectifier utilizing a center-tapped transformer secondary.',
    badge: '1-Phase · 2 Diodes',
    defaultParams: {
      vRms: 230,
      frequency: 50,
      sourcePhase: 0,
      loadType: 'RL',
      rLoad: 12,
      lLoad: 25,
      eLoad: 0,
      hasFreewheeling: false,
      firingAngle: 0,
      pulseWidth: 10,
      gateDelay: 0,
      cycles: 4,
      timeStepUs: 20
    },
    paramConfigs: {
      hasControl: false,
      hasFreewheelingOption: false,
      supportsBackEmf: true,
      isThreePhase: false
    },
    theory: {
      summary: 'D1 conducts during positive half-cycle and D2 conducts during negative half-cycle through the transformer center tap. Produces twice the fundamental frequency ripple (100 Hz at 50 Hz supply). Peak inverse voltage across each diode is 2Vm.',
      formulas: [
        { 
          name: 'Average Output DC Voltage (V_avg)', 
          formula: 'V_avg = (2 × Vm) / π ≈ 0.6366 × Vm', 
          humanReadable: 'Both half-cycles are inverted to positive, delivering twice the average voltage of a half-wave rectifier (about 63.7% of peak AC).',
          calculation: (p, Vm) => ({
            expression: `(2 × ${Vm.toFixed(1)} V) / 3.1416`,
            value: ((2 * Vm) / Math.PI).toFixed(1),
            unit: 'V'
          }),
          explanation: 'Double the output voltage of a half-wave rectifier.' 
        },
        { 
          name: 'RMS Output Voltage (V_rms)', 
          formula: 'V_rms = Vm / √2 = V_supply(rms)', 
          humanReadable: 'The RMS load voltage equals the transformer secondary RMS voltage (230 V).',
          calculation: (p, Vm) => ({
            expression: `${Vm.toFixed(1)} V / 1.414`,
            value: (Vm / Math.SQRT2).toFixed(1),
            unit: 'V'
          }),
          explanation: 'Equivalent to full-wave sine RMS.' 
        },
        { 
          name: 'Peak Inverse Voltage (PIV)', 
          formula: 'PIV = 2 × Vm', 
          humanReadable: 'Each diode must endure twice the peak secondary voltage because the transformer center-tap acts as a neutral divider.',
          calculation: (p, Vm) => ({
            expression: `2 × ${Vm.toFixed(1)} V`,
            value: (2 * Vm).toFixed(1),
            unit: 'V'
          }),
          explanation: 'Diodes must withstand twice the secondary peak voltage.' 
        }
      ],
      notes: [
        'Requires a center-tapped transformer.',
        'Ripple frequency is 2fs (100 Hz for 50 Hz input).',
        'Transformer utilization factor (TUF) is approximately 0.672.'
      ]
    }
  },
  {
    id: 'sp-diode-bridge',
    category: 'single-phase',
    name: 'Single Phase Diode Bridge Rectifier',
    shortDescription: 'Four-diode bridge rectifier providing full-wave rectification without requiring a center tap.',
    badge: '1-Phase · 4 Diodes',
    defaultParams: {
      vRms: 230,
      frequency: 50,
      sourcePhase: 0,
      loadType: 'RL',
      rLoad: 10,
      lLoad: 35,
      eLoad: 0,
      hasFreewheeling: false,
      firingAngle: 0,
      pulseWidth: 10,
      gateDelay: 0,
      cycles: 4,
      timeStepUs: 20
    },
    paramConfigs: {
      hasControl: false,
      hasFreewheelingOption: false,
      supportsBackEmf: true,
      isThreePhase: false
    },
    theory: {
      summary: 'Diodes D1 & D2 conduct during the positive half-cycle; D3 & D4 conduct during the negative half-cycle. Peak inverse voltage per diode is Vm (half of center-tapped). Popular in DC power supplies and battery chargers.',
      formulas: [
        { 
          name: 'Average Output DC Voltage (V_avg)', 
          formula: 'V_avg = (2 × Vm) / π = 0.6366 × Vm', 
          humanReadable: 'Delivers full-wave DC output equivalent to 63.66% of the AC supply peak voltage.',
          calculation: (p, Vm) => ({
            expression: `(2 × ${Vm.toFixed(1)} V) / 3.1416`,
            value: ((2 * Vm) / Math.PI).toFixed(1),
            unit: 'V'
          }),
          explanation: 'Theoretical DC component across resistive load.' 
        },
        { 
          name: 'Ripple Factor (RF)', 
          formula: 'RF = √((V_rms / V_avg)² - 1) ≈ 0.482', 
          humanReadable: 'The AC ripple amplitude is 48.2% of the DC value (substantially smoother than half-wave ripple of 121%).',
          calculation: () => ({
            expression: `√((0.707 / 0.6366)² - 1)`,
            value: '0.482',
            unit: 'ratio'
          }),
          explanation: 'Much lower ripple than half wave (0.483 vs 1.21).' 
        },
        { 
          name: 'Diode Peak Inverse Voltage (PIV)', 
          formula: 'PIV = Vm', 
          humanReadable: 'Each diode only experiences one peak AC voltage (Vm), half the stress of a center-tapped transformer design.',
          calculation: (p, Vm) => ({
            expression: `√2 × ${p.vRms} V`,
            value: Vm.toFixed(1),
            unit: 'V'
          }),
          explanation: 'Each diode blocks peak supply voltage Vm.' 
        }
      ],
      notes: [
        'No center-tapped transformer needed.',
        'Two diode drops in the conduction path at any instant.',
        'Inductive load smooths ripple and maintains continuous current.'
      ]
    }
  },
  {
    id: 'sp-full-controlled',
    category: 'single-phase',
    name: 'Single Phase Fully Controlled Bridge',
    shortDescription: 'Full-wave converter using 4 thyristors (SCRs) offering variable DC voltage and inversion capability.',
    badge: '1-Phase · 4 Thyristors',
    defaultParams: {
      vRms: 230,
      frequency: 50,
      sourcePhase: 0,
      loadType: 'RL',
      rLoad: 10,
      lLoad: 40,
      eLoad: 0,
      hasFreewheeling: false,
      firingAngle: 45,
      pulseWidth: 15,
      gateDelay: 0,
      cycles: 4,
      timeStepUs: 20
    },
    paramConfigs: {
      hasControl: true,
      hasFreewheelingOption: false,
      supportsBackEmf: true,
      isThreePhase: false
    },
    theory: {
      summary: 'Thyristors T1 & T2 are fired at angle α in positive half-cycle; T3 & T4 at π + α in negative half-cycle. Operates in two quadrants (positive/negative voltage, positive current). For α < 90° it acts as a rectifier; for α > 90° with active DC source E it acts as a line-commutated inverter.',
      formulas: [
        { 
          name: 'Average Controlled DC Voltage (V_avg)', 
          formula: 'V_avg = (2 × Vm / π) × cos(α)', 
          humanReadable: 'Output DC voltage varies smoothly with cos(α). At α = 0° it gives max DC (+207V), at α = 90° it reaches 0V, and for α > 90° it becomes negative (inverter mode).',
          calculation: (p, Vm) => {
            const rad = (p.firingAngle * Math.PI) / 180;
            const val = ((2 * Vm) / Math.PI) * Math.cos(rad);
            return {
              expression: `(2 × ${Vm.toFixed(1)} / π) × cos(${p.firingAngle}°)`,
              value: val.toFixed(1),
              unit: 'V'
            };
          },
          explanation: 'Controllable from +2Vm/π to -2Vm/π.' 
        },
        { 
          name: 'Displacement Power Factor (DPF)', 
          formula: 'DPF = cos(α)', 
          humanReadable: 'The fundamental input AC current lags the voltage by exactly the firing angle delay α.',
          calculation: (p) => {
            const rad = (p.firingAngle * Math.PI) / 180;
            return {
              expression: `cos(${p.firingAngle}°)`,
              value: Math.cos(rad).toFixed(3),
              unit: 'lagging'
            };
          },
          explanation: 'Input current displacement angle equals firing delay α.' 
        },
        { 
          name: 'RMS Voltage (Continuous)', 
          formula: 'V_rms = Vm / √2 = V_supply(rms)', 
          humanReadable: 'Because current is continuous, the RMS load voltage stays identical to the AC supply RMS voltage regardless of firing angle.',
          calculation: (p, Vm) => ({
            expression: `${Vm.toFixed(1)} V / 1.414`,
            value: (Vm / Math.SQRT2).toFixed(1),
            unit: 'V'
          }),
          explanation: 'RMS voltage is independent of α under continuous conduction.' 
        }
      ],
      notes: [
        'Requires continuous gate trigger or dual pulses.',
        'At α > 90° power flows from DC back into AC grid (inversion mode).',
        'Inductive load maintains conduction into negative voltage territory.'
      ]
    }
  },
  {
    id: 'sp-semi-controlled',
    category: 'single-phase',
    name: 'Single Phase Semi-Controlled Bridge',
    shortDescription: 'Hybrid bridge with 2 thyristors and 2 diodes, providing higher power factor and inherent freewheeling.',
    badge: '1-Phase · 2 SCR + 2 Diode',
    defaultParams: {
      vRms: 230,
      frequency: 50,
      sourcePhase: 0,
      loadType: 'RL',
      rLoad: 10,
      lLoad: 30,
      eLoad: 0,
      hasFreewheeling: true,
      firingAngle: 60,
      pulseWidth: 15,
      gateDelay: 0,
      cycles: 4,
      timeStepUs: 20
    },
    paramConfigs: {
      hasControl: true,
      hasFreewheelingOption: true,
      supportsBackEmf: true,
      isThreePhase: false
    },
    theory: {
      summary: 'Also known as a half-controlled converter. Uses 2 SCRs in upper legs and 2 diodes in lower legs. Diodes provide natural freewheeling path at zero crossings, preventing the load voltage from turning negative.',
      formulas: [
        { name: 'Average Voltage', formula: 'V_{avg} = \\frac{V_m}{\\pi} (1 + \\cos\\alpha)', explanation: 'Always non-negative (one-quadrant operation).' },
        { name: 'RMS Voltage', formula: 'V_{rms} = \\frac{V_m}{\\sqrt{2}} \\sqrt{\\frac{\\pi - \\alpha + \\frac{1}{2}\\sin 2\\alpha}{\\pi}}', explanation: 'Decreases as firing angle α increases.' },
        { name: 'Input Power Factor', formula: 'PF \\approx \\sqrt{\\frac{2}{\\pi(\\pi - \\alpha)}} (1 + \\cos\\alpha)', explanation: 'Higher power factor than fully controlled converter.' }
      ],
      notes: [
        'Single quadrant operation only (Vo ≥ 0, Io ≥ 0).',
        'Cannot operate in regenerative inverter mode.',
        'Significantly reduced reactive power consumption compared to fully controlled bridge.'
      ]
    }
  },

  // ==========================================
  // THREE PHASE
  // ==========================================
  {
    id: 'tp-half-wave',
    category: 'three-phase',
    name: 'Three Phase Half Wave Rectifier',
    shortDescription: 'Star-connected 3-diode rectifier where each diode conducts for 120° per cycle.',
    badge: '3-Phase · 3 Diodes',
    defaultParams: {
      vRms: 230,
      frequency: 50,
      sourcePhase: 0,
      loadType: 'RL',
      rLoad: 15,
      lLoad: 20,
      eLoad: 0,
      hasFreewheeling: false,
      firingAngle: 0,
      pulseWidth: 10,
      gateDelay: 0,
      cycles: 3,
      timeStepUs: 20
    },
    paramConfigs: {
      hasControl: false,
      hasFreewheelingOption: false,
      supportsBackEmf: true,
      isThreePhase: true
    },
    theory: {
      summary: 'Each diode conducts when its corresponding phase voltage is more positive than the other two phases. Conduction angle per diode is 2π/3 (120°). Output ripple frequency is 3fs (150 Hz).',
      formulas: [
        { name: 'Average Voltage', formula: 'V_{avg} = \\frac{3\\sqrt{3} V_m}{2\\pi} \\approx 0.827 V_m', explanation: 'Vm is peak phase voltage (√2 * Vrms).' },
        { name: 'RMS Voltage', formula: 'V_{rms} = V_m \\sqrt{\\frac{1}{2} + \\frac{3\\sqrt{3}}{8\\pi}} \\approx 0.8407 V_m', explanation: 'Significantly lower ripple than single-phase.' },
        { name: 'Ripple Frequency', formula: 'f_{ripple} = 3 f = 150 \\text{ Hz}', explanation: '3 pulses per fundamental cycle.' }
      ],
      notes: [
        'Requires neutral wire for return current.',
        'Produces DC magnetization in supply transformer core.',
        'Rarely used in high power due to transformer DC bias; superseded by 6-pulse bridge.'
      ]
    }
  },
  {
    id: 'tp-six-pulse-diode',
    category: 'three-phase',
    name: 'Three Phase Six-Pulse Diode Bridge',
    shortDescription: 'Standard industrial 6-diode rectifier converting 3-phase AC to smooth DC with 300 Hz ripple.',
    badge: '3-Phase · 6 Diodes',
    defaultParams: {
      vRms: 230,
      frequency: 50,
      sourcePhase: 0,
      loadType: 'RL',
      rLoad: 15,
      lLoad: 25,
      eLoad: 0,
      hasFreewheeling: false,
      firingAngle: 0,
      pulseWidth: 10,
      gateDelay: 0,
      cycles: 3,
      timeStepUs: 20
    },
    paramConfigs: {
      hasControl: false,
      hasFreewheelingOption: false,
      supportsBackEmf: true,
      isThreePhase: true
    },
    theory: {
      summary: 'Six diodes arranged in upper and lower commutating groups. At any moment, the diode connected to the most positive phase conducts on top, and the diode connected to the most negative conducts on bottom. Six commutations per fundamental cycle.',
      formulas: [
        { name: 'Average Output Voltage', formula: 'V_{avg} = \\frac{3\\sqrt{3} V_m}{\\pi} = \\frac{3 V_{m(LL)}}{\\pi} \\approx 1.654 V_m', explanation: '1.35 times line-to-line RMS voltage.' },
        { name: 'Ripple Factor', formula: 'RF = \\sqrt{\\left(\\frac{V_{rms}}{V_{avg}}\\right)^2 - 1} = 0.042 \\; (4.2\\%)', explanation: 'Virtually pure DC even without filtering.' },
        { name: 'Input THD (Ideal)', formula: 'THD_i = \\sqrt{\\frac{\\pi^2}{9} - 1} \\approx 31.08\\%', explanation: 'Input line current exhibits quasi-square stepped shape.' }
      ],
      notes: [
        'Workhorse topology in industrial VFDs (Variable Frequency Drives).',
        'No neutral line required.',
        'Characteristic AC line harmonics: 5th, 7th, 11th, 13th (6k ± 1).'
      ]
    }
  },
  {
    id: 'tp-full-controlled',
    category: 'three-phase',
    name: 'Three Phase Fully Controlled Bridge',
    shortDescription: 'Six-thyristor Graetz bridge providing full four-quadrant regenerative control for DC drives.',
    badge: '3-Phase · 6 Thyristors',
    defaultParams: {
      vRms: 230,
      frequency: 50,
      sourcePhase: 0,
      loadType: 'RL',
      rLoad: 12,
      lLoad: 30,
      eLoad: 0,
      hasFreewheeling: false,
      firingAngle: 40,
      pulseWidth: 15,
      gateDelay: 0,
      cycles: 3,
      timeStepUs: 20
    },
    paramConfigs: {
      hasControl: true,
      hasFreewheelingOption: false,
      supportsBackEmf: true,
      isThreePhase: true
    },
    theory: {
      summary: 'Six SCRs fired in numerical sequence (T1-T6) every 60°. Natural commutation occurs at phase voltage intersections shifted by firing angle α. In continuous conduction, output voltage polarity reverses when α > 90°, allowing regenerative braking.',
      formulas: [
        { name: 'Average Voltage (Continuous)', formula: 'V_{avg} = \\frac{3\\sqrt{3} V_m}{\\pi} \\cos\\alpha \\approx 1.654 V_m \\cos\\alpha', explanation: 'Linearly dependent on cos(α).' },
        { name: 'RMS Output Voltage', formula: 'V_{rms} = \\sqrt{3} V_m \\sqrt{\\frac{1}{2} + \\frac{3\\sqrt{3}}{4\\pi} \\cos 2\\alpha}', explanation: 'Calculated over 60° commutation intervals.' },
        { name: 'Inverter Limit Margin', formula: '\\alpha_{max} \\approx 150^\\circ - 165^\\circ', explanation: 'Safety margin prevents commutation failure in inverter mode.' }
      ],
      notes: [
        'Used in large DC motor drives and HVDC transmission converter stations.',
        'Requires double-pulse firing scheme to initiate conduction.',
        'Power factor is approximately cos(α).'
      ]
    }
  },
  {
    id: 'tp-semi-controlled',
    category: 'three-phase',
    name: 'Three Phase Semi-Controlled Bridge',
    shortDescription: 'Hybrid 3-phase bridge with 3 SCRs in upper group and 3 diodes in lower group.',
    badge: '3-Phase · 3 SCR + 3 Diode',
    defaultParams: {
      vRms: 230,
      frequency: 50,
      sourcePhase: 0,
      loadType: 'RL',
      rLoad: 12,
      lLoad: 25,
      eLoad: 0,
      hasFreewheeling: true,
      firingAngle: 50,
      pulseWidth: 15,
      gateDelay: 0,
      cycles: 3,
      timeStepUs: 20
    },
    paramConfigs: {
      hasControl: true,
      hasFreewheelingOption: true,
      supportsBackEmf: true,
      isThreePhase: true
    },
    theory: {
      summary: 'Combines 3 controlled thyristors on the positive rail with 3 uncontrolled diodes on the negative rail. Provides variable DC output without the cost of 6 gating circuits, with improved displacement power factor.',
      formulas: [
        { name: 'Average Voltage', formula: 'V_{avg} = \\frac{3\\sqrt{3} V_m}{2\\pi} (1 + \\cos\\alpha)', explanation: 'Valid for 0° ≤ α ≤ 180°.' },
        { name: 'Conduction Boundary', formula: '\\alpha \\le 60^\\circ \\text{ vs } \\alpha > 60^\\circ', explanation: 'For α > 60°, freewheeling periods appear in output waveform.' }
      ],
      notes: [
        'One quadrant converter only.',
        'Economical alternative for unidirectional speed control.',
        'Simpler gate drive circuit requirement.'
      ]
    }
  },

  // ==========================================
  // AC CONTROLLERS
  // ==========================================
  {
    id: 'sp-tcr',
    category: 'ac-controller',
    name: 'Single Phase TCR / AC Controller',
    shortDescription: 'Back-to-back anti-parallel thyristors controlling AC RMS voltage or inductive reactance.',
    badge: 'AC Control · 2 SCRs',
    defaultParams: {
      vRms: 230,
      frequency: 50,
      sourcePhase: 0,
      loadType: 'RL',
      rLoad: 10,
      lLoad: 30,
      eLoad: 0,
      hasFreewheeling: false,
      firingAngle: 65,
      pulseWidth: 15,
      gateDelay: 0,
      cycles: 4,
      timeStepUs: 20
    },
    paramConfigs: {
      hasControl: true,
      hasFreewheelingOption: false,
      supportsBackEmf: false,
      isThreePhase: false
    },
    theory: {
      summary: 'Two thyristors connected in anti-parallel (inverse parallel) in series between AC supply and load. T1 is fired in positive half-cycle at α and T2 is fired in negative half-cycle at π + α. Output is phase-chopped AC.',
      formulas: [
        { name: 'RMS Output Voltage (R Load)', formula: 'V_{o(rms)} = V_{rms} \\sqrt{\\frac{1}{\\pi} \\left( \\pi - \\alpha + \\frac{\\sin 2\\alpha}{2} \\right)}', explanation: 'Smoothly adjusts RMS from Vrms down to 0 as α varies 0° to 180°.' },
        { name: 'Effective Reactance in TCR', formula: 'X_L(\\alpha) = \\frac{\\pi X_L}{2(\\pi - \\alpha) + \\sin 2\\alpha}', explanation: 'Equivalent fundamental reactive impedance in FACTS systems.' }
      ],
      notes: [
        'Key building block of FACTS (Flexible AC Transmission Systems) and light dimmers.',
        'Introduces odd harmonics (3rd, 5th, 7th) into the AC supply.',
        'For inductive loads, firing angle must satisfy α ≥ φ (where φ = arctan(ωL/R)).'
      ]
    }
  },
  {
    id: 'tp-tcr',
    category: 'ac-controller',
    name: 'Three Phase TCR / AC Controller',
    shortDescription: 'Three-phase symmetrical AC voltage regulator with 3 pairs of anti-parallel thyristors.',
    badge: '3-Phase AC Control',
    defaultParams: {
      vRms: 230,
      frequency: 50,
      sourcePhase: 0,
      loadType: 'R',
      rLoad: 15,
      lLoad: 20,
      eLoad: 0,
      hasFreewheeling: false,
      firingAngle: 60,
      pulseWidth: 15,
      gateDelay: 0,
      cycles: 3,
      timeStepUs: 20
    },
    paramConfigs: {
      hasControl: true,
      hasFreewheelingOption: false,
      supportsBackEmf: false,
      isThreePhase: true
    },
    theory: {
      summary: 'Used for soft-starting 3-phase induction motors, electric arc furnace regulation, and static VAR compensation (SVC). Provides stepless RMS voltage control across all three balanced phases.',
      formulas: [
        { name: 'Control Range', formula: '0^\\circ \\le \\alpha \\le 150^\\circ', explanation: 'Complete conduction extinction occurs around α = 150° for star loads.' },
        { name: 'Line Harmonic Suppression', formula: 'I_{h=3k} = 0 \\text{ in delta/isolated star}', explanation: 'Triplen harmonics (3rd, 9th, 15th) cannot circulate in line currents.' }
      ],
      notes: [
        'Industrial standard for induction motor soft-starters.',
        'Zero-voltage crossing synchronization required on all 3 phases.',
        'Eliminates inrush currents at equipment startup.'
      ]
    }
  },

  // ==========================================
  // DUAL CONVERTER
  // ==========================================
  {
    id: 'sp-dual-converter',
    category: 'dual-converter',
    name: 'Single Phase Dual Converter',
    shortDescription: 'Two back-to-back full converters providing four-quadrant DC speed control and regenerative braking.',
    badge: '4-Quadrant · Double Bridge',
    defaultParams: {
      vRms: 230,
      frequency: 50,
      sourcePhase: 0,
      loadType: 'RLE',
      rLoad: 8,
      lLoad: 30,
      eLoad: 48,
      hasFreewheeling: false,
      firingAngle: 45,
      firingAngle2: 135,
      pulseWidth: 15,
      gateDelay: 0,
      dualMode: 'circulating',
      circulatingL: 15,
      cycles: 4,
      timeStepUs: 20
    },
    paramConfigs: {
      hasControl: true,
      hasFreewheelingOption: false,
      hasDualControl: true,
      supportsBackEmf: true,
      isThreePhase: false
    },
    theory: {
      summary: 'Consists of two full converters: Converter 1 provides positive current (+Io) and Converter 2 provides negative current (-Io). The firing angles are linked by α1 + α2 = 180° so their average DC terminal voltages match: Vdc1 = -Vdc2. Circulating current reactors (L_r) limit instantaneous ripple currents.',
      formulas: [
        { name: 'Firing Angle Constraint', formula: '\\alpha_1 + \\alpha_2 = 180^\\circ', explanation: 'Ensures equal average output voltages: V_{o1} + V_{o2} = 0.' },
        { name: 'Bridge 1 Voltage', formula: 'V_{o1} = \\frac{2V_m}{\\pi} \\cos\\alpha_1', explanation: 'Positive bridge average output.' },
        { name: 'Bridge 2 Voltage', formula: 'V_{o2} = \\frac{2V_m}{\\pi} \\cos\\alpha_2 = -\\frac{2V_m}{\\pi} \\cos\\alpha_1', explanation: 'Negative bridge average output.' }
      ],
      notes: [
        'Enables smooth 4-quadrant operation: forward drive, forward regeneration, reverse drive, reverse regeneration.',
        'Circulating current mode gives faster dynamic torque response without deadband.',
        'Non-circulating current mode requires interlock logic and a 5-10 ms zero-current deadband.'
      ]
    }
  },
  {
    id: 'tp-dual-converter',
    category: 'dual-converter',
    name: 'Three Phase Dual Converter',
    shortDescription: 'High-power dual 6-pulse thyristor converter for heavy industrial reversible rolling mills and hoists.',
    badge: 'High Power · 12 Thyristors',
    defaultParams: {
      vRms: 230,
      frequency: 50,
      sourcePhase: 0,
      loadType: 'RLE',
      rLoad: 6,
      lLoad: 25,
      eLoad: 60,
      hasFreewheeling: false,
      firingAngle: 40,
      firingAngle2: 140,
      pulseWidth: 15,
      gateDelay: 0,
      dualMode: 'circulating',
      circulatingL: 10,
      cycles: 3,
      timeStepUs: 20
    },
    paramConfigs: {
      hasControl: true,
      hasFreewheelingOption: false,
      hasDualControl: true,
      supportsBackEmf: true,
      isThreePhase: true
    },
    theory: {
      summary: 'Comprises two 3-phase full converters (12 thyristors total). Converter 1 operates as a rectifier while Converter 2 operates as an inverter. The 6-pulse output yields minimal ripple and instantaneous torque reversal.',
      formulas: [
        { name: 'Three-Phase DC Voltage', formula: 'V_{o1} = \\frac{3\\sqrt{3} V_m}{\\pi} \\cos\\alpha_1 = -V_{o2}', explanation: 'Matched average terminal voltages.' },
        { name: 'Circulating Reactor Current', formula: 'i_{circ}(t) = \\frac{1}{2 L_r} \\int (v_{o1}(t) - v_{o2}(t)) \\, dt', explanation: 'Current limited by center-tapped reactor L_r.' }
      ],
      notes: [
        'Standard drive topology for heavy steel rolling mills and mine winders.',
        'Seamless transition through zero current.',
        'Low harmonic ripple (6th harmonic fundamental in DC link).'
      ]
    }
  }
];

export const CIRCUIT_CATEGORIES = [
  { id: 'single-phase', name: 'Single Phase', icon: 'Zap' },
  { id: 'three-phase', name: 'Three Phase', icon: 'Network' },
  { id: 'ac-controller', name: 'AC Controllers', icon: 'Sliders' },
  { id: 'dual-converter', name: 'Dual Converter', icon: 'Repeat' },
];
