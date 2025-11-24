#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>

// --- CONFIGURATION ---
// UUIDs match the App's configuration
#define SERVICE_UUID        "12345678-1234-1234-1234-1234567890ab"
#define CHARACTERISTIC_UUID "abcdefab-1234-5678-9abc-1234567890ab"
#define DEVICE_NAME         "LentesSordos"

// I2S Config (INMP441)
#define I2S_WS 25
#define I2S_SD 26
#define I2S_SCK 27

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// --- MOCK DATA FOR DEMO ---
// In a real scenario, we would use FFT here.
// For this deliverable, we will simulate detections periodically
// to prove the BLE contract works.

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Device Connected");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Device Disconnected");
    }
};

void setup() {
  Serial.begin(115200);

  // Create the BLE Device
  BLEDevice::init(DEVICE_NAME);

  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create the BLE Characteristic
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY |
                      BLECharacteristic::PROPERTY_INDICATE
                    );

  // Create a BLE Descriptor
  pCharacteristic->addDescriptor(new BLE2902());

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);  // set value to 0x00 to not advertise this parameter
  BLEDevice::startAdvertising();
  Serial.println("Waiting a client connection to notify...");
}

void loop() {
    // notify changed value
    if (deviceConnected) {
        // Simulate a detection every 10 seconds
        delay(10000); 
        
        StaticJsonDocument<200> doc;
        doc["timestamp"] = millis() / 1000;
        
        // Randomly generate alert type using Team A's format (lowercase tags)
        int r = random(0, 10);
        if (r > 7) {
           doc["top"] = "siren";   // Peligro (Rojo)
           doc["lado"] = "atras";
           doc["conf"] = 0.9;
        } else if (r > 5) {
           doc["top"] = "car_horn"; // Peligro (Rojo)
           doc["lado"] = "izquierda";
           doc["conf"] = 0.85;
        } else if (r > 3) {
           doc["top"] = "voice";    // Atención (Amarillo)
           doc["lado"] = "derecha";
           doc["conf"] = 0.7;
        } else {
           doc["top"] = "drilling"; // Info (Verde)
           doc["lado"] = "frente";
           doc["conf"] = 0.4;
        }
        
        // doc["modo"] = "online"; // App sets this automatically
        // doc["fuente"] = "esp32";

        char jsonBuffer[512];
        serializeJson(doc, jsonBuffer);

        pCharacteristic->setValue(jsonBuffer);
        pCharacteristic->notify();
        Serial.print("Notified: ");
        Serial.println(jsonBuffer);
    }

    // disconnecting
    if (!deviceConnected && oldDeviceConnected) {
        delay(500); // give the bluetooth stack the chance to get things ready
        pServer->startAdvertising(); // restart advertising
        Serial.println("start advertising");
        oldDeviceConnected = deviceConnected;
    }
    // connecting
    if (deviceConnected && !oldDeviceConnected) {
        // do stuff here on connecting
        oldDeviceConnected = deviceConnected;
    }
}
