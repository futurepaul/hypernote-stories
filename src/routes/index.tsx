import { StoryView } from "@/components/StoryView";
import { postQueryOptions, postsQueryOptions } from "@/queries/posts";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(postsQueryOptions),
  component: Index,
});

function Index() {
  const postsQuery = useSuspenseQuery(postsQueryOptions);
  const stories = postsQuery.data;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return (
    <div className="h-screen w-full overflow-y-auto snap-y snap-mandatory">
      {stories.map((story) => (
        <div key={story.id} className="relative snap-start snap-always">
          {/* This is the scroll anchor point - it will snap to the top of the viewport */}
          <div className="h-0 md:h-24 w-full invisible"></div>

          {/* The actual card with margin from the anchor point */}
          <div
            className={
              "relative h-[calc(100vh-4rem)] md:border-black md:border-2 md:rounded-xs md:shadow-xs w-full md:h-[calc(100vh-12rem)] md:max-w-[420px] md:mx-auto"
            }
          >
            <StoryView post={story} />
          </div>

          {/* Bottom spacing */}
          <div className="h-0 md:h-24 w-full invisible"></div>
        </div>
      ))}
    </div>
  );
}
