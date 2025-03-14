import { AtSign, StickyNote, Loader2, Flower, Download, ShoppingBag } from "lucide-react";
import { useNostrProfileQuery, useNostrNoteQuery, useNostrFileMetadataQuery } from "@/queries/nostr";
// @ts-ignore
import fileIcon from "@/assets/file.png";

// New query hook for product listings
import { useNostrEventQuery } from "@/queries/nostr";

// Generic sticker component that handles data fetching based on filter
interface GenericStickerProps {
  filter: Record<string, any>;
  accessors: string[];
  stickerType: string;
  scaleFactor: number;
  associatedData?: { displayFilename?: string };
}

export const GenericSticker: React.FC<GenericStickerProps> = ({
  filter,
  accessors,
  stickerType,
  scaleFactor,
  associatedData
}) => {
  // Use the appropriate query hook based on sticker type
  const profileQuery = useNostrProfileQuery(
    stickerType === 'mention' ? filter : { kinds: [0], authors: ['invalid'] },
    { enabled: stickerType === 'mention' }
  );
  
  const noteQuery = useNostrNoteQuery(
    stickerType === 'note' ? filter : { kinds: [1], ids: ['invalid'] },
    { enabled: stickerType === 'note' }
  );

  const productQuery = useNostrEventQuery(
    stickerType === 'product' ? filter : { kinds: [30402], ids: ['invalid'] },
    { enabled: stickerType === 'product' }
  );
  
  const fileMetadataQuery = useNostrFileMetadataQuery(
    stickerType === 'blossom' ? filter : { kinds: [1063], '#x': ['invalid'] },
    { enabled: stickerType === 'blossom' }
  );
  
  // Determine loading state
  const isLoading = 
    (stickerType === 'mention' && profileQuery.isLoading) ||
    (stickerType === 'note' && noteQuery.isLoading) ||
    (stickerType === 'product' && productQuery.isLoading) ||
    (stickerType === 'blossom' && fileMetadataQuery.isLoading);
  
  // Determine error state
  const error = 
    (stickerType === 'mention' && profileQuery.error) ||
    (stickerType === 'note' && noteQuery.error) ||
    (stickerType === 'product' && productQuery.error) ||
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

  // Render a Product sticker
  if (stickerType === 'product' && productQuery.data) {
    const product = productQuery.data;
    
    // Extract product information from tags
    const getTagValue = (tagName: string): string | null => {
      if (!product.tags) return null;
      const tag = product.tags.find((t: string[]) => t[0] === tagName);
      return tag ? tag[1] : null;
    };
    
    // Get multiple tags with the same name (like images)
    const getTagValues = (tagName: string): string[][] => {
      if (!product.tags) return [];
      return product.tags.filter((t: string[]) => t[0] === tagName);
    };
    
    const title = getTagValue('title') || 'Untitled Product';
    const price = getTagValue('price');
    const currency = product.tags?.find((t: string[]) => t[0] === 'price')?.[2] || 'USD';
    const images = getTagValues('image');
    const imageUrl = images.length > 0 ? images[0][1] : null;
    
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden w-full">
        <div className="rounded-full bg-purple-100 px-3 py-1.5 inline-flex items-center gap-1.5 m-2">
          <ShoppingBag className="w-4 h-4 text-purple-700" />
          <span className="text-sm font-semibold text-purple-800">
            Product
          </span>
        </div>
        
        <div className="p-4">
          {/* Product Image */}
          {imageUrl && (
            <div className="mb-3">
              <div className="relative pb-[56.25%] overflow-hidden rounded-md">
                <img 
                  src={imageUrl} 
                  alt={title} 
                  className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
                  onError={(e) => {
                    // Replace broken image with placeholder
                    (e.target as HTMLImageElement).src = "https://placehold.co/800x600/e2e8f0/64748b?text=Product+Image";
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Product Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          
          {/* Product Description */}
          <p className="text-sm text-gray-700 mb-4 line-clamp-2">
            {product.content || "No description available"}
          </p>
          
          {/* Price and Buy Button - Stacked vertically */}
          <div className="flex flex-col gap-3 mt-4">
            {price && (
              <div className="text-2xl font-bold text-purple-700">
                {price} {currency}
              </div>
            )}
            
            <button className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-md text-sm font-medium transition-colors w-full">
              Buy Now
            </button>
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
                // Fall back to default file icon on error
                (e.target as HTMLImageElement).src = fileIcon;
              }}
            />
          ) : (
            <img src={fileIcon} alt="File" className="w-8 h-8" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {associatedData?.displayFilename || file.filename || "unknown.file"}
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
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 overflow-hidden">
      <div className="text-gray-500 text-sm py-2">Unsupported sticker type</div>
    </div>
  );
}; 