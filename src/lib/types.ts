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

export type CellType = "wall" | "food" | "hazard" | "goal";
export type BrainType = "explorer" | "collector" | "survivor" | "seeker";

export type ArenaCell = { x: number; z: number; type: CellType };
export type ArenaAgent = {
  name: string;
  color: string;
  brain: BrainType;
  x: number;
  z: number;
};

export type ArenaRecord = {
  _id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  cells: ArenaCell[];
  agents: ArenaAgent[];
  shareToken?: string;
  bestScore?: number;
  createdAt: number;
  updatedAt: number;
};

export type SimAgent = ArenaAgent & {
  id: string;
  energy: number;
  score: number;
  alive: boolean;
  thought: string;
  visits: Record<string, number>;
};

export type SimFrame = {
  tick: number;
  agents: SimAgent[];
  food: string[];
  events: string[];
};
