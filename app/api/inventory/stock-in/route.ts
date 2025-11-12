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
    
    // Update stock
    product.stockQuantity += quantity;
    await product.save();
    
    // TODO: Create inventory transaction log (optional enhancement)
    
    return NextResponse.json({
      message: 'Stock added successfully',
      product: {
        id: product._id,
        name: product.name,
        sku: product.sku,
        previousStock: product.stockQuantity - quantity,
        newStock: product.stockQuantity,
        quantityAdded: quantity,
      }
    });
  } catch (error) {
    console.error('Stock in error:', error);
    return NextResponse.json(
      { error: 'Failed to add stock' },
      { status: 500 }
    );
  }
}