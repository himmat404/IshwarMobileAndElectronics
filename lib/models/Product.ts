import mongoose, { Schema, Document } from 'mongoose';

export type ProductType = 'cover' | 'screen-guard';

export interface IProduct extends Document {
  name: string;
  slug: string;
  models: mongoose.Types.ObjectId[];
  type: ProductType;
  material?: string;
  color?: string;
  price: number;
  images: string[];
  description?: string;
  stockQuantity: number;
  sku: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    models: [{ type: Schema.Types.ObjectId, ref: 'Model', required: true }],
    type: { type: String, enum: ['cover', 'screen-guard'], required: true },
    material: { type: String },
    color: { type: String },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    description: { type: String },
    stockQuantity: { type: Number, default: 0, min: 0 },
    sku: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// Indexes
ProductSchema.index({ models: 1, type: 1 });
ProductSchema.index({ name: 'text', description: 'text', material: 'text' });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);