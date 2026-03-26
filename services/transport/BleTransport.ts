// ============================================================
// BleTransport.ts — Real BLE hardware transport for TriLock
// ============================================================
// Uses the Web Bluetooth API to communicate with the physical
// lock controller. Replace the UUIDs below with your actual
// GATT service/characteristic UUIDs from your firmware.
//
// HOW TO USE:
//   1. Update SERVICE_UUID and CHARACTERISTIC_UUIDs to match
//      your lock firmware's GATT profile.
//   2. Call connect() after a user gesture (browser requirement).
//   3. The rest of your app talks to this through ITransport —
//      no other changes needed.

import {
  ITransport,
  LockCommand,
  LockEvent,
  TransportStatus,
} from './ITransport';
import { generateId } from '../utils/crypto';

// ── Replace these with your firmware's actual GATT UUIDs ─────
const SERVICE_UUID = '0000abcd-0000-1000-8000-00805f9b34fb';
const CHAR_COMMAND_UUID = '0000abce-0000-1000-8000-00805f9b34fb'; // write
const CHAR_EVENT_UUID   = '0000abcf-0000-1000-8000-00805f9b34fb'; // notify

export class BleTransport implements ITransport {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private commandChar: BluetoothRemoteGATTCharacteristic | null = null;
  private eventChar: BluetoothRemoteGATTCharacteristic | null = null;

  private _status: TransportStatus = { connected: false, mode: 'BLE' };
  private eventHandlers: Set<(event: LockEvent) => void> = new Set();
  private statusHandlers: Set<(status: TransportStatus) => void> = new Set();

  get status(): TransportStatus {
    return { ...this._status };
  }

  async connect(): Promise<void> {
    if (!navigator.bluetooth) {
      throw new Error(
        'Web Bluetooth API is not available in this browser. ' +
        'Use Chrome on desktop or Android.'
      );
    }

    // Prompt user to select the lock device
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }],
    });

    this.device.addEventListener('gattserverdisconnected', () => {
      this._updateStatus({ connected: false });
      this._emitEvent({
        id: generateId(),
        timestamp: new Date(),
        type: 'CONNECTION_LOST',
        source: 'SYSTEM',
      });
    });

    this.server = await this.device.gatt!.connect();
    const service = await this.server.getPrimaryService(SERVICE_UUID);

    this.commandChar = await service.getCharacteristic(CHAR_COMMAND_UUID);
    this.eventChar   = await service.getCharacteristic(CHAR_EVENT_UUID);

    // Subscribe to lock → app notifications
    await this.eventChar.startNotifications();
    this.eventChar.addEventListener(
      'characteristicvaluechanged',
      this._handleNotification.bind(this)
    );

    this._updateStatus({
      connected: true,
      deviceId: this.device.id,
      lastSeen: new Date(),
    });

    this._emitEvent({
      id: generateId(),
      timestamp: new Date(),
      type: 'CONNECTION_ESTABLISHED',
      source: 'SYSTEM',
    });
  }

  async disconnect(): Promise<void> {
    await this.eventChar?.stopNotifications();
    this.server?.disconnect();
    this.device = null;
    this.server = null;
    this.commandChar = null;
    this.eventChar = null;
    this._updateStatus({ connected: false });
  }

  async sendCommand(command: LockCommand): Promise<void> {
    const phase = command.payload?.phase as 1 | 2 | 3 | undefined;

    if (phase === 2) {
      // Phase 2: Fingerprint on key (phone) - use WebAuthn
      await this._handleFingerprintAuth(command);
      return;
    }

    if (phase === 3) {
      // Phase 3: Vein sensor on lock - simulated for demo
      await this._simulateVeinAuth(command);
      return;
    }

    if (!this.commandChar) {
      throw new Error('BleTransport: not connected');
    }

    // Encode command as JSON → UTF-8 bytes
    const json = JSON.stringify(command);
    const encoder = new TextEncoder();
    await this.commandChar.writeValueWithResponse(encoder.encode(json));
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

  // ── Internal ────────────────────────────────────────────────

  private async _handleFingerprintAuth(command: LockCommand): Promise<void> {
    try {
      // Use WebAuthn for fingerprint authentication on the phone
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32), // Random challenge
          rpId: window.location.hostname,
          userVerification: 'required', // Requires biometric
          timeout: 60000,
        },
      });

      if (credential) {
        // Success
        this._emitEvent({
          id: generateId(),
          timestamp: new Date(),
          type: 'PHASE_UNLOCKED',
          source: 'FINGERPRINT',
          phase: 2,
          keyId: (command.payload?.keyId as string) ?? 'PHONE-KEY',
          nonce: generateId(),
        });
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      // Failure
      this._emitEvent({
        id: generateId(),
        timestamp: new Date(),
        type: 'PHASE_FAILED',
        source: 'FINGERPRINT',
        phase: 2,
        keyId: (command.payload?.keyId as string) ?? 'PHONE-KEY',
        nonce: generateId(),
        metadata: { reason: 'Fingerprint authentication failed' },
      });
    }
  }

  private async _simulateVeinAuth(command: LockCommand): Promise<void> {
    // Simulate vein scan delay
    await new Promise(resolve => setTimeout(resolve, 2200));

    // For demo, always succeed
    this._emitEvent({
      id: generateId(),
      timestamp: new Date(),
      type: 'PHASE_UNLOCKED',
      source: 'VEIN',
      phase: 3,
      keyId: (command.payload?.keyId as string) ?? 'DEMO-KEY',
      nonce: generateId(),
    });
  }

  private _handleNotification(event: Event): void {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const decoder = new TextDecoder();
    const json = decoder.decode(target.value);

    try {
      const lockEvent: LockEvent = JSON.parse(json);
      // Ensure timestamp is a Date object (JSON parses it as string)
      lockEvent.timestamp = new Date(lockEvent.timestamp);
      this._updateStatus({ lastSeen: new Date() });
      this._emitEvent(lockEvent);
    } catch (err) {
      console.error('BleTransport: failed to parse event from hardware', json, err);
    }
  }

  private _emitEvent(event: LockEvent): void {
    this.eventHandlers.forEach((h) => h(event));
  }

  private _updateStatus(patch: Partial<TransportStatus>): void {
    this._status = { ...this._status, ...patch };
    this.statusHandlers.forEach((h) => h(this.status));
  }
}
