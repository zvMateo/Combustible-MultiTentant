/**
 * Servicio de Cargas de Combustible (LoadLiters) - API Real con Axios
 */
import axiosInstance from "@/lib/axios";
import type {
  LoadLiters,
  CreateLoadLitersRequest,
  UpdateLoadLitersRequest,
  LoadTrip,
  CreateLoadTripRequest,
} from "@/types/api.types";

const LOAD_LITERS_ENDPOINTS = {
  getAll: "/LoadLiters/GetAll",
  getById: "/LoadLiters/GetById",
  create: "/LoadLiters/Create",
  update: "/LoadLiters/Update",
  associateLoadTrip: "/LoadLiters/AssociateLoadTrip",
  getAllLoadTrips: "/LoadLiters/GetAllLoadTrips",
  getByIdLoadTrips: "/LoadLiters/GetByIdLoadTrips",
  getByIdTrip: "/LoadLiters/GetByIdTrip",
} as const;

export const loadLitersApi = {
  /**
   * Obtener todas las cargas de combustible
   */
  async getAll(): Promise<LoadLiters[]> {
    const { data } = await axiosInstance.get<LoadLiters[]>(
      LOAD_LITERS_ENDPOINTS.getAll
    );
    return data;
  },

  /**
   * Obtener carga de combustible por ID
   */
  async getById(id: number): Promise<LoadLiters> {
    const { data } = await axiosInstance.get<LoadLiters>(
      LOAD_LITERS_ENDPOINTS.getById,
      { params: { id } }
    );
    return data;
  },

  /**
   * Crear nueva carga de combustible
   */
  async create(loadData: CreateLoadLitersRequest): Promise<LoadLiters> {
    const { data } = await axiosInstance.post<LoadLiters>(
      LOAD_LITERS_ENDPOINTS.create,
      loadData
    );
    return data;
  },

  /**
   * Actualizar carga de combustible
   */
  async update(id: number, loadData: UpdateLoadLitersRequest): Promise<LoadLiters> {
    const { data } = await axiosInstance.put<LoadLiters>(
      LOAD_LITERS_ENDPOINTS.update,
      loadData,
      { params: { id } }
    );
    return data;
  },

  /**
   * Asociar carga con viaje
   */
  async associateLoadTrip(tripData: CreateLoadTripRequest): Promise<LoadTrip> {
    const { data } = await axiosInstance.post<LoadTrip>(
      LOAD_LITERS_ENDPOINTS.associateLoadTrip,
      tripData
    );
    return data;
  },

  /**
   * Obtener todas las asociaciones carga-viaje
   */
  async getAllLoadTrips(): Promise<LoadTrip[]> {
    const { data } = await axiosInstance.get<LoadTrip[]>(
      LOAD_LITERS_ENDPOINTS.getAllLoadTrips
    );
    return data;
  },

  /**
   * Obtener asociación carga-viaje por ID
   */
  async getByIdLoadTrips(id: number): Promise<LoadTrip> {
    const { data } = await axiosInstance.get<LoadTrip>(
      LOAD_LITERS_ENDPOINTS.getByIdLoadTrips,
      { params: { id } }
    );
    return data;
  },

  /**
   * Obtener asociaciones carga-viaje por ID de viaje
   */
  async getByIdTrip(idTrip: number): Promise<LoadTrip[]> {
    const { data } = await axiosInstance.get<LoadTrip[]>(
      LOAD_LITERS_ENDPOINTS.getByIdTrip,
      { params: { idTrip } }
    );
    return data;
  },
};

export default loadLitersApi;

