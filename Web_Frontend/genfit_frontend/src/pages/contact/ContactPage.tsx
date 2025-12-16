import { Layout } from '../../components';
import './contact_page.css';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSearch = (searchTerm: string) => {
    console.log('Searching for:', searchTerm);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const res = await fetch(new URL('/api/contact/', base).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': (document.cookie.match(/csrftoken=([^;]+)/)?.[1]) || '',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      // First, get the response text to see what we're actually getting
      const responseText = await res.text();

      // Try to parse it as JSON, but handle the case where it's not JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Response is not JSON:', responseText);
        throw new Error('Server returned an unexpected response. Please try again.');
      }

      if (!res.ok) {
        throw new Error(data.message || data.detail || 'Failed to submit contact form');
      }

      setSubmitMessage(data.message || 'Thank you for your message! We will get back to you soon.');

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });

    } catch (error) {
      console.error('Submission error:', error);
      setSubmitMessage(error instanceof Error ? error.message : 'There was an error submitting your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Layout onSearch={handleSearch}>
      <div className="contact-content">
        <section className="contact-hero">
          <h1>Contact Us</h1>
          <p>Get in touch with our team</p>
        </section>

        <section className="contact-section">
          <div className="contact-card">
            <h2>Send us a Message</h2>

            {submitMessage && (
              <div className={`submit-message ${submitMessage.includes('Thank you') ? 'success' : 'error'}`}>
                {submitMessage}
              </div>
            )}

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  minLength={2}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  placeholder="What is this regarding?"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  minLength={5}
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  rows={6}
                  placeholder="Tell us how we can help you..."
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  minLength={10}
                ></textarea>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          <div className="contact-info">
            <h3>Other Ways to Reach Us</h3>
            <div className="info-item">
              <div className="info-icon">📧</div>
              <div className="info-content">
                <h4>Email</h4>
                <p>support@genfit.com</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">💬</div>
              <div className="info-content">
                <h4>Community Forum</h4>
                <p>Join discussions and get help from our community</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">🕒</div>
              <div className="info-content">
                <h4>Response Time</h4>
                <p>We typically respond within 24 hours</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}