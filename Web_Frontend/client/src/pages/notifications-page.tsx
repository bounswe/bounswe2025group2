import  Sidebar  from "@/components/layout/sidebar";
import  MobileHeader  from "@/components/layout/mobile-header";
import  MobileNavigation  from "@/components/layout/mobile-navigation";
import { Card, CardContent } from "@/components/ui/card";
import {Loader2, Bell, Search, Filter, Users} from "lucide-react";
import {Input} from "@/components/ui/input.tsx";
import { useQuery } from "@tanstack/react-query";
import {useState} from "react";
import {Button} from "@/components/ui/button.tsx";

export default function NotificationsPage() {

    const { data: notifications, isLoading } = useQuery({
        queryKey: ["/api/notifications"],
        queryFn: async () => {
            const res = await fetch("/api/notifications");
            if (!res.ok) throw new Error("Failed to fetch notifications");
            return res.json();
        },
    });

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
                                <h2 className="text-2xl font-semibold text-secondary-dark">Notifications</h2>
                                <p className="text-muted-foreground">your sportsmentor notifications</p>
                            </div>
                        </div>

                        {/* Notifications */}
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                            </div>
                        ) : (notifications?.length > 0 ? (
                            <div className="text-center bg-card rounded-xl border border-border">
                                {notifications.map((n) => {
                                    return (
                                        <Card key={n.id}>
                                            <CardContent>
                                                <h2 className="text-lg font-semibold">{n.title}</h2>
                                                <p className="text-sm text-muted-foreground">{n.message}</p>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-card rounded-xl border border-border">
                                <div className="flex justify-center mb-4">
                                    <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center">
                                        <Bell className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-medium mb-2">No Notifications Yet</h3>
                                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                                    there are no notifications yet. check back later!
                                </p>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
            <MobileNavigation activeTab="notifications" />
        </div>
    );
}
