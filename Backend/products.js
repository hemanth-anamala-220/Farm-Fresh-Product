import express from "express";
import Product from "./models/Product.js";
import mongoose from "mongoose";
import auth from "./middleware/auth.js";
import Order from "./models/Order.js";

const router = express.Router();

// Create product (protected)
router.post("/", auth, async (req, res) => {
  try {
    const { name, description, price, unit, stock, imageUrl, videoUrl } = req.body;
    // owner is taken from authenticated user to prevent spoofing
    const farmerId = req.user?.id;
    if (!name || !price || !farmerId) return res.status(400).json({ message: "name, price and farmerId are required" });
    const product = new Product({ name, description, price, unit, stock, imageUrl, videoUrl, farmerId });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all products (only visible)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ visible: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get products by farmer
router.get("/farmer/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid farmer id" });
    const products = await Product.find({ farmerId: id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update product (partial)
router.patch("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid product id" });
    const updates = req.body;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    // only the owner (seller) or admin can update the product
    if (String(product.farmerId) !== String(req.user?.id) && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    Object.assign(product, updates);
    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Place an order (protected) - accepts multiple items
router.post("/order", auth, async (req, res) => {
  try {
    const { items, buyerId, totalPrice, paymentMethod, deliveryAddress, contactName, contactPhone } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "items required" });
    if (!buyerId) return res.status(400).json({ message: "buyerId required" });

    // Process each product: decrement stock, increment buyers
    const session = await Product.startSession();
    session.startTransaction();
    try {
      for (const it of items) {
        const { productId, quantity } = it;
        if (!mongoose.Types.ObjectId.isValid(productId)) throw new Error("Invalid product id");
        const product = await Product.findById(productId).session(session);
        if (!product) throw new Error(`Product ${productId} not found`);
        if (typeof quantity === 'number' && product.stock >= quantity) {
          product.stock = product.stock - quantity;
        }
        product.buyersCount = (product.buyersCount || 0) + 1;
        product.buyers = product.buyers || [];
        if (!product.buyers.includes(buyerId)) product.buyers.push(buyerId);
        await product.save({ session });
      }

      // Create Order document
  const order = new Order({ customerId: buyerId, items, totalPrice, paymentMethod, deliveryAddress, contactName, contactPhone, status: 'pending' });
      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.json({ message: 'Order placed', order });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    console.error('Order error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
