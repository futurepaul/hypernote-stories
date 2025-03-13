import { useRef, useEffect, useState } from "react";
import { TextElement } from "./TextElement";
import { ImageElement } from "./ImageElement";
import type { TextElement as TextElementType, ImageElement as ImageElementType } from "@/stores/editorStore";

interface ElementRendererProps {
  elements: (TextElementType | ImageElementType)[];
  isEditingDisabled?: boolean;
  selectedElementId?: string | null;
  onElementSelect?: (elementId: string | null) => void;
  onElementDrag?: (e: React.MouseEvent, elementId: string) => void;
  onElementDelete?: (e: React.MouseEvent) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  onElementWidthUpdate?: (elementId: string, width: number) => void;
  openEditModal?: (e: React.MouseEvent) => void;
}

export function ElementRenderer({
  elements,
  isEditingDisabled = false,
  selectedElementId = null,
  onElementSelect,
  onElementDrag,
  onElementDelete,
  onElementUpdate,
  onElementWidthUpdate,
  openEditModal,
}: ElementRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  // Calculate scale factor on mount and window resize
  useEffect(() => {
    const calculateScaleFactor = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.getBoundingClientRect().width;
        setScaleFactor(containerWidth / 1080);
      }
    };

    // Calculate on mount
    calculateScaleFactor();

    // Calculate on window resize
    window.addEventListener("resize", calculateScaleFactor);

    return () => {
      window.removeEventListener("resize", calculateScaleFactor);
    };
  }, []);

  // Handle canvas click (deselect when clicking on empty space)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isEditingDisabled || !onElementSelect) return;
    // Only deselect if clicking directly on the container (not on an element)
    if (e.target === e.currentTarget) {
      onElementSelect(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative select-none"
      onClick={handleCanvasClick}
    >
      {elements.map((element) => {
        // Scale calculations: our design space is 1080x1920, but we're rendering in a responsive container
        const xPercent = (element.x / 1080) * 100;
        const yPercent = (element.y / 1920) * 100;
        const selected = !isEditingDisabled && selectedElementId === element.id;

        // Render based on element type
        if (element.type === "text") {
          return (
            <TextElement
              key={element.id}
              element={element}
              selected={selected}
              xPercent={xPercent}
              yPercent={yPercent}
              scaleFactor={scaleFactor}
              isEditingDisabled={isEditingDisabled}
              startDrag={onElementDrag || (() => {})}
              openEditModal={openEditModal || (() => {})}
              handleDeleteElement={onElementDelete || (() => {})}
            />
          );
        }

        // Render image elements
        if (element.type === "image") {
          return (
            <ImageElement
              key={element.id}
              element={element}
              selected={selected}
              xPercent={xPercent}
              yPercent={yPercent}
              scaleFactor={scaleFactor}
              isEditingDisabled={isEditingDisabled}
              startDrag={onElementDrag || (() => {})}
              handleDeleteElement={onElementDelete || (() => {})}
              updateWidth={(width) => onElementWidthUpdate?.(element.id, width)}
            />
          );
        }

        return null;
      })}
    </div>
  );
} 