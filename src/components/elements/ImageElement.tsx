import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import type { ImageElement as ImageElementType } from "@/stores/editorStore";

interface ImageElementProps {
  element: ImageElementType;
  selected: boolean;
  xPercent: number;
  yPercent: number;
  scaleFactor: number;
  isEditingDisabled: boolean;
  startDrag: (e: React.MouseEvent, elementId: string) => void;
  handleDeleteElement: (e: React.MouseEvent) => void;
  updateWidth: (width: number) => void;
}

export function ImageElement({
  element,
  selected,
  xPercent,
  yPercent,
  scaleFactor,
  isEditingDisabled,
  startDrag,
  handleDeleteElement,
  updateWidth,
}: ImageElementProps) {
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
      <div
        className="overflow-hidden"
        style={{ width: element.width * scaleFactor + "px" }}
      >
        <img
          src={element.imageUrl}
          alt="User added image"
          className="w-full object-contain select-none"
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
        />
      </div>

      {/* Controls that appear when selected */}
      {selected && !isEditingDisabled && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex gap-2 bg-white p-1 rounded-md shadow-md border border-gray-200">
          <div className="flex items-center gap-2 px-2 border-r border-gray-200">
            <label className="text-xs text-gray-600">Width:</label>
            <input
              type="number"
              value={element.width}
              onChange={(e) => updateWidth(Number(e.target.value))}
              className="w-16 text-sm border border-gray-300 rounded px-1 py-0.5"
              min={100}
              max={1080}
            />
          </div>
          <button
            className="p-1 hover:bg-gray-100 rounded text-red-500"
            onClick={handleDeleteElement}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
} 