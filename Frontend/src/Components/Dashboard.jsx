import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Leaf, 
  User, 
  ShoppingCart, 
  Truck, 
  Plus, 
  Minus, 
  Home, 
  Info, 
  Mail, 
  Search,
  SlidersHorizontal,
  ShoppingBag 
} from "lucide-react";
import { toast } from "sonner";
import "../Styles/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [activeTab, setActiveTab] = useState("products");
  const [showCart, setShowCart] = useState(false);
  // Removed duplicate state declarations
  const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:5050";

  useEffect(() => {
    // Get user from localStorage (set after login)
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login"); // Redirect if not logged in
    } else {
      setUser(JSON.parse(storedUser));
      // Load cart from localStorage if exists
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    }
  }, [navigate]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/products`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    const fetchOrders = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/api/orders${user.role === "farmer" ? "/farmer" : ""}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to fetch orders");
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchProducts();
    fetchOrders();
  }, [user, API_BASE]);

  const addToCart = (product) => {
    let newCart;
    const existing = cart.find(item => item.productId === product._id);
    if (existing) {
      newCart = cart.map(item =>
        item.productId === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cart, {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 1
      }];
    }
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    toast.success(`Added ${product.name} to cart`);
  };

  const removeFromCart = (productId) => {
    const newCart = cart.filter(item => item.productId !== productId);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    toast.info("Item removed from cart");
  };

  const updateQuantity = (productId, delta) => {
    const newCart = cart.map(item => {
      if (item.productId === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity < 1) return null;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };
  // Removed misplaced JSX header block
  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          })),
          totalPrice: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
          paymentMethod: "cod", // Default to Cash on Delivery
          deliveryAddress: user.location,
          contactName: user.name,
          contactPhone: user.phone || ""
        })
      });

      if (!response.ok) throw new Error("Failed to place order");
      
      const orderData = await response.json();
      toast.success("Order placed successfully!");
      setCart([]);
      localStorage.removeItem("cart");
      
      // Refresh orders
      const ordersResponse = await fetch(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (ordersResponse.ok) {
        const newOrders = await ordersResponse.json();
        setOrders(newOrders);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    }
  };

  useEffect(() => {
    // Get tab from URL parameters
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  if (!user) return null;
  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="brand">
          <Leaf className="brand-icon" />
          <h2>Farm Fresh</h2>
        </div>

        <div className="user-profile">
          <div className="avatar">
            <User size={40} />
          </div>
          <div className="user-info">
            <h3>{user.name}</h3>
            <p className="user-email">{user.email}</p>
            <p className="user-role">{user.role}</p>
            {user.phone && <p className="user-phone">{user.phone}</p>}
            {user.location && <p className="user-location">{user.location}</p>}
          </div>
        </div>

        <nav className="nav-links horizontal">
          <div className="nav-group">
            <button onClick={() => navigate("/")}><Home size={20} /><span>Home</span></button>
            <button onClick={() => setActiveTab("products")}><ShoppingBag size={20} /><span>Browse Products</span></button>
            <button onClick={() => setActiveTab("orders")}><Truck size={20} /><span>Orders</span></button>
            {user.role === "farmer" && (
              <button onClick={() => setActiveTab("myProducts")}><Leaf size={20} /><span>My Products</span></button>
            )}
          </div>
        </nav>
      </aside>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h1>Welcome, {user.name}!</h1>
          <p>Your role: <span className="role-tag">{user.role}</span></p>
        </div>

        <div className="dashboard-content">
          {activeTab === "products" && (
            <div className="products-and-cart">
              <div className="products-section">
                <h2>Available Products</h2>
                <div className="products-grid">
                  {products.map(product => (
                    <div key={product._id} className="product-card">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.name} className="product-image" />
                      )}
                      <h3>{product.name}</h3>
                      <p className="price">₹{product.price}/{product.unit}</p>
                      <p className="description">{product.description}</p>
                      <button 
                        onClick={() => addToCart(product)}
                        disabled={product.stock < 1}
                        className="add-to-cart-btn"
                      >
                        {product.stock < 1 ? "Out of Stock" : "Add to Cart"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cart-section">
                <h2>Shopping Cart</h2>
                {cart.length === 0 ? (
                  <p>Your cart is empty</p>
                ) : (
                  <>
                    {cart.map(item => (
                      <div key={item.productId} className="cart-item">
                        <h4>{item.name}</h4>
                        <div className="quantity-controls">
                          <button onClick={() => updateQuantity(item.productId, -1)}><Minus size={16} /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, 1)}><Plus size={16} /></button>
                        </div>
                        <p>₹{item.price * item.quantity}</p>
                        <button onClick={() => removeFromCart(item.productId)} className="remove-btn">Remove</button>
                      </div>
                    ))}
                    <div className="cart-total">
                      <h3>Total: ₹{cart.reduce((total, item) => total + (item.price * item.quantity), 0)}</h3>
                      <button onClick={placeOrder} className="checkout-btn">Place Order</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="orders-dashboard">
              <h2>My Orders</h2>
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <h3>Order #{order._id.slice(-6)}</h3>
                      <span className={`status ${order.status}`}>{order.status}</span>
                    </div>
                    <div className="order-items">
                      {order.items.map(item => (
                        <div key={item.productId} className="order-item">
                          <p>{item.name}</p>
                          <p>Quantity: {item.quantity}</p>
                        </div>
                      ))}
                    </div>
                    <div className="order-footer">
                      <p>Total: ₹{order.totalPrice}</p>
                      <p>Contact: {order.contactName} ({order.contactPhone})</p>
                      <p>Address: {order.deliveryAddress}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "myProducts" && user.role === "farmer" && (
            <div className="farmer-dashboard">
              <h2>My Products</h2>
              {/* Farmer's products management UI can be added here */}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;