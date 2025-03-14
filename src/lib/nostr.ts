import NDK, { NDKNip07Signer, NDKEvent } from "@nostr-dev-kit/ndk";
import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie";
import * as nip19 from 'nostr-tools/nip19';

const DEFAULT_RELAYS = [
  "wss://relay.nostr.net",
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://nos.lol",
  "wss://eden.nostr.land",
  "wss://140.f7z.io",
  "wss://relay.nostr.band",
  // Don't use this one if node env is production
  process.env.NODE_ENV === 'production' ? undefined : "ws://localhost:10547",
].filter(Boolean); // Filter out undefined values

class NostrService {
  private static instance: NostrService;
  private ndk: NDK | null = null;
  private _isConnecting: boolean = false;
  private _isConnected: boolean = false;
  private _hasNip07Signer: boolean = false;
  private _initPromise: Promise<void> | null = null;
  private _connectRetries: number = 0;
  private _maxRetries: number = 3;
  private _retryDelay: number = 2000; // 2 seconds
  
  private constructor() {
    // Initialize immediately with a proper promise
    this._initPromise = this._initialize();
  }
  
  /**
   * Initialize the NDK instance
   * Returns a promise that resolves when initialization is complete
   */
  private async _initialize(): Promise<void> {
    console.log("Starting NostrService initialization...");
    const dexieAdapter = new NDKCacheAdapterDexie({ dbName: 'nostr-cache' });
    
    try {
      // Check if NIP-07 extension is available
      const signer = await this.detectNip07Signer();
      this._hasNip07Signer = !!signer;
      
      // Initialize NDK with or without signer
      this.ndk = new NDK({
        explicitRelayUrls: DEFAULT_RELAYS,
        signer: signer,
        // cacheAdapter: dexieAdapter,
      });
      
      console.log("NDK initialized with signer:", !!signer);
      console.log("Using relays:", DEFAULT_RELAYS);
    } catch (err) {
      console.error("Error during NostrService initialization:", err);
      
      // Ensure we still have an NDK instance even if there was an error
      if (!this.ndk) {
        this.ndk = new NDK({
          explicitRelayUrls: DEFAULT_RELAYS,
        });
        console.log("NDK initialized without signer due to error");
      }
    }
  }

  private async detectNip07Signer(): Promise<NDKNip07Signer | undefined> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log("Not in browser environment");
      return undefined;
    }
    
    // Wait a moment for extensions to initialize (longer wait)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if window.nostr is available
    console.log("Checking for window.nostr:", 'nostr' in window);
    if ('nostr' in window) {
      try {
        // Try to get the public key to verify the extension is working
        const signer = new NDKNip07Signer();
        const pubkey = await signer.user().then(user => user.pubkey);
        console.log("Found NIP-07 signer with pubkey:", pubkey);
        return signer;
      } catch (error) {
        console.error("Error initializing NIP-07 signer:", error);
        return undefined;
      }
    }
    
    console.log("No window.nostr found");
    return undefined;
  }

  public static getInstance(): NostrService {
    if (!NostrService.instance) {
      NostrService.instance = new NostrService();
    }
    return NostrService.instance;
  }

  /**
   * Ensure initialization is complete
   * This should be called before any operation that requires the NDK instance
   */
  private async ensureInitialized(): Promise<void> {
    if (this._initPromise) {
      await this._initPromise;
    }
    
    // If initialization failed and we don't have an NDK instance, try again
    if (!this.ndk) {
      console.log("NDK not initialized after initialization promise, retrying...");
      this._initPromise = this._initialize();
      await this._initPromise;
    }
  }

  /**
   * Connect to Nostr relays with retry mechanism
   */
  public async connect(): Promise<void> {
    // If already connected or connecting, don't try again
    if (this._isConnected) {
      console.log("Already connected to relays");
      return;
    }
    
    if (this._isConnecting) {
      console.log("Already connecting to relays");
      return;
    }
    
    // Make sure initialization is complete
    await this.ensureInitialized();
    
    // Start connection process
    this._isConnecting = true;
    this._connectRetries = 0;
    
    try {
      await this._connectWithRetry();
    } finally {
      // Reset connecting flag when all retries are exhausted
      if (!this._isConnected) {
        this._isConnecting = false;
      }
    }
  }
  
  /**
   * Internal method to connect with retry
   */
  private async _connectWithRetry(): Promise<void> {
    // Safety check
    if (!this.ndk) {
      throw new Error("NDK not initialized");
    }
    
    try {
      console.log(`Connecting to relays (attempt ${this._connectRetries + 1}/${this._maxRetries + 1})...`);
      console.log(`Using relays: ${JSON.stringify(DEFAULT_RELAYS)}`);
      
      // Set a timeout for the connection attempt
      const connectionPromise = this.ndk.connect();
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error("Connection timeout")), 10000); // 10 second timeout
      });
      
      // Race between connection and timeout
      await Promise.race([connectionPromise, timeoutPromise])
        .then(() => {
          console.log("Connection successful!");
          this._isConnected = true;
          this._isConnecting = false;
        })
        .catch((error) => {
          console.error("Connection failed with error:", error);
          throw error; // Re-throw to trigger retry
        });
    } catch (error) {
      console.error(`Error connecting to relays (attempt ${this._connectRetries + 1}):`, error);
      
      // Try again if we haven't reached max retries
      if (this._connectRetries < this._maxRetries) {
        this._connectRetries++;
        console.log(`Retrying connection after ${this._retryDelay}ms...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this._retryDelay));
        
        // Increase delay for next retry (exponential backoff)
        this._retryDelay *= 1.5;
        
        // Retry connection
        return this._connectWithRetry();
      } else {
        // Give up after max retries
        console.error(`Failed to connect after ${this._maxRetries + 1} attempts`);
        // Set a flag to indicate connection was attempted but failed
        this._isConnecting = false;
        throw error;
      }
    }
  }

  /**
   * Disconnect from Nostr relays
   */
  public disconnect(): void {
    if (this.ndk && this._isConnected) {
      // NDK doesn't have a disconnect method, but we can update our state
      this._isConnected = false;
      console.log("Marked as disconnected from relays");
    }
  }

  public get isConnected(): boolean {
    return this._isConnected;
  }

  public get isConnecting(): boolean {
    return this._isConnecting;
  }

  public get hasNip07Signer(): boolean {
    return this._hasNip07Signer;
  }

  /**
   * Get the NDK instance (ensuring it's initialized first)
   */
  public async getNdk(): Promise<NDK> {
    await this.ensureInitialized();
    
    if (!this.ndk) {
      throw new Error("NDK not available");
    }
    
    return this.ndk;
  }

  // Method to check if NIP-07 signer is available and update the state
  public async checkNip07Signer(): Promise<boolean> {
    try {
      const signer = await this.detectNip07Signer();
      this._hasNip07Signer = !!signer;
      
      // Ensure NDK is initialized
      await this.ensureInitialized();
      
      if (signer && this.ndk) {
        this.ndk.signer = signer;
      }
      
      return this._hasNip07Signer;
    } catch (error) {
      console.error("Error checking NIP-07 signer:", error);
      return false;
    }
  }

  // Method to publish an event
  public async publishEvent(event: NDKEvent): Promise<boolean> {
    // Ensure we're initialized and connected
    await this.ensureInitialized();
    
    if (!this._isConnected) {
      await this.connect();
    }
    
    // Check for signer again in case it was added after initialization
    if (!this._hasNip07Signer) {
      await this.checkNip07Signer();
    }
    
    if (!this._hasNip07Signer) {
      throw new Error("No NIP-07 signer available. Please install a Nostr extension like nos2x or Alby.");
    }
    
    try {
      await event.publish();
      return true;
    } catch (error) {
      console.error("Failed to publish event:", error);
      return false;
    }
  }

  // Expose NDK instance for direct access when needed (deprecated, use getNdk instead)
  public get ndkInstance(): NDK {
    if (!this.ndk) {
      console.warn("Accessing NDK instance before initialization is complete");
      // Return a new instance as fallback
      return new NDK({
        explicitRelayUrls: DEFAULT_RELAYS,
      });
    }
    return this.ndk;
  }
}

// Export a singleton instance
export const nostrService = NostrService.getInstance();

// Decode npub or note ID
export function decodeNostrId(id: string): { type: string; data: string } | null {
  try {
    const decoded = nip19.decode(id);
    let data: string;
    
    if (typeof decoded.data === 'string') {
      data = decoded.data;
    } else if ('pubkey' in decoded.data) {
      data = decoded.data.pubkey;
    } else if ('id' in decoded.data) {
      data = decoded.data.id;
    } else {
      throw new Error('Unknown decoded data format');
    }
    
    return {
      type: decoded.type,
      data
    };
  } catch (error) {
    console.error('Error decoding Nostr ID:', error);
    return null;
  }
}

// Basic types for Nostr data
export interface NostrProfile {
  pubkey: string;
  name?: string;
  picture?: string;
  about?: string;
  nip05?: string;
  loading: boolean;
  error?: string;
}

export interface NostrNote {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  authorName?: string;
  authorPicture?: string;
  loading: boolean;
  error?: string;
}

// Real implementation using NDK to fetch data from relays
export async function fetchProfile(pubkey: string): Promise<NostrProfile> {
  const service = nostrService;
  
  try {
    // Make sure we're connected to relays
    if (!service.isConnected) {
      await service.connect();
    }
    
    // Get NDK instance safely
    const ndk = await service.getNdk();
    
    // Create NDK user from pubkey
    const user = ndk.getUser({ pubkey });
    
    // Fetch profile data (kind 0)
    await user.fetchProfile();
    
    // Check if profile exists
    if (!user.profile) {
      return {
        pubkey,
        loading: false,
        error: "Profile not found"
      };
    }
    
    // Return formatted profile data
    return {
      pubkey,
      name: user.profile.name || user.profile.displayName,
      picture: user.profile.image || user.profile.picture,
      about: user.profile.about,
      nip05: user.profile.nip05,
      loading: false
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    
    // Return fallback with error
    return {
      pubkey,
      loading: false,
      error: error instanceof Error ? error.message : 'Failed to fetch profile'
    };
  }
}

export async function fetchNote(id: string): Promise<NostrNote> {
  const service = nostrService;
  
  try {
    // Make sure we're connected to relays
    if (!service.isConnected) {
      await service.connect();
    }
    
    // Get NDK instance safely
    const ndk = await service.getNdk();
    
    // Set default value in case of error
    const result: NostrNote = {
      id,
      pubkey: '',
      content: '',
      created_at: 0,
      loading: false
    };
    
    let eventId = id;
    
    // If it's a bech32 encoded note ID (starts with 'note1' or 'nevent1'), decode it
    if (id.startsWith('note1') || id.startsWith('nevent1')) {
      try {
        const decoded = decodeNostrId(id);
        if (!decoded) {
          throw new Error('Failed to decode note ID');
        }
        eventId = decoded.data;
      } catch (error) {
        throw new Error(`Error decoding note ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Fetch the event using the hex ID
    const event = await ndk.fetchEvent(eventId);
    
    if (!event) {
      return {
        ...result,
        error: "Note not found"
      };
    }
    
    result.pubkey = event.pubkey;
    result.content = event.content;
    result.created_at = event.created_at || 0;
    
    // Try to fetch author profile
    try {
      const user = ndk.getUser({ pubkey: event.pubkey });
      await user.fetchProfile();
      
      if (user.profile) {
        result.authorName = user.profile.name || user.profile.displayName;
        result.authorPicture = user.profile.image || user.profile.picture;
      }
    } catch (profileError) {
      console.warn('Could not fetch author profile:', profileError);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching note:', error);
    
    // Return fallback with error
    return {
      id,
      pubkey: '',
      content: '',
      created_at: 0,
      loading: false,
      error: error instanceof Error ? error.message : 'Failed to fetch note'
    };
  }
}

/**
 * Publish a file metadata event (kind 1063) according to NIP-94
 * @param url URL of the file
 * @param hash SHA-256 hash of the file (x tag)
 * @param options Additional optional parameters
 * @returns The event ID if successful, null otherwise
 */
export async function publishFileMetadata(
  url: string,
  hash: string,
  options: {
    originalHash?: string;  // ox tag, defaults to hash if not provided
    filename?: string;      // alt tag for filename
    mimeType?: string;      // m tag for MIME type
    description?: string;   // content field
  } = {}
): Promise<string | null> {
  try {
    const service = nostrService;
    
    // Make sure we're connected to relays
    if (!service.isConnected) {
      await service.connect();
    }
    
    // Get NDK instance safely
    const ndk = await service.getNdk();
    
    // Create a new event
    const event = new NDKEvent(ndk);
    event.kind = 1063;
    event.content = options.description || '';  // Can be empty
    
    // Add required tags
    event.tags = [
      ['url', url],
      ['x', hash],
    ];
    
    // Add optional original hash tag if different from hash
    if (options.originalHash && options.originalHash !== hash) {
      event.tags.push(['ox', options.originalHash]);
    }
    
    // Add optional alt tag for filename
    if (options.filename) {
      event.tags.push(['alt', options.filename]);
    }
    
    // Add optional MIME type
    if (options.mimeType) {
      event.tags.push(['m', options.mimeType]);
    }
    
    // Sign and publish the event
    const success = await service.publishEvent(event);
    
    if (success) {
      console.log('[Nostr] Published file metadata event:', event.id);
      return event.id;
    }
    
    return null;
  } catch (error) {
    console.error('Error publishing file metadata:', error);
    return null;
  }
}

/**
 * Extract a SHA-256 hash from a URL or string
 * @param input URL or string that might contain a SHA-256 hash
 * @returns The extracted hash or null if not found
 */
export function extractHashFromUrl(input: string): string | null {
  // Common patterns for SHA-256 hashes in URLs
  // 1. Direct hash in path segment (e.g., /e5f7aecd459ed76f5f4aca2ab218ca0336f10f99921385a96835ed8006a6411e)
  // 2. Hash as filename (e.g., e5f7aecd459ed76f5f4aca2ab218ca0336f10f99921385a96835ed8006a6411e.png)
  // 3. Hash as query parameter (e.g., ?hash=e5f7aecd459ed76f5f4aca2ab218ca0336f10f99921385a96835ed8006a6411e)
  
  // Look for a SHA-256 hash pattern (64 hex characters)
  const hashMatch = input.match(/([a-f0-9]{64})/i);
  if (hashMatch) {
    return hashMatch[1].toLowerCase();
  }
  
  return null;
}

/**
 * Publish a NIP-22 comment event (kind 1111)
 * @param content Comment text content
 * @param rootEvent Event being commented on (e.g., hypernote)
 * @returns The event ID if successful, null otherwise
 */
export async function publishComment(
  content: string,
  rootEvent: {
    id: string;
    kind: number;
    pubkey: string;
  }
): Promise<string | null> {
  try {
    const service = nostrService;
    
    // Make sure we're connected to relays
    if (!service.isConnected) {
      await service.connect();
    }
    
    // Get NDK instance safely
    const ndk = await service.getNdk();
    
    // Create a new event
    const event = new NDKEvent(ndk);
    event.kind = 1111;  // NIP-22 comment
    event.content = content;
    
    // Add tags according to NIP-22
    event.tags = [
      // Root scope
      ["E", rootEvent.id, "", rootEvent.pubkey],
      ["K", rootEvent.kind.toString()],
      ["P", rootEvent.pubkey],
      
      // Parent (same as root for top-level comments)
      ["e", rootEvent.id, "", rootEvent.pubkey],
      ["k", rootEvent.kind.toString()],
      ["p", rootEvent.pubkey]
    ];
    
    // Sign and publish the event
    const success = await service.publishEvent(event);
    
    if (success) {
      console.log('[Nostr] Published comment event:', event.id);
      return event.id;
    }
    
    return null;
  } catch (error) {
    console.error('Error publishing comment:', error);
    return null;
  }
}

// Helper function to ensure a relay is available
const ensureRelay = async () => {
  if (!window.nostr) {
    throw new Error("Nostr extension not available");
  }
  
  console.log("[Nostr] Using NDK instance for relay publishing");
  
  // Get the NDK instance
  await nostrService.connect(); // Make sure we're connected
  const ndk = await nostrService.getNdk();
  
  // Return a relay-like object that uses NDK for publishing
  return {
    publish: (signedEvent: any) => {
      // Create a promise-based event emitter
      const emitter = {
        on: (event: string, callback: Function) => {
          if (event === 'ok') {
            // Create an NDK event from the signed event
            const ndkEvent = new NDKEvent(ndk);
            
            // Copy all properties from the signed event
            Object.keys(signedEvent).forEach(key => {
              if (key !== 'sig' && key !== 'id') {
                ndkEvent[key] = signedEvent[key];
              }
            });
            
            // Set the signature and ID from the signed event
            ndkEvent.sig = signedEvent.sig;
            ndkEvent.id = signedEvent.id;
            
            // Publish via NDK
            console.log("[Nostr] Publishing event to NDK relays:", {
              id: ndkEvent.id,
              kind: ndkEvent.kind,
              content: ndkEvent.content?.substring(0, 30) + '...',
              tags: ndkEvent.tags
            });
            
            ndkEvent.publish()
              .then(() => {
                console.log("[Nostr] Successfully published via NDK");
                callback();
              })
              .catch(err => {
                console.error("[Nostr] Failed to publish via NDK:", err);
                // Still call the callback to avoid hanging
                callback();
              });
          }
          return emitter;
        }
      };
      return emitter;
    }
  };
};

// Helper function to replace placeholders in strings
const replacePlaceholders = (text: string, placeholders: Record<string, string>): string => {
  if (typeof text !== 'string') return text;
  
  let result = text;
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });
  return result;
};

/**
 * Submit an event using a template and additional data
 * This is a generic function that can be used for any type of event
 * @param eventTemplate Partial NDKEvent definition (template with pre-filled values)
 * @param additionalData Additional data to merge with the template
 * @param placeholders Optional key-value pairs to replace placeholders in the template content and tags
 *                    Common placeholders include:
 *                    - ${eventId}: ID of the current event (e.g., for replies)
 *                    - ${pubkey}: Public key of the event author
 *                    - ${eventKind}: Kind of the current event
 *                    - ${content}: Content from user input
 * @returns The event ID if successful, null otherwise
 */
export const submitEvent = async (
  eventTemplate: Record<string, any>,
  additionalData: Record<string, any>,
  placeholders?: Record<string, string>
): Promise<string | null> => {
  try {
    if (!window.nostr) {
      throw new Error("Nostr extension not available");
    }

    // Clone the template to avoid mutating the original
    const clonedTemplate = JSON.parse(JSON.stringify(eventTemplate));
    
    console.log("[Debug Comment Submit] Original template:", JSON.stringify(clonedTemplate, null, 2));
    console.log("[Debug Comment Submit] Placeholders:", JSON.stringify(placeholders, null, 2));
    
    // Apply placeholders if provided
    if (placeholders) {
      // Process content
      if (typeof clonedTemplate.content === 'string') {
        clonedTemplate.content = replacePlaceholders(clonedTemplate.content, placeholders);
      }
      
      // Process tags
      if (Array.isArray(clonedTemplate.tags)) {
        clonedTemplate.tags = clonedTemplate.tags.map(tag => 
          tag.map(item => replacePlaceholders(item, placeholders))
        );
      }
      
      console.log("[Debug Comment Submit] After placeholder replacement:", JSON.stringify(clonedTemplate, null, 2));
    }

    // Merge the template with additional data
    const mergedEvent = {
      ...clonedTemplate,
      ...additionalData,
      created_at: Math.floor(Date.now() / 1000),
    };

    // If additional data contains tags, merge them carefully
    if (additionalData.tags && Array.isArray(additionalData.tags)) {
      mergedEvent.tags = [
        ...(clonedTemplate.tags || []),
        ...additionalData.tags,
      ];
    }

    // Clean up the event (remove any undefined/null values)
    Object.keys(mergedEvent).forEach((key) => {
      if (mergedEvent[key] === undefined || mergedEvent[key] === null) {
        delete mergedEvent[key];
      }
    });

    console.log("[Debug Comment Submit] Final event before submitting:", JSON.stringify(mergedEvent, null, 2));
    
    // Submit the event to Nostr
    const signedEvent = await window.nostr.signEvent(mergedEvent);
    const relay = await ensureRelay();
    
    // Store the event ID for direct lookup later
    const eventId = (signedEvent as any).id;
    console.log("[Debug Comment Submit] Signed event ID:", eventId);
    
    // Try to verify the event was published by looking it up after a delay
    setTimeout(async () => {
      try {
        await verifyEventPublished(eventId);
      } catch (e) {
        console.error("[Debug] Failed to verify event published:", e);
      }
    }, 5000);
    
    const pub = relay.publish(signedEvent);
    
    return new Promise((resolve) => {
      pub.on("ok", () => {
        // Use optional chaining and fallback to sig
        const eventId = (signedEvent as any).id || signedEvent.sig;
        console.log("[Debug Comment Submit] Event published successfully:", eventId);
        resolve(eventId);
      });
      
      pub.on("failed", (reason: string) => {
        console.error("[Debug Comment Submit] Failed to publish event:", reason);
        resolve(null);
      });
    });
  } catch (error) {
    console.error("Error submitting event:", error);
    return null;
  }
};

// Helper function to directly check if an event exists in the relays
export const verifyEventPublished = async (eventId: string): Promise<boolean> => {
  try {
    console.log("[Debug] Verifying event was published:", eventId);
    
    if (!nostrService.isConnected) {
      await nostrService.connect();
    }
    
    const ndk = await nostrService.getNdk();
    const event = await ndk.fetchEvent(eventId);
    
    if (event) {
      console.log("[Debug] Successfully verified event exists in relays:", {
        id: event.id,
        kind: event.kind,
        tags: event.tags.map(t => t[0]).join(',')
      });
      return true;
    } else {
      console.warn("[Debug] Could not find event in relays:", eventId);
      return false;
    }
  } catch (error) {
    console.error("[Debug] Error verifying event:", error);
    return false;
  }
}; 