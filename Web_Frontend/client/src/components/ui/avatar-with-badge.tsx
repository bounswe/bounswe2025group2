import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface AvatarWithBadgeProps {
  src?: string;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
  role?: string;
  verified?: boolean;
  className?: string;
}

export default function AvatarWithBadge({
  src,
  fallback,
  size = "md",
  role,
  verified = false,
  className,
}: AvatarWithBadgeProps) {
  // Define size classes
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16", 
    xl: "h-24 w-24"
  };
  
  // Define badge position classes based on avatar size
  const badgePositionClasses = {
    sm: "bottom-0 right-0 h-3 w-3",
    md: "bottom-0 right-0 h-4 w-4",
    lg: "bottom-0 right-0 h-5 w-5",
    xl: "bottom-0 right-0 h-6 w-6"
  };
  
  // Define border classes
  const badgeBorderClasses = {
    sm: "border",
    md: "border-2",
    lg: "border-2",
    xl: "border-3"
  };
  
  // Determine badge color based on role
  const getBadgeColor = () => {
    if (role === "mentor") return "bg-active text-text";
    if (role === "coach") return "bg-subText text-text";
    return "bg-passive text-text";
  };
  
  return (
    <div className={cn("relative inline-block", className)}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={src} alt={fallback} />
        <AvatarFallback className="bg-primary text-secondary-dark">
          {fallback}
        </AvatarFallback>
      </Avatar>
      
      {/* Role badge */}
      {role && role !== "trainee" && (
        <div
          className={cn(
            "absolute rounded-full border-white flex items-center justify-center",
            badgePositionClasses[size],
            badgeBorderClasses[size],
            getBadgeColor()
          )}
        >
          {size === "sm" ? (
            <span className="text-[8px]">
              {role === "mentor" ? "M" : "C"}
            </span>
          ) : (
            <span className={cn(
              "text-xs",
              size === "xl" && "text-sm"
            )}>
              {role === "mentor" ? "M" : "C"}
            </span>
          )}
        </div>
      )}
      
      {/* Verification badge */}
      {verified && (
        <div
          className={cn(
            "absolute -top-1 -right-1",
            size === "sm" && "h-3 w-3 -top-0.5 -right-0.5",
            size === "md" && "h-4 w-4",
            size === "lg" && "h-5 w-5",
            size === "xl" && "h-6 w-6"
          )}
        >
          <CheckCircle2 className="h-full w-full text-green-500 fill-white" />
        </div>
      )}
    </div>
  );
}
