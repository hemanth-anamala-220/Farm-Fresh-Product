import express from 'express';
import ordersRouter from './routes/orders.js'; // new router

const app = express();

app.use(express.json());

// Mount the orders router so frontend calling POST /api/products/order hits this router
app.use('/api/products/order', ordersRouter);

export default app;