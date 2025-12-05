// src/types/evidencia.ts

/**
 * Tipo de evidencia
 */
export type TipoEvidencia = 
  | "foto_surtidor" 
  | "foto_odometro" 
  | "foto_horometro"
  | "foto_ticket" 
  | "foto_tanque"
  | "foto_vehiculo"
  | "audio" 
  | "ubicacion"
  | "documento"
  | "otro";

/**
 * Estado de la evidencia
 */
export type EstadoEvidencia = "pendiente" | "aprobada" | "rechazada";

/**
 * Evidencia de un evento
 */
export interface Evidencia {
  id: number;
  eventoId: number;
  tipo: TipoEvidencia;
  url: string;
  thumbnailUrl?: string;
  mimeType?: string;
  size?: number;
  estado: EstadoEvidencia;
  latitud?: number;
  longitud?: number;
  metadata?: EvidenciaMetadata;
  observaciones?: string;
  uploadedAt: string;
  createdAt: string;
}

/**
 * Metadata adicional de la evidencia
 */
export interface EvidenciaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  deviceInfo?: string;
  accuracy?: number;
  timestamp?: string;
  originalFilename?: string;
}

/**
 * Datos para subir evidencia
 */
export interface EvidenciaUploadData {
  eventoId: number;
  tipo: TipoEvidencia;
  file: File;
  latitud?: number;
  longitud?: number;
  observaciones?: string;
}

/**
 * Ubicación capturada
 */
export interface Ubicacion {
  latitud: number;
  longitud: number;
  accuracy?: number;
  altitude?: number;
  timestamp: string;
  direccion?: string;
}

/**
 * Configuración de evidencias requeridas
 */
export interface EvidenciasRequeridas {
  foto_surtidor: boolean;
  foto_odometro: boolean;
  foto_horometro: boolean;
  foto_ticket: boolean;
  audio: boolean;
  ubicacion: boolean;
}

/**
 * Opciones de tipo para selects
 */
export const TIPOS_EVIDENCIA: { value: TipoEvidencia; label: string; icon: string }[] = [
  { value: "foto_surtidor", label: "Foto del Surtidor", icon: "LocalGasStation" },
  { value: "foto_odometro", label: "Foto del Odómetro", icon: "Speed" },
  { value: "foto_horometro", label: "Foto del Horómetro", icon: "Timer" },
  { value: "foto_ticket", label: "Foto del Ticket", icon: "Receipt" },
  { value: "foto_tanque", label: "Foto del Tanque", icon: "Propane" },
  { value: "foto_vehiculo", label: "Foto del Vehículo", icon: "DirectionsCar" },
  { value: "audio", label: "Audio", icon: "Mic" },
  { value: "ubicacion", label: "Ubicación", icon: "LocationOn" },
  { value: "documento", label: "Documento", icon: "Description" },
  { value: "otro", label: "Otro", icon: "AttachFile" },
];

/**
 * Verifica si una URL es una imagen
 */
export function isImageUrl(url: string): boolean {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
  return imageExtensions.some((ext) => url.toLowerCase().endsWith(ext));
}

/**
 * Verifica si una URL es un audio
 */
export function isAudioUrl(url: string): boolean {
  const audioExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac"];
  return audioExtensions.some((ext) => url.toLowerCase().endsWith(ext));
}

/**
 * Formatea el tamaño del archivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

