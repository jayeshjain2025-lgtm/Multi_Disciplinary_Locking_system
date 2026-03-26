// ============================================================
// ITransport.ts — Core transport abstraction for TriLock
// ============================================================
// All communication between the app and the lock/key hardware
// goes through this interface. Swap implementations to move
// from simulation → BLE → MQTT without touching app logic.

export type PhaseSource = 'PROXIMITY' | 'FINGERPRINT' | 'VEIN';

export type LockEventType =
  | 'PHASE_UNLOCKED'
  | 'PHASE_FAILED'
  | 'LOCK_ENGAGED'
  | 'LOCK_DISENGAGED'
  | 'FAULT'
  | 'ALARM'
  | 'PROXIMITY_DETECTED'
  | 'PROXIMITY_LOST'
  | 'CONNECTION_ESTABLISHED'
  | 'CONNECTION_LOST';

export interface LockEvent {
  id: string;                  // UUID for dedup / audit
  timestamp: Date;
  type: LockEventType;
  source: PhaseSource | 'SYSTEM';
  phase?: 1 | 2 | 3;
  keyId?: string;              // which authorized key triggered this
  rssi?: number;               // BLE signal strength (proximity events)
  nonce?: string;              // anti-replay token from hardware
  metadata?: Record<string, unknown>;
}

export type LockCommandType =
  | 'REQUEST_PHASE_UNLOCK'
  | 'FORCE_LOCK'
  | 'FORCE_UNLOCK'
  | 'REQUEST_STATUS'
  | 'ENROLL_KEY'
  | 'REVOKE_KEY';

export interface LockCommand {
  id: string;                  // UUID echoed back in ack
  type: LockCommandType;
  payload?: Record<string, unknown>;
}

export interface TransportStatus {
  connected: boolean;
  mode: 'SIMULATION' | 'BLE' | 'MQTT';
  deviceId?: string;
  lastSeen?: Date;
  rssi?: number;
}

// ── The interface every transport must implement ──────────────

export interface ITransport {
  readonly status: TransportStatus;

  /** Open connection to lock / simulation engine */
  connect(): Promise<void>;

  /** Gracefully close connection */
  disconnect(): Promise<void>;

  /** Send a command to the lock */
  sendCommand(command: LockCommand): Promise<void>;

  /** Register a handler for incoming lock events */
  onEvent(handler: (event: LockEvent) => void): void;

  /** Remove a previously registered event handler */
  offEvent(handler: (event: LockEvent) => void): void;

  /** Register a handler for transport status changes */
  onStatusChange(handler: (status: TransportStatus) => void): void;
}
