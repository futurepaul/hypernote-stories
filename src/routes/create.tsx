import { createFileRoute } from "@tanstack/react-router";
import {
  Type,
  Sticker,
  Eye,
  EyeOff,
  Send,
  Image,
  Video,
  File,
} from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { useState, useEffect } from "react";
import { SingleRow } from "@/components/GridLayout";
import { ElementRenderer } from "@/components/elements/ElementRenderer";
import { TextEditModal } from "@/components/elements/TextEditModal";
import { PublishModal } from "@/components/modals/PublishModal";
import { ImageUrlModal } from "@/components/modals/ImageUrlModal";
import { VideoUrlModal } from "@/components/modals/VideoUrlModal";
import { FileUrlModal } from "@/components/modals/FileUrlModal";
import { DebugPanel } from "@/components/DebugPanel";
import type { TextElement, ImageElement, VideoElement, FileElement } from "@/stores/editorStore";

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
  const elements = useEditorStore((state) => state.elements);
  const selectElement = useEditorStore((state) => state.selectElement);
  const updateElementPosition = useEditorStore(
    (state) => state.updateElementPosition
  );
  const deleteElement = useEditorStore((state) => state.deleteElement);
  const updateImageElementWidth = useEditorStore((state) => state.updateImageElementWidth);
  const updateVideoElementWidth = useEditorStore((state) => state.updateVideoElementWidth);
  const selectedElementId = useEditorStore(
    (state) => state.editorState.selectedElementId
  );
  const openImageModal = useEditorStore((state) => state.openImageModal);
  const openVideoModal = useEditorStore((state) => state.openVideoModal);
  const openFileModal = useEditorStore((state) => state.openFileModal);
  const openPublishModal = useEditorStore((state) => state.openPublishModal);
  const openEditModal = useEditorStore((state) => state.openEditModal);
  const setEditingText = useEditorStore((state) => state.setEditingText);
  
  const [dragging, setDragging] = useState(false);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);

  // Find the selected element for the modal
  const selectedElement = elements.find((el) => el.id === selectedElementId);
  const selectedTextElement = selectedElement?.type === 'text' ? selectedElement : null;

  // Filter elements to only include text, image, video, and file elements
  const filteredElements = elements.filter((el): el is TextElement | ImageElement | VideoElement | FileElement => 
    el.type === 'text' || el.type === 'image' || el.type === 'video' || el.type === 'file'
  );

  // Get text of selected element for the modal
  useEffect(() => {
    if (selectedElement && selectedElement.type === "text") {
      setEditingText(selectedElement.text);
    }
  }, [selectedElement, setEditingText]);

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
      !draggedElementId
    )
      return;

    const handleMouseMove = (e: MouseEvent) => {
      // Get container dimensions and position
      const container = document.querySelector('.aspect-9\\/16');
      if (!container) return;

      const rect = container.getBoundingClientRect();

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

  // Handle adding an image with the provided URL
  const handleAddImage = (imageUrl: string) => {
    useEditorStore.getState().addImageElement(imageUrl, 540, 960);
  };

  // Handle adding a video with the provided URL
  const handleAddVideo = (videoUrl: string) => {
    useEditorStore.getState().addVideoElement(videoUrl, 540, 960);
  };

  // Handle adding a file with the provided URL
  const handleAddFile = (fileUrl: string, fileName: string) => {
    useEditorStore.getState().addFileElement(fileUrl, fileName, 540, 960);
  };

  const leftContent = !isEditingDisabled ? (
    <div className="w-full">
      <DebugPanel />
    </div>
  ) : (
    <></>
  );

  const centerContent = (
    <div className="md:border-black md:border-1 md:rounded-xs md:shadow-xs bg-neutral-100 aspect-9/16 overflow-clip relative">
      <ElementRenderer
        elements={filteredElements}
        isEditingDisabled={isEditingDisabled}
        selectedElementId={selectedElementId}
        onElementSelect={selectElement}
        onElementDrag={startDrag}
        onElementDelete={handleDeleteElement}
        onElementWidthUpdate={(elementId, width) => {
          const element = elements.find(el => el.id === elementId);
          if (element?.type === 'image') {
            updateImageElementWidth(elementId, width);
          } else if (element?.type === 'video') {
            updateVideoElementWidth(elementId, width);
          }
        }}
        openEditModal={openEditModal}
      />
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
            onClick={openImageModal}
          >
            <Image />
          </div>
          <div
            className="w-12 h-12 border border-black rounded-xs shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-100 pointer-events-auto"
            style={{ zIndex: 30 }}
            onClick={openVideoModal}
          >
            <Video />
          </div>
          <div
            className="w-12 h-12 border border-black rounded-xs shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-100 pointer-events-auto"
            style={{ zIndex: 30 }}
            onClick={openFileModal}
          >
            <File />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 mt-2 opacity-0">
          <div className="w-12 h-12"></div>
          <div className="w-12 h-12"></div>
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
        
        {/* Publish button */}
        <div
          className="w-12 h-12 border border-black rounded-xs shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-100 pointer-events-auto"
          style={{ zIndex: 30 }}
          onClick={openPublishModal}
        >
          <Send size={20} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SingleRow left={leftContent} center={centerContent} right={rightContent} editor={true} />
      
      {/* Publish Modal */}
      <PublishModal />
      
      {/* Image URL Modal */}
      <ImageUrlModal onSave={handleAddImage} />

      {/* Video URL Modal */}
      <VideoUrlModal onSave={handleAddVideo} />

      {/* File URL Modal */}
      <FileUrlModal onSave={handleAddFile} />

      {/* Text Edit Modal */}
      <TextEditModal />
    </>
  );
}
