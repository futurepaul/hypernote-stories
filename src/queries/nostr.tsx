import { NDKEvent } from "@nostr-dev-kit/ndk";
import type { NDKFilter } from "@nostr-dev-kit/ndk";
import { nostrService } from "@/lib/nostr";
import { nostrKeys } from "./queryKeyFactory";
import { useQuery, queryOptions } from "@tanstack/react-query";

/**
 * Generic type for Nostr response data
 */
export type NostrData = {
  id: string;
  pubkey: string;
  content?: string;
  created_at?: number;
  tags?: string[][];
  [key: string]: any;
};

/**
 * Profile metadata (kind 0)
 */
export interface NostrProfile extends NostrData {
  name?: string;
  picture?: string;
  about?: string;
  nip05?: string;
}

/**
 * Note event (kind 1)
 */
export interface NostrNote extends NostrData {
  content: string;
  authorName?: string;
  authorPicture?: string;
}

/**
 * File metadata (kind 1063)
 */
export interface NostrFileMetadata extends NostrData {
  url?: string;
  thumb?: string;
  filename: string;
  mime?: string;
  size?: number;
  blurhash?: string;
  description?: string;
  authorName?: string;
  authorPicture?: string;
}

/**
 * Transform an NDKEvent to a generic NostrData object
 */
export const transformEvent = (event: NDKEvent): NostrData => {
  return {
    id: event.id,
    pubkey: event.pubkey,
    content: event.content,
    created_at: event.created_at,
    tags: event.tags,
    // Add any other properties needed
  };
};

/**
 * Transform an NDKEvent to a profile object
 */
export const transformProfileEvent = (event: NDKEvent): NostrProfile => {
  // Parse the content JSON for profile data
  let profileData: Record<string, any> = {};
  try {
    profileData = JSON.parse(event.content);
  } catch (e) {
    console.warn("Failed to parse profile content JSON:", e);
  }

  return {
    id: event.id,
    pubkey: event.pubkey,
    created_at: event.created_at,
    tags: event.tags,
    name: profileData.name || profileData.displayName,
    picture: profileData.picture || profileData.image,
    about: profileData.about,
    nip05: profileData.nip05,
  };
};

/**
 * Transform an NDKEvent to a note object
 */
export const transformNoteEvent = (event: NDKEvent): NostrNote => {
  return {
    id: event.id,
    pubkey: event.pubkey,
    content: event.content || "",
    created_at: event.created_at,
    tags: event.tags,
  };
};

/**
 * Transform an NDKEvent to a file metadata object
 */
export const transformFileMetadataEvent = (event: NDKEvent): NostrFileMetadata => {
  console.log('[Nostr Debug] transformFileMetadataEvent input:', {
    id: event.id,
    pubkey: event.pubkey,
    tags: event.tags,
    content: event.content?.substring(0, 100),
  });

  // Parse the content JSON for file metadata
  let fileData: Record<string, any> = {};
  try {
    fileData = JSON.parse(event.content);
    console.log('[Nostr Debug] Parsed file content data:', fileData);
  } catch (e) {
    console.warn('[Nostr Debug] Failed to parse file metadata content JSON:', e);
  }

  // Extract the URL and thumb from tags (NIP-94 standard)
  const url = event.tags.find(tag => tag[0] === 'url')?.[1];
  const thumb = event.tags.find(tag => tag[0] === 'thumb')?.[1];
  const mime = event.tags.find(tag => tag[0] === 'type' || tag[0] === 'mime')?.[1];
  const size = event.tags.find(tag => tag[0] === 'size')?.[1];
  const dimensions = event.tags.find(tag => tag[0] === 'dim')?.[1];
  const blurhash = event.tags.find(tag => tag[0] === 'blurhash')?.[1];
  
  // Get x tag value (the hash)
  const hash = event.tags.find(tag => tag[0] === 'x')?.[1];
  
  // Determine filename - either from alt tag, m tag, or hash
  const altText = event.tags.find(tag => tag[0] === 'alt')?.[1];
  const mTag = event.tags.find(tag => tag[0] === 'm')?.[1];
  
  console.log('[Nostr Debug] Extracted tag values:', {
    url, thumb, mime, size, hash, altText, mTag
  });
  
  // Use fallbacks in order of preference
  let filename = altText || 
                mTag || 
                (hash ? `${hash}.file` : "unknown.file");

  const result: NostrFileMetadata = {
    id: event.id,
    pubkey: event.pubkey,
    created_at: event.created_at,
    tags: event.tags,
    content: event.content,
    url,
    thumb,
    filename,
    mime,
    size: size ? parseInt(size, 10) : undefined,
    blurhash,
    description: fileData.description || fileData.alt || altText,
  };
  
  console.log('[Nostr Debug] Final file metadata object:', {
    id: result.id,
    filename: result.filename,
    url: result.url,
    thumb: result.thumb,
  });
  
  return result;
};

/**
 * Fetch events using an NDKFilter
 */
export const fetchNostrEvents = async (filter: NDKFilter): Promise<NostrData[]> => {
  try {
    // Wait for connection if not already connected
    if (!nostrService.isConnected) {
      await nostrService.connect();
    }

    // Get NDK instance safely
    const ndk = await nostrService.getNdk();
    
    // Fetch events based on filter
    const events = await ndk.fetchEvents(filter);
    
    // Transform events to NostrData objects
    return Array.from(events).map(transformEvent);
  } catch (error) {
    console.error("Error fetching Nostr events:", error);
    throw error;
  }
};

/**
 * Fetch a single event using an NDKFilter
 * This is optimized for filters that should return just one result
 */
export const fetchNostrEvent = async (filter: NDKFilter): Promise<NostrData | null> => {
  try {
    console.log('[Nostr Debug] fetchNostrEvent called with filter:', JSON.stringify(filter, null, 2));
    
    // Wait for connection if not already connected
    if (!nostrService.isConnected) {
      console.log('[Nostr Debug] Connecting to nostrService...');
      await nostrService.connect();
    }

    // Get NDK instance safely
    const ndk = await nostrService.getNdk();
    console.log('[Nostr Debug] NDK instance obtained, connected relays:', 
      Array.from(ndk.pool?.relays.values() || [])
        .map(relay => `${relay.url} (${relay.status})`)
        .join(', '));
    
    // If there's an event ID in the filter, we can use fetchEvent directly
    if (filter.ids && filter.ids.length === 1) {
      console.log(`[Nostr Debug] Fetching single event with ID: ${filter.ids[0]}`);
      const event = await ndk.fetchEvent(filter.ids[0]);
      console.log('[Nostr Debug] Single event fetch result:', event ? 'Found' : 'Not found');
      return event ? transformEvent(event) : null;
    }
    
    // Add limit 1 to the filter if not already present
    const limitedFilter = { ...filter, limit: 1 };
    
    // Fetch events based on filter
    console.log('[Nostr Debug] Fetching events with filter:', JSON.stringify(limitedFilter, null, 2));
    const events = await ndk.fetchEvents(limitedFilter);
    const eventsArray = Array.from(events);
    console.log(`[Nostr Debug] Fetched ${eventsArray.length} events`);
    
    // Return the first event if available
    return eventsArray.length > 0 ? transformEvent(eventsArray[0]) : null;
  } catch (error) {
    console.error("[Nostr Debug] Error fetching Nostr event:", error);
    throw error;
  }
};

/**
 * Fetch a profile (kind 0) with the proper transformations
 */
export const fetchNostrProfile = async (filter: NDKFilter): Promise<NostrProfile | null> => {
  try {
    // Ensure this is a profile filter
    const profileFilter = { ...filter, kinds: [0] };
    
    // Use the generic fetch function
    const event = await fetchNostrEvent(profileFilter);
    
    // Transform to profile if found
    if (event) {
      // Get NDK instance safely for author profile fetching
      const ndk = await nostrService.getNdk();
      return transformProfileEvent(event as unknown as NDKEvent);
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
};

/**
 * Fetch a note (kind 1) with the proper transformations
 */
export const fetchNostrNote = async (filter: NDKFilter): Promise<NostrNote | null> => {
  try {
    // Ensure this is a note filter
    const noteFilter = { ...filter, kinds: [1] };
    
    // Debug the input filter
    console.log('[Debug fetchNostrNote] Filter:', JSON.stringify(noteFilter));
    
    // Use the generic fetch function
    const event = await fetchNostrEvent(noteFilter);
    
    // Debug the returned event
    console.log('[Debug fetchNostrNote] Raw event returned:', event ? JSON.stringify({
      id: event.id,
      pubkey: event.pubkey,
      content: event.content?.substring(0, 50) + (event.content && event.content.length > 50 ? '...' : ''),
      tags: event.tags,
    }) : 'null');
    
    // Transform to note if found
    if (event) {
      // Get NDK instance safely for author profile fetching
      const ndk = await nostrService.getNdk();
      const note = transformNoteEvent(event as unknown as NDKEvent);
      
      // Debug the transformed note
      console.log('[Debug fetchNostrNote] Transformed note:', JSON.stringify(note));
      
      // Try to fetch author info
      try {
        const user = ndk.getUser({ pubkey: note.pubkey });
        await user.fetchProfile();
        
        if (user.profile) {
          note.authorName = user.profile.name || user.profile.displayName;
          note.authorPicture = user.profile.image || user.profile.picture;
        }
        
        // Debug author info
        console.log('[Debug fetchNostrNote] With author info:', JSON.stringify({
          authorName: note.authorName,
          authorPicture: note.authorPicture ? 'exists' : 'missing'
        }));
      } catch (profileError) {
        console.warn('Could not fetch author profile:', profileError);
      }
      
      return note;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching note:", error);
    throw error;
  }
};

/**
 * Fetch a file metadata event (kind 1063) with the proper transformations
 */
export const fetchNostrFileMetadata = async (filter: NDKFilter): Promise<NostrFileMetadata | null> => {
  try {
    // Clean up the filter - remove any non-standard Nostr filter properties
    const { ...cleanFilter } = { ...filter };
    
    // Log the clean filter being used
    console.log('[Nostr Debug] Fetching file metadata with clean filter:', JSON.stringify(cleanFilter, null, 2));
    
    // Ensure this is a file metadata filter
    const fileFilter = { ...cleanFilter, kinds: [1063] };
    
    // Use the generic fetch function
    const event = await fetchNostrEvent(fileFilter);
    
    // Log received event
    console.log('[Nostr Debug] File metadata event received:', event ? JSON.stringify({
      id: event.id,
      pubkey: event.pubkey,
      content: event.content?.substring(0, 50) + (event.content && event.content.length > 50 ? '...' : ''),
      tags: event.tags,
      // Don't log the entire event as it might be too verbose
    }, null, 2) : 'null');
    
    // Transform to file metadata if found
    if (event) {
      // Get NDK instance safely for author profile fetching
      const ndk = await nostrService.getNdk();
      const fileMetadata = transformFileMetadataEvent(event as unknown as NDKEvent);
      
      // Log the transformed file metadata
      console.log('[Nostr Debug] Transformed file metadata:', JSON.stringify({
        id: fileMetadata.id,
        filename: fileMetadata.filename,
        url: fileMetadata.url,
        thumb: fileMetadata.thumb,
        // Only log a subset of fields
      }, null, 2));
      
      // Try to fetch author info
      try {
        const user = ndk.getUser({ pubkey: fileMetadata.pubkey });
        await user.fetchProfile();
        
        if (user.profile) {
          fileMetadata.authorName = user.profile.name || user.profile.displayName;
          fileMetadata.authorPicture = user.profile.image || user.profile.picture;
        }
      } catch (profileError) {
        console.warn('[Nostr Debug] Could not fetch author profile:', profileError);
      }
      
      return fileMetadata;
    }
    
    console.log('[Nostr Debug] No file metadata found for filter');
    return null;
  } catch (error) {
    console.error('[Nostr Debug] Error fetching file metadata:', error);
    throw error;
  }
};

/**
 * React Query options for fetching multiple Nostr events
 */
export const nostrEventsQueryOptions = (filter: NDKFilter) => queryOptions({
  queryKey: nostrKeys.filter(filter),
  queryFn: () => fetchNostrEvents(filter),
});

/**
 * React Query options for fetching a single Nostr event
 */
export const nostrEventQueryOptions = (filter: NDKFilter) => queryOptions({
  queryKey: nostrKeys.filter(filter),
  queryFn: () => fetchNostrEvent(filter),
});

/**
 * React Query options for fetching a profile (kind 0)
 */
export const nostrProfileQueryOptions = (filter: NDKFilter) => queryOptions({
  queryKey: [...nostrKeys.filter(filter), 'profile'],
  queryFn: () => fetchNostrProfile(filter),
});

/**
 * React Query options for fetching a note (kind 1)
 */
export const nostrNoteQueryOptions = (filter: NDKFilter) => queryOptions({
  queryKey: [...nostrKeys.filter(filter), 'note'],
  queryFn: () => fetchNostrNote(filter),
});

/**
 * React Query options for fetching file metadata (kind 1063)
 */
export const nostrFileMetadataQueryOptions = (filter: NDKFilter) => queryOptions({
  queryKey: [...nostrKeys.filter(filter), 'file'],
  queryFn: () => fetchNostrFileMetadata(filter),
});

/**
 * Custom hook for fetching Nostr events using a filter
 */
export const useNostrEventsQuery = (
  filter: NDKFilter,
  options = {}
) => {
  return useQuery({
    ...nostrEventsQueryOptions(filter),
    ...options,
  });
};

/**
 * Custom hook for fetching a single Nostr event using a filter
 */
export const useNostrEventQuery = (
  filter: NDKFilter,
  options = {}
) => {
  return useQuery({
    ...nostrEventQueryOptions(filter),
    ...options,
  });
};

/**
 * Custom hook for fetching a profile (kind 0)
 */
export const useNostrProfileQuery = (
  filter: NDKFilter,
  options = {}
) => {
  return useQuery({
    ...nostrProfileQueryOptions(filter),
    ...options,
  });
};

/**
 * Custom hook for fetching a note (kind 1)
 */
export const useNostrNoteQuery = (
  filter: NDKFilter,
  options = {}
) => {
  return useQuery({
    ...nostrNoteQueryOptions(filter),
    ...options,
  });
};

/**
 * Custom hook for fetching file metadata (kind 1063)
 */
export const useNostrFileMetadataQuery = (
  filter: NDKFilter,
  options: {
    onSuccess?: (data: NostrFileMetadata | null) => void;
    onError?: (error: any) => void;
    onSettled?: (data: NostrFileMetadata | null, error: any) => void;
    enabled?: boolean;
    [key: string]: any;
  } = {}
) => {
  console.log('[Nostr Debug] useNostrFileMetadataQuery called with filter:', JSON.stringify(filter, null, 2));
  console.log('[Nostr Debug] useNostrFileMetadataQuery options:', JSON.stringify({
    enabled: options.enabled
  }, null, 2));
  
  const mergedOptions = {
    ...options,
    onSuccess: (data: NostrFileMetadata | null) => {
      console.log('[Nostr Debug] useNostrFileMetadataQuery success:', data ? {
        id: data.id,
        filename: data.filename,
        url: data.url,
        thumb: data.thumb,
      } : 'null');
      
      // Call original onSuccess if provided
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error: any) => {
      console.error('[Nostr Debug] useNostrFileMetadataQuery error:', error);
      
      // Call original onError if provided
      if (options.onError) {
        options.onError(error);
      }
    },
    onSettled: (data: NostrFileMetadata | null, error: any) => {
      console.log('[Nostr Debug] useNostrFileMetadataQuery settled');
      
      // Call original onSettled if provided
      if (options.onSettled) {
        options.onSettled(data, error);
      }
    }
  };
  
  return useQuery({
    ...nostrFileMetadataQueryOptions(filter),
    ...mergedOptions,
  });
};

/**
 * Debug utilities for Nostr connectivity
 */
export const NostrDebug = {
  /**
   * Check connectivity to Nostr relays
   */
  async checkConnectivity() {
    try {
      console.log('[Nostr Debug] Checking Nostr connectivity...');
      
      // Check if nostrService is already connected
      console.log('[Nostr Debug] NostrService connected:', nostrService.isConnected);
      
      // Get NDK instance and connection status
      const ndk = await nostrService.getNdk();
      const relayStatus = Array.from(ndk.pool?.relays.values() || []).map(relay => ({
        url: relay.url,
        status: relay.status,
        connected: relay.connected
      }));
      
      console.log('[Nostr Debug] Connected relays:', relayStatus);
      
      // Try to fetch a test event to validate connectivity
      console.log('[Nostr Debug] Testing event fetch...');
      const testFetch = await ndk.fetchEvents({ kinds: [0], limit: 1 });
      const events = Array.from(testFetch);
      console.log(`[Nostr Debug] Successfully fetched ${events.length} events`);
      
      return {
        connected: nostrService.isConnected,
        relays: relayStatus,
        fetchTest: events.length > 0
      };
    } catch (error) {
      console.error('[Nostr Debug] Error checking connectivity:', error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },
  
  /**
   * Attempt to test a blossom filter specifically
   */
  async testBlossomFilter(hash: string) {
    try {
      console.log(`[Nostr Debug] Testing blossom filter with hash: ${hash}`);
      
      // Construct a blossom filter
      const filter = {
        kinds: [1063],
        "#x": [hash],
        limit: 5 // Fetch a few to see if any match
      };
      
      console.log('[Nostr Debug] Using test filter:', filter);
      
      // Get NDK instance
      const ndk = await nostrService.getNdk();
      
      // Try to fetch events
      const events = await ndk.fetchEvents(filter);
      const eventsArray = Array.from(events);
      
      console.log(`[Nostr Debug] Found ${eventsArray.length} blossom events`);
      
      // Log summary of each event
      eventsArray.forEach((event, i) => {
        // Get important tags
        const url = event.tags.find(tag => tag[0] === 'url')?.[1];
        const hash = event.tags.find(tag => tag[0] === 'x')?.[1];
        const alt = event.tags.find(tag => tag[0] === 'alt')?.[1];
        
        console.log(`[Nostr Debug] Event ${i+1}:`, {
          id: event.id,
          pubkey: event.pubkey,
          created_at: new Date(event.created_at * 1000).toISOString(),
          url,
          hash,
          alt
        });
      });
      
      return {
        success: true,
        eventsFound: eventsArray.length,
        events: eventsArray.map(event => ({
          id: event.id,
          pubkey: event.pubkey,
          created_at: new Date(event.created_at * 1000).toISOString(),
          url: event.tags.find(tag => tag[0] === 'url')?.[1],
          hash: event.tags.find(tag => tag[0] === 'x')?.[1],
        }))
      };
    } catch (error) {
      console.error('[Nostr Debug] Error testing blossom filter:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}; 