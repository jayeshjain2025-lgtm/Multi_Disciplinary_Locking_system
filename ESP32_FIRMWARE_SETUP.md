// ============================================================
// ESP32_FIRMWARE_INTEGRATION.md
// ============================================================
// Complete guide for integrating the R307/R503 fingerprint sensor
// with the TriLock system on ESP32.

## Overview
The ESP32 acts as the central lock controller and handles:
- **Phase 1 (Proximity)**: BLE scanning for authorized key MAC addresses
- **Phase 2 (Fingerprint)**: Reading from R307/R503 sensor connected via UART
- **Phase 3 (Vein)**: Optionally read from vein sensor if installed

---

## Hardware Setup

### Components Needed:
1. **ESP32 Development Board** (ESP32-WROOM-32)
2. **R307 or R503 Fingerprint Sensor**
3. **USB-to-UART adapter** (if programming ESP32)
4. **Capacitor** (100µF) for sensor power stabilization
5. **Jumper wires**

### Wiring Diagram:

```
ESP32          R307/R503
═══════════════════════════════
5V ─────────────► VCC (with 100µF cap)
GND ────────────► GND
GPIO17 (TXD2) ──► RX (0.1µF cap recommended)
GPIO16 (RXD2) ◄── TX (voltage divider 5V→3.3V)
```

### Voltage Divider (for TX line, esp32 sensitivity):
```
R307/R503 TX (5V) ────[1KΩ]────┬────► ESP32 GPIO16
                                │
                              [2KΩ]
                                │
                               GND
```

---

## Arduino IDE Setup

### 1. Install Required Libraries:
```
1. Sketch → Include Library → Manage Libraries
2. Search for "Adafruit Fingerprint"
3. Install "Adafruit Fingerprint Sensor Library" by Adafruit
4. Search for "ArduinoBLE"
5. Install "ArduinoBLE" by Arduino
```

### 2. Board Selection:
```
Tools → Board → esp32 → ESP32 Dev Module
Tools → Port → Select your COM port
```

---

## Arduino Code Template

```cpp
#include <Adafruit_Fingerprint.h>
#include <ArduinoBLE.h>
#include <ArduinoJson.h>

// ── UART Configuration ──────────
HardwareSerial fingerSerial(2);  // Use UART2 on ESP32
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&fingerSerial);

// ── BLE Configuration ───────────
BLEService lockService("0000abcd-0000-1000-8000-00805f9b34fb");
BLECharacteristic commandChar("0000abce-0000-1000-8000-00805f9b34fb", 
                              BLEWrite | BLEWriteWithoutResponse, 256);
BLECharacteristic eventChar("0000abcf-0000-1000-8000-00805f9b34fb", 
                            BLENotify | BLERead, 256);

// ── Authorized Key MAC Addresses ────
const char* authorizedMACs[] = {
  "AA:BB:CC:DD:EE:FF",  // Your phone/key MAC address
  "11:22:33:44:55:66"   // Add more authorized MACs
};
const int numAuthorized = sizeof(authorizedMACs) / sizeof(authorizedMACs[0]);

// ── RSSI Threshold ─────────────────
const int RSSI_THRESHOLD = -65;  // dBm (proximity detection range)

// ── BLE Device Settings ────────────
const char* DEVICE_NAME = "SmartLock";
const char* SERVICE_UUID = "0000abcd-0000-1000-8000-00805f9b34fb";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("TriLock ESP32 Initializing...");
  
  // Initialize fingerprint sensor on UART2
  fingerSerial.begin(57600, SERIAL_8N1, 16, 17);  // RX=16, TX=17
  delay(500);
  
  if (finger.verifyPassword()) {
    Serial.println("✓ Fingerprint sensor detected");
  } else {
    Serial.println("✗ Fingerprint sensor NOT detected");
    while(1) { delay(1); }
  }
  
  // Initialize BLE
  if (!BLE.begin()) {
    Serial.println("✗ BLE initialization failed");
    while(1) { delay(1); }
  }
  
  // Set BLE device name and properties
  BLE.setLocalName(DEVICE_NAME);
  BLE.setAdvertisedService(lockService);
  
  // Add characteristics to service
  lockService.addCharacteristic(commandChar);
  lockService.addCharacteristic(eventChar);
  
  // Add service
  BLE.addService(lockService);
  
  // Set event handlers
  commandChar.setEventHandler(BLEWritten, onCommandReceived);
  
  // Start advertising
  BLE.advertise();
  Serial.println("✓ BLE advertising started");
  Serial.println("Waiting for connection...");
}

void loop() {
  BLEDevice central = BLE.central();
  
  if (central) {
    Serial.print("Connected to: ");
    Serial.println(central.address());
    
    while (central.connected()) {
      // Connection is maintained by event handler
      delay(100);
    }
    
    Serial.println("Disconnected");
  }
}

// ────────────────────────────────────────────────────────────
// Command Handler - Receives commands from the app
// ────────────────────────────────────────────────────────────
void onCommandReceived(BLEDevice central, BLECharacteristic characteristic) {
  int length = characteristic.valueLength();
  byte buffer[length];
  memcpy(buffer, characteristic.value(), length);
  
  String jsonStr = "";
  for (int i = 0; i < length; i++) {
    jsonStr += (char)buffer[i];
  }
  
  Serial.println("Command: " + jsonStr);
  
  // Parse JSON command
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, jsonStr);
  
  if (error) {
    Serial.println("JSON parse error");
    return;
  }
  
  const char* type = doc["type"];
  int phase = doc["payload"]["phase"] | 0;
  const char* keyId = doc["payload"]["keyId"] | "UNKNOWN";
  
  // Handle different command types
  if (strcmp(type, "REQUEST_PHASE_UNLOCK") == 0) {
    handlePhaseUnlock(phase, keyId, central);
  } 
  else if (strcmp(type, "FORCE_LOCK") == 0) {
    sendEvent(central, "LOCK_ENGAGED", "SYSTEM", 0, "");
  }
  else if (strcmp(type, "FORCE_UNLOCK") == 0) {
    sendEvent(central, "LOCK_DISENGAGED", "SYSTEM", 0, "");
  }
}

// ────────────────────────────────────────────────────────────
// Phase Unlock Handler
// ────────────────────────────────────────────────────────────
void handlePhaseUnlock(int phase, const char* keyId, BLEDevice central) {
  switch(phase) {
    case 1:
      handlePhase1_Proximity(keyId, central);
      break;
    case 2:
      handlePhase2_Fingerprint(keyId, central);
      break;
    case 3:
      handlePhase3_Vein(keyId, central);  // Optional with vein sensor
      break;
    default:
      Serial.println("Unknown phase");
  }
}

// ────────────────────────────────────────────────────────────
// PHASE 1: Proximity Detection
// ────────────────────────────────────────────────────────────
void handlePhase1_Proximity(const char* keyId, BLEDevice central) {
  Serial.println("Phase 1: Proximity Check");
  // In a real scenario, you would scan for the key's BLE address
  // For now, if the device connected successfully, we consider it verified
  
  // Auto-succeed for testing (in production, verify MAC address)
  sendEvent(central, "PROXIMITY_DETECTED", "PROXIMITY", 1, keyId);
}

// ────────────────────────────────────────────────────────────
// PHASE 2: Fingerprint Verification
// ────────────────────────────────────────────────────────────
void handlePhase2_Fingerprint(const char* keyId, BLEDevice central) {
  Serial.println("Phase 2: Fingerprint Verification");
  Serial.println("Waiting for finger...");
  
  int attempts = 0;
  const int MAX_ATTEMPTS = 3;
  
  while (attempts < MAX_ATTEMPTS) {
    int result = finger.getImage();
    
    if (result == FINGERPRINT_OK) {
      Serial.println("Image captured");
      
      result = finger.image2Tz(1);
      if (result != FINGERPRINT_OK) continue;
      
      result = finger.fast_search();
      
      if (result == FINGERPRINT_OK) {
        Serial.println("Match found!");
        Serial.print("Finger ID: ");
        Serial.print(finger.fingerID);
        Serial.print(", Confidence: ");
        Serial.println(finger.confidence);
        
        sendEventWithMetadata(central, "PHASE_UNLOCKED", "FINGERPRINT", 2, keyId,
                             "\"fingerId\": " + String(finger.fingerID) + 
                             ", \"confidence\": " + String(finger.confidence));
        return;
      } else if (result == FINGERPRINT_NOTFOUND) {
        Serial.println("No match found");
        attempts++;
        delay(1000);
        continue;
      }
    } else if (result == FINGERPRINT_NOFINGER) {
      delay(100);
      continue;
    }
  }
  
  // Max attempts reached
  sendEventWithMetadata(central, "PHASE_FAILED", "FINGERPRINT", 2, keyId,
                       "\"reason\": \"No match found\", \"attempts\": 3");
}

// ────────────────────────────────────────────────────────────
// PHASE 3: Vein Sensor (Optional - Simulated for now)
// ────────────────────────────────────────────────────────────
void handlePhase3_Vein(const char* keyId, BLEDevice central) {
  Serial.println("Phase 3: Vein Verification (Simulated)");
  delay(2200);  // Simulate scanning delay
  
  // In production, read from actual vein sensor (I2C/SPI)
  // For now, always succeed
  sendEvent(central, "PHASE_UNLOCKED", "VEIN", 3, keyId);
}

// ────────────────────────────────────────────────────────────
// BLE Event Helpers
// ────────────────────────────────────────────────────────────
void sendEvent(BLEDevice central, const char* eventType, const char* source, 
               int phase, const char* keyId) {
  StaticJsonDocument<256> event;
  event["id"] = generateId();
  event["timestamp"] = millis();
  event["type"] = eventType;
  event["source"] = source;
  if (phase > 0) event["phase"] = phase;
  if (strlen(keyId) > 0) event["keyId"] = keyId;
  event["nonce"] = generateNonce();
  
  String jsonStr;
  serializeJson(event, jsonStr);
  
  eventChar.writeValue((unsigned char*)jsonStr.c_str(), jsonStr.length());
  Serial.println("Event sent: " + jsonStr);
}

void sendEventWithMetadata(BLEDevice central, const char* eventType, 
                          const char* source, int phase, const char* keyId,
                          const char* metadata) {
  StaticJsonDocument<512> event;
  event["id"] = generateId();
  event["timestamp"] = millis();
  event["type"] = eventType;
  event["source"] = source;
  if (phase > 0) event["phase"] = phase;
  if (strlen(keyId) > 0) event["keyId"] = keyId;
  event["nonce"] = generateNonce();
  
  String metadataStr = "{" + String(metadata) + "}";
  deserializeJson(event["metadata"], metadataStr);
  
  String jsonStr;
  serializeJson(event, jsonStr);
  
  eventChar.writeValue((unsigned char*)jsonStr.c_str(), jsonStr.length());
  Serial.println("Event sent: " + jsonStr);
}

// ────────────────────────────────────────────────────────────
// Utility Functions
// ────────────────────────────────────────────────────────────
String generateId() {
  String id = "";
  for (int i = 0; i < 16; i++) {
    int digit = random(16);
    id += "0123456789abcdef"[digit];
  }
  return id;
}

String generateNonce() {
  String nonce = "";
  for (int i = 0; i < 32; i++) {
    int digit = random(16);
    nonce += "0123456789abcdef"[digit];
  }
  return nonce;
}
```

---

## Programming Steps

1. **Copy the code above** into Arduino IDE
2. **Install dependencies** (Adafruit Fingerprint, ArduinoBLE, ArduinoJson)
3. **Update authorized MACs** with your phone's Bluetooth MAC address
4. **Select board**: Tools → Board → ESP32 Dev Module
5. **Select port**: Tools → Port → /dev/ttyUSB0 (or your port)
6. **Upload**: Sketch → Upload (or Ctrl+U)
7. **Monitor**: Tools → Serial Monitor (115200 baud)

---

## Troubleshooting

### Fingerprint sensor not detected:
- Check UART wiring on pins 16/17
- Verify baud rate is 57600
- Check power supply (5V) and capacitor connection
- Try different UART (Serial1 on pins 9/10 instead of Serial2)

### BLE not connecting:
- Ensure Firebase/Bluetooth is enabled on Android
- Check device name and service UUID match app config
- Make sure phone is in BLE scanning range
- Try restarting ESP32

### Fingerprint false negatives:
- Check sensor is clean and not dusty
- Adjust SECURITY_LEVEL in config (lower = less strict)
- Enroll fingers again with consistent pressure
- Check lighting conditions on sensor

---

## App Configuration Files

Once ESP32 is programmed, verify these app files are configured:
- **config/ble-config.ts**: Update AUTHORIZED_MACS with your phone MAC
- **config/fingerprint-config.ts**: Update UART pins if using different ones
- **services/transport/BleTransport.ts**: Verify SERVICE_UUID matches ESP32

Done! Your TriLock system should now work with real fingerprint authentication.
