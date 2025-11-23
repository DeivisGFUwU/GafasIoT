export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      detections: {
        Row: {
          id: string
          tipo: string
          prioridad: string
          direccion: string
          intensidad: number
          frecuencia_dominante: number | null
          timestamp: string
          procesado: boolean
          user_id?: string | null
        }
        Insert: {
          id?: string
          tipo: string
          prioridad: string
          direccion: string
          intensidad: number
          frecuencia_dominante?: number | null
          timestamp?: string
          procesado?: boolean
          user_id?: string | null
        }
        Update: {
          id?: string
          tipo?: string
          prioridad?: string
          direccion?: string
          intensidad?: number
          frecuencia_dominante?: number | null
          timestamp?: string
          procesado?: boolean
          user_id?: string | null
        }
      }
    }
  }
}

export type DetectionInsert = Database['public']['Tables']['detections']['Insert'];
