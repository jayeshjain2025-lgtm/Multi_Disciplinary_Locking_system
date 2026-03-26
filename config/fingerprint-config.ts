// ============================================================
// fingerprint-config.ts — R307/R503 Fingerprint Sensor Config
// ============================================================
// Configuration for UART-based fingerprint sensors (R307, R503, etc.)
// connected to the ESP32.
//
// ESP32 HARDWARE SETUP:
// 1. Connect R307/R503 sensor to ESP32 UART (default: UART1 pins 16/17)
// 2. Wire: VCC to 5V, GND to GND, TX to GPIO17 (RXD2), RX to GPIO16 (TXD2)
// 3. Baud rate: 57600 (standard for R307/R503)
//
// ESP32 SOFTWARE:
// - Use Arduino or PlatformIO to program ESP32
// - Include Adafruit Fingerprint library or similar
// - Implement fingerprint enrollment and verification functions
// - Send PHASE_UNLOCKED event on successful match, PHASE_FAILED on mismatch

export const FINGERPRINT_CONFIG = {
  // R307/R503 UART Communication
  UART_BAUD_RATE: 57600,
  UART_RX_PIN: 16,    // GPIO16 on ESP32 (RXD2)
  UART_TX_PIN: 17,    // GPIO17 on ESP32 (TXD2)

  // Sensor Parameters
  SENSOR_TYPE: 'R307', // 'R307' | 'R503'
  MAX_FINGER_ID: 162,  // Maximum finger template ID (depends on sensor)
  
  // Verification Settings
  SECURITY_LEVEL: 3,   // 1-5 (higher = stricter matching)
  TIMEOUT_MS: 10000,   // Max time to wait for fingerprint scan
  ATTEMPTS_MAX: 3,     // Max failed attempts before timeout

  // Enrollment Settings (for future use)
  ENROLLMENT_ATTEMPTS: 5, // Number of scans to capture during enrollment
  
  // ESP32 BLE Command Protocol
  // When app sends REQUEST_PHASE_UNLOCK with phase: 2,
  // ESP32 should:
  // 1. Activate fingerprint sensor
  // 2. Wait for finger placement
  // 3. Compare against enrolled templates
  // 4. Send PHASE_UNLOCKED or PHASE_FAILED event via BLE
  
  // Example ESP32 command structure:
  // {
  //   type: 'REQUEST_PHASE_UNLOCK',
  //   payload: { phase: 2, keyId: 'PHONE-MAC' }
  // }
  //
  // ESP32 response (on success):
  // {
  //   type: 'PHASE_UNLOCKED',
  //   source: 'FINGERPRINT',
  //   phase: 2,
  //   keyId: 'PHONE-MAC',
  //   metadata: { fingerId: 1, confidence: 255 }
  // }
  //
  // ESP32 response (on failure):
  // {
  //   type: 'PHASE_FAILED',
  //   source: 'FINGERPRINT',
  //   phase: 2,
  //   keyId: 'PHONE-MAC',
  //   metadata: { reason: 'No match found', attempts: 3 }
  // }
};

// ============================================================
// ESP32 Firmware Implementation Guide (Arduino)
// ============================================================
// 
// #include <Adafruit_Fingerprint.h>
// #include <ArduinoBLE.h>
//
// Adafruit_Fingerprint finger = Adafruit_Fingerprint(&Serial2); // UART2 on pins 16/17
// BLEService lockService("0000abcd-0000-1000-8000-00805f9b34fb");
// BLECharacteristic commandChar("0000abce-0000-1000-8000-00805f9b34fb", BLEWrite, 128);
// BLECharacteristic eventChar("0000abcf-0000-1000-8000-00805f9b34fb", BLENotify, 128);
//
// void handlePhase2(String keyId) {
//   // Called when app requests phase 2 unlock
//   int result = finger.fingerFastSearch();
//   
//   if (result == FINGERPRINT_OK) {
//     // Match found - send success event
//     String event = "{\"type\":\"PHASE_UNLOCKED\",\"source\":\"FINGERPRINT\",\"phase\":2,";
//     event += "\"keyId\":\"" + keyId + "\",\"metadata\":{\"fingerId\":" + finger.fingerID + "}}";
//     eventChar.writeValue(event);
//   } else {
//     // No match - send failure event
//     String event = "{\"type\":\"PHASE_FAILED\",\"source\":\"FINGERPRINT\",\"phase\":2,";
//     event += "\"keyId\":\"" + keyId + "\",\"metadata\":{\"reason\":\"No match found\"}}";
//     eventChar.writeValue(event);
//   }
// }
