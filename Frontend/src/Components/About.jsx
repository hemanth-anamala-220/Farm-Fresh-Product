import React from "react";
import "../Styles/About.css";
import { Leaf, Users, Target, Heart, Award, Truck } from "lucide-react";

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="icon-wrapper">
          <Leaf className="hero-icon" />
        </div>
        <h1>About Farm Fresh Products</h1>
        <p>
          Connecting local farmers directly with customers to promote organic
          and fresh produce, fostering a sustainable food ecosystem for everyone.
        </p>
      </section>

      {/* Mission & Vision Section */}
      <section className="mission-vision">
        <div className="card">
          <Target className="card-icon" />
          <h2>Our Mission</h2>
          <p>
            To empower local farmers by providing them with a direct platform to
            sell their fresh produce, eliminating middlemen and ensuring better
            prices for both farmers and customers.
          </p>
        </div>

        <div className="card">
          <Heart className="card-icon" />
          <h2>Our Vision</h2>
          <p>
            To create a sustainable food ecosystem where customers have access
            to fresh, organic, and locally grown produce while supporting the
            farming community.
          </p>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="features">
        <h2>Why Choose Farm Fresh Products?</h2>
        <div className="feature-grid">
          <div className="feature-item">
            <div className="feature-icon">
              <Leaf />
            </div>
            <h3>100% Fresh & Organic</h3>
            <p>
              All products are sourced directly from local farmers, ensuring
              maximum freshness and quality.
            </p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <Users />
            </div>
            <h3>Direct from Farmers</h3>
            <p>
              Connect directly with local farmers, supporting their livelihood
              and getting the best prices.
            </p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <Truck />
            </div>
            <h3>Fast Delivery</h3>
            <p>
              Quick and reliable delivery service to ensure your produce reaches
              you fresh and on time.
            </p>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="developer-card">
        <div className="dev-icon">
          <Award />
        </div>
        <h2>Developer</h2>
        <h3>Anamala Hemanth Kumar</h3>
        <p>
          Full Stack Developer passionate about creating solutions that connect
          communities and promote sustainable practices.
        </p>
        <a href="mailto:hemanthanamala110@gmail.com">
          📧 hemanthanamala110@gmail.com
        </a>
      </section>

      {/* Tech Stack Section */}
      <section className="tech-stack">
        <h2>Built with Modern Technology</h2>
        <div className="tech-grid">
          <div className="tech-item react">React.js</div>
          <div className="tech-item node">Node.js</div>
          <div className="tech-item mongo">MongoDB</div>
          <div className="tech-item icons">Lucide React</div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="cta">
        <h2>Join Our Community Today</h2>
        <p>
          Whether you're a farmer looking to sell your produce or a customer
          seeking fresh, organic products, we're here to connect you.
        </p>
        <div className="cta-buttons">
          <a href="/login" className="btn-primary">
            Get Started
          </a>
          <a href="/contact" className="btn-outline">
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
};

export default About;
