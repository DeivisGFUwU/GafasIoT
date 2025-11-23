import { BleManager, Device, BleError, ScanMode } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

class BLEService {
    manager: BleManager;

    // Firmware UUIDs
    public static SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
    public static CHARACTERISTIC_UUID = "abcdefab-1234-5678-9abc-1234567890ab";

    constructor() {
        this.manager = new BleManager();
    }

    async requestPermissions(): Promise<boolean> {
        if (Platform.OS === 'android') {
            if (Platform.Version >= 31) {
                const result = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ]);

                return (
                    result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
                );
            } else {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
        }
        return true;
    }

    async checkBluetoothState(): Promise<boolean> {
        try {
            const state = await this.manager.state();
            return state === 'PoweredOn';
        } catch (e) {
            console.error('Error checking Bluetooth state:', e);
            return false;
        }
    }

    startScan(onDeviceFound: (device: Device) => void, onError: (error: BleError) => void) {
        this.manager.startDeviceScan([BLEService.SERVICE_UUID], { scanMode: ScanMode.LowLatency }, (error, device) => {
            if (error) {
                onError(error);
                return;
            }
            if (device) {
                onDeviceFound(device);
            }
        });
    }

    stopScan() {
        this.manager.stopDeviceScan();
    }

    async connectToDevice(deviceId: string): Promise<Device> {
        try {
            const device = await this.manager.connectToDevice(deviceId);
            await device.discoverAllServicesAndCharacteristics();
            return device;
        } catch (e) {
            throw e;
        }
    }

    async disconnectDevice(deviceId: string) {
        try {
            await this.manager.cancelDeviceConnection(deviceId);
        } catch (e) {
            console.error('Error disconnecting:', e);
        }
    }
}

export const bleService = new BLEService();
