# TriLock Security Control Center

TriLock is a **3-phase smart locking system project** with a working React/Vite control dashboard and a planned hardware implementation.

The project models and validates a high-security unlock journey in three phases:

1. **Phase 1 - Proximity**: owner comes near lock with authorized key.
2. **Phase 2 - Fingerprint**: owner verifies fingerprint (target: key-based scanner or phone-assisted scanner flow).
3. **Phase 3 - Vein verification**: owner touches lock and vein signal is verified.

When all three phases are verified, the lock transitions to **UNLOCKED**.

---

## Current Stage of the Project

### ✅ What is implemented now (software)

This repository currently contains a **functional front-end simulation and operations dashboard**:

- **Monitoring view** for live phase state, lock status, alarms, and recent activity.
- **Simulation controls** to trigger Phase 1/2/3 events and test full unlock logic.
- **Fault-injection mode** to simulate hardware/biometric failures.
- **Management view** to register/revoke authorized hardware keys and biometric enrollment flags.
- **Connection view** with selectable `SIMULATION` vs `HARDWARE` runtime mode (hardware transport UX is scaffolded).
- **AI security audit panel** (Gemini) that analyzes event logs and returns risk-oriented recommendations.
- **Auto-lock timer** that re-locks the system shortly after unlock.

### 🚧 What is not implemented yet (hardware side)

- No live BLE/MQTT hardware transport implementation yet.
- No deployed firmware in this repo for microcontrollers.
- No production sensor drivers in this repo (fingerprint/vein/proximity are currently simulated in-app).
- No cloud backend/API service in this repo for device identity, telemetry persistence, OTA, or certificate lifecycle.

In short: the project is currently at a **simulation + control-plane prototype stage**, with architecture prepared for physical lock integration.

---

## Final Product Vision

The intended end-state user flow is:

1. **Owner approaches lock with authorized key** → proximity challenge passes → **Phase 1 unlocks**.
2. **Owner scans fingerprint on key (or approved phone-assisted fallback)** → biometric match passes → **Phase 2 unlocks**.
3. **Owner grips lock body** and vein sensors verify live vascular signature → **Phase 3 unlocks**.
4. All three factors verified in sequence window → actuator disengages and **access is granted**.

This delivers layered verification based on:

- possession (authorized key),
- inherence #1 (fingerprint),
- inherence #2 + liveness (vein signature).

---

## Planned Features / Roadmap

### Near-term

- Hardware-communication adapter layer in app (`HARDWARE` mode fully wired).
- Device onboarding + secure pairing workflow for keys and lock controller.
- Structured telemetry/event persistence (local + cloud-ready).
- Role-based management actions and audit hardening.

### Mid-term

- **Phone-assisted biometric simulation**:
  - Use phone pre-built fingerprint scanner as an assisted verification factor for testing and fallback flows.
  - Signed assertion from phone app to lock controller/app gateway.
- Lock-side anti-spoof checks and replay protection tokens.
- Better anomaly scoring and trend analytics on event stream.

### Long-term

- End-to-end production hardware integration with microprocessors.
- Full cryptographic key lifecycle, secure element usage, OTA update channel.
- Manufacturing-calibrated vein sensor pipeline and environmental compensation.
- Field diagnostics dashboards and incident response tooling.

---

## Repository Structure

```text
.
├── App.tsx
├── services/
│   └── geminiService.ts
├── views/
│   ├── MonitoringView.tsx
│   ├── ManagementView.tsx
│   └── ConnectionView.tsx
├── components/
│   ├── LockVisualizer.tsx
│   ├── SimulationControls.tsx
│   ├── ActivityLog.tsx
│   └── SecurityAudit.tsx
├── types.ts
├── vite.config.ts
├── Contributors.md
└── Hardware.md
```

---

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind (via CDN in `index.html`)
- `@google/genai` for AI log analysis

---

## Local Development Setup

### Prerequisites

- Git
- Node.js 20+
- npm
- Gemini API key

### Verify local tooling

```bash
git --version
node -v
npm -v
```

### Run locally

1. Clone:

   ```bash
   git clone <your-repo-url>
   cd Multi_Disciplinary_Locking_system
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env.local` in repo root:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start dev server:

   ```bash
   npm run dev
   ```

5. Open browser at printed Vite URL (typically `http://localhost:3000` in this config).

### Build and preview

```bash
npm run build
npm run preview
```

---

## Branching and Pull Requests

### Create branch

```bash
git checkout -b feature/<short-description>
```

### Commit

```bash
git add .
git commit -m "docs: <summary>"
```

### Push

```bash
git push -u origin feature/<short-description>
```

### Open PR

1. Open GitHub repo.
2. Click **Compare & pull request**.
3. Verify base branch and compare branch.
4. Include:
   - what changed,
   - why it changed,
   - how it was tested.

Suggested PR template:

```md
## Summary
- ...

## Why
- ...

## Testing
- [ ] npm run build
- [ ] Manual validation
```

---

## Additional Documentation

- [`Contributors.md`](./Contributors.md): app ↔ microprocessor ↔ lock interaction architecture and future real-hardware flow.
- [`Hardware.md`](./Hardware.md): proposed BOM, sensor choices, electronics blocks, and assembly overview.
