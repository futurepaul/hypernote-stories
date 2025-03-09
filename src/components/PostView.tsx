import { Link } from "@tanstack/react-router";
import type { NostrPost } from "@/queries/posts";
import { authorQueryOptions } from "@/queries/authors";
import { useQuery } from "@tanstack/react-query";

interface PostViewProps {
  post: NostrPost;
  showJson?: boolean;
}

export function PostView({ post, showJson = false }: PostViewProps) {
  const { data: author } = useQuery(authorQueryOptions(post.author));

  return (
    <div className="border p-4 rounded-lg w-full h-full max-h-[calc(100vh-90px)] md:max-h-[calc(100vh-140px)] overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        {author?.picture && (
          <img src={author.picture} alt="" className="w-10 h-10 rounded-full" />
        )}
        <div>
          <div className="font-medium">{author?.name || post.author.slice(0, 8)}</div>
          {author?.nip05 && <div className="text-sm text-gray-500">{author.nip05}</div>}
        </div>
      </div>
      <p className="text-lg">{post.content}</p>
      <div className="text-sm text-gray-500 mt-4">
        {new Date(post.createdAt * 1000).toLocaleString()}
      </div>
      <Link
        to="/posts/$postId"
        params={{ postId: post.id }}
        className="text-sm text-blue-500 underline mt-2 block"
      >
        {post.id.slice(0, 8)}...
      </Link>
      {showJson && (
        <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap mt-4">
          {JSON.stringify(post, null, 2)}
        </pre>
      )}
    </div>
  );
} 