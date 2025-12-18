/**
 * Transformadores genéricos para normalizar respuestas de API
 *
 * Maneja inconsistencias de casing del backend (camelCase vs PascalCase)
 * Principio: Single Responsibility - Solo transformación de datos
 */

type KeyMapping = Record<string, string>;

/**
 * Mapeos por defecto para normalizar keys de la API
 * Convierte PascalCase y variantes a camelCase consistente
 */
const DEFAULT_KEY_MAPPINGS: KeyMapping = {
  // IDs
  Id: "id",
  ID: "id",
  IdType: "idType",
  idtype: "idType",
  IdCompany: "idCompany",
  idcompany: "idCompany",
  IdBusinessUnit: "idBusinessUnit",
  idbusinessunit: "idBusinessUnit",
  IdDriver: "idDriver",
  iddriver: "idDriver",
  IdVehicle: "idVehicle",
  idvehicle: "idVehicle",
  IdResource: "idResource",
  idresource: "idResource",
  IdFuelType: "idFuelType",
  idfueltype: "idFuelType",
  IdMovementType: "idMovementType",
  idmovementtype: "idMovementType",

  // Propiedades comunes
  Name: "name",
  Detail: "detail",
  Identifier: "identifier",
  Active: "active",
  IsActive: "active",
  isActive: "active",

  // Recursos
  NativeLiters: "nativeLiters",
  nativeliters: "nativeLiters",
  ActualLiters: "actualLiters",
  actualliters: "actualLiters",
  InitialLiters: "initialLiters",
  initialliters: "initialLiters",
  FinalLiters: "finalLiters",
  finalliters: "finalLiters",
  TotalLiters: "totalLiters",
  totalliters: "totalLiters",

  // Conductores
  Dni: "dni",
  DNI: "dni",
  PhoneNumber: "phoneNumber",
  phonenumber: "phoneNumber",

  // Fechas
  CreatedAt: "createdAt",
  createdat: "createdAt",
  UpdatedAt: "updatedAt",
  updatedat: "updatedAt",
  LoadDate: "loadDate",
  loaddate: "loadDate",
  StartDate: "startDate",
  startdate: "startDate",

  // Viajes
  InitialLocation: "initialLocation",
  initiallocation: "initialLocation",
  FinalLocation: "finalLocation",
  finallocation: "finalLocation",
  TotalKm: "totalKm",
  totalkm: "totalKm",

  // Relaciones
  BusinessUnit: "businessUnit",
  businessunit: "businessUnit",
  Company: "company",
  Resource: "resource",
  Driver: "driver",
  FuelType: "fuelType",
  fueltype: "fuelType",
  MovementType: "movementType",
  movementtype: "movementType",

  // Nombres derivados
  NameResource: "nameResource",
  nameresource: "nameResource",
  NameDriver: "nameDriver",
  namedriver: "nameDriver",
  NameFuelType: "nameFuelType",
  namefueltype: "nameFuelType",
};

/**
 * Verifica si un valor es un objeto plano (no array, no null, no Date)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

/**
 * Normaliza las keys de un objeto según los mapeos proporcionados
 * Recursivamente procesa objetos anidados y arrays
 *
 * @param data - Datos a normalizar
 * @param mappings - Mapeos de keys (opcional, usa DEFAULT_KEY_MAPPINGS)
 * @returns Datos con keys normalizadas
 */
export function normalizeKeys<T>(
  data: unknown,
  mappings: KeyMapping = DEFAULT_KEY_MAPPINGS
): T {
  if (Array.isArray(data)) {
    return data.map((item) => normalizeKeys<unknown>(item, mappings)) as T;
  }

  if (!isPlainObject(data)) {
    return data as T;
  }

  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = mappings[key] ?? key;
    normalized[normalizedKey] = normalizeKeys(value, mappings);
  }

  return normalized as T;
}

/**
 * Normaliza respuestas de API que pueden venir como:
 * - Array directo: [...]
 * - Objeto envuelto: { result: [...] }
 * - Objeto envuelto: { data: [...] }
 *
 * @param data - Respuesta de la API
 * @returns Array normalizado
 */
export function normalizeArrayResponse<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data.map((item) => normalizeKeys<T>(item));
  }

  if (isPlainObject(data)) {
    const wrapped = data as Record<string, unknown>;

    if (Array.isArray(wrapped.result)) {
      return wrapped.result.map((item) => normalizeKeys<T>(item));
    }

    if (Array.isArray(wrapped.data)) {
      return wrapped.data.map((item) => normalizeKeys<T>(item));
    }
  }

  return [];
}

/**
 * Normaliza una respuesta de API que devuelve un solo objeto
 *
 * @param data - Respuesta de la API
 * @returns Objeto normalizado o null
 */
export function normalizeObjectResponse<T>(data: unknown): T | null {
  if (!data) return null;

  if (isPlainObject(data)) {
    const wrapped = data as Record<string, unknown>;

    // Si viene envuelto en result o data
    if (wrapped.result && isPlainObject(wrapped.result)) {
      return normalizeKeys<T>(wrapped.result);
    }

    if (wrapped.data && isPlainObject(wrapped.data)) {
      return normalizeKeys<T>(wrapped.data);
    }

    return normalizeKeys<T>(data);
  }

  return null;
}

/**
 * Extrae un valor de un objeto con múltiples posibles keys
 * Útil para manejar inconsistencias de naming en la API
 *
 * @param obj - Objeto fuente
 * @param keys - Lista de posibles keys en orden de prioridad
 * @param defaultValue - Valor por defecto si no se encuentra ninguna key
 */
export function extractValue<T>(
  obj: Record<string, unknown>,
  keys: string[],
  defaultValue: T
): T {
  for (const key of keys) {
    if (key in obj && obj[key] !== undefined) {
      return obj[key] as T;
    }
  }
  return defaultValue;
}

/**
 * Crea un normalizador específico para una entidad
 * Permite definir transformaciones adicionales post-normalización
 *
 * @param postTransform - Función de transformación adicional
 */
export function createEntityNormalizer<TRaw, TEntity>(
  postTransform?: (normalized: Record<string, unknown>) => TEntity
) {
  return (raw: TRaw): TEntity => {
    const normalized = normalizeKeys<Record<string, unknown>>(raw);
    return postTransform ? postTransform(normalized) : (normalized as TEntity);
  };
}
