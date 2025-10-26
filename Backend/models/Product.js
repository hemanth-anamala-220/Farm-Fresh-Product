import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  unit: { type: String, default: "unit" },
  stock: { type: Number, default: 0 },
  imageUrl: { type: String },
  videoUrl: { type: String },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  buyersCount: { type: Number, default: 0 },
  buyers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  visible: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Product", productSchema);
