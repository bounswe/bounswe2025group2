import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ForumPost from "@/components/forum/forum-post";
import ForumReply from "@/components/forum/forum-reply";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MoreVertical,
  Bookmark,
  Share,
  MessageSquare
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ForumThreadCardProps = {
  thread: any;
  showFullThread?: boolean;
};

export default function ForumThreadCard({ thread, showFullThread = false }: ForumThreadCardProps) {
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(thread.isBookmarked || false);
  const [isFollowing, setIsFollowing] = useState(thread.isFollowing || false);
  
  // Get the first post of the thread
  const firstPost = thread.firstPost || thread.posts?.[0];
  
  // Get only the first few replies to display in the preview
  const visibleReplies = thread.posts 
    ? thread.posts.slice(0, 2).flatMap((post: any) => post.replies || []).slice(0, 2)
    : [];

  // Mutations
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/forum/threads/${thread.id}/bookmark`, {});
      } else {
        await apiRequest("POST", `/api/forum/threads/${thread.id}/bookmark`, {});
      }
    },
    onSuccess: () => {
      setIsBookmarked(!isBookmarked);
    }
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await apiRequest("DELETE", `/api/forum/threads/${thread.id}/follow`, {});
      } else {
        await apiRequest("POST", `/api/forum/threads/${thread.id}/follow`, {});
      }
    },
    onSuccess: () => {
      setIsFollowing(!isFollowing);
    }
  });

  const replyMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number, content: string }) => {
      const res = await apiRequest("POST", "/api/forum/replies", {
        postId,
        content,
        threadId: thread.id
      });
      return res.json();
    },
    onSuccess: () => {
      setReplyContent("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: [`/api/forum/threads/${thread.id}`] });
    }
  });
  
  const handleReply = (postId: number) => {
    if (!replyContent.trim()) return;
    
    replyMutation.mutate({
      postId,
      content: replyContent
    });
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 mb-4 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href={`/forum/${thread.id}`} className="text-secondary font-medium hover:text-secondary-dark">
              /{thread.category}
            </Link>
            <button 
              className={`ml-2 rounded-full ${isFollowing ? 'text-secondary-dark' : 'text-neutral-500 hover:text-secondary-dark'}`}
              onClick={() => followMutation.mutate()}
            >
              <Bookmark className="h-4 w-4" fill={isFollowing ? 'currentColor' : 'none'} />
            </button>
          </div>
          
          <div className="flex items-center text-neutral-500">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 p-1 rounded-full hover:bg-neutral-100">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => bookmarkMutation.mutate()}>
                  {isBookmarked ? "Remove Bookmark" : "Bookmark Thread"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => followMutation.mutate()}>
                  {isFollowing ? "Unfollow Thread" : "Follow Thread"}
                </DropdownMenuItem>
                <DropdownMenuItem>Report Thread</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Main post */}
        {firstPost && (
          <ForumPost 
            post={firstPost} 
            onReply={() => setReplyingTo(firstPost.id)}
            threadId={thread.id}
          />
        )}
        
        {/* Replies */}
        {visibleReplies.map((reply: any) => (
          <ForumReply key={reply.id} reply={reply} />
        ))}
        
        {/* Reply form */}
        {replyingTo === firstPost?.id && (
          <div className="mt-4 pl-12">
            <div className="flex">
              <div className="flex-shrink-0 mr-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImage} alt={user?.username} />
                  <AvatarFallback>{user?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1">
                <Textarea
                  placeholder="Write your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[80px] mb-2"
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-secondary text-white hover:bg-secondary-dark"
                    onClick={() => handleReply(firstPost.id)}
                    disabled={replyMutation.isPending || !replyContent.trim()}
                  >
                    {replyMutation.isPending ? "Posting..." : "Post Reply"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Show more link */}
        {!showFullThread && (
          <div className="mt-4 text-center">
            <Link href={`/forum/${thread.id}`} className="text-sm text-secondary hover:text-secondary-dark">
              See this thread in full context &gt;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
