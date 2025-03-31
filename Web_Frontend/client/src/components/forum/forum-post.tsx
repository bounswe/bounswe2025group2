import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ThumbsUp,
  MessageSquare,
  Share
} from "lucide-react";

type ForumPostProps = {
  post: any;
  onReply: () => void;
  threadId: number;
};

export default function ForumPost({ post, onReply, threadId }: ForumPostProps) {
  const { user } = useAuth();
  const [hasVoted, setHasVoted] = useState(post.hasVoted || false);
  const [voteCount, setVoteCount] = useState(post.voteCount || 0);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Upvote mutation
  const voteMutation = useMutation({
    mutationFn: async () => {
      if (hasVoted) {
        await apiRequest("DELETE", `/api/forum/posts/${post.id}/vote`, {});
      } else {
        await apiRequest("POST", `/api/forum/posts/${post.id}/upvote`, {});
      }
    },
    onSuccess: () => {
      setHasVoted(!hasVoted);
      setVoteCount(hasVoted ? voteCount - 1 : voteCount + 1);
      // Invalidate thread query to reflect changes
      queryClient.invalidateQueries({ queryKey: [`/api/forum/threads/${threadId}`] });
    }
  });

  // Share post
  const sharePost = () => {
    // In a real app, this would open a share dialog or copy a link
    if (navigator.share) {
      navigator.share({
        title: "Check out this post",
        text: post.content,
        url: window.location.href,
      });
    } else {
      // Fallback to copying the URL
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  // Find mentions and hashtags in content for highlighting
  const formatContent = (content: string) => {
    if (!content) return "";
    
    // Replace mentions with links
    const mentionPattern = /@(\w+)/g;
    const contentWithMentions = content.replace(mentionPattern, 
      '<a href="#profile/$1" class="text-secondary font-medium">@$1</a>'
    );
    
    return <div dangerouslySetInnerHTML={{ __html: contentWithMentions }} />;
  };

  return (
    <div className="mt-3">
      <div className="flex">
        <Link href={`/profile/${post.user?.username}`} className="flex-shrink-0 mr-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.user?.profileImage} alt={post.user?.username || "User"} />
            <AvatarFallback>{post.user?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center">
            <Link href={`/profile/${post.user?.username}`} className="font-medium text-neutral-800 mr-2">
              @{post.user?.username}
            </Link>
            <span className="text-xs text-neutral-500">{formatDate(post.createdAt)}</span>
          </div>
          
          <div className="mt-1 text-neutral-700">
            {post.imageUrl && (
              <div className="mb-2 rounded-lg overflow-hidden">
                <img src={post.imageUrl} alt="Post attachment" className="w-full h-auto" />
              </div>
            )}
            {formatContent(post.content)}
          </div>
          
          <div className="mt-3">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`flex items-center text-neutral-500 hover:text-secondary-dark p-0 h-auto ${hasVoted ? 'text-secondary-dark' : ''}`}
                onClick={() => voteMutation.mutate()}
              >
                <ThumbsUp className="h-4 w-4 mr-1" fill={hasVoted ? 'currentColor' : 'none'} />
                <span className="text-xs">{voteCount}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center text-neutral-500 hover:text-secondary-dark p-0 h-auto"
                onClick={onReply}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                <span className="text-xs">Reply</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center text-neutral-500 hover:text-secondary-dark p-0 h-auto"
                onClick={sharePost}
              >
                <Share className="h-4 w-4 mr-1" />
                <span className="text-xs">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
