import React, { useState } from "react";
import MobileHeader from "@/components/layout/mobile-header.tsx";
import Sidebar from "@/components/layout/sidebar.tsx";
import AvatarWithBadge from "@/components/ui/avatar-with-badge.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Camera, Edit, Loader2, MessageSquare, Settings, Target, Trophy, User} from "lucide-react";
import {Badge} from "@/components/ui/badge.tsx";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog.tsx";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import MobileNavigation from "@/components/layout/mobile-navigation.tsx";

type Message = {
    id: number;
    sender: "me" | "other";
    content?: string;
    imageUrl?: string;
};

export default function MessagePage() {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, sender: "other", content: "Hi there!" },
        { id: 2, sender: "me", content: "Hello! How can I help you?" },
    ]);
    const [newMessage, setNewMessage] = useState("");

    const sendMessage = () => {
        if (!newMessage.trim() && !selectedImage) return;

        const newMsg: Message = {
            id: messages.length + 1,
            sender: "me",
            content: newMessage.trim() || undefined,
            imageUrl: selectedImage ? URL.createObjectURL(selectedImage) : undefined,
        };

        setMessages((prev) => [...prev, newMsg]);
        setNewMessage("");
        setSelectedImage(null);
        setImagePreviewUrl(null);
    };


    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    };



    return (
        <div className="min-h-screen bg-background">
            <MobileHeader />
            <div className="flex mt-14">
                <Sidebar />
                <main className="flex-1 md:ml-56 p-4 pb-20">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col flex-grow max-h-full max-w-full mx-auto border shadow-lg">
                            {/* Chat header */}
                            <div className="flex items-center gap-3 p-4 border-b bg-white">
                                <img
                                    src="https://ui-avatars.com/api/?name=Jane+Doe&background=random&color=fff" // Replace with actual path or dynamic data
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-900">Jane Doe</span>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto px-4 py-2 bg-gray-100 space-y-2">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                                            msg.sender === "me"
                                                ? "bg-primary text-primary-foreground self-end ml-auto"
                                                : "bg-white text-black self-start mr-auto border"
                                        }`}
                                    >
                                        {msg.content && <p>{msg.content}</p>}
                                        {msg.imageUrl && (
                                            <img
                                                src={msg.imageUrl}
                                                alt="sent media"
                                                className="mt-2 rounded-lg max-w-xs max-h-60 object-cover"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Message Input */}

                            {imagePreviewUrl && (
                                <div className="mb-2 relative max-w-xs">
                                    <img src={imagePreviewUrl} alt="Preview" className="rounded-lg" />
                                    <button
                                        onClick={() => {
                                            setSelectedImage(null);
                                            setImagePreviewUrl(null);
                                        }}
                                        className="absolute top-1 right-1 bg-white text-black text-xs rounded-full px-2 py-1 shadow"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                                <div className="flex items-center w-full p-3 border-t bg-white gap-2">
                                    {/* Hidden file input */}
                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                    <label htmlFor="image-upload" className="cursor-pointer text-xl text-gray-500 hover:text-primary">
                                        📷
                                    </label>

                                <input
                                    className="flex-1 border rounded-xl px-3 py-2 mr-2 focus:outline-none"
                                    type="text"
                                    placeholder="Type your message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                />
                                <button
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90"
                                    onClick={sendMessage}
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <MobileNavigation activeTab="profile" />
        </div>
    );
};
