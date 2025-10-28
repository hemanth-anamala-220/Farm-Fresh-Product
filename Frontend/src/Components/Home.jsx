import React, { useState, useEffect } from "react";
import { MapPin, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import "../Styles/Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ type: null, src: "" });

  const API_BASE = import.meta?.env?.VITE_API_URL || "https://farm-fresh-product-backend-txzb.onrender.com";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/products`);
        const data = await res.json();
        setProducts(data || []);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [API_BASE]);

  const getVideoEmbedUrl = (url) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();
      // YouTube watch URL
      if (host.includes('youtube.com')) {
        const id = u.searchParams.get('v');
        if (!id) return url;
        // handle start time t= or &t=
        const t = u.searchParams.get('t') || u.searchParams.get('start');
        let embed = `https://www.youtube.com/embed/${id}`;
        if (t) embed += `?start=${t.replace(/[^0-9]/g,'')}`;
        return embed;
      }
      // youtu.be short link
      if (host.includes('youtu.be')) {
        const id = u.pathname.replace(/^\//, '');
        return `https://www.youtube.com/embed/${id}`;
      }
      // already an embed or direct link
      return url;
    } catch (e) {
      return url;
    }
  };

  const filteredProducts = products.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleAddToCart = (product) => {
    // only customers can add to cart
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      toast.error('Please login as a customer to add items to cart');
      navigate('/login');
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.role !== 'customer') {
      toast.error('Only customers can add items to cart');
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const pid = product._id || product.id;
    const existing = cart.find((p) => (p._id || p.id) === pid);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    toast.success(`${product.name} added to cart!`);
    navigate("/cart");
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <h1>Farm Fresh Products</h1>
        <p>Connect directly with local farmers for the freshest organic produce.</p>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search for fruits, vegetables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* Product Section */}
      <section className="product-section">
        <h4>{filteredProducts.length} products available</h4>
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <div key={product._id || product.id} className="product-card">
              <img
                src={product.imageUrl || product.image || "/placeholder.png"}
                alt={product.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/placeholder.png";
                }}
                style={{ 
                  cursor: product.imageUrl || product.image ? "pointer" : "default",
                  objectFit: "cover",
                  width: "100%",
                  height: "200px"
                }}
                onClick={() => {
                  const src = product.imageUrl || product.image;
                  if (src) {
                    setModalContent({ type: "image", src });
                    setModalOpen(true);
                  }
                }}
              />
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              {product.videoUrl && (
                <div className="video-thumb" style={{ cursor: "pointer", display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => { setModalContent({ type: 'video', src: product.videoUrl }); setModalOpen(true); }}>
                  <div style={{ width: 96, height: 64, background: '#000', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6 }}>
                    ▶
                  </div>
                  <small>Click to open video</small>
                </div>
              )}
              <div className="product-info">
                <MapPin className="icon" />
                <span>{product.location} • {product.farmer}</span>
              </div>
              <span className="price">₹{product.price}/{product.unit}</span>
              <button
                className="add-cart-btn"
                onClick={() => handleAddToCart(product)}
              >
                <ShoppingCart className="icon" /> Add to Cart
              </button>
            </div>
          ))}
        </div>
      </section>

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
                // otherwise try native video playback (mp4/webm)
                return <video src={src} controls style={{ maxWidth:'100%', maxHeight:'80vh' }} />;
              })()
            )}
          </div>
        </div>
      )}

      {/* Farmer Join Section */}
      <section className="join-section">
        <h2>Are you a farmer?</h2>
        <p>
          Join our marketplace and sell your fresh produce directly to customers.
          No middlemen, better prices, and support for sustainable farming.
        </p>
        <button className="join-btn" onClick={() => navigate("/login")}>
          Join as Farmer
        </button>
      </section>
    </div>
  );
};

export default Home;
