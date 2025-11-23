import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsAuthenticated, useForums } from '../../lib';
import { Layout } from '../../components';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { MessageSquare, Clock, Sparkles } from 'lucide-react';
import './forum.css';

function ForumPage() {
    const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
    const { data: forums = [], isLoading, error } = useForums();
    const navigate = useNavigate();
    const [clickedCard, setClickedCard] = useState<number | null>(null);

    const handleSearch = (searchTerm: string) => {
        console.log('Searching for:', searchTerm);
        // Implement search functionality here
    };

    const handleCardClick = (forumId: number) => {
        setClickedCard(forumId);
        
        // Add a small delay for the animation effect
        setTimeout(() => {
            navigate(`/forums/${forumId}`);
        }, 200);
    };


    const handleCardMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
        const card = event.currentTarget;
        card.style.transform = 'translateY(-8px) scale(1.02)';
    };

    const handleCardMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
        const card = event.currentTarget;
        if (!clickedCard) {
            card.style.transform = 'translateY(0) scale(1)';
        }
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
    if (isLoading) {
        return (
            <Layout onSearch={handleSearch}>
                <div className="forum-content">
                    <div className="forum-loading">Loading forums...</div>
                </div>
            </Layout>
        );
    }

    // Show error state
    if (error) {
        return (
            <Layout onSearch={handleSearch}>
                <div className="forum-content">
                    <div className="forum-error">
                        <h2>Unable to load forums</h2>
                        <p>Please try refreshing the page or check your connection.</p>
                        <Button onClick={() => window.location.reload()} className="action-btn">
                            Refresh Page
                        </Button>
                    </div>
                </div>
            </Layout>
        );
    }

    // Show empty state if no forums
    if (forums.length === 0) {
        return (
            <Layout onSearch={handleSearch}>
                <div className="forum-content">
                    <div className="section-header">
                        <div className="header-content">
                            <div className="header-text">
                                <h1 className="page-title">Forums</h1>
                                <p className="page-subtitle">Join discussions, share experiences, and connect with others</p>
                            </div>
                        </div>
                    </div>
                    <div className="empty-state">
                        <p>No forums available at the moment.</p>
                        <Button onClick={() => window.location.reload()} className="action-btn">
                            Refresh
                        </Button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout onSearch={handleSearch}>
            <div className="forum-content">
                <div className="section-header">
                    <div className="header-content">
                        <div className="header-text">
                            <h1 className="page-title">Forums</h1>
                            <p className="page-subtitle">Join discussions, share experiences, and connect with others</p>
                        </div>
                    </div>
                </div>

                <div className="forums-grid">
                    {forums.map((forum, index) => (
                        <Card 
                            key={forum.id} 
                            className={`forum-card ${clickedCard === forum.id ? 'clicked' : ''}`}
                            onClick={() => handleCardClick(forum.id)}
                            onMouseEnter={handleCardMouseEnter}
                            onMouseLeave={handleCardMouseLeave}
                            style={{
                                animationDelay: `${index * 0.1}s`
                            }}
                        >
                            <CardHeader>
                                <CardTitle className="forum-card-title">
                                    <Sparkles className="title-icon" size={20} />
                                    {forum.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="forum-description">{forum.description}</p>
                                <div className="forum-stats">
                                    <div className="stat-item">
                                        <MessageSquare className="stat-icon" />
                                        <span>{forum.thread_count} Threads</span>
                                    </div>
                                    <div className="stat-item">
                                        <Clock className="stat-icon" />
                                        <span>Last active {new Date(forum.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </Layout>
    );
}

export default ForumPage;