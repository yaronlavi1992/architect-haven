import type { Id } from "$convex/_generated/dataModel";

export type FileLegendDocument = {
  _id: string;
  name: string;
  color: string;
  url?: string | null;
  storageId?: Id<"_storage"> | null;
};

export type ApartmentDocument = {
  name: string;
  color?: string;
  signedUrl?: string;
  storageId?: Id<"_storage">;
};

export type Apartment = {
  apartmentIndex: number;
  isSelected: boolean;
  type: string;
  documents: ApartmentDocument[];
};

export type BuildingSection = {
  startFloor: number;
  endFloor: number;
  apartmentsCount: number;
  description: string;
  apartments: Apartment[];
};

export type BuildingRecord = {
  _id: string;
  name: string;
  sections: BuildingSection[];
  shareToken?: string;
};

export type PlanDetails = {
  name?: string;
  buildingLimit?: number | null;
  priceDisplay?: string;
  features?: readonly string[];
};

export type PlansPayload = {
  freeLimit?: number;
  proPriceDisplay?: string;
  plans?: {
    free?: PlanDetails;
    pro?: PlanDetails;
  };
};
