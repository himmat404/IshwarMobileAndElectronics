import mongoose, { Schema, Document } from 'mongoose';

export interface IModel extends Document {
  name: string;
  slug: string;
  brandId: mongoose.Types.ObjectId;
  image?: string;
  releaseYear?: number;
  specifications?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ModelSchema = new Schema<IModel>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    image: { type: String },
    releaseYear: { type: Number },
    specifications: { type: String },
  },
  { timestamps: true }
);

// Compound index for brand + model name uniqueness
ModelSchema.index({ brandId: 1, name: 1 }, { unique: true });
ModelSchema.index({ brandId: 1, slug: 1 }, { unique: true });

// Text index for search
ModelSchema.index({ name: 'text', specifications: 'text' });

export default mongoose.models.Model || mongoose.model<IModel>('Model', ModelSchema);