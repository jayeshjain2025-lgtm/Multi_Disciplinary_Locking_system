import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';

export const scanForRealDevices = async (onDeviceFound: (device: BleDevice, rssi: number) => void) => {
  try {
    await BleClient.initialize();
    await BleClient.requestLEScan({}, (result) => {
      if (result.device && result.rssi) {
        onDeviceFound(result.device, result.rssi);
      }
    });
    
    setTimeout(async () => {
      await BleClient.stopLEScan();
    }, 10000);
  } catch (error) {
    console.error("BLE Scan Error:", error);
  }
};
