// src/Pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Leaf, ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import "../Styles/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
    phone: "",
    location: "",
  });
  const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:5050";

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      console.log('Attempting login with:', { email: loginData.email, password: loginData.password });
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginData.email, password: loginData.password }),
      });
      console.log('Server response status:', res.status);

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Login failed");
        return;
      }

  // Save token and user info
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem("role", data.user.role);
  try { import('axios').then(ax => { ax.default.defaults.headers.common['Authorization'] = `Bearer ${data.token}`; }); } catch(e){/* ignore */}

      toast.success(`Welcome back, ${data.user.name || data.user.email.split("@")[0]}!`);

  if (data.user.role === "farmer") navigate("/farmer-Dashboard");
  else navigate("/dashboard");
      // notify other components (Header, etc.) about auth change
      window.dispatchEvent(new Event('authChanged'));
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Connection error. Please try again.");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (
      !signupData.name ||
      !signupData.email ||
      !signupData.password ||
      !signupData.role ||
      !signupData.location
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Signup failed");
        return;
      }

      // Auto-login after successful registration
      const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signupData.email, password: signupData.password }),
      });

      const loginDataResp = await loginRes.json();

      if (!loginRes.ok) {
        toast.success(`Account created. Please login.`);
        navigate("/login");
        return;
      }

  localStorage.setItem("token", loginDataResp.token);
  localStorage.setItem("user", JSON.stringify(loginDataResp.user));
  localStorage.setItem("role", loginDataResp.user.role);
  try { import('axios').then(ax => { ax.default.defaults.headers.common['Authorization'] = `Bearer ${loginDataResp.token}`; }); } catch(e){/* ignore */}

      toast.success(`Account created successfully! Welcome, ${signupData.name}!`);

  if (loginDataResp.user.role === "farmer") navigate("/farmer-Dashboard");
  else navigate("/dashboard");

    // notify other components (Header, etc.) about auth change
    window.dispatchEvent(new Event('authChanged'));

      setSignupData({
        name: "",
        email: "",
        password: "",
        role: "customer",
        phone: "",
        location: "",
      });
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Connection error. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <Link to="/" className="back-link">
          <ArrowLeft className="icon" />
          Back to Home
        </Link>

        <div className="brand-section">
          <Leaf className="brand-icon" />
          <h1>Farm Fresh Products</h1>
          <p>Join our community of farmers and customers</p>
        </div>

        <div className="tabs">
          <button
            className={tab === "login" ? "tab active" : "tab"}
            onClick={() => setTab("login")}
          >
            Login
          </button>
          <button
            className={tab === "signup" ? "tab active" : "tab"}
            onClick={() => setTab("signup")}
          >
            Sign Up
          </button>
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="form">
            <label>Email</label>
            <input
              type="email"
              value={loginData.email}
              onChange={(e) =>
                setLoginData({ ...loginData, email: e.target.value })
              }
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({ ...loginData, password: e.target.value })
              }
              required
            />

            <button type="submit" className="btn">
              Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="form">
            <label>Full Name *</label>
            <input
              value={signupData.name}
              onChange={(e) =>
                setSignupData({ ...signupData, name: e.target.value })
              }
              required
            />

            <label>Email *</label>
            <input
              type="email"
              value={signupData.email}
              onChange={(e) =>
                setSignupData({ ...signupData, email: e.target.value })
              }
              required
            />

            <label>Password *</label>
            <input
              type="password"
              value={signupData.password}
              onChange={(e) =>
                setSignupData({ ...signupData, password: e.target.value })
              }
              required
            />

            <label>Role *</label>
            <select
              value={signupData.role}
              onChange={(e) =>
                setSignupData({ ...signupData, role: e.target.value })
              }
              required
            >
              <option value="customer">Customer</option>
              <option value="farmer">Farmer</option>
            </select>

            <label>Location *</label>
            <input
              value={signupData.location}
              onChange={(e) =>
                setSignupData({ ...signupData, location: e.target.value })
              }
              required
            />

            <label>Phone Number</label>
            <input
              type="tel"
              value={signupData.phone}
              onChange={(e) =>
                setSignupData({ ...signupData, phone: e.target.value })
              }
            />

            <button type="submit" className="btn">
              Create Account
            </button>
          </form>
        )}

        <div className="demo-info">
          <p>Demo Accounts:</p>
          <p>Customer: customer@demo.com / password</p>
          <p>Farmer: farmer@demo.com / password</p>
        </div>
      </div>
    </div>
  );
}