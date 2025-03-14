import { useRef, useEffect, useState, createContext } from "react";
import { TextElement } from "./TextElement";
import { ImageElement } from "./ImageElement";
import { VideoElement } from "./VideoElement";
import { FileElement } from "./FileElement";
import { StickerElement } from "./StickerElement";
import type { 
  TextElement as TextElementType, 
  ImageElement as ImageElementType, 
  VideoElement as VideoElementType, 
  FileElement as FileElementType,
  StickerElement as StickerElementType
} from "@/stores/editorStore";

// Create a context to pass down hypernote information
export const HypernoteContext = createContext<{
  hypernoteId?: string;
  hypernoteKind?: number;
  hypernotePubkey?: string;
  hypernoteCreatedAt?: number;
} | null>(null);

interface ElementRendererProps {
  elements: (TextElementType | ImageElementType | VideoElementType | FileElementType | StickerElementType)[];
  isEditingDisabled?: boolean;
  selectedElementId?: string | null;
  onElementSelect?: (elementId: string | null) => void;
  onElementDrag?: (e: React.MouseEvent, elementId: string) => void;
  onElementDelete?: (e: React.MouseEvent) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  onElementWidthUpdate?: (elementId: string, width: number) => void;
  openEditModal?: (e: React.MouseEvent) => void;
  // Add new properties for hypernote context
  hypernoteId?: string;
  hypernoteKind?: number;
  hypernotePubkey?: string;
  hypernoteCreatedAt?: number;
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
  // Add hypernote context properties with defaults
  hypernoteId,
  hypernoteKind = 31337, // Default to hypernote kind
  hypernotePubkey,
  hypernoteCreatedAt,
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
    <HypernoteContext.Provider 
      value={{ hypernoteId, hypernoteKind, hypernotePubkey, hypernoteCreatedAt }}
    >
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

          // Render sticker elements
          if (element.type === "sticker") {
            return (
              <StickerElement
                key={element.id}
                element={element}
                selected={selected}
                xPercent={xPercent}
                yPercent={yPercent}
                scaleFactor={scaleFactor}
                isEditingDisabled={isEditingDisabled}
                startDrag={onElementDrag || (() => {})}
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

          // Render video elements
          if (element.type === "video") {
            return (
              <VideoElement
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

          // Render file elements
          if (element.type === "file") {
            return (
              <FileElement
                key={element.id}
                element={element}
                selected={selected}
                xPercent={xPercent}
                yPercent={yPercent}
                scaleFactor={scaleFactor}
                isEditingDisabled={isEditingDisabled}
                startDrag={onElementDrag || (() => {})}
                handleDeleteElement={onElementDelete || (() => {})}
              />
            );
          }

          return null;
        })}
      </div>
    </HypernoteContext.Provider>
  );
} 