import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import { TextElement as TextElementType } from "@/stores/editorStore";
import { TextEditModal } from "./TextEditModal";

interface TextElementProps {
  element: TextElementType;
  selected: boolean;
  xPercent: number;
  yPercent: number;
  scaleFactor: number;
  isEditingDisabled: boolean;
  startDrag: (e: React.MouseEvent, elementId: string) => void;
  openEditModal: (e: React.MouseEvent) => void;
  handleDeleteElement: (e: React.MouseEvent) => void;
}

// Define font sizes based on the element size and scale factor
const fontSizes = {
  sm: 48, // Small text - 48px base size
  md: 72, // Medium text - 72px base size
  lg: 144, // Large text - 144px base size
};

export function TextElement({
  element,
  selected,
  xPercent,
  yPercent,
  scaleFactor,
  isEditingDisabled,
  startDrag,
  openEditModal,
  handleDeleteElement,
}: TextElementProps) {
  // Calculate the actual font size based on the element size and scale factor
  const fontSize = fontSizes[element.size] * scaleFactor;
  
  // Split text by newlines to create multiline text
  const textLines = element.text.split('\n');

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
        userSelect: "none", // Prevent text selection when dragging
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => !isEditingDisabled && startDrag(e, element.id)}
    >
      <div className="flex flex-col items-center text-center">
        {textLines.map((line, index) => (
          <p 
            key={index}
            className={cn(
              "whitespace-nowrap select-none leading-tight", 
              element.font && element.font !== "default" && `font-${element.font}`
            )}
            style={{ fontSize: `${fontSize}px` }}
          >
            {line || " "} {/* Render a space for empty lines to maintain height */}
          </p>
        ))}
      </div>

      {/* Controls that appear when selected */}
      {selected && !isEditingDisabled && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex gap-2 bg-white p-1 rounded-md shadow-md border border-gray-200">
          <button
            className="p-1 hover:bg-gray-100 rounded"
            onClick={openEditModal}
          >
            <Pencil size={16} />
          </button>
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