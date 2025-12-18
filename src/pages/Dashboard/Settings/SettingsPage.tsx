// src/pages/Dashboard/Settings/SettingsPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Camera,
  Car,
  Fuel,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Mic,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Save,
  Shield,
  TriangleAlert,
  TrendingDown,
  TrendingUp,
  Users,
  Palette,
} from "lucide-react";

import {
  useIaWhiteList,
  useCreateIaWhiteListContact,
  useUpdateIaWhiteListContact,
  useToggleIaWhiteListContact,
  useDesactivateIaWhiteListContact,
} from "@/hooks/queries/useIaWhiteList";
import type { IaWhiteListContact } from "@/services/api/ia-whitelist.api";
import { toast } from "sonner";
import { useTheme } from "@/components/providers/theme/use-theme";
import { useAuthStore } from "@/stores/auth.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";

// ==================== PERSONALIZACIÓN ====================
function PersonalizacionTab() {
  const { tenantTheme, updateTenantTheme } = useTheme();
  const [localConfig, setLocalConfig] = useState({
    primaryColor: tenantTheme?.primaryColor || "#1E2C56",
    secondaryColor: tenantTheme?.secondaryColor || "#3b82f6",
    sidebarBg: tenantTheme?.sidebarBg || "#1E2C56",
    sidebarText: tenantTheme?.sidebarText || "#ffffff",
    accentColor: tenantTheme?.accentColor || "#10b981",
  });

  const [saved, setSaved] = useState(false);

  const handleColorChange = (key: keyof typeof localConfig, value: string) => {
    setLocalConfig({ ...localConfig, [key]: value });
  };

  const handleSave = () => {
    if (updateTenantTheme) {
      updateTenantTheme(localConfig);

      // ✅ Forzar actualización inmediata de CSS variables
      document.documentElement.style.setProperty(
        "--primary-color",
        localConfig.primaryColor
      );
      document.documentElement.style.setProperty(
        "--secondary-color",
        localConfig.secondaryColor
      );
      document.documentElement.style.setProperty(
        "--sidebar-bg",
        localConfig.sidebarBg
      );
      document.documentElement.style.setProperty(
        "--sidebar-text",
        localConfig.sidebarText
      );
      document.documentElement.style.setProperty(
        "--accent-color",
        localConfig.accentColor
      );

      setSaved(true);
      toast.success("Tema guardado correctamente");
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleReset = () => {
    if (tenantTheme) {
      setLocalConfig(tenantTheme);
    }
  };

  const presets = [
    {
      name: "Azul Corporativo",
      colors: {
        primaryColor: "#1E2C56",
        secondaryColor: "#3b82f6",
        sidebarBg: "#1E2C56",
        sidebarText: "#ffffff",
        accentColor: "#10b981",
      },
    },
    {
      name: "Verde Naturaleza",
      colors: {
        primaryColor: "#10b981",
        secondaryColor: "#059669",
        sidebarBg: "#064e3b",
        sidebarText: "#d1fae5",
        accentColor: "#f59e0b",
      },
    },
    {
      name: "Rojo Energía",
      colors: {
        primaryColor: "#ef4444",
        secondaryColor: "#dc2626",
        sidebarBg: "#7f1d1d",
        sidebarText: "#fee2e2",
        accentColor: "#f59e0b",
      },
    },
    {
      name: "Púrpura Moderno",
      colors: {
        primaryColor: "#8b5cf6",
        secondaryColor: "#7c3aed",
        sidebarBg: "#5b21b6",
        sidebarText: "#ede9fe",
        accentColor: "#10b981",
      },
    },
  ];

  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Personalización del Tema</h2>
          <p className="text-muted-foreground text-sm">
            Configure los colores y estilo de su empresa. Los cambios se
            aplicarán inmediatamente.
          </p>
        </div>

        {saved ? (
          <Alert className="mt-4">
            <AlertTitle>Guardado</AlertTitle>
            <AlertDescription>Tema guardado exitosamente</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-6 space-y-2">
          <div className="text-sm font-semibold">Temas Predefinidos</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setLocalConfig(preset.colors)}
                className="border-border hover:border-primary rounded-lg border p-3 text-left transition"
              >
                <div className="mb-2 flex gap-1">
                  <div
                    className="h-5 w-5 rounded"
                    style={{ backgroundColor: preset.colors.primaryColor }}
                  />
                  <div
                    className="h-5 w-5 rounded"
                    style={{ backgroundColor: preset.colors.secondaryColor }}
                  />
                  <div
                    className="h-5 w-5 rounded"
                    style={{ backgroundColor: preset.colors.accentColor }}
                  />
                </div>
                <div className="text-xs font-semibold">{preset.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Color Primario</div>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={localConfig.primaryColor}
                onChange={(e) =>
                  handleColorChange("primaryColor", e.target.value)
                }
                className="h-9 w-16 p-1"
              />
              <Input
                value={localConfig.primaryColor}
                onChange={(e) =>
                  handleColorChange("primaryColor", e.target.value)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Color Secundario</div>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={localConfig.secondaryColor}
                onChange={(e) =>
                  handleColorChange("secondaryColor", e.target.value)
                }
                className="h-9 w-16 p-1"
              />
              <Input
                value={localConfig.secondaryColor}
                onChange={(e) =>
                  handleColorChange("secondaryColor", e.target.value)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Fondo del Sidebar</div>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={localConfig.sidebarBg}
                onChange={(e) => handleColorChange("sidebarBg", e.target.value)}
                className="h-9 w-16 p-1"
              />
              <Input
                value={localConfig.sidebarBg}
                onChange={(e) => handleColorChange("sidebarBg", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Color de Acento</div>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={localConfig.accentColor}
                onChange={(e) =>
                  handleColorChange("accentColor", e.target.value)
                }
                className="h-9 w-16 p-1"
              />
              <Input
                value={localConfig.accentColor}
                onChange={(e) =>
                  handleColorChange("accentColor", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border bg-muted/30 p-4">
          <div className="mb-3 text-sm font-semibold">Vista Previa</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button
              type="button"
              size="sm"
              style={{ backgroundColor: localConfig.primaryColor }}
              className="text-white"
            >
              PRIMARIO
            </Button>
            <div
              className="flex h-9 items-center justify-center rounded-md text-sm"
              style={{
                backgroundColor: localConfig.sidebarBg,
                color: localConfig.sidebarText,
              }}
            >
              Sidebar
            </div>
            <div
              className="flex h-9 items-center justify-center rounded-md text-sm text-white"
              style={{ backgroundColor: localConfig.accentColor }}
            >
              Acento
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              style={{
                borderColor: localConfig.secondaryColor,
                color: localConfig.secondaryColor,
              }}
            >
              SECUNDARIO
            </Button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleReset}>
            Restablecer
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            style={{ backgroundColor: localConfig.primaryColor }}
            className="text-white"
          >
            <Save className="size-4" />
            Guardar Cambios
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== POLÍTICAS DE EVIDENCIAS ====================
function PoliticasTab() {
  const [policies, setPolicies] = useState({
    requiredPhotos: true,
    requiredLocation: true,
    requiredAudio: false,
    requiredTicket: false,
    minPhotos: 1,
    maxPhotos: 5,
    locationRadius: 500, // metros
    allowManualEntry: true,
    requireValidation: true,
    validationDeadline: 24, // horas
  });
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof typeof policies) => {
    setPolicies({ ...policies, [key]: !policies[key] });
  };

  const handleChange = (key: keyof typeof policies, value: number) => {
    setPolicies({ ...policies, [key]: value });
  };

  const handleSave = () => {
    // TODO: Guardar en backend/store cuando esté disponible
    setSaved(true);
    toast.success("Políticas guardadas correctamente");
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Políticas de Evidencias</h2>
          <p className="text-muted-foreground text-sm">
            Configure qué evidencias son obligatorias para las cargas de
            combustible.
          </p>
        </div>

        {saved ? (
          <Alert className="mt-4">
            <AlertTitle>Guardado</AlertTitle>
            <AlertDescription>
              Políticas guardadas exitosamente
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="text-sm font-semibold">Evidencias Obligatorias</div>

            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Camera
                      className={
                        policies.requiredPhotos
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      }
                    />
                    <div>
                      <div className="font-medium">Fotografías</div>
                      <div className="text-muted-foreground text-xs">
                        Fotos del surtidor, cuenta-litros y odómetro
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={policies.requiredPhotos}
                    onCheckedChange={() => handleToggle("requiredPhotos")}
                  />
                </div>

                {policies.requiredPhotos ? (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-xs">
                        Mínimo
                      </div>
                      <Input
                        type="number"
                        value={String(policies.minPhotos)}
                        onChange={(e) =>
                          handleChange("minPhotos", Number(e.target.value) || 1)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-xs">
                        Máximo
                      </div>
                      <Input
                        type="number"
                        value={String(policies.maxPhotos)}
                        onChange={(e) =>
                          handleChange("maxPhotos", Number(e.target.value) || 5)
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <MapPin
                      className={
                        policies.requiredLocation
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      }
                    />
                    <div>
                      <div className="font-medium">Geolocalización</div>
                      <div className="text-muted-foreground text-xs">
                        Ubicación GPS del evento de carga
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={policies.requiredLocation}
                    onCheckedChange={() => handleToggle("requiredLocation")}
                  />
                </div>

                {policies.requiredLocation ? (
                  <div className="mt-4 space-y-1">
                    <div className="text-muted-foreground text-xs">
                      Radio máximo (metros)
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        value={String(policies.locationRadius)}
                        onChange={(e) =>
                          handleChange(
                            "locationRadius",
                            Number(e.target.value) || 500
                          )
                        }
                      />
                      <div className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                        m
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Distancia máxima al surtidor registrado
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Mic
                      className={
                        policies.requiredAudio
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      }
                    />
                    <div>
                      <div className="font-medium">Audio/Nota de Voz</div>
                      <div className="text-muted-foreground text-xs">
                        Grabación de audio explicativa
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={policies.requiredAudio}
                    onCheckedChange={() => handleToggle("requiredAudio")}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Receipt
                      className={
                        policies.requiredTicket
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      }
                    />
                    <div>
                      <div className="font-medium">Ticket/Comprobante</div>
                      <div className="text-muted-foreground text-xs">
                        Foto del ticket de la estación
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={policies.requiredTicket}
                    onCheckedChange={() => handleToggle("requiredTicket")}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">Validación de Eventos</div>

            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">Requiere Validación</div>
                    <div className="text-muted-foreground text-xs">
                      Los eventos deben ser validados por un supervisor
                    </div>
                  </div>
                  <Switch
                    checked={policies.requireValidation}
                    onCheckedChange={() => handleToggle("requireValidation")}
                  />
                </div>

                {policies.requireValidation ? (
                  <div className="mt-4 space-y-1">
                    <div className="text-muted-foreground text-xs">
                      Plazo de validación
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        value={String(policies.validationDeadline)}
                        onChange={(e) =>
                          handleChange(
                            "validationDeadline",
                            Number(e.target.value) || 24
                          )
                        }
                      />
                      <div className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                        horas
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Tiempo máximo para validar un evento
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">Permitir Carga Manual</div>
                    <div className="text-muted-foreground text-xs">
                      Permite cargar eventos desde el panel web
                    </div>
                  </div>
                  <Switch
                    checked={policies.allowManualEntry}
                    onCheckedChange={() => handleToggle("allowManualEntry")}
                  />
                </div>
              </CardContent>
            </Card>

            <Alert className="border-border">
              <AlertTitle>Resumen de Configuración</AlertTitle>
              <AlertDescription>
                <div className="mt-2 flex flex-wrap gap-2">
                  {policies.requiredPhotos ? (
                    <Badge variant="secondary">
                      {policies.minPhotos}-{policies.maxPhotos} fotos
                    </Badge>
                  ) : null}
                  {policies.requiredLocation ? (
                    <Badge variant="secondary">GPS</Badge>
                  ) : null}
                  {policies.requiredAudio ? (
                    <Badge variant="secondary">Audio</Badge>
                  ) : null}
                  {policies.requiredTicket ? (
                    <Badge variant="secondary">Ticket</Badge>
                  ) : null}
                  {policies.requireValidation ? (
                    <Badge variant="secondary">
                      Validar en {policies.validationDeadline}h
                    </Badge>
                  ) : null}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={handleSave}>
            <Save className="size-4" />
            Guardar Políticas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== PRECIOS DE COMBUSTIBLE ====================
function PreciosTab() {
  type CiudadSearchItem = {
    nombre: string;
    lat: number;
    long: number;
  };

  type PrecioBaseResponse = Record<
    string,
    {
      coordenadas: { latitud: number; longitud: number };
      horario: string;
      empresas: Record<
        string,
        Record<string, { precio: number; fecha_vigencia: string }>
      >;
    }
  >;

  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (typeof window === "undefined") return "CORDOBA";
    return window.localStorage.getItem("naftas:selectedCity") || "CORDOBA";
  });

  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<CiudadSearchItem[]>([]);

  const [precioLoading, setPrecioLoading] = useState(false);
  const [precioError, setPrecioError] = useState<string | null>(null);
  const [precioData, setPrecioData] = useState<
    PrecioBaseResponse[string] | null
  >(null);
  const precioRequestSeq = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("naftas:selectedCity", selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    if (!locationDialogOpen) return;
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
  }, [locationDialogOpen]);

  useEffect(() => {
    if (!locationDialogOpen) return;

    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError(null);

        const url = `/naftas/api/search?q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Error al buscar ciudades (${res.status})`);
        }
        const data = (await res.json()) as { cities?: CiudadSearchItem[] };
        setSearchResults(data.cities ?? []);
      } catch (e) {
        if (controller.signal.aborted) return;
        setSearchError(
          e instanceof Error
            ? e.message
            : "Error desconocido al buscar ciudades"
        );
        setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [locationDialogOpen, searchQuery]);

  const fetchPrecios = useCallback(
    async (city: string, signal?: AbortSignal) => {
      const url = `/naftas/api/precio-base?ciudad=${encodeURIComponent(
        city
      )}&tipohorario=auto`;
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`Error al cargar precios (${res.status})`);
      const json = (await res.json()) as PrecioBaseResponse;
      const cityKey = Object.keys(json)[0];
      if (!cityKey || !json[cityKey])
        throw new Error("Respuesta inválida de precios");
      return json[cityKey];
    },
    []
  );

  useEffect(() => {
    const seq = ++precioRequestSeq.current;

    (async () => {
      try {
        setPrecioLoading(true);
        setPrecioError(null);
        const data = await fetchPrecios(selectedCity);
        if (seq !== precioRequestSeq.current) return;
        setPrecioData(data);
      } catch (e) {
        if (seq !== precioRequestSeq.current) return;
        const message =
          e instanceof Error
            ? e.message
            : "Error desconocido al cargar precios";
        setPrecioError(message);
        setPrecioData(null);
        toast.error(message);
      } finally {
        if (seq === precioRequestSeq.current) {
          setPrecioLoading(false);
        }
      }
    })();
  }, [fetchPrecios, selectedCity]);

  const formatRelativeTimeEs = (iso: string) => {
    const now = Date.now();
    const dt = new Date(iso).getTime();
    if (Number.isNaN(dt)) return "";
    const diffMs = Math.max(0, now - dt);
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    const plural = (n: number, s: string) => (n === 1 ? s : `${s}s`);

    if (minutes < 1) return "Actualizado recién";
    if (minutes < 60)
      return `Actualizado hace ${minutes} ${plural(minutes, "minuto")}`;
    if (hours < 24) return `Actualizado hace ${hours} ${plural(hours, "hora")}`;
    if (days < 30) return `Actualizado hace ${days} ${plural(days, "día")}`;
    if (days < 365)
      return `Actualizado hace ${months} ${plural(months, "mes")}`;
    return `Actualizado hace ${years} ${plural(years, "año")}`;
  };

  const brandStyles: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    YPF: { bg: "bg-blue-600", text: "text-white", label: "YPF" },
    PUMA: { bg: "bg-red-600", text: "text-white", label: "PUMA" },
    AXION: { bg: "bg-purple-600", text: "text-white", label: "AXION" },
    "SHELL C.A.P.S.A.": {
      bg: "bg-red-600",
      text: "text-white",
      label: "SHELL",
    },
  };

  const empresas = useMemo(() => {
    const e = precioData?.empresas ?? {};
    return Object.entries(e).map(([empresa, combustibles]) => {
      const fuels = Object.entries(combustibles).map(([nombre, info]) => ({
        nombre,
        precio: info.precio,
        fecha_vigencia: info.fecha_vigencia,
      }));
      const avg =
        fuels.length > 0
          ? fuels.reduce(
              (acc, f) => acc + (typeof f.precio === "number" ? f.precio : 0),
              0
            ) / fuels.length
          : 0;
      return { empresa, fuels, avgPrice: avg };
    });
  }, [precioData]);

  const priceScoreByEmpresa = useMemo(() => {
    if (empresas.length === 0) return new Map<string, number>();
    const avgs = empresas.map((e) => e.avgPrice);
    const min = Math.min(...avgs);
    const max = Math.max(...avgs);
    const map = new Map<string, number>();
    for (const e of empresas) {
      const score =
        max === min
          ? 50
          : Math.round(100 - ((e.avgPrice - min) / (max - min)) * 100);
      map.set(e.empresa, Math.max(0, Math.min(100, score)));
    }
    return map;
  }, [empresas]);

  const getScoreUI = (score: number) => {
    if (score >= 60) {
      return {
        icon: <TrendingUp className="size-3" />,
        className: "bg-emerald-50 text-emerald-700",
      };
    }
    if (score >= 40) {
      return {
        icon: <TrendingDown className="size-3" />,
        className: "bg-amber-50 text-amber-700",
      };
    }
    return {
      icon: <TrendingDown className="size-3" />,
      className: "bg-red-50 text-red-700",
    };
  };

  const getUnit = (fuelName: string) => {
    return fuelName.toUpperCase().includes("GNC") ? "m³" : "l";
  };

  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Precios de Combustible</h2>
          <p className="text-muted-foreground text-sm">
            Consulte precios promedio por empresa y tipo de combustible.
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Dialog
            open={locationDialogOpen}
            onOpenChange={setLocationDialogOpen}
          >
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-2"
              onClick={() => setLocationDialogOpen(true)}
            >
              <MapPin className="size-4" />
              <span>Mostrando precios en</span>
              <span className="font-semibold">{selectedCity}</span>
              <ChevronDown className="size-4" />
            </Button>

            <DialogContent className="max-w-[560px] p-0">
              <div className="p-6 pb-0">
                <DialogHeader>
                  <DialogTitle>Configuración</DialogTitle>
                </DialogHeader>
              </div>

              <div className="px-6 pb-6">
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setLocationDialogOpen(false)}
                    aria-label="Volver"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <div className="text-sm font-semibold">Buscar ubicación</div>
                </div>

                <div className="mt-3">
                  <Command className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <CommandInput
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      placeholder="Buscar ciudad..."
                      className="border-b border-slate-100"
                    />
                    <CommandList className="max-h-[280px]">
                      {searchLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Spinner />
                        </div>
                      ) : null}
                      {searchError ? (
                        <div className="text-muted-foreground px-3 py-3 text-sm">
                          {searchError}
                        </div>
                      ) : null}
                      <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                        {searchQuery.trim().length < 2
                          ? "Escribí al menos 2 letras"
                          : "Sin resultados"}
                      </CommandEmpty>
                      <CommandGroup className="p-2">
                        {searchResults.map((c) => (
                          <CommandItem
                            key={c.nombre}
                            value={c.nombre}
                            onSelect={() => {
                              setSelectedCity(c.nombre);
                              setLocationDialogOpen(false);
                            }}
                            className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-slate-50 data-[selected=true]:bg-slate-100"
                          >
                            <MapPin className="size-4 text-slate-400" />
                            <span className="font-medium">{c.nombre}</span>
                            <ChevronRight className="ml-auto size-4 text-slate-300" />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Alert className="mt-4 border-gray-200">
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>
            Los valores son referenciales (promedios por empresa/ciudad) y
            pueden variar por estación.
          </AlertDescription>
        </Alert>

        {precioError ? (
          <Alert className="mt-4" variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              <div className="flex items-center justify-between gap-3">
                <span>{precioError}</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    try {
                      setPrecioLoading(true);
                      setPrecioError(null);
                      const data = await fetchPrecios(selectedCity);
                      setPrecioData(data);
                    } catch (e) {
                      const message =
                        e instanceof Error
                          ? e.message
                          : "Error desconocido al cargar precios";
                      setPrecioError(message);
                      setPrecioData(null);
                    } finally {
                      setPrecioLoading(false);
                    }
                  }}
                >
                  Reintentar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-6">
          {precioLoading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {empresas.map((e) => {
                const brand = brandStyles[e.empresa] || {
                  bg: "bg-muted",
                  text: "text-foreground",
                  label: e.empresa,
                };
                const score = priceScoreByEmpresa.get(e.empresa) ?? 50;
                const scoreUI = getScoreUI(score);
                return (
                  <Card key={e.empresa} className="border-border">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`${brand.bg} ${brand.text} flex h-11 w-11 items-center justify-center rounded-lg text-xs font-bold`}
                          >
                            {brand.label}
                          </div>
                          <div>
                            <div className="font-semibold">
                              {brand.label === e.empresa
                                ? e.empresa
                                : brand.label}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {selectedCity}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${scoreUI.className}`}
                        >
                          {scoreUI.icon}
                          {score}
                        </div>
                      </div>

                      <div className="mt-4 divide-y divide-gray-200 ">
                        {e.fuels.map((f) => (
                          <button
                            key={`${e.empresa}:${f.nombre}`}
                            type="button"
                            className="hover:bg-muted/40 flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold">
                                {f.nombre}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {formatRelativeTimeEs(f.fecha_vigencia)}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold whitespace-nowrap">
                                ${f.precio.toLocaleString("es-AR")} /{" "}
                                {getUnit(f.nombre)}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== UMBRALES POR VEHÍCULO ====================
function UmbralesTab() {
  const [umbrales, setUmbrales] = useState([
    {
      id: 1,
      tipoVehiculo: "Camión",
      litrosMin: 50,
      litrosMax: 300,
      alertaExceso: true,
    },
    {
      id: 2,
      tipoVehiculo: "Pickup",
      litrosMin: 20,
      litrosMax: 80,
      alertaExceso: true,
    },
    {
      id: 3,
      tipoVehiculo: "Tractor",
      litrosMin: 80,
      litrosMax: 400,
      alertaExceso: true,
    },
    {
      id: 4,
      tipoVehiculo: "Cosechadora",
      litrosMin: 100,
      litrosMax: 500,
      alertaExceso: true,
    },
    {
      id: 5,
      tipoVehiculo: "Sembradora",
      litrosMin: 50,
      litrosMax: 200,
      alertaExceso: false,
    },
    {
      id: 6,
      tipoVehiculo: "Pulverizadora",
      litrosMin: 30,
      litrosMax: 150,
      alertaExceso: false,
    },
  ]);

  const handleChange = (id: number, field: string, value: number | boolean) => {
    setUmbrales(
      umbrales.map((u) => (u.id === id ? { ...u, [field]: value } : u))
    );
  };

  const handleSave = () => {
    toast.success("Umbrales guardados correctamente");
  };

  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            Umbrales por Tipo de Vehículo
          </h2>
          <p className="text-muted-foreground text-sm">
            Configure los límites de litros permitidos por carga según el tipo
            de vehículo.
          </p>
        </div>

        <Alert className="mt-4">
          <TriangleAlert className="size-4" />
          <AlertTitle>Atención</AlertTitle>
          <AlertDescription>
            Las cargas que excedan estos umbrales generarán alertas y podrían
            requerir validación adicional.
          </AlertDescription>
        </Alert>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Vehículo</TableHead>
                <TableHead className="text-center">Mínimo (L)</TableHead>
                <TableHead className="text-center">Máximo (L)</TableHead>
                <TableHead className="text-center">Alertar Exceso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {umbrales.map((umbral) => (
                <TableRow key={umbral.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Car className="text-blue-500" size={16} />
                      <span className="font-medium">{umbral.tipoVehiculo}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="relative mx-auto w-[110px]">
                      <Input
                        type="number"
                        value={String(umbral.litrosMin)}
                        onChange={(e) =>
                          handleChange(
                            umbral.id,
                            "litrosMin",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="pr-8 text-center"
                      />
                      <span className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                        L
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="relative mx-auto w-[110px]">
                      <Input
                        type="number"
                        value={String(umbral.litrosMax)}
                        onChange={(e) =>
                          handleChange(
                            umbral.id,
                            "litrosMax",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="pr-8 text-center"
                      />
                      <span className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                        L
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={umbral.alertaExceso}
                        onCheckedChange={(checked) =>
                          handleChange(umbral.id, "alertaExceso", checked)
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={handleSave}>
            <Save className="size-4" />
            Guardar Umbrales
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== CONFIGURACIÓN DE ALERTAS ====================
function AlertasTab() {
  const [alertas, setAlertas] = useState({
    excesoCarga: true,
    cargaDuplicada: true,
    ubicacionInvalida: true,
    sinEvidencias: true,
    tanqueBajo: true,
    eventosPendientes: true,
    // Canales de notificación
    notifyEmail: true,
    notifyWhatsapp: false,
    notifyPush: false,
    // Destinatarios
    notifySupervisor: true,
    notifyAdmin: true,
    notifyOperador: false,
  });

  const handleToggle = (key: keyof typeof alertas) => {
    setAlertas({ ...alertas, [key]: !alertas[key] });
  };

  const handleSave = () => {
    toast.success("Configuración de alertas guardada");
  };

  const tiposAlerta = [
    {
      key: "excesoCarga",
      label: "Exceso de Carga",
      desc: "Cuando los litros exceden el umbral del vehículo",
    },
    {
      key: "cargaDuplicada",
      label: "Carga Duplicada",
      desc: "Posible carga duplicada en corto período",
    },
    {
      key: "ubicacionInvalida",
      label: "Ubicación Inválida",
      desc: "GPS fuera del radio permitido",
    },
    {
      key: "sinEvidencias",
      label: "Sin Evidencias",
      desc: "Evento sin las evidencias obligatorias",
    },
    {
      key: "tanqueBajo",
      label: "Tanque Bajo",
      desc: "Stock de tanque por debajo del mínimo",
    },
    {
      key: "eventosPendientes",
      label: "Eventos Pendientes",
      desc: "Eventos sin validar por más de 24h",
    },
  ];

  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Configuración de Alertas</h2>
          <p className="text-muted-foreground text-sm">
            Configure qué alertas desea recibir y cómo desea ser notificado.
          </p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Tipos de Alerta</div>
            <div className="space-y-2">
              {tiposAlerta.map((tipo) => (
                <Card key={tipo.key} className="border-border">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <div className="font-medium">{tipo.label}</div>
                      <div className="text-muted-foreground text-xs">
                        {tipo.desc}
                      </div>
                    </div>
                    <Switch
                      checked={
                        alertas[tipo.key as keyof typeof alertas] as boolean
                      }
                      onCheckedChange={() =>
                        handleToggle(tipo.key as keyof typeof alertas)
                      }
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold">
                Canales de Notificación
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="text-sm">Email</div>
                  <Switch
                    checked={alertas.notifyEmail}
                    onCheckedChange={() => handleToggle("notifyEmail")}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="text-sm">WhatsApp</div>
                  <Switch
                    checked={alertas.notifyWhatsapp}
                    onCheckedChange={() => handleToggle("notifyWhatsapp")}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="text-sm">Notificación Push</div>
                  <Switch
                    checked={alertas.notifyPush}
                    onCheckedChange={() => handleToggle("notifyPush")}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm font-semibold">Destinatarios</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="text-sm">Administrador</div>
                  <Switch
                    checked={alertas.notifyAdmin}
                    onCheckedChange={() => handleToggle("notifyAdmin")}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="text-sm">Supervisor de Unidad</div>
                  <Switch
                    checked={alertas.notifySupervisor}
                    onCheckedChange={() => handleToggle("notifySupervisor")}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="text-sm">Operador (solo sus alertas)</div>
                  <Switch
                    checked={alertas.notifyOperador}
                    onCheckedChange={() => handleToggle("notifyOperador")}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={handleSave}>
            <Save className="size-4" />
            Guardar Configuración
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
// ==================== WHITELIST DE IA ====================
function WhiteListTab() {
  const { user } = useAuthStore();
  const { data: contacts, isLoading } = useIaWhiteList(
    user?.idCompany,
    user?.idBusinessUnit
  );

  const createContact = useCreateIaWhiteListContact();
  const updateContact = useUpdateIaWhiteListContact();
  useDesactivateIaWhiteListContact();
  const toggleContact = useToggleIaWhiteListContact();

  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editData, setEditData] = useState({ name: "", phoneNumber: "" });

  const [newContact, setNewContact] = useState({
    name: "",
    phoneNumber: "",
  });

  const handleCreate = () => {
    if (!newContact.name || !newContact.phoneNumber) {
      toast.error("Complete todos los campos");
      return;
    }

    if (!user?.idCompany || !user?.idBusinessUnit) {
      toast.error("No se pudo identificar la empresa/unidad");
      return;
    }

    createContact.mutate(
      {
        name: newContact.name,
        phoneNumber: newContact.phoneNumber,
        idCompany: user.idCompany,
        idBusinessUnit: user.idBusinessUnit,
      },
      {
        onSuccess: () => {
          setNewContact({ name: "", phoneNumber: "" });
        },
      }
    );
  };

  const handleEdit = (contact: IaWhiteListContact) => {
    setIsEditing(contact.id);
    setEditData({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
    });
  };

  const handleUpdate = (id: number) => {
    if (!editData.name || !editData.phoneNumber) {
      toast.error("Complete todos los campos");
      return;
    }

    if (!user?.idCompany || !user?.idBusinessUnit) {
      toast.error("No se pudo identificar la empresa/unidad");
      return;
    }

    updateContact.mutate(
      {
        id,
        name: editData.name,
        phoneNumber: editData.phoneNumber,
        idCompany: user.idCompany,
        idBusinessUnit: user.idBusinessUnit,
      },
      {
        onSuccess: () => {
          setIsEditing(null);
        },
      }
    );
  };

  const handleToggleActive = (id: number, currentActive: boolean) => {
    toggleContact.mutate({ id, activate: !currentActive });
  };

  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">WhiteList de IA</h2>
          <p className="text-muted-foreground text-sm">
            Números de teléfono autorizados para interactuar con el bot de
            WhatsApp/IA
          </p>
        </div>

        <Alert className="mt-4">
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            Solo los números <strong>activos</strong> en esta lista podrán
            utilizar el bot de IA para registrar cargas de combustible por
            WhatsApp.
          </AlertDescription>
        </Alert>

        <div className="mt-4 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <Spinner className="size-4" />
              <span className="text-sm text-muted-foreground">Cargando...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Número de Teléfono</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground"
                    >
                      No hay contactos en la WhiteList
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts?.map((contact) => (
                    <TableRow key={contact.id} className="hover:bg-muted/50">
                      <TableCell>
                        {isEditing === contact.id ? (
                          <Input
                            value={editData.name}
                            onChange={(e) =>
                              setEditData({ ...editData, name: e.target.value })
                            }
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Users
                              className={
                                contact.active
                                  ? "text-emerald-600"
                                  : "text-muted-foreground"
                              }
                              size={16}
                            />
                            <span className="font-medium">{contact.name}</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing === contact.id ? (
                          <div className="relative">
                            <Phone className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                            <Input
                              value={editData.phoneNumber}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  phoneNumber: e.target.value,
                                })
                              }
                              placeholder="+5491123456789"
                              className="pl-9"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Phone className="text-primary size-4" />
                            <span className="text-sm">
                              {contact.phoneNumber}
                            </span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={contact.active}
                            onCheckedChange={() =>
                              handleToggleActive(contact.id, contact.active)
                            }
                          />
                          <span className="text-xs font-medium">
                            {contact.active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        {isEditing === contact.id ? (
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            onClick={() => handleUpdate(contact.id)}
                            disabled={updateContact.isPending}
                            aria-label="Guardar"
                          >
                            <Save className="size-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            onClick={() => handleEdit(contact)}
                            aria-label="Editar"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <Separator className="my-6" />

        <div className="space-y-2">
          <div className="text-sm font-medium">Agregar Nuevo Contacto</div>
          <div className="grid gap-2 md:grid-cols-[1.2fr_1.5fr_auto] md:items-center">
            <Input
              placeholder="Nombre"
              value={newContact.name}
              onChange={(e) =>
                setNewContact({ ...newContact, name: e.target.value })
              }
            />
            <div className="relative">
              <Phone className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder="+5491123456789"
                value={newContact.phoneNumber}
                onChange={(e) =>
                  setNewContact({ ...newContact, phoneNumber: e.target.value })
                }
                className="pl-9"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Formato: +5491123456789 (código país + área + número)
              </p>
            </div>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={createContact.isPending}
              className="h-9"
            >
              <Plus className="size-4" />
              Agregar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== PÁGINA PRINCIPAL ====================
export default function SettingsPage() {
  const [tab, setTab] = useState("politicas");
  const { canManageSettings } = useRoleLogic();
  const { hasPermission } = useAuthStore();
  const canEdit = hasPermission("configuracion:editar") && canManageSettings;

  return (
    <div className="space-y-4 px-6 pt-4 pb-6">
      <PageHeader
        title="Configuración"
        description="Gestión de políticas, precios, umbrales, alertas y personalización"
      />

      {!canEdit ? (
        <Alert variant="destructive" className="rounded-2xl">
          <TriangleAlert className="size-4" />
          <AlertTitle>Sin permisos</AlertTitle>
          <AlertDescription>
            No tienes permisos para editar la configuración. Los cambios no se
            guardarán.
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6 h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-secondary/50 p-1.5">
          <TabsTrigger
            value="politicas"
            className="h-10 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Shield className="size-4" />
            Políticas
          </TabsTrigger>
          <TabsTrigger
            value="precios"
            className="h-10 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Fuel className="size-4" />
            Precios
          </TabsTrigger>
          <TabsTrigger
            value="umbrales"
            className="h-10 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Car className="size-4" />
            Umbrales
          </TabsTrigger>
          <TabsTrigger
            value="whitelist"
            className="h-10 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Users className="size-4" />
            WhiteList IA
          </TabsTrigger>
          <TabsTrigger
            value="alertas"
            className="h-10 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Bell className="size-4" />
            Alertas
          </TabsTrigger>
          <TabsTrigger
            value="personalizacion"
            className="h-10 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Palette className="size-4" />
            Personalización
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "politicas" && <PoliticasTab />}
      {tab === "precios" && <PreciosTab />}
      {tab === "umbrales" && <UmbralesTab />}
      {tab === "whitelist" && <WhiteListTab />}
      {tab === "alertas" && <AlertasTab />}
      {tab === "personalizacion" && <PersonalizacionTab />}
    </div>
  );
}
