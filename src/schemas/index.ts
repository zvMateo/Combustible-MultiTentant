/**
 * Schemas Zod centralizados para validación type-safe
 * Integración con React Hook Form via @hookform/resolvers
 * Compatible con Zod v4
 */
import { z } from "zod";

// ============================================
// MENSAJES DE ERROR COMUNES
// ============================================
const msg = {
  required: "Este campo es requerido",
  email: "Email inválido",
  minLength: (min: number) => `Mínimo ${min} caracteres`,
  maxLength: (max: number) => `Máximo ${max} caracteres`,
  positive: "Debe ser un número positivo",
  integer: "Debe ser un número entero",
  password: {
    min: "La contraseña debe tener al menos 6 caracteres",
    match: "Las contraseñas no coinciden",
  },
  dni: "DNI inválido (solo números, 7-8 dígitos)",
  phone: "Teléfono inválido",
  cuit: "CUIT inválido (formato: XX-XXXXXXXX-X)",
};

// ============================================
// VALIDADORES BASE REUTILIZABLES (Zod v4 syntax)
// ============================================
const requiredString = z.string().min(1, msg.required);

const optionalString = z.string().optional().or(z.literal(""));

const requiredEmail = z.string().min(1, msg.required).email(msg.email);

const optionalEmail = z.string().email(msg.email).optional().or(z.literal(""));

const requiredPositiveNumber = z.number().positive(msg.positive);

const optionalPositiveNumber = z.number().positive(msg.positive).optional();

const requiredId = z.number().int(msg.integer).positive(msg.positive);

const optionalId = z.number().int().positive().optional();

const optionalNullableId = optionalId.nullable();

const dni = z
  .string()
  .min(1, msg.required)
  .regex(/^\d{7,8}$/, msg.dni);

const phone = z
  .string()
  .regex(/^[\d\s\-+()]*$/, msg.phone)
  .optional()
  .or(z.literal(""));

const cuit = z
  .string()
  .regex(/^\d{2}-\d{8}-\d{1}$/, msg.cuit)
  .optional()
  .or(z.literal(""));

const password = z.string().min(6, msg.password.min);

// ============================================
// AUTH SCHEMAS
// ============================================
export const loginSchema = z.object({
  userName: requiredString,
  password: requiredString,
});

export const changePasswordSchema = z
  .object({
    currentPassword: requiredString,
    newPassword: password,
    confirmPassword: requiredString,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: msg.password.match,
    path: ["confirmPassword"],
  });

// ============================================
// USER SCHEMAS
// ============================================
export const createUserSchema = z
  .object({
    firstName: requiredString.max(50, msg.maxLength(50)),
    lastName: requiredString.max(50, msg.maxLength(50)),
    email: requiredEmail,
    userName: requiredString.max(50, msg.maxLength(50)),
    password: password,
    confirmPassword: requiredString,
    idCompany: requiredId,
    idBusinessUnit: optionalNullableId,
    phoneNumber: phone,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: msg.password.match,
    path: ["confirmPassword"],
  });

export const updateUserSchema = z.object({
  id: requiredString,
  userName: requiredString.max(50, msg.maxLength(50)),
  email: requiredEmail,
  phoneNumber: phone,
});

// ============================================
// COMPANY SCHEMAS
// ============================================
export const createCompanySchema = z.object({
  name: requiredString.max(100, msg.maxLength(100)),
  detail: optionalString.transform((v) => v || undefined),
  cuit: cuit.transform((v) => v || undefined),
  email: optionalEmail.transform((v) => v || undefined),
  phone: phone.transform((v) => v || undefined),
  address: optionalString.transform((v) => v || undefined),
});

export const updateCompanySchema = createCompanySchema.extend({
  id: requiredId,
});

// ============================================
// BUSINESS UNIT SCHEMAS
// ============================================
export const createBusinessUnitSchema = z.object({
  idCompany: requiredId,
  name: requiredString.max(100, msg.maxLength(100)),
  detail: optionalString.transform((v) => v || undefined),
});

export const updateBusinessUnitSchema = createBusinessUnitSchema.extend({
  id: requiredId,
});

// ============================================
// DRIVER SCHEMAS
// ============================================
export const createDriverSchema = z.object({
  idCompany: requiredId,
  idBusinessUnit: optionalNullableId,
  name: requiredString.max(100, msg.maxLength(100)),
  dni: dni,
  phoneNumber: phone,
});

export const updateDriverSchema = createDriverSchema.extend({
  id: requiredId,
});

// ============================================
// RESOURCE SCHEMAS (Vehículos, Tanques, Surtidores)
// ============================================
export const createResourceSchema = z.object({
  idType: requiredId,
  idCompany: requiredId,
  idBusinessUnit: optionalNullableId,
  name: requiredString.max(100, msg.maxLength(100)),
  identifier: requiredString.max(50, msg.maxLength(50)),
  nativeLiters: optionalPositiveNumber,
  initialLiters: optionalPositiveNumber,
});

export const updateResourceSchema = createResourceSchema.extend({
  id: requiredId,
});

// ============================================
// FUEL TYPE SCHEMAS
// ============================================
export const createFuelTypeSchema = z.object({
  name: requiredString.max(50, msg.maxLength(50)),
  idCompany: requiredId,
  idBusinessUnit: optionalNullableId,
});

export const updateFuelTypeSchema = createFuelTypeSchema.extend({
  id: requiredId,
});

// ============================================
// MOVEMENT TYPE SCHEMAS
// ============================================
export const createMovementTypeSchema = z.object({
  name: requiredString.max(50, msg.maxLength(50)),
  idCompany: requiredId,
  idBusinessUnit: optionalNullableId,
});

export const updateMovementTypeSchema = createMovementTypeSchema.extend({
  id: requiredId,
});

// ============================================
// FUEL STOCK MOVEMENT SCHEMAS
// ============================================
export const createFuelStockMovementSchema = z.object({
  idFuelType: requiredId,
  idResource: requiredId,
  date: requiredString,
  idMovementType: requiredId,
  idCompany: requiredId,
  idBusinessUnit: optionalNullableId,
  liters: requiredPositiveNumber,
});

export const updateFuelStockMovementSchema =
  createFuelStockMovementSchema.extend({
    id: requiredId,
  });

// ============================================
// LOAD LITERS SCHEMAS
// ============================================
const loadLitersBaseSchema = z.object({
  idResource: requiredId,
  idBusinessUnit: optionalNullableId,
  loadDate: requiredString,
  initialLiters: z.number().min(0),
  finalLiters: z.number().min(0),
  totalLiters: z.number(),
  detail: optionalString.transform((v) => v || undefined),
  idFuelType: requiredId,
});

const loadLitersRefinement = (data: {
  initialLiters: number;
  finalLiters: number;
}) => data.finalLiters >= data.initialLiters;

const loadLitersRefinementMessage = {
  message: "Los litros finales deben ser mayores o iguales a los iniciales",
  path: ["finalLiters"],
};

export const createLoadLitersSchema = loadLitersBaseSchema.refine(
  loadLitersRefinement,
  loadLitersRefinementMessage
);

export const updateLoadLitersSchema = loadLitersBaseSchema
  .extend({ id: requiredId })
  .refine(loadLitersRefinement, loadLitersRefinementMessage);

// ============================================
// TRIP SCHEMAS
// ============================================
export const createTripSchema = z.object({
  idDriver: requiredId,
  idVehicle: optionalId,
  initialLocation: requiredString.max(200, msg.maxLength(200)),
  finalLocation: requiredString.max(200, msg.maxLength(200)),
  totalKm: requiredPositiveNumber,
  startDate: optionalString,
  notes: optionalString,
});

export const updateTripSchema = createTripSchema.extend({
  id: requiredId,
});

// ============================================
// INFERRED TYPES (para usar con React Hook Form)
// ============================================
export type LoginFormData = z.infer<typeof loginSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
export type UpdateCompanyFormData = z.infer<typeof updateCompanySchema>;
export type CreateBusinessUnitFormData = z.infer<
  typeof createBusinessUnitSchema
>;
export type UpdateBusinessUnitFormData = z.infer<
  typeof updateBusinessUnitSchema
>;
export type CreateDriverFormData = z.infer<typeof createDriverSchema>;
export type UpdateDriverFormData = z.infer<typeof updateDriverSchema>;
export type CreateResourceFormData = z.infer<typeof createResourceSchema>;
export type UpdateResourceFormData = z.infer<typeof updateResourceSchema>;
export type CreateFuelTypeFormData = z.infer<typeof createFuelTypeSchema>;
export type UpdateFuelTypeFormData = z.infer<typeof updateFuelTypeSchema>;
export type CreateMovementTypeFormData = z.infer<
  typeof createMovementTypeSchema
>;
export type UpdateMovementTypeFormData = z.infer<
  typeof updateMovementTypeSchema
>;
export type CreateFuelStockMovementFormData = z.infer<
  typeof createFuelStockMovementSchema
>;
export type UpdateFuelStockMovementFormData = z.infer<
  typeof updateFuelStockMovementSchema
>;
export type CreateLoadLitersFormData = z.infer<typeof createLoadLitersSchema>;
export type UpdateLoadLitersFormData = z.infer<typeof updateLoadLitersSchema>;
export type CreateTripFormData = z.infer<typeof createTripSchema>;
export type UpdateTripFormData = z.infer<typeof updateTripSchema>;
