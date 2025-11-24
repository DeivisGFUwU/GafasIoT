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
    async monitorDevice(deviceId: string, onDataReceived: (data: any) => void) {
        console.log('Starting monitor for device:', deviceId);
        this.manager.monitorCharacteristicForDevice(
            deviceId,
            BLEService.SERVICE_UUID,
            BLEService.CHARACTERISTIC_UUID,
            (error, characteristic) => {
                if (error) {
                    console.error('Monitor error:', error);
                    return;
                }
                if (characteristic?.value) {
                    try {
                        const decodedValue = this.base64Decode(characteristic.value);
                        console.log('Received raw BLE data:', decodedValue);
                        const json = JSON.parse(decodedValue);
                        onDataReceived(json);
                    } catch (e) {
                        console.error('Error parsing BLE data:', e);
                    }
                }
            }
        );
    }

    private base64Decode(str: string): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let output = '';
        str = String(str).replace(/=+$/, '');
        if (str.length % 4 === 1) {
            throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
        }
        for (
            let bc = 0, bs = 0, buffer, i = 0;
            (buffer = str.charAt(i++));
            ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
                ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
                : 0
        ) {
            buffer = chars.indexOf(buffer);
        }
        return output;
    }
}

export const bleService = new BLEService();
