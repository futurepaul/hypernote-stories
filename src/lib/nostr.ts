import NDK, { NDKNip07Signer, NDKEvent } from "@nostr-dev-kit/ndk";
import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie";

class NostrService {
  private static instance: NostrService;
  private ndk: NDK;
  private _isConnecting: boolean = false;
  private _isConnected: boolean = false;
  private _hasNip07Signer: boolean = false;

  private constructor() {
    const dexieAdapter = new NDKCacheAdapterDexie({ dbName: 'nostr-cache' });
    
    // Check if NIP-07 extension is available
    this.detectNip07Signer().then(signer => {
      this._hasNip07Signer = !!signer;
      
      this.ndk = new NDK({
        // cacheAdapter: dexieAdapter,
        explicitRelayUrls: [
          "wss://relay.nostr.net",
          // Add more default relays as needed
        ],
        signer: signer,
      });
      
      console.log("NDK initialized with signer:", !!signer);
    }).catch(err => {
      console.error("Error detecting NIP-07 signer:", err);
      
      // Initialize NDK without a signer
      this.ndk = new NDK({
        // cacheAdapter: dexieAdapter,
        explicitRelayUrls: [
          "wss://relay.nostr.net",
          // Add more default relays as needed
        ],
      });
      
      console.log("NDK initialized without signer due to error");
    });
  }

  private async detectNip07Signer(): Promise<NDKNip07Signer | undefined> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log("Not in browser environment");
      return undefined;
    }
    
    // Wait a moment for extensions to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
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

  public async connect(): Promise<void> {
    if (this._isConnected || this._isConnecting) return;
    
    this._isConnecting = true;
    try {
      // Make sure NDK is initialized
      if (!this.ndk) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!this.ndk) {
          throw new Error("NDK not initialized");
        }
      }
      
      await this.ndk.connect();
      this._isConnected = true;
      console.log("Connected to relays");
    } catch (error) {
      console.error("Error connecting to relays:", error);
      throw error;
    } finally {
      this._isConnecting = false;
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

  // Method to check if NIP-07 signer is available and update the state
  public async checkNip07Signer(): Promise<boolean> {
    try {
      const signer = await this.detectNip07Signer();
      this._hasNip07Signer = !!signer;
      
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

  // Expose NDK instance for direct access when needed
  public get ndkInstance(): NDK {
    return this.ndk;
  }
}

// Export a singleton instance
export const nostrService = NostrService.getInstance(); 