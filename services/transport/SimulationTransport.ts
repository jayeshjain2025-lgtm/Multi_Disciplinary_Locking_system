// ============================================================
// SimulationTransport.ts — In-app simulation of lock hardware
// ============================================================
// Mirrors the behavior of real hardware without any physical
// connection. Used in SIMULATION mode. Replaces the current
// ad-hoc simulation scattered across components.

import {
  ITransport,
  LockCommand,
  LockEvent,
  LockEventType,
  TransportStatus,
} from './ITransport';
import { generateNonce, generateId } from '../utils/crypto';

// How long (ms) each biometric "scan" takes in simulation
const SCAN_DELAY: Record<string, number> = {
  PROXIMITY: 800,
  FINGERPRINT: 1500,
  VEIN: 2200,
};

// Configurable failure probability per phase (0–1)
const DEFAULT_FAILURE_RATE = 0.15;

export interface SimulationConfig {
  proximityFailureRate?: number;
  fingerprintFailureRate?: number;
  veinFailureRate?: number;
  autoUnlockAllPhases?: boolean; // convenience: pass all phases immediately
}

export class SimulationTransport implements ITransport {
  private _status: TransportStatus = {
    connected: false,
    mode: 'SIMULATION',
  };

  private eventHandlers: Set<(event: LockEvent) => void> = new Set();
  private statusHandlers: Set<(status: TransportStatus) => void> = new Set();
  private config: Required<SimulationConfig>;

  constructor(config: SimulationConfig = {}) {
    this.config = {
      proximityFailureRate: config.proximityFailureRate ?? DEFAULT_FAILURE_RATE,
      fingerprintFailureRate: config.fingerprintFailureRate ?? DEFAULT_FAILURE_RATE,
      veinFailureRate: config.veinFailureRate ?? DEFAULT_FAILURE_RATE,
      autoUnlockAllPhases: config.autoUnlockAllPhases ?? false,
    };
  }

  get status(): TransportStatus {
    return { ...this._status };
  }

  async connect(): Promise<void> {
    await this._delay(300); // simulate handshake
    this._updateStatus({ connected: true, deviceId: 'SIM-LOCK-001', lastSeen: new Date() });
    this._emit({
      id: generateId(),
      timestamp: new Date(),
      type: 'CONNECTION_ESTABLISHED',
      source: 'SYSTEM',
      nonce: generateNonce(),
    });
    // Simulate ESP32 detecting key in range for phase 1
    await this._delay(500);
    this.simulateProximityChange(-50, 'SIM-KEY-001'); // Simulate key in range
  }

  async disconnect(): Promise<void> {
    this._updateStatus({ connected: false });
    this._emit({
      id: generateId(),
      timestamp: new Date(),
      type: 'CONNECTION_LOST',
      source: 'SYSTEM',
    });
  }

  async sendCommand(command: LockCommand): Promise<void> {
    if (!this._status.connected) {
      throw new Error('SimulationTransport: not connected');
    }

    switch (command.type) {
      case 'REQUEST_PHASE_UNLOCK':
        await this._simulatePhaseUnlock(command);
        break;

      case 'FORCE_LOCK':
        await this._delay(200);
        this._emit({
          id: generateId(),
          timestamp: new Date(),
          type: 'LOCK_ENGAGED',
          source: 'SYSTEM',
          nonce: generateNonce(),
        });
        break;

      case 'FORCE_UNLOCK':
        await this._delay(200);
        this._emit({
          id: generateId(),
          timestamp: new Date(),
          type: 'LOCK_DISENGAGED',
          source: 'SYSTEM',
          nonce: generateNonce(),
        });
        break;

      case 'REQUEST_STATUS':
        // status is already reflected via onStatusChange; nothing extra needed
        break;

      default:
        console.warn(`SimulationTransport: unhandled command type "${command.type}"`);
    }
  }

  onEvent(handler: (event: LockEvent) => void): void {
    this.eventHandlers.add(handler);
  }

  offEvent(handler: (event: LockEvent) => void): void {
    this.eventHandlers.delete(handler);
  }

  onStatusChange(handler: (status: TransportStatus) => void): void {
    this.statusHandlers.add(handler);
  }

  // ── Simulation internals ────────────────────────────────────

  /**
   * Simulate BLE proximity signal change.
   * Call this from SimulationControls UI to mimic key approaching.
   */
  simulateProximityChange(rssi: number, keyId: string): void {
    const inRange = rssi > -75; // configurable threshold
    this._emit({
      id: generateId(),
      timestamp: new Date(),
      type: inRange ? 'PROXIMITY_DETECTED' : 'PROXIMITY_LOST',
      source: 'PROXIMITY',
      phase: 1,
      keyId,
      rssi,
      nonce: generateNonce(),
    });
  }

  private async _simulatePhaseUnlock(command: LockCommand): Promise<void> {
    const phase = command.payload?.phase as 1 | 2 | 3 | undefined;
    if (!phase) return;

    const sourceMap: Record<number, LockEvent['source']> = {
      1: 'PROXIMITY',
      2: 'FINGERPRINT',
      3: 'VEIN',
    };
    const failRateMap: Record<number, number> = {
      1: this.config.proximityFailureRate,
      2: this.config.fingerprintFailureRate,
      3: this.config.veinFailureRate,
    };

    const source = sourceMap[phase];
    const scanTime = SCAN_DELAY[source] ?? 1000;

    await this._delay(scanTime);

    const failed = !this.config.autoUnlockAllPhases && Math.random() < failRateMap[phase];
    const eventType: LockEventType = failed ? 'PHASE_FAILED' : 'PHASE_UNLOCKED';

    this._emit({
      id: generateId(),
      timestamp: new Date(),
      type: eventType,
      source,
      phase,
      keyId: (command.payload?.keyId as string) ?? 'SIM-KEY-001',
      nonce: generateNonce(),
      metadata: failed ? { reason: 'Biometric mismatch (simulated)' } : undefined,
    });
  }

  private _emit(event: LockEvent): void {
    this.eventHandlers.forEach((h) => h(event));
  }

  private _updateStatus(patch: Partial<TransportStatus>): void {
    this._status = { ...this._status, ...patch };
    this.statusHandlers.forEach((h) => h(this.status));
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }
}
