import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { toast } from "sonner";
import { ErrorBoundary } from "react-error-boundary";
import BuildingForm from "../components/BuildingForm";
import DocumentPanel from "../components/DocumentPanel";
import FilesLegend from "../components/FilesLegend";
import Building3D from "../components/Building3D";
import ErrorFallback from "../components/ErrorFallback";

export default function BuildingDetail() {
  const { id } = useParams<{ id: string }>();
  const building = useQuery(api.buildings.get, id ? { id: id as any } : "skip");
  const documents = useQuery(api.buildings.getDocuments, id ? { buildingId: id as any } : "skip");
  const updateBuilding = useMutation(api.buildings.update);
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedApartments, setSelectedApartments] = useState<Set<string>>(new Set());
  const [buildingData, setBuildingData] = useState<any>(null);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  useEffect(() => {
    if (building) {
      setBuildingData(building);
    }
  }, [building]);

  const handleApartmentClick = useCallback(
    (sectionIndex: number, floorIndex: number, apartmentIndex: number) => {
      const apartmentId = `${sectionIndex}-${floorIndex}-${apartmentIndex}`;
      setSelectedApartments((prev) => {
        const newSelected = new Set(prev);
        if (newSelected.has(apartmentId)) newSelected.delete(apartmentId);
        else newSelected.add(apartmentId);
        return newSelected;
      });

      setBuildingData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((section: any, sIdx: number) => {
            if (sIdx !== sectionIndex) return section;
            return {
              ...section,
              apartments: section.apartments.map((apt: any, aIdx: number) => ({
                ...apt,
                isSelected: aIdx === apartmentIndex ? !apt.isSelected : apt.isSelected,
              })),
            };
          }),
        };
      });
    },
    []
  );

  const handleClearSelection = useCallback(() => {
    setSelectedApartments(new Set());
    setBuildingData((prev: any) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((section: any) => ({
              ...section,
              apartments: section.apartments.map((apt: any) => ({
                ...apt,
                isSelected: false,
              })),
            })),
          }
        : prev
    );
  }, []);

  const handleDocumentAssign = useCallback(async (documentId: string) => {
    if (!buildingData || selectedApartments.size === 0) return;

    const document = documents?.find(doc => doc._id === documentId);
    if (!document) return;

    const updatedSections = buildingData.sections.map((section: any, sectionIndex: number) => ({
      ...section,
      apartments: section.apartments.map((apt: any, apartmentIndex: number) => {
        // Check all floors for this apartment
        let shouldUpdate = false;
        const floorCount = section.endFloor - section.startFloor + 1;
        
        for (let floorIndex = 0; floorIndex < floorCount; floorIndex++) {
          const apartmentId = `${sectionIndex}-${floorIndex}-${apartmentIndex}`;
          if (selectedApartments.has(apartmentId)) {
            shouldUpdate = true;
            break;
          }
        }
        
        if (shouldUpdate) {
          return {
            ...apt,
            documents: [...apt.documents, {
              name: document.name,
              color: document.color,
              signedUrl: document.url,
              storageId: document.storageId,
            }]
          };
        }
        return apt;
      })
    }));

    try {
      await updateBuilding({
        id: buildingData._id,
        name: buildingData.name,
        sections: updatedSections,
      });
      
      setBuildingData({
        ...buildingData,
        sections: updatedSections
      });
      
      setSelectedApartments(new Set());
      toast.success("Document assigned to selected apartments");
    } catch (error) {
      toast.error("Failed to assign document");
    }
  }, [buildingData, selectedApartments, documents, updateBuilding]);

  const handleDocumentLegendClick = useCallback((color: string) => {
    if (!buildingData) return;

    const newSelected = new Set<string>();
    
    buildingData.sections.forEach((section: any, sectionIndex: number) => {
      const floorCount = section.endFloor - section.startFloor + 1;
      
      section.apartments.forEach((apt: any, apartmentIndex: number) => {
        if (apt.documents.length > 0 && apt.documents[0].color === color) {
          // Select this apartment on all floors
          for (let floorIndex = 0; floorIndex < floorCount; floorIndex++) {
            newSelected.add(`${sectionIndex}-${floorIndex}-${apartmentIndex}`);
          }
        }
      });
    });

    setSelectedApartments(newSelected);
  }, [buildingData]);

  const handleRemoveDocument = useCallback(async (sectionIndex: number, apartmentIndex: number, documentIndex: number) => {
    if (!buildingData) return;

    const updatedSections = buildingData.sections.map((section: any, sIdx: number) => {
      if (sIdx !== sectionIndex) return section;
      
      return {
        ...section,
        apartments: section.apartments.map((apt: any, aIdx: number) => {
          if (aIdx !== apartmentIndex) return apt;
          
          return {
            ...apt,
            documents: apt.documents.filter((_: any, dIdx: number) => dIdx !== documentIndex)
          };
        })
      };
    });

    try {
      await updateBuilding({
        id: buildingData._id,
        name: buildingData.name,
        sections: updatedSections,
      });
      
      setBuildingData({
        ...buildingData,
        sections: updatedSections
      });
      
      toast.success("Document removed");
    } catch (error) {
      toast.error("Failed to remove document");
    }
  }, [buildingData, updateBuilding]);

  // Calculate total floors for camera positioning
  const totalFloors = building ? building.sections.reduce((total: number, section: any) => {
    return total + (section.endFloor - section.startFloor + 1);
  }, 0) : 5;

  if (building === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Building not found</h2>
        <p className="text-gray-600">The building you're looking for doesn't exist.</p>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="space-y-6">
      <button
        onClick={() => setShowEditForm(true)}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
      >
        Edit Building
      </button>

      {selectedApartments.size > 0 && (
        <button
          onClick={handleClearSelection}
          className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
        >
          Clear Selection ({selectedApartments.size})
        </button>
      )}

      {selectedApartments.size > 0 && buildingData && (
        <DocumentPanel
          buildingId={id!}
          selectedCount={selectedApartments.size}
          onDocumentAssign={handleDocumentAssign}
          buildingData={buildingData}
          selectedApartments={selectedApartments}
          onRemoveDocument={handleRemoveDocument}
        />
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-4rem)] min-h-0 flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {building.name}
          </h1>
          <p className="text-gray-600">
            Interactive 3D building model
          </p>
        </div>
      </div>

      <div className="flex-1 flex relative min-h-0">
        <div className="flex-1 relative w-full min-h-0">
          <div className="h-full w-full min-h-0 bg-blue-200 rounded-lg overflow-hidden">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Canvas camera={{
                position: [-26, totalFloors * 6, totalFloors * 10],
                fov: 50,
              }}>
                <ambientLight intensity={3} color="white" />
                <pointLight position={[0, 10, 0]} intensity={1} color="white" />
                <Building3D
                  building={buildingData || building}
                  onApartmentClick={handleApartmentClick}
                  selectedApartments={selectedApartments}
                />
                <OrbitControls
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
                  target={[0, 20, 0]}
                />
              </Canvas>
            </ErrorBoundary>
          </div>
          
          <FilesLegend 
            documents={documents || []} 
            onDocumentClick={handleDocumentLegendClick}
          />
        </div>

        {/* Desktop Panel - overlay */}
        <div className="hidden md:block absolute top-4 right-4 bottom-4 w-80 z-10">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full overflow-y-auto">
            <SidebarContent />
          </div>
        </div>

        {/* Mobile Floating Button */}
        <button
          onClick={() => setShowMobilePanel(true)}
          className="md:hidden fixed right-4 top-1/2 transform -translate-y-1/2 bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-full shadow-lg z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </button>

        {/* Mobile Panel */}
        {showMobilePanel && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
            <div className="bg-white w-full max-h-[80vh] rounded-t-lg p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Building Controls</h3>
                <button
                  onClick={() => setShowMobilePanel(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SidebarContent />
            </div>
          </div>
        )}
      </div>

      {showEditForm && (
        <BuildingForm
          building={building}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            toast.success("Building updated successfully");
          }}
        />
      )}
    </div>
  );
}
