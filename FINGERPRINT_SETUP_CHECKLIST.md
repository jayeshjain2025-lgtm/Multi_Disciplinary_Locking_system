# ✅ Real Fingerprint Sensor Integration Checklist

This document summarizes all changes made for R307/R503 fingerprint sensor integration. Follow these steps to complete the setup.

---

## 📁 Modified Files

### 1. **config/ble-config.ts** ✅ UPDATED
- Added fingerprint sensor configuration parameters
- Updated ESP32 documentation with UART pin info
- **Action Required**: Replace `'AA:BB:CC:DD:EE:FF'` with your phone's real Bluetooth MAC address

### 2. **config/fingerprint-config.ts** ✅ CREATED NEW
- Complete R307/R503 sensor configuration
- UART baud rate, pins, and timeout settings
- ESP32 firmware code template (Arduino)
- **Action Required**: Review sensor parameters and adjust as needed

### 3. **services/transport/BleTransport.ts** ✅ UPDATED
- Removed WebAuthn fingerprint authentication
- Phase 2 now sends fingerprint request directly to ESP32
- ESP32 handles fingerprint sensor reading via UART
- **No action required** - ready to use with ESP32

### 4. **ESP32_FIRMWARE_SETUP.md** ✅ CREATED NEW
- Complete hardware wiring diagram
- Step-by-step Arduino IDE setup instructions
- Full Arduino code template with UART fingerprint communication
- Troubleshooting guide
- **Action Required**: Program your ESP32 using this guide

---

## ⚙️ Hardware Setup (R307/R503 → ESP32)

```
ESP32          R307/R503 Sensor
════════════════════════════════
5V ────────────► VCC (+ 100µF capacitor)
GND ───────────► GND
GPIO17 (TXD2) ─► RX (with 0.1µF capacitor)
GPIO16 (RXD2) ◄─ TX (with voltage divider 5V→3.3V)
```

**Required Components:**
- ESP32 Development Board
- R307 or R503 Fingerprint Sensor
- 100µF Electrolytic Capacitor (sensor power)
- 0.1µF Ceramic Capacitor (TX line)
- 1KΩ + 2KΩ resistors (voltage divider for TX)

---

## 📋 Demo Flow (Phase-by-Phase)

### Phase 1: Proximity Detection
1. App sends `REQUEST_PHASE_UNLOCK` with `phase: 1`
2. ESP32 receives command via BLE
3. ESP32 checks if connected device MAC is authorized
4. ESP32 sends `PROXIMITY_DETECTED` event back to app
5. UI shows "Phase 01: BT Verified ✓"

### Phase 2: Fingerprint Verification ⭐ (NEW)
1. App sends `REQUEST_PHASE_UNLOCK` with `phase: 2`
2. ESP32 receives command via BLE
3. **ESP32 reads from R307/R503 sensor via UART**
4. User places finger on sensor
5. Sensor scans and compares against enrolled templates
6. If match: ESP32 sends `PHASE_UNLOCKED` event
7. If no match (3 attempts): ESP32 sends `PHASE_FAILED` event
8. UI shows result in real-time

### Phase 3: Vein Verification (Demo Simulated)
1. App sends `REQUEST_PHASE_UNLOCK` with `phase: 3`
2. ESP32 (or app) simulates 2.2-second scan delay
3. Always succeeds for demonstration
4. UI shows "Phase 03: Verified ✓"
5. All 3 phases complete → **System Unlocked**

---

## 🔧 Implementation Steps

### Step 1: Program Your ESP32 (Highest Priority!)
1. Open [ESP32_FIRMWARE_SETUP.md](ESP32_FIRMWARE_SETUP.md)
2. Follow "Arduino IDE Setup" section
3. Install required libraries (Adafruit Fingerprint, ArduinoBLE, ArduinoJson)
4. Copy the Arduino code template
5. Update `authorizedMACs[]` with your phone's Bluetooth MAC
6. Upload to ESP32 and verify in Serial Monitor

### Step 2: Update App Configuration
1. Open [config/ble-config.ts](config/ble-config.ts)
2. Update `AUTHORIZED_MACS` with your phone's MAC address
   - Find it: Android Settings → Bluetooth → Your Device → MAC Address
   - Or use nRF Connect app to scan
3. Verify `RSSI_THRESHOLD` is appropriate (-65 is default)

### Step 3: Connect Hardware
1. Wire R307/R503 sensor to ESP32 as per diagram above
2. Power on ESP32 (USB power is fine for testing)
3. Check Serial Monitor for "✓ Fingerprint sensor detected"

### Step 4: Build & Deploy App
```bash
npm run build
npx cap sync android
npx cap open android
# Run on your Android phone
```

### Step 5: Test the Demo
1. Open app on phone
2. App should auto-connect to ESP32 (BLE mode is default)
3. Tap "Phase 01 (Bluetooth)" button
   - Should verify with proximity
4. Tap "Phase 02 (Fingerprint)" button
   - Place finger on R307/R503 sensor
   - Should verify if fingerprint matches enrolled template
5. Tap "Phase 03 (Vein)" button
   - Should verify (simulated)
6. System unlocks when all phases verified ✓

---

## 🔍 Troubleshooting

### Fingerprint Sensor Not Detected
**Error**: `✗ Fingerprint sensor NOT detected` in Serial Monitor
- Check UART wiring (GPIO16/17)
- Verify power supply (5V) and capacitor
- Try baud rate 57600 (not other rates)
- Check if sensor is powered (LED should glow)

### Phase 2 Button Not Working
**Error**: App not triggering fingerprint phase
- Verify ESP32 is programmed correctly
- Check BLE connection is established
- Restart ESP32 and app
- Check Arduino Serial Monitor for errors

### False Fingerprint Rejections
- Increase `SECURITY_LEVEL` in fingerprint-config.ts (but slower)
- Or decrease it for faster but less strict matching
- Make sure fingers are enrolled correctly
- Ensure sensor glass is clean

### BLE Connection Issues
- Ensure Bluetooth is enabled on phone
- Forget the device and re-pair
- Restart both phone and ESP32
- Check if data cap/network limits BLE

---

## 📚 Key Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `config/ble-config.ts` | BLE and proximity config | ✅ Updated |
| `config/fingerprint-config.ts` | Fingerprint sensor config | ✅ Created |
| `services/transport/BleTransport.ts` | BLE communication logic | ✅ Updated |
| `ESP32_FIRMWARE_SETUP.md` | ESP32 Arduino code & guide | ✅ Created |
| `App.tsx` | Main React app | ✅ (BLE mode default) |
| `types.ts` | TypeScript interfaces | ✅ (No changes needed) |

---

## 🎯 Next Actions

1. **Immediately**: Read [ESP32_FIRMWARE_SETUP.md](ESP32_FIRMWARE_SETUP.md)
2. **Next**: Program your ESP32 using the Arduino code template
3. **Then**: Wire R307/R503 fingerprint sensor to ESP32
4. **Finally**: Update app config and test the demo

The fingerprint sensor is now fully integrated! Your app will use real biometric authentication for Phase 2, while keeping the vein sensor simulated for the demo.

Good luck! 🔐
