import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  models: mongoose.Types.ObjectId[];
  type: 'cover' | 'screen-guard';
  material?: string;
  color?: string;
  price: number;
  images: string[];
  description?: string;
  stockQuantity: number;
  sku: string;
  
  // ✅ NEW: View count
  viewCount: number;
  
  // ✅ NEW: SEO fields
  seoTitle?: string; // Auto-generated if not provided
  seoDescription?: string;
  seoKeywords?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    models: [{ type: Schema.Types.ObjectId, ref: 'Model', required: true }],
    type: { 
      type: String, 
      required: true, 
      enum: ['cover', 'screen-guard'] 
    },
    material: { type: String },
    color: { type: String },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    description: { type: String },
    stockQuantity: { type: Number, required: true, default: 0, min: 0 },
    sku: { type: String, required: true, unique: true },
    
    // ✅ NEW: View count (default 0)
    viewCount: { type: Number, default: 0, min: 0 },
    
    // ✅ NEW: SEO fields
    seoTitle: { type: String, maxlength: 60 }, // Google optimal length
    seoDescription: { type: String, maxlength: 160 }, // Google optimal length
    seoKeywords: [{ type: String }],
  },
  { 
    timestamps: true,
  }
);

// Indexes
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ models: 1 });
ProductSchema.index({ type: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ stockQuantity: 1 });
ProductSchema.index({ viewCount: -1 }); // ✅ NEW: For sorting by popularity
ProductSchema.index({ createdAt: -1 });

// Text search index
ProductSchema.index({ 
  name: 'text', 
  description: 'text', 
  seoTitle: 'text',
  seoDescription: 'text',
  seoKeywords: 'text'
});

// ✅ Pre-save hook to auto-generate SEO title if not provided
ProductSchema.pre('save', async function(next) {
  if (!this.seoTitle && this.isNew) {
    try {
      // Populate models to get brand and model names
      await this.populate({
        path: 'models',
        select: 'name',
        populate: {
          path: 'brandId',
          select: 'name'
        }
      });

      const models = this.models as any[];
      if (models && models.length > 0) {
        // Get unique brand names
        const brandNames = [...new Set(
          models
            .map(m => m.brandId?.name)
            .filter(Boolean)
        )];
        
        // Get model names
        const modelNames = models.map(m => m.name).slice(0, 2); // First 2 models
        
        // Generate SEO title
        // Format: "Product Name - Brand Model | Type"
        const typeText = this.type === 'cover' ? 'Phone Cover' : 'Screen Guard';
        const brandText = brandNames.join(', ');
        const modelText = modelNames.join(', ');
        
        this.seoTitle = `${this.name} - ${brandText} ${modelText} | ${typeText}`;
        
        // Truncate if too long (max 60 chars for SEO)
        if (this.seoTitle.length > 60) {
          this.seoTitle = this.seoTitle.substring(0, 57) + '...';
        }
      }
    } catch (error) {
      console.error('Error generating SEO title:', error);
    }
  }
  
  // ✅ Auto-generate SEO description if not provided
  if (!this.seoDescription && this.isNew) {
    const typeText = this.type === 'cover' ? 'phone cover' : 'screen guard';
    const materialText = this.material ? ` made of ${this.material}` : '';
    const colorText = this.color ? ` in ${this.color} color` : '';
    
    this.seoDescription = `Buy ${this.name} ${typeText}${materialText}${colorText}. Price: ₹${this.price}. High quality mobile accessories.`;
    
    // Truncate if too long (max 160 chars for SEO)
    if (this.seoDescription.length > 160) {
      this.seoDescription = this.seoDescription.substring(0, 157) + '...';
    }
  }
  
  next();
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);