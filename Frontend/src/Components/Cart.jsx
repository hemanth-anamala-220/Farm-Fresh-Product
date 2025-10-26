import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import "../Styles/Cart.css";

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:5050";

  useEffect(() => {
    loadCart();
    // prefill contact info if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.name) setContactName(u.name);
        if (u.phone) setContactPhone(u.phone);
      } catch (e) {}
    }
  }, []);

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(cart);
  };

  const updateQuantity = (productId, newQuantity) => {
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart = cart
      .map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
      .filter((item) => item.quantity > 0);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
  };

  const removeItem = (productId) => {
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart = cart.filter((item) => item.id !== productId);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
    toast.success("Item removed from cart");
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    if (!deliveryAddress.trim()) {
      toast.error("Please enter delivery address");
      return;
    }
    if (!contactName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!contactPhone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    // Build order payload and send to backend
    (async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          toast.error('Please login to place an order');
          navigate('/login');
          return;
        }
        const user = JSON.parse(storedUser);
        if (user.role !== 'customer') {
          toast.error('Only customers can place orders');
          return;
        }
        const buyerId = user.id || user._id;
        const items = cartItems.map(ci => ({ productId: ci._id || ci.id, quantity: ci.quantity }));
        const totalPrice = calculateTotal() + 20; // include delivery fee

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/products/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ items, buyerId, totalPrice, paymentMethod, deliveryAddress, contactName, contactPhone })
        });

        const data = await res.json();
        if (!res.ok) {
          const msg = data?.message || 'Failed to place order';
          toast.error(msg);
          return;
        }

        localStorage.removeItem("cart");
        setCartItems([]);
        setShowCheckout(false);
        toast.success(`Order placed successfully! Order ID: ${data.order._id}`);
        navigate("/");
      } catch (err) {
        console.error('Checkout error', err);
        toast.error('Checkout failed. Please try again.');
      }
    })();
  };

  const total = calculateTotal();

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* Header */}
        <div className="cart-header">
          <ShoppingCart className="cart-icon" />
          <h1>Shopping Cart</h1>
        </div>

        {/* Empty Cart */}
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <ShoppingCart className="empty-icon" />
            <h3>Your cart is empty</h3>
            <p>Browse products and add items to your cart.</p>
            <button className="continue-btn" onClick={() => navigate("/")}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="cart-grid">
            {/* Cart Items */}
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-img" />
                  <div className="cart-info">
                    <h3>{item.name}</h3>
                    <p>{item.farmer} • {item.location}</p>
                    <div className="price-info">
                      <span className="item-price">₹{item.price}/{item.unit}</span>
                      {item.organic && <span className="organic-badge">Organic</span>}
                    </div>
                  </div>
                  <div className="cart-quantity">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      <Minus className="icon" />
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus className="icon" />
                    </button>
                    <button onClick={() => removeItem(item.id)}>
                      <Trash2 className="icon remove-icon" />
                    </button>
                  </div>
                  <div className="cart-subtotal">
                    <span>Subtotal:</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="order-summary">
              <h2>Order Summary</h2>
              <div className="summary-details">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery Fee:</span>
                  <span>₹20.00</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total-row">
                  <span>Total:</span>
                  <span>₹{(total + 20).toFixed(2)}</span>
                </div>
              </div>
              <button className="checkout-btn" onClick={() => setShowCheckout(true)}>
                <CreditCard className="icon" /> Proceed to Checkout
              </button>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="checkout-modal">
            <div className="checkout-content">
              <h2>Checkout</h2>
              <form onSubmit={handleCheckout}>
                <div className="form-group">
                  <label htmlFor="address">Delivery Address *</label>
                  <textarea
                    id="address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your complete delivery address..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input id="name" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Recipient name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input id="phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Mobile number" required />
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <div className="payment-options">
                    <label>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      Cash on Delivery
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="payment"
                        value="upi"
                        checked={paymentMethod === "upi"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      UPI Payment
                    </label>
                  </div>
                </div>
                <div className="total-amount">
                  <span>Total Amount:</span>
                  <span>₹{(total + 20).toFixed(2)}</span>
                </div>
                <div className="form-actions">
                  <button type="submit" className="place-btn">Place Order</button>
                  <button type="button" className="cancel-btn" onClick={() => setShowCheckout(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
