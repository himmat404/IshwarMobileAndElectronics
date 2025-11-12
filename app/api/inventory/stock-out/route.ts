import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { requireAdmin } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    
    await connectDB();
    
    const { productId, quantity, notes } = await request.json();
    
    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Valid product ID and quantity required' },
        { status: 400 }
      );
    }
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    if (product.stockQuantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      );
    }
    
    // Update stock
    product.stockQuantity -= quantity;
    await product.save();
    
    return NextResponse.json({
      message: 'Stock removed successfully',
      product: {
        id: product._id,
        name: product.name,
        sku: product.sku,
        previousStock: product.stockQuantity + quantity,
        newStock: product.stockQuantity,
        quantityRemoved: quantity,
      }
    });
  } catch (error) {
    console.error('Stock out error:', error);
    return NextResponse.json(
      { error: 'Failed to remove stock' },
      { status: 500 }
    );
  }
}