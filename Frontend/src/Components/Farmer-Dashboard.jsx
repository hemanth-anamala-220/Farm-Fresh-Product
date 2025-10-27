import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Leaf, Plus, Edit, EyeOff } from "lucide-react";
import "../Styles/Farmer-Dashboard.css";

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", stock: "", description: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ type: null, src: "" });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      const userId = parsed.id || parsed._id;
      fetchProducts(userId);
      fetchOrders(userId);
    }
  }, [navigate]);

  const fetchProducts = async (farmerId) => {
    try {
      const res = await axios.get(`https://farm-fresh-product-backend-txzb.onrender.com/api/products/farmer/${farmerId}`);
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  const fetchOrders = async (sellerId) => {
    try {
      // sellerId can be farmer or retailer who created products (we store owner id in farmerId)
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`https://farm-fresh-product-backend-txzb.onrender.com/api/orders/farmer/${sellerId}`, { headers });
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to fetch orders for seller', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await axios.patch(`https://farm-fresh-product-backend-txzb.onrender.com/api/orders/${orderId}`, { status: newStatus }, { headers });
      // update local state
      setOrders((prev) => prev.map(o => (o._id === orderId ? res.data : o)));
      alert('Order updated');
    } catch (err) {
      console.error('Failed to update order', err);
      alert('Failed to update order');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const farmerId = user?.id || user?._id;
      const payload = {
        ...newProduct,
        imageUrl: newProduct.imageUrl || "",
        videoUrl: newProduct.videoUrl || "",
        farmerId,
      };
      const res = await axios.post(`https://farm-fresh-product-backend-txzb.onrender.com/api/products`, payload);
      setProducts([...products, res.data]);
      setNewProduct({ name: "", price: "", stock: "", description: "" });
      alert("Product added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add product.");
    }
  };

  const openMediaModal = (type, src) => {
    setModalContent({ type, src });
    setModalOpen(true);
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();
      if (host.includes('youtube.com')) {
        const id = u.searchParams.get('v');
        if (!id) return url;
        const t = u.searchParams.get('t') || u.searchParams.get('start');
        let embed = `https://www.youtube.com/embed/${id}`;
        if (t) embed += `?start=${t.replace(/[^0-9]/g,'')}`;
        return embed;
      }
      if (host.includes('youtu.be')) {
        const id = u.pathname.replace(/^\//, '');
        return `https://www.youtube.com/embed/${id}`;
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  const handleToggleVisibility = async (productId, visible) => {
    try {
      const res = await axios.patch(`https://farm-fresh-product-backend-txzb.onrender.com/api/products/${productId}`, { visible: !visible });
      setProducts(products.map(p => (p._id === productId ? res.data : p)));
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (product) => {
    setEditProduct({ ...product });
    setEditModalOpen(true);
  };

  const closeEdit = () => {
    setEditProduct(null);
    setEditModalOpen(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const id = editProduct._id || editProduct.id;
      const payload = {
        name: editProduct.name,
        description: editProduct.description,
        price: Number(editProduct.price) || 0,
        stock: Number(editProduct.stock) || 0,
        imageUrl: editProduct.imageUrl || "",
        videoUrl: editProduct.videoUrl || "",
        visible: editProduct.visible,
      };
      const res = await axios.patch(`https://farm-fresh-product-backend-txzb.onrender.com/api/products/${id}`, payload);
      setProducts(products.map(p => (p._id === id ? res.data : p)));
      closeEdit();
      alert("Product updated");
    } catch (err) {
      console.error("Edit failed", err);
      alert("Failed to update product");
    }
  };

  return (
    <div className="farmer-dashboard-container">
      <aside className="sidebar">
        <div className="brand">
          <Leaf className="brand-icon" />
          <h2>Farm Fresh</h2>
        </div>
        <nav className="nav-links">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => localStorage.clear() && navigate("/login")}>Logout</button>
        </nav>
      </aside>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h1>Welcome, {user?.name}!</h1>
          <p>Your role: <span className="role-tag">{user?.role}</span></p>
        </div>

        <div className="add-product-card">
          <h2><Plus size={20} /> Add New Product</h2>
          <form onSubmit={handleAddProduct} className="form">
            <input
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Price per unit"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Stock Quantity"
              value={newProduct.stock}
              onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
              required
            />
            <textarea
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            />
            <input
              placeholder="Image URL (optional)"
              value={newProduct.imageUrl || ""}
              onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
            />
            <input
              placeholder="Video URL (YouTube or MP4) (optional)"
              value={newProduct.videoUrl || ""}
              onChange={(e) => setNewProduct({ ...newProduct, videoUrl: e.target.value })}
            />
            <button type="submit" className="btn">Add Product</button>
          </form>
        </div>

        <div className="products-section">
          <h2>My Products</h2>
          <div className="products-grid">
            {products.map((p) => (
              <div key={p._id} className="product-card">
                <h3>{p.name}</h3>
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    style={{ cursor: "pointer", maxHeight: 160, objectFit: "cover" }}
                    onClick={() => openMediaModal("image", p.imageUrl)}
                  />
                )}
                <p>{p.description}</p>
                {p.videoUrl && (
                  <div className="video-thumb" style={{ cursor: "pointer", display:'flex', alignItems:'center', gap:8 }} onClick={() => openMediaModal("video", p.videoUrl)}>
                    <div style={{ width:96, height:64, background:'#000', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6 }}>▶</div>
                    <small>Click to open video</small>
                  </div>
                )}
                <p>Price: ₹{p.price}</p>
                <p>Stock: {p.stock}</p>
                <p>Buyers: {p.buyersCount ?? (p.buyers ? p.buyers.length : 0)}</p>
                <div className="product-actions">
                  <button onClick={() => handleToggleVisibility(p._id, p.visible)}>
                    {p.visible ? <EyeOff size={18} /> : "Show"}
                  </button>
                  <button onClick={() => openEdit(p)}><Edit size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="orders-section">
          <h2>Orders for your products</h2>
          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <div className="orders-list">
              {orders.map((o) => (
                <div key={o._id} className="order-card">
                  <h4>Order: {o._id}</h4>
                  <p><strong>Customer:</strong> {o.customerId?.name || String(o.customerId)}</p>
                  {o.customerId?.phone && (
                    <p>
                      <strong>Phone:</strong> <a href={`tel:${o.customerId.phone}`}>{o.customerId.phone}</a>
                    </p>
                  )}
                  {o.deliveryAddress && (
                    <p><strong>Address:</strong> {o.deliveryAddress}</p>
                  )}
                  <p><strong>Total:</strong> ₹{o.totalPrice}</p>
                  <p><strong>Status:</strong> {o.status}</p>
                  <div>
                    <strong>Items:</strong>
                    <ul>
                      {o.items.map((it, idx) => (
                        <li key={idx}>{it.productId?.name || it.productId} × {it.quantity}</li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {o.status !== 'delivered' && (
                      <button onClick={() => handleUpdateOrderStatus(o._id, 'delivered')} className="btn">Mark Delivered</button>
                    )}
                    {o.customerId?.phone && (
                      <a className="btn" href={`tel:${o.customerId.phone}`}>Call Customer</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {modalOpen && (
        <div className="media-modal" onClick={() => setModalOpen(false)} style={{ position: "fixed", top:0, left:0, right:0, bottom:0, background: "rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }}>
          <div onClick={(e)=>e.stopPropagation()} style={{ background:'#fff', padding:16, borderRadius:8, maxWidth:'90%', maxHeight:'90%', overflow:'auto' }}>
            <button onClick={() => setModalOpen(false)} style={{ float:'right' }}>Close</button>
            {modalContent.type === 'image' && <img src={modalContent.src} alt="media" style={{ maxWidth:'100%', maxHeight:'80vh' }} />}
            {modalContent.type === 'video' && (
              (() => {
                const src = modalContent.src || '';
                const embed = getVideoEmbedUrl(src);
                const isYouTube = embed.includes('youtube.com/embed');
                if (isYouTube) {
                  return (
                    <iframe
                      title="video"
                      src={embed}
                      width="800"
                      height="450"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  );
                }
                return <video src={src} controls style={{ maxWidth:'100%', maxHeight:'80vh' }} />;
              })()
            )}
          </div>
        </div>
      )}
      {editModalOpen && editProduct && (
        <div className="edit-modal" onClick={closeEdit} style={{ position: "fixed", top:0, left:0, right:0, bottom:0, background: "rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }}>
          <div onClick={(e)=>e.stopPropagation()} style={{ background:'#fff', padding:20, borderRadius:8, width:520, maxHeight:'90vh', overflow:'auto' }}>
            <h3>Edit product</h3>
            <form onSubmit={handleEditSubmit}>
              <input required value={editProduct.name} onChange={(e)=>setEditProduct({...editProduct, name:e.target.value})} />
              <input type="number" required value={editProduct.price} onChange={(e)=>setEditProduct({...editProduct, price:e.target.value})} />
              <input type="number" value={editProduct.stock} onChange={(e)=>setEditProduct({...editProduct, stock:e.target.value})} />
              <input value={editProduct.imageUrl || ""} placeholder="Image URL" onChange={(e)=>setEditProduct({...editProduct, imageUrl:e.target.value})} />
              <input value={editProduct.videoUrl || ""} placeholder="Video URL" onChange={(e)=>setEditProduct({...editProduct, videoUrl:e.target.value})} />
              <textarea value={editProduct.description || ""} onChange={(e)=>setEditProduct({...editProduct, description:e.target.value})} />
              <div style={{marginTop:8}}>
                <label><input type="checkbox" checked={!!editProduct.visible} onChange={(e)=>setEditProduct({...editProduct, visible:e.target.checked})} /> Visible</label>
              </div>
              <div style={{ marginTop:12, display:'flex', gap:8 }}>
                <button type="submit" className="btn">Save</button>
                <button type="button" onClick={closeEdit}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </main>
    </div>
  );
};

export default FarmerDashboard;
