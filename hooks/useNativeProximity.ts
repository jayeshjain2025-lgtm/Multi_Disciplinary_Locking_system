import { useState, useEffect, useRef } from 'react';
import { BleClient, BleDevice, ScanResult } from '@capacitor-community/bluetooth-le';

// Helper to scan for devices in the Management UI
export const scanForRealDevices = async (onDeviceFound: (device: BleDevice, rssi: number) => void) => {
  try {
    await BleClient.initialize({ androidNeverForLocation: true });
    await BleClient.requestLEScan({}, (result) => {
      const deviceName = result.device.name || result.localName;
      const deviceToReturn = { ...result.device, name: deviceName };
      if (deviceName || result.device.deviceId) {
        onDeviceFound(deviceToReturn, result.rssi || -100);
      }
    });
    // Stop scanning after 10 seconds
    setTimeout(async () => {
      await BleClient.stopLEScan().catch(() => {});
    }, 10000);
  } catch (error) {
    console.warn('BLE Scan failed. Are you on a real Android device?', error);
  }
};

export const useNativeProximity = (authorizedMacs: string[], onUnlock: () => void, onLock: () => void) => {
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<BleDevice | null>(null);
  const isConnecting = useRef(false);
  const macsRef = useRef(authorizedMacs);

  // Keep the ref updated with the latest authorized MACs
  useEffect(() => {
    macsRef.current = authorizedMacs;
  }, [authorizedMacs]);

  useEffect(() => {
    let isActive = true;
    const initBle = async () => {
      try {
        await BleClient.initialize({ androidNeverForLocation: true });
        if (isActive) startScanning();
      } catch (error) {
        console.warn('BLE Init failed', error);
      }
    };

    initBle();

    return () => {
      isActive = false;
      stopScanning();
      if (connectedDevice) {
        BleClient.disconnect(connectedDevice.deviceId).catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    if (isScanning) return;
    try {
      setIsScanning(true);
      await BleClient.requestLEScan({}, async (result: ScanResult) => {
        const deviceMac = result.device.deviceId;
        const rssi = result.rssi;

        const isAuthorized = macsRef.current.includes(deviceMac);
        const isNear = rssi !== null && rssi >= -80; // -80 dBm threshold for auto-unlock

        if (isAuthorized && isNear && !connectedDevice && !isConnecting.current) {
          await connectToDevice(result.device);
        }
      });
    } catch (error) {
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      await BleClient.stopLEScan();
      setIsScanning(false);
    } catch (error) {}
  };

  const connectToDevice = async (device: BleDevice) => {
    isConnecting.current = true;
    try {
      await stopScanning(); 
      await BleClient.connect(device.deviceId, (disconnectedDeviceId) => {
        handleDisconnect(disconnectedDeviceId);
      });
      setConnectedDevice(device);
      isConnecting.current = false;
      onUnlock();
    } catch (error) {
      isConnecting.current = false;
      startScanning(); 
    }
  };

  const handleDisconnect = (deviceId: string) => {
    setConnectedDevice(null);
    onLock();
    startScanning(); 
  };

  const sendUnlockSignal = async () => {
    if (!connectedDevice) {
      console.warn("Cannot send unlock signal: No device connected.");
      return false;
    }
    try {
      // The ESP32 code uses "1234" and "5678". In BLE, these are expanded to 128-bit UUIDs.
      // Standard 16-bit UUID expansion is: 0000xxxx-0000-1000-8000-00805f9b34fb
      const SERVICE_UUID = "00001234-0000-1000-8000-00805f9b34fb";
      const CHARACTERISTIC_UUID = "00005678-0000-1000-8000-00805f9b34fb";
      
      // Convert the string "UNLOCK" to a DataView (byte array)
      const data = new Uint8Array([85, 78, 76, 79, 67, 75]); // ASCII for "UNLOCK"
      const dataView = new DataView(data.buffer);
      
      await BleClient.write(connectedDevice.deviceId, SERVICE_UUID, CHARACTERISTIC_UUID, dataView);
      console.log("Unlock signal sent successfully to ESP32!");
      return true;
    } catch (error) {
      console.error("Failed to send unlock signal to ESP32:", error);
      return false;
    }
  };

  return { isScanning, connectedDevice, sendUnlockSignal };
};
