import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  Apartment,
  BuildingRecord,
  BuildingSection,
  FileLegendDocument,
} from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTotalFloors(sections: BuildingSection[]) {
  return sections.reduce(
    (total, section) => total + (section.endFloor - section.startFloor + 1),
    0,
  );
}

export function buildApartmentId(
  sectionIndex: number,
  floorIndex: number,
  apartmentIndex: number,
) {
  return `${sectionIndex}-${floorIndex}-${apartmentIndex}`;
}

export function createUniqueLegendDocuments(
  documents: FileLegendDocument[],
): FileLegendDocument[] {
  const seen = new Set<string>();
  const unique: FileLegendDocument[] = [];

  for (const document of documents) {
    const key = `${document.name}::${document.color}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(document);
  }

  return unique;
}

export function getApartmentColor(
  apartment: Apartment,
  selectedApartments: Set<string>,
  apartmentId: string,
) {
  if (selectedApartments.has(apartmentId)) return "#FFEA00";
  if (apartment.documents.length > 0) return apartment.documents[0].color || "#fff";
  return "#fff";
}

export function cloneBuilding(building: BuildingRecord | null | undefined) {
  if (!building) return null;
  return structuredClone(building) as BuildingRecord;
}

export function getSharedLegendDocuments(building: BuildingRecord | null) {
  if (!building) return [];

  const seen = new Map<string, FileLegendDocument>();
  for (const section of building.sections) {
    for (const apartment of section.apartments) {
      for (const document of apartment.documents ?? []) {
        const color = document.color ?? "#999";
        const key = `${document.name}-${color}`;
        if (!seen.has(key)) {
          seen.set(key, {
            _id: `legend-${seen.size + 1}`,
            name: document.name,
            color,
          });
        }
      }
    }
  }

  return Array.from(seen.values());
}
