// ============================================================
// ble-config.ts — Bluetooth Low Energy Configuration
// ============================================================
// Configure authorized devices and BLE settings for ESP32 connection.
//
// FOR ESP32 SETUP:
// - Program your ESP32 to advertise GATT service with UUID: 0000abcd-0000-1000-8000-00805f9b34fb
// - Implement characteristics for commands (write) and events (notify) as per BleTransport.ts
// - ESP32 should scan for AUTHORIZED_MACS and send PROXIMITY_DETECTED when RSSI > RSSI_THRESHOLD
// - Handle REQUEST_PHASE_UNLOCK for phase 1 (proximity) and phase 3 (vein, if implemented)
// - Phase 2 (fingerprint) is handled locally on the phone via WebAuthn
//
// FILES TO MODIFY FOR ESP32 INTEGRATION:
// - This file: Update AUTHORIZED_MACS with your key device MAC addresses
// - BleTransport.ts: Update SERVICE_UUID and characteristic UUIDs if different from ESP32 firmware
// - ESP32 firmware: Implement the GATT service and event sending logic

export const BLE_CONFIG = {
  // Replace with the actual MAC addresses of your authorized key devices (phones)
  // On Android, deviceId is the MAC address. Use nRF Connect or similar to find MACs.
  AUTHORIZED_MACS: [
    'AA:BB:CC:DD:EE:FF', // Example: Replace with your phone's Bluetooth MAC
    '11:22:33:44:55:66'  // Example: Add more authorized keys
  ],

  // Optional: If your ESP32 broadcasts specific service UUIDs for filtering
  AUTHORIZED_UUIDS: [
    '0000abcd-0000-1000-8000-00805f9b34fb' // ESP32 GATT service UUID
  ],

  // Signal strength threshold (in dBm) for proximity detection
  // -60 is relatively close (e.g., within a few feet).
  // -90 is far away. Adjust based on your ESP32 hardware.
  RSSI_THRESHOLD: -65,
};
