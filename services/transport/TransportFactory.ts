// ============================================================
// TransportFactory.ts — Creates the right transport for a mode
// ============================================================

import { ITransport } from './ITransport';
import { SimulationTransport, SimulationConfig } from './SimulationTransport';
import { BleTransport } from './BleTransport';

export type TransportMode = 'SIMULATION' | 'BLE';

export interface TransportFactoryOptions {
  mode: TransportMode;
  simulationConfig?: SimulationConfig;
}

export function createTransport(options: TransportFactoryOptions): ITransport {
  switch (options.mode) {
    case 'SIMULATION':
      return new SimulationTransport(options.simulationConfig);
    case 'BLE':
      return new BleTransport();
    default:
      throw new Error(`Unknown transport mode: ${options.mode}`);
  }
}
