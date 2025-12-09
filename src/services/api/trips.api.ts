/**
 * Servicio de Viajes - API Real con Axios
 */
import axiosInstance from "@/lib/axios";
import type {
  Trip,
  CreateTripRequest,
  UpdateTripRequest,
} from "@/types/api.types";

const TRIPS_ENDPOINTS = {
  getAll: "/Trips/GetAll",
  getById: "/Trips/GetById",
  getByDriver: "/Trips/GetByIdDriver",
  create: "/Trips/Create",
  update: "/Trips/Update",
} as const;

export const tripsApi = {
  /**
   * Obtener todos los viajes
   */
  async getAll(): Promise<Trip[]> {
    const { data } = await axiosInstance.get<Trip[]>(TRIPS_ENDPOINTS.getAll);
    return data;
  },

  /**
   * Obtener viaje por ID
   */
  async getById(id: number): Promise<Trip> {
    const { data } = await axiosInstance.get<Trip>(TRIPS_ENDPOINTS.getById, {
      params: { id },
    });
    return data;
  },

  /**
   * Obtener viajes por chofer
   */
  async getByDriver(idDriver: number): Promise<Trip[]> {
    const { data } = await axiosInstance.get<Trip[]>(TRIPS_ENDPOINTS.getByDriver, {
      params: { idDriver },
    });
    return data;
  },

  /**
   * Crear nuevo viaje
   */
  async create(tripData: CreateTripRequest): Promise<Trip> {
    const { data } = await axiosInstance.post<Trip>(TRIPS_ENDPOINTS.create, tripData);
    return data;
  },

  /**
   * Actualizar viaje
   */
  async update(tripData: UpdateTripRequest): Promise<Trip> {
    const { data } = await axiosInstance.put<Trip>(TRIPS_ENDPOINTS.update, tripData);
    return data;
  },
};

export default tripsApi;
