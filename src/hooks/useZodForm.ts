/**
 * Custom hook para formularios con Zod + React Hook Form
 * Proporciona validación type-safe y mejor DX
 */
import {
  useForm,
  type UseFormProps,
  type FieldValues,
  type DefaultValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

type ZodObjectSchema = z.ZodObject<z.ZodRawShape>;

/**
 * Hook wrapper para useForm con Zod resolver integrado
 * @param schema - Schema Zod para validación
 * @param options - Opciones adicionales de useForm
 */
export function useZodForm<T extends FieldValues>(
  schema: ZodObjectSchema,
  options?: Omit<UseFormProps<T>, "resolver">
) {
  return useForm<T>({
    resolver: zodResolver(schema) as never,
    mode: "onBlur",
    ...options,
  });
}

/**
 * Hook para formularios de creación (sin valores por defecto requeridos)
 */
export function useCreateForm<T extends FieldValues>(
  schema: ZodObjectSchema,
  defaultValues?: DefaultValues<T>
) {
  return useZodForm<T>(schema, { defaultValues });
}

/**
 * Hook para formularios de edición (con valores por defecto requeridos)
 */
export function useEditForm<T extends FieldValues>(
  schema: ZodObjectSchema,
  defaultValues: DefaultValues<T>
) {
  return useZodForm<T>(schema, { defaultValues });
}
