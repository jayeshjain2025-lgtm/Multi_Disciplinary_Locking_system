# Contributors Guide: App + Microprocessor Unlock Flow

This document explains how the TriLock application is expected to work with lock hardware and microprocessors when the physical system is implemented.

---

## 1) System Responsibility Split

## Web App (this repository)

- Operator dashboard (monitoring, management, diagnostics).
- Security event timeline and AI audit workflow.
- Admin operations: key enrollment metadata and access revocation.
- Simulation and test harness for phase progression.

## Edge Gateway / Companion Service (planned)

- Secure bridge between UI and hardware controllers.
- Session orchestration for unlock requests.
- Message authentication, replay protection, and state reconciliation.
- Optional cloud sync for logs and fleet operations.

## Lock Controller Microprocessor (planned firmware)

- Sensor acquisition and local phase validation signals.
- Drives lock actuator only after policy-approved phase sequence.
- Enforces timing windows, retry limits, anti-tamper policy.
- Emits signed telemetry/events to gateway/app.

## Key Microcontroller (planned firmware)

- Key identity and secure challenge response.
- Fingerprint enrollment reference and match assertion pipeline.
- Battery monitoring and tamper state reporting.

---

## 2) End-to-End Unlock Sequence (Target)

1. **Proximity detection (Phase 1)**
   - Lock detects authorized key in secure range (BLE/UWB/NFC strategy).
   - Challenge/response validates key identity and freshness.
   - Controller emits `PROXIMITY_VERIFIED` event.

2. **Fingerprint verification (Phase 2)**
   - Preferred: key-integrated fingerprint sensor verifies owner.
   - Planned simulation/fallback: phone biometric scanner produces signed assertion for authorized session.
   - Controller receives assertion and emits `FINGERPRINT_VERIFIED` when policy passes.

3. **Vein verification on lock (Phase 3)**
   - User touches lock grip area with vein sensor array.
   - Signal quality + liveness + template match checks run.
   - Controller emits `VEIN_VERIFIED` event.

4. **Final unlock grant**
   - Policy engine checks all required phases within timing bounds.
   - Actuator command is released.
   - Event stream emits `UNLOCKED` + session metadata.
   - Auto-lock timer begins.

---

## 3) Suggested Runtime Interfaces (Planned)

### Event topic examples

- `lock/{lockId}/phase`
- `lock/{lockId}/health`
- `lock/{lockId}/alarm`
- `key/{keyId}/status`

### Command topic examples

- `lock/{lockId}/command/reset`
- `lock/{lockId}/command/arm`
- `lock/{lockId}/command/diagnostics`

### Example normalized event payload

```json
{
  "eventId": "evt_01J...",
  "timestamp": "2026-01-18T10:11:12.000Z",
  "lockId": "LOCK-001",
  "keyId": "KEY-001",
  "phase": "FINGERPRINT_VERIFIED",
  "status": "SUCCESS",
  "source": "HARDWARE",
  "signal": {
    "rssi": -58,
    "quality": 0.93
  }
}
```

---

## 4) Security Principles for Contributors

- Never allow unlock from app UI alone; app can request/observe, controller decides.
- Require cryptographic challenge-response for key presence claims.
- Use short-lived nonces and strict replay rejection.
- Keep biometric raw data off the web app; send signed match outcomes/score bands only.
- Include tamper and fault states as first-class policy conditions.

---

## 5) Mapping to Current App Screens

- **Monitoring**: render live phase state and lock health from hardware event stream.
- **Management**: map to real enrollment/revocation APIs and key lifecycle operations.
- **Connect**: implement transport setup (BLE/MQTT), identity binding, and session status.
- **AI Audit**: operate on sanitized event logs for anomaly and posture analysis.

---

## 6) Contribution Checklist for Hardware Integration Work

1. Define protocol contract first (events, commands, errors).
2. Add simulator parity tests before hardware wiring.
3. Keep phase names and state semantics backward-compatible with existing UI types.
4. Include failure-mode events (timeout, spoof-detection, quality-fail, battery-low).
5. Provide test evidence for:
   - happy path unlock,
   - out-of-order phase attempts,
   - timeout/replay/tamper rejection,
   - safe auto-relock.
