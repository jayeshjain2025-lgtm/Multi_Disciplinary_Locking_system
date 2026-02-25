export const BLE_CONFIG = {
  // Replace with the actual MAC addresses of your authorized phones/beacons
  // On Android, deviceId is the MAC address.
  AUTHORIZED_MACS: [
    'AA:BB:CC:DD:EE:FF', 
    '11:22:33:44:55:66'
  ],
  
  // Optional: If your BLE device broadcasts a specific service UUID, add it here
  // to filter devices at the hardware level (saves battery).
  AUTHORIZED_UUIDS: [], 
  
  // Signal strength threshold (in dBm). 
  // -60 is relatively close (e.g., within a few feet).
  // -90 is far away. Adjust based on your hardware.
  RSSI_THRESHOLD: -65, 
};
