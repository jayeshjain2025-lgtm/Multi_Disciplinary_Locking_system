# TriLock Hardware Plan

This document lists the proposed hardware components and a practical assembly approach for the physical 3-phase TriLock system.

---

## 1) Functional Hardware Overview

TriLock physical implementation has three sensing gates:

1. **Proximity gate** (authorized key near lock).
2. **Fingerprint gate** (owner fingerprint verified).
3. **Vein gate** (owner hand vein signature verified on lock body).

Only after all three gates pass does the actuator unlock.

---

## 2) Bill of Materials (Proposed)

## Core compute + control

- **Main lock controller MCU** (ESP32-S3 or STM32-class MCU)
  - Responsibilities: orchestration, sensor fusion, comms, actuator command.
- **Key MCU** (ultra-low-power MCU, optional secure element companion)
  - Responsibilities: key identity, fingerprint flow integration, battery telemetry.

## Security and identity

- **Secure element** (ATECC608B or equivalent)
  - Stores device keys/cert material, signs challenges.

## Sensors

- **Proximity subsystem** (choose one or hybrid):
  - BLE 5.x radio RSSI/UWB ranging module,
  - or NFC-based near-field identity check.
- **Fingerprint subsystem**:
  - Capacitive fingerprint sensor in key,
  - plus optional phone-assisted biometric assertion path.
- **Vein subsystem** (lock body):
  - NIR LEDs (typically 760–940nm range based on module design),
  - photodiode/camera sensing module,
  - analog front-end and liveness-quality pipeline.

## Actuation + power

- **Electromagnetic/servo lock actuator** (rated for lock mechanics).
- **Power regulation**:
  - battery pack,
  - buck/boost regulators,
  - charging/protection ICs.
- **Battery management + fuel gauge** for lock and key.

## Safety and tamper

- Tamper switch / enclosure-open detection.
- Accelerometer (optional) for abnormal vibration/tamper patterns.
- Status LEDs + buzzer/haptic feedback.

## Communications

- BLE module (if external to MCU).
- Optional Wi-Fi/Ethernet gateway module for backend-connected deployments.

---

## 3) Mechanical + Electrical Assembly (High-Level)

## Lock body assembly

1. Mount controller PCB inside lock enclosure.
2. Place vein sensor window on external touch zone with optical shielding.
3. Route actuator control lines from controller through power driver stage.
4. Add tamper switch at service panel/enclosure seam.
5. Mount status indicators and secure debug connector (disabled in production).

## Key fob assembly

1. Integrate key MCU, secure element, battery, charging pad/port.
2. Place fingerprint sensor on thumb-friendly surface.
3. Add BLE/UWB/NFC antenna tuning in enclosure.
4. Validate low-power sleep/awake cycles and battery life profile.

## Power integration

1. Isolate sensor rails from actuator surge paths.
2. Add brownout detection and watchdog recovery.
3. Validate thermal envelope under repeated unlock cycles.

---

## 4) Data Flow in Real Operation (Planned)

1. Key and lock perform secure proximity handshake.
2. Key confirms fingerprint result and sends signed assertion.
3. Lock performs vein verification locally.
4. Controller policy engine validates all factors in allowed window.
5. Actuator unlock command issued.
6. Event telemetry published to app/gateway.

---

## 5) Recommended Bring-Up Sequence

1. **Bench stage**: power + actuator + one sensor at a time.
2. **Protocol stage**: signed proximity handshake and session nonces.
3. **Biometric stage**: fingerprint and vein quality metrics + error taxonomy.
4. **Policy stage**: strict phase ordering, timeout, retries, lockout.
5. **Integration stage**: connect to dashboard `HARDWARE` mode and verify event parity with simulation.

---

## 6) Validation Matrix (Minimum)

- Normal unlock success across all three phases.
- Rejection on missing/expired proximity session.
- Rejection on fingerprint mismatch/spoof detection.
- Rejection on vein mismatch/low-quality signal.
- Safe behavior during power dip or comms interruption.
- Auto-lock recovery and tamper alarm behavior.

---

## 7) Notes for Procurement

- Start with development kits for controller + sensor modules before custom PCB.
- Choose industrial temperature-rated parts for lock body electronics.
- Keep at least two sensor vendor options to reduce supply risk.
- Reserve BOM space for secure element and hardware crypto acceleration.
