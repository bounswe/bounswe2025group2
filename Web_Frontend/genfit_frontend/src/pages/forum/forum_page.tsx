import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsAuthenticated, useForums } from '../../lib';
import { Layout } from '../../components';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { MessageSquare, Users, Clock } from 'lucide-react';

export default function ForumPage() {
    const { isAuthenticated } = useIsAuthenticated();
    const { data: forums, isLoading, error } = useForums();
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <Layout>
                <div className="forum-page-loading">
                    Loading forums...
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="forum-page-error">
                    Error loading forums. Please try again.
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="forum-page-content">
                <div className="section-header">
                    <div className="header-content">
                        <div className="header-text">
                            <h1 className="page-title">Forums</h1>
                            <p className="page-subtitle">Join discussions, share experiences, and connect with others</p>
                        </div>
                    </div>
                </div>

                <div className="forums-grid">
                    {forums?.map((forum) => (
                        <Card 
                            key={forum.id} 
                            className="forum-card"
                            onClick={() => navigate(`/forums/${forum.id}`)}
                        >
                            <CardHeader>
                                <CardTitle>{forum.title}</CardTitle>
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