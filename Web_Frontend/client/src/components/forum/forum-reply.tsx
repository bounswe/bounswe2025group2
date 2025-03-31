import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageSquare } from "lucide-react";

type ForumReplyProps = {
  reply: any;
};

export default function ForumReply({ reply }: ForumReplyProps) {
  const [hasVoted, setHasVoted] = useState(reply.hasVoted || false);
  const [voteCount, setVoteCount] = useState(reply.voteCount || 0);
  
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
        await apiRequest("DELETE", `/api/forum/replies/${reply.id}/vote`, {});
      } else {
        await apiRequest("POST", `/api/forum/replies/${reply.id}/upvote`, {});
      }
    },
    onSuccess: () => {
      setHasVoted(!hasVoted);
      setVoteCount(hasVoted ? voteCount - 1 : voteCount + 1);
    }
  });

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
    <div className="mt-3 pl-12">
      <div className="flex">
        <Link href={`/profile/${reply.user?.username}`} className="flex-shrink-0 mr-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={reply.user?.profileImage} alt={reply.user?.username || "User"} />
            <AvatarFallback>{reply.user?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center">
            <Link href={`/profile/${reply.user?.username}`} className="font-medium text-neutral-800 mr-2">
              @{reply.user?.username}
            </Link>
            <span className="text-xs text-neutral-500">{formatDate(reply.createdAt)}</span>
          </div>
          
          <div className="mt-1 text-neutral-700">
            {formatContent(reply.content)}
          </div>
          
          <div className="mt-2">
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
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                <span className="text-xs">Reply</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
