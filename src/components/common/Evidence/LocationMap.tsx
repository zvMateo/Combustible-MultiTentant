import { Box, Card, CardContent, Typography, Chip } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import type { Evidencia } from "../../../types/reports";

interface LocationMapProps {
  location: Evidencia;
  height?: number | string;
}

export default function LocationMap({
  location,
  height = 400,
}: LocationMapProps) {
  const latitude = location.metadata?.latitude;
  const longitude = location.metadata?.longitude;
  const accuracy = location.metadata?.accuracy;

  if (!latitude || !longitude) {
    return (
      <Card
        elevation={0}
        sx={{
          border: "1px solid #e0e0e0",
          borderRadius: 2,
        }}
      >
        <CardContent>
          <Box
            sx={{
              textAlign: "center",
              py: 6,
            }}
          >
            <LocationOnIcon
              sx={{
                fontSize: 64,
                color: "#ddd",
                mb: 2,
              }}
            />
            <Typography color="text.secondary">
              No hay datos de ubicación disponibles
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }


  // Alternativa sin API key usando iframe simple de OpenStreetMap
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 2,
          bgcolor: "#f8f9fa",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: "#1E2C56",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          <MyLocationIcon />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Ubicación de carga
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}
          </Typography>
        </Box>
        {accuracy && (
          <Chip
            label={`±${Math.round(accuracy)}m`}
            size="small"
            sx={{
              bgcolor: accuracy < 20 ? "#10b98115" : "#f59e0b15",
              color: accuracy < 20 ? "#10b981" : "#f59e0b",
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      {/* Map Container */}
      <Box
        sx={{
          position: "relative",
          height,
          bgcolor: "#f5f5f5",
        }}
      >
        {/* OpenStreetMap Embed */}
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={osmUrl}
          style={{
            border: 0,
          }}
          title="Mapa de ubicación"
        />

        {/* Overlay con información */}
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: 16,
            right: 16,
            bgcolor: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: 2,
            p: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Latitud
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {latitude.toFixed(6)}°
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Longitud
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {longitude.toFixed(6)}°
              </Typography>
            </Box>
          </Box>

          {accuracy && (
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #e0e0e0" }}>
              <Typography variant="caption" color="text.secondary">
                Precisión GPS
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mt: 0.5,
                }}
              >
                <Box
                  sx={{
                    flexGrow: 1,
                    height: 6,
                    bgcolor: "#e0e0e0",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: `${Math.max(0, Math.min(100, 100 - accuracy))}%`,
                      height: "100%",
                      bgcolor: accuracy < 20 ? "#10b981" : "#f59e0b",
                      transition: "width 0.3s",
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  sx={{
                    color: accuracy < 20 ? "#10b981" : "#f59e0b",
                  }}
                >
                  ±{Math.round(accuracy)}m
                </Typography>
              </Box>
            </Box>
          )}

          {/* Link para abrir en Google Maps */}
          <Box sx={{ mt: 1.5 }}>
            <a
              href={`https://www.google.com/maps?q=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#1E2C56",
                textDecoration: "none",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              Ver en Google Maps →
            </a>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
