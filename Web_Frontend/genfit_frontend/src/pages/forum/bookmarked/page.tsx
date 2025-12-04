import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsAuthenticated } from '../../../lib/hooks/useAuth';
import { useBookmarkedThreads } from '../../../lib/hooks/useData';
import Layout from '../../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, MessageSquare, Clock, BookmarkCheck } from 'lucide-react';
import '../forum.css';

const BookmarkedThreadsPage: React.FC = () => {
    const navigate = useNavigate();
    const isAuthenticated = useIsAuthenticated();
    const { data: threads, isLoading, error } = useBookmarkedThreads();

    if (!isAuthenticated) {
        navigate('/auth');
        return null;
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <Layout>
            <div className="forum-content">
                <div className="section-header">
                    <div className="header-content">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/forums')}
                            className="back-button mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Forums
                        </Button>
                        <div className="header-text">
                            <h1 className="page-title flex items-center gap-2">
                                <BookmarkCheck className="w-8 h-8" />
                                Bookmarked Threads
                            </h1>
                            <p className="page-subtitle">Your saved discussions</p>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="forum-loading">Loading bookmarks...</div>
                ) : error ? (
                    <div className="forum-error">
                        <h2>Unable to load bookmarks</h2>
                        <p>Please try again later.</p>
                    </div>
                ) : threads && threads.length > 0 ? (
                    <div className="forums-grid">
                        {threads.map((thread) => (
                            <Card
                                key={thread.id}
                                className="forum-card cursor-pointer hover:shadow-lg transition-all"
                                onClick={() => navigate(`/forums/thread/${thread.id}`)}
                            >
                                <CardHeader>
                                    <CardTitle className="forum-card-title text-lg">
                                        {thread.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{thread.content}</p>
                                    <div className="forum-stats">
                                        <div className="stat-item">
                                            <MessageSquare className="stat-icon" />
                                            <span>{thread.comment_count} Comments</span>
                                        </div>
                                        <div className="stat-item">
                                            <Clock className="stat-icon" />
                                            <span>{formatDate(thread.created_at)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <BookmarkCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-600">No bookmarked threads yet</p>
                        <p className="text-gray-500 mb-6">Save interesting discussions to find them here later.</p>
                        <Button onClick={() => navigate('/forums')} className="action-btn">
                            Browse Forums
                        </Button>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default BookmarkedThreadsPage;
