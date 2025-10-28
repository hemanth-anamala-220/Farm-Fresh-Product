import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import auth from '../middleware/auth.js';

const router = express.Router();

// CREATE ORDER - POST /
router.post('/', auth, async (req, res) => {
	try {
		const { items, totalPrice, paymentMethod, deliveryAddress, contactName, contactPhone } = req.body;

		// Validate required fields
		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ message: 'Items are required' });
		}
		if (totalPrice == null) {
			return res.status(400).json({ message: 'Total price is required' });
		}
		if (!deliveryAddress) {
			return res.status(400).json({ message: 'Delivery address is required' });
		}

		// Use authenticated user as the customer (do not trust client-sent buyerId)
		const customerId = req.user.id;
		if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

		// Start a transaction to ensure data consistency
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			// Validate and update stock for each item
			for (const item of items) {
				const { productId, quantity } = item;

				if (!mongoose.Types.ObjectId.isValid(productId)) {
					throw new Error(`Invalid product ID: ${productId}`);
				}

				const product = await Product.findById(productId).session(session);

				if (!product) {
					throw new Error(`Product not found: ${productId}`);
				}

				if (product.stock < quantity) {
					throw new Error(`Insufficient stock for ${product.name}. Only ${product.stock} available.`);
				}

				// Update stock
				product.stock -= quantity;

				// Update buyers count and list (avoid duplicates)
				product.buyersCount = (product.buyersCount || 0) + 1;
				product.buyers = product.buyers || [];
				const cidStr = String(customerId);
				if (!product.buyers.map(String).includes(cidStr)) {
					product.buyers.push(customerId);
				}

				await product.save({ session });
			}

			// Create the order
			const order = new Order({
				customerId,
				items,
				totalPrice,
				paymentMethod: paymentMethod || 'cod',
				deliveryAddress,
				contactName,
				contactPhone,
				status: 'pending'
			});

			await order.save({ session });

			// Commit the transaction
			await session.commitTransaction();
			session.endSession();

			// Populate the order with customer and product details
			const populatedOrder = await Order.findById(order._id)
				.populate('customerId', 'name email phone location')
				.populate('items.productId', 'name price unit farmerId');

			return res.status(201).json({
				message: 'Order placed successfully',
				order: populatedOrder
			});
		} catch (error) {
			// Rollback transaction on error
			await session.abortTransaction();
			session.endSession();
			throw error;
		}
	} catch (err) {
		console.error('Order creation error:', err);
		res.status(500).json({
			message: err.message || 'Failed to create order',
			error: err.message
		});
	}
});

// Get orders for the authenticated user
router.get('/', auth, async (req, res) => {
	try {
		const userId = req.user.id;
		const userRole = req.user.role;

		let orders;

		if (userRole === 'farmer' || userRole === 'retailer') {
			// For farmers/retailers, get orders containing their products
			const products = await Product.find({ farmerId: userId }).select('_id');
			const productIds = products.map(p => p._id);

			orders = await Order.find({ 'items.productId': { $in: productIds } })
				.sort({ createdAt: -1 })
				.populate('customerId', 'name phone location email')
				.populate('items.productId', 'name price unit farmerId');
		} else {
			// For customers, get their own orders
			orders = await Order.find({ customerId: userId })
				.sort({ createdAt: -1 })
				.populate('items.productId', 'name price unit farmerId');
		}

		res.json(orders);
	} catch (err) {
		console.error('Fetch orders error:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

// Get orders for a specific customer (admin or self only)
router.get('/customer/:id', auth, async (req, res) => {
	try {
		const { id } = req.params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ message: 'Invalid customer ID' });
		}

		// Only allow the customer themselves or admins to view customer orders
		if (String(req.user.id) !== String(id) && req.user.role !== 'admin') {
			return res.status(403).json({ message: 'Forbidden' });
		}

		const orders = await Order.find({ customerId: id })
			.sort({ createdAt: -1 })
			.populate('items.productId', 'name price unit');

		res.json(orders);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
});

// Get orders for a farmer (orders that include the farmer's products)
router.get('/farmer', auth, async (req, res) => {
	try {
		const farmerId = req.user.id;

		// Get all products by this farmer
		const products = await Product.find({ farmerId }).select('_id');
		const productIds = products.map(p => p._id);

		// Find orders containing these products
		const orders = await Order.find({ 'items.productId': { $in: productIds } })
			.sort({ createdAt: -1 })
			.populate('customerId', 'name phone location email')
			.populate('items.productId', 'name price unit farmerId');

		res.json(orders);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
});

// Update order status (farmer/admin can update)
router.patch('/:orderId', auth, async (req, res) => {
	try {
		const { orderId } = req.params;
		const { status } = req.body;

		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			return res.status(400).json({ message: 'Invalid order ID' });
		}

		if (!status) {
			return res.status(400).json({ message: 'Status is required' });
		}

		const order = await Order.findById(orderId).populate('items.productId', 'farmerId');

		if (!order) {
			return res.status(404).json({ message: 'Order not found' });
		}

		// Verify requester is allowed to update
		const requesterId = req.user.id;
		const ownsAny = order.items.some(item =>
			item.productId && String(item.productId.farmerId) === String(requesterId)
		);

		if (!ownsAny && req.user.role !== 'admin') {
			return res.status(403).json({ message: 'Forbidden' });
		}

		order.status = status;
		await order.save();

		// Return populated order
		const updatedOrder = await Order.findById(orderId)
			.populate('customerId', 'name phone location email')
			.populate('items.productId', 'name price unit farmerId');

		res.json(updatedOrder);
	} catch (err) {
		console.error('Order update error:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

export default router;
