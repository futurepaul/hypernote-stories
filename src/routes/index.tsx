import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { SingleRow } from "@/components/GridLayout";
import { hypernotesQueryOptions } from "@/queries/hypernotes";
import { authorQueryOptions } from "@/queries/authors";
import { Heart, Share2, Loader2, MessageSquareQuote, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ElementRenderer } from "@/components/elements/ElementRenderer";
import { nostrService } from "@/lib/nostr";
import { useCommentsQuery } from "@/queries/nostr";
import { commentKeys } from "@/queries/queryKeyFactory";

// Author profile component that can be reused
function AuthorProfile({ author, hypernote, className = "", left = false }) {
  // Find the 'd' tag from hypernote tags
  const dTag = hypernote.tags.find((tag) => tag[0] === "d")?.[1] || "";

  return (
    <div className={cn("flex items-center gap-3", className, left ? "flex-row-reverse" : "")}>
      {/* Text content on the left */}
      <div className={cn("flex flex-col", left ? "items-start" : "items-end")}>
        {/* Username with @ symbol */}
        <h3 className="text-sm font-medium text-right">
          @{author.name || "username"}
        </h3>

        {/* d tag */}
        <p className="text-xs text-gray-600 text-right">{dTag}</p>

        {/* Hypernote ID as truncated link */}
        <a
          href={`https://njump.me/${hypernote.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:underline mt-1 text-right"
        >
          {hypernote.id.substring(0, 8)}...
        </a>
      </div>

      {/* Profile Picture on the right */}
      {author.picture ? (
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <img
            src={author.picture}
            alt={author.name || "Profile"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/150?text=?";
            }}
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center">
          <span className="text-gray-500 text-xl">?</span>
        </div>
      )}
    </div>
  );
}

// HypernoteView component to render a single hypernote
function HypernoteView({ hypernote }) {
  const [elements, setElements] = useState([]);
  const queryClient = useQueryClient();
  // Fetch author data
  const authorQuery = useQuery(authorQueryOptions(hypernote.author));
  // Fetch comments for this hypernote
  const commentsQuery = useCommentsQuery(hypernote.id, {
    refetchInterval: 30000, // Only refetch every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid comment disappearing
    retry: 3,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),
    networkMode: 'always',
    gcTime: 900000, // Keep data for 15 minutes
    onSuccess: (data) => {
      console.log(`[Debug Comments] Query success: Received ${data?.length || 0} comments`);
    }
  });
  
  // Debug: Log hypernote info
  useEffect(() => {
    console.log("[Debug Hypernote] Rendering hypernote:", {
      id: hypernote.id,
      kind: hypernote.kind,
      author: hypernote.author.substring(0, 8) + '...',
      tags: hypernote.tags
    });
  }, [hypernote]);

  useEffect(() => {
    try {
      // Parse the content JSON
      const parsedContent = JSON.parse(hypernote.content);
      if (parsedContent.elements && Array.isArray(parsedContent.elements)) {
        setElements(parsedContent.elements);
      }
    } catch (error) {
      console.error("Error parsing hypernote content:", error);
      setElements([]);
    }
  }, [hypernote]);

  // Add a manual refresh function
  const forceRefreshComments = () => {
    console.log("[Debug] Manually refreshing comments");
    
    // First get existing data
    const existingData = queryClient.getQueryData(commentKeys.list(hypernote.id)) as any[] | undefined;
    const localComments = existingData?.filter(comment => comment._localComment) || [];
    
    console.log(`[Debug] Manual refresh: preserving ${localComments.length} local comments`);
    
    // Invalidate the query to force a refetch
    queryClient.invalidateQueries({ 
      queryKey: commentKeys.list(hypernote.id),
      refetchType: 'all' 
    });
    
    // Immediately refetch
    commentsQuery.refetch().then(result => {
      if (result.isSuccess) {
        // If we have local comments and they're not in the result, add them back
        if (localComments.length > 0) {
          const newData = result.data || [];
          const commentIds = new Set(newData.map(c => c.id));
          const missingLocalComments = localComments.filter(c => !commentIds.has(c.id));
          
          if (missingLocalComments.length > 0) {
            console.log(`[Debug] Re-adding ${missingLocalComments.length} local comments after manual refresh`);
            queryClient.setQueryData(
              commentKeys.list(hypernote.id),
              [...newData, ...missingLocalComments]
            );
          }
        }
      }
    });
  };

  // Render the right side buttons (share/like)
  const rightContent = (
    <div className="h-screen w-full flex flex-col self-end justify-between pointer-events-none">
      {/* Top buttons group - empty for spacing */}
      <div className="flex flex-col gap-2 mt-2 opacity-0">
        <div className="w-12 h-12"></div>
        <div className="w-12 h-12"></div>
        <div className="w-12 h-12"></div>
      </div>

      {/* Bottom button group - share/like */}
      <div className="flex w-full justify-between items-end p-4 z-50 bg-gradient-to-b from-transparent to-white">
        {/* Mobile author overlay - only visible on small screens */}
        {authorQuery.data && (
          <div className="bottom-20 right-4 md:hidden pointer-events-auto z-50">
            <AuthorProfile author={authorQuery.data} hypernote={hypernote} left={true} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div
            className="w-12 h-12 border border-black rounded-xs shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-100 pointer-events-auto"
            style={{ zIndex: 30 }}
            onClick={() => {
              // Share functionality
              if (navigator.share) {
                navigator
                  .share({
                    title: "Check out this Hypernote",
                    text: "I found this cool Hypernote",
                    url: window.location.href,
                  })
                  .catch((err) => console.error("Error sharing:", err));
              } else {
                // Fallback - copy to clipboard
                navigator.clipboard
                  .writeText(window.location.href)
                  .then(() => alert("Link copied to clipboard!"))
                  .catch((err) =>
                    console.error("Error copying to clipboard:", err)
                  );
              }
            }}
          >
            <Share2 size={20} />
          </div>

          <div
            className="w-12 h-12 border border-black rounded-xs shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-100 pointer-events-auto"
            style={{ zIndex: 30 }}
          >
            <Heart size={20} />
          </div>
        </div>
      </div>
    </div>
  );

  // Create left content with author data and comments
  const leftContent = (
    <div className="w-full h-full p-4 overflow-auto bg-white relative flex flex-col">
      {authorQuery.isLoading ? (
        <div className="flex items-center justify-center h-full">
          <p>Loading profile...</p>
        </div>
      ) : authorQuery.isError ? (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-red-500">Could not load profile</p>
        </div>
      ) : (
        <>
          {/* Desktop author display - top right, hidden on mobile */}
          <div className="hidden md:block self-end">
            <AuthorProfile author={authorQuery.data} hypernote={hypernote} />
          </div>
          
          {/* Comments section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquareQuote className="h-5 w-5 text-purple-500" />
                Comments
              </h3>
              <button 
                onClick={forceRefreshComments}
                className="text-xs text-purple-600 flex items-center gap-1 hover:text-purple-800"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>
            
            {commentsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading comments...</span>
              </div>
            ) : commentsQuery.error ? (
              <p className="text-red-500 text-sm">Error loading comments</p>
            ) : commentsQuery.data?.length === 0 ? (
              <p className="text-gray-500 text-sm">No comments yet</p>
            ) : (
              <div className="space-y-4">
                {commentsQuery.data.map(comment => (
                  <div key={comment.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <MessageSquareQuote className="w-4 h-4 text-purple-500" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">
                          {comment.pubkey.substring(0, 8)}...
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(comment.created_at * 1000).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm ml-10">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <SingleRow
      left={leftContent}
      center={
        <div className="md:border-black md:border-1 md:rounded-xs md:shadow-xs bg-neutral-100 aspect-9/16 overflow-clip relative">
          <ElementRenderer
            elements={elements}
            isEditingDisabled={true}
            hypernoteId={hypernote.id}
            hypernoteKind={30078} // hypernote kind
            hypernotePubkey={hypernote.author}
          />
        </div>
      }
      right={rightContent}
      editor={false}
    />
  );
}

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const { queryClient } = context as { queryClient: any };
    
    // Ensure Nostr connection is established before loading hypernotes
    try {
      console.log("Ensuring Nostr connection is established in route loader");
      
      // This will now properly handle initialization and use the retry mechanism
      await nostrService.connect();
      console.log("Nostr connection established in route loader");
    } catch (error) {
      console.error("Failed to connect to Nostr in route loader:", error);
      // Continue anyway and let the component handle the connection state
    }
    
    return queryClient.ensureQueryData(hypernotesQueryOptions);
  },
  component: Index,
});

function Index() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Handle Nostr connection
  useEffect(() => {
    const ensureNostrConnection = async () => {
      if (nostrService.isConnected) {
        console.log("Already connected to Nostr, skipping connection");
        return;
      }
      
      // Only try to connect if not already connecting
      if (!nostrService.isConnecting && !isConnecting) {
        setIsConnecting(true);
        setConnectionError("");
        
        try {
          console.log("Connecting to Nostr relays from component...");
          
          // Set a timeout for the connection
          const connectionPromise = nostrService.connect();
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Connection timeout after 15 seconds")), 15000);
          });
          
          await Promise.race([connectionPromise, timeoutPromise]);
          
          console.log("Successfully connected to Nostr relays from component");
        } catch (error) {
          console.error("Error connecting to Nostr:", error);
          setConnectionError(error instanceof Error ? error.message : "Failed to connect to Nostr relays");
        } finally {
          setIsConnecting(false);
        }
      } else {
        console.log("Connection already in progress, skipping");
      }
    };
    
    ensureNostrConnection();
  }, [isRetrying, isConnecting]);
  
  // Handle manual retry
  const handleRetry = () => {
    setIsRetrying(!isRetrying);
  };

  // Use suspense query to fetch hypernotes
  let hypernotes = [];
  let queryError = null;
  
  try {
    const hypernotesQuery = useSuspenseQuery(hypernotesQueryOptions);
    hypernotes = hypernotesQuery.data || [];
  } catch (error) {
    console.error("Error fetching hypernotes:", error);
    queryError = error;
  }

  // Show loading state if connecting to Nostr
  if (isConnecting || nostrService.isConnecting) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="h-6 w-6 animate-spin" />
          <h2 className="text-2xl font-bold">Connecting to Nostr...</h2>
        </div>
        <p className="text-gray-600 text-center">
          Establishing connection to Nostr relays
        </p>
      </div>
    );
  }

  // Connection error but we have hypernotes - show them anyway with a warning
  if (connectionError && hypernotes.length > 0) {
    return (
      <div className="h-screen w-full">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Warning:</strong>
          <span className="block sm:inline"> {connectionError}</span>
          <span className="block mt-1">Some features may be limited. </span>
          <button
            onClick={handleRetry}
            className="underline ml-2"
          >
            Retry Connection
          </button>
        </div>
        {hypernotes.map((hypernote) => (
          <HypernoteView key={hypernote.id} hypernote={hypernote} />
        ))}
      </div>
    );
  }

  // Connection error and no hypernotes
  if (connectionError) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4 text-red-500">Connection Error</h2>
        <p className="text-gray-600 text-center mb-6">
          {connectionError}
        </p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Show query error if there was a problem fetching hypernotes
  if (queryError) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4 text-red-500">Error Loading Hypernotes</h2>
        <p className="text-gray-600 text-center mb-6">
          There was a problem loading hypernotes. Please try again.
        </p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show a message if there are no hypernotes
  if (hypernotes.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">No Hypernotes Found</h2>
        <p className="text-gray-600 text-center mb-6">
          {nostrService.isConnected 
            ? "There are no hypernotes available right now. Create your first hypernote!"
            : "Not connected to Nostr relays. Please check your connection."}
        </p>
        {nostrService.isConnected ? (
          <a
            href="/create"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Create Hypernote
          </a>
        ) : (
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      {hypernotes.map((hypernote) => (
        <HypernoteView key={hypernote.id} hypernote={hypernote} />
      ))}
    </div>
  );
}
