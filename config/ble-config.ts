// ============================================================
// ble-config.ts — Bluetooth Low Energy Configuration
// ============================================================
// Configure authorized devices and BLE settings for ESP32 connection.
//
// INTEGRATION OVERVIEW:
// - Phase 1 (Proximity): ESP32 scans for authorized key MAC addresses
// - Phase 2 (Fingerprint): ESP32 reads R307/R503 sensor via UART
// - Phase 3 (Vein): Simulated for demo (modify ESP32 to add real vein sensor)
//
// FOR ESP32 SETUP:
// 1. See ESP32_FIRMWARE_SETUP.md for complete hardware and software guide
// 2. Program ESP32 to advertise GATT service UUID: 0000abcd-0000-1000-8000-00805f9b34fb
// 3. Connect R307/R503 fingerprint sensor to UART2 (GPIO16/17)
// 4. ESP32 should handle REQUEST_PHASE_UNLOCK commands for phases 1 and 2
// 5. Send PHASE_UNLOCKED/PHASE_FAILED events back via BLE
//
// FILES TO MODIFY FOR HARDWARE INTEGRATION:
// - config/ble-config.ts (THIS FILE): Update AUTHORIZED_MACS with your key device MAC
// - config/fingerprint-config.ts: Configure R307/R503 sensor parameters
// - services/transport/BleTransport.ts: Update SERVICE_UUID if different
// - ESP32 firmware code: Implement UART fingerprint reading and BLE event sending
//   (See ESP32_FIRMWARE_SETUP.md for complete Arduino code template)

export const BLE_CONFIG = {
  // Replace with the actual MAC addresses of your authorized key devices (phones/beacons)
  // On Android, find device MAC in: Settings → Bluetooth → Device Details
  // Use nRF Connect app to discover MAC addresses of your devices
  AUTHORIZED_MACS: [
    'AA:BB:CC:DD:EE:FF', // Example: Replace with your phone's Bluetooth MAC
    '11:22:33:44:55:66'  // Add more authorized keys as needed
  ],

  // GATT service UUIDs that ESP32 broadcasts
  AUTHORIZED_UUIDS: [
    '0000abcd-0000-1000-8000-00805f9b34fb' // ESP32 GATT service UUID
  ],

  // Signal strength threshold (RSSI in dBm) for proximity detection
  // -60 is close (within a few feet / ~2 meters)
  // -75 is medium distance (~5 meters)
  // -90 is far away (~10+ meters)
  // Adjust based on your deployment needs
  RSSI_THRESHOLD: -65,

  // Fingerprint sensor configuration
  FINGERPRINT_SENSOR: 'R307', // 'R307' or 'R503'
  FINGERPRINT_UART_BAUD: 57600,
  FINGERPRINT_UART_RX: 16, // ESP32 GPIO16
  FINGERPRINT_UART_TX: 17, // ESP32 GPIO17
  FINGERPRINT_TIMEOUT_MS: 10000, // Max wait time for fingerprint scan
};
