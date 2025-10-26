import express from 'express';
import Order from './models/Order.js';
import Product from './models/Product.js';
import mongoose from 'mongoose';
import auth from './middleware/auth.js';

const router = express.Router();

// Get orders for a customer
router.get('/customer/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    // Only allow the customer themselves or admins to view customer orders
    if (req.user.id !== id && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const orders = await Order.find({ customerId: id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get orders for a farmer (orders that include the farmer's products)
router.get('/farmer/:farmerId', auth, async (req, res) => {
  try {
    const { farmerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(farmerId)) return res.status(400).json({ message: 'Invalid id' });
    // Only allow the farmer/retailer who owns the products or admin to view related orders
    if (req.user.id !== farmerId && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const products = await Product.find({ farmerId }).select('_id');
    const ids = products.map(p => p._id);
    // populate customer info and product basic info for each item
    const orders = await Order.find({ 'items.productId': { $in: ids } })
      .sort({ createdAt: -1 })
      .populate('customerId', 'name phone location')
      .populate('items.productId', 'name farmerId price');

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status (farmer can mark orders for their products)
router.patch('/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ message: 'Invalid order id' });
    if (!status) return res.status(400).json({ message: 'status required' });

    const order = await Order.findById(orderId).populate('items.productId', 'farmerId');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // verify requester is allowed to update: must be admin or owner of at least one product in the order
    const requesterId = req.user.id;
    const ownsAny = order.items.some(it => String(it.productId?.farmerId) === String(requesterId));
    if (!ownsAny && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    order.status = status;
    await order.save();
    // populate customer info for response
    const populated = await Order.findById(orderId).populate('customerId', 'name phone location').populate('items.productId', 'name price farmerId');
    res.json(populated);
  } catch (err) {
    console.error('Order update error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
