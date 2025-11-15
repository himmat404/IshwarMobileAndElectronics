import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
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
      // ✅ REMOVED: sku - SKU is now auto-generated and immutable
    } = data;
    
    const updateData: any = {};
    
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (models !== undefined) {
      if (!Array.isArray(models) || models.length === 0) {
        return NextResponse.json(
          { error: 'models must be a non-empty array' },
          { status: 400 }
        );
      }
      updateData.models = models;
    }
    if (type) updateData.type = type;
    if (material !== undefined) updateData.material = material;
    if (color !== undefined) updateData.color = color;
    if (price !== undefined) updateData.price = price;
    if (images !== undefined) updateData.images = images;
    if (description !== undefined) updateData.description = description;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    // ✅ SKU is NOT updated - it remains as originally auto-generated
    
    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
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
    
    return NextResponse.json({ product });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
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
    
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}