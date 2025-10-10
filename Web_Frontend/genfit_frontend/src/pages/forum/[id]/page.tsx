import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIsAuthenticated, useForumThreads, useForums } from '../../../lib';
import { Layout } from '../../../components';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { MessageSquare, User, Clock, Pin, Lock, Heart, Plus, ArrowLeft } from 'lucide-react';
import GFapi from '../../../lib/api/GFapi';
import type { ForumThread } from '../../../lib/types/api';
import ThreadCreateModal from './ThreadCreateModal';
import './individual-forum.css';

function IndividualForumPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
    const { data: forums = [] } = useForums();
    const { data: threads = [], isLoading: threadsLoading, error: threadsError, refetch } = useForumThreads(id ? parseInt(id) : undefined);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [clickedThread, setClickedThread] = useState<number | null>(null);

    // Find the current forum
    const currentForum = forums.find(forum => forum.id === parseInt(id || '0'));

    const handleSearch = (searchTerm: string) => {
        console.log('Searching threads for:', searchTerm);
        // Implement thread search functionality here
    };

    const handleThreadClick = (threadId: number) => {
        setClickedThread(threadId);
        
        // Add a small delay for the animation effect
        setTimeout(() => {
            navigate(`/threads/${threadId}`);
        }, 200);
    };

    const handleCreateThread = async (threadData: { title: string; content: string }) => {
        try {
            await GFapi.post('/api/threads/', {
                forum: parseInt(id || '0'),
                title: threadData.title,
                content: threadData.content,
                is_pinned: false,
                is_locked: false
            });
            
            // Refresh the threads list
            refetch();
            setIsCreateModalOpen(false);
        } catch (error) {
            console.error('Failed to create thread:', error);
            // Handle error (show toast, etc.)
        }
    };

    const handleBackToForums = () => {
        navigate('/forum');
    };

    // Redirect to auth if not authenticated
    if (authLoading) {
        return <div className="forum-loading">Loading...</div>;
    }

    if (!isAuthenticated) {
        navigate('/auth');
        return null;
    }

    // Show loading state
    if (threadsLoading) {
        return (
            <Layout onSearch={handleSearch}>
                <div className="individual-forum-content">
                    <div className="forum-loading">Loading threads...</div>
                </div>
            </Layout>
        );
    }

    // Show error state
    if (threadsError) {
        return (
            <Layout onSearch={handleSearch}>
                <div className="individual-forum-content">
                    <div className="forum-error">
                        <h2>Error Loading Threads</h2>
                        <p>Failed to load threads. Please try again.</p>
                        <Button onClick={() => refetch()} className="action-btn">
                            Retry
                        </Button>
                    </div>
                </div>
            </Layout>
        );
    }

    // Show empty state if no threads
    if (threads.length === 0) {
        return (
            <Layout onSearch={handleSearch}>
                <div className="individual-forum-content">
                    <div className="section-header">
                        <div className="header-content">
                            <div className="header-actions">
                                <Button 
                                    onClick={handleBackToForums}
                                    variant="outline"
                                    className="back-btn"
                                >
                                    <ArrowLeft size={16} />
                                    Back to Forums
                                </Button>
                            </div>
                            <div className="header-text">
                                <h1 className="page-title">{currentForum?.title || 'Forum'}</h1>
                                <p className="page-subtitle">{currentForum?.description || 'Forum discussions'}</p>
                            </div>
                            <div className="header-actions">
                                <Button 
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="action-btn"
                                >
                                    <Plus size={16} />
                                    New Thread
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="empty-state">
                        <MessageSquare size={48} className="empty-icon" />
                        <h3>No threads yet</h3>
                        <p>Be the first to start a discussion in this forum!</p>
                        <Button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="action-btn"
                        >
                            Create First Thread
                        </Button>
                    </div>
                </div>
                <ThreadCreateModal 
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSubmit={handleCreateThread}
                />
            </Layout>
        );
    }

    return (
        <Layout onSearch={handleSearch}>
            <div className="individual-forum-content">
                <div className="section-header">
                    <div className="header-content">
                        <div className="header-actions">
                            <Button 
                                onClick={handleBackToForums}
                                variant="outline"
                                className="back-btn"
                            >
                                <ArrowLeft size={16} />
                                Back to Forums
                            </Button>
                        </div>
                        <div className="header-text">
                            <h1 className="page-title">{currentForum?.title || 'Forum'}</h1>
                            <p className="page-subtitle">{currentForum?.description || 'Forum discussions'}</p>
                        </div>
                        <div className="header-actions">
                            <Button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="action-btn"
                            >
                                <Plus size={16} />
                                New Thread
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="threads-list">
                    {threads.map((thread, index) => (
                        <Card 
                            key={thread.id} 
                            className={`thread-card ${clickedThread === thread.id ? 'clicked' : ''}`}
                            onClick={() => handleThreadClick(thread.id)}
                            style={{
                                animationDelay: `${index * 0.1}s`
                            }}
                        >
                            <CardHeader>
                                <CardTitle className="thread-title">
                                    <div className="title-content">
                                        {thread.is_pinned && <Pin className="pin-icon" size={16} />}
                                        {thread.is_locked && <Lock className="lock-icon" size={16} />}
                                        <span className="title-text">{thread.title}</span>
                                    </div>
                                    <div className="thread-meta">
                                        <span className="author">
                                            <User size={14} />
                                            {thread.author}
                                        </span>
                                        <span className="date">
                                            <Clock size={14} />
                                            {new Date(thread.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="thread-content">{thread.content}</p>
                                <div className="thread-stats">
                                    <div className="stat-item">
                                        <Heart className="stat-icon" />
                                        <span>{thread.like_count} likes</span>
                                    </div>
                                    <div className="stat-item">
                                        <MessageSquare className="stat-icon" />
                                        <span>{thread.comment_count} replies</span>
                                    </div>
                                    <div className="stat-item last-activity">
                                        <Clock className="stat-icon" />
                                        <span>Last activity: {new Date(thread.last_activity).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
            <ThreadCreateModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateThread}
            />
        </Layout>
    );
}

export default IndividualForumPage;