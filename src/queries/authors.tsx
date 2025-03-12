import { NDKEvent } from "@nostr-dev-kit/ndk";
import type { NDKFilter } from "@nostr-dev-kit/ndk";
import { nostrService } from "@/lib/nostr";
import { authorKeys } from "./queryKeyFactory";
import { queryOptions } from "@tanstack/react-query";

export type NostrAuthor = {
  id: string;
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
  raw_content?: string; // For debugging
};

// Define the expected structure of the content
interface AuthorContent {
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
  [key: string]: any; // Allow for other properties
}

const transformEvent = (event: NDKEvent): NostrAuthor => {
  let parsedContent: AuthorContent = {};
  
  // Try to parse the content as JSON
  try {
    parsedContent = JSON.parse(event.content) as AuthorContent;
  } catch (error) {
    console.error("Error parsing author content:", error);
    // If parsing fails, we'll use an empty object
  }
  
  return {
    id: event.pubkey,
    name: parsedContent.name,
    about: parsedContent.about,
    picture: parsedContent.picture,
    nip05: parsedContent.nip05,
    raw_content: event.content, // Include raw content for debugging
  };
};

export const fetchAuthor = async (pubkey: string) => {
  // Wait for connection if not already connected
  if (!nostrService.isConnected) {
    await nostrService.connect();
  }

  const filter: NDKFilter = {
    kinds: [0], // kind 0 is metadata
    authors: [pubkey],
  };

  const events = await nostrService.ndkInstance.fetchEvents(filter);
  const eventArray = Array.from(events);
  
  if (eventArray.length === 0) {
    throw new Error("Author not found");
  }
  
  // Get the most recent metadata event
  const latestEvent = eventArray.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))[0];
  return transformEvent(latestEvent);
};

export const authorQueryOptions = (pubkey: string) => queryOptions({
  queryKey: authorKeys.details(pubkey),
  queryFn: () => fetchAuthor(pubkey),
});
