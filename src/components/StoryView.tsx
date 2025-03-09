import { Link } from "@tanstack/react-router";
import type { NostrPost } from "@/queries/posts";
import { authorQueryOptions } from "@/queries/authors";
import { useQuery } from "@tanstack/react-query";

import { Heart, MessageCircle, Share2, BookmarkPlus } from "lucide-react"

interface StoryViewProps {
  post: NostrPost;
  showJson?: boolean;
}

export function StoryView({ post }: StoryViewProps) {
  const { data: author } = useQuery(authorQueryOptions(post.author));

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-cover bg-center bg-neutral-900"
      style={{ backgroundImage: `url(${author?.picture})` }}
    >
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-center">
        <h2 className="text-white text-4xl font-bold mb-4">Story {post.id}</h2>
        <p className="text-white text-xl">Swipe up for next</p>
      </div>

      {/* Overlay for username and actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-white font-semibold">@{post.content}</p>
            <p className="text-white/80 text-sm">Story caption goes here...</p>
          </div>

          <div className="flex flex-col gap-4 items-center">
            <button className="flex flex-col items-center">
              <div className="bg-black/30 p-2 rounded-full">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs mt-1">24.5k</span>
            </button>

            <button className="flex flex-col items-center">
              <div className="bg-black/30 p-2 rounded-full">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs mt-1">1.2k</span>
            </button>

            <button className="flex flex-col items-center">
              <div className="bg-black/30 p-2 rounded-full">
                <BookmarkPlus className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs mt-1">Save</span>
            </button>

            <button className="flex flex-col items-center">
              <div className="bg-black/30 p-2 rounded-full">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs mt-1">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 