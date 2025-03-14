import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editorStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BaseModal } from "@/components/ui/base-modal";

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

export function TextEditModal() {
  const {
    editorState: { isEditModalOpen, editingText, selectedElementId },
    closeEditModal,
    updateTextElement,
    updateTextElementFont,
    updateTextElementSize,
    updateTextElementColor,
    elements,
  } = useEditorStore();

  const [text, setText] = useState(editingText);
  const [font, setFont] = useState<string>("default");
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [color, setColor] = useState<'black' | 'white' | 'blue'>('black');

  // Find the selected element
  const selectedElement = elements.find((el) => el.id === selectedElementId);
  const selectedTextElement = selectedElement?.type === 'text' ? selectedElement : null;

  useEffect(() => {
    if (selectedTextElement) {
      setText(selectedTextElement.text);
      setFont(selectedTextElement.font || "default");
      setSize(selectedTextElement.size || 'md');
      setColor(selectedTextElement.color || 'black');
    }
  }, [selectedTextElement]);

  if (isEditModalOpen) {
    console.log("TextEditModal is being rendered - isEditModalOpen:", isEditModalOpen);
  }

  const handleSave = () => {
    if (selectedElementId) {
      updateTextElement(selectedElementId, text);
      if (font !== "default") {
        updateTextElementFont(selectedElementId, font);
      }
      updateTextElementSize(selectedElementId, size);
      updateTextElementColor(selectedElementId, color);
    }
    closeEditModal();
  };

  // Prepare footer buttons
  const modalFooter = (
    <>
      <button
        onClick={closeEditModal}
        className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Save
      </button>
    </>
  );

  return (
    <BaseModal
      title="Edit Text"
      isOpen={isEditModalOpen}
      onClose={closeEditModal}
      footer={modalFooter}
    >
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={cn("w-full border border-gray-300 rounded-md p-2 min-h-[100px]", font !== "default" && `font-${font}`)}
          autoFocus
          placeholder="Enter your text here..."
        />
        <p className="text-xs text-gray-500 mt-1">Press Enter/Return to create multiline text</p>
      </div>
      
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
      
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Size
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setSize('sm')}
            className={cn(
              "flex-1 py-2 border rounded-md",
              size === 'sm' 
                ? "bg-blue-100 border-blue-500" 
                : "border-gray-300 hover:bg-gray-50"
            )}
          >
            Small
          </button>
          <button
            onClick={() => setSize('md')}
            className={cn(
              "flex-1 py-2 border rounded-md",
              size === 'md' 
                ? "bg-blue-100 border-blue-500" 
                : "border-gray-300 hover:bg-gray-50"
            )}
          >
            Medium
          </button>
          <button
            onClick={() => setSize('lg')}
            className={cn(
              "flex-1 py-2 border rounded-md",
              size === 'lg' 
                ? "bg-blue-100 border-blue-500" 
                : "border-gray-300 hover:bg-gray-50"
            )}
          >
            Large
          </button>
        </div>
      </div>
      
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Color
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setColor('black')}
            className={cn(
              "flex-1 py-2 border rounded-md",
              color === 'black' 
                ? "bg-blue-100 border-blue-500" 
                : "border-gray-300 hover:bg-gray-50"
            )}
          >
            Black
          </button>
          <button
            onClick={() => setColor('white')}
            className={cn(
              "flex-1 py-2 border rounded-md",
              color === 'white' 
                ? "bg-blue-100 border-blue-500" 
                : "border-gray-300 hover:bg-gray-50"
            )}
          >
            White
          </button>
          <button
            onClick={() => setColor('blue')}
            className={cn(
              "flex-1 py-2 border rounded-md",
              color === 'blue' 
                ? "bg-blue-100 border-blue-500" 
                : "border-gray-300 hover:bg-gray-50"
            )}
          >
            Blue
          </button>
        </div>
      </div>
    </BaseModal>
  );
} 