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
} from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";

const DEBUG_LAYOUT = false;

function DebugPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const elements = useEditorStore((state) => state.elements);
  const clearElements = useEditorStore((state) => state.clearElements);

  return (
    <div className="m-4 bg-white/90 p-4 rounded-md shadow-md border border-gray-200">
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
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  initialText: string; 
  onSave: (text: string) => void; 
}) {
  const [text, setText] = useState(initialText);
  
  useEffect(() => {
    setText(initialText);
  }, [initialText]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-4 shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Edit Text</h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={18} />
          </button>
        </div>
        <textarea 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          className="w-full border border-gray-300 rounded-md p-2 min-h-[100px]"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <button 
            onClick={onClose} 
            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onSave(text);
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
}

function ElementRenderer() {
  const elements = useEditorStore((state) => state.elements);
  const isElementSelected = useEditorStore((state) => state.isElementSelected);
  const selectElement = useEditorStore((state) => state.selectElement);
  const updateElementPosition = useEditorStore((state) => state.updateElementPosition);
  const deleteElement = useEditorStore((state) => state.deleteElement);
  const updateTextElement = useEditorStore((state) => state.updateTextElement);
  const selectedElementId = useEditorStore((state) => state.editorState.selectedElementId);
  
  // For text editing modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingText, setEditingText] = useState("");
  
  // For dragging functionality
  const [dragging, setDragging] = useState(false);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Find the selected element for the modal
  const selectedElement = elements.find(el => el.id === selectedElementId);
  
  // Get text of selected element for the modal
  useEffect(() => {
    if (selectedElement && selectedElement.type === 'text') {
      setEditingText(selectedElement.text);
    }
  }, [selectedElement]);
  
  // Open edit modal for text elements
  const openEditModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedElement && selectedElement.type === 'text') {
      setIsEditModalOpen(true);
    }
  };
  
  // Handle saving text from the modal
  const handleSaveText = (newText: string) => {
    if (selectedElementId) {
      updateTextElement(selectedElementId, newText);
    }
  };
  
  // Handle deleting an element
  const handleDeleteElement = (e: React.MouseEvent) => {
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
    // Only deselect if clicking directly on the container (not on an element)
    if (e.target === e.currentTarget) {
      selectElement(null);
    }
  };
  
  // Start dragging an element
  const startDrag = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    
    selectElement(elementId);
    setDragging(true);
    setDraggedElementId(elementId);
  };
  
  // Handle mouse move for dragging
  useEffect(() => {
    if (!dragging || !draggedElementId || !containerRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      // Get container dimensions and position
      const rect = containerRef.current.getBoundingClientRect();
      
      // Calculate position relative to container (in percentages)
      const xPercent = ((e.clientX - rect.left) / rect.width);
      const yPercent = ((e.clientY - rect.top) / rect.height);
      
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
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, draggedElementId, updateElementPosition]);
  
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
        const selected = isElementSelected(element.id);
        
        // For image elements, calculate a scale factor based on container width
        let scaleFactor = 1;
        if (containerRef.current) {
          const containerWidth = containerRef.current.getBoundingClientRect().width;
          scaleFactor = containerWidth / 1080;
        }
        
        // Render based on element type
        if (element.type === 'text') {
          return (
            <div 
              key={element.id}
              className={cn(
                "absolute p-2 cursor-move",
                selected && "border-2 border-dashed border-blue-500"
              )}
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`,
                transform: 'translate(-50%, -50%)', // Center on the coordinates
                userSelect: 'none', // Prevent text selection when dragging
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => startDrag(e, element.id)}
            >
              <p className="text-xl whitespace-nowrap select-none">{element.text}</p>
              
              {/* Controls that appear when selected */}
              {selected && (
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
        
        // Render image elements
        if (element.type === 'image') {
          return (
            <div 
              key={element.id}
              className={cn(
                "absolute p-2 cursor-move",
                selected && "border-2 border-dashed border-blue-500"
              )}
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`,
                transform: 'translate(-50%, -50%)', // Center on the coordinates
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => startDrag(e, element.id)}
            >
              <div className="overflow-hidden" style={{ width: element.width * scaleFactor + 'px' }}>
                <img 
                  src={element.imageUrl} 
                  alt="User added image" 
                  className="w-full object-contain select-none"
                  draggable="false"
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>
              
              {/* Controls that appear when selected */}
              {selected && (
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
        
        return null;
      })}
      
      {/* Text Edit Modal */}
      <TextEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialText={editingText}
        onSave={handleSaveText}
      />
    </div>
  );
}

export const Route = createFileRoute("/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="h-screen w-full overflow-y-auto md:pt-12">
      <div className={cn(
        "grid grid-row-1 md:grid-cols-[1fr_1fr_1fr] grid-cols-[auto_auto_auto] h-full",
        DEBUG_LAYOUT && "bg-green-500/20"
      )}>
        <div className={cn(
          "w-full z-20",
          DEBUG_LAYOUT && "bg-pink-500/20"
        )}>
          <DebugPanel />
        </div>
        {/* Content */}
        <div className="max-h-screen md:border-black md:border-1 md:rounded-xs md:shadow-xs bg-neutral-100 aspect-9/16 overflow-clip relative">
          {/* Content Editor View */}
          <ElementRenderer />
        </div>
        {/* we'll put this on top of the center column with col-start-2 col-end-3 row-start-1 row-end-2 eventuall */}
        <div className={cn(
          "w-full",
          DEBUG_LAYOUT && "bg-blue-500/20"
        )}>
          {/* buttons */}
          <div className="flex flex-col gap-2 px-2 ">
            <div 
              className="w-12 h-12 border border-black rounded-xs shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-100"
              onClick={() => useEditorStore.getState().addTextElement("edit me", 540, 960)}
            >
              <Type />
            </div>
            <div className="w-12 h-12 border border-black rounded-xs shadow-sm flex items-center justify-center">
              <Sticker />
            </div>
            <div 
              className="w-12 h-12 border border-black rounded-xs shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-100"
              onClick={() => useEditorStore.getState().addImageElement("https://blob.satellite.earth/75fc2f4692566ddf090748e8d53cb1863ec93fa784ccedd533dcdd9ecbad159d", 540, 960)}
            >
              <Image />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
