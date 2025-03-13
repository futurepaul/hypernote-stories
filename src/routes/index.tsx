import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { SingleRow } from "@/components/GridLayout";
import { hypernotesQueryOptions } from "@/queries/hypernotes";
import { authorQueryOptions } from "@/queries/authors";
import { Heart, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ElementRenderer } from "@/components/elements/ElementRenderer";

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
  // Fetch author data
  const authorQuery = useQuery(authorQueryOptions(hypernote.author));

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

  // Create left content with author data
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
          />
        </div>
      }
      right={rightContent}
      editor={false}
    />
  );
}

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    const { queryClient } = context as { queryClient: any };
    return queryClient.ensureQueryData(hypernotesQueryOptions);
  },
  component: Index,
});

function Index() {
  const hypernotesQuery = useSuspenseQuery(hypernotesQueryOptions);
  const hypernotes = hypernotesQuery.data || [];

  // Show a message if there are no hypernotes
  if (hypernotes.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">No Hypernotes Found</h2>
        <p className="text-gray-600 text-center mb-6">
          There are no hypernotes available right now. Create your first
          hypernote!
        </p>
        <a
          href="/create"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Create Hypernote
        </a>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      {hypernotes.map((hypernote) => (
        <HypernoteView hypernote={hypernote} />
      ))}
    </div>
  );
}
