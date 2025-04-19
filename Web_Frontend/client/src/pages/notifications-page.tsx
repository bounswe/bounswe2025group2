import  Sidebar  from "@/components/layout/sidebar";
import  MobileHeader  from "@/components/layout/mobile-header";
import  MobileNavigation  from "@/components/layout/mobile-navigation";
import { Card, CardContent } from "@/components/ui/card";
import {Loader2, Bell, Search, Filter, Users} from "lucide-react";
import {Input} from "@/components/ui/input.tsx";
import { useQuery } from "@tanstack/react-query";
import {useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";

interface Notification {
    id: number;
    content: string;
    createdAt: string;
    read: boolean;
    type: string;
    userId: number;
    relatedId?: number;
}

export default function NotificationsPage() {
    const { theme } = useTheme();
    const { data: notifications, isLoading } = useQuery<Notification[]>({
        queryKey: ["/api/notifications"],
        queryFn: async () => {
            const res = await fetch("/api/notifications");
            if (!res.ok) throw new Error("Failed to fetch notifications");
            return res.json();
        },
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
            return "Just now";
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <MobileHeader />
            <div className="flex mt-14">
                <Sidebar activeTab="notifications" />
                <main className="flex-1 md:ml-56 p-4 pb-20">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                            <div>
                                <h1 className={cn(
                                    "text-2xl md:text-3xl font-bold",
                                    theme === 'dark' ? 'text-white' : 'text-[#800000]'
                                )}>Notifications</h1>
                                <p className={cn(
                                    theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                                )}>your genfit notifications</p>
                            </div>
                        </div>

                        {/* Notifications */}
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className={cn(
                                    "h-8 w-8 animate-spin",
                                    theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                                )} />
                            </div>
                        ) : notifications && notifications.length > 0 ? (
                            <div className="space-y-4">
                                {notifications.map((notification) => (
                                    <Card 
                                        key={notification.id} 
                                        className={cn(
                                            "bg-nav-bg transition-colors",
                                            theme === 'dark' 
                                                ? 'border-[#e18d58]' 
                                                : 'border-[#800000]',
                                            notification.read ? 'opacity-70' : ''
                                        )}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "bg-background border p-2 rounded-full",
                                                    theme === 'dark' 
                                                        ? 'border-[#e18d58]' 
                                                        : 'border-[#800000]'
                                                )}>
                                                    <Bell className={cn(
                                                        "h-4 w-4",
                                                        theme === 'dark' 
                                                            ? 'text-[#e18d58]' 
                                                            : 'text-[#800000]'
                                                    )} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={cn(
                                                        "font-medium",
                                                        theme === 'dark' 
                                                            ? 'text-white' 
                                                            : 'text-[#800000]'
                                                    )}>{notification.content}</p>
                                                    <p className={cn(
                                                        "text-xs mt-1",
                                                        theme === 'dark' 
                                                            ? 'text-white/70' 
                                                            : 'text-[#800000]/70'
                                                    )}>
                                                        {formatDate(notification.createdAt)}
                                                    </p>
                                                </div>
                                                {!notification.read && (
                                                    <div className={cn(
                                                        "h-2 w-2 rounded-full",
                                                        theme === 'dark' 
                                                            ? 'bg-[#e18d58]' 
                                                            : 'bg-[#800000]'
                                                    )} />
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className={cn(
                                "text-center py-12 bg-nav-bg rounded-xl border",
                                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                            )}>
                                <div className="flex justify-center mb-4">
                                    <div className={cn(
                                        "bg-background h-16 w-16 rounded-full flex items-center justify-center border",
                                        theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                                    )}>
                                        <Bell className={cn(
                                            "h-8 w-8",
                                            theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                                        )} />
                                    </div>
                                </div>
                                <h3 className={cn(
                                    "text-lg font-bold mb-2",
                                    theme === 'dark' ? 'text-white' : 'text-[#800000]'
                                )}>No Notifications Yet</h3>
                                <p className={cn(
                                    "max-w-md mx-auto",
                                    theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                                )}>
                                    there are no notifications yet. check back later!
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
            <MobileNavigation activeTab="notifications" />
        </div>
    );
}
