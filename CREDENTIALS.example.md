# GafasIOT - Configuración de Credenciales

## ⚠️ IMPORTANTE: Este archivo NO debe ser commiteado

Este es un archivo de ejemplo. Copia este archivo y renómbralo según sea necesario.

## Supabase Configuration

Crea `src/utils/supabaseConfig.ts` con:

```typescript
export const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
export const SUPABASE_ANON_KEY = 'tu-anon-key-aqui';
export const DETECTIONS_TABLE = 'detections';
```

## Android Signing (Producción)

Para builds de producción, crea `android/keystore.properties`:

```properties
storePassword=TU_CONTRASEÑA_SEGURA
keyPassword=TU_CONTRASEÑA_SEGURA
keyAlias=my-key-alias
storeFile=my-upload-key.keystore
```

Luego actualiza `android/app/build.gradle` para leer desde este archivo en lugar de `gradle.properties`.

## Generar Keystore

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Guarda el keystore en un lugar seguro y NUNCA lo subas a GitHub.**

## Variables de Entorno (.env)

Si usas variables de entorno, crea `.env`:

```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
```

E instala `react-native-dotenv`:

```bash
npm install react-native-dotenv
```
