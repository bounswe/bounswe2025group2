import { Layout } from '../../components';
import './contact_page.css';

export default function ContactPage() {
  const handleSearch = (searchTerm: string) => {
    console.log('Searching for:', searchTerm);
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
            <form className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input 
                  type="text" 
                  id="name" 
                  placeholder="Enter your name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input 
                  type="text" 
                  id="subject" 
                  placeholder="What is this regarding?"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea 
                  id="message" 
                  rows={6}
                  placeholder="Tell us how we can help you..."
                ></textarea>
              </div>
              
              <button type="submit" className="submit-btn">
                Send Message
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