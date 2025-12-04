import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIsAuthenticated } from '../../../../lib/hooks/useAuth';
import { useThread, useThreadComments, useUpdateThread, useBookmarkThread } from '../../../../lib/hooks/useData';
import Layout from '../../../../components/Layout';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import CommentItem from '../../components/CommentItem';
import ThreadActions from '../../components/ThreadActions';
import ThreadEditModal from '../../components/ThreadEditModal';
import CommentForm from '../../components/CommentForm';
import { ArrowLeft, MessageCircle, Calendar, User, Bookmark, BookmarkCheck } from 'lucide-react';
import './thread.css';

const ThreadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const threadId = id ? parseInt(id) : undefined;

  const { data: thread, isLoading: threadLoading, error: threadError } = useThread(threadId);
  const { data: comments, isLoading: commentsLoading, error: commentsError } = useThreadComments(threadId);
  const updateThreadMutation = useUpdateThread();
  const bookmarkThreadMutation = useBookmarkThread();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (threadLoading) {
    return (
      <Layout>
        <div className="thread-page">
          <div className="loading">Loading thread...</div>
        </div>
      </Layout>
    );
  }

  if (threadError || !thread) {
    return (
      <Layout>
        <div className="thread-page">
          <div className="error">Error loading thread. Please try again.</div>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUsernameClick = (username: string) => {
    navigate(`/profile/other/${username}`);
  }; // <-- ADDED MISSING CLOSING BRACE

  const handleEditThread = async (threadData: { title: string; content: string }) => {
    if (!threadId) return;

    try {
      await updateThreadMutation.mutateAsync({
        threadId,
        data: threadData
      });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update thread:', error);
      throw error;
    }
  };

  const handleBookmark = () => {
    if (!threadId) return;
    bookmarkThreadMutation.mutate(threadId);
  };

  return (
    <Layout>
      <div className="thread-page">
        <div className="thread-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleBookmark}
            disabled={bookmarkThreadMutation.isPending}
            className={thread.is_bookmarked ? "bg-primary/10 text-primary border-primary/50" : ""}
          >
            {thread.is_bookmarked ? (
              <>
                <BookmarkCheck className="w-4 h-4 mr-2" />
                Bookmarked
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 mr-2" />
                Bookmark
              </>
            )}
          </Button>
        </div>

        {/* Thread Details */}
        <Card className="thread-card">
          <div className="thread-content">
            <div className="thread-title-section">
              <h1 className="thread-title">{thread.title}</h1>
              <div className="thread-badges">
                {thread.is_pinned && <span className="badge pinned">Pinned</span>}
                {thread.is_locked && <span className="badge locked">Locked</span>}
              </div>
            </div>

            <div className="thread-meta">
              <div className="meta-item">
                <User className="w-4 h-4" />
                <span
                  onClick={() => handleUsernameClick(thread.author)}
                  className="clickable-username"
                >
                  {thread.author}
                </span>
              </div>
              <div className="meta-item">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(thread.created_at)}</span>
              </div>
              <div className="meta-item">
                <MessageCircle className="w-4 h-4" />
                <span>{thread.comment_count} comments</span>
              </div>
            </div>

            <div className="thread-body">
              <p>{thread.content}</p>
            </div>

            {/* Removed the duplicate <ThreadActions thread={thread} /> component */}

            <ThreadActions
              thread={thread}
              onEdit={() => setIsEditModalOpen(true)}
              onDelete={() => navigate(-1)}
            />
          </div>
        </Card>

        {/* Edit Thread Modal */}
        {thread && (
          <ThreadEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSubmit={handleEditThread}
            thread={thread}
          />
        )}

        {/* Comment Form */}
        <CommentForm threadId={threadId!} />

        {/* Comments Section */}
        <div className="comments-section">
          <h2 className="comments-title">
            Comments ({thread.comment_count})
          </h2>

          {commentsLoading ? (
            <div className="loading">Loading comments...</div>
          ) : commentsError ? (
            <div className="error">Error loading comments. Please try again.</div>
          ) : comments && comments.length > 0 ? (
            <div className="comments-list">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          ) : (
            <div className="no-comments">
              <MessageCircle className="w-8 h-8 text-gray-400" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ThreadPage;
