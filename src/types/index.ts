export interface Detection {
    id?: string; // Opcional al crear, obligatorio al leer
    user_id?: string; // Manejado por el backend
    tipo: string; // Ej: 'sirena', 'claxon', 'grito'
    prioridad: 'rojo' | 'amarillo' | 'verde';
    direccion: 'izquierda' | 'derecha' | 'frente' | 'atrás' | 'arriba'; // Updated to match previous types
    intensidad: number; // 0.0 a 1.0
    frecuencia_dominante?: number;
    timestamp?: string; // ISO string
    procesado?: boolean;
    extra?: any; // For flexibility with existing code
}
