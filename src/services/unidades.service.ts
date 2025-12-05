// src/services/unidades.service.ts
import type {
  UnidadNegocio,
  UnidadNegocioFormData,
  UnidadNegocioResumen,
  UnidadNegocioStats,
  UnidadNegocioFilters,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

/**
 * Mock data para desarrollo
 */
const MOCK_UNIDADES: UnidadNegocio[] = [
  {
    id: 1,
    empresaId: 1,
    nombre: "Campo Norte",
    codigo: "CN",
    tipo: "campo",
    descripcion: "Establecimiento agrícola en zona norte",
    direccion: "Ruta Provincial 10 Km 45",
    localidad: "Monte Cristo",
    provincia: "Córdoba",
    coordenadas: { lat: -31.3456, lng: -63.9123 },
    status: "activa",
    responsable: "Juan Pérez",
    telefono: "+54 351 1234567",
    email: "camponorte@empresa.com",
    totalVehiculos: 8,
    totalChoferes: 5,
    totalEventosMes: 45,
    consumoMesLitros: 3200,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-12-01T15:30:00Z",
  },
  {
    id: 2,
    empresaId: 1,
    nombre: "Campo Sur",
    codigo: "CS",
    tipo: "campo",
    descripcion: "Establecimiento agrícola en zona sur",
    direccion: "Ruta Nacional 36 Km 120",
    localidad: "Río Cuarto",
    provincia: "Córdoba",
    coordenadas: { lat: -33.1234, lng: -64.3456 },
    status: "activa",
    responsable: "María García",
    telefono: "+54 358 7654321",
    email: "camposur@empresa.com",
    totalVehiculos: 5,
    totalChoferes: 3,
    totalEventosMes: 28,
    consumoMesLitros: 1800,
    createdAt: "2024-02-20T08:00:00Z",
    updatedAt: "2024-12-02T10:15:00Z",
  },
  {
    id: 3,
    empresaId: 1,
    nombre: "Depósito Central",
    codigo: "DC",
    tipo: "deposito",
    descripcion: "Depósito y taller central",
    direccion: "Av. Circunvalación 4500",
    localidad: "Córdoba Capital",
    provincia: "Córdoba",
    coordenadas: { lat: -31.4167, lng: -64.1833 },
    status: "activa",
    responsable: "Carlos López",
    telefono: "+54 351 9876543",
    email: "deposito@empresa.com",
    totalVehiculos: 3,
    totalChoferes: 2,
    totalEventosMes: 15,
    consumoMesLitros: 950,
    createdAt: "2024-03-10T14:00:00Z",
    updatedAt: "2024-11-28T09:45:00Z",
  },
  {
    id: 4,
    empresaId: 2,
    nombre: "Sucursal Buenos Aires",
    codigo: "SBA",
    tipo: "sucursal",
    descripcion: "Sucursal principal Buenos Aires",
    direccion: "Av. 9 de Julio 1500",
    localidad: "CABA",
    provincia: "Buenos Aires",
    status: "activa",
    responsable: "Ana Martínez",
    totalVehiculos: 12,
    totalChoferes: 8,
    totalEventosMes: 78,
    consumoMesLitros: 5600,
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-12-01T11:30:00Z",
  },
];

/**
 * Flag para usar mock o API real
 */
const USE_MOCK = true;

class UnidadesService {
  private mockData = [...MOCK_UNIDADES];

  /**
   * Listar unidades de negocio con paginación y filtros
   */
  async list(
    empresaId: number,
    params?: PaginationParams & UnidadNegocioFilters
  ): Promise<PaginatedResponse<UnidadNegocio>> {
    if (USE_MOCK) {
      await this.delay(400);

      let filtered = this.mockData.filter((u) => u.empresaId === empresaId);

      // Aplicar filtros
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.nombre.toLowerCase().includes(search) ||
            u.codigo.toLowerCase().includes(search) ||
            u.responsable?.toLowerCase().includes(search)
        );
      }

      if (params?.tipo) {
        filtered = filtered.filter((u) => u.tipo === params.tipo);
      }

      if (params?.status) {
        filtered = filtered.filter((u) => u.status === params.status);
      }

      if (params?.provincia) {
        filtered = filtered.filter((u) => u.provincia === params.provincia);
      }

      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? 10;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      return {
        data: filtered.slice(start, end),
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
      };
    }

    // API real
    return {} as PaginatedResponse<UnidadNegocio>;
  }

  /**
   * Obtener resumen de unidades para selectores
   * (solo id, nombre, codigo, tipo, status)
   */
  async getResumen(empresaId: number): Promise<UnidadNegocioResumen[]> {
    if (USE_MOCK) {
      await this.delay(200);

      return this.mockData
        .filter((u) => u.empresaId === empresaId && u.status === "activa")
        .map((u) => ({
          id: u.id,
          nombre: u.nombre,
          codigo: u.codigo,
          tipo: u.tipo,
          status: u.status,
        }));
    }

    return [];
  }

  /**
   * Obtener unidades asignadas a un usuario específico
   */
  async getByUsuario(
    empresaId: number,
    unidadIds: number[]
  ): Promise<UnidadNegocioResumen[]> {
    if (USE_MOCK) {
      await this.delay(200);

      // Si no hay IDs, devolver todas (para admin)
      if (unidadIds.length === 0) {
        return this.getResumen(empresaId);
      }

      return this.mockData
        .filter((u) => u.empresaId === empresaId && unidadIds.includes(u.id))
        .map((u) => ({
          id: u.id,
          nombre: u.nombre,
          codigo: u.codigo,
          tipo: u.tipo,
          status: u.status,
        }));
    }

    return [];
  }

  /**
   * Obtener una unidad por ID
   */
  async getById(id: number): Promise<UnidadNegocio | null> {
    if (USE_MOCK) {
      await this.delay(300);
      return this.mockData.find((u) => u.id === id) ?? null;
    }

    return null;
  }

  /**
   * Crear nueva unidad de negocio
   */
  async create(
    empresaId: number,
    data: UnidadNegocioFormData
  ): Promise<ApiResponse<UnidadNegocio>> {
    if (USE_MOCK) {
      await this.delay(500);

      // Validar código único
      const exists = this.mockData.find(
        (u) =>
          u.empresaId === empresaId &&
          u.codigo.toLowerCase() === data.codigo.toLowerCase()
      );

      if (exists) {
        return {
          success: false,
          error: "Ya existe una unidad con ese código",
        };
      }

      const newUnidad: UnidadNegocio = {
        id: Math.max(...this.mockData.map((u) => u.id)) + 1,
        empresaId,
        nombre: data.nombre,
        codigo: data.codigo.toUpperCase(),
        tipo: data.tipo,
        descripcion: data.descripcion,
        direccion: data.direccion,
        localidad: data.localidad,
        provincia: data.provincia,
        coordenadas: data.coordenadas,
        responsable: data.responsable,
        telefono: data.telefono,
        email: data.email,
        status: data.status ?? "activa",
        totalVehiculos: 0,
        totalChoferes: 0,
        totalEventosMes: 0,
        consumoMesLitros: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.mockData.push(newUnidad);

      return {
        success: true,
        data: newUnidad,
      };
    }

    return { success: false, error: "API no implementada" };
  }

  /**
   * Actualizar unidad de negocio
   */
  async update(
    id: number,
    data: Partial<UnidadNegocioFormData>
  ): Promise<ApiResponse<UnidadNegocio>> {
    if (USE_MOCK) {
      await this.delay(500);

      const index = this.mockData.findIndex((u) => u.id === id);
      if (index === -1) {
        return {
          success: false,
          error: "Unidad no encontrada",
        };
      }

      // Validar código único si se está cambiando
      if (data.codigo) {
        const exists = this.mockData.find(
          (u) =>
            u.id !== id &&
            u.empresaId === this.mockData[index].empresaId &&
            u.codigo.toLowerCase() === data.codigo!.toLowerCase()
        );

        if (exists) {
          return {
            success: false,
            error: "Ya existe una unidad con ese código",
          };
        }
      }

      const updated: UnidadNegocio = {
        ...this.mockData[index],
        ...data,
        codigo: data.codigo?.toUpperCase() ?? this.mockData[index].codigo,
        updatedAt: new Date().toISOString(),
      };

      this.mockData[index] = updated;

      return {
        success: true,
        data: updated,
      };
    }

    return { success: false, error: "API no implementada" };
  }

  /**
   * Eliminar unidad de negocio
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      await this.delay(500);

      const index = this.mockData.findIndex((u) => u.id === id);
      if (index === -1) {
        return {
          success: false,
          error: "Unidad no encontrada",
        };
      }

      // Validar que no tenga recursos asociados
      const unidad = this.mockData[index];
      if (
        (unidad.totalVehiculos ?? 0) > 0 ||
        (unidad.totalChoferes ?? 0) > 0
      ) {
        return {
          success: false,
          error: "No se puede eliminar: tiene vehículos o choferes asignados",
        };
      }

      this.mockData.splice(index, 1);

      return { success: true };
    }

    return { success: false, error: "API no implementada" };
  }

  /**
   * Cambiar estado de una unidad
   */
  async toggleStatus(id: number): Promise<ApiResponse<UnidadNegocio>> {
    if (USE_MOCK) {
      await this.delay(300);

      const index = this.mockData.findIndex((u) => u.id === id);
      if (index === -1) {
        return {
          success: false,
          error: "Unidad no encontrada",
        };
      }

      const currentStatus = this.mockData[index].status;
      const newStatus = currentStatus === "activa" ? "inactiva" : "activa";

      this.mockData[index] = {
        ...this.mockData[index],
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: this.mockData[index],
      };
    }

    return { success: false, error: "API no implementada" };
  }

  /**
   * Obtener estadísticas de una unidad
   */
  async getStats(id: number): Promise<UnidadNegocioStats | null> {
    if (USE_MOCK) {
      await this.delay(400);

      const unidad = this.mockData.find((u) => u.id === id);
      if (!unidad) return null;

      return {
        unidadId: id,
        totalVehiculos: unidad.totalVehiculos ?? 0,
        totalChoferes: unidad.totalChoferes ?? 0,
        totalSurtidores: Math.floor(Math.random() * 5) + 1,
        totalTanques: Math.floor(Math.random() * 3) + 1,
        eventosHoy: Math.floor(Math.random() * 10),
        eventosSemana: Math.floor(Math.random() * 50),
        eventosMes: unidad.totalEventosMes ?? 0,
        consumoHoyLitros: Math.floor(Math.random() * 500),
        consumoSemanaLitros: Math.floor(Math.random() * 2000),
        consumoMesLitros: unidad.consumoMesLitros ?? 0,
        costoMes: (unidad.consumoMesLitros ?? 0) * 850,
        eventosPendientesValidacion: Math.floor(Math.random() * 5),
      };
    }

    return null;
  }

  /**
   * Helper para simular delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const unidadesService = new UnidadesService();

