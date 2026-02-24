# GafasIOT - Asistente Auditivo con IA y BLE 👓👂

[![React Native](https://img.shields.io/badge/React%20Native-0.78.3-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**IMPORTANTE:** el QR te lleva a descargar la app(.apk). Al intentar conectarte a la base de datos con las credenciales, o crear nuevo usuario, es posible que no puedas. Esto se debe a que en SupaBase (la base de datos usada para este proyecto) si no se realiza algún uso de la BD durante más de 7 días significa la puesta en pausa del proyecto y no habrá ninguna comunicación. Avísame si quieres testearlo para activar la BD dado que es gratuita.

GafasIOT es una aplicación móvil diseñada para asistir a personas con discapacidad auditiva. Se conecta a unas gafas inteligentes (ESP32) para detectar sonidos del entorno en tiempo real, clasificarlos y mostrarlos como alertas visuales y hápticas. Además, incluye un modo de transcripción de voz a texto para facilitar conversaciones.

## 🎯 Características Principales

- **🔊 Detección de Sonidos en Tiempo Real**: Identifica sirenas, cláxones, obras, voces, etc.
- **🚨 Sistema de Alertas Inteligente**:
  - **Peligro (Rojo)**: Sirenas, Cláxones → Siempre visibles, incluso durante transcripción
  - **Atención (Amarillo)**: Voces humanas → Clickeable para ir a transcripción
  - **Info (Verde)**: Obras, Aire acondicionado, Motores
- **🗣️ Transcripción de Voz (Speech-to-Text)**: Convierte voz a texto en pantalla para conversaciones fluidas
- **🎭 Supresión Inteligente**: Durante transcripción, solo alertas rojas (peligro) interrumpen
- **🌐 Overlay Global**: Alertas críticas aparecen sobre cualquier pantalla
- **🎮 Modo Demo**: Simulación integrada para probar la UI sin hardware
- **📡 Verificación de Bluetooth**: Mensaje amigable si BLE está desactivado
- **🏗️ Arquitectura Robusta**: Clean Architecture + Adapter Pattern

## 📸 Screenshots

> <img width="1113" height="1113" alt="GafasIoT_vFinal" src="https://github.com/user-attachments/assets/14ca6e0f-a70a-40bd-a8f3-b6b1a1ef106a" />


## 🛠️ Stack Tecnológico

### Core
- **React Native**: 0.78.3
- **React**: 19.0.0
- **TypeScript**: 5.7.0
- **Node.js**: ≥18

### Navegación
- **@react-navigation/native**: 6.1.17
- **@react-navigation/stack**: 6.3.29
- **react-native-screens**: 4.0.0
- **react-native-gesture-handler**: 2.16.2
- **react-native-safe-area-context**: 5.0.0

### Conectividad & Sensores
- **react-native-ble-plx**: 3.5.0 (Bluetooth Low Energy)
- **@react-native-voice/voice**: 3.2.4 (Speech-to-Text)
- **@react-native-community/netinfo**: 11.3.0

### Backend & Autenticación
- **@supabase/supabase-js**: 2.45.0
- **@react-native-async-storage/async-storage**: 2.2.0

### Notificaciones
- **@notifee/react-native**: 9.1.8

### Herramientas de Desarrollo
- **Babel**: 7.25.2
- **ESLint**: 8.57.0
- **Jest**: 29.6.3
- **Prettier**: 3.4.0

## 🏗️ Arquitectura

El proyecto sigue una arquitectura modular y escalable:

```
src/
├── components/        # Componentes reutilizables (LiveAlert)
├── config/           # Configuración (soundMapping.ts)
├── context/          # Estado global (AlertContext, AppContext)
├── navigation/       # Navegación (RootNavigator)
├── screens/          # Pantallas principales
│   ├── Auth/        # Login, Registro
│   ├── Home/        # Pantalla principal, Detalles
│   ├── Scan/        # Escaneo BLE
│   └── Voice/       # Transcripción
├── services/         # Servicios (BLE, Auth, Detection, Notification)
├── types/           # TypeScript types
└── utils/           # Utilidades (UUID, Supabase config)
```

### Patrones de Diseño

- **Adapter Pattern**: Normalización de datos del firmware (`soundMapping.ts`)
- **Context API**: Gestión de estado global
- **Service Layer**: Separación de lógica de negocio
- **Component Composition**: Componentes reutilizables y modulares

## 📡 Integración IoT (Firmware ESP32)

### Especificaciones BLE

- **Device Name**: `LentesSordos`, `ESP32`, `Gafas`
- **Service UUID**: `12345678-1234-1234-1234-1234567890ab`
- **Characteristic UUID**: `abcdefab-1234-5678-9abc-1234567890ab`

### Formato de Datos (JSON Payload)

#### ✨ Nuevo Formato Compacto (Recomendado)

El firmware debe enviar notificaciones con el siguiente formato optimizado:

```json
{
  "S": "Si",    // Código de sonido (2-3 caracteres)
  "L": "Iz"     // Código de dirección (2-3 caracteres)
}
```

**Mapeo de Códigos de Sonido (S)**:
- `"Si"` → Sirena (🔴 ROJO)
- `"Ca"` → Claxon (🔴 ROJO)
- `"Dr"` → Drilling/Obras (🟢 VERDE)
- `"En"` → Engine/Motor (🟢 VERDE)
- `"Ai"` → Air Conditioner/Aire Acond. (🟢 VERDE)
- `"Un"` → Unknown/Desconocido (🟢 VERDE)

**Mapeo de Códigos de Dirección (L)**:
- `"Iz"` → Izquierda
- `"Der"` → Derecha
- `"Ce"` → Centro/Frente

#### 📜 Formato Anterior (Soportado)

```json
{
  "top": "SIREN",        // Etiqueta del sonido (case-insensitive)
  "lado": "izquierda",   // Dirección (izquierda, derecha, centro, atras)
  "conf": 0.95           // Nivel de confianza (0.0 - 1.0)
}
```

> **Nota**: La app soporta ambos formatos automáticamente. El nuevo formato es más eficiente para transmisión BLE.

### Sistema de Buffering BLE

La app implementa un sistema de buffering robusto que:
- ✅ Acumula fragmentos de datos BLE (típicamente ~20 bytes por paquete)
- ✅ Detecta mensajes completos buscando el delimitador `}`
- ✅ Procesa solo mensajes JSON válidos y completos
- ✅ Previene errores de parsing por fragmentación
- ✅ Incluye protección contra overflow (límite 2000 caracteres)

**Logs de debugging**:
```
📦 [BLE] Received chunk: {"S":"Si"
🔄 [BLE] Buffer state: {"S":"Si"
⏳ [BLE] Waiting for more data...
📦 [BLE] Received chunk: ,"L":"Iz"}
✅ [BLE] Processing complete message: {"S":"Si","L":"Iz"}
```

### Clases de Sonido Soportadas

#### 🚨 Peligro (Rojo)
- `SIREN` / `Si` → Sirena
- `CAR_HORN` / `Ca` → Claxon

#### ⚠️ Atención (Amarillo)
- `voice` / `human_voice` → Voz humana

#### 🔔 Informativo (Verde)
- `DRILLING` / `Dr` → Obras/Taladro
- `AIR_CONDITIONER` / `Ai` → Aire Acondicionado
- `ENGINE_IDLING` / `En` → Motor de Auto

> **Nota**: El mapeo es case-insensitive. Puedes enviar `SIREN`, `siren` o `Siren`.

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js 18 o superior
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS, solo macOS)
- Cuenta de Supabase

### Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/GafasIOT.git
   cd GafasIOT
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar Supabase**:
   - Crea un proyecto en [supabase.com](https://supabase.com)
   - Copia las credenciales
   - Actualiza `src/utils/supabaseConfig.ts`:
     ```typescript
     export const SUPABASE_URL = 'tu-url-de-supabase';
     export const SUPABASE_ANON_KEY = 'tu-anon-key';
     ```

4. **Configurar permisos Android**:
   
   Los permisos ya están configurados en `AndroidManifest.xml`:
   - Bluetooth (BLUETOOTH_SCAN, BLUETOOTH_CONNECT)
   - Ubicación (ACCESS_FINE_LOCATION)
   - Micrófono (RECORD_AUDIO)

5. **Ejecutar en Android**:
   ```bash
   npm run android
   ```

6. **Ejecutar en iOS** (requiere macOS):
   ```bash
   cd ios && pod install && cd ..
   npm run ios
   ```

## 🧪 Modo Demo

Si no tienes las gafas conectadas, puedes probar la app usando el botón **"⚠️ Simular"**.

**Secuencia de simulación**:
- **T=0s**: Conexión BLE simulada
- **T=2s**: Alerta VERDE (timbre)
- **T=10s**: Alerta AMARILLA (voz) → Clickeable
- **T=20s**: Alerta ROJA (sirena) → Visible en transcripción

### Probar Supresión de Alertas

1. Click en "⚠️ Simular"
2. Inmediatamente click en "🗣️ Conversar"
3. Observa:
   - Verde (T=2s) → **BLOQUEADA**
   - Amarilla (T=10s) → **BLOQUEADA**
   - Roja (T=20s) → **APARECE** (overlay global)

## 📦 Generar APK Release

Para generar un APK firmado para distribución:

```bash
cd android
.\gradlew assembleRelease
```

El APK estará en:
```
android/app/build/outputs/apk/release/app-release.apk
```

Ver [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) para más detalles.

## 🔧 Características Técnicas Avanzadas

### Supresión Inteligente de Alertas
Durante el modo transcripción, la app suprime automáticamente alertas verdes y amarillas para no interrumpir la conversación. Solo las alertas rojas (peligro) pueden interrumpir.

**Implementación**: `src/context/AlertContext.tsx` usa `useRef` para evitar stale closures.

### Overlay Global de Alertas
Las alertas se renderizan en `App.tsx` fuera del `NavigationContainer` con `zIndex: 9999`, garantizando visibilidad sobre todas las pantallas.

### Throttling de Alertas (Anti-Spam)
Para evitar saturación, la app ignora alertas idénticas (mismo sonido y dirección) que lleguen en un intervalo menor a **3 segundos**. Implementado en `AlertContext.tsx`.

### Verificación de Estado de Bluetooth
Antes de escanear dispositivos, la app verifica si el Bluetooth está activado y muestra un mensaje amigable con opción de reintentar.

## 🐛 Bugs Resueltos

- ✅ Animación de "escuchando" se congelaba al aparecer alertas
- ✅ Alertas verdes/amarillas aparecían durante transcripción
- ✅ Alertas rojas quedaban ocultas detrás de otras pantallas
- ✅ Mapeo de sonidos case-sensitive causaba que 'SIREN' no se reconociera
- ✅ Estado de Bluetooth no se verificaba antes de escanear
- ✅ **Fragmentación de datos BLE**: Mensajes JSON se cortaban en múltiples paquetes
- ✅ **Parsing incompleto**: App intentaba procesar fragmentos en vez de mensajes completos
- ✅ **Fallback Parser BLE**: Soporte robusto para formato nuevo (`S`, `L`) incluso si falla `JSON.parse`
- ✅ **Throttling de Alertas**: Prevención de alertas duplicadas (mismo tipo/dirección) en ventana de 3s
- ✅ **Lógica Conversación**: Alertas Verdes/Amarillas ignoradas durante transcripción; Rojas interrumpen
- ✅ **Alertas no se disparaban**: Detecciones se guardaban pero no mostraban alertas visuales
- ✅ **Warnings de NativeEventEmitter**: Logs limpios sin advertencias de librerías

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Roadmap

- [ ] Soporte para más idiomas (i18n)
- [ ] Modo offline completo
- [ ] Historial de alertas con filtros
- [ ] Configuración personalizable de alertas
- [ ] Integración con más modelos de gafas IoT
- [ ] Modo oscuro/claro

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Equipo

**GafasIOT** - *Tecnología para la inclusión*

Desarrollado como proyecto del curso de Desarrollo de Soluciones de IoT en la Universidad ESAN.

## 📞 Contacto

Para preguntas o sugerencias, por favor abre un issue en GitHub.

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!
