
export enum LockPhase {
  IDLE = 'IDLE',
  PROXIMITY = 'PROXIMITY_VERIFIED',
  FINGERPRINT = 'FINGERPRINT_VERIFIED',
  VEIN = 'VEIN_VERIFIED',
  UNLOCKED = 'UNLOCKED'
}

export type ConnectionMode = 'SIMULATION' | 'HARDWARE';

export interface AuthorizedKey {
  id: string;
  name: string;
  isFingerprintRegistered: boolean;
  isVeinRegistered: boolean;
  batteryLevel: number;
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  phase: LockPhase;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
  details: string;
  source: ConnectionMode;
}

export interface RegisteredDevice {
  id: string;
  name: string;
  type: 'BLUETOOTH' | 'PHONE';
}

export interface LockState {
  currentPhase: LockPhase;
  verifiedPhases: LockPhase[];
  isLocked: boolean;
  batteryLevel: number;
  lastAccess: Date | null;
  activeAlarms: string[];
  connectionMode: ConnectionMode;
  isFaultMode: boolean;
}
