/**
 * Hook genérico para páginas CRUD
 */
import { useState, useMemo, useCallback } from "react";
import {
  useForm,
  type UseFormReturn,
  type DefaultValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutationResult } from "@tanstack/react-query";
import { useDebouncedValue } from "./useDebouncedValue";

/**
 * Configuración del hook useCrudPage
 */
export interface UseCrudPageConfig<
  TEntity extends { id: number },
  TFormData extends Record<string, unknown>,
  TCreateData = TFormData,
  TUpdateData = TFormData & { id: number }
> {
  /** Hook de TanStack Query para obtener la lista */
  useListQuery: () => {
    data?: TEntity[];
    isLoading: boolean;
    error: Error | null;
  };

  /** Mutación para crear */
  createMutation: UseMutationResult<TEntity, Error, TCreateData>;

  /** Mutación para actualizar */
  updateMutation: UseMutationResult<TEntity, Error, TUpdateData>;

  /** Mutación para eliminar (opcional) */
  deleteMutation?: UseMutationResult<unknown, Error, number>;

  /** Schema de Zod para validación (usar z.object o similar) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any;

  /** Valores por defecto del formulario */
  defaultValues: DefaultValues<TFormData>;

  /** Función para filtrar entidades (opcional) */
  filterFn?: (entity: TEntity, searchTerm: string) => boolean;

  /** Función para convertir entidad a datos del formulario */
  entityToFormData: (entity: TEntity) => TFormData;

  /** Función para preparar datos antes de crear (opcional) */
  prepareCreateData?: (formData: TFormData) => TCreateData;

  /** Función para preparar datos antes de actualizar (opcional) */
  prepareUpdateData?: (formData: TFormData, entity: TEntity) => TUpdateData;

  /** Delay para debounce de búsqueda (ms) */
  searchDebounceMs?: number;

  /** Callback después de crear exitosamente */
  onCreateSuccess?: (entity: TEntity) => void;

  /** Callback después de actualizar exitosamente */
  onUpdateSuccess?: (entity: TEntity) => void;

  /** Callback después de eliminar exitosamente */
  onDeleteSuccess?: () => void;
}

/**
 * Retorno del hook useCrudPage
 */
export interface UseCrudPageReturn<
  TEntity extends { id: number },
  TFormData extends Record<string, unknown>
> {
  // === Estado de datos ===
  /** Lista completa de entidades */
  items: TEntity[];
  /** Lista filtrada por búsqueda */
  filteredItems: TEntity[];
  /** Estado de carga */
  isLoading: boolean;
  /** Error de la query */
  error: Error | null;

  // === Estado de búsqueda ===
  /** Término de búsqueda actual */
  searchTerm: string;
  /** Setter para término de búsqueda */
  setSearchTerm: (term: string) => void;
  /** Término de búsqueda con debounce */
  debouncedSearchTerm: string;

  // === Estado de diálogos ===
  /** Si el dialog de crear/editar está abierto */
  isDialogOpen: boolean;
  /** Abre el dialog */
  openDialog: () => void;
  /** Cierra el dialog y resetea estado */
  closeDialog: () => void;
  /** Si el dialog de eliminar está abierto */
  isDeleteDialogOpen: boolean;
  /** Abre el dialog de eliminar */
  openDeleteDialog: (entity: TEntity) => void;
  /** Cierra el dialog de eliminar */
  closeDeleteDialog: () => void;

  // === Estado de edición ===
  /** Entidad siendo editada (null si es creación) */
  editingItem: TEntity | null;
  /** Entidad a eliminar */
  deletingItem: TEntity | null;
  /** Si estamos en modo edición */
  isEditing: boolean;

  // === Formulario ===
  /** Instancia de React Hook Form */
  form: UseFormReturn<TFormData>;

  // === Handlers ===
  /** Abre dialog para crear nuevo */
  handleNew: () => void;
  /** Abre dialog para editar existente */
  handleEdit: (entity: TEntity) => void;
  /** Inicia proceso de eliminación */
  handleDelete: (entity: TEntity) => void;
  /** Confirma eliminación */
  confirmDelete: () => Promise<void>;
  /** Submit del formulario (crear o actualizar) */
  onSubmit: (data: TFormData) => Promise<void>;

  // === Estados de mutación ===
  /** Si hay una operación de guardado en progreso */
  isSaving: boolean;
  /** Si hay una operación de eliminación en progreso */
  isDeleting: boolean;
}

export function useCrudPage<
  TEntity extends { id: number },
  TFormData extends Record<string, unknown>,
  TCreateData = TFormData,
  TUpdateData = TFormData & { id: number }
>(
  config: UseCrudPageConfig<TEntity, TFormData, TCreateData, TUpdateData>
): UseCrudPageReturn<TEntity, TFormData> {
  const {
    useListQuery,
    createMutation,
    updateMutation,
    deleteMutation,
    schema,
    defaultValues,
    filterFn,
    entityToFormData,
    prepareCreateData,
    prepareUpdateData,
    searchDebounceMs = 300,
    onCreateSuccess,
    onUpdateSuccess,
    onDeleteSuccess,
  } = config;

  // === Query de lista ===
  const { data: items = [], isLoading, error } = useListQuery();

  // === Estado de búsqueda ===
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, searchDebounceMs);

  // === Estado de diálogos ===
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // === Estado de edición ===
  const [editingItem, setEditingItem] = useState<TEntity | null>(null);
  const [deletingItem, setDeletingItem] = useState<TEntity | null>(null);

  // === Formulario ===
  const form = useForm<TFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // === Filtrado ===
  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim() || !filterFn) {
      return items;
    }
    const term = debouncedSearchTerm.toLowerCase();
    return items.filter((item) => filterFn(item, term));
  }, [items, debouncedSearchTerm, filterFn]);

  // === Handlers de dialog ===
  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingItem(null);
    form.reset(defaultValues);
  }, [form, defaultValues]);

  const openDeleteDialog = useCallback((entity: TEntity) => {
    setDeletingItem(entity);
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setDeletingItem(null);
  }, []);

  // === Handlers de CRUD ===
  const handleNew = useCallback(() => {
    setEditingItem(null);
    form.reset(defaultValues);
    openDialog();
  }, [form, defaultValues, openDialog]);

  const handleEdit = useCallback(
    (entity: TEntity) => {
      setEditingItem(entity);
      const formData = entityToFormData(entity);
      form.reset(formData as DefaultValues<TFormData>);
      openDialog();
    },
    [form, entityToFormData, openDialog]
  );

  const handleDelete = useCallback(
    (entity: TEntity) => {
      openDeleteDialog(entity);
    },
    [openDeleteDialog]
  );

  const confirmDelete = useCallback(async () => {
    if (!deletingItem || !deleteMutation) return;

    try {
      await deleteMutation.mutateAsync(deletingItem.id);
      onDeleteSuccess?.();
      closeDeleteDialog();
    } catch {
      // Error manejado por la mutación
    }
  }, [deletingItem, deleteMutation, onDeleteSuccess, closeDeleteDialog]);

  const onSubmit = useCallback(
    async (data: TFormData) => {
      try {
        if (editingItem) {
          // Actualizar
          const updateData = prepareUpdateData
            ? prepareUpdateData(data, editingItem)
            : ({ ...data, id: editingItem.id } as TUpdateData);

          const result = await updateMutation.mutateAsync(updateData);
          onUpdateSuccess?.(result);
        } else {
          // Crear
          const createData = prepareCreateData
            ? prepareCreateData(data)
            : (data as unknown as TCreateData);

          const result = await createMutation.mutateAsync(createData);
          onCreateSuccess?.(result);
        }
        closeDialog();
      } catch {
        // Error manejado por la mutación
      }
    },
    [
      editingItem,
      createMutation,
      updateMutation,
      prepareCreateData,
      prepareUpdateData,
      onCreateSuccess,
      onUpdateSuccess,
      closeDialog,
    ]
  );

  // === Estados derivados ===
  const isEditing = editingItem !== null;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation?.isPending ?? false;

  return {
    // Estado de datos
    items,
    filteredItems,
    isLoading,
    error,

    // Estado de búsqueda
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,

    // Estado de diálogos
    isDialogOpen,
    openDialog,
    closeDialog,
    isDeleteDialogOpen,
    openDeleteDialog,
    closeDeleteDialog,

    // Estado de edición
    editingItem,
    deletingItem,
    isEditing,

    // Formulario
    form,

    // Handlers
    handleNew,
    handleEdit,
    handleDelete,
    confirmDelete,
    onSubmit,

    // Estados de mutación
    isSaving,
    isDeleting,
  };
}
