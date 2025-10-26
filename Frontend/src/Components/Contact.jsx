import React, { useState } from 'react';
import '../Styles/Contact.css';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.message) {
      toast.error('Please fill in email and message fields');
      return;
    }

    try {
      await fetch(
        'https://script.google.com/macros/s/AKfycbx3dUmDZ9AhbbwN3F7yg8A77aSqUnG8M_TuQAMm9KL4LH6pgUIt1DA4p8pGs4983GyI/exec',
        {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="contact-page">
      <div className="container">
        {/* Header */}
        <div className="header-section">
          <h1>Contact Us</h1>
          <p>
            Have questions or need support? We'd love to hear from you.
            Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="contact-grid">
          {/* Contact Form */}
          <div className="form-card">
            <h2><Send className="icon" /> Send us a Message</h2>
            <form onSubmit={handleSubmit}>
              <label>Name (Optional)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your full name"
              />

              <label>Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
              />

              <label>Phone Number (Optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
              />

              <label>Message *</label>
              <textarea
                rows="5"
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="How can we help you?"
              ></textarea>

              <button type="submit" className="submit-btn">
                <Send className="icon" /> Send Message
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="info-section">
            <div className="info-card">
              <div className="info-item">
                <Mail className="info-icon" />
                <div>
                  <h3>Email</h3>
                  <p>hemanthanamala110@gmail.com</p>
                  <span>We'll respond within 24 hours</span>
                </div>
              </div>

              <div className="info-item">
                <Phone className="info-icon" />
                <div>
                  <h3>Phone</h3>
                  <p>+91 9440160982</p>
                  <span>Mon–Fri 9AM–6PM IST</span>
                </div>
              </div>

              <div className="info-item">
                <MapPin className="info-icon" />
                <div>
                  <h3>Location</h3>
                  <p>Nuzvid, Eluru, Vijayawada</p>
                  <span>Serving farmers across India</span>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="faq-card">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-item">
                <h4>How do I become a farmer on the platform?</h4>
                <p>
                  Simply sign up, select “Farmer” as your role, and start adding your products.
                </p>
              </div>
              <div className="faq-item">
                <h4>What payment methods do you accept?</h4>
                <p>We support Cash on Delivery and UPI payments.</p>
              </div>
              <div className="faq-item">
                <h4>How fresh are the products?</h4>
                <p>
                  Products come directly from farmers and are delivered within 24–48 hours of harvest.
                </p>
              </div>
              <div className="faq-item">
                <h4>Do you deliver to my area?</h4>
                <p>
                  We connect you with local farmers for fast, fresh delivery.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="support-section">
          <h2>Need Immediate Help?</h2>
          <p>
            For urgent issues or technical support, please don’t hesitate to reach out directly.
          </p>
          <div className="support-buttons">
            <a href="mailto:hemanthanamala110@gmail.com" className="email-btn">
              Email Support
            </a>
            <a href="tel:+91 8247535358" className="call-btn">
              Call Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
