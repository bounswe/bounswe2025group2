import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { X, MessageSquare, Type, FileText } from 'lucide-react';
import './individual-forum.css';

interface ThreadCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (threadData: { title: string; content: string }) => Promise<void>;
}

function ThreadCreateModal({ isOpen, onClose, onSubmit }: ThreadCreateModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

    const validateForm = () => {
        const newErrors: { title?: string; content?: string } = {};
        
        if (!title.trim()) {
            newErrors.title = 'Title is required';
        } else if (title.trim().length < 3) {
            newErrors.title = 'Title must be at least 3 characters long';
        } else if (title.trim().length > 200) {
            newErrors.title = 'Title must be less than 200 characters';
        }
        
        if (!content.trim()) {
            newErrors.content = 'Content is required';
        } else if (content.trim().length < 10) {
            newErrors.content = 'Content must be at least 10 characters long';
        } else if (content.trim().length > 5000) {
            newErrors.content = 'Content must be less than 5000 characters';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            await onSubmit({
                title: title.trim(),
                content: content.trim()
            });
            
            // Reset form
            setTitle('');
            setContent('');
            setErrors({});
        } catch (error) {
            console.error('Failed to create thread:', error);
            // Handle error (could show a toast or error message)
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setTitle('');
            setContent('');
            setErrors({});
            onClose();
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <Card className="thread-create-modal">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="close-btn-top-right"
                    >
                        <X size={16} />
                    </Button>
                    <CardHeader>
                        <CardTitle className="modal-title">
                            <div className="title-content">
                                <MessageSquare size={20} />
                                <span>Create New Thread</span>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="thread-form">
                            <div className="form-group">
                                <label htmlFor="thread-title" className="form-label">
                                    <Type size={16} />
                                    Thread Title
                                </label>
                                <input
                                    id="thread-title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter a descriptive title for your thread..."
                                    className={`form-input ${errors.title ? 'error' : ''}`}
                                    disabled={isSubmitting}
                                    maxLength={200}
                                />
                                {errors.title && (
                                    <span className="error-message">{errors.title}</span>
                                )}
                                <div className="char-count">
                                    {title.length}/200 characters
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="thread-content" className="form-label">
                                    <FileText size={16} />
                                    Thread Content
                                </label>
                                <textarea
                                    id="thread-content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Share your thoughts, ask questions, or start a discussion..."
                                    className={`form-textarea ${errors.content ? 'error' : ''}`}
                                    disabled={isSubmitting}
                                    rows={6}
                                    maxLength={5000}
                                />
                                {errors.content && (
                                    <span className="error-message">{errors.content}</span>
                                )}
                                <div className="char-count">
                                    {content.length}/5000 characters
                                </div>
                            </div>

                            <div className="form-actions">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    className="cancel-btn"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !title.trim() || !content.trim()}
                                    className="submit-btn"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="spinner" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <MessageSquare size={16} />
                                            Create Thread
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default ThreadCreateModal;