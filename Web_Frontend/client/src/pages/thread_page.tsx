import {ThumbsUp, MessageCircle, ThumbsDown} from "lucide-react";
import { format } from "date-fns";

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {useQuery} from "@tanstack/react-query";
import MobileHeader from "@/components/layout/mobile-header.tsx";
import Sidebar from "@/components/layout/sidebar.tsx";
import MobileNavigation from "@/components/layout/mobile-navigation.tsx";
import { API_BASE_URL, WEB_SOCKET_URL } from "@/lib/queryClient.ts";


function getCsrfToken() {
    const name = 'csrftoken';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const lastPart = parts.pop();
        if (lastPart) {
            const value = lastPart.split(';').shift();
            return value ?? '';
        }
    }
    return '';
}

export default function ThreadPageWrapper() {
    const [reply, setReply] = useState("");
    const [reply2, setReply2] = useState("");
    console.log("Current URL:", window.location.pathname);
    const id = Number(window.location.pathname.split("/")[2])
    console.log(id);


    const {data: threadsInfo, isLoading: threadinfoLoading} = useQuery({
        queryKey: ["threads"],
        queryFn: async () => {
            const csrfToken = getCsrfToken();
            const response = await fetch(`${API_BASE_URL}/api/threads/` + id, {
                method: "GET",
                credentials: 'include',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to create thread');
            }

            return response.json()
        }
    })

    console.log("threadinfo", threadsInfo)
    const [threadInfo, setThreadInfo] = useState<any>(null);
    useEffect(() => {
        if (threadsInfo && (!threadsInfo.length)) {
            setThreadInfo(threadsInfo);
        }
        if (threadsInfo && threadsInfo.length > 0) {
            setThreadInfo(threadsInfo.find((f: any) => f.id === id)); // Replace 2 with your desired ID
        }
    }, [threadsInfo]);

    let {data: commentsInfo, isLoading: commentsInfoLoading, refetch: refetchcomm} = useQuery({
        queryKey: ["comments"],
        queryFn: async () => {
            const csrfToken = getCsrfToken();
            const response = await fetch(`${API_BASE_URL}/api/comments/thread/` + id + "/", {
                method: "GET",
                credentials: 'include',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to create thread');
            }

            let data = await response.json();

            const enrichedData = await Promise.all(
                data.map(async (item: any) => {
                    const csrfToken = getCsrfToken();
                    const response = await fetch(`${API_BASE_URL}/api/forum/vote/comment/` + item.id + "/status/", {
                        method: "GET",
                        credentials: 'include',
                        headers: {
                            'X-CSRFToken': csrfToken,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.status === 200) {
                        const rdata = await response.json();
                        item.self_vote = rdata.vote_type === "UPVOTE" ? 1 : -1;
                    } else {
                        item.self_vote = 0;
                    }

                    return item;
                })
            );

            return enrichedData;
        }
    })

    const handleReplyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setReply(event.target.value);
    };

    const handlePostReply = async () => {
        if (!reply.trim()) {
            alert("Please write a reply.");
            return;
        }

        try {
            const response = await postReplyToThread(reply);
            let data = await response.json();
            commentsInfo.push(data)
            if (response.status === 201) {
                setReply("");
            } else {
                alert("Failed to post reply.");
                // Optionally, reset the reply field or reload the page
                setReply("");
            }
        } catch (error) {
            console.error("Error posting reply:", error);
            alert("Error posting reply.");
        }
    };

    const postReplyToThread = async (replyText: string) => {
        const csrfToken = getCsrfToken();
        const response = await fetch(`${API_BASE_URL}/api/comments/add/` + id + "/", {
            method: "POST",
            credentials: 'include',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json'
            },
            body : JSON.stringify({content: replyText})
        });

        if (!response.ok) {
            throw new Error('Failed to create thread');
        }

        return response
    };

    const handleUpvote = async(replyid:number) =>{
        let comment_element = commentsInfo.filter((f: any) => f.id === replyid)[0]
        comment_element.self_vote = 1;

        const csrfToken = getCsrfToken();
        const response = await fetch(`${API_BASE_URL}/api/forum/vote/`, {
            method: "POST",
            credentials: 'include',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({content_type: "COMMENT", object_id: replyid, vote_type: "UPVOTE"})
        });
        if (!response.ok) {
            throw new Error('Failed to create thread');
        }

        refetchcomm();
    }

    const handleDownvote = async(replyid:number) => {
        let comment_element = commentsInfo.filter((f: any) => f.id === replyid)[0]
        comment_element.self_vote = -1;

        const csrfToken = getCsrfToken();
        const response = await fetch(`${API_BASE_URL}/api/forum/vote/`, {
            method: "POST",
            credentials: 'include',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({content_type: "COMMENT", object_id: replyid, vote_type: "DOWNVOTE"})
        });
        if (!response.ok) {
            throw new Error('Failed to create thread');
        }

        refetchcomm();
    }


    const handleReplyChange_subc = (event: React.ChangeEvent<HTMLInputElement>) => {
        setReply2(event.target.value);
    };

    const handlePostReply_subc = async () => {
        if (!reply2.trim()) {
            alert("Please write a reply.");
            return;
        }

        try {
            const response = await postReplyToThread_subc(reply2);
            let data = await response.json();
            fetch_subcomments_data(selectedComment.id);
            if (response.status === 201) {
                setReply2("");
            } else {
                alert("Failed to post reply.");
                // Optionally, reset the reply field or reload the page
                setReply2("");
            }
        } catch (error) {
            console.error("Error posting reply:", error);
            alert("Error posting reply.");
        }
    };


    const postReplyToThread_subc = async (replyText: string) => {
        const csrfToken = getCsrfToken();
        const response = await fetch(`${API_BASE_URL}/api/subcomments/add/` + selectedComment.id + "/", {
            method: "POST",
            credentials: 'include',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json'
            },
            body : JSON.stringify({content: replyText})
        });

        if (!response.ok) {
            throw new Error('Failed to create thread');
        }

        return response
    };

    const handleupvote_subc = async (subc_id: number) => {
        let subcomment_element = subcomments.filter((f: any) => f.id === subc_id)[0]
        subcomment_element.self_vote = 1;

        const csrfToken = getCsrfToken();
        const response = await fetch(`${API_BASE_URL}/api/forum/vote/`, {
            method: "POST",
            credentials: 'include',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({content_type: "SUBCOMMENT", object_id: subc_id, vote_type: "UPVOTE"})
        });
        if (!response.ok) {
            throw new Error('Failed to create thread');
        }
        fetch_subcomments_data(selectedComment.id);
    }

    const handledownvote_subc = async (subc_id: number) => {
        let subcomment_element = subcomments.filter((f: any) => f.id === subc_id)[0]
        subcomment_element.self_vote = -1;

        const csrfToken = getCsrfToken();
        const response = await fetch(`${API_BASE_URL}/api/forum/vote/`, {
            method: "POST",
            credentials: 'include',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({content_type: "SUBCOMMENT", object_id: subc_id, vote_type: "DOWNVOTE"})
        });
        if (!response.ok) {
            throw new Error('Failed to create thread');
        }
        fetch_subcomments_data(selectedComment.id);
    }


    const [selectedComment, setSelectedComment] = useState<any>(null);
    const [subcomments, setSubcomments] = useState<any[]>([]);
    const fetch_subcomments_data = async (replyid:number) => {
        const csrfToken = getCsrfToken();
        const response = await fetch(`${API_BASE_URL}/api/subcomments/comment/` + replyid + "/", {
            method: "GET",
            credentials: 'include',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to create thread');
        }

        let data = await response.json();

        data = await Promise.all(
            data.map(async (item: any) => {
                const csrfToken = getCsrfToken();
                const response = await fetch(`${API_BASE_URL}/api/forum/vote/subcomment/` + item.id + "/status/", {
                    method: "GET",
                    credentials: 'include',
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 200) {
                    const rdata = await response.json();
                    item.self_vote = rdata.vote_type === "UPVOTE" ? 1 : -1;
                } else {
                    item.self_vote = 0;
                }

                return item;
            })
        );


        setSubcomments(data)
        setSelectedComment(commentsInfo.filter((f: any) => f.id === replyid)[0])
        console.log("reply id: ", replyid)
    }

    console.log("selected comment: ", selectedComment);
    console.log("selected subcomments: ", subcomments);



    console.log(commentsInfo)

    if (!threadInfo) return <div className="p-4">Loading thread...</div>;
    if (!commentsInfo) return <div className="p-4">Loading comments...</div>;
    return <div className="min-h-screen bg-background">
                <MobileHeader/>
                    <div className="flex mt-14">
                        <Sidebar activeTab="forum"/>
                        <main className="flex-1 p-4 pb-20 w-full">
                            {threadinfoLoading ? (
                                <div>Loading...</div>
                            ) : (
                                <div className="w-full max-w-screen-lg mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
                                    {/* First Column (Main Thread and Comments) */}
                                    <div className="flex-1">
                                        {/* Breadcrumb */}
                                        <div className="text-sm text-gray-500 mb-4">
                                            <span className="hover:underline cursor-pointer">Forum</span> /{" "}
                                            <span className="text-primary font-medium">{threadInfo.category}</span>
                                        </div>

                                        {/* Title */}
                                        <h1 className="text-2xl font-bold mb-2 text-primary">{threadInfo.title}</h1>

                                        {/* Content */}
                                        <div className="prose prose-sm md:prose-base max-w-none mb-10">
                                            {threadInfo.content}
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex items-center text-sm text-gray-500 mb-6 gap-4 flex-wrap">
                                          <span>
                                            By <strong className="text-primary">{threadInfo.author}</strong>
                                          </span>
                                            {(() => {
                                                const date = new Date(threadInfo.created_at);
                                                return !isNaN(date.getTime()) ? (
                                                    <span>{format(date, "MMM d, HH:mm")}</span>
                                                ) : (
                                                    <span>Invalid date</span>
                                                );
                                            })()}
                                            <div className="flex items-center gap-2">
                                                <MessageCircle className="w-4 h-4" />
                                                <span>{threadInfo.comment_count}</span>
                                            </div>
                                        </div>

                                        {/* Replies (Comments) */}
                                        <div className="space-y-6">
                                            {commentsInfoLoading ? (
                                                <div>Loading...</div>
                                            ) : (
                                                commentsInfo.map((reply: any, idx: any) => (
                                                    <div key={idx} className="border rounded-lg p-4 bg-muted">
                                                        <div className="text-sm text-gray-600 mb-2 flex justify-between">
                                                            <span>
                                                                <strong className="text-primary">{reply.author_username}</strong> replied
                                                            </span>
                                                            {(() => {
                                                                const date = new Date(reply.created_at);
                                                                return !isNaN(date.getTime()) ? (
                                                                    <span>{format(date, "MMM d, HH:mm")}</span>
                                                                ) : (
                                                                    <span>Invalid date</span>
                                                                );
                                                            })()}
                                                        </div>
                                                        <p className="text-sm text-gray-800">{reply.content}</p>

                                                        {/* Upvote, Downvote, and Subcomment Count */}
                                                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-2">
                                                            <div className="flex items-center gap-4">
                                                                <button className={`flex items-center gap-1 ${
                                                                    reply.self_vote === 1 ? 'text-blue-500' : ''}`}
                                                                        onClick={() => handleUpvote(reply.id)}>
                                                                    <span>{reply.like_count ?? 0}</span>
                                                                    <ThumbsUp className="w-4 h-4" />
                                                                </button>
                                                                <button className={`flex items-center gap-1 ${
                                                                    reply.self_vote === -1 ? 'text-blue-500' : ''}`}
                                                                        onClick={() => handleDownvote(reply.id)}>
                                                                    <ThumbsDown className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <button className="flex items-center gap-1" onClick={() => fetch_subcomments_data(reply.id)}>
                                                                    <MessageCircle className="w-4 h-4" />
                                                                    <span>{reply.subcomment_count}</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Reply Form */}
                                        <div>
                                            <input
                                                type="text"
                                                value={reply}
                                                onChange={handleReplyChange}
                                                placeholder="Write a reply..."
                                                className="border p-2 rounded"
                                            />
                                            <button onClick={handlePostReply} className="bg-primary text-white p-2 rounded mt-2">
                                                Post Reply
                                            </button>
                                        </div>
                                    </div>

                                    {/* Second Column (Subcomments of selected comment) */}
                                    <div className="flex-1">
                                        {/* Show selected comment's subcomments */}
                                        {(subcomments && selectedComment) ? (
                                            <div>
                                                {/* Content */}
                                                <div className="prose prose-sm md:prose-base max-w-none mb-10">
                                                    {selectedComment.content}
                                                </div>

                                                {/* Metadata */}
                                                <div className="flex items-center text-sm text-gray-500 mb-6 gap-4 flex-wrap">
                                                    <span>
                                                        By <strong className="text-primary">{selectedComment.author_username}</strong>
                                                    </span>
                                                    {(() => {
                                                        const date = new Date(selectedComment.created_at);
                                                        return !isNaN(date.getTime()) ? (
                                                            <span>{format(date, "MMM d, HH:mm")}</span>
                                                        ) : (
                                                            <span>Invalid date</span>
                                                        );
                                                    })()}
                                                    <div className="flex items-center gap-2">
                                                        <MessageCircle className="w-4 h-4" />
                                                        <span>{selectedComment.subcomment_count}</span>
                                                    </div>
                                                </div>

                                                <h3 className="text-xl font-semibold mb-4">Further Discussion</h3>
                                                {subcomments?.map((subcomment: any, idx: any) => (
                                                    <div key={idx}>
                                                        <div className="border rounded-lg p-4 bg-muted mb-4">
                                                            <div className="text-sm text-gray-600 mb-2 flex justify-between">
                                                                <span>
                                                                    <strong className="text-primary">{subcomment.author_username}</strong> replied
                                                                </span>
                                                                <span>{format(new Date(subcomment.created_at), "MMM d, HH:mm")}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-800">{subcomment.content}</p>


                                                            {/* Upvote, Downvote, and Subcomment Count */}
                                                            <div className="flex items-center gap-6 text-sm text-gray-500 mb-2">
                                                                <div className="flex items-center gap-4">
                                                                    <button className={`flex items-center gap-1 ${
                                                                        subcomment.self_vote === 1 ? 'text-blue-500' : ''}`}
                                                                            onClick={() => handleupvote_subc(subcomment.id)}>
                                                                        <span>{subcomment.like_count ?? 0}</span>
                                                                        <ThumbsUp className="w-4 h-4" />
                                                                    </button>
                                                                    <button className={`flex items-center gap-1 ${
                                                                            subcomment.self_vote === -1 ? 'text-blue-500' : ''
                                                                            }`}
                                                                                onClick={() => handledownvote_subc(subcomment.id)}>
                                                                        <ThumbsDown className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Reply Form */}
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={reply2}
                                                        onChange={handleReplyChange_subc}
                                                        placeholder="Write a reply..."
                                                        className="border p-2 rounded"
                                                    />
                                                    <button onClick={handlePostReply_subc} className="bg-primary text-white p-2 rounded mt-2">
                                                        Post Reply
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-gray-500">Select a comment to see subcomments</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>
            <MobileNavigation activeTab="forum" />
        </div>
}
