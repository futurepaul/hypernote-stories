import { useState, useEffect } from "react";
import { AtSign, StickyNote, Loader2, Trash2, Download, Flower, MessageSquareQuote, Check, Timer } from "lucide-react";
import type { StickerElement as StickerElementType } from "@/stores/editorStore";
import { fetchProfile, fetchNote, type NostrProfile } from "@/lib/nostr";
import { GenericSticker } from "@/components/elements/GenericSticker";
import { useNostrProfileQuery, useNostrNoteQuery, useNostrFileMetadataQuery, type NostrFileMetadata, type NostrNote } from "@/queries/nostr";
// @ts-ignore
import fileIcon from "@/assets/file.png";

// Define a type for the blossom event data
interface BlossomData {
  id: string;
  pubkey: string;
  url?: string;
  thumb?: string;
  filename: string;
  created_at: number;
  authorName?: string;
  authorPicture?: string;
}

// Generic sticker component that handles data fetching based on filter
interface GenericStickerProps {
  filter: Record<string, any>;
  accessors: string[];
  stickerType: string;
  scaleFactor: number;
  associatedData?: any;
}

interface StickerElementProps {
  element: StickerElementType;
  selected: boolean;
  xPercent: number;
  yPercent: number;
  scaleFactor: number;
  isEditingDisabled: boolean;
  startDrag: (e: React.MouseEvent, elementId: string) => void;
  handleDeleteElement: (e: React.MouseEvent) => void;
}

export function StickerElement({
  element,
  selected,
  xPercent,
  yPercent,
  scaleFactor,
  isEditingDisabled,
  startDrag,
  handleDeleteElement,
}: StickerElementProps) {
  // Debug the sticker element
  useEffect(() => {
    if (element.type === 'sticker' && element.stickerType === 'countdown') {
      console.log("[Debug StickerElement] Rendering countdown sticker:", 
        { id: element.id, associatedData: element.associatedData });
    }
  }, [element]);

  // Apply scaling multiplier (2x) for the entire component
  const scalingMultiplier = 0.5; // Scale down half as much
  const adjustedScaleFactor = 1 - ((1 - scaleFactor) * scalingMultiplier);
  const finalScaleFactor = Math.max(adjustedScaleFactor, 0.7);

  // Determine the base width based on sticker type
  let baseWidth = 320; // default for most stickers
  
  if (element.stickerType === 'mention') {
    baseWidth = 260;
  } else if (element.stickerType === 'blossom') {
    baseWidth = 280; // File-like stickers can be a bit narrower
  } else if (element.stickerType === 'product') {
    baseWidth = 390; // Product stickers - width that works with the design
  } else if (element.stickerType === 'prompt') {
    baseWidth = 340; // Prompt stickers need space for the text field
  } else if (element.stickerType === 'countdown') {
    baseWidth = 260; // Countdown stickers can be narrower
  }
  
  const scaledWidth = Math.max(baseWidth * finalScaleFactor, element.stickerType === 'product' ? 350 : 200);

  return (
    <div
      className="absolute cursor-move"
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        transform: "translate(-50%, -50%)",
        zIndex: selected ? 10 : 1,
      }}
      onClick={(e) => {
        if (isEditingDisabled) return;
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        if (isEditingDisabled) return;
        startDrag(e, element.id);
      }}
    >
      {/* Selection container with proper styling */}
      <div className={selected && !isEditingDisabled ? "border-2 border-dashed border-blue-500 rounded-lg p-1" : ""}>
        {/* Scaling container - apply width directly to this element */}
        <div style={{ width: `${scaledWidth}px` }}>
          <GenericSticker 
            filter={element.filter} 
            accessors={element.accessors} 
            stickerType={element.stickerType} 
            scaleFactor={1} 
            associatedData={element.associatedData}
            methods={element.methods}
          />
        </div>
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