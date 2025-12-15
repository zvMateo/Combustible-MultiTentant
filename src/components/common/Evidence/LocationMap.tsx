import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation } from "lucide-react";
import type { Evidencia } from "@/types/evidencia";

interface LocationMapProps {
  location: Evidencia;
  height?: number | string;
}

export default function LocationMap({
  location,
  height = 400,
}: LocationMapProps) {
  const latitude =
    location.latitud ??
    (location.metadata as { latitude?: number } | undefined)?.latitude;
  const longitude =
    location.longitud ??
    (location.metadata as { longitude?: number } | undefined)?.longitude;
  const accuracy = location.metadata?.accuracy;

  if (!latitude || !longitude) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MapPin className="size-16 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            No hay datos de ubicación disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    longitude - 0.01
  },${latitude - 0.01},${longitude + 0.01},${
    latitude + 0.01
  }&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-muted/30 border-b">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
          <Navigation className="size-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Ubicación de carga</p>
          <p className="text-xs text-muted-foreground">
            {`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}
          </p>
        </div>
        {accuracy && (
          <Badge
            variant="secondary"
            className={
              accuracy < 20
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-amber-500/10 text-amber-600"
            }
          >
            ±{Math.round(accuracy)}m
          </Badge>
        )}
      </div>

      {/* Map Container */}
      <div className="relative bg-muted" style={{ height }}>
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={osmUrl}
          className="border-0"
          title="Mapa de ubicación"
        />

        {/* Overlay con información */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Latitud</p>
              <p className="font-semibold text-sm">{latitude.toFixed(6)}°</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Longitud</p>
              <p className="font-semibold text-sm">{longitude.toFixed(6)}°</p>
            </div>
          </div>

          {accuracy && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-1">
                Precisión GPS
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      accuracy < 20 ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{
                      width: `${Math.max(0, Math.min(100, 100 - accuracy))}%`,
                    }}
                  />
                </div>
                <span
                  className={`text-xs font-semibold ${
                    accuracy < 20 ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  ±{Math.round(accuracy)}m
                </span>
              </div>
            </div>
          )}

          <div className="mt-3">
            <a
              href={`https://www.google.com/maps?q=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Ver en Google Maps →
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
