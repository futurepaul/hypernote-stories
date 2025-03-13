import { cn } from "@/lib/utils";
import { Trash2, Download } from "lucide-react";
import type { FileElement as FileElementType } from "@/stores/editorStore";
import fileIcon from "@/assets/file.png";

interface FileElementProps {
  element: FileElementType;
  selected: boolean;
  xPercent: number;
  yPercent: number;
  scaleFactor: number;
  isEditingDisabled: boolean;
  startDrag: (e: React.MouseEvent, elementId: string) => void;
  handleDeleteElement: (e: React.MouseEvent) => void;
}

export function FileElement({
  element,
  selected,
  xPercent,
  yPercent,
  scaleFactor,
  isEditingDisabled,
  startDrag,
  handleDeleteElement,
}: FileElementProps) {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(element.fileUrl, '_blank');
  };

  return (
    <div
      key={element.id}
      className={cn(
        "absolute p-2",
        !isEditingDisabled && "cursor-move",
        selected && "border-2 border-dashed border-blue-500"
      )}
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        transform: "translate(-50%, -50%)", // Center on the coordinates
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => !isEditingDisabled && startDrag(e, element.id)}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 w-[200px]">
        <div className="flex items-center gap-3 mb-2">
          <img src={fileIcon} alt="File" className="w-8 h-8" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {element.fileName}
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Download size={16} />
            Download
          </button>
          {selected && !isEditingDisabled && (
            <button
              className="p-1 hover:bg-gray-100 rounded text-red-500"
              onClick={handleDeleteElement}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 