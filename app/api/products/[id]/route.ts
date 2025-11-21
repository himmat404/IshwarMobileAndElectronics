import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Model from '@/lib/models/Model';
import { requireAdmin } from '@/lib/middleware';

// GET - Single product (Public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    
    const product = await Product.findById(id)
      .populate({
        path: 'models',
        populate: {
          path: 'brandId',
          select: 'name logo'
        }
      });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT - Update product (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { id } = await params;
    await connectDB();
    
    const data = await request.json();
    const {
      name,
      models,
      type,
      material,
      color,
      price,
      images,
      description,
      stockQuantity,
      seoTitle, // ✅ NEW
      seoDescription, // ✅ NEW
      seoKeywords, // ✅ NEW
    } = data;
    
    // Check if product exists first
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    const updateData: any = {};
    
    // Enhanced validation
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return NextResponse.json(
          { error: 'Product name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = trimmedName;
      updateData.slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    
    if (models !== undefined) {
      if (!Array.isArray(models) || models.length === 0) {
        return NextResponse.json(
          { error: 'At least one compatible model is required' },
          { status: 400 }
        );
      }
      
      const validModels = await Model.find({ _id: { $in: models } }).select('_id');
      if (validModels.length !== models.length) {
        return NextResponse.json(
          { error: 'One or more invalid model IDs' },
          { status: 400 }
        );
      }
      
      updateData.models = models;
    }
    
    if (type !== undefined) {
      if (!['cover', 'screen-guard'].includes(type)) {
        return NextResponse.json(
          { error: 'Invalid product type' },
          { status: 400 }
        );
      }
      updateData.type = type;
    }
    
    if (material !== undefined) {
      updateData.material = material.trim();
    }
    
    if (color !== undefined) {
      updateData.color = color.trim();
    }
    
    if (price !== undefined) {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        return NextResponse.json(
          { error: 'Invalid price value' },
          { status: 400 }
        );
      }
      updateData.price = numPrice;
    }
    
    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return NextResponse.json(
          { error: 'Images must be an array' },
          { status: 400 }
        );
      }
      updateData.images = images;
    }
    
    if (description !== undefined) {
      updateData.description = description.trim();
    }
    
    if (stockQuantity !== undefined) {
      const numStock = parseInt(stockQuantity);
      if (isNaN(numStock) || numStock < 0) {
        return NextResponse.json(
          { error: 'Invalid stock quantity' },
          { status: 400 }
        );
      }
      updateData.stockQuantity = numStock;
    }
    
    // ✅ NEW: SEO fields
    if (seoTitle !== undefined) {
      const trimmed = seoTitle.trim();
      if (trimmed.length > 60) {
        return NextResponse.json(
          { error: 'SEO title must be 60 characters or less' },
          { status: 400 }
        );
      }
      updateData.seoTitle = trimmed || null; // Allow clearing
    }
    
    if (seoDescription !== undefined) {
      const trimmed = seoDescription.trim();
      if (trimmed.length > 160) {
        return NextResponse.json(
          { error: 'SEO description must be 160 characters or less' },
          { status: 400 }
        );
      }
      updateData.seoDescription = trimmed || null; // Allow clearing
    }
    
    if (seoKeywords !== undefined) {
      if (!Array.isArray(seoKeywords)) {
        return NextResponse.json(
          { error: 'SEO keywords must be an array' },
          { status: 400 }
        );
      }
      updateData.seoKeywords = seoKeywords.filter(k => k.trim());
    }
    
    // SKU is NOT updated - it remains as originally auto-generated
    
    // Update with proper error handling
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate({
      path: 'models',
      populate: {
        path: 'brandId',
        select: 'name logo'
      }
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      product,
      message: 'Product updated successfully'
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    
    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update product. Please try again.' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { id } = await params;
    await connectDB();
    
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Product deleted successfully',
      deletedProduct: product.name
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    
    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete product. Please try again.' },
      { status: 500 }
    );
  }
}