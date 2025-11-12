import mongoose, { Schema, Document } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    logo: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

// Text index for search
BrandSchema.index({ name: 'text', description: 'text' });

export default mongoose.models.Brand || mongoose.model<IBrand>('Brand', BrandSchema);