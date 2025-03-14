import { useState, useEffect } from "react";
import { AtSign, StickyNote, Loader2, Trash2 } from "lucide-react";
import type { StickerElement as StickerElementType } from "@/stores/editorStore";
import { fetchProfile, fetchNote, type NostrProfile, type NostrNote } from "@/lib/nostr";

// Generic sticker component that handles data fetching based on filter
interface GenericStickerProps {
  filter: Record<string, any>;
  accessors: string[];
  stickerType: string;
  scaleFactor: number;
}

const GenericSticker: React.FC<GenericStickerProps> = ({
  filter,
  accessors,
  stickerType,
  scaleFactor
}) => {
  const [eventData, setEventData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Determine which fetch function to use based on filter/stickerType
        if (stickerType === 'mention' && filter.authors && filter.kinds?.includes(0)) {
          // Fetch profile
          const profileData = await fetchProfile(filter.authors[0]);
          if (profileData.error) {
            throw new Error(profileData.error);
          }
          setEventData(profileData);
          
        } else if (stickerType === 'note' && filter.ids && filter.kinds?.includes(1)) {
          // Fetch note
          const noteData = await fetchNote(filter.ids[0]);
          if (noteData.error) {
            throw new Error(noteData.error);
          }
          setEventData(noteData);
          
        } else {
          throw new Error('Unsupported sticker type or filter');
        }
        
        setLoading(false);
      } catch (e) {
        console.error(`Error loading ${stickerType}:`, e);
        setError(e instanceof Error ? e.message : 'Unknown error');
        setLoading(false);
      }
    }
    
    fetchData();
  }, [stickerType, JSON.stringify(filter)]);

  // Render based on sticker type
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 overflow-hidden">
        <div className="flex justify-center items-center py-4">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-sm text-gray-500">Loading data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 overflow-hidden">
        <div className="text-red-500 text-sm py-2 px-1">{error}</div>
      </div>
    );
  }

  // Render a Mention sticker
  if (stickerType === 'mention' && eventData) {
    const profile = eventData as NostrProfile;
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
  if (stickerType === 'note' && eventData) {
    const note = eventData as NostrNote;
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

  // Fallback if no matching renderer
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
  const baseWidth = element.stickerType === 'mention' ? 260 : 320;
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