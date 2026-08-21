import type { CountryCode } from "@/lib/location";

export type VehicleType = "Motorcycle" | "Car" | "Van" | "Truck";
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
  created_at: string;
  updated_at: string;
};

export const vehicleTypes: VehicleType[] = ["Motorcycle", "Car", "Van", "Truck"];
