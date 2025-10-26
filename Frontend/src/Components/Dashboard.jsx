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

  const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:5050";

  // ✅ Load user and cart on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error("Error parsing cart:", err);
        localStorage.removeItem("cart");
      }
    }
  }, [navigate]);

  // ✅ Fetch products and orders
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    const fetchOrders = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const endpoint =
          user.role === "farmer"
            ? `${API_BASE}/api/orders/farmer`
            : `${API_BASE}/api/orders`;

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };

    fetchProducts();
    if (user) {
      fetchOrders();
    }
  }, [user, API_BASE]);

  // ✅ Add item to cart
  const addToCart = (product) => {
    if (product.stock < 1) {
      toast.error("Product is out of stock");
      return;
    }

    const existing = cart.find((item) => item.productId === product._id);
    
    if (existing && existing.quantity >= product.stock) {
      toast.error("Cannot add more than available stock");
      return;
    }

    const newCart = existing
      ? cart.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      : [
          ...cart,
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            unit: product.unit,
          },
        ];

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    toast.success(`Added ${product.name} to cart`);
  };

  // ✅ Remove item
  const removeFromCart = (productId) => {
    const newCart = cart.filter((item) => item.productId !== productId);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    toast.info("Item removed from cart");
  };

  // ✅ Update quantity
  const updateQuantity = (productId, delta) => {
    const product = products.find(p => p._id === productId);
    
    const newCart = cart
      .map((item) => {
        if (item.productId === productId) {
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

  // ✅ Enhanced Place Order Function with Better Debugging
  const placeOrder = async () => {
    console.log("=== PLACE ORDER STARTED ===");
    
    // Check 1: Cart validation
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    console.log("✓ Cart has items:", cart);

    // Check 2: User details validation
    if (!user.phone || !user.location) {
      toast.error("Please update your profile with phone and location");
      console.error("Missing user details:", { phone: user.phone, location: user.location });
      return;
    }
    console.log("✓ User details valid");

    setIsPlacingOrder(true);

    try {
      // Check 3: Token validation
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login again");
        navigate("/login");
        return;
      }
      console.log("✓ Token exists");

      // Check 4: Stock validation
      for (const item of cart) {
        const product = products.find(p => p._id === item.productId);
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
      console.log("✓ Stock validation passed");

      // Prepare order data
      const totalPrice = cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      const orderData = {
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        totalPrice: totalPrice,
        paymentMethod: "cod",
        deliveryAddress: user.location,
        contactName: user.name,
        contactPhone: user.phone,
      };

      console.log("Order data prepared:", orderData);
      console.log("API URL:", `${API_BASE}/api/orders`);
      console.log("Token (first 20 chars):", token.substring(0, 20) + "...");

      // Make API request
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      console.log("Response received - Status:", res.status);
      console.log("Response headers:", Object.fromEntries(res.headers.entries()));

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      let responseData;

      if (contentType && contentType.includes("application/json")) {
        responseData = await res.json();
        console.log("Response data:", responseData);
      } else {
        const textResponse = await res.text();
        console.error("NON-JSON RESPONSE:", textResponse.substring(0, 500));
        
        // More specific error message
        if (res.status === 404) {
          throw new Error("API endpoint not found. Please check if your backend server is running and the /api/orders route exists.");
        } else if (res.status === 500) {
          throw new Error("Server error occurred. Check your backend logs.");
        } else {
          throw new Error(`Server returned HTML instead of JSON (Status: ${res.status}). Check if API endpoint exists.`);
        }
      }

      // Check if request was successful
      if (!res.ok) {
        throw new Error(responseData?.message || `Failed to place order (Status: ${res.status})`);
      }

      // Success!
      console.log("✓ Order placed successfully!");
      toast.success("Order placed successfully! 🎉");

      // Clear cart
      setCart([]);
      localStorage.removeItem("cart");

      // Refresh data
      await Promise.all([
        // Refresh orders
        fetch(`${API_BASE}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => data && setOrders(data))
          .catch(err => console.error("Error refreshing orders:", err)),
        
        // Refresh products
        fetch(`${API_BASE}/api/products`)
          .then(res => res.ok ? res.json() : null)
          .then(data => data && setProducts(data))
          .catch(err => console.error("Error refreshing products:", err))
      ]);

      // Switch to orders tab
      setActiveTab("orders");

    } catch (err) {
      console.error("=== ORDER PLACEMENT ERROR ===");
      console.error("Error:", err);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
      console.log("=== PLACE ORDER ENDED ===");
    }
  };

  // ✅ Sync tab from URL
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
          <button onClick={() => navigate("/")} className="nav-btn">
            <Home size={20} />
            <span>Home</span>
          </button>
          <button onClick={() => setActiveTab("products")} className="nav-btn">
            <ShoppingBag size={20} />
            <span>Browse Products</span>
          </button>
          <button onClick={() => setActiveTab("orders")} className="nav-btn">
            <Truck size={20} />
            <span>My Orders</span>
          </button>
          {user.role === "farmer" && (
            <button onClick={() => setActiveTab("myProducts")} className="nav-btn">
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
                      {cart.map((item) => (
                        <div key={item.productId} className="cart-item">
                          <h4>{item.name}</h4>
                          <p className="item-price">₹{item.price} / {item.unit}</p>
                          <div className="quantity-controls">
                            <button
                              onClick={() => updateQuantity(item.productId, -1)}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={16} />
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <p className="item-total">
                            Total: ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="remove-btn"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="cart-total">
                      <h3>Total: ₹{cartTotal.toFixed(2)}</h3>
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

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="orders-dashboard">
              <h2>My Orders</h2>
              <div className="orders-list">
                {orders.length === 0 ? (
                  <p className="no-orders">No orders yet. Start shopping!</p>
                ) : (
                  orders.map((order) => (
                    <div key={order._id} className="order-card">
                      <div className="order-header">
                        <h3>Order #{order._id.slice(-6)}</h3>
                        <span className={`status ${order.status}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="order-items">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="order-item">
                            <p className="item-name">{item.name}</p>
                            <p className="item-details">
                              Quantity: {item.quantity} × ₹{item.price} = ₹{(item.quantity * item.price).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="order-footer">
                        <p className="order-total">Total: ₹{order.totalPrice.toFixed(2)}</p>
                        <p className="order-contact">
                          Contact: {order.contactName} ({order.contactPhone})
                        </p>
                        <p className="order-address">Address: {order.deliveryAddress}</p>
                        <p className="order-date">
                          Ordered on: {new Date(order.createdAt).toLocaleDateString()}
                        </p>
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
              <p>Coming soon — manage your listed products here.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;