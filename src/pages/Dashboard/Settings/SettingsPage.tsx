// src/pages/Dashboard/Settings/SettingsPage.tsx
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  MapPin,
  Mic,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Save,
  Shield,
  TriangleAlert,
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
  const [precios, setPrecios] = useState([
    {
      id: 1,
      tipo: "Diésel",
      precio: 850,
      moneda: "ARS",
      vigenciaDesde: "2024-12-01",
      activo: true,
    },
    {
      id: 2,
      tipo: "Nafta Super",
      precio: 920,
      moneda: "ARS",
      vigenciaDesde: "2024-12-01",
      activo: true,
    },
    {
      id: 3,
      tipo: "Nafta Premium",
      precio: 1050,
      moneda: "ARS",
      vigenciaDesde: "2024-12-01",
      activo: true,
    },
    {
      id: 4,
      tipo: "GNC",
      precio: 350,
      moneda: "ARS",
      vigenciaDesde: "2024-12-01",
      activo: false,
    },
  ]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const handleEdit = (id: number, currentPrice: number) => {
    setEditingId(id);
    setEditValue(currentPrice);
  };

  const handleSave = (id: number) => {
    setPrecios(
      precios.map((p) =>
        p.id === id
          ? {
              ...p,
              precio: editValue,
              vigenciaDesde: new Date().toISOString().split("T")[0],
            }
          : p
      )
    );
    setEditingId(null);
    toast.success("Precio actualizado");
  };

  const handleToggle = (id: number) => {
    setPrecios(
      precios.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p))
    );
  };

  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Precios de Combustible</h2>
          <p className="text-muted-foreground text-sm">
            Configure los precios por tipo de combustible para el cálculo de
            costos.
          </p>
        </div>

        <Alert className="mt-4">
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>
            Los precios se utilizan para calcular el costo total de cada carga.
            Actualice los precios cuando cambien en sus proveedores.
          </AlertDescription>
        </Alert>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Combustible</TableHead>
                <TableHead className="text-right">Precio por Litro</TableHead>
                <TableHead>Vigencia Desde</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {precios.map((precio) => (
                <TableRow key={precio.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Fuel
                        className={
                          precio.activo
                            ? "text-emerald-600"
                            : "text-muted-foreground"
                        }
                        size={16}
                      />
                      <span className="font-medium">{precio.tipo}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === precio.id ? (
                      <div className="relative ml-auto w-[140px]">
                        <span className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                          $
                        </span>
                        <Input
                          type="number"
                          value={String(editValue)}
                          onChange={(e) =>
                            setEditValue(Number(e.target.value) || 0)
                          }
                          className="pl-7"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <span
                        className={
                          precio.activo
                            ? "font-semibold"
                            : "text-muted-foreground font-semibold"
                        }
                      >
                        ${precio.precio.toLocaleString()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(precio.vigenciaDesde).toLocaleDateString("es-AR")}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={precio.activo}
                      onCheckedChange={() => handleToggle(precio.id)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    {editingId === precio.id ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleSave(precio.id)}
                        aria-label="Guardar"
                      >
                        <Save className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(precio.id, precio.precio)}
                        aria-label="Editar"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Separator className="my-6" />

        <div className="space-y-2">
          <div className="text-sm font-medium">
            Agregar Nuevo Tipo de Combustible
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_200px_auto] md:items-end">
            <Input placeholder="Ej: Biodiesel" />
            <div className="relative">
              <span className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                $
              </span>
              <Input
                type="number"
                placeholder="Precio/Litro"
                className="pl-7"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                toast.info("Funcionalidad disponible próximamente")
              }
            >
              Agregar
            </Button>
          </div>
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
    <div className="space-y-6">
      <div className="border-b bg-background px-6 py-6">
        <PageHeader
          title="Configuración"
          description="Gestión de políticas, precios, umbrales, alertas y personalización"
        />
      </div>

      <div className="p-6 space-y-4">
        {!canEdit ? (
          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertTitle>Sin permisos</AlertTitle>
            <AlertDescription>
              No tienes permisos para editar la configuración. Los cambios no se
              guardarán.
            </AlertDescription>
          </Alert>
        ) : null}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-lg border bg-background p-1">
            <TabsTrigger value="politicas" className="h-10">
              <Shield className="size-4" />
              Políticas
            </TabsTrigger>
            <TabsTrigger value="precios" className="h-10">
              <Fuel className="size-4" />
              Precios
            </TabsTrigger>
            <TabsTrigger value="umbrales" className="h-10">
              <Car className="size-4" />
              Umbrales
            </TabsTrigger>
            <TabsTrigger value="whitelist" className="h-10">
              <Users className="size-4" />
              WhiteList IA
            </TabsTrigger>
            <TabsTrigger value="alertas" className="h-10">
              <Bell className="size-4" />
              Alertas
            </TabsTrigger>
            <TabsTrigger value="personalizacion" className="h-10">
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
    </div>
  );
}
