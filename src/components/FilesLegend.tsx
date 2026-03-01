interface FilesLegendProps {
  documents: Array<{
    _id: string;
    name: string;
    color: string;
  }>;
  onDocumentClick: (color: string) => void;
}

export default function FilesLegend({
  documents,
  onDocumentClick,
}: FilesLegendProps) {
  if (!documents || documents.length === 0) {
    return null;
  }

  // Get unique documents by color to avoid duplicates
  const uniqueDocuments = documents.reduce((acc: any[], doc) => {
    if (!acc.find((d) => d.color === doc.color)) {
      acc.push(doc);
    }
    return acc;
  }, []);

  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Files Legend</h4>
      <div className="grid grid-cols-1 gap-2">
        {uniqueDocuments.map((doc) => (
          <button
            key={doc._id}
            onClick={() => onDocumentClick(doc.color)}
            className="flex items-center w-full text-left hover:bg-gray-50 p-2 rounded transition-colors"
          >
            <div className="flex items-center">
              <div
                className="w-4 h-4 rounded mr-3 border border-gray-300"
                style={{ backgroundColor: doc.color }}
              ></div>
              <svg
                className="w-4 h-4 text-gray-500 mr-2"
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
              <span className="text-sm text-gray-700 truncate">{doc.name}</span>
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Click to select all apartments with this document
      </p>
    </div>
  );
}
