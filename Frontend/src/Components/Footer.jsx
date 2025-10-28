import React from "react";
import { Link } from "react-router-dom";
import { 
  Leaf, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  Heart
} from "lucide-react";
import "../Styles/Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Company Info Section */}
        <div className="footer-section">
          <div className="footer-brand">
            <Leaf className="footer-brand-icon" />
            <h3>Farm Fresh Products</h3>
          </div>
          <p className="footer-description">
            Connecting farmers directly with consumers. Fresh, organic, and locally sourced products delivered to your doorstep.
          </p>
          <div className="footer-social">
            <a href="#" className="social-link" aria-label="Facebook">
              <Facebook size={20} />
            </a>
            <a href="#" className="social-link" aria-label="Twitter">
              <Twitter size={20} />
            </a>
            <a href="https://www.instagram.com/hemanth_naidus__123/" className="social-link" aria-label="Instagram">
              <Instagram size={20} />
            </a>
            <a href="https://www.linkedin.com/in/hemanth-anamala-594723237" className="social-link" aria-label="LinkedIn">
              <Linkedin size={20} />
            </a>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="footer-section">
          <h4 className="footer-heading">Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/dashboard?tab=products">Products</Link></li>
            <li><Link to="/dashboard?tab=orders">Orders</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Categories Section */}
        <div className="footer-section">
          <h4 className="footer-heading">Categories</h4>
          <ul className="footer-links">
            <li><Link to="/dashboard?tab=products">Vegetables</Link></li>
            <li><Link to="/dashboard?tab=products">Fruits</Link></li>
            <li><Link to="/dashboard?tab=products">Grains</Link></li>
            <li><Link to="/dashboard?tab=products">Dairy Products</Link></li>
            <li><Link to="/dashboard?tab=products">Organic Products</Link></li>
          </ul>
        </div>

        {/* Contact Info Section */}
        <div className="footer-section">
          <h4 className="footer-heading">Contact Us</h4>
          <ul className="footer-contact">
            <li>
              <MapPin size={18} />
              <span>Vijayawada, Eluru, Nuzvid, Andhra Pradesh, India</span>
            </li>
            <li>
              <Phone size={18} />
              <span>+91 8247535358</span>
            </li>
            <li>
              <Mail size={18} />
              <span>support@farmfresh.com</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="footer-copyright">
            &copy; {currentYear} Farm Fresh Products. All rights reserved.
          </p>
          <p className="footer-credits">
            Made with <Heart size={14} className="heart-icon" /> for Farmers and Consumers
          </p>
          <div className="footer-legal">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="separator">|</span>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
