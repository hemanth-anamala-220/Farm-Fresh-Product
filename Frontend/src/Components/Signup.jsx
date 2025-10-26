import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, MapPin, Phone, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import '../Styles/Auth.css';

const Signup = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		phone: '',
		role: 'customer',
		location: ''
	});
	const [loading, setLoading] = useState(false);
	const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:5050';

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		// Client-side validation to match backend requirements
		if (
			!formData.name ||
			!formData.email ||
			!formData.password ||
			!formData.role ||
			!formData.location
		) {
			toast.error('Please fill all required fields (name, email, password, role, location)');
			setLoading(false);
			return;
		}

		// Helpful debug log to inspect payload in browser console
		console.log('Signup payload:', formData);

		try {
			const response = await fetch(`${API_BASE}/api/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const data = await response.json();

			// Log server response for easier debugging in devtools
			console.log('Signup response:', data, 'status:', response.status);

			if (response.ok) {
				toast.success('Account created successfully!');
				navigate('/login');
			} else {
				toast.error(data.message || 'Signup failed');
			}
		} catch (error) {
			console.error('Signup error:', error);
			toast.error('Connection error. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-page">
			<div className="auth-container">
				<div className="auth-card signup-card">
					<div className="auth-header">
						<Leaf className="auth-icon" />
						<h1>Create Account</h1>
						<p>Join Farm Fresh Products Marketplace</p>
					</div>

					<form onSubmit={handleSubmit} className="auth-form">
						<div className="form-group">
							<label>
								<User size={18} />
								Full Name
							</label>
							<input
								type="text"
								required
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								placeholder="Enter your full name"
							/>
						</div>

						<div className="form-group">
							<label>
								<Mail size={18} />
								Email Address
							</label>
							<input
								type="email"
								required
								value={formData.email}
								onChange={(e) => setFormData({ ...formData, email: e.target.value })}
								placeholder="your.email@example.com"
							/>
						</div>

						<div className="form-group">
							<label>
								<Phone size={18} />
								Phone Number
							</label>
							<input
								type="tel"
								value={formData.phone}
								onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
								placeholder="+91 9876543210"
							/>
						</div>

						<div className="form-group">
							<label>
								<MapPin size={18} />
								Location
							</label>
							<input
								type="text"
								required
								value={formData.location}
								onChange={(e) => setFormData({ ...formData, location: e.target.value })}
								placeholder="City, State"
							/>
						</div>

						<div className="form-group">
							<label>
								<Lock size={18} />
								Password
							</label>
							<input
								type="password"
								required
								value={formData.password}
								onChange={(e) => setFormData({ ...formData, password: e.target.value })}
								placeholder="Minimum 6 characters"
								minLength="6"
							/>
						</div>

						<div className="form-group">
							<label>Account Type</label>
							<div className="role-selector">
								<label className={`role-option ${formData.role === 'customer' ? 'active' : ''}`}>
									<input
										type="radio"
										value="customer"
										checked={formData.role === 'customer'}
										onChange={(e) => setFormData({ ...formData, role: e.target.value })}
									/>
									<span>Customer</span>
									<small>Buy fresh produce</small>
								</label>
								<label className={`role-option ${formData.role === 'farmer' ? 'active' : ''}`}>
									<input
										type="radio"
										value="farmer"
										checked={formData.role === 'farmer'}
										onChange={(e) => setFormData({ ...formData, role: e.target.value })}
									/>
									<span>Farmer</span>
									<small>Sell your products</small>
								</label>
							</div>
						</div>

						<button type="submit" className="auth-btn" disabled={loading}>
							<UserPlus size={18} />
							{loading ? 'Creating Account...' : 'Create Account'}
						</button>
					</form>

					<div className="auth-footer">
						<p>Already have an account? <Link to="/login">Login here</Link></p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Signup;