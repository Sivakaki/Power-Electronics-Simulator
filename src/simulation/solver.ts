import { 
  CircuitParameters, 
  SimulationSample, 
  SimulationMeasurements, 
  DeviceState 
} from '../types/circuit';
import { calculateHarmonics } from './fft';

export function runSimulation(
  circuitId: string, 
  params: CircuitParameters
): { samples: SimulationSample[]; measurements: SimulationMeasurements } {
  const {
    vRms: sourceVRms,
    frequency,
    sourcePhase = 0,
    loadType,
    rLoad = 10,
    lLoad = 20, // mH
    eLoad = 0,  // Volts
    hasFreewheeling = false,
    firingAngle = 30, // deg
    firingAngle2 = 150,
    pulseWidth = 10,
    dualMode = 'non-circulating',
    cycles = 4,
    timeStepUs = 20
  } = params;

  const f = Math.max(1, frequency);
  const omega = 2 * Math.PI * f;
  const Vm = Math.SQRT2 * sourceVRms;
  const T = 1 / f;
  const totalDuration = cycles * T;
  const dt = Math.max(1e-6, timeStepUs * 1e-6); // seconds
  const totalSteps = Math.min(20000, Math.floor(totalDuration / dt));

  const R = Math.max(0.1, rLoad);
  const L = Math.max(1e-4, (loadType === 'RL' || loadType === 'RLE' || circuitId.includes('tcr')) ? lLoad * 1e-3 : 1e-5);
  const E = (loadType === 'RLE' || circuitId.includes('dual')) ? eLoad : 0;

  const alphaRad = (firingAngle * Math.PI) / 180;
  const alpha2Rad = ((firingAngle2 || (180 - firingAngle)) * Math.PI) / 180;
  const pwRad = (Math.max(1, pulseWidth) * Math.PI) / 180;
  const phaseRad = (sourcePhase * Math.PI) / 180;

  const samples: SimulationSample[] = [];

  // State variables
  let iL = 0;           // Inductor current
  let prevVo = 0;
  let scr1On = false;
  let scr2On = false;
  let scr3On = false;
  let scr4On = false;
  let scr5On = false;
  let scr6On = false;
  let diodeFwOn = false;

  for (let step = 0; step <= totalSteps; step++) {
    const t = step * dt;
    const theta = (omega * t + phaseRad) % (2 * Math.PI);
    const thetaNorm = theta < 0 ? theta + 2 * Math.PI : theta;

    // AC source voltages
    const vs = Vm * Math.sin(omega * t + phaseRad);
    const vs_b = Vm * Math.sin(omega * t + phaseRad - (2 * Math.PI) / 3);
    const vs_c = Vm * Math.sin(omega * t + phaseRad + (2 * Math.PI) / 3);

    // Line-to-line voltages for 3-phase
    const vab = vs - vs_b;
    const vbc = vs_b - vs_c;
    const vca = vs_c - vs;

    let vo = 0;
    let is = 0;
    let is_b = 0;
    let is_c = 0;
    let gate1 = 0;
    let gate2 = 0;
    let gate3 = 0;
    let vDev1 = 0;
    let iDev1 = 0;
    const devStates: Record<string, DeviceState> = {};

    // Determine gate trigger pulses
    const isGateTrigger = (firingTheta: number) => {
      const diff = (thetaNorm - firingTheta + 2 * Math.PI) % (2 * Math.PI);
      return diff >= 0 && diff <= pwRad;
    };

    switch (circuitId) {
      // ==========================================
      // 1. Single Phase Half Wave Rectifier
      // ==========================================
      case 'sp-half-wave': {
        const canConductForward = vs > E;
        if (canConductForward || iL > 0.001) {
          if (hasFreewheeling && vs < 0 && iL > 0) {
            // Freewheeling diode conducts
            vo = 0;
            diodeFwOn = true;
            is = 0;
            vDev1 = vs; // Diode 1 blocked
            iDev1 = 0;
          } else if (vs >= 0 || (!hasFreewheeling && iL > 0)) {
            // Main diode conducts
            vo = vs;
            diodeFwOn = false;
            is = iL;
            vDev1 = 0.7;
            iDev1 = iL;
          } else {
            vo = E;
            diodeFwOn = false;
            is = 0;
            vDev1 = vs - E;
            iDev1 = 0;
          }
        } else {
          vo = E;
          diodeFwOn = false;
          is = 0;
          vDev1 = vs - E;
          iDev1 = 0;
        }

        devStates['D1'] = {
          id: 'D1',
          name: 'Main Diode D1',
          type: 'diode',
          isConduction: iDev1 > 0.01,
          voltage: vDev1,
          current: iDev1
        };
        if (hasFreewheeling) {
          devStates['DFW'] = {
            id: 'DFW',
            name: 'Freewheeling DFW',
            type: 'diode',
            isConduction: diodeFwOn,
            voltage: diodeFwOn ? 0.7 : -vo,
            current: diodeFwOn ? iL : 0
          };
        }
        break;
      }

      // ==========================================
      // 2. Full Wave Center-Tapped Rectifier
      // ==========================================
      case 'sp-full-wave-ct': {
        // vSec1 = vs, vSec2 = -vs
        const d1Forward = vs > 0;
        const d2Forward = -vs > 0;

        if (d1Forward) {
          vo = vs;
          is = iL;
          vDev1 = 0.7;
          iDev1 = iL;
        } else if (d2Forward) {
          vo = -vs;
          is = -iL;
          vDev1 = 2 * vs; // Reverse voltage across D1 is 2*Vm
          iDev1 = 0;
        } else {
          vo = 0;
          is = 0;
        }

        devStates['D1'] = {
          id: 'D1',
          name: 'Diode D1 (+Half)',
          type: 'diode',
          isConduction: d1Forward && iL > 0.01,
          voltage: d1Forward ? 0.7 : 2 * vs,
          current: d1Forward ? iL : 0
        };
        devStates['D2'] = {
          id: 'D2',
          name: 'Diode D2 (-Half)',
          type: 'diode',
          isConduction: d2Forward && iL > 0.01,
          voltage: d2Forward ? 0.7 : -2 * vs,
          current: d2Forward ? iL : 0
        };
        break;
      }

      // ==========================================
      // 3. Single Phase Diode Bridge Rectifier
      // ==========================================
      case 'sp-diode-bridge': {
        const absVs = Math.abs(vs);
        vo = absVs;
        is = vs >= 0 ? iL : -iL;

        const d12Cond = vs >= 0 && iL > 0.01;
        const d34Cond = vs < 0 && iL > 0.01;
        vDev1 = d12Cond ? 0.7 : -absVs;
        iDev1 = d12Cond ? iL : 0;

        devStates['D1'] = { id: 'D1', name: 'Diode D1', type: 'diode', isConduction: d12Cond, voltage: vDev1, current: iDev1 };
        devStates['D2'] = { id: 'D2', name: 'Diode D2', type: 'diode', isConduction: d12Cond, voltage: vDev1, current: iDev1 };
        devStates['D3'] = { id: 'D3', name: 'Diode D3', type: 'diode', isConduction: d34Cond, voltage: d34Cond ? 0.7 : -absVs, current: d34Cond ? iL : 0 };
        devStates['D4'] = { id: 'D4', name: 'Diode D4', type: 'diode', isConduction: d34Cond, voltage: d34Cond ? 0.7 : -absVs, current: d34Cond ? iL : 0 };
        break;
      }

      // ==========================================
      // 4. Single Phase Fully Controlled Bridge
      // ==========================================
      case 'sp-full-controlled': {
        const g1 = isGateTrigger(alphaRad);
        const g2 = isGateTrigger((alphaRad + Math.PI) % (2 * Math.PI));
        gate1 = g1 ? 1 : 0;
        gate2 = g2 ? 1 : 0;

        if (g1 && vs > 0) {
          scr1On = true;
          scr2On = false;
        } else if (g2 && vs < 0) {
          scr2On = true;
          scr1On = false;
        }

        if (scr1On) {
          vo = vs;
          is = iL;
          if (iL <= 0 && vs < 0 && !g1) {
            scr1On = false;
            vo = E;
            is = 0;
          }
        } else if (scr2On) {
          vo = -vs;
          is = -iL;
          if (iL <= 0 && vs > 0 && !g2) {
            scr2On = false;
            vo = E;
            is = 0;
          }
        } else {
          vo = E;
          is = 0;
        }

        vDev1 = scr1On ? 1.2 : vs;
        iDev1 = scr1On ? iL : 0;

        devStates['T1'] = { id: 'T1', name: 'SCR T1', type: 'scr', isConduction: scr1On, isGated: !!g1, voltage: scr1On ? 1.2 : -vs, current: scr1On ? iL : 0 };
        devStates['T2'] = { id: 'T2', name: 'SCR T2', type: 'scr', isConduction: scr1On, isGated: !!g1, voltage: scr1On ? 1.2 : -vs, current: scr1On ? iL : 0 };
        devStates['T3'] = { id: 'T3', name: 'SCR T3', type: 'scr', isConduction: scr2On, isGated: !!g2, voltage: scr2On ? 1.2 : vs, current: scr2On ? iL : 0 };
        devStates['T4'] = { id: 'T4', name: 'SCR T4', type: 'scr', isConduction: scr2On, isGated: !!g2, voltage: scr2On ? 1.2 : vs, current: scr2On ? iL : 0 };
        break;
      }

      // ==========================================
      // 5. Single Phase Semi-Controlled Bridge
      // ==========================================
      case 'sp-semi-controlled': {
        const g1 = isGateTrigger(alphaRad);
        const g2 = isGateTrigger((alphaRad + Math.PI) % (2 * Math.PI));
        gate1 = g1 ? 1 : 0;
        gate2 = g2 ? 1 : 0;

        if (thetaNorm >= alphaRad && thetaNorm < Math.PI) {
          vo = vs;
          is = iL;
          scr1On = true;
          scr2On = false;
        } else if (thetaNorm >= Math.PI && thetaNorm < Math.PI + alphaRad) {
          // Freewheeling via D2 and T1 (or freewheel diodes)
          vo = 0;
          is = 0;
          scr1On = true;
          scr2On = false;
        } else if (thetaNorm >= Math.PI + alphaRad && thetaNorm < 2 * Math.PI) {
          vo = -vs;
          is = -iL;
          scr1On = false;
          scr2On = true;
        } else {
          // Freewheeling interval 0 to alpha
          vo = 0;
          is = 0;
          scr1On = false;
          scr2On = true;
        }

        vDev1 = scr1On ? 1.2 : vs;
        iDev1 = scr1On ? iL : 0;

        devStates['T1'] = { id: 'T1', name: 'SCR T1', type: 'scr', isConduction: scr1On, isGated: !!g1, voltage: scr1On ? 1.2 : vs, current: scr1On ? iL : 0 };
        devStates['T2'] = { id: 'T2', name: 'SCR T2', type: 'scr', isConduction: scr2On, isGated: !!g2, voltage: scr2On ? 1.2 : -vs, current: scr2On ? iL : 0 };
        devStates['D1'] = { id: 'D1', name: 'Diode D1', type: 'diode', isConduction: scr2On, voltage: 0.7, current: scr2On ? iL : 0 };
        devStates['D2'] = { id: 'D2', name: 'Diode D2', type: 'diode', isConduction: scr1On, voltage: 0.7, current: scr1On ? iL : 0 };
        break;
      }

      // ==========================================
      // 6. Three Phase Half Wave Rectifier
      // ==========================================
      case 'tp-half-wave': {
        // Star-connected 3 diodes; highest phase conducts
        const maxV = Math.max(vs, vs_b, vs_c);
        vo = maxV;
        if (maxV === vs) {
          is = iL;
          is_b = 0;
          is_c = 0;
          vDev1 = 0.7;
          iDev1 = iL;
        } else if (maxV === vs_b) {
          is = 0;
          is_b = iL;
          is_c = 0;
          vDev1 = vs - vs_b;
          iDev1 = 0;
        } else {
          is = 0;
          is_b = 0;
          is_c = iL;
          vDev1 = vs - vs_c;
          iDev1 = 0;
        }

        devStates['Da'] = { id: 'Da', name: 'Diode Phase A', type: 'diode', isConduction: maxV === vs, voltage: vDev1, current: is };
        devStates['Db'] = { id: 'Db', name: 'Diode Phase B', type: 'diode', isConduction: maxV === vs_b, voltage: maxV === vs_b ? 0.7 : vs_b - maxV, current: is_b };
        devStates['Dc'] = { id: 'Dc', name: 'Diode Phase C', type: 'diode', isConduction: maxV === vs_c, voltage: maxV === vs_c ? 0.7 : vs_c - maxV, current: is_c };
        break;
      }

      // ==========================================
      // 7. Three Phase Six-Pulse Diode Bridge
      // ==========================================
      case 'tp-six-pulse-diode': {
        const topMax = Math.max(vs, vs_b, vs_c);
        const botMin = Math.min(vs, vs_b, vs_c);
        vo = topMax - botMin;

        // Line currents
        is = (topMax === vs ? iL : 0) - (botMin === vs ? iL : 0);
        is_b = (topMax === vs_b ? iL : 0) - (botMin === vs_b ? iL : 0);
        is_c = (topMax === vs_c ? iL : 0) - (botMin === vs_c ? iL : 0);

        vDev1 = topMax === vs ? 0.7 : vs - topMax;
        iDev1 = topMax === vs ? iL : 0;

        devStates['D1'] = { id: 'D1', name: 'Diode D1 (Top A)', type: 'diode', isConduction: topMax === vs, voltage: vDev1, current: topMax === vs ? iL : 0 };
        devStates['D3'] = { id: 'D3', name: 'Diode D3 (Top B)', type: 'diode', isConduction: topMax === vs_b, voltage: topMax === vs_b ? 0.7 : vs_b - topMax, current: topMax === vs_b ? iL : 0 };
        devStates['D5'] = { id: 'D5', name: 'Diode D5 (Top C)', type: 'diode', isConduction: topMax === vs_c, voltage: topMax === vs_c ? 0.7 : vs_c - topMax, current: topMax === vs_c ? iL : 0 };
        devStates['D4'] = { id: 'D4', name: 'Diode D4 (Bot A)', type: 'diode', isConduction: botMin === vs, voltage: botMin === vs ? 0.7 : vs - botMin, current: botMin === vs ? iL : 0 };
        devStates['D6'] = { id: 'D6', name: 'Diode D6 (Bot B)', type: 'diode', isConduction: botMin === vs_b, voltage: botMin === vs_b ? 0.7 : vs_b - botMin, current: botMin === vs_b ? iL : 0 };
        devStates['D2'] = { id: 'D2', name: 'Diode D2 (Bot C)', type: 'diode', isConduction: botMin === vs_c, voltage: botMin === vs_c ? 0.7 : vs_c - botMin, current: botMin === vs_c ? iL : 0 };
        break;
      }

      // ==========================================
      // 8. Three Phase Fully Controlled Bridge
      // ==========================================
      case 'tp-full-controlled': {
        // Standard 6-pulse thyristor firing: intervals of 60 deg shifted by alpha
        // T1: 30°+α, T2: 90°+α, T3: 150°+α, T4: 210°+α, T5: 270°+α, T6: 330°+α
        const baseAngle = (thetaNorm - Math.PI / 6 - alphaRad + 4 * Math.PI) % (2 * Math.PI);
        const sector = Math.floor(baseAngle / (Math.PI / 3)); // 0 to 5

        switch (sector) {
          case 0: vo = vab; is = iL; is_b = -iL; is_c = 0; scr1On = true; scr6On = true; break; // T1 & T6
          case 1: vo = -vca; is = iL; is_b = 0; is_c = -iL; scr1On = true; scr2On = true; break; // T1 & T2 (v_ac = -vca)
          case 2: vo = vbc; is = 0; is_b = iL; is_c = -iL; scr3On = true; scr2On = true; break; // T3 & T2
          case 3: vo = -vab; is = -iL; is_b = iL; is_c = 0; scr3On = true; scr4On = true; break; // T3 & T4 (v_ba = -vab)
          case 4: vo = vca; is = -iL; is_b = 0; is_c = iL; scr5On = true; scr4On = true; break; // T5 & T4
          case 5: vo = -vbc; is = 0; is_b = -iL; is_c = iL; scr5On = true; scr6On = true; break; // T5 & T6 (v_cb = -vbc)
          default: vo = vab; is = iL; is_b = -iL; is_c = 0;
        }

        const t1Gate = isGateTrigger((Math.PI / 6 + alphaRad) % (2 * Math.PI));
        gate1 = t1Gate ? 1 : 0;
        vDev1 = scr1On ? 1.2 : -vab;
        iDev1 = scr1On ? iL : 0;

        devStates['T1'] = { id: 'T1', name: 'SCR T1', type: 'scr', isConduction: sector === 0 || sector === 1, isGated: !!t1Gate, voltage: sector === 0 || sector === 1 ? 1.2 : -vab, current: sector === 0 || sector === 1 ? iL : 0 };
        devStates['T2'] = { id: 'T2', name: 'SCR T2', type: 'scr', isConduction: sector === 1 || sector === 2, voltage: 1.2, current: sector === 1 || sector === 2 ? iL : 0 };
        devStates['T3'] = { id: 'T3', name: 'SCR T3', type: 'scr', isConduction: sector === 2 || sector === 3, voltage: 1.2, current: sector === 2 || sector === 3 ? iL : 0 };
        devStates['T4'] = { id: 'T4', name: 'SCR T4', type: 'scr', isConduction: sector === 3 || sector === 4, voltage: 1.2, current: sector === 3 || sector === 4 ? iL : 0 };
        devStates['T5'] = { id: 'T5', name: 'SCR T5', type: 'scr', isConduction: sector === 4 || sector === 5, voltage: 1.2, current: sector === 4 || sector === 5 ? iL : 0 };
        devStates['T6'] = { id: 'T6', name: 'SCR T6', type: 'scr', isConduction: sector === 5 || sector === 0, voltage: 1.2, current: sector === 5 || sector === 0 ? iL : 0 };
        break;
      }

      // ==========================================
      // 9. Three Phase Semi-Controlled Bridge
      // ==========================================
      case 'tp-semi-controlled': {
        // 3 SCRs on top, 3 diodes on bottom
        const botMin = Math.min(vs, vs_b, vs_c);
        // SCR firing interval
        const baseAngle = (thetaNorm - Math.PI / 6 - alphaRad + 4 * Math.PI) % (2 * Math.PI);
        const sector = Math.floor(baseAngle / (2 * Math.PI / 3)); // 0, 1, 2
        let topV = vs;
        if (sector === 0) { topV = vs; scr1On = true; }
        else if (sector === 1) { topV = vs_b; scr3On = true; }
        else { topV = vs_c; scr5On = true; }

        vo = Math.max(0, topV - botMin); // freewheeling prevents negative voltage
        is = (topV === vs ? iL : 0) - (botMin === vs ? iL : 0);
        is_b = (topV === vs_b ? iL : 0) - (botMin === vs_b ? iL : 0);
        is_c = (topV === vs_c ? iL : 0) - (botMin === vs_c ? iL : 0);

        vDev1 = scr1On ? 1.2 : vs - topV;
        iDev1 = scr1On ? iL : 0;

        devStates['T1'] = { id: 'T1', name: 'SCR T1 (Top A)', type: 'scr', isConduction: sector === 0, voltage: vDev1, current: sector === 0 ? iL : 0 };
        devStates['T3'] = { id: 'T3', name: 'SCR T3 (Top B)', type: 'scr', isConduction: sector === 1, voltage: 1.2, current: sector === 1 ? iL : 0 };
        devStates['T5'] = { id: 'T5', name: 'SCR T5 (Top C)', type: 'scr', isConduction: sector === 2, voltage: 1.2, current: sector === 2 ? iL : 0 };
        devStates['D4'] = { id: 'D4', name: 'Diode D4 (Bot A)', type: 'diode', isConduction: botMin === vs, voltage: 0.7, current: botMin === vs ? iL : 0 };
        devStates['D6'] = { id: 'D6', name: 'Diode D6 (Bot B)', type: 'diode', isConduction: botMin === vs_b, voltage: 0.7, current: botMin === vs_b ? iL : 0 };
        devStates['D2'] = { id: 'D2', name: 'Diode D2 (Bot C)', type: 'diode', isConduction: botMin === vs_c, voltage: 0.7, current: botMin === vs_c ? iL : 0 };
        break;
      }

      // ==========================================
      // 10. Single Phase TCR (AC Voltage Controller)
      // ==========================================
      case 'sp-tcr': {
        const g1 = isGateTrigger(alphaRad);
        const g2 = isGateTrigger((alphaRad + Math.PI) % (2 * Math.PI));
        gate1 = g1 ? 1 : 0;
        gate2 = g2 ? 1 : 0;

        if (g1 && vs > 0) {
          scr1On = true;
        }
        if (g2 && vs < 0) {
          scr2On = true;
        }

        if (scr1On) {
          vo = vs;
          is = iL;
          if (iL <= 0.001 && vs < 0 && !g1) {
            scr1On = false;
            vo = 0;
            is = 0;
          }
        } else if (scr2On) {
          vo = vs;
          is = iL;
          if (iL >= -0.001 && vs > 0 && !g2) {
            scr2On = false;
            vo = 0;
            is = 0;
          }
        } else {
          vo = 0;
          is = 0;
        }

        vDev1 = scr1On ? 1.2 : (scr2On ? -1.2 : vs);
        iDev1 = scr1On ? Math.max(0, iL) : 0;

        devStates['T1'] = { id: 'T1', name: 'Forward SCR T1', type: 'scr', isConduction: scr1On, isGated: !!g1, voltage: scr1On ? 1.2 : vs, current: scr1On ? Math.max(0, iL) : 0 };
        devStates['T2'] = { id: 'T2', name: 'Reverse SCR T2', type: 'scr', isConduction: scr2On, isGated: !!g2, voltage: scr2On ? -1.2 : -vs, current: scr2On ? Math.max(0, -iL) : 0 };
        break;
      }

      // ==========================================
      // 11. Three Phase TCR (AC Controller)
      // ==========================================
      case 'tp-tcr': {
        // Balanced 3-phase AC controller with anti-parallel thyristors
        const condA = (thetaNorm >= alphaRad && thetaNorm <= Math.PI) || (thetaNorm >= Math.PI + alphaRad && thetaNorm <= 2 * Math.PI);
        const thetaB = (thetaNorm - (2 * Math.PI) / 3 + 4 * Math.PI) % (2 * Math.PI);
        const condB = (thetaB >= alphaRad && thetaB <= Math.PI) || (thetaB >= Math.PI + alphaRad && thetaB <= 2 * Math.PI);
        const thetaC = (thetaNorm + (2 * Math.PI) / 3) % (2 * Math.PI);
        const condC = (thetaC >= alphaRad && thetaC <= Math.PI) || (thetaC >= Math.PI + alphaRad && thetaC <= 2 * Math.PI);

        vo = condA ? vs : 0;
        is = condA ? iL : 0;
        is_b = condB ? (vs_b / R) : 0;
        is_c = condC ? (vs_c / R) : 0;

        vDev1 = condA ? 1.2 : vs;
        iDev1 = condA ? Math.abs(iL) : 0;

        devStates['T1A'] = { id: 'T1A', name: 'Phase A Pair', type: 'scr', isConduction: condA, voltage: vDev1, current: is };
        devStates['T1B'] = { id: 'T1B', name: 'Phase B Pair', type: 'scr', isConduction: condB, voltage: condB ? 1.2 : vs_b, current: is_b };
        devStates['T1C'] = { id: 'T1C', name: 'Phase C Pair', type: 'scr', isConduction: condC, voltage: condC ? 1.2 : vs_c, current: is_c };
        break;
      }

      // ==========================================
      // 12. Single Phase Dual Converter
      // ==========================================
      case 'sp-dual-converter': {
        // Bridge 1 (Positive converter) with alpha1
        // Bridge 2 (Negative converter) with alpha2 = 180 - alpha1
        const g1 = isGateTrigger(alphaRad);
        const g2 = isGateTrigger((alphaRad + Math.PI) % (2 * Math.PI));
        gate1 = g1 ? 1 : 0;
        gate2 = g2 ? 1 : 0;

        // Bridge 1 output
        const vo1 = Math.abs(vs) * Math.cos(alphaRad);
        // Bridge 2 output
        const vo2 = -Math.abs(vs) * Math.cos(alpha2Rad);

        if (dualMode === 'circulating') {
          vo = 0.5 * (vo1 + vo2);
          is = (vo / R) + (vs / (R * 2));
        } else {
          // Non-circulating: forward drive if alpha < 90, regenerative if alpha >= 90
          vo = (alphaRad <= Math.PI / 2) ? vo1 : vo2;
          is = vo / R;
        }

        vDev1 = 1.2;
        iDev1 = Math.max(0, iL);

        devStates['B1_T1'] = { id: 'B1_T1', name: 'Bridge 1 T1 (Pos)', type: 'scr', isConduction: alphaRad <= Math.PI / 2, isGated: !!g1, voltage: 1.2, current: Math.max(0, is) };
        devStates['B1_T2'] = { id: 'B1_T2', name: 'Bridge 1 T2 (Pos)', type: 'scr', isConduction: alphaRad <= Math.PI / 2, isGated: !!g2, voltage: 1.2, current: Math.max(0, is) };
        devStates['B2_T1'] = { id: 'B2_T1', name: 'Bridge 2 T1 (Neg)', type: 'scr', isConduction: alphaRad > Math.PI / 2, voltage: 1.2, current: Math.max(0, -is) };
        devStates['B2_T2'] = { id: 'B2_T2', name: 'Bridge 2 T2 (Neg)', type: 'scr', isConduction: alphaRad > Math.PI / 2, voltage: 1.2, current: Math.max(0, -is) };
        break;
      }

      // ==========================================
      // 13. Three Phase Dual Converter
      // ==========================================
      case 'tp-dual-converter': {
        const topMax = Math.max(vs, vs_b, vs_c);
        const botMin = Math.min(vs, vs_b, vs_c);
        const v6pulse = (topMax - botMin) * Math.cos(alphaRad);

        if (dualMode === 'circulating') {
          const v6pulseNeg = -(topMax - botMin) * Math.cos(alpha2Rad);
          vo = 0.5 * (v6pulse + v6pulseNeg);
        } else {
          vo = v6pulse;
        }

        is = vo / R;
        is_b = -0.5 * is;
        is_c = -0.5 * is;

        devStates['PosBridge'] = { id: 'PosBridge', name: 'Positive 6-Pulse Converter', type: 'scr', isConduction: alphaRad <= Math.PI / 2, voltage: 2.4, current: Math.max(0, is) };
        devStates['NegBridge'] = { id: 'NegBridge', name: 'Negative 6-Pulse Converter', type: 'scr', isConduction: alphaRad > Math.PI / 2, voltage: 2.4, current: Math.max(0, -is) };
        break;
      }

      default: {
        vo = Math.abs(vs);
        is = iL;
      }
    }

    // ==========================================
    // Numerical ODE Integration for Load Circuit
    // ==========================================
    if (loadType === 'R') {
      iL = (vo - E) / R;
    } else if (loadType === 'RL' || loadType === 'RLE') {
      // Differential equation: L * di/dt + R*i + E = vo
      // di/dt = (vo - R*i - E) / L
      const di_dt = (vo - R * iL - E) / L;
      iL = iL + di_dt * dt;
      // In rectifiers with unipolar devices (no circulating dual converter), current cannot be negative
      if (!circuitId.includes('tcr') && !circuitId.includes('dual')) {
        if (iL < 0) iL = 0;
      }
    }

    prevVo = vo;

    // Record sample
    samples.push({
      t,
      vs,
      vs_b,
      vs_c,
      vo,
      io: iL,
      is,
      is_b,
      is_c,
      vDevice1: vDev1,
      iDevice1: iDev1,
      gatePulse1: gate1,
      gatePulse2: gate2,
      gatePulse3: gate3,
      devices: devStates
    });
  }

  // ==========================================
  // Engineering Measurements & Harmonic FFT
  // ==========================================
  const numSamples = samples.length;
  const analysisStart = Math.floor(numSamples * 0.5); // Analyze steady-state half
  const steadySamples = samples.slice(analysisStart);

  let sumVo = 0;
  let sumVoSq = 0;
  let sumIo = 0;
  let sumIoSq = 0;
  let sumActivePower = 0;
  let sumVsSq = 0;
  let sumIsSq = 0;

  for (const s of steadySamples) {
    sumVo += s.vo;
    sumVoSq += s.vo * s.vo;
    sumIo += s.io;
    sumIoSq += s.io * s.io;
    sumActivePower += s.vo * s.io;
    sumVsSq += s.vs * s.vs;
    sumIsSq += s.is * s.is;
  }

  const count = steadySamples.length;
  const vAvg = sumVo / count;
  const vRms = Math.sqrt(sumVoSq / count);
  const iAvg = sumIo / count;
  const iRms = Math.sqrt(sumIoSq / count);
  const vsRms = Math.sqrt(sumVsSq / count);
  const isRms = Math.sqrt(sumIsSq / count);

  const pActive = sumActivePower / count;
  const sApparent = Math.max(1e-4, vsRms * isRms);
  const powerFactor = Math.min(1.0, Math.max(0, pActive / sApparent));
  const qReactive = Math.sqrt(Math.max(0, sApparent * sApparent - pActive * pActive));

  const formFactor = Math.abs(vAvg) > 1e-3 ? vRms / Math.abs(vAvg) : 1;
  const rippleFactor = Math.sqrt(Math.max(0, formFactor * formFactor - 1));
  const efficiency = pActive > 1e-4 ? Math.min(100, Math.max(0, ((vAvg * iAvg) / pActive) * 100)) : 0;

  // Harmonic analysis on input current
  const timeArray = steadySamples.map(s => s.t);
  const currentArray = steadySamples.map(s => s.is);
  const voltageArray = steadySamples.map(s => s.vo);

  const currentAnalysis = calculateHarmonics(currentArray, timeArray, f, 25);
  const voltageAnalysis = calculateHarmonics(voltageArray, timeArray, f, 25);

  // Displacement Power Factor
  const fundamentalPhase = currentAnalysis.harmonics[0]?.phaseDeg || 0;
  const displacementPf = Math.cos((fundamentalPhase * Math.PI) / 180);

  // Analytical formulas for comparison
  let analyticalVavg = 0;
  let analyticalVrms = 0;

  switch (circuitId) {
    case 'sp-half-wave':
      analyticalVavg = Vm / Math.PI;
      analyticalVrms = Vm / 2;
      break;
    case 'sp-full-wave-ct':
    case 'sp-diode-bridge':
      analyticalVavg = (2 * Vm) / Math.PI;
      analyticalVrms = Vm / Math.SQRT2;
      break;
    case 'sp-full-controlled':
      analyticalVavg = ((2 * Vm) / Math.PI) * Math.cos(alphaRad);
      analyticalVrms = Vm / Math.SQRT2;
      break;
    case 'sp-semi-controlled':
      analyticalVavg = (Vm / Math.PI) * (1 + Math.cos(alphaRad));
      analyticalVrms = (Vm / Math.SQRT2) * Math.sqrt((Math.PI - alphaRad + 0.5 * Math.sin(2 * alphaRad)) / Math.PI);
      break;
    case 'tp-half-wave':
      analyticalVavg = (3 * Math.sqrt(3) * Vm) / (2 * Math.PI);
      analyticalVrms = Vm * Math.sqrt(0.5 + (3 * Math.sqrt(3)) / (8 * Math.PI));
      break;
    case 'tp-six-pulse-diode':
      analyticalVavg = (3 * Math.sqrt(3) * Vm) / Math.PI;
      analyticalVrms = Math.sqrt(3) * Vm * 0.9558;
      break;
    case 'tp-full-controlled':
      analyticalVavg = ((3 * Math.sqrt(3) * Vm) / Math.PI) * Math.cos(alphaRad);
      analyticalVrms = Math.sqrt(3) * Vm * 0.9558;
      break;
    case 'tp-semi-controlled':
      analyticalVavg = ((3 * Math.sqrt(3) * Vm) / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
      analyticalVrms = (Math.sqrt(3) * Vm) * 0.707;
      break;
    case 'sp-tcr':
      analyticalVavg = 0;
      analyticalVrms = (Vm / Math.SQRT2) * Math.sqrt((2 * (Math.PI - alphaRad) + Math.sin(2 * alphaRad)) / (2 * Math.PI));
      break;
    default:
      analyticalVavg = vAvg;
      analyticalVrms = vRms;
  }

  const measurements: SimulationMeasurements = {
    vAvg,
    vRms,
    iAvg,
    iRms,
    pActive,
    sApparent,
    qReactive,
    powerFactor,
    displacementPf: Math.abs(displacementPf) <= 1 ? Math.abs(displacementPf) : 1,
    thdCurrent: currentAnalysis.thdPercent,
    thdVoltage: voltageAnalysis.thdPercent,
    formFactor,
    rippleFactor,
    efficiency,
    fundamentalCurrentRms: currentAnalysis.fundamentalRms,
    currentHarmonics: currentAnalysis.harmonics,
    voltageHarmonics: voltageAnalysis.harmonics,
    analyticalVavg,
    analyticalVrms
  };

  return { samples, measurements };
}
