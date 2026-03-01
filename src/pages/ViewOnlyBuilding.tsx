import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ErrorBoundary } from "react-error-boundary";
import Building3D from "../components/Building3D";
import FilesLegend from "../components/FilesLegend";
import ErrorFallback from "../components/ErrorFallback";
import { Link } from "react-router-dom";
import { useMemo, useState, useCallback } from "react";

export default function ViewOnlyBuilding() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const building = useQuery(
    api.buildings.getByShareToken,
    shareToken ? { shareToken } : "skip",
  );
  const [selectedApartments, setSelectedApartments] = useState<Set<string>>(
    new Set(),
  );

  const handleApartmentClick = useCallback(
    (sectionIndex: number, floorIndex: number, apartmentIndex: number) => {
      const id = `${sectionIndex}-${floorIndex}-${apartmentIndex}`;
      setSelectedApartments((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [],
  );

  const handleDocumentLegendClick = useCallback(
    (color: string) => {
      if (!building) return;
      const next = new Set<string>();
      building.sections.forEach(
        (
          section: {
            endFloor: number;
            startFloor: number;
            apartments: Array<{ documents: Array<{ color?: string }> }>;
          },
          sectionIndex: number,
        ) => {
          const floorCount = section.endFloor - section.startFloor + 1;
          section.apartments.forEach(
            (
              apt: { documents: Array<{ color?: string }> },
              apartmentIndex: number,
            ) => {
              if (
                apt.documents?.length > 0 &&
                apt.documents[0].color === color
              ) {
                for (
                  let floorIndex = 0;
                  floorIndex < floorCount;
                  floorIndex++
                ) {
                  next.add(`${sectionIndex}-${floorIndex}-${apartmentIndex}`);
                }
              }
            },
          );
        },
      );
      setSelectedApartments(next);
    },
    [building],
  );

  const totalFloors = building
    ? building.sections.reduce(
        (total: number, section: { endFloor: number; startFloor: number }) =>
          total + section.endFloor - section.startFloor + 1,
        0,
      )
    : 5;

  const documentsForLegend = useMemo(() => {
    if (!building) return [];
    const seen = new Map<string, { name: string; color: string }>();
    building.sections.forEach(
      (section: {
        apartments: Array<{
          documents: Array<{ name: string; color?: string }>;
        }>;
      }) => {
        section.apartments.forEach((apt) => {
          (apt.documents || []).forEach((doc) => {
            const key = `${doc.name}-${doc.color ?? ""}`;
            if (!seen.has(key))
              seen.set(key, { name: doc.name, color: doc.color ?? "#999" });
          });
        });
      },
    );
    return Array.from(seen.values()).map((d, i) => ({
      _id: `legend-${i}`,
      name: d.name,
      color: d.color,
    }));
  }, [building]);

  const selectedDocumentsWithUrls = useMemo(() => {
    if (!building || selectedApartments.size === 0) return [];
    const docs: Array<{ name: string; signedUrl: string }> = [];
    const seen = new Set<string>();
    selectedApartments.forEach((id) => {
      const [s, , a] = id.split("-").map(Number);
      const apt = building.sections[s]?.apartments?.[a];
      (apt?.documents || []).forEach(
        (doc: { name: string; signedUrl?: string }) => {
          if (doc.signedUrl && !seen.has(doc.signedUrl)) {
            seen.add(doc.signedUrl);
            docs.push({ name: doc.name, signedUrl: doc.signedUrl });
          }
        },
      );
    });
    return docs;
  }, [building, selectedApartments]);

  if (building === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!building) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Link invalid or expired
        </h2>
        <p className="text-gray-600 mb-6">
          This view-only link may have been revoked.
        </p>
        <Link to="/" className="text-blue-600 hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200 bg-white">
        <div>
          <h1
            className="text-xl font-bold text-gray-900"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {building.name}
          </h1>
          <p className="text-sm text-gray-500">
            View only · attachments visible
          </p>
        </div>
        <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
          Architect Haven
        </Link>
      </div>

      <div className="flex-1 flex relative min-h-0">
        <div className="flex-1 relative w-full min-h-0">
          <div className="h-full w-full min-h-0 bg-blue-200">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Canvas
                camera={{
                  position: [-26, totalFloors * 6, totalFloors * 10],
                  fov: 50,
                }}
              >
                <ambientLight intensity={3} color="white" />
                <pointLight position={[0, 10, 0]} intensity={1} color="white" />
                <Building3D
                  building={building}
                  onApartmentClick={handleApartmentClick}
                  selectedApartments={selectedApartments}
                />
                <OrbitControls
                  enablePan
                  enableZoom
                  enableRotate
                  target={[0, 20, 0]}
                />
              </Canvas>
            </ErrorBoundary>
          </div>
          {documentsForLegend.length > 0 && (
            <FilesLegend
              documents={documentsForLegend}
              onDocumentClick={handleDocumentLegendClick}
            />
          )}
        </div>

        {selectedApartments.size > 0 && (
          <div className="absolute top-4 right-4 w-80 max-h-[60vh] bg-white rounded-lg shadow-lg border border-gray-200 p-4 overflow-y-auto z-10">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-gray-900">
                Documents on selected apartments
              </span>
              <button
                type="button"
                onClick={() => setSelectedApartments(new Set())}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            <ul className="space-y-2">
              {selectedDocumentsWithUrls.map((doc) => (
                <li key={doc.signedUrl}>
                  <a
                    href={doc.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="truncate">{doc.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
