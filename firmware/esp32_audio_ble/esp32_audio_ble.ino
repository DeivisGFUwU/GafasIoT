#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>

// --- CONFIGURATION ---
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define DEVICE_NAME         "GafasIOT_ESP32"

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
        
        // Randomly generate alert type
        int r = random(0, 10);
        if (r > 7) {
           doc["tipo"] = "sirena";
           doc["prioridad"] = "rojo";
           doc["direccion"] = "atrás";
           doc["intensidad"] = 0.9;
        } else if (r > 4) {
           doc["tipo"] = "voz";
           doc["prioridad"] = "amarillo";
           doc["direccion"] = "derecha";
           doc["intensidad"] = 0.6;
        } else {
           doc["tipo"] = "ruido";
           doc["prioridad"] = "verde";
           doc["direccion"] = "frente";
           doc["intensidad"] = 0.3;
        }
        
        doc["modo"] = "online";
        doc["fuente"] = "esp32";

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
