import { NDKEvent } from "@nostr-dev-kit/ndk";
import type { NDKFilter } from "@nostr-dev-kit/ndk";
import { nostrService } from "@/lib/nostr";
import { hypernoteKeys } from "./queryKeyFactory";
import { queryOptions } from "@tanstack/react-query";

export type NostrHypernote = {
  id: string;
  content: string;
  author: string;
  createdAt: number;
  tags: string[][];
};

const transformEvent = (event: NDKEvent): NostrHypernote => ({
  id: event.id,
  content: event.content,
  author: event.pubkey,
  createdAt: event.created_at ?? Math.floor(Date.now() / 1000),
  tags: event.tags,
});

export const fetchHypernotes = async () => {
  try {
    // Wait for connection if not already connected
    if (!nostrService.isConnected) {
      await nostrService.connect();
    }

    // Ensure NDK instance is initialized
    if (!nostrService.ndkInstance) {
      console.error("NDK instance is not initialized");
      return []; // Return empty array instead of failing
    }

    const filter: NDKFilter = {
      kinds: [30078], // kind 30078 for hypernotes
      "#t": ["hypernote"], // tag 't' with value 'hypernote'
      limit: 20,
    };

    const events = await nostrService.ndkInstance.fetchEvents(filter);
    const hypernotes = Array.from(events).map(transformEvent);
    
    // Sort by newest first
    return hypernotes.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching hypernotes:", error);
    return []; // Return empty array on error
  }
}; 

export const fetchHypernote = async (id: string) => {
  try {
    // Wait for connection if not already connected
    if (!nostrService.isConnected) {
      await nostrService.connect();
    }

    // Ensure NDK instance is initialized
    if (!nostrService.ndkInstance) {
      throw new Error("NDK instance is not initialized");
    }

    const event = await nostrService.ndkInstance.fetchEvent(id);
    if (!event) {
      throw new Error("Hypernote not found");
    }
    return transformEvent(event);
  } catch (error) {
    console.error("Error fetching hypernote:", error);
    throw error;
  }
};

export const hypernoteQueryOptions = (id: string) => queryOptions({
  queryKey: hypernoteKeys.details(id),
  queryFn: () => fetchHypernote(id),
});

export const hypernotesQueryOptions = queryOptions({
  queryKey: hypernoteKeys.all,
  queryFn: fetchHypernotes,
}); 