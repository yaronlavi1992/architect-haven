import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface DocumentPanelProps {
  buildingId: string;
  selectedCount: number;
  onDocumentAssign: (documentId: string) => void;
  buildingData: any;
  selectedApartments: Set<string>;
  onRemoveDocument: (sectionIndex: number, apartmentIndex: number, documentIndex: number) => void;
}

export default function DocumentPanel({ 
  buildingId, 
  selectedCount, 
  onDocumentAssign, 
  buildingData,
  selectedApartments,
  onRemoveDocument 
}: DocumentPanelProps) {
  const documents = useQuery(api.buildings.getDocuments, { buildingId: buildingId as any });
  const generateUploadUrl = useMutation(api.buildings.generateUploadUrl);
  const addDocument = useMutation(api.buildings.addDocument);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // Step 1: Get upload URL
      const postUrl = await generateUploadUrl();
      
      // Step 2: Upload file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      const json = await result.json();
      if (!result.ok) {
        throw new Error(`Upload failed: ${JSON.stringify(json)}`);
      }
      
      // Step 3: Save document record
      await addDocument({
        name: file.name,
        storageId: json.storageId,
        buildingId: buildingId as any,
      });
      
      toast.success("Document uploaded successfully");
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  // Group selected apartments by floor
  const getSelectedApartmentsByFloor = () => {
    const apartmentsByFloor: { [key: string]: any[] } = {};
    
    if (!buildingData) return apartmentsByFloor;

    buildingData.sections.forEach((section: any, sectionIndex: number) => {
      const floorCount = section.endFloor - section.startFloor + 1;
      
      for (let floorIndex = 0; floorIndex < floorCount; floorIndex++) {
        const floorNumber = section.startFloor + floorIndex;
        const floorKey = `Floor ${floorNumber}`;
        
        section.apartments.forEach((apartment: any, apartmentIndex: number) => {
          const apartmentId = `${sectionIndex}-${floorIndex}-${apartmentIndex}`;
          
          if (selectedApartments.has(apartmentId)) {
            if (!apartmentsByFloor[floorKey]) {
              apartmentsByFloor[floorKey] = [];
            }
            
            apartmentsByFloor[floorKey].push({
              sectionIndex,
              apartmentIndex,
              apartment,
              apartmentNumber: apartmentIndex + 1
            });
          }
        });
      }
    });

    return apartmentsByFloor;
  };

  const selectedApartmentsByFloor = getSelectedApartmentsByFloor();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Document Management
        </h3>
        <p className="text-sm text-gray-600">
          {selectedCount} apartment{selectedCount !== 1 ? 's' : ''} selected
        </p>
      </div>

      {/* Upload new document */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload New Document
        </label>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
        {isUploading && (
          <div className="mt-2 flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Uploading...
          </div>
        )}
      </div>

      {/* Assign existing document */}
      {documents && documents.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign Existing Document
          </label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                onDocumentAssign(e.target.value);
                e.target.value = "";
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            defaultValue=""
          >
            <option value="">Select a document...</option>
            {documents.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selected apartments grouped by floor */}
      {Object.keys(selectedApartmentsByFloor).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Apartments</h4>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(selectedApartmentsByFloor).map(([floorKey, apartments]) => (
              <div key={floorKey} className="border border-gray-200 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 mb-2">{floorKey}</h5>
                <div className="space-y-2">
                  {apartments.map(({ sectionIndex, apartmentIndex, apartment, apartmentNumber }) => (
                    <div key={`${sectionIndex}-${apartmentIndex}`} className="bg-gray-50 rounded p-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Apartment {apartmentNumber}</span>
                      </div>
                      
                      {apartment.documents && apartment.documents.length > 0 ? (
                        <div className="space-y-1">
                          {apartment.documents.map((doc: any, docIndex: number) => (
                            <div key={docIndex} className="flex items-center justify-between bg-white rounded p-2">
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 rounded mr-2"
                                  style={{ backgroundColor: doc.color }}
                                ></div>
                                <span className="text-xs text-gray-700 truncate">{doc.name}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {doc.signedUrl && (
                                  <a
                                    href={doc.signedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700 text-xs"
                                  >
                                    View
                                  </a>
                                )}
                                <button
                                  onClick={() => onRemoveDocument(sectionIndex, apartmentIndex, docIndex)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No documents attached</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
