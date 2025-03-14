import { useState, useEffect } from "react";
import { AtSign, StickyNote, Loader2, Trash2, Download, Flower } from "lucide-react";
import type { StickerElement as StickerElementType } from "@/stores/editorStore";
import { fetchProfile, fetchNote, type NostrProfile } from "@/lib/nostr";
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

const GenericSticker: React.FC<GenericStickerProps> = ({
  filter,
  accessors,
  stickerType,
  scaleFactor,
  associatedData
}) => {
  // Only create queries for the active sticker type using conditional hooks
  const profileQuery = stickerType === 'mention' 
    ? useNostrProfileQuery(filter, { enabled: true })
    : { 
        data: undefined, 
        isLoading: false, 
        error: null, 
        isRefetching: false, 
        isFetching: false 
      };
  
  const noteQuery = stickerType === 'note' 
    ? useNostrNoteQuery(filter, { enabled: true })
    : { 
        data: undefined, 
        isLoading: false, 
        error: null, 
        isRefetching: false, 
        isFetching: false 
      };
  
  const fileMetadataQuery = stickerType === 'blossom' 
    ? useNostrFileMetadataQuery(filter, { enabled: true })
    : { 
        data: undefined, 
        isLoading: false, 
        error: null, 
        isRefetching: false, 
        isFetching: false 
      };
  
  // Add debug logging
  if (stickerType === 'note') {
    console.log('[Debug] Note sticker:', { 
      stickerType,
      filter,
      queryData: noteQuery.data,
      isLoading: noteQuery.isLoading,
      error: noteQuery.error,
      isRefetching: noteQuery.isRefetching,
      isFetching: noteQuery.isFetching
    });
  }
  
  // Add debug logging for blossom sticker
  if (stickerType === 'blossom') {
    console.log('[Debug] Blossom sticker:', { 
      stickerType,
      filter,
      queryData: fileMetadataQuery.data,
      isLoading: fileMetadataQuery.isLoading,
      error: fileMetadataQuery.error,
      isRefetching: fileMetadataQuery.isRefetching,
      isFetching: fileMetadataQuery.isFetching
    });
    
    // Add detailed debugging about the x tag
    if (filter && filter['#x'] && filter['#x'].length > 0) {
      console.log('[Debug] Blossom sticker x tag:', filter['#x'][0]);
      
      // Check if it looks like a URL
      if (filter['#x'][0].startsWith('http')) {
        console.log('[Debug] The x tag appears to be a URL rather than a hash');
        
        // Try to extract hash from URL (common formats)
        const hashFromUrl = filter['#x'][0].match(/([a-f0-9]{64})/i);
        if (hashFromUrl) {
          console.log('[Debug] Extracted hash from URL:', hashFromUrl[1]);
        }
      }
    }
  }
  
  // Determine loading state
  const isLoading = 
    (stickerType === 'mention' && profileQuery.isLoading) ||
    (stickerType === 'note' && noteQuery.isLoading) ||
    (stickerType === 'blossom' && fileMetadataQuery.isLoading);
  
  // Determine error state
  const error = 
    (stickerType === 'mention' && profileQuery.error) ||
    (stickerType === 'note' && noteQuery.error) ||
    (stickerType === 'blossom' && fileMetadataQuery.error);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 overflow-hidden">
        <div className="flex justify-center items-center py-4">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-sm text-gray-500">Loading data...</span>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 overflow-hidden">
        <div className="text-red-500 text-sm py-2 px-1">
          {error instanceof Error ? error.message : "Error loading data"}
        </div>
      </div>
    );
  }

  // Render a Mention sticker
  if (stickerType === 'mention' && profileQuery.data) {
    const profile = profileQuery.data;
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="rounded-full bg-blue-100 px-3 py-1.5 inline-flex items-center gap-1.5 m-2">
          <AtSign className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-blue-700">
            {profile.pubkey ? profile.pubkey.substring(0, 12) + '...' : 'Mention'}
          </span>
        </div>
        
        <div className="p-3 pt-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              {profile.picture ? (
                <img 
                  src={profile.picture} 
                  alt={profile.name || 'Profile'} 
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    // Replace broken image with placeholder
                    (e.target as HTMLImageElement).src = `https://avatars.dicebear.com/api/identicon/${profile.pubkey}.svg`;
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <AtSign className="w-5 h-5 text-gray-500" />
                </div>
              )}
              <div>
                <div className="font-semibold">{profile.name || profile.pubkey.substring(0, 8)}</div>
                {profile.nip05 && (
                  <div className="text-xs text-gray-500">{profile.nip05}</div>
                )}
              </div>
            </div>
            {profile.about && (
              <p className="text-sm text-gray-700 overflow-hidden text-ellipsis line-clamp-2">{profile.about}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render a Note sticker
  if (stickerType === 'note' && noteQuery.data) {
    console.log('[Debug] Rendering note sticker with data:', noteQuery.data);
    const note = noteQuery.data;
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="rounded-lg bg-yellow-100 px-3 py-1.5 inline-flex items-center gap-1.5 m-2">
          <StickyNote className="w-4 h-4 text-yellow-700" />
          <span className="text-sm font-semibold text-yellow-800">
            {note.id ? note.id.substring(0, 12) + '...' : 'Note'}
          </span>
        </div>
        
        <div className="p-3 pt-0">
          <div className="flex flex-col">
            {note.authorName && (
              <div className="flex items-center gap-2 mb-2">
                {note.authorPicture ? (
                  <img 
                    src={note.authorPicture} 
                    alt={note.authorName} 
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => {
                      // Replace broken image with placeholder
                      (e.target as HTMLImageElement).src = `https://avatars.dicebear.com/api/identicon/${note.pubkey}.svg`;
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                    <AtSign className="w-3 h-3 text-gray-500" />
                  </div>
                )}
                <div className="text-sm font-medium">{note.authorName}</div>
              </div>
            )}
            <p className="text-sm text-gray-700 overflow-hidden text-ellipsis line-clamp-3">
              {note.content || "No content available"}
            </p>
            {note.created_at > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {new Date(note.created_at * 1000).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render a Blossom sticker (file)
  if (stickerType === 'blossom' && fileMetadataQuery.data) {
    const file = fileMetadataQuery.data;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 overflow-hidden">
        <div className="rounded-full bg-green-100 px-3 py-1.5 inline-flex items-center gap-1.5 mb-2">
          <Flower className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-green-700">
            {file.id ? file.id.substring(0, 8) + '...' : 'File'}
          </span>
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          {file.thumb ? (
            <img 
              src={file.thumb} 
              alt={file.filename || "File"} 
              className="w-8 h-8 object-cover rounded"
              onError={(e) => {
                // Fall back to file icon on error
                (e.target as HTMLImageElement).src = fileIcon;
              }}
            />
          ) : (
            <img src={fileIcon} alt="File" className="w-8 h-8" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.filename || "unknown.file"}
            </p>
            {file.created_at > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {new Date(file.created_at * 1000).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={() => file.url && window.open(file.url, '_blank')}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            disabled={!file.url}
          >
            <Download size={16} />
            Download
          </button>
        </div>
      </div>
    );
  }

  // Fallback if no matching renderer
  console.log('[Debug] Fallback case reached. Sticker type:', stickerType, 'Data available:', {
    profileData: profileQuery.data !== undefined,
    noteData: noteQuery.data !== undefined,
    fileData: fileMetadataQuery.data !== undefined
  });
  
  // Create a more specific fallback based on sticker type
  if (stickerType === 'mention' && !profileQuery.isLoading && !profileQuery.error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 overflow-hidden">
        <div className="rounded-full bg-blue-100 px-3 py-1.5 inline-flex items-center gap-1.5 mb-2">
          <AtSign className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-blue-700">
            Profile Not Found
          </span>
        </div>
        <div className="text-gray-500 text-sm py-1">
          The requested Nostr profile could not be found.
        </div>
      </div>
    );
  }
  
  if (stickerType === 'note' && !noteQuery.isLoading && !noteQuery.error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 overflow-hidden">
        <div className="rounded-lg bg-yellow-100 px-3 py-1.5 inline-flex items-center gap-1.5 mb-2">
          <StickyNote className="w-4 h-4 text-yellow-700" />
          <span className="text-sm font-semibold text-yellow-800">
            Note Not Found
          </span>
        </div>
        <div className="text-gray-500 text-sm py-1">
          The requested Nostr note could not be found.
        </div>
      </div>
    );
  }
  
  if (stickerType === 'blossom' && !fileMetadataQuery.isLoading && !fileMetadataQuery.error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 overflow-hidden">
        <div className="rounded-full bg-green-100 px-3 py-1.5 inline-flex items-center gap-1.5 mb-2">
          <Flower className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-green-700">
            File Not Found
          </span>
        </div>
        <div className="text-gray-500 text-sm py-1">
          The requested Nostr file metadata could not be found.
        </div>
      </div>
    );
  }
  
  // Generic fallback for truly unsupported types
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 overflow-hidden">
      <div className="text-gray-500 text-sm py-2">Unsupported sticker type</div>
    </div>
  );
};

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
  }
  
  const scaledWidth = baseWidth * finalScaleFactor;

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