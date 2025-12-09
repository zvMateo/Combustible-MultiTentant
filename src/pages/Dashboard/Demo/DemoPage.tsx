// components/pages/_S/Demo/DemoPage.tsx
import { useState } from "react";
import { Box, Typography, Divider, Grid, Card } from "@mui/material";

// Tipos temporales
interface Evidencia {
  id: number;
  eventoId: number;
  tipo: string;
  url: string;
  filename?: string;
  uploadedAt: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  };
}

// Mock data para demostración
const mockImages: Evidencia[] = [
  {
    id: 1,
    eventoId: 1,
    tipo: "foto-surtidor",
    url: "https://images.unsplash.com/photo-1545262810-77515befe149?w=800",
    filename: "surtidor_001.jpg",
    uploadedAt: new Date().toISOString(),
    metadata: {
      width: 1920,
      height: 1080,
    },
  },
  {
    id: 2,
    eventoId: 1,
    tipo: "foto-cuenta-litros",
    url: "https://images.unsplash.com/photo-1621570945002-f4cdd43dbc68?w=800",
    filename: "cuenta_litros_001.jpg",
    uploadedAt: new Date().toISOString(),
    metadata: {
      width: 1920,
      height: 1080,
    },
  },
  {
    id: 3,
    eventoId: 1,
    tipo: "foto-odometro",
    url: "https://images.unsplash.com/photo-1621570945003-e6d8f8e13e88?w=800",
    filename: "odometro_001.jpg",
    uploadedAt: new Date().toISOString(),
    metadata: {
      width: 1920,
      height: 1080,
    },
  },
];

const mockAudio: Evidencia = {
  id: 4,
  eventoId: 1,
  tipo: "audio",
  url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  filename: "nota_voz_001.mp3",
  uploadedAt: new Date().toISOString(),
  metadata: {
    duration: 180,
  },
};

const mockLocation: Evidencia = {
  id: 5,
  eventoId: 1,
  tipo: "ubicacion",
  url: "",
  uploadedAt: new Date().toISOString(),
  metadata: {
    latitude: -31.420083,
    longitude: -64.188776,
    accuracy: 15,
  },
};

// Componentes simplificados (próximamente crear componentes reales)
function ImageGallery({ images, onDownload }: { images: Evidencia[]; onDownload: (e: Evidencia) => void }) {
  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="body2" color="text.secondary">
        Galería de imágenes: {images.length} fotos
      </Typography>
    </Card>
  );
}

function AudioPlayer({ audio, onDownload }: { audio: Evidencia; onDownload: (e: Evidencia) => void }) {
  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="body2" color="text.secondary">
        Reproductor de audio: {audio.filename}
      </Typography>
    </Card>
  );
}

function LocationMap({ location, height }: { location: Evidencia; height: number }) {
  return (
    <Card sx={{ p: 3, height }}>
      <Typography variant="body2" color="text.secondary">
        Mapa de ubicación: Lat {location.metadata?.latitude}, Lng {location.metadata?.longitude}
      </Typography>
    </Card>
  );
}

function FileUpload({
  onUpload,
  tipo,
  accept,
  maxSize,
  maxFiles,
  multiple = true,
}: {
  onUpload: (files: File[], tipo: string) => Promise<void>;
  tipo: string;
  accept: string;
  maxSize: number;
  maxFiles: number;
  multiple?: boolean;
}) {
  return (
    <Card sx={{ p: 3, border: "2px dashed #ddd", textAlign: "center" }}>
      <Typography variant="body2" color="text.secondary">
        Zona de carga: {tipo} (max {maxSize}MB, {maxFiles} archivos)
      </Typography>
    </Card>
  );
}

export default function DemoPage() {
  const [loading] = useState<boolean>(false);

  const handleUpload = async (files: File[], tipo: string) => {
    console.log("Uploading files:", files, "Tipo:", tipo);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log("Upload complete!");
        resolve();
      }, 2000);
    });
  };

  const handleDownload = (evidence: Evidencia) => {
    console.log("Downloading:", evidence);
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Componentes de Evidencias - Demo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Demostración de los 4 componentes de evidencias para el sistema
      </Typography>

      {/* ImageGallery */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          1. ImageGallery
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Galería con lightbox, zoom, navegación entre imágenes
        </Typography>
        <ImageGallery images={mockImages} onDownload={handleDownload} />
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* AudioPlayer */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          2. AudioPlayer
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Reproductor de audio con controles de volumen y seek
        </Typography>
        <AudioPlayer audio={mockAudio} onDownload={handleDownload} />
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* LocationMap */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          3. LocationMap
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Mapa con ubicación GPS e indicador de precisión
        </Typography>
        <LocationMap location={mockLocation} height={450} />
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* FileUpload */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          4. FileUpload
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload con drag & drop, validación y progress tracking
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
              Fotos de Surtidor
            </Typography>
            <FileUpload
              onUpload={handleUpload}
              tipo="foto-surtidor"
              accept="image/*"
              maxSize={5}
              maxFiles={3}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
              Nota de Voz
            </Typography>
            <FileUpload
              onUpload={handleUpload}
              tipo="audio"
              accept="audio/*"
              maxSize={10}
              maxFiles={1}
              multiple={false}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
