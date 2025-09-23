import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface Quote {
  text: string;
  author: string;
}

export function QuoteRandomCard() {
  const { theme } = useTheme();

  const { data: quote, isLoading, error } = useQuery<Quote>({
    queryKey: ["/api/quotes/random"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/quotes/random");
      if (!res.ok) throw new Error("Failed to fetch quote");
      return res.json();
    },
    staleTime: 1000 * 15 , // Cache for 15 seconds
  });

  if (isLoading) {
    return (
      <Card className={cn(
        "bg-nav-bg border",
        theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
      )}>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className={cn(
            "h-6 w-6 animate-spin",
            theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
          )} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn(
        "bg-nav-bg border",
        theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
      )}>
        <CardContent className="py-4 text-center">
          <p className={cn(
            theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
          )}>Failed to load random quote</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "bg-nav-bg border",
      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
    )}>
      <CardHeader className="pb-2">
        <CardTitle className={cn(
          "text-lg",
          theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
        )}>Random Inspiration</CardTitle>
      </CardHeader>
      <CardContent>
        <blockquote className={cn(
          "border-l-2 pl-4 italic",
          theme === 'dark' ? 'border-[#e18d58] text-white' : 'border-[#800000] text-[#800000]'
        )}>
          <p className="mb-2">{quote?.text}</p>
          <footer className={cn(
            "text-sm",
            theme === 'dark' ? 'text-white/70' : 'text-[#800000]/80'
          )}>— {quote?.author}</footer>
        </blockquote>
      </CardContent>
    </Card>
  );
}