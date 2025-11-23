export type DetectionPriority = 'rojo' | 'amarillo' | 'verde';
export type DetectionDirection = 'izquierda' | 'derecha' | 'frente' | 'atrás' | 'arriba';

export interface DetectionExtra {
  pico_fft?: number;
  frecuencia_dominante?: number;
  snr?: number;
  [key: string]: any;
}

export interface DetectionPayload {
  id?: string;
  timestamp: number; // Unix timestamp in seconds
  tipo: string;
  prioridad: DetectionPriority;
  direccion: DetectionDirection;
  intensidad: number; // 0.0 - 1.0
  modo: 'online' | 'offline';
  fuente: string;
  extra?: DetectionExtra;
}

export type Detection = DetectionPayload;
