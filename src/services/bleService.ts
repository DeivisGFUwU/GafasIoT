import { BleManager, Device, BleError, ScanMode } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

export class BLEService {
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
        // Scanning with null UUIDs finds all devices. This is more robust as some devices 
        // don't advertise the Service UUID in the main packet.
        this.manager.startDeviceScan(null, { scanMode: ScanMode.LowLatency }, (error, device) => {
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
    private buffer: string = "";

    async monitorDevice(deviceId: string, onDataReceived: (data: any) => void, onDisconnected?: () => void) {
        console.log('Starting monitor for device:', deviceId);
        this.buffer = ""; // Reset buffer on new connection

        // Register disconnection listener
        const subscription = this.manager.onDeviceDisconnected(deviceId, (error, device) => {
            console.log('Device disconnected:', device?.id, error);
            if (onDisconnected) {
                onDisconnected();
            }
        });

        this.manager.monitorCharacteristicForDevice(
            deviceId,
            BLEService.SERVICE_UUID,
            BLEService.CHARACTERISTIC_UUID,
            (error, characteristic) => {
                if (error) {
                    console.error('Monitor error:', error);
                    // If monitor fails due to disconnection, the onDeviceDisconnected listener will handle it.
                    // But we can also check error code if needed.
                    return;
                }
                if (characteristic?.value) {
                    try {
                        const decodedValue = this.base64Decode(characteristic.value);
                        console.log('📦 [BLE] Received chunk:', decodedValue);

                        this.buffer += decodedValue;
                        console.log('🔄 [BLE] Buffer state:', this.buffer);

                        // Process buffer
                        // We assume messages are JSON objects ending with '}'
                        // or at least contain enough info to be parsed.
                        // Simple strategy: Look for closing braces '}'

                        let endIdx;
                        while ((endIdx = this.buffer.indexOf('}')) !== -1) {
                            // Extract the potential message
                            const message = this.buffer.substring(0, endIdx + 1);

                            // Remove from buffer
                            this.buffer = this.buffer.substring(endIdx + 1);

                            // Try to parse this message
                            console.log('✅ [BLE] Processing complete message:', message);
                            const parsedData = this.parseBleData(message);
                            console.log('📊 [BLE] Parsed data:', parsedData);
                            onDataReceived(parsedData);
                        }

                        // Log remaining buffer if any
                        if (this.buffer.length > 0) {
                            console.log('⏳ [BLE] Waiting for more data. Buffer contains:', this.buffer);
                        }

                        // Safety: Prevent buffer from growing indefinitely if no '}' is found
                        if (this.buffer.length > 2000) {
                            console.warn('⚠️ [BLE] Buffer overflow, clearing buffer');
                            this.buffer = "";
                        }

                    } catch (e) {
                        console.error('❌ [BLE] Error processing BLE data:', e);
                    }
                }
            }
        );
    }

    private parseBleData(raw: string): any {
        const trimmed = raw.trim();

        // 1. Try JSON
        try {
            return JSON.parse(trimmed);
        } catch (e) {
            console.log('JSON parse failed, trying fallback parser');
        }

        // 2. Fallback parser (similar to Kotlin implementation)
        const lower = trimmed.toLowerCase();

        const extractAfter = (label: string): string => {
            const idx = lower.indexOf(label);
            if (idx === -1) return "-";

            let i = idx + label.length;
            // Skip separators: space, :, =, {, ", '
            while (i < trimmed.length &&
                (trimmed[i] === ' ' || trimmed[i] === ':' || trimmed[i] === '=' ||
                    trimmed[i] === '"' || trimmed[i] === "'" || trimmed[i] === '{')) {
                i++;
            }

            const start = i;
            // Read until typical separator: space, comma, }, ), ;
            while (i < trimmed.length &&
                trimmed[i] !== ' ' && trimmed[i] !== ',' &&
                trimmed[i] !== '}' && trimmed[i] !== ')' && trimmed[i] !== ';') {
                i++;
            }

            const result = trimmed.substring(start, i).replace(/["'{}]/g, "");
            return result.trim();
        };

        let top = extractAfter("top");
        let lado = extractAfter("lado");

        // NEW: Check for short codes if long codes are missing
        // We look for "s" and "l" specifically. 
        // Note: extractAfter finds the first occurrence. In a JSON-like string {"s":"val"}, it should work.
        if (top === "-") top = extractAfter("s");
        if (lado === "-") lado = extractAfter("l");

        // Try to extract confidence if present, otherwise default
        let conf = 0.0;
        const confStr = extractAfter("conf");
        if (confStr !== "-") {
            const parsedConf = parseFloat(confStr);
            if (!isNaN(parsedConf)) {
                conf = parsedConf;
            }
        }

        // Map short codes to full names if needed (DetectionService handles this too, but good to have here)
        // Actually, DetectionService.adaptFirmwarePayload handles the mapping from "Si" -> "siren", etc.
        // So we just need to pass the values.
        // However, we need to return an object that DetectionService understands.
        // DetectionService expects:
        // 1. { S: "Si", L: "Iz" } OR
        // 2. { top: "siren", lado: "izquierda" }

        // If we extracted "Si" from "s", we should probably return it as "S" or "top".
        // Let's return a hybrid object that DetectionService can handle.

        return {
            top: top === "" ? "-" : top,
            lado: lado === "" ? "-" : lado,
            // Pass them as S/L as well if they were found via short codes, 
            // but DetectionService checks S/L first, then top/lado.
            // To be safe, let's just populate top/lado which is what we extracted.
            // Wait, if top="Si" (from 's'), DetectionService might not recognize "Si" as a 'top' key if it expects 'siren'.
            // Let's check DetectionService.adaptFirmwarePayload again.
            // It maps S -> soundKey.
            // It maps top -> soundKey.
            // Then it looks up soundKey in SOUND_MAP.
            // SOUND_MAP has 'Si': ... ? No.
            // SOUND_CODE_MAP in DetectionService maps 'Si' -> 'siren'.
            // But that is ONLY used if raw.S is present.
            // If we return { top: "Si" }, it goes to the "OLD format" block.
            // The OLD format block does NOT use SOUND_CODE_MAP.
            // So { top: "Si" } will fail to map to 'siren' because SOUND_MAP doesn't have "Si".

            // FIX: We must return S/L if we found them, or map them here.
            // Since we are in the fallback parser, let's try to reconstruct the object structure DetectionService expects.

            S: top, // If we found "Si", put it here.
            L: lado,

            // Also keep top/lado for backward compatibility or if they were found as full words
            conf: conf
        };
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
