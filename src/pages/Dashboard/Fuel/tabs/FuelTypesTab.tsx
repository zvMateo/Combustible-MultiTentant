/**
 * FuelTypesTab - Gestión de Tipos de Combustible
 * Implementa patrón CRUD con useCrudPage
 */
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Layers, Pencil, Plus, TriangleAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useFuelTypes,
  useCreateFuelType,
  useUpdateFuelType,
  useDeactivateFuelType,
  useBusinessUnits,
} from "@/hooks/queries";
import { useIdBusinessUnit, useIdCompany } from "@/stores/auth.store";
import { useUnidadActivaId } from "@/stores/unidad.store";
import { useCrudPage } from "@/hooks/useCrudPage";
import { createFuelTypeSchema, type CreateFuelTypeFormData } from "@/schemas";
import type {
  FuelType,
  CreateFuelTypeRequest,
  UpdateFuelTypeRequest,
} from "@/types/api.types";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

// ============================================
// HELPERS
// ============================================
const fuelTypeToFormData = (type: FuelType): CreateFuelTypeFormData => ({
  name: type.name,
  fuelCompany: type.fuelCompany ?? "",
  price: typeof type.price === "number" ? type.price : 0,
  idCompany: type.idCompany ?? 0,
  idBusinessUnit: type.idBusinessUnit ?? undefined,
});

type FuelTypeCreateMode = "from_api" | "manual";

type FuelPriceCity = {
  nombre: string;
  lat: number;
  long: number;
};

type FuelPricesResponse = Record<
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

type FuelPriceItem = {
  company: string;
  name: string;
  price: number;
  updatedAt: string;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function FuelTypesTab() {
  const companyId = useIdCompany() ?? 0;
  const activeBusinessUnitId = useUnidadActivaId();
  const userBusinessUnitId = useIdBusinessUnit();
  const businessUnitId =
    activeBusinessUnitId === null
      ? null
      : activeBusinessUnitId ?? userBusinessUnitId ?? null;

  const { data: businessUnits = [] } = useBusinessUnits(companyId);

  const [createMode, setCreateMode] = useState<FuelTypeCreateMode>("from_api");
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (typeof window === "undefined") return "CORDOBA";
    return window.localStorage.getItem("naftas:selectedCity") || "CORDOBA";
  });
  const [cities, setCities] = useState<FuelPriceCity[]>([]);
  const [citySearch, setCitySearch] = useState("");
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const [fuelPricesLoading, setFuelPricesLoading] = useState(false);
  const [fuelPricesError, setFuelPricesError] = useState<string | null>(null);
  const [fuelPrices, setFuelPrices] = useState<FuelPriceItem[]>([]);
  const [selectedFuelPriceKey, setSelectedFuelPriceKey] = useState<string>("");

  // Estado para toggle (activar/desactivar)
  const [openToggleDialog, setOpenToggleDialog] = useState(false);
  const [toggleType, setToggleType] = useState<FuelType | null>(null);

  const deactivateMutation = useDeactivateFuelType();
  const updateFuelTypeMutation = useUpdateFuelType();
  const didAutoSyncRef = useRef<string | null>(null);

  // Hook CRUD genérico
  const crud = useCrudPage<
    FuelType,
    CreateFuelTypeFormData,
    CreateFuelTypeRequest,
    UpdateFuelTypeRequest
  >({
    useListQuery: useFuelTypes,
    createMutation: useCreateFuelType(),
    updateMutation: useUpdateFuelType(),
    deleteMutation: deactivateMutation,
    schema: createFuelTypeSchema,
    defaultValues: {
      name: "",
      fuelCompany: "",
      price: 0,
      idCompany: companyId,
      idBusinessUnit: businessUnitId,
    },
    entityToFormData: fuelTypeToFormData,
    prepareCreateData: (data) => ({
      name: data.name,
      fuelCompany: data.fuelCompany,
      price: data.price,
      idCompany: companyId,
      idBusinessUnit: data.idBusinessUnit ?? businessUnitId,
    }),
    prepareUpdateData: (data, type) => ({
      id: type.id,
      name: data.name,
      fuelCompany: data.fuelCompany,
      price: data.price,
      idCompany: companyId,
      idBusinessUnit: data.idBusinessUnit ?? businessUnitId,
    }),
  });

  const { form } = crud;
  const fuelTypes = crud.items;

  useEffect(() => {
    if (!companyId) return;
    if (crud.isLoading) return;
    if (!Array.isArray(fuelTypes) || fuelTypes.length === 0) return;

    const syncKey = `${companyId}:${selectedCity}`;
    if (didAutoSyncRef.current === syncKey) return;

    let cancelled = false;
    didAutoSyncRef.current = syncKey;

    const normalize = (v: string) => v.trim().toUpperCase();

    void (async () => {
      try {
        const { data } = await axiosInstance.get<FuelPricesResponse>(
          "/naftaAPI/GetData",
          { params: { ciudad: selectedCity } }
        );
        if (cancelled) return;

        const cityKey = Object.keys(data ?? {})[0];
        const payload = cityKey ? data?.[cityKey] : undefined;
        if (!payload) return;

        const priceMap = new Map<string, number>();
        for (const [company, fuels] of Object.entries(payload.empresas ?? {})) {
          for (const [name, info] of Object.entries(fuels ?? {})) {
            const key = `${normalize(company)}|${normalize(name)}`;
            if (typeof info?.precio === "number") priceMap.set(key, info.precio);
          }
        }

        let updated = 0;

        for (const ft of fuelTypes) {
          if (cancelled) return;
          if (!ft?.id) continue;
          if (!ft.name || !ft.fuelCompany) continue;

          const key = `${normalize(ft.fuelCompany)}|${normalize(ft.name)}`;
          const nextPrice = priceMap.get(key);
          if (typeof nextPrice !== "number") continue;

          const currentPrice = typeof ft.price === "number" ? ft.price : null;
          if (currentPrice === nextPrice) continue;

          const payloadUpdate: UpdateFuelTypeRequest = {
            id: ft.id,
            name: ft.name,
            idCompany: companyId,
            idBusinessUnit: ft.idBusinessUnit ?? null,
            fuelCompany: ft.fuelCompany,
            price: nextPrice,
          };

          await updateFuelTypeMutation.mutateAsync(payloadUpdate);
          updated += 1;
        }

        if (cancelled) return;
        if (updated > 0) {
          toast.success(
            `Precios sincronizados: ${updated} tipo${updated === 1 ? "" : "s"} actualizado${updated === 1 ? "" : "s"}.`
          );
        }
      } catch {
        didAutoSyncRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [companyId, crud.isLoading, fuelTypes, selectedCity, updateFuelTypeMutation]);

  useEffect(() => {
    form.register("idBusinessUnit");
  }, [form]);

  useEffect(() => {
    form.register("fuelCompany");
    form.register("price", { valueAsNumber: true });
  }, [form]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("naftas:selectedCity", selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    if (!crud.isDialogOpen) return;
    setFuelPricesError(null);
    setCityError(null);
    setSelectedFuelPriceKey("");

    if (crud.isEditing) {
      setCreateMode("manual");
    } else {
      setCreateMode("from_api");
    }
  }, [crud.isDialogOpen, crud.isEditing]);

  useEffect(() => {
    if (!crud.isDialogOpen) return;
    if (createMode !== "from_api") return;
    if (crud.isEditing) return;

    let cancelled = false;
    setFuelPricesLoading(true);
    setFuelPricesError(null);
    setFuelPrices([]);

    void (async () => {
      try {
        const { data } = await axiosInstance.get<FuelPricesResponse>(
          "/naftaAPI/GetData",
          { params: { ciudad: selectedCity } }
        );
        const cityKey = Object.keys(data ?? {})[0];
        const payload = cityKey ? data?.[cityKey] : undefined;
        if (!payload) throw new Error("Respuesta inválida de precios");

        const items: FuelPriceItem[] = [];
        for (const [company, fuels] of Object.entries(payload.empresas ?? {})) {
          for (const [name, info] of Object.entries(fuels ?? {})) {
            items.push({
              company,
              name,
              price: info.precio,
              updatedAt: info.fecha_vigencia,
            });
          }
        }

        items.sort((a, b) =>
          `${a.company} ${a.name}`.localeCompare(`${b.company} ${b.name}`)
        );

        if (cancelled) return;
        setFuelPrices(items);
      } catch (e) {
        if (cancelled) return;
        setFuelPricesError(
          e instanceof Error ? e.message : "Error desconocido al cargar precios"
        );
        setFuelPrices([]);
      } finally {
        if (!cancelled) setFuelPricesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [createMode, crud.isDialogOpen, crud.isEditing, selectedCity]);

  useEffect(() => {
    if (!crud.isDialogOpen) return;
    if (createMode !== "from_api") return;
    if (crud.isEditing) return;

    const match = fuelPrices.find(
      (p) => `${p.company}::${p.name}` === selectedFuelPriceKey
    );
    if (!match) return;

    form.setValue("fuelCompany", match.company);
    form.setValue("name", match.name);
    form.setValue("price", match.price);
  }, [createMode, crud.isDialogOpen, crud.isEditing, fuelPrices, form, selectedFuelPriceKey]);

  useEffect(() => {
    if (!crud.isDialogOpen) return;
    if (createMode !== "from_api") return;
    if (crud.isEditing) return;

    const t = window.setTimeout(async () => {
      try {
        const q = citySearch.trim();
        if (q.length < 2) {
          setCities([]);
          setCityError(null);
          setCityLoading(false);
          return;
        }
        setCityLoading(true);
        setCityError(null);
        const { data } = await axiosInstance.get<{ cities?: FuelPriceCity[] }>(
          "/naftaAPI/Search",
          { params: { q } }
        );
        setCities(data?.cities ?? []);
      } catch (e) {
        setCities([]);
        setCityError(
          e instanceof Error ? e.message : "Error desconocido al buscar ciudades"
        );
      } finally {
        setCityLoading(false);
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [citySearch, createMode, crud.isDialogOpen, crud.isEditing]);

  const handleToggleActive = async (id: number) => {
    try {
      await deactivateMutation.mutateAsync(id);
    } catch {
      // Error manejado por el mutation
    }
  };

  const handleToggleClick = (type: FuelType) => {
    setToggleType(type);
    setOpenToggleDialog(true);
  };

  if (crud.isLoading) {
    return (
      <SectionCard>
        <div className="flex items-center gap-2">
          <Spinner className="size-4" />
          <span className="text-sm text-muted-foreground">
            Cargando tipos de combustible...
          </span>
        </div>
      </SectionCard>
    );
  }

  if (crud.error) {
    return (
      <SectionCard>
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Error al cargar tipos de combustible:{" "}
            {crud.error instanceof Error
              ? crud.error.message
              : "Error desconocido"}
          </AlertDescription>
        </Alert>
      </SectionCard>
    );
  }

  return (
    <>
      <SectionCard
        title="Tipos de Combustible"
        description="Maestro de tipos de combustible disponibles"
        actions={
          <Button onClick={crud.handleNew} disabled={crud.isSaving} size="sm">
            <Plus className="size-4" />
            Nuevo Tipo
          </Button>
        }
      >
        {fuelTypes.length === 0 ? (
          <EmptyState
            icon={<Layers className="size-10" />}
            title="No hay tipos de combustible configurados"
            description='Haz clic en "Nuevo Tipo" para crear el primero'
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="w-[140px]">Precio</TableHead>
                  <TableHead className="w-[120px]">Estado</TableHead>
                  <TableHead className="w-[140px] text-right">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-mono text-xs">
                      {type.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Layers className="size-4 text-amber-500" />
                        <span className="font-medium">{type.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {type.fuelCompany ? type.fuelCompany : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {typeof type.price === "number"
                          ? `$${type.price.toLocaleString("es-AR")}`
                          : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          type.active !== false ? "secondary" : "outline"
                        }
                      >
                        {type.active !== false ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => crud.handleEdit(type)}
                          disabled={crud.isSaving}
                          aria-label="Editar"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Switch
                          checked={type.active !== false}
                          onCheckedChange={() => handleToggleClick(type)}
                          disabled={deactivateMutation.isPending}
                          aria-label={
                            type.active !== false ? "Desactivar" : "Activar"
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <Dialog
        open={crud.isDialogOpen}
        onOpenChange={(open) => !open && crud.closeDialog()}
      >
        <DialogContent className="sm:max-w-[560px] overflow-visible">
          <DialogHeader>
            <DialogTitle>
              {crud.isEditing
                ? "Editar Tipo de Combustible"
                : "Nuevo Tipo de Combustible"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(crud.onSubmit)}
            className="grid gap-4"
          >
            {!crud.isEditing ? (
              <Tabs
                value={createMode}
                onValueChange={(value) => {
                  const next = value as FuelTypeCreateMode;
                  setCreateMode(next);
                  setSelectedFuelPriceKey("");
                  if (next === "manual") {
                    form.setValue("fuelCompany", "");
                    form.setValue("price", 0);
                  }
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="from_api">Precios Generales</TabsTrigger>
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                </TabsList>

                <TabsContent value="from_api" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ciudad</label>
                    <Select
                      value={selectedCity}
                      onValueChange={(val) => {
                        setSelectedCity(val);
                        setSelectedFuelPriceKey("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-xl z-120">
                        <SelectItem value={selectedCity}>{selectedCity}</SelectItem>
                        {cities.slice(0, 20).map((c) => (
                          <SelectItem key={c.nombre} value={c.nombre}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      placeholder="Buscar otra ciudad..."
                    />
                    {cityLoading ? (
                      <p className="text-muted-foreground text-xs">Buscando...</p>
                    ) : null}
                    {cityError ? (
                      <p className="text-destructive text-xs">{cityError}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Seleccionar combustible (empresa + tipo)
                    </label>
                    {fuelPricesLoading ? (
                      <p className="text-muted-foreground text-xs">Cargando...</p>
                    ) : null}
                    {fuelPricesError ? (
                      <p className="text-destructive text-xs">{fuelPricesError}</p>
                    ) : null}
                    <Select
                      value={selectedFuelPriceKey}
                      onValueChange={(key) => {
                        setSelectedFuelPriceKey(key);
                        const price = fuelPrices.find(p => `${p.company}-${p.name}` === key);
                        if (price) {
                          form.setValue("fuelCompany", price.company);
                          form.setValue("price", Number(price.price));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar combustible" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-xl z-120 max-h-60 overflow-y-auto">
                        {fuelPricesLoading ? (
                          <div className="p-2 text-center text-muted-foreground text-sm">
                            Cargando precios...
                          </div>
                        ) : fuelPricesError ? (
                          <div className="p-2 text-center text-destructive text-sm">
                            Error al cargar precios
                          </div>
                        ) : (
                          fuelPrices.map((price) => {
                            const key = `${price.company}-${price.name}`;
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {price.company} - {price.name}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    ${Number(price.price).toFixed(2)}
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Ingresa los datos manualmente
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Completa los campos below para agregar un tipo de combustible manualmente.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                {...form.register("name")}
                placeholder="Ej: Nafta Super, Diesel Premium"
                autoFocus
                disabled={createMode === "from_api" && !crud.isEditing}
                aria-invalid={!!form.formState.errors.name}
              />
              {form.formState.errors.name && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa (proveedor) *</label>
              <Input
                value={form.watch("fuelCompany") ?? ""}
                onChange={(e) => form.setValue("fuelCompany", e.target.value)}
                placeholder="Ej: YPF, Shell, Mayorista X"
                disabled={createMode === "from_api" && !crud.isEditing}
                aria-invalid={!!form.formState.errors.fuelCompany}
              />
              {form.formState.errors.fuelCompany && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.fuelCompany.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Precio *</label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={String(form.watch("price") ?? 0)}
                  onChange={(e) =>
                    form.setValue("price", Number(e.target.value) || 0)
                  }
                  disabled={createMode === "from_api" && !crud.isEditing}
                  aria-invalid={!!form.formState.errors.price}
                />
                <div className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  $
                </div>
              </div>
              {form.formState.errors.price && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Unidad de Negocio (opcional)
              </label>
              <Select
                value={
                  form.watch("idBusinessUnit") != null
                    ? String(form.watch("idBusinessUnit"))
                    : "none"
                }
                onValueChange={(value) =>
                  form.setValue(
                    "idBusinessUnit",
                    value === "none" ? null : Number(value)
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-xl z-120">
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {businessUnits.map((bu) => (
                    <SelectItem key={bu.id} value={String(bu.id)}>
                      {bu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={crud.closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crud.isSaving}>
                {crud.isSaving
                  ? "Guardando..."
                  : crud.isEditing
                  ? "Guardar Cambios"
                  : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={openToggleDialog}
        onOpenChange={(open) => {
          setOpenToggleDialog(open);
          if (!open) setToggleType(null);
        }}
        title={
          toggleType?.active !== false
            ? "Confirmar desactivación"
            : "Confirmar activación"
        }
        description={
          <>
            ¿Estás seguro de{" "}
            {toggleType?.active !== false ? "desactivar" : "activar"} el tipo de
            combustible <strong>{toggleType?.name}</strong>?
          </>
        }
        confirmLabel={
          deactivateMutation.isPending
            ? "Procesando..."
            : toggleType?.active !== false
            ? "Desactivar"
            : "Activar"
        }
        onConfirm={async () => {
          if (!toggleType) return;
          await handleToggleActive(toggleType.id);
          setOpenToggleDialog(false);
          setToggleType(null);
        }}
        confirmDisabled={deactivateMutation.isPending}
      />
    </>
  );
}
