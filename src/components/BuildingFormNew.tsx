import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface FloorGroup {
  startFloor: number;
  endFloor: number;
  apartmentsCount: number;
  description: string;
}

interface BuildingFormProps {
  building?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BuildingForm({
  building,
  onClose,
  onSuccess,
}: BuildingFormProps) {
  const [name, setName] = useState("");
  const [sections, setSections] = useState<FloorGroup[]>([
    { startFloor: 1, endFloor: 5, apartmentsCount: 8, description: "offices" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createBuilding = useMutation(api.buildings.create);
  const updateBuilding = useMutation(api.buildings.update);

  useEffect(() => {
    if (building?.sections?.length) {
      setName(building.name);
      // Load existing sections as-is for editing
      setSections(building.sections);
    } else if (building) {
      setName(building.name);
      setSections([
        {
          startFloor: 1,
          endFloor: 5,
          apartmentsCount: 8,
          description: "offices",
        },
      ]);
    }
  }, [building]);

  const addSection = () => {
    const lastSection = sections[sections.length - 1];
    const newStartFloor = lastSection ? lastSection.endFloor + 1 : 1;

    setSections([
      ...sections,
      {
        startFloor: newStartFloor,
        endFloor: newStartFloor + 4, // Default 5-floor range
        apartmentsCount: 8,
        description: "offices",
      },
    ]);
  };

  const removeSection = (index: number) => {
    if (sections.length <= 1) return;
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);
  };

  const updateSection = (
    index: number,
    field: keyof FloorGroup,
    value: string | number,
  ) => {
    const updated = sections.map((s) => ({ ...s }));
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  };

  const generateApartmentsForSection = (
    section: FloorGroup,
    existingSection?: any,
  ) => {
    // If editing and existing apartments exist, preserve them
    if (existingSection?.apartments) {
      const base = existingSection.apartments.slice(0, section.apartmentsCount);
      while (base.length < section.apartmentsCount) {
        base.push({
          apartmentIndex: base.length,
          isSelected: false,
          type: "residential",
          documents: [],
        });
      }
      return base.map((a: any) => ({ ...a, isSelected: false }));
    }

    // Generate new apartments
    return Array.from({ length: section.apartmentsCount }, (_, j) => ({
      apartmentIndex: j,
      isSelected: false,
      type: "residential",
      documents: [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    try {
      // Convert sections to the format expected by the backend
      const sectionsWithApartments = sections.map((section, index) => {
        const existingSection = building?.sections?.[index];
        return {
          startFloor: section.startFloor,
          endFloor: section.endFloor,
          apartmentsCount: section.apartmentsCount,
          description: section.description,
          apartments: generateApartmentsForSection(section, existingSection),
        };
      });

      if (building) {
        await updateBuilding({
          id: building._id,
          name: name.trim(),
          sections: sectionsWithApartments,
        });
      } else {
        await createBuilding({
          name: name.trim(),
          sections: sectionsWithApartments,
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to save building:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {building ? "Edit Building" : "Create New Building"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Building Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter building name"
              required
            />
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Floor Sections
              </h3>
              <button
                type="button"
                onClick={addSection}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Add Section
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Floor Range
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Apartments
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sections.map((section, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={section.startFloor}
                            onChange={(e) =>
                              updateSection(
                                index,
                                "startFloor",
                                parseInt(e.target.value) || 1,
                              )
                            }
                            min={1}
                            className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="number"
                            value={section.endFloor}
                            onChange={(e) =>
                              updateSection(
                                index,
                                "endFloor",
                                parseInt(e.target.value) || 1,
                              )
                            }
                            min={section.startFloor}
                            className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={section.apartmentsCount}
                          onChange={(e) =>
                            updateSection(
                              index,
                              "apartmentsCount",
                              parseInt(e.target.value) || 1,
                            )
                          }
                          min={1}
                          max={20}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={section.description}
                          onChange={(e) =>
                            updateSection(index, "description", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Section description"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {sections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSection(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
