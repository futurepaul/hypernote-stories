import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const elements = useEditorStore((state) => state.elements);
  const clearElements = useEditorStore((state) => state.clearElements);

  return (
    <div className="absolute top-0 md:static right-0 m-2 md:mt-14 bg-white/90 p-4 rounded-md shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-sm">Hypernote Content</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => clearElements()}
            className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200"
          >
            Clear
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      {isOpen && (
        <pre className="text-xs font-mono overflow-auto whitespace-pre-wrap break-all break-words max-h-[50vh]">
          {JSON.stringify(elements, null, 2)}
        </pre>
      )}
    </div>
  );
} 