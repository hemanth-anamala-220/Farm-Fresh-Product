import React, { useEffect, useState } from "react";
import { Menu, X, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "../Styles/Header.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        setUser(null);
      }
    } else setUser(null);
    // listen for auth changes from other parts of the app
    const onAuthChanged = () => {
      const s = localStorage.getItem("user");
      if (s) {
        try { setUser(JSON.parse(s)); } catch (e) { setUser(null); }
      } else setUser(null);
    };
    window.addEventListener('authChanged', onAuthChanged);
    window.addEventListener('storage', onAuthChanged); // covers cross-tab logouts/logins
    return () => {
      window.removeEventListener('authChanged', onAuthChanged);
      window.removeEventListener('storage', onAuthChanged);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    // notify other components
    window.dispatchEvent(new Event('authChanged'));
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <span className="logo-icon">🌿</span>
          <h2>Farm Fresh Products</h2>
        </div>

        <nav className={`nav ${menuOpen ? "open" : ""}`}>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>

          {user ? (
            <>
              <span className="header-user">Hi, {user.name || (user.email && user.email.split('@')[0])}</span>
              <button className="login-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <Link to="/login"><button className="login-btn">Login</button></Link>
          )}
        </nav>

        <div className="mobile-icons">
          <ShoppingCart className="cart-icon" />
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
