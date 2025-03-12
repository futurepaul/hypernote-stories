import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import {
  Type,
  Sticker,
  Heart,
  MessageCircle,
  BookmarkPlus,
  Share2,
  Plus,
  Image,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";
import { SingleRow } from "@/components/GridLayout";
// Import element types directly from the editor store
import type { TextElement, ImageElement } from "@/stores/editorStore";
// Import shadcn select components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEBUG_LAYOUT = false;

function DebugPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const elements = useEditorStore((state) => state.elements);
  const clearElements = useEditorStore((state) => state.clearElements);

  return (
    <div className="absolute top-0 md:static right-0 m-2 md:mt-14 bg-white/90 p-4 rounded-md shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-sm">Store State</span>
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

function TextEditModal({
  isOpen,
  onClose,
  initialText,
  initialFont,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialText: string;
  initialFont?: string;
  onSave: (text: string, font?: string) => void;
}) {
  const [text, setText] = useState(initialText);
  const [font, setFont] = useState(initialFont || "default");

  useEffect(() => {
    setText(initialText);
    setFont(initialFont || "default");
  }, [initialText, initialFont]);

  // Font options from the CSS variables
  const fontOptions = [
    { value: "default", label: "Default" },
    { value: "systemui", label: "System UI" },
    { value: "transitional", label: "Transitional" },
    { value: "oldstyle", label: "Old Style" },
    { value: "humanist", label: "Humanist" },
    { value: "geohumanist", label: "Geo Humanist" },
    { value: "classhuman", label: "Classic Humanist" },
    { value: "neogrote", label: "Neo Grotesque" },
    { value: "monoslab", label: "Mono Slab" },
    { value: "monocode", label: "Mono Code" },
    { value: "industrial", label: "Industrial" },
    { value: "roundsans", label: "Round Sans" },
    { value: "slabserif", label: "Slab Serif" },
    { value: "antique", label: "Antique" },
    { value: "didone", label: "Didone" },
    { value: "handwritten", label: "Handwritten" },
  ];

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center" style={{ zIndex: 300}}>
      <div className="bg-white rounded-md p-4 shadow-lg w-full max-w-md relative" style={{ zIndex: 310 }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Edit Text</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={cn("w-full border border-gray-300 rounded-md p-2 min-h-[100px]", font !== "default" && `font-${font}`)}
          autoFocus
        />
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font
          </label>
          <Select value={font} onValueChange={setFont}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" className="max-h-[300px] overflow-y-auto">
              {fontOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className={option.value !== "default" ? `font-${option.value}` : ""}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(text, font === "default" ? undefined : font);
              onClose();
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  // Use createPortal to render the modal at the root of the document
  // (Fixes z-index issues)
  return createPortal(modalContent, document.body);
}

// Types for element components
interface TextElementProps {
  element: TextElement;
  selected: boolean;
  xPercent: number;
  yPercent: number;
  isEditingDisabled: boolean;
  startDrag: (e: React.MouseEvent, elementId: string) => void;
  openEditModal: (e: React.MouseEvent) => void;
  handleDeleteElement: (e: React.MouseEvent) => void;
}

interface ImageElementProps {
  element: ImageElement;
  selected: boolean;
  xPercent: number;
  yPercent: number;
  scaleFactor: number;
  isEditingDisabled: boolean;
  startDrag: (e: React.MouseEvent, elementId: string) => void;
  handleDeleteElement: (e: React.MouseEvent) => void;
}

// TextElement Component
function TextElementComponent({
  element,
  selected,
  xPercent,
  yPercent,
  isEditingDisabled,
  startDrag,
  openEditModal,
  handleDeleteElement,
}: TextElementProps) {
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
      <p className={cn("text-xl whitespace-nowrap select-none", element.font && element.font !== "default" && `font-${element.font}`)}>{element.text}</p>

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

// ImageElement Component
function ImageElementComponent({
  element,
  selected,
  xPercent,
  yPercent,
  scaleFactor,
  isEditingDisabled,
  startDrag,
  handleDeleteElement,
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

function ElementRenderer() {
  const elements = useEditorStore((state) => state.elements);
  const isElementSelected = useEditorStore((state) => state.isElementSelected);
  const selectElement = useEditorStore((state) => state.selectElement);
  const updateElementPosition = useEditorStore(
    (state) => state.updateElementPosition
  );
  const deleteElement = useEditorStore((state) => state.deleteElement);
  const updateTextElement = useEditorStore((state) => state.updateTextElement);
  const selectedElementId = useEditorStore(
    (state) => state.editorState.selectedElementId
  );
  const isEditingDisabled = useEditorStore(
    (state) => state.editorState.isEditingDisabled
  );

  // For text editing modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingText, setEditingText] = useState("");

  // For dragging functionality
  const [dragging, setDragging] = useState(false);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // For scaling calculations
  const [scaleFactor, setScaleFactor] = useState(1);

  // Find the selected element for the modal
  const selectedElement = elements.find((el) => el.id === selectedElementId);
  const selectedTextElement = selectedElement?.type === 'text' ? selectedElement : null;

  // Calculate scale factor on mount and window resize
  useEffect(() => {
    const calculateScaleFactor = () => {
      if (containerRef.current) {
        const containerWidth =
          containerRef.current.getBoundingClientRect().width;
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

  // Get text of selected element for the modal
  useEffect(() => {
    if (selectedElement && selectedElement.type === "text") {
      setEditingText(selectedElement.text);
    }
  }, [selectedElement]);

  // Open edit modal for text elements
  const openEditModal = (e: React.MouseEvent) => {
    if (isEditingDisabled) return;
    e.stopPropagation();
    if (selectedElement && selectedElement.type === "text") {
      setIsEditModalOpen(true);
    }
  };

  // Handle saving text from the modal
  const handleSaveText = (newText: string, font?: string) => {
    if (isEditingDisabled) return;
    if (selectedElementId) {
      updateTextElement(selectedElementId, newText);
      if (font !== undefined) {
        useEditorStore.getState().updateTextElementFont(selectedElementId, font);
      }
    }
  };

  // Handle deleting an element
  const handleDeleteElement = (e: React.MouseEvent) => {
    if (isEditingDisabled) return;
    e.stopPropagation();
    // Clear any active drag state
    setDragging(false);
    setDraggedElementId(null);

    if (selectedElementId) {
      deleteElement(selectedElementId);
    }
  };

  // Handle canvas click (deselect when clicking on empty space)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isEditingDisabled) return;
    // Only deselect if clicking directly on the container (not on an element)
    if (e.target === e.currentTarget) {
      selectElement(null);
    }
  };

  // Start dragging an element
  const startDrag = (e: React.MouseEvent, elementId: string) => {
    if (isEditingDisabled) return;
    e.stopPropagation();

    selectElement(elementId);
    setDragging(true);
    setDraggedElementId(elementId);
  };

  // Handle mouse move for dragging
  useEffect(() => {
    if (
      isEditingDisabled ||
      !dragging ||
      !draggedElementId ||
      !containerRef.current
    )
      return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      // Get container dimensions and position
      const rect = containerRef.current.getBoundingClientRect();

      // Calculate position relative to container (in percentages)
      const xPercent = (e.clientX - rect.left) / rect.width;
      const yPercent = (e.clientY - rect.top) / rect.height;

      // Convert back to our 1080x1920 coordinate space
      const x = Math.round(xPercent * 1080);
      const y = Math.round(yPercent * 1920);

      // Update position in store
      updateElementPosition(draggedElementId, x, y);
    };

    const handleMouseUp = () => {
      setDragging(false);
      setDraggedElementId(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isEditingDisabled, dragging, draggedElementId, updateElementPosition]);

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
        const selected = !isEditingDisabled && isElementSelected(element.id);

        // Render based on element type
        if (element.type === "text") {
          return (
            <TextElementComponent
              key={element.id}
              element={element}
              selected={selected}
              xPercent={xPercent}
              yPercent={yPercent}
              isEditingDisabled={isEditingDisabled}
              startDrag={startDrag}
              openEditModal={openEditModal}
              handleDeleteElement={handleDeleteElement}
            />
          );
        }

        // Render image elements
        if (element.type === "image") {
          return (
            <ImageElementComponent
              key={element.id}
              element={element}
              selected={selected}
              xPercent={xPercent}
              yPercent={yPercent}
              scaleFactor={scaleFactor}
              isEditingDisabled={isEditingDisabled}
              startDrag={startDrag}
              handleDeleteElement={handleDeleteElement}
            />
          );
        }

        return null;
      })}

      {/* Text Edit Modal */}
      <TextEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialText={editingText}
        initialFont={selectedTextElement?.font}
        onSave={handleSaveText}
      />
    </div>
  );
}

export const Route = createFileRoute("/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const isEditingDisabled = useEditorStore(
    (state) => state.editorState.isEditingDisabled
  );
  const setEditingDisabled = useEditorStore(
    (state) => state.setEditingDisabled
  );

  const leftContent = !isEditingDisabled ? (
    <div className="w-full">
      <DebugPanel />
    </div>
  ) : (
    <></>
  );

  const centerContent = (
    <div className=" md:border-black md:border-1 md:rounded-xs md:shadow-xs bg-neutral-100 aspect-9/16 overflow-clip relative">
      <ElementRenderer />
    </div>
  );

  const rightContent = (
    <div className="h-screen flex flex-col self-end justify-between px-2 pointer-events-none">
      {/* Top buttons group */}
      {!isEditingDisabled ? (
        <div className="flex flex-col gap-2 mt-2">
          <div
            className="w-12 h-12 border border-black rounded-xs shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-100 pointer-events-auto"
            style={{ zIndex: 30 }}
            onClick={() =>
              useEditorStore.getState().addTextElement("edit me", 540, 960)
            }
          >
            <Type />
          </div>
          <div className="w-12 h-12 border border-black rounded-xs shadow-sm flex items-center justify-center pointer-events-auto" style={{ zIndex: 30 }}>
            <Sticker />
          </div>
          <div
            className="w-12 h-12 border border-black rounded-xs shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-100 pointer-events-auto"
            style={{ zIndex: 30 }}
            onClick={() =>
              useEditorStore
                .getState()
                .addImageElement(
                  "https://blob.satellite.earth/75fc2f4692566ddf090748e8d53cb1863ec93fa784ccedd533dcdd9ecbad159d",
                  540,
                  960
                )
            }
          >
            <Image />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 mt-2 opacity-0">
          <div className="w-12 h-12"></div>
          <div className="w-12 h-12"></div>
          <div className="w-12 h-12"></div>
        </div>
      )}

      {/* Bottom button group - always visible */}
      <div className="flex flex-col gap-2 mb-4">
        <div
          className="w-12 h-12 border border-black rounded-xs shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-100 pointer-events-auto"
          style={{ zIndex: 30 }}
          onClick={() => setEditingDisabled(!isEditingDisabled)}
        >
          {isEditingDisabled ? <Eye /> : <EyeOff />}
        </div>
      </div>
    </div>
  );

  return (
    <SingleRow left={leftContent} center={centerContent} right={rightContent} editor={true} />
  );
}
