import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Leaf,
  User,
  Truck,
  Plus,
  Minus,
  Home,
  ShoppingBag,
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
  const [activeTab, setActiveTab] = useState("products");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const API_BASE = import.meta?.env?.VITE_API_URL || "https://farm-fresh-product-backend-txzb.onrender.com";

  // Helper function to get consistent product ID
  const getProductId = (item) => item._id || item.id;

  // Load user and cart on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } catch (e) {
      setUser(null);
    }

    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error("Error parsing cart:", err);
        localStorage.removeItem("cart");
      }
    }

    const onAuthChanged = () => {
      const s = localStorage.getItem("user");
      if (s) {
        try { setUser(JSON.parse(s)); } catch (e) { setUser(null); }
      } else setUser(null);
    };
    window.addEventListener('authChanged', onAuthChanged);
    window.addEventListener('storage', onAuthChanged);
    return () => {
      window.removeEventListener('authChanged', onAuthChanged);
      window.removeEventListener('storage', onAuthChanged);
    };
  }, [navigate]);

  // Fetch products
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to load products");
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchProducts();
      setLoading(false);
    };
    loadData();
  }, [API_BASE]);
  // Fetch orders for the current user
  const fetchOrders = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.warning("Please login again to view orders");
        return;
      }

      const userId = String(user._id || user.id);
      const endpoint = `${API_BASE}/api/orders/customer/${userId}`;
      console.log("Fetching orders from:", endpoint);

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);

      const data = await res.json();
      const ordersData = Array.isArray(data) ? data : data.orders || [];

      const filtered = ordersData.filter(o => String(o.customerId || o.buyerId || o.buyer?._id || o.buyer) === userId);
      console.log("Orders loaded:", filtered.length);
      setOrders(filtered);
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("Failed to load orders");
      setOrders([]);
    }
  };

  // Fetch orders when user is available and orders tab is active
  useEffect(() => {
    if (user && activeTab === "orders") fetchOrders();
  }, [user, activeTab]);

  // Add item to cart
  const addToCart = (product) => {
    if (!product) return;
    if (product.stock < 1) {
      toast.error("Product is out of stock");
      return;
    }

    const productId = getProductId(product);
    const existing = cart.find((item) => getProductId(item) === productId);

    if (existing && existing.quantity >= product.stock) {
      toast.error("Cannot add more than available stock");
      return;
    }

    const newCart = existing
      ? cart.map((item) =>
          getProductId(item) === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      : [
          ...cart,
          {
            _id: product._id,
            id: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            unit: product.unit,
            image: product.imageUrl,
            farmer: product.farmerName || "Farm Fresh",
            location: product.location || "Local",
            organic: product.organic || false,
          },
        ];

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    toast.success(`Added ${product.name} to cart`);
  };
  

  // Remove item from cart
  const removeFromCart = (productId) => {
    const newCart = cart.filter((item) => getProductId(item) !== productId);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    toast.info("Item removed from cart");
  };

  // Update quantity
  const updateQuantity = (productId, delta) => {
    const product = products.find(p => getProductId(p) === productId);
    
    const newCart = cart
      .map((item) => {
        if (getProductId(item) === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity < 1) return null;
          
          if (product && newQuantity > product.stock) {
            toast.error(`Only ${product.stock} items available in stock`);
            return item;
          }
          
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
      .filter(Boolean);

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  // Place Order Function - IMPROVED WITH BETTER BUYER ID HANDLING
  const placeOrder = async () => {
    console.log("=== PLACE ORDER STARTED ===");
    
    // Validate cart
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Validate user details
    if (!user.phone || !user.location) {
      toast.error("Please update your profile with phone and location");
      return;
    }

    setIsPlacingOrder(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login again");
        navigate("/login");
        return;
      }

      // Stock validation
      for (const item of cart) {
        const productId = getProductId(item);
        const product = products.find(p => getProductId(p) === productId);
        if (!product) {
          toast.error(`Product ${item.name} not found`);
          setIsPlacingOrder(false);
          return;
        }
        if (product.stock < item.quantity) {
          toast.error(`${item.name} has only ${product.stock} items in stock`);
          setIsPlacingOrder(false);
          return;
        }
      }

      // Prepare order data with explicit buyer ID
      const buyerId = String(user._id || user.id);
      console.log("Buyer ID for order:", buyerId);
      
      const items = cart.map(ci => {
        const productId = getProductId(ci);
        return { 
          productId: String(productId),
          quantity: ci.quantity,
          name: ci.name,
          price: ci.price,
          unit: ci.unit
        };
      });
      
      const totalPrice = cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ) + 20; // include delivery fee

      const orderData = {
        items,
        buyerId: buyerId, // Explicitly set buyer ID
        buyer: buyerId, // Also set as 'buyer' field for compatibility
        totalPrice,
        paymentMethod: "cod",
        deliveryAddress: user.location,
        contactName: user.name,
        contactPhone: user.phone,
        status: "pending"
      };

      console.log("=== ORDER DATA ===");
      console.log("Full order data:", JSON.stringify(orderData, null, 2));

      // Make API request
      const res = await fetch(`${API_BASE}/api/products/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();
      
      if (!res.ok) {
        console.error('Order error response:', data);
        const msg = data?.message || data?.error || 'Failed to place order';
        throw new Error(msg);
      }

      console.log("Order placed successfully:", data);
      toast.success(`Order placed successfully! Order ID: ${data.order._id}`);

      // Clear cart
      setCart([]);
      localStorage.removeItem("cart");

      // Switch to orders tab first
      setActiveTab("orders");

      // Small delay to ensure state update
      setTimeout(async () => {
        // Refresh orders to show the new order
        console.log("Refreshing orders list...");
        await fetchOrders();

        // Refresh products to update stock
        await fetchProducts();
      }, 500);

    } catch (err) {
      console.error("ORDER ERROR:", err);
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Sync tab from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam) setActiveTab(tabParam);
  }, []);

  if (!user) return null;
  if (loading) return <div className="loading">Loading...</div>;

  // Calculate cart total
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
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

        <nav className="nav-links">
          <button 
            onClick={() => setActiveTab("products")} 
            className={`nav-btn ${activeTab === "products" ? "active" : ""}`}
          >
            <ShoppingBag size={20} />
            <span>Browse Products</span>
          </button>
          <button 
            onClick={() => setActiveTab("orders")} 
            className={`nav-btn ${activeTab === "orders" ? "active" : ""}`}
          >
            <Truck size={20} />
            <span>My Orders</span>
          </button>
          {user.role === "farmer" && (
            <button 
              onClick={() => setActiveTab("myProducts")} 
              className={`nav-btn ${activeTab === "myProducts" ? "active" : ""}`}
            >
              <Leaf size={20} />
              <span>My Products</span>
            </button>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="welcome-card">
          <h1>Welcome, {user.name}!</h1>
          <p>
            Your role: <span className="role-tag">{user.role}</span>
          </p>
        </div>

        <div className="dashboard-content">
          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="products-and-cart">
              <div className="products-section">
                <h2>Available Products</h2>
                <div className="products-grid">
                  {products.map((product) => (
                    <div key={product._id} className="product-card">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="product-image"
                        />
                      )}
                      <h3>{product.name}</h3>
                      <p className="price">
                        ₹{product.price}/{product.unit}
                      </p>
                      <p className="stock-info">
                        {product.stock > 0 
                          ? `${product.stock} ${product.unit} available`
                          : "Out of stock"}
                      </p>
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
                <h2>Shopping Cart ({cart.length})</h2>
                {cart.length === 0 ? (
                  <p className="empty-cart">Your cart is empty</p>
                ) : (
                  <>
                    <div className="cart-items">
                      {cart.map((item) => {
                        const itemId = getProductId(item);
                        return (
                          <div key={itemId} className="cart-item">
                            <h4>{item.name}</h4>
                            <p className="item-price">₹{item.price} / {item.unit}</p>
                            <div className="quantity-controls">
                              <button
                                onClick={() => updateQuantity(itemId, -1)}
                                aria-label="Decrease quantity"
                              >
                                <Minus size={16} />
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(itemId, 1)}
                                aria-label="Increase quantity"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <p className="item-total">
                              Total: ₹{(item.price * item.quantity).toFixed(2)}
                            </p>
                            <button
                              onClick={() => removeFromCart(itemId)}
                              className="remove-btn"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="cart-total">
                      <div className="cart-breakdown">
                        <p>Subtotal: ₹{cartTotal.toFixed(2)}</p>
                        <p>Delivery Fee: ₹20.00</p>
                        <h3>Total: ₹{(cartTotal + 20).toFixed(2)}</h3>
                      </div>
                      <button 
                        onClick={placeOrder} 
                        className="checkout-btn"
                        disabled={isPlacingOrder}
                      >
                        {isPlacingOrder ? "Placing Order..." : "Place Order"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Orders Tab - IMPROVED WITH BETTER DISPLAY */}
          {activeTab === "orders" && (
            <div className="orders-dashboard">
              <div className="orders-header">
                <h2>My Orders</h2>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button 
                    onClick={fetchOrders} 
                    className="refresh-btn"
                    title="Refresh orders"
                  >
                    ↻ Refresh
                  </button>
                  <button 
                    onClick={() => {
                      console.log("=== DEBUG INFO ===");
                      console.log("User:", user);
                      console.log("User ID:", user._id || user.id);
                      console.log("Orders:", orders);
                      console.log("API Base:", API_BASE);
                    }} 
                    className="refresh-btn"
                    title="Debug Info"
                  >
                    Debug
                  </button>
                </div>
              </div>
              <div className="orders-list">
                {orders.length === 0 ? (
                  <div className="no-orders">
                    <p>No orders yet. Start shopping!</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order._id} className="order-card">
                      <div className="order-header">
                        <h3>Order #{order._id.slice(-6)}</h3>
                        <span className={`status status-${order.status}`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="order-customer-info">
                        <h4>Customer Information</h4>
                        <p><strong>Name:</strong> {order.contactName}</p>
                        <p><strong>Phone:</strong> {order.contactPhone}</p>
                        <p><strong>Delivery Address:</strong> {order.deliveryAddress}</p>
                      </div>

                      <div className="order-items">
                        <h4>Ordered Products</h4>
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <div key={idx} className="order-item">
                              <div className="item-details-grid">
                                <div className="item-main-info">
                                  <h5 className="item-name">
                                    {item.name || item.productId?.name || "Product"}
                                  </h5>
                                  <p className="item-quantity">
                                    Quantity: {item.quantity} {item.unit}
                                  </p>
                                </div>
                                <div className="item-price-info">
                                  <p className="item-unit-price">
                                    Price: ₹{item.price || 0}/{item.unit}
                                  </p>
                                  <p className="item-total-price">
                                    Total: ₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="no-items">No items in this order</p>
                        )}
                      </div>

                      <div className="order-summary">
                        <div className="order-totals">
                          <div className="price-breakdown">
                            <p><strong>Subtotal:</strong> ₹{((order.totalPrice || 0) - 20).toFixed(2)}</p>
                            <p><strong>Delivery Fee:</strong> ₹20.00</p>
                            <h4><strong>Total Amount:</strong> ₹{(order.totalPrice || 0).toFixed(2)}</h4>
                          </div>
                          <p className="payment-method">
                            <strong>Payment Method:</strong> {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod?.toUpperCase()}
                          </p>
                        </div>
                        
                        <div className="order-meta">
                          <p className="order-date">
                            <strong>Ordered on:</strong> {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="order-status">
                            <strong>Status:</strong> {order.status?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Farmer Products Tab */}
          {activeTab === "myProducts" && user.role === "farmer" && (
            <div className="farmer-dashboard">
              <h2>My Products</h2>
              <div className="farmer-products-list">
                {products
                  .filter(p => p.farmerId === user._id || p.farmerId === user.id)
                  .map(product => (
                    <div key={product._id} className="farmer-product-card">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.name} />
                      )}
                      <h3>{product.name}</h3>
                      <p>Price: ₹{product.price}/{product.unit}</p>
                      <p>Stock: {product.stock} {product.unit}</p>
                      <p className="description">{product.description}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
