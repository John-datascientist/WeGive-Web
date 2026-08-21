import type { CountryCode } from "@/lib/location";

export type VehicleType = "Bicycle" | "Motorcycle" | "Car" | "Van" | "Truck";
export type RiderStatus = "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";

export type Rider = {
  id: string;
  user_id: string;
  vehicle_type: VehicleType;
  status: RiderStatus;
  country: CountryCode;
  available: boolean;
  last_lat: number | null;
  last_lng: number | null;
  last_location_at: string | null;
  /** Storage path (rider-documents bucket) to the rider's ID photo. */
  id_photo_path: string | null;
  /** Storage paths (rider-documents bucket) to vehicle photos, e.g. front/side/plate. */
  vehicle_photo_paths: string[];
  created_at: string;
  updated_at: string;
};

export const vehicleTypes: VehicleType[] = ["Bicycle", "Motorcycle", "Car", "Van", "Truck"];

export const RIDER_DOCUMENTS_BUCKET = "rider-documents";
