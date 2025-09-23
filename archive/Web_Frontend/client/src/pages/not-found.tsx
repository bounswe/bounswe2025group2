import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";

export default function NotFound() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className={cn(
        "w-full max-w-md mx-4 border-theme",
        theme === 'dark' ? 'bg-[#2c2c2c]' : 'bg-[#f0f0f0]'
      )}>
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold active">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-sub">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
