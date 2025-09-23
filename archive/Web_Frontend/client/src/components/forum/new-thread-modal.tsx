import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Image, Paperclip, Smile, X } from "lucide-react";
import { Loader2 } from "lucide-react";

type NewThreadModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function NewThreadModal({ isOpen, onClose }: NewThreadModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threadType, setThreadType] = useState("discussion");
  const [threadTitle, setThreadTitle] = useState("");
  const [threadContent, setThreadContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  
  // Create thread mutation
  const createThreadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/forum/threads", {
        title: threadTitle,
        category: threadType,
        tags: tags,
        postContent: threadContent,
        imageUrl: imageUrl
      });
      return res.json();
    },
    onSuccess: () => {
      // Refresh threads list
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads"] });
      
      // Show success toast
      toast({
        title: "Thread created",
        description: "Your discussion has been posted successfully.",
      });
      
      // Reset form and close modal
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create thread",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setThreadType("discussion");
    setThreadTitle("");
    setThreadContent("");
    setTags([]);
    setNewTag("");
    setImageUrl("");
  };

  const handleSubmit = () => {
    if (!threadTitle.trim()) {
      toast({
        title: "Missing title",
        description: "Please provide a title for your thread.",
        variant: "destructive",
      });
      return;
    }
    
    if (!threadContent.trim()) {
      toast({
        title: "Missing content",
        description: "Please provide content for your thread.",
        variant: "destructive",
      });
      return;
    }
    
    createThreadMutation.mutate();
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle enter key press in tag input
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Start a New Thread</DialogTitle>
        </DialogHeader>
        
        <div className="p-0">
          <div className="mb-4">
            <Label htmlFor="threadType" className="block text-sm font-medium text-neutral-700 mb-1">Thread Type</Label>
            <Select value={threadType} onValueChange={setThreadType}>
              <SelectTrigger id="threadType" className="w-full">
                <SelectValue placeholder="Select thread type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discussion">General Discussion</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="program_review">Program Review</SelectItem>
                <SelectItem value="mentor_search">Looking for Mentor</SelectItem>
                <SelectItem value="challenge">Challenge</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mb-4">
            <Label htmlFor="threadTitle" className="block text-sm font-medium text-neutral-700 mb-1">Title</Label>
            <Input 
              id="threadTitle" 
              className="w-full" 
              placeholder="Give your thread a descriptive title"
              value={threadTitle}
              onChange={(e) => setThreadTitle(e.target.value)}
            />
          </div>
          
          <div className="mb-4">
            <Label htmlFor="threadContent" className="block text-sm font-medium text-neutral-700 mb-1">Content</Label>
            <Textarea 
              id="threadContent" 
              rows={4} 
              className="w-full"
              placeholder="What's on your mind?"
              value={threadContent}
              onChange={(e) => setThreadContent(e.target.value)}
            />
          </div>
          
          <div className="mb-4">
            <Label className="block text-sm font-medium text-neutral-700 mb-1">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <Badge key={index} className="px-2 py-1 bg-primary-light text-secondary-dark flex items-center">
                  {tag}
                  <button 
                    className="ml-1"
                    onClick={() => removeTag(tag)}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              
              <div className="flex">
                <Input
                  type="text"
                  className="px-2 py-1 text-sm"
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="ml-1"
                  onClick={addTag}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Button type="button" variant="ghost" size="sm" className="mr-3 text-neutral-700 hover:text-secondary-dark">
              <Image className="h-5 w-5" />
            </Button>
            
            <Button type="button" variant="ghost" size="sm" className="mr-3 text-neutral-700 hover:text-secondary-dark">
              <Paperclip className="h-5 w-5" />
            </Button>
            
            <Button type="button" variant="ghost" size="sm" className="text-neutral-700 hover:text-secondary-dark">
              <Smile className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <DialogFooter className="border-t border-neutral-200 pt-4">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-secondary text-white hover:bg-secondary-dark"
            disabled={createThreadMutation.isPending}
          >
            {createThreadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              "Post Thread"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
